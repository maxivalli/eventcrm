const router = require('express').Router()
const prisma = require('../prisma')

// GET /api/portal-queries — listar todas las pendientes con info del evento y cliente
router.get('/', async (req, res) => {
  try {
    const queries = await prisma.portalQuery.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            client: { select: { name: true, phone: true } },
          },
        },
      },
    })
    res.json(queries)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// POST /api/portal-queries — guardar nueva consulta (público, desde el portal)
router.post('/', async (req, res) => {
  try {
    const { eventId, question } = req.body
    if (!eventId || !question) return res.status(400).json({ error: 'Faltan datos' })
    const query = await prisma.portalQuery.create({
      data: { eventId: Number(eventId), question },
    })
    res.status(201).json(query)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/portal-queries/:id/resolve — marcar como resuelta
router.patch('/:id/resolve', async (req, res) => {
  try {
    const query = await prisma.portalQuery.update({
      where: { id: Number(req.params.id) },
      data: { status: 'resolved' },
    })
    res.json(query)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
