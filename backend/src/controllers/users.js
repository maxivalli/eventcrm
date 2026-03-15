const bcrypt = require('bcryptjs')
const prisma  = require('../prisma')

exports.getAll = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.json(users)
  } catch (e) {
    console.error('Error getAll users:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.create = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Nombre, email y contraseña son requeridos' })
    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'staff' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.status(201).json(user)
  } catch (e) {
    if (e.code === 'P2002')
      return res.status(400).json({ error: 'El email ya está registrado' })
    console.error('Error create user:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    const { name, email, role } = req.body
    const data = { name, email }
    if (role) data.role = role
    const user = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    })
    res.json(user)
  } catch (e) {
    if (e.code === 'P2002')
      return res.status(400).json({ error: 'El email ya está registrado' })
    console.error('Error update user:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.changePassword = async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 6)
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' })
    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: { password: hashed }
    })
    res.json({ success: true })
  } catch (e) {
    console.error('Error changePassword:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const targetId = Number(req.params.id)
    if (targetId === req.user.id)
      return res.status(400).json({ error: 'No podés eliminar tu propio usuario' })
    // Solo el usuario con ID 1 (admin principal) puede eliminar otros usuarios
    if (req.user.id !== 1)
      return res.status(403).json({ error: 'Solo el administrador puede eliminar usuarios' })
    await prisma.user.delete({ where: { id: targetId } })
    res.json({ success: true })
  } catch (e) {
    console.error('Error delete user:', e)
    if (e.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado' })
    res.status(500).json({ error: e.message })
  }
}