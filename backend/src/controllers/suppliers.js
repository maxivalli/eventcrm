const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const suppliers = await prisma.supplier.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(suppliers)
  } catch (e) {
    console.error('Error getAll suppliers:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({ where: { id: Number(req.params.id) } })
    if (!supplier) return res.status(404).json({ error: 'Proveedor no encontrado' })
    res.json(supplier)
  } catch (e) {
    console.error('Error getOne supplier:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, category, contact, phone, email, rating, status } = req.body
    const supplier = await prisma.supplier.create({
      data: { name, category, contact, phone, email, rating: Number(rating), status }
    })
    res.status(201).json(supplier)
  } catch (e) {
    console.error('Error create supplier:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, category, contact, phone, email, rating, status } = req.body
    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { name, category, contact, phone, email, rating: Number(rating), status }
    })
    res.json(supplier)
  } catch (e) {
    console.error('Error update supplier:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.supplier.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete supplier:', e)
    res.status(500).json({ error: e.message })
  }
}