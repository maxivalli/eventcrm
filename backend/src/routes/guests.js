const { Router } = require('express')
const { randomUUID } = require('crypto')
const multer = require('multer')
const mammoth = require('mammoth')
const pdfParse = require('pdf-parse')
const prisma = require('../prisma')
const cloudinary = require('../cloudinary')
const { log } = require('../utils/activity')

// Multer en memoria para extracción de texto (no sube a Cloudinary)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

function uploadBufferToCloudinary(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
    stream.end(buffer)
  })
}

// Extrae nombres y tipo (Mayor/Menor) de texto plano línea por línea
function parseGuestsFromText(text) {
  const MENOR_RE = /\bmen[oa]r\b/i
  return text
    .split(/\r?\n/)
    .map(line => {
      // Quitar numeración, bullets, guiones al inicio: "1.", "-", "*", "•"
      let raw = line.replace(/^[\s\d\.\-\*\•\)]+/, '').trim()
      if (!raw || raw.length < 2) return null
      const tipo = MENOR_RE.test(raw) ? 'Menor' : 'Mayor'
      // Eliminar la palabra "menor/menora" y caracteres sobrantes (paréntesis, comas, guiones)
      const name = raw
        .replace(MENOR_RE, '')
        .replace(/[\(\)\[\],\-–—]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim()
      if (!name || name.length < 2) return null
      return { name, tipo }
    })
    .filter(Boolean)
}

const publicRouter = Router()
const protectedRouter = Router()

// ── Rutas públicas (portal del portero + portal del cliente, sin auth) ────

// POST /api/portal/:token/guests/parse — parsea archivo desde el portal del cliente (sin guardar)
publicRouter.post('/portal/:token/guests/parse', upload.single('file'), async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { portalToken: req.params.token },
    select: { id: true },
  })
  if (!event) return res.status(404).json({ error: 'Token inválido' })
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' })

  const { mimetype, buffer, originalname } = req.file
  const ext = originalname.split('.').pop().toLowerCase()

  try {
    let text = ''
    if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (ext === 'pdf' || mimetype === 'application/pdf') {
      const result = await pdfParse(buffer)
      text = result.text
    } else {
      return res.status(400).json({ error: 'Solo se aceptan archivos .docx o .pdf' })
    }

    const guests = parseGuestsFromText(text)
    if (guests.length === 0) return res.status(422).json({ error: 'No se encontraron nombres en el archivo' })
    res.json({ guests })
  } catch (e) {
    console.error('PARSE ERROR:', e)
    res.status(500).json({ error: 'No se pudo leer el archivo', detail: e.message })
  }
})

// GET /api/portal/:token/guests — lista de invitados del evento (para mostrar en portal)
publicRouter.get('/portal/:token/guests', async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { portalToken: req.params.token },
    select: { id: true, name: true },
  })
  if (!event) return res.status(404).json({ error: 'Token inválido' })

  try {
    const all = await prisma.eventGuest.findMany({
      where: { eventId: event.id },
      orderBy: { name: 'asc' },
    })
    res.json({
      guests:    all,
      confirmed: all.filter(g => g.confirmed),
      manual:    all.filter(g => !g.confirmed),
    })
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener invitados' })
  }
})

// POST /api/portal/:token/guests/paid-list — sube archivo de invitados que pagaron a Cloudinary
publicRouter.post('/portal/:token/guests/paid-list', upload.single('file'), async (req, res) => {
  const event = await prisma.event.findUnique({
    where: { portalToken: req.params.token },
    select: { id: true, name: true },
  })
  if (!event) return res.status(404).json({ error: 'Token inválido' })
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' })

  const { mimetype, buffer, originalname } = req.file
  const ext = originalname.split('.').pop().toLowerCase()

  try {
    let text = ''
    if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (ext === 'pdf' || mimetype === 'application/pdf') {
      const result = await pdfParse(buffer)
      text = result.text
    } else {
      return res.status(400).json({ error: 'Solo se aceptan archivos .docx o .pdf' })
    }

    const count = parseGuestsFromText(text).length

    // Subir archivo a Cloudinary
    const uploaded = await uploadBufferToCloudinary(buffer, {
      folder: 'paid-guest-lists',
      resource_type: 'raw',
      public_id: `event-${event.id}-paid-list`,
      overwrite: true,
    })

    await prisma.event.update({
      where: { id: event.id },
      data: {
        paidGuestListUrl:   uploaded.secure_url,
        paidGuestListName:  originalname,
        paidGuestListCount: count,
      },
    })

    log({ action: 'paid_guest_list', entity: 'event', entityId: event.id, label: event.name, detail: `Lista de pagados cargada: ${originalname} (${count} personas)` })
    res.json({ url: uploaded.secure_url, name: originalname, count })
  } catch (e) {
    console.error('PAID LIST ERROR:', e)
    res.status(500).json({ error: 'No se pudo procesar el archivo' })
  }
})

