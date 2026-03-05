const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { events: true } } }
    })
    res.json(clients)
  } catch (e) {
    console.error('Error getAll clients:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.getOne = async (req, res) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: Number(req.params.id) },
      include: { events: true }
    })
    if (!client) return res.status(404).json({ error: 'Cliente no encontrado' })
    res.json(client)
  } catch (e) {
    console.error('Error getOne client:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, contact, email, phone, type, status } = req.body
    const client = await prisma.client.create({
      data: { name, contact, email, phone, type, status }
    })
    res.status(201).json(client)
  } catch (e) {
    console.error('Error create client:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, contact, email, phone, type, status } = req.body
    const client = await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: { name, contact, email, phone, type, status }
    })
    res.json(client)
  } catch (e) {
    console.error('Error update client:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete client:', e)
    res.status(500).json({ error: e.message })
  }
}