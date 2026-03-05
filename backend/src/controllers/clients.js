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
    const { name, contact, email, phone, birthdate, status } = req.body

    if (!name?.trim())    return res.status(400).json({ error: 'El nombre es requerido' })
    if (!email?.trim())   return res.status(400).json({ error: 'El email es requerido' })
    if (!contact?.trim()) return res.status(400).json({ error: 'El contacto es requerido' })
    if (!phone?.trim())   return res.status(400).json({ error: 'El teléfono es requerido' })

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        birthdate: birthdate ? new Date(birthdate) : null,
        status,
      }
    })
    res.status(201).json(client)
  } catch (e) {
    console.error('Error create client:', e)
    if (e.code === 'P2002') return res.status(400).json({ error: 'Ya existe un cliente con ese email' })
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, contact, email, phone, birthdate, status } = req.body

    if (!name?.trim())    return res.status(400).json({ error: 'El nombre es requerido' })
    if (!email?.trim())   return res.status(400).json({ error: 'El email es requerido' })
    if (!contact?.trim()) return res.status(400).json({ error: 'El contacto es requerido' })
    if (!phone?.trim())   return res.status(400).json({ error: 'El teléfono es requerido' })

    const client = await prisma.client.update({
      where: { id: Number(req.params.id) },
      data: {
        name: name.trim(),
        contact: contact.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        birthdate: birthdate ? new Date(birthdate) : null,
        status,
      }
    })
    res.json(client)
  } catch (e) {
    console.error('Error update client:', e)
    if (e.code === 'P2002') return res.status(400).json({ error: 'Ya existe un cliente con ese email' })
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cliente no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.client.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete client:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cliente no encontrado' })
    res.status(500).json({ error: e.message })
  }
}
