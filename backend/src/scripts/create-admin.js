import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const user = await prisma.staff.create({
    data: {
      name:     'Admin',
      email:    'admin2@hotel.com',
      password,
      role:     'admin',
      shift:    'morning',
    },
  })

  console.log(`Created: ${user.email} / admin123`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
