const prisma = require('../prisma')

// GET /api/payments?eventId=X  → pagos + resumen del evento
exports.getByEvent = async (req, res) => {
  try {
    const eventId = Number(req.query.eventId)
    if (!eventId) return res.status(400).json({ error: 'eventId es requerido' })

    const [payments, quotes] = await Promise.all([
      prisma.payment.findMany({
        where: { eventId },
        orderBy: { date: 'desc' },
      }),
      prisma.quote.findMany({
        where: { eventId, status: 'Aprobado' },
        include: { items: true },
      }),
    ])

    // Calcular total cotizaciones aceptadas
    const totalQuotes = quotes.reduce((sum, q) => {
      if (q.kind === 'Catering') {
        const cateringBase = (q.covers || 0) * (q.pricePerCover || 0)
        const extras = q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
        return sum + cateringBase + extras
      }
      return sum + q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    }, 0)

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)

    res.json({
      payments,
      totalQuotes,
      totalPaid,
      balance: totalQuotes - totalPaid,
    })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// POST /api/payments
exports.create = async (req, res) => {
  try {
    const { eventId, amount, date, note } = req.body

    if (!eventId) return res.status(400).json({ error: 'El evento es requerido' })
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' })

    const payment = await prisma.payment.create({
      data: {
        eventId: Number(eventId),
        amount:  Number(amount),
        date:    date ? new Date(`${date.slice(0,10)}T12:00:00`) : new Date(),
        note:    note?.trim() || null,
      },
    })
    res.status(201).json(payment)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// DELETE /api/payments/:id
exports.remove = async (req, res) => {
  try {
    await prisma.payment.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pago no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

// GET /api/payments/all
exports.getAll = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: { select: { name: true, client: { select: { name: true } } } },
      },
    })
    res.json(payments)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}