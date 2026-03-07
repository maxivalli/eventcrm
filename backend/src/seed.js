require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('admin123', 10)
  const user = await prisma.user.upsert({
    where:  { email: 'admin@eventcrm.com' },
    update: {},
    create: { email: 'admin@eventcrm.com', password: hashed, name: 'Administrador' },
  })
  console.log('✅ Usuario creado:', user.email)
  console.log('   Contraseña:    admin123')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
