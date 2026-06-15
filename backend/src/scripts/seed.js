import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const password = await bcrypt.hash('admin123', 10)

  const admin = await prisma.staff.upsert({
    where:  { email: 'admin@hotel.com' },
    update: {},
    create: {
      name:     'Admin User',
      email:    'admin@hotel.com',
      password,
      role:     'admin',
      shift:    'morning',
    },
  })

  console.log(`Admin seeded: ${admin.email} / admin123`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
