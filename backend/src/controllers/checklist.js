const prisma = require('../prisma')

exports.getByEvent = async (req, res) => {
  try {
    const items = await prisma.checklistItem.findMany({
      where:   { eventId: Number(req.params.eventId) },
      orderBy: { order: 'asc' },
    })
    res.json(items)
  } catch (e) {
    console.error('Error getByEvent checklist:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { title, eventId } = req.body
    if (!title) return res.status(400).json({ error: 'El título es requerido' })
    const count = await prisma.checklistItem.count({ where: { eventId: Number(eventId) } })
    const item = await prisma.checklistItem.create({
      data: { title, eventId: Number(eventId), order: count }
    })
    res.status(201).json(item)
  } catch (e) {
    console.error('Error create checklist:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.toggle = async (req, res) => {
  try {
    const item = await prisma.checklistItem.findUnique({ where: { id: Number(req.params.id) } })
    if (!item) return res.status(404).json({ error: 'Item no encontrado' })
    const updated = await prisma.checklistItem.update({
      where: { id: Number(req.params.id) },
      data:  { done: !item.done }
    })
    res.json(updated)
  } catch (e) {
    console.error('Error toggle checklist:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.checklistItem.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete checklist:', e)
    res.status(500).json({ error: e.message })
  }
}