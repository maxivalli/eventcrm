const prisma = require('../prisma')

const METHODS  = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro']
const STATUSES = ['Pendiente', 'Pagado']

// GET /api/supplier-payments?supplierId=X&eventId=Y
exports.getBySupplierAndEvent = async (req, res) => {
  try {
    const supplierId = Number(req.query.supplierId)
    const eventId    = Number(req.query.eventId)
    if (!supplierId) return res.status(400).json({ error: 'supplierId es requerido' })
    if (!eventId)    return res.status(400).json({ error: 'eventId es requerido' })
    const payments = await prisma.supplierPayment.findMany({
      where: { supplierId, eventId },
      orderBy: { date: 'desc' },
    })
    const totalPaid    = payments.filter(p => p.status === 'Pagado').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'Pendiente').reduce((sum, p) => sum + p.amount, 0)
    res.json({ payments, totalPaid, totalPending })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// GET /api/supplier-payments/by-event/:eventId
exports.getByEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.eventId)
    const payments = await prisma.supplierPayment.findMany({
      where:   { eventId },
      orderBy: { date: 'desc' },
      include: { supplier: { select: { name: true } } },
    })
    const totalPaid    = payments.filter(p => p.status === 'Pagado').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'Pendiente').reduce((sum, p) => sum + p.amount, 0)
    res.json({ payments, totalPaid, totalPending })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// POST /api/supplier-payments
exports.create = async (req, res) => {
  try {
    const { supplierId, eventId, amount, date, note, method, status } = req.body
    if (!supplierId) return res.status(400).json({ error: 'El proveedor es requerido' })
    if (!eventId)    return res.status(400).json({ error: 'El evento es requerido' })
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' })
    const payment = await prisma.supplierPayment.create({
      data: {
        supplierId: Number(supplierId),
        eventId:    Number(eventId),
        amount:     Number(amount),
        date:    date ? new Date(`${date.slice(0,10)}T12:00:00`) : new Date(),
        note:       note?.trim() || null,
        method:     METHODS.includes(method)  ? method  : 'Efectivo',
        status:     STATUSES.includes(status) ? status  : 'Pendiente',
      },
    })
    res.status(201).json(payment)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// PATCH /api/supplier-payments/:id/status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Estado inválido' })
    const payment = await prisma.supplierPayment.update({
      where: { id: Number(req.params.id) },
      data:  { status },
    })
    res.json(payment)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pago no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

// DELETE /api/supplier-payments/:id
exports.remove = async (req, res) => {
  try {
    await prisma.supplierPayment.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pago no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

// GET /api/supplier-payments/pending-total
exports.getPendingTotal = async (req, res) => {
  try {
    const payments = await prisma.supplierPayment.findMany({ where: { status: 'Pendiente' } })
    const total = payments.reduce((sum, p) => sum + p.amount, 0)
    res.json({ total })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}

// GET /api/supplier-payments/all
exports.getAll = async (req, res) => {
  try {
    const payments = await prisma.supplierPayment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { name: true } },
        event:    { select: { name: true } },
      },
    })
    res.json(payments)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}