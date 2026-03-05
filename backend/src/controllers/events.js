const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: { client: { select: { id: true, name: true } } }
    })
    res.json(events)
  } catch (e) {
    console.error('Error getAll events:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: Number(req.params.id) },
      include: { client: true, quotes: { include: { items: true } } }
    })
    if (!event) return res.status(404).json({ error: 'Evento no encontrado' })
    res.json(event)
  } catch (e) {
    console.error('Error getOne event:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, clientId, date, venue, type, status, guests, budget } = req.body
    const event = await prisma.event.create({
      data: {
        name, venue, type, status,
        guests:  Number(guests),
        budget:  Number(budget),
        date:    new Date(date),
        client:  { connect: { id: Number(clientId) } }
      }
    })
    res.status(201).json(event)
  } catch (e) {
    console.error('Error create event:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, clientId, date, venue, type, status, guests, budget } = req.body
    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: {
        name, venue, type, status,
        guests:  Number(guests),
        budget:  Number(budget),
        date:    new Date(date),
        client:  { connect: { id: Number(clientId) } }
      }
    })
    res.json(event)
  } catch (e) {
    console.error('Error update event:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete event:', e)
    res.status(500).json({ error: e.message })
  }
}