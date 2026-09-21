import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding initial Super Admin...')

  const existingSuperAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
  })

  if (!existingSuperAdmin) {
    const passwordHash = await bcrypt.hash('admin1234', 10)
    const superAdmin = await prisma.user.create({
      data: {
        username: 'admin',
        name: 'เจ้าของร้าน (Super Admin)',
        passwordHash,
        role: 'SUPER_ADMIN',
      },
    })
    console.log(`Created default Super Admin:`)
    console.log(`Username: ${superAdmin.username}`)
    console.log(`Password: admin1234`)
  } else {
    console.log(`Super Admin already exists: ${existingSuperAdmin.username}`)
  }

  // Seed default cafe menu items if empty
  const menuCount = await prisma.menuItem.count()
  if (menuCount === 0) {
    console.log('Seeding default menu items...')
    const defaultMenu = [
      { name: 'เอสเพรสโซ (Espresso)', price: 45, category: 'กาแฟ' },
      { name: 'อเมริกาโน (Americano)', price: 50, category: 'กาแฟ' },
      { name: 'ลาเต้ (Latte)', price: 55, category: 'กาแฟ' },
      { name: 'คาปูชิโน (Cappuccino)', price: 55, category: 'กาแฟ' },
      { name: 'มอคค่า (Mocha)', price: 60, category: 'กาแฟ' },
      { name: 'คาราเมล มัคคิอาโต (Caramel Macchiato)', price: 65, category: 'กาแฟ' },
      { name: 'ชาเขียวมัทฉะ (Matcha Latte)', price: 60, category: 'ชา' },
      { name: 'ชาไทยโบราณ (Thai Tea)', price: 45, category: 'ชา' },
      { name: 'ชามะนาว (Lemon Tea)', price: 45, category: 'ชา' },
      { name: 'โกโก้เข้มข้น (Rich Cocoa)', price: 50, category: 'นม/ช็อกโกแลต' },
      { name: 'นมสดคาราเมล (Caramel Fresh Milk)', price: 50, category: 'นม/ช็อกโกแลต' },
      { name: 'สตรอว์เบอร์รีสมูทตี้ (Strawberry Smoothie)', price: 65, category: 'สมูทตี้/ผลไม้' },
    ]

    for (const item of defaultMenu) {
      await prisma.menuItem.create({ data: item })
    }
    console.log(`Created ${defaultMenu.length} default menu items!`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
