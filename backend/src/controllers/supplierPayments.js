const prisma = require('../prisma')
const { log } = require('../utils/activity')
const fmt = (n) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(n)

const METHODS  = ['Efectivo', 'Transferencia', 'Cheque', 'Tarjeta', 'Otro']
const STATUSES = ['Pendiente', 'Pagado']

exports.getBySupplierAndEvent = async (req, res) => {
  try {
    const supplierId = Number(req.query.supplierId)
    const eventId    = Number(req.query.eventId)
    if (!supplierId) return res.status(400).json({ error: 'supplierId es requerido' })
    if (!eventId)    return res.status(400).json({ error: 'eventId es requerido' })
    const payments = await prisma.supplierPayment.findMany({ where: { supplierId, eventId }, orderBy: { date: 'desc' } })
    const totalPaid    = payments.filter(p => p.status === 'Pagado').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'Pendiente').reduce((sum, p) => sum + p.amount, 0)
    res.json({ payments, totalPaid, totalPending })
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.getByEvent = async (req, res) => {
  try {
    const eventId = Number(req.params.eventId)
    const payments = await prisma.supplierPayment.findMany({ where: { eventId }, orderBy: { date: 'desc' }, include: { supplier: { select: { name: true } } } })
    const totalPaid    = payments.filter(p => p.status === 'Pagado').reduce((sum, p) => sum + p.amount, 0)
    const totalPending = payments.filter(p => p.status === 'Pendiente').reduce((sum, p) => sum + p.amount, 0)
    res.json({ payments, totalPaid, totalPending })
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.create = async (req, res) => {
  try {
    const { supplierId, eventId, amount, date, note, method, status } = req.body
    if (!supplierId) return res.status(400).json({ error: 'El proveedor es requerido' })
    if (!eventId)    return res.status(400).json({ error: 'El evento es requerido' })
    if (!amount || Number(amount) <= 0) return res.status(400).json({ error: 'El monto debe ser mayor a 0' })

    const [supplier, event] = await Promise.all([
      prisma.supplier.findUnique({ where: { id: Number(supplierId) }, select: { name: true } }),
      prisma.event.findUnique({ where: { id: Number(eventId) }, select: { name: true } }),
    ])

    const payment = await prisma.supplierPayment.create({
      data: { supplierId: Number(supplierId), eventId: Number(eventId), amount: Number(amount), date: date ? new Date(`${date.slice(0,10)}T12:00:00`) : new Date(), note: note?.trim() || null, method: METHODS.includes(method) ? method : 'Efectivo', status: STATUSES.includes(status) ? status : 'Pendiente' }
    })

    log({ action: 'payment', entity: 'supplierPayment', entityId: payment.id,
          label: `Pago a proveedor: ${supplier?.name || '—'}`,
          detail: `${fmt(Number(amount))} · ${event?.name || '—'} · ${method} · ${payment.status}` })

    res.status(201).json(payment)
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!STATUSES.includes(status)) return res.status(400).json({ error: 'Estado inválido' })
    const prev = await prisma.supplierPayment.findUnique({ where: { id: Number(req.params.id) }, include: { supplier: { select: { name: true } }, event: { select: { name: true } } } })
    const payment = await prisma.supplierPayment.update({ where: { id: Number(req.params.id) }, data: { status } })
    log({ action: 'status', entity: 'supplierPayment', entityId: payment.id,
          label: `Pago a ${prev?.supplier?.name || '—'} marcado como ${status}`,
          detail: `${fmt(prev?.amount || 0)} · ${prev?.event?.name || '—'}` })
    res.json(payment)
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pago no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const prev = await prisma.supplierPayment.findUnique({ where: { id: Number(req.params.id) }, include: { supplier: { select: { name: true } }, event: { select: { name: true } } } })
    await prisma.supplierPayment.delete({ where: { id: Number(req.params.id) } })
    log({ action: 'delete', entity: 'supplierPayment', entityId: Number(req.params.id),
          label: `Pago eliminado: ${prev?.supplier?.name || '—'}`,
          detail: `${fmt(prev?.amount || 0)} · ${prev?.event?.name || '—'}` })
    res.json({ success: true })
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pago no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.getPendingTotal = async (req, res) => {
  try {
    const payments = await prisma.supplierPayment.findMany({ where: { status: 'Pendiente' } })
    const total = payments.reduce((sum, p) => sum + p.amount, 0)
    res.json({ total })
  } catch (e) { res.status(500).json({ error: e.message }) }
}

exports.getAll = async (req, res) => {
  try {
    const payments = await prisma.supplierPayment.findMany({ orderBy: { createdAt: 'desc' }, include: { supplier: { select: { name: true } }, event: { select: { name: true } } } })
    res.json(payments)
  } catch (e) { res.status(500).json({ error: e.message }) }
}