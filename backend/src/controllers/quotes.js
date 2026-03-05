const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        event: { select: { id: true, name: true, client: { select: { name: true } } } }
      }
    })
    res.json(quotes)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const quote = await prisma.quote.findUnique({
      where: { id: Number(req.params.id) },
      include: { items: true, event: { include: { client: true } } }
    })
    if (!quote) return res.status(404).json({ error: 'Cotización no encontrada' })
    res.json(quote)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { eventId, kind = 'General', items, date, status,
            menu, covers, pricePerCover } = req.body

    if (!eventId) return res.status(400).json({ error: 'El evento es requerido' })

    if (kind === 'General') {
      if (!items || items.length === 0)
        return res.status(400).json({ error: 'Debe agregar al menos un ítem' })
      if (items.some(i => !i.description?.trim()))
        return res.status(400).json({ error: 'Todos los ítems deben tener descripción' })
    }

    if (kind === 'Catering') {
      if (!covers || Number(covers) <= 0)
        return res.status(400).json({ error: 'La cantidad de cubiertos es requerida' })
      if (!pricePerCover || Number(pricePerCover) <= 0)
        return res.status(400).json({ error: 'El precio por cubierto es requerido' })
    }

    const quote = await prisma.quote.create({
      data: {
        kind,
        status: status || 'Pendiente',
        date: date ? new Date(date) : new Date(),
        event: { connect: { id: Number(eventId) } },
        menu:          kind === 'Catering' ? (menu?.trim() || null) : null,
        covers:        kind === 'Catering' ? Number(covers)         : null,
        pricePerCover: kind === 'Catering' ? Number(pricePerCover)  : null,
        items: {
          create: (items || []).map(({ description, quantity, unitPrice }) => ({
            description: description.trim(),
            quantity:    Number(quantity),
            unitPrice:   Number(unitPrice),
          }))
        }
      },
      include: { items: true }
    })
    res.status(201).json(quote)
  } catch (e) {
    console.error('Error al crear cotización:', e)
    if (e.code === 'P2025') return res.status(400).json({ error: 'El evento seleccionado no existe' })
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { eventId, kind = 'General', items, date, status,
            menu, covers, pricePerCover } = req.body

    if (!eventId) return res.status(400).json({ error: 'El evento es requerido' })

    if (kind === 'General') {
      if (!items || items.length === 0)
        return res.status(400).json({ error: 'Debe agregar al menos un ítem' })
      if (items.some(i => !i.description?.trim()))
        return res.status(400).json({ error: 'Todos los ítems deben tener descripción' })
    }

    if (kind === 'Catering') {
      if (!covers || Number(covers) <= 0)
        return res.status(400).json({ error: 'La cantidad de cubiertos es requerida' })
      if (!pricePerCover || Number(pricePerCover) <= 0)
        return res.status(400).json({ error: 'El precio por cubierto es requerido' })
    }

    await prisma.quoteItem.deleteMany({ where: { quoteId: Number(req.params.id) } })

    const quote = await prisma.quote.update({
      where: { id: Number(req.params.id) },
      data: {
        kind,
        status: status || 'Pendiente',
        date: date ? new Date(date) : new Date(),
        event: { connect: { id: Number(eventId) } },
        menu:          kind === 'Catering' ? (menu?.trim() || null) : null,
        covers:        kind === 'Catering' ? Number(covers)         : null,
        pricePerCover: kind === 'Catering' ? Number(pricePerCover)  : null,
        items: {
          create: (items || []).map(({ description, quantity, unitPrice }) => ({
            description: description.trim(),
            quantity:    Number(quantity),
            unitPrice:   Number(unitPrice),
          }))
        }
      },
      include: { items: true }
    })
    res.json(quote)
  } catch (e) {
    console.error('Error al actualizar cotización:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.quote.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cotización no encontrada' })
    res.status(500).json({ error: e.message })
  }
}
