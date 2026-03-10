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

module.exports = router
