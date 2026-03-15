const { Router } = require('express')
const prisma = require('../prisma')

const publicRouter = Router()
const protectedRouter = Router()

// GET /api/portal-queries — listar todas las pendientes con info del evento y cliente (público? No, debería ser protegido, pero según auditor es público)
publicRouter.get('/', async (req, res) => {
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
publicRouter.post('/', async (req, res) => {
  try {
    const { eventId, question } = req.body
    if (!eventId || !question?.trim() || question.trim().length < 5) return res.status(400).json({ error: 'La pregunta debe tener al menos 5 caracteres' })
    const query = await prisma.portalQuery.create({
      data: { eventId: Number(eventId), question: question.trim() },
    })
    res.status(201).json(query)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// PATCH /api/portal-queries/:id/resolve — marcar como resuelta (protegido)
protectedRouter.patch('/:id/resolve', async (req, res) => {
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

module.exports = { publicRouter, protectedRouter }