// POST /api/portal/:token/guests/confirm — guarda lista (reemplaza todo)
publicRouter.post('/portal/:token/guests/confirm', async (req, res) => {
  const { guests } = req.body
  if (!Array.isArray(guests) || guests.length === 0)
    return res.status(400).json({ error: 'Lista de invitados requerida' })

  const event = await prisma.event.findUnique({
    where: { portalToken: req.params.token },
    select: { id: true, name: true },
  })
  if (!event) return res.status(404).json({ error: 'Token inválido' })

  try {
    // Solo borrar los manuales — los confirmados via portal se preservan
    await prisma.eventGuest.deleteMany({ where: { eventId: event.id, confirmed: false } })
    await prisma.eventGuest.createMany({
      data: guests.map(g => ({
        eventId: event.id,
        name: g.name.trim(),
        tipo: g.tipo || 'Mayor',
        confirmed: false,
      })),
    })
    log({ action: 'portal_guests', entity: 'event', entityId: event.id, label: event.name, detail: `${guests.length} invitados enviados desde el portal` })
    res.json({ ok: true, count: guests.length })
  } catch (e) {
    res.status(500).json({ error: 'Error al guardar la lista' })
  }
})

// GET /api/checkin/:token — datos del evento + lista de invitados
publicRouter.get('/checkin/:token', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { checkinToken: req.params.token },
      select: { id: true, name: true, date: true, time: true, venue: true, guests: true, ticketPrice: true, paidGuestListUrl: true, paidGuestListName: true, paidGuestListCount: true },
    })
    if (!event) return res.status(404).json({ error: 'Token inválido' })

    const guests = await prisma.eventGuest.findMany({
      where: { eventId: event.id },
      orderBy: { name: 'asc' },
    })
    res.json({ event, guests })
  } catch (e) {
    res.status(500).json({ error: 'Error al cargar el evento' })
  }
})

// PATCH /api/checkin/:token/guests/:id/pagado — marcar pago en puerta (solo una vez, sin desmarcar)
publicRouter.patch('/checkin/:token/guests/:id/pagado', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { checkinToken: req.params.token },
      select: { id: true },
    })
    if (!event) return res.status(404).json({ error: 'Token inválido' })

    const guest = await prisma.eventGuest.findUnique({ where: { id: Number(req.params.id) } })
    if (!guest || guest.eventId !== event.id) return res.status(404).json({ error: 'Invitado no encontrado' })
    if (guest.pagado) return res.status(400).json({ error: 'Pago registrado desde el CRM, no editable' })

    const updated = await prisma.eventGuest.update({
      where: { id: guest.id },
      data: { pagadoEnPuerta: !guest.pagadoEnPuerta },
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar pago' })
  }
})

// PATCH /api/checkin/:token/guests/:id/ingreso — marcar/desmarcar ingreso
publicRouter.patch('/checkin/:token/guests/:id/ingreso', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { checkinToken: req.params.token },
      select: { id: true },
    })
    if (!event) return res.status(404).json({ error: 'Token inválido' })

    const guest = await prisma.eventGuest.findUnique({ where: { id: Number(req.params.id) } })
    if (!guest || guest.eventId !== event.id) return res.status(404).json({ error: 'Invitado no encontrado' })

    const updated = await prisma.eventGuest.update({
      where: { id: guest.id },
      data: { ingreso: !guest.ingreso },
    })
    res.json(updated)
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar ingreso' })
  }
})

