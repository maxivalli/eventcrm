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
    const { eventId, items, date, ...rest } = req.body
    const quote = await prisma.quote.create({
      data: {
        ...rest,
        date: date ? new Date(date) : new Date(),
        event: { connect: { id: Number(eventId) } },
        items: {
          create: items.map(({ description, quantity, unitPrice }) => ({
            description,
            quantity:  Number(quantity),
            unitPrice: Number(unitPrice),
          }))
        }
      },
      include: { items: true }
    })
    res.status(201).json(quote)
  } catch (e) {
    console.error('Error al crear cotización:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { eventId, items, date, ...rest } = req.body
    await prisma.quoteItem.deleteMany({ where: { quoteId: Number(req.params.id) } })
    const quote = await prisma.quote.update({
      where: { id: Number(req.params.id) },
      data: {
        ...rest,
        date: date ? new Date(date) : new Date(),
        event: { connect: { id: Number(eventId) } },
        items: {
          create: items.map(({ description, quantity, unitPrice }) => ({
            description,
            quantity:  Number(quantity),
            unitPrice: Number(unitPrice),
          }))
        }
      },
      include: { items: true }
    })
    res.json(quote)
  } catch (e) {
    console.error('Error al actualizar cotización:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.quoteItem.deleteMany({ where: { quoteId: Number(req.params.id) } })
    await prisma.quote.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}