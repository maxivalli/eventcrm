const { Router } = require('express')
const prisma = require('../prisma')

const router = Router()

// GET /api/public/eventos — próximos 4 eventos confirmados (sin datos sensibles)
router.get('/eventos', async (req, res) => {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const eventos = await prisma.event.findMany({
      where: {
        status: 'Confirmado',
        date: { gte: hoy }
      },
      orderBy: { date: 'asc' },
      take: 4,
      select: {
        id: true,
        name: true,
        date: true,
        time: true,
        type: true,
        venue: true,
        guests: true
      }
    })

    res.json(eventos)
  } catch (e) {
    console.error('Error landing/eventos:', e)
    res.status(500).json({ error: e.message })
  }
})

module.exports = router
