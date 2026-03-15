const prisma = require('../prisma')

exports.getByEvent = async (req, res) => {
  try {
    const items = await prisma.cateringItem.findMany({
      where:   { eventId: Number(req.params.eventId) },
      include: { proveedor: { select: { id: true, name: true, alias: true } } },
      orderBy: { createdAt: 'asc' },
    })
    res.json(items)
  } catch (e) {
    console.error('Error getByEvent catering:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { eventId, categoria, descripcion, cantidad, unidad, precioUnitario, proveedorId, proveedorLibre, nota } = req.body
    if (!eventId)     return res.status(400).json({ error: 'El evento es requerido' })
    if (!categoria)   return res.status(400).json({ error: 'La categoría es requerida' })
    if (!descripcion) return res.status(400).json({ error: 'La descripción es requerida' })
    if (!cantidad || Number(cantidad) <= 0) return res.status(400).json({ error: 'La cantidad debe ser mayor a 0' })
    if (precioUnitario !== undefined && Number(precioUnitario) < 0) return res.status(400).json({ error: 'El precio unitario no puede ser negativo' })

    const item = await prisma.cateringItem.create({
      data: {
        eventId:        Number(eventId),
        categoria,
        descripcion,
        cantidad:       Number(cantidad),
        unidad:         unidad || 'unidad',
        precioUnitario: Number(precioUnitario) || 0,
        proveedorId:    proveedorId ? Number(proveedorId) : null,
        proveedorLibre: proveedorId ? null : (proveedorLibre || null),
        nota:           nota || null,
      },
      include: { proveedor: { select: { id: true, name: true, alias: true } } },
    })
    res.status(201).json(item)
  } catch (e) {
    console.error('Error create catering:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { categoria, descripcion, cantidad, unidad, precioUnitario, proveedorId, proveedorLibre, nota } = req.body
    if (precioUnitario !== undefined && Number(precioUnitario) < 0) return res.status(400).json({ error: 'El precio unitario no puede ser negativo' })
    const item = await prisma.cateringItem.update({
      where: { id: Number(req.params.id) },
      data: {
        categoria,
        descripcion,
        cantidad:       Number(cantidad),
        unidad,
        precioUnitario: Number(precioUnitario) || 0,
        proveedorId:    proveedorId ? Number(proveedorId) : null,
        proveedorLibre: proveedorId ? null : (proveedorLibre || null),
        nota:           nota || null,
      },
      include: { proveedor: { select: { id: true, name: true, alias: true } } },
    })
    res.json(item)
  } catch (e) {
    console.error('Error update catering:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.cateringItem.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete catering:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'No encontrado' })
    res.status(500).json({ error: e.message })
  }
}