const evolution = require('../services/evolution')
const templates = require('../services/templates')
const cron      = require('../services/cron')
const prisma    = require('../prisma')

// ── Estado de la instancia ────────────────────────────────────────────────────

exports.getStatus = async (req, res) => {
  try {
    const status = await evolution.getInstanceStatus()
    res.json({ ok: true, status })
  } catch (e) {
    // Si la instancia no existe todavía, devolvemos disconnected sin tirar error
    res.json({ ok: false, status: { state: 'disconnected' }, error: e.message })
  }
}

exports.getQR = async (req, res) => {
  try {
    const data = await evolution.getQRCode()
    res.json({ ok: true, data })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
}

exports.createInstance = async (req, res) => {
  try {
    const data = await evolution.createInstance()
    res.json({ ok: true, data })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
}

// ── Plantillas ────────────────────────────────────────────────────────────────

exports.getTemplates = (req, res) => {
  res.json(templates.getAll())
}

exports.updateTemplate = (req, res) => {
  const { id } = req.params
  const { name, text, active } = req.body
  try {
    const updated = templates.save(id, { name, text, active })
    res.json(updated)
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}

// ── Envío manual desde un evento ─────────────────────────────────────────────

exports.sendToEvent = async (req, res) => {
  const { eventId } = req.params
  const { templateId, customText } = req.body

  try {
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) },
      include: { client: true },
    })
    if (!event)        return res.status(404).json({ error: 'Evento no encontrado' })
    if (!event.client?.phone) return res.status(400).json({ error: 'El cliente no tiene teléfono cargado' })

    let text
    if (customText?.trim()) {
      text = customText.trim()
    } else {
      text = templates.render(templateId, {
        nombre: event.client.name,
        evento: event.name,
        lugar:  event.venue,
        fecha:  new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
      })
    }

    await evolution.sendText(event.client.phone, text)
    res.json({ ok: true, to: event.client.phone, text })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
}

// ── Envío manual a un cliente ─────────────────────────────────────────────────

exports.sendToClient = async (req, res) => {
  const { clientId } = req.params
  const { templateId, customText } = req.body

  try {
    const client = await prisma.client.findUnique({ where: { id: Number(clientId) } })
    if (!client)       return res.status(404).json({ error: 'Cliente no encontrado' })
    if (!client.phone) return res.status(400).json({ error: 'El cliente no tiene teléfono cargado' })

    const text = customText?.trim()
      ? customText.trim()
      : templates.render(templateId, { nombre: client.name })

    await evolution.sendText(client.phone, text)
    res.json({ ok: true, to: client.phone, text })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
}

// ── Preview de una plantilla renderizada ─────────────────────────────────────

exports.previewTemplate = async (req, res) => {
  const { templateId, eventId } = req.query
  try {
    let vars = { nombre: 'Juan García', evento: 'Casamiento García', lugar: 'Salón El Palacio', fecha: '15 de agosto de 2025' }

    if (eventId) {
      const event = await prisma.event.findUnique({
        where: { id: Number(eventId) },
        include: { client: true },
      })
      if (event) vars = {
        nombre: event.client?.name || vars.nombre,
        evento: event.name,
        lugar:  event.venue,
        fecha:  new Date(event.date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }),
      }
    }

    const text = templates.render(templateId, vars)
    res.json({ text, vars })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
}

// ── Trigger manual de cron jobs (para testear) ────────────────────────────────

exports.triggerJob = async (req, res) => {
  const { jobId } = req.params
  try {
    await cron.runJobManual(jobId)
    res.json({ ok: true, message: `Job "${jobId}" ejecutado` })
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message })
  }
}
