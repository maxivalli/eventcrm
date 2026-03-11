const { Router } = require('express')
const { randomUUID } = require('crypto')
const prisma = require('../prisma')

const publicRouter = Router()
const protectedRouter = Router()

// ── Rutas públicas (portal del portero, sin auth) ──────────────────────────

// GET /api/checkin/:token — datos del evento + lista de invitados
publicRouter.get('/checkin/:token', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { checkinToken: req.params.token },
      select: { id: true, name: true, date: true, time: true, venue: true, guests: true },
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

module.exports = { publicRouter, protectedRouter }
