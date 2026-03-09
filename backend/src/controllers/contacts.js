const prisma = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { name: 'asc' },
    })
    res.json(contacts)
  } catch (e) {
    console.error('Error getAll contacts:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, phone, email } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })

    const contact = await prisma.contact.create({
      data: {
        name:  name.trim(),
        phone: phone?.trim() || '',
        email: email?.trim().toLowerCase() || '',
      },
    })
    res.status(201).json(contact)
  } catch (e) {
    console.error('Error create contact:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, phone, email } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido' })

    const contact = await prisma.contact.update({
      where: { id: Number(req.params.id) },
      data: {
        name:  name.trim(),
        phone: phone?.trim() || '',
        email: email?.trim().toLowerCase() || '',
      },
    })
    res.json(contact)
  } catch (e) {
    console.error('Error update contact:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Contacto no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    await prisma.contact.delete({ where: { id: Number(req.params.id) } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete contact:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Contacto no encontrado' })
    res.status(500).json({ error: e.message })
  }
}

exports.removeAll = async (req, res) => {
  try {
    const { count } = await prisma.contact.deleteMany({})
    res.json({ success: true, count })
  } catch (e) {
    console.error('Error removeAll contacts:', e)
    res.status(500).json({ error: e.message })
  }
}