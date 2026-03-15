const { Router } = require('express')
const { randomUUID } = require('crypto')
const prisma = require('../prisma')

const publicRouter = Router()
const protectedRouter = Router()

const SECCION_ORDER = ['Entrada', 'Plato principal', 'Guarnición', 'Bebidas', 'Postre', 'Trasnoche', 'Otros']

// GET /api/guest-portal/:token — datos públicos del portal de invitados
publicRouter.get('/guest-portal/:token', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { guestPortalToken: req.params.token },
      include: {
        client: { select: { name: true } },
        quotes: {
          where: { kind: 'Catering', clientStatus: 'Aprobado' },
          include: {
            menus: {
              include: {
                menu: {
                  include: {
                    sections: {
                      orderBy: { orden: 'asc' },
                      include: {
                        items: {
                          include: { dish: { select: { name: true, descripcion: true } } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!event) return res.status(404).json({ error: 'Portal no encontrado' })

    const allSections = event.quotes
      .flatMap(q => q.menus || [])
      .flatMap(qm => qm.menu?.sections || [])

    // Deduplicar secciones por nombre y ordenar
    const seen = new Set()
    const menuSections = allSections
      .filter(s => { if (seen.has(s.nombre)) return false; seen.add(s.nombre); return true })
      .sort((a, b) => {
        const ia = SECCION_ORDER.indexOf(a.nombre)
        const ib = SECCION_ORDER.indexOf(b.nombre)
        if (ia === -1 && ib === -1) return 0
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      })

    res.json({
      event: {
        name: event.name,
        clientName: event.client?.name ?? null,
        date: event.date,
        time: event.time,
        venue: event.venue,
        type: event.type,
        ticketPrice: event.ticketPrice ?? null,
        dietaryOptions: event.dietaryOptions ?? null,
      },
      menuSections,
    })
  } catch (e) {
    console.error('GUEST PORTAL ERROR:', e)
    res.status(500).json({ error: e.message })
  }
})

// POST /api/guest-portal/:token/rsvp — confirmar asistencia para una o más personas (público)
publicRouter.post('/guest-portal/:token/rsvp', async (req, res) => {
  try {
    const { guests } = req.body
    if (!Array.isArray(guests) || guests.length === 0)
      return res.status(400).json({ error: 'Se requiere al menos un invitado' })
    if (guests.some(g => !g.name?.trim()))
      return res.status(400).json({ error: 'Todos los invitados deben tener nombre' })

    const event = await prisma.event.findUnique({
      where: { guestPortalToken: req.params.token },
      select: { id: true }
    })
    if (!event) return res.status(404).json({ error: 'Portal no encontrado' })

    await prisma.eventGuest.createMany({
      data: guests.map(g => ({
        eventId: event.id,
        name: g.name.trim(),
        tipo: g.tipo === 'Menor' ? 'Menor' : 'Mayor',
        confirmed: true,
      }))
    })

    res.json({ ok: true, count: guests.length })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/events/:id/guest-portal-token — generar/regenerar token (protegido)
protectedRouter.post('/events/:id/guest-portal-token', async (req, res) => {
  try {
    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: { guestPortalToken: randomUUID() },
      select: { guestPortalToken: true },
    })
    res.json({ guestPortalToken: event.guestPortalToken })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Evento no encontrado' })
    res.status(500).json({ error: e.message })
  }
})

module.exports = { publicRouter, protectedRouter }
