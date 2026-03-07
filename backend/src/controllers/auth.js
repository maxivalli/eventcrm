const bcrypt = require('bcryptjs')
const jwt    = require('jsonwebtoken')
const prisma = require('../prisma')

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res.status(400).json({ error: 'Email y contraseña requeridos' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user)
      return res.status(401).json({ error: 'Credenciales inválidas' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid)
      return res.status(401).json({ error: 'Credenciales inválidas' })

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (e) {
    console.error('Error login:', e)
    res.status(500).json({ error: e.message })
  }
}

exports.me = async (req, res) => {
  res.json(req.user)
}
