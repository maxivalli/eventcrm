const prisma = require('../prisma')

// GET /api/schedule/event/:eventId
exports.getByEvent = async (req, res) => {
  try {
    const items = await prisma.scheduleItem.findMany({
      where: { eventId: Number(req.params.eventId) },
      orderBy: { orden: 'asc' },
    })
    res.json(items)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

// POST /api/schedule/event/:eventId  — reemplaza todo el cronograma del evento
exports.saveByEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.eventId)
    const { items } = req.body   // array de { hora, titulo, descripcion, categoria }

    if (!Array.isArray(items)) return res.status(400).json({ error: 'items debe ser un array' })

    // Eliminar existentes y reemplazar en una transacción
    await prisma.$transaction([
      prisma.scheduleItem.deleteMany({ where: { eventId } }),
      prisma.scheduleItem.createMany({
        data: items.map((item, idx) => ({
          eventId,
          hora:        item.hora        || '',
          titulo:      item.titulo      || '',
          descripcion: item.descripcion || null,
          categoria:   item.categoria   || 'Protocolo',
          orden:       idx,
        })),
      }),
    ])

    const saved = await prisma.scheduleItem.findMany({
      where: { eventId },
      orderBy: { orden: 'asc' },
    })
    res.json(saved)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

// DELETE /api/schedule/event/:eventId  — borra todo el cronograma
exports.deleteByEvent = async (req, res) => {
  try {
    await prisma.scheduleItem.deleteMany({ where: { eventId: Number(req.params.eventId) } })
    res.json({ success: true })
  } catch (e) { res.status(500).json({ error: e.message }) }
}
