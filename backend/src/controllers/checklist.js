const prisma = require('../prisma')
const { log } = require('../utils/activity')

exports.getByEvent = async (req, res) => {
  try {
    const items = await prisma.checklistItem.findMany({ where: { eventId: Number(req.params.eventId) }, orderBy: { order: 'asc' } })
    res.json(items)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.create = async (req, res) => {
  try {
    const { title, eventId } = req.body
    if (!title) return res.status(400).json({ error: 'El título es requerido' })
    const event = await prisma.event.findUnique({ where: { id: Number(eventId) }, select: { name: true } })
    const count = await prisma.checklistItem.count({ where: { eventId: Number(eventId) } })
    const item = await prisma.checklistItem.create({ data: { title, eventId: Number(eventId), order: count } })
    log({ action: 'checklist', entity: 'checklist', entityId: item.id,
          label: `Tarea agregada al checklist: "${title}"`,
          detail: `Evento: ${event?.name || '—'}` })
    res.status(201).json(item)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.toggle = async (req, res) => {
  try {
    const item = await prisma.checklistItem.findUnique({ where: { id: Number(req.params.id) }, include: { event: { select: { name: true } } } })
    if (!item) return res.status(404).json({ error: 'Item no encontrado' })
    const updated = await prisma.checklistItem.update({ where: { id: Number(req.params.id) }, data: { done: !item.done } })
    log({ action: 'checklist', entity: 'checklist', entityId: item.id,
          label: `Tarea ${updated.done ? 'completada' : 'reabierta'}: "${item.title}"`,
          detail: `Evento: ${item.event?.name || '—'}` })
    res.json(updated)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.remove = async (req, res) => {
  try {
    const item = await prisma.checklistItem.findUnique({ where: { id: Number(req.params.id) }, include: { event: { select: { name: true } } } })
    await prisma.checklistItem.delete({ where: { id: Number(req.params.id) } })
    log({ action: 'delete', entity: 'checklist', entityId: Number(req.params.id),
          label: `Tarea eliminada del checklist: "${item?.title || '—'}"`,
          detail: `Evento: ${item?.event?.name || '—'}` })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
}