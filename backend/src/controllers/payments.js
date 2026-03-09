const prisma = require('../prisma')
const { log } = require('../utils/activity')
const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

exports.getByEvent = async (req, res) => {
  try {
    const eventId = Number(req.query.eventId)
    if (!eventId) return res.status(400).json({ error: 'eventId es requerido' })
    const [payments, quotes] = await Promise.all([
      prisma.payment.findMany({ where: { eventId }, orderBy: { date: 'desc' } }),
      prisma.quote.findMany({ where: { eventId, status: 'Aprobado' }, include: { items: true } }),
    ])
    const totalQuotes = quotes.reduce((sum, q) => {
      if (q.kind === 'Catering') return sum + (q.covers || 0) * (q.pricePerCover || 0) + q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
      return sum + q.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
    }, 0)
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
    res.json({ payments, totalQuotes, totalPaid, balance: totalQuotes - totalPaid })
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.create = async (req, res) => {
  try {
    const { eventId, amount, date, note } = req.body
    if (!eventId) return res.status(400).json({ error: 'El evento es requerido' })
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' })

    const event = await prisma.event.findUnique({ where: { id: Number(eventId) }, include: { client: { select: { name: true } } } })
    const payment = await prisma.payment.create({
      data: { eventId: Number(eventId), amount: Number(amount), date: date ? new Date(`${date.slice(0,10)}T12:00:00`) : new Date(), note: note?.trim() || null }
    })
    log({ action: 'payment', entity: 'payment', entityId: payment.id,
          label: `Cobro registrado: ${event?.name || '—'}`,
          detail: `${fmt(Number(amount))} · Cliente: ${event?.client?.name || '—'}${note ? ` · ${note}` : ''}` })
    res.status(201).json(payment)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.remove = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: Number(req.params.id) }, include: { event: { select: { name: true } } } })
    await prisma.payment.delete({ where: { id: Number(req.params.id) } })
    log({ action: 'delete', entity: 'payment', entityId: Number(req.params.id),
          label: `Cobro eliminado: ${payment?.event?.name || '—'}`,
          detail: fmt(payment?.amount || 0) })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pago no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.getAll = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { event: { select: { name: true, client: { select: { name: true } } } } }
    })
    res.json(payments)
  } catch (e) { res.status(500).json({ error: e.message }) }
}