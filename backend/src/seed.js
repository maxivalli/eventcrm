require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const hashed = await bcrypt.hash('admin123', 10)
  console.log('HASH GENERADO:', hashed)
  const user = await prisma.user.upsert({
    where:  { email: 'admin@eventcrm.com' },
    update: { password: hashed },
    create: { email: 'admin@eventcrm.com', password: hashed, name: 'Administrador' },
  })
  console.log('✅ Usuario creado:', user.email)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())