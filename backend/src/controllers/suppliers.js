const { log } = require('../utils/activity')
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
    const { name, category, contact, phone, email, rating, status, alias } = req.body

    if (!name?.trim())    return res.status(400).json({ error: 'El nombre es requerido' })
    if (!email?.trim())   return res.status(400).json({ error: 'El email es requerido' })
    if (!contact?.trim()) return res.status(400).json({ error: 'El contacto es requerido' })
    if (!phone?.trim())   return res.status(400).json({ error: 'El teléfono es requerido' })

    const supplier = await prisma.supplier.create({
      data: { name: name.trim(), category, contact: contact.trim(), phone: phone.trim(), email: email.trim().toLowerCase(), rating: Number(rating) || 3, status, alias: alias?.trim() || null }
    })
    log({ action: 'create', entity: 'supplier', entityId: supplier.id, label: `Proveedor creado: ${supplier.name}`, detail: `${category} · ${supplier.email}` })
    res.status(201).json(supplier)
  } catch (e) {
    console.error('Error create supplier:', e)
    if (e.code === 'P2002') return res.status(400).json({ error: 'Ya existe un proveedor con ese email' })
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, category, contact, phone, email, rating, status, alias } = req.body

    if (!name?.trim())    return res.status(400).json({ error: 'El nombre es requerido' })
    if (!email?.trim())   return res.status(400).json({ error: 'El email es requerido' })
    if (!contact?.trim()) return res.status(400).json({ error: 'El contacto es requerido' })
    if (!phone?.trim())   return res.status(400).json({ error: 'El teléfono es requerido' })

    const supplier = await prisma.supplier.update({
      where: { id: Number(req.params.id) },
      data: { name: name.trim(), category, contact: contact.trim(), phone: phone.trim(), email: email.trim().toLowerCase(), rating: Number(rating) || 3, status, alias: alias?.trim() || null }
    })
    log({ action: 'update', entity: 'supplier', entityId: supplier.id, label: `Proveedor editado: ${supplier.name}`, detail: `${category} · Estado: ${status}` })
    res.json(supplier)
  } catch (e) {
    console.error('Error update supplier:', e)
    if (e.code === 'P2002') return res.status(400).json({ error: 'Ya existe un proveedor con ese email' })
    if (e.code === 'P2025') return res.status(404).json({ error: 'Proveedor no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id)
    const supplier = await prisma.supplier.findUnique({ where: { id }, select: { name: true, category: true } })
    await prisma.supplier.delete({ where: { id } })
    log({ action: 'delete', entity: 'supplier', entityId: id, label: `Proveedor eliminado: ${supplier?.name || id}`, detail: supplier?.category })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete supplier:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Proveedor no encontrado' })
    res.status(500).json({ error: e.message })
  }
}