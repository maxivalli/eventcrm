const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: {
        client: { select: { id: true, name: true } },
        _count: { select: { files: true } }
      }
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
    const { name, clientId, date, time, venue, type, status, guests, budget } = req.body

    if (!name?.trim())   return res.status(400).json({ error: 'El nombre es requerido' })
    if (!clientId)       return res.status(400).json({ error: 'El cliente es requerido' })
    if (!date)           return res.status(400).json({ error: 'La fecha es requerida' })
    if (!venue?.trim())  return res.status(400).json({ error: 'El venue es requerido' })
    if (!guests || Number(guests) <= 0) return res.status(400).json({ error: 'Los invitados deben ser mayor a 0' })
    if (!budget || Number(budget) <= 0) return res.status(400).json({ error: 'El presupuesto debe ser mayor a 0' })

    const event = await prisma.event.create({
      data: {
        name: name.trim(), venue: venue.trim(), type, status,
        guests: Number(guests),
        budget: Number(budget),
        date:   new Date(`${date.slice(0,10)}T12:00:00`),
        time:   time || null,
        client: { connect: { id: Number(clientId) } }
      }
    })
    res.status(201).json(event)
  } catch (e) {
    console.error('Error create event:', e)
    if (e.code === 'P2025') return res.status(400).json({ error: 'El cliente seleccionado no existe' })
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, clientId, date, time, venue, type, status, guests, budget } = req.body

    if (!name?.trim())   return res.status(400).json({ error: 'El nombre es requerido' })
    if (!clientId)       return res.status(400).json({ error: 'El cliente es requerido' })
    if (!date)           return res.status(400).json({ error: 'La fecha es requerida' })
    if (!venue?.trim())  return res.status(400).json({ error: 'El venue es requerido' })
    if (!guests || Number(guests) <= 0) return res.status(400).json({ error: 'Los invitados deben ser mayor a 0' })
    if (!budget || Number(budget) <= 0) return res.status(400).json({ error: 'El presupuesto debe ser mayor a 0' })

    const event = await prisma.event.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name.trim(), venue: venue.trim(), type, status,
        guests: Number(guests),
        budget: Number(budget),
        date:   new Date(`${date.slice(0,10)}T12:00:00`),
        time:   time || null,
        client: { connect: { id: Number(clientId) } }
      }
    })
    res.json(event)
  } catch (e) {
    console.error('Error update event:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Evento no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id)
    // Borrar dependientes en orden antes del evento
    const quotes = await prisma.quote.findMany({ where: { eventId: id }, select: { id: true } })
    const quoteIds = quotes.map(q => q.id)
    if (quoteIds.length > 0) {
      await prisma.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } })
    }
    await prisma.supplierPayment.deleteMany({ where: { eventId: id } })
    await prisma.payment.deleteMany({ where: { eventId: id } })
    await prisma.quote.deleteMany({ where: { eventId: id } })
    await prisma.eventFile.deleteMany({ where: { eventId: id } })
    await prisma.event.delete({ where: { id } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete event:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Evento no encontrado' })
    res.status(500).json({ error: e.message })
  }
}