// DELETE /api/portal/:token/guests/:id — elimina un invitado (confirmado o manual) desde el portal del cliente
publicRouter.delete('/portal/:token/guests/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { portalToken: req.params.token },
      select: { id: true },
    })
    if (!event) return res.status(404).json({ error: 'Token inválido' })
    const guest = await prisma.eventGuest.findUnique({ where: { id: Number(req.params.id) } })
    if (!guest || guest.eventId !== event.id) return res.status(404).json({ error: 'Invitado no encontrado' })
    await prisma.eventGuest.delete({ where: { id: guest.id } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar invitado' })
  }
})

// ── Rutas protegidas (gestión interna) ────────────────────────────────────

// GET /api/event-guests?eventId=X
protectedRouter.get('/event-guests', async (req, res) => {
  const { eventId } = req.query
  if (!eventId) return res.status(400).json({ error: 'eventId requerido' })
  try {
    const guests = await prisma.eventGuest.findMany({
      where: { eventId: Number(eventId) },
      orderBy: { name: 'asc' },
    })
    res.json(guests)
  } catch (e) {
    res.status(500).json({ error: 'Error al obtener invitados' })
  }
})

// POST /api/event-guests
protectedRouter.post('/event-guests', async (req, res) => {
  const { eventId, name, tipo } = req.body
  if (!eventId || !name?.trim()) return res.status(400).json({ error: 'eventId y name son requeridos' })
  try {
    const guest = await prisma.eventGuest.create({
      data: { eventId: Number(eventId), name: name.trim(), tipo: tipo || 'Mayor' },
    })
    res.json(guest)
  } catch (e) {
    res.status(500).json({ error: 'Error al crear invitado' })
  }
})

// PUT /api/event-guests/:id
protectedRouter.put('/event-guests/:id', async (req, res) => {
  const { name, tipo, pagado } = req.body
  try {
    const guest = await prisma.eventGuest.update({
      where: { id: Number(req.params.id) },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(tipo !== undefined && { tipo }),
        ...(pagado !== undefined && { pagado }),
      },
    })
    res.json(guest)
  } catch (e) {
    res.status(500).json({ error: 'Error al actualizar invitado' })
  }
})

// DELETE /api/event-guests/:id
protectedRouter.delete('/event-guests/:id', async (req, res) => {
  try {
    await prisma.eventGuest.delete({ where: { id: Number(req.params.id) } })
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: 'Error al eliminar invitado' })
  }
})

// POST /api/events/:id/checkin-token — generar/regenerar token de check-in
protectedRouter.post('/events/:id/checkin-token', async (req, res) => {
  try {
    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: { checkinToken: randomUUID() },
      select: { checkinToken: true },
    })
    res.json(event)
  } catch (e) {
    res.status(500).json({ error: 'Error al generar token' })
  }
})

// POST /api/event-guests/parse — extrae nombres de .docx o .pdf (sin guardar)
protectedRouter.post('/event-guests/parse', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Archivo requerido' })

  const { mimetype, buffer, originalname } = req.file
  const ext = originalname.split('.').pop().toLowerCase()

  try {
    let text = ''

    if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (ext === 'pdf' || mimetype === 'application/pdf') {
      const result = await pdfParse(buffer)
      text = result.text
    } else {
      return res.status(400).json({ error: 'Solo se aceptan archivos .docx o .pdf' })
    }

    const guests = parseGuestsFromText(text)
    if (guests.length === 0) return res.status(422).json({ error: 'No se encontraron nombres en el archivo' })

    res.json({ guests })
  } catch (e) {
    res.status(500).json({ error: 'No se pudo leer el archivo' })
  }
})

// POST /api/event-guests/bulk — inserta múltiples invitados de una vez
protectedRouter.post('/event-guests/bulk', async (req, res) => {
  const { eventId, guests } = req.body
  if (!eventId || !Array.isArray(guests) || guests.length === 0)
    return res.status(400).json({ error: 'eventId y guests[] son requeridos' })

  try {
    await prisma.eventGuest.createMany({
      data: guests.map(g => ({
        eventId: Number(eventId),
        name: g.name.trim(),
        tipo: g.tipo || 'Mayor',
      })),
      skipDuplicates: false,
    })
    const all = await prisma.eventGuest.findMany({
      where: { eventId: Number(eventId) },
      orderBy: { name: 'asc' },
    })
    res.json(all)
  } catch (e) {
    res.status(500).json({ error: 'Error al importar invitados' })
  }
})

module.exports = { publicRouter, protectedRouter }
