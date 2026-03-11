const router = require('express').Router()
const prisma  = require('../prisma')

// GET /api/activity?limit=50
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
    res.json(logs)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/activity/portal-guests — listas de invitados enviadas desde el portal no leídas
router.get('/portal-guests', async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const logs = await prisma.activityLog.findMany({
      where: { action: 'portal_guests', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(logs)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// GET /api/activity/client-decisions — decisiones del cliente no leídas
router.get('/client-decisions', async (req, res) => {
  try {
    const since = req.query.since ? new Date(req.query.since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const logs = await prisma.activityLog.findMany({
      where: { action: 'client_decision', createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(logs)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

module.exports = router