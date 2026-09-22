import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

interface MockCustomer {
  username: string
  name: string
  phone: string
  stamps: number
  totalCups: number
  freeRedeems: number
}

const mockCustomers: MockCustomer[] = [
  {
    username: 'ploy_cafe',
    name: 'คุณพลอย (ลูกค้าประจำ)',
    phone: '0812345601',
    stamps: 8,
    totalCups: 28,
    freeRedeems: 1, // มีสิทธิ์แลกฟรี
  },
  {
    username: 'somchai_s',
    name: 'คุณสมชาย ใจดี',
    phone: '0812345602',
    stamps: 9,
    totalCups: 19,
    freeRedeems: 0, // ขาดอีก 1 แก้วได้ฟรี
  },
  {
    username: 'mind_cute',
    name: 'น้องมายด์ บาริสต้าเลิฟเวอร์',
    phone: '0812345603',
    stamps: 4,
    totalCups: 14,
    freeRedeems: 2, // มีสิทธิ์แลกฟรี 2 แก้ว
  },
  {
    username: 'boss_tech',
    name: 'คุณบอส โปรแกรมเมอร์',
    phone: '0812345604',
    stamps: 6,
    totalCups: 16,
    freeRedeems: 0,
  },
  {
    username: 'noom_latte',
    name: 'พี่หนุ่ม ลาเต้หวานน้อย',
    phone: '0812345605',
    stamps: 2,
    totalCups: 22,
    freeRedeems: 1,
  },
  {
    username: 'tarn_matcha',
    name: 'คุณตาล มัทฉะพรีเมียม',
    phone: '0812345606',
    stamps: 5,
    totalCups: 5,
    freeRedeems: 0,
  },
  {
    username: 'golf_espresso',
    name: 'กอล์ฟ เอสเพรสโซช็อต',
    phone: '0812345607',
    stamps: 7,
    totalCups: 17,
    freeRedeems: 0,
  },
  {
    username: 'amy_smoothie',
    name: 'คุณเอมี่ เบอร์รีสมูทตี้',
    phone: '0812345608',
    stamps: 1,
    totalCups: 1,
    freeRedeems: 0, // ลูกค้าใหม่
  },
  {
    username: 'nan_bakery',
    name: 'แนน ขนมหวาน',
    phone: '0812345609',
    stamps: 3,
    totalCups: 13,
    freeRedeems: 0,
  },
  {
    username: 'bird_americano',
    name: 'พี่เบิร์ด อเมริกาโนเย็น',
    phone: '0812345610',
    stamps: 0,
    totalCups: 0,
    freeRedeems: 0, // ลูกค้าเพิ่งสมัคร
  },
]

async function seed() {
  console.log('🌱 Seeding 10 mock customers...')

  for (const c of mockCustomers) {
    // รหัสผ่านเริ่มต้นคือเบอร์โทรศัพท์ (หรือ 123456)
    const passwordHash = await bcrypt.hash(c.phone, 10)

    const user = await prisma.user.upsert({
      where: { username: c.username },
      update: {
        name: c.name,
        phone: c.phone,
        stamps: c.stamps,
        totalCups: c.totalCups,
        freeRedeems: c.freeRedeems,
      },
      create: {
        username: c.username,
        name: c.name,
        phone: c.phone,
        passwordHash,
        role: 'CUSTOMER',
        stamps: c.stamps,
        totalCups: c.totalCups,
        freeRedeems: c.freeRedeems,
      },
    })

    console.log(`✅ [${user.role}] ${user.name} (@${user.username}) | เบอร์: ${user.phone} | แต้ม: ${user.stamps}/10 | ฟรี: ${user.freeRedeems}`)
  }

  console.log('\n✨ สำเร็จ! เพิ่มข้อมูลลูกค้าจำลอง 10 คนเรียบร้อยแล้ว')
  console.log('💡 รหัสผ่านของทุกคน = เบอร์โทรศัพท์ของคนนั้นๆ (เข้าสู่ระบบได้ทั้งด้วย username หรือเบอร์โทร)')
}

seed()
  .catch((e) => {
    console.error('Error seeding mock customers:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
