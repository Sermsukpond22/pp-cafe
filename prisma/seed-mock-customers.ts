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
    freeRedeems: 1,
  },
  {
    username: 'somchai_s',
    name: 'คุณสมชาย ใจดี',
    phone: '0812345602',
    stamps: 9,
    totalCups: 19,
    freeRedeems: 0,
  },
  {
    username: 'mind_cute',
    name: 'น้องมายด์ บาริสต้าเลิฟเวอร์',
    phone: '0812345603',
    stamps: 4,
    totalCups: 14,
    freeRedeems: 2,
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
    totalCups: 15,
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
    stamps: 3,
    totalCups: 11,
    freeRedeems: 0,
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
    stamps: 4,
    totalCups: 10,
    freeRedeems: 1,
  },
]

function getBangkokDateOffsetStr(daysOffset: number): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const todayStr = formatter.format(new Date())
  const [y, m, d] = todayStr.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + daysOffset, 12, 0, 0))
  return dt.toISOString().slice(0, 10)
}

function makeBangkokDateTime(daysOffset: number, timeHHMM: string): Date {
  const dateStr = getBangkokDateOffsetStr(daysOffset)
  return new Date(`${dateStr}T${timeHHMM}:00+07:00`)
}

async function seed() {
  console.log('🌱 Seeding mock customers, staff, and daily transactions...')

  // 1. Ensure Super Admin & Staff Admin exist
  const adminPasswordHash = await bcrypt.hash('admin1234', 10)
  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      name: 'เจ้าของร้าน (Super Admin)',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
    },
  })

  const cashierStaff = await prisma.user.upsert({
    where: { username: 'cashier_nan' },
    update: {},
    create: {
      username: 'cashier_nan',
      name: 'พนักงานแนน (แคชเชียร์)',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  })

  // 2. Upsert 10 mock customers
  const customerMap = new Map<string, string>()
  for (const c of mockCustomers) {
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
    customerMap.set(c.username, user.id)
  }

  // 3. Fetch menu items
  let menuItems = await prisma.menuItem.findMany()
  if (menuItems.length === 0) {
    const defaultMenu = [
      { name: 'ชาไทยโบราณ (Thai Tea)', price: 45, category: 'ชา' },
      { name: 'ชาเขียวมัทฉะ (Matcha Latte)', price: 60, category: 'ชา' },
      { name: 'ชามะนาว (Lemon Tea)', price: 45, category: 'ชา' },
      { name: 'อเมริกาโน (Americano)', price: 50, category: 'กาแฟ' },
      { name: 'เอสเพรสโซ (Espresso)', price: 45, category: 'กาแฟ' },
      { name: 'ลาเต้ (Latte)', price: 55, category: 'กาแฟ' },
      { name: 'คาปูชิโน (Cappuccino)', price: 55, category: 'กาแฟ' },
      { name: 'โกโก้เข้มข้น (Rich Cocoa)', price: 50, category: 'นม/ช็อกโกแลต' },
      { name: 'นมสดคาราเมล (Caramel Fresh Milk)', price: 50, category: 'นม/ช็อกโกแลต' },
      { name: 'สตรอว์เบอร์รีสมูทตี้ (Strawberry Smoothie)', price: 65, category: 'สมูทตี้/ผลไม้' },
    ]
    for (const item of defaultMenu) {
      await prisma.menuItem.create({ data: item })
    }
    menuItems = await prisma.menuItem.findMany()
  }

  const findMenu = (keyword: string) =>
    menuItems.find((m) => m.name.includes(keyword)) ?? menuItems[0]

  // Clear previous mock transactions with "[SEED]" marker or clean up to re-seed cleanly
  await prisma.transactionItem.deleteMany({})
  await prisma.transactionEditLog.deleteMany({})
  await prisma.transaction.deleteMany({})

  // Define realistic transactions across multiple days
  interface SeedTxSpec {
    daysOffset: number
    time: string
    customerUsername: string
    cashier: 'admin' | 'nan'
    type: 'EARN' | 'REDEEM'
    note?: string
    items: Array<{ keyword: string; qty: number }>
    edited?: {
      reason: string
      changesSummary: string
    }
  }

  const txSpecs: SeedTxSpec[] = [
    // ─── วันนี้ (0 daysOffset) ───
    {
      daysOffset: 0,
      time: '08:25',
      customerUsername: 'boss_tech',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'อเมริกาโน', qty: 2 },
        { keyword: 'เอสเพรสโซ', qty: 1 },
      ],
    },
    {
      daysOffset: 0,
      time: '09:15',
      customerUsername: 'ploy_cafe',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'ชาไทย', qty: 2 },
        { keyword: 'มัทฉะ', qty: 1 },
      ],
    },
    {
      daysOffset: 0,
      time: '10:40',
      customerUsername: 'tarn_matcha',
      cashier: 'admin',
      type: 'EARN',
      items: [{ keyword: 'มัทฉะ', qty: 2 }],
      edited: {
        reason: 'ลูกค้าสั่งเพิ่มจาก 1 แก้ว เป็น 2 แก้ว',
        changesSummary: 'จำนวนแก้ว: 1 -> 2 แก้ว | ยอดเงิน: 60฿ -> 120฿',
      },
    },
    {
      daysOffset: 0,
      time: '12:05',
      customerUsername: 'somchai_s',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'ชาไทย', qty: 2 },
        { keyword: 'โกโก้', qty: 2 },
      ],
    },
    {
      daysOffset: 0,
      time: '12:50',
      customerUsername: 'mind_cute',
      cashier: 'nan',
      type: 'REDEEM',
      note: 'แลกเครื่องดื่มฟรี 1 แก้ว (ครบ 10 แต้ม)',
      items: [{ keyword: 'สตรอว์เบอร์รี', qty: 1 }],
    },
    {
      daysOffset: 0,
      time: '14:20',
      customerUsername: 'noom_latte',
      cashier: 'admin',
      type: 'EARN',
      items: [
        { keyword: 'ลาเต้', qty: 2 },
        { keyword: 'ชามะนาว', qty: 1 },
      ],
    },
    {
      daysOffset: 0,
      time: '15:45',
      customerUsername: 'golf_espresso',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'เอสเพรสโซ', qty: 1 },
        { keyword: 'ชาไทย', qty: 1 },
      ],
    },

    // ─── เมื่อวาน (-1 daysOffset) ───
    {
      daysOffset: -1,
      time: '08:50',
      customerUsername: 'bird_americano',
      cashier: 'nan',
      type: 'EARN',
      items: [{ keyword: 'อเมริกาโน', qty: 2 }],
    },
    {
      daysOffset: -1,
      time: '10:15',
      customerUsername: 'ploy_cafe',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'ชาไทย', qty: 3 },
        { keyword: 'นมสดคาราเมล', qty: 1 },
      ],
    },
    {
      daysOffset: -1,
      time: '12:30',
      customerUsername: 'nan_bakery',
      cashier: 'admin',
      type: 'EARN',
      items: [
        { keyword: 'มัทฉะ', qty: 2 },
        { keyword: 'โกโก้', qty: 1 },
      ],
      edited: {
        reason: 'เปลี่ยนเมนูตามที่ลูกค้าแจ้งหน้าเคาน์เตอร์',
        changesSummary: 'รายการ: [ชามะนาว ×2] -> [ชาเขียวมัทฉะ ×2, โกโก้เข้มข้น ×1]',
      },
    },
    {
      daysOffset: -1,
      time: '13:45',
      customerUsername: 'ploy_cafe',
      cashier: 'nan',
      type: 'REDEEM',
      note: 'ใช้สิทธิ์แลกฟรี 1 แก้ว',
      items: [{ keyword: 'ชาไทย', qty: 1 }],
    },
    {
      daysOffset: -1,
      time: '15:10',
      customerUsername: 'amy_smoothie',
      cashier: 'nan',
      type: 'EARN',
      items: [{ keyword: 'สตรอว์เบอร์รี', qty: 2 }],
    },
    {
      daysOffset: -1,
      time: '16:55',
      customerUsername: 'boss_tech',
      cashier: 'admin',
      type: 'EARN',
      items: [
        { keyword: 'คาปูชิโน', qty: 2 },
        { keyword: 'ชามะนาว', qty: 2 },
      ],
    },

    // ─── 2 วันก่อน (-2 daysOffset) ───
    {
      daysOffset: -2,
      time: '09:30',
      customerUsername: 'somchai_s',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'ชาไทย', qty: 2 },
        { keyword: 'อเมริกาโน', qty: 1 },
      ],
    },
    {
      daysOffset: -2,
      time: '11:20',
      customerUsername: 'mind_cute',
      cashier: 'nan',
      type: 'EARN',
      items: [{ keyword: 'มัทฉะ', qty: 3 }],
    },
    {
      daysOffset: -2,
      time: '14:00',
      customerUsername: 'noom_latte',
      cashier: 'admin',
      type: 'EARN',
      items: [
        { keyword: 'ลาเต้', qty: 2 },
        { keyword: 'โกโก้', qty: 2 },
      ],
    },
    {
      daysOffset: -2,
      time: '16:15',
      customerUsername: 'noom_latte',
      cashier: 'nan',
      type: 'REDEEM',
      note: 'แลกฟรีลาเต้เย็น',
      items: [{ keyword: 'ลาเต้', qty: 1 }],
    },

    // ─── 3 วันก่อน (-3 daysOffset) ───
    {
      daysOffset: -3,
      time: '10:05',
      customerUsername: 'tarn_matcha',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'มัทฉะ', qty: 2 },
        { keyword: 'ชาไทย', qty: 2 },
      ],
    },
    {
      daysOffset: -3,
      time: '13:20',
      customerUsername: 'golf_espresso',
      cashier: 'admin',
      type: 'EARN',
      items: [{ keyword: 'เอสเพรสโซ', qty: 3 }],
    },
    {
      daysOffset: -3,
      time: '15:50',
      customerUsername: 'amy_smoothie',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'สตรอว์เบอร์รี', qty: 1 },
        { keyword: 'นมสดคาราเมล', qty: 2 },
      ],
    },

    // ─── 5 วันก่อน (-5 daysOffset) ───
    {
      daysOffset: -5,
      time: '09:10',
      customerUsername: 'ploy_cafe',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'ชาไทย', qty: 4 },
        { keyword: 'ชามะนาว', qty: 2 },
      ],
    },
    {
      daysOffset: -5,
      time: '12:40',
      customerUsername: 'boss_tech',
      cashier: 'admin',
      type: 'EARN',
      items: [{ keyword: 'อเมริกาโน', qty: 3 }],
    },

    // ─── 10 วันก่อน (-10 daysOffset, อยู่ในเดือนนี้) ───
    {
      daysOffset: -10,
      time: '11:00',
      customerUsername: 'somchai_s',
      cashier: 'nan',
      type: 'EARN',
      items: [
        { keyword: 'ชาไทย', qty: 3 },
        { keyword: 'ลาเต้', qty: 2 },
      ],
    },
    {
      daysOffset: -10,
      time: '14:30',
      customerUsername: 'mind_cute',
      cashier: 'admin',
      type: 'EARN',
      items: [
        { keyword: 'มัทฉะ', qty: 2 },
        { keyword: 'โกโก้', qty: 2 },
      ],
    },
  ]

  let createdCount = 0
  for (const spec of txSpecs) {
    const userId = customerMap.get(spec.customerUsername)
    if (!userId) continue

    const createdAt = makeBangkokDateTime(spec.daysOffset, spec.time)
    const cashierUser = spec.cashier === 'admin' ? superAdmin : cashierStaff

    const resolvedItems = spec.items.map((i) => {
      const m = findMenu(i.keyword)
      const price = spec.type === 'REDEEM' ? 0 : m.price
      return {
        menuItemId: m.id,
        name: m.name,
        price,
        quantity: i.qty,
        subtotal: price * i.qty,
      }
    })

    const totalCups =
      spec.type === 'REDEEM'
        ? 1
        : resolvedItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount =
      spec.type === 'REDEEM'
        ? 0
        : resolvedItems.reduce((sum, item) => sum + item.subtotal, 0)

    const tx = await prisma.transaction.create({
      data: {
        userId,
        type: spec.type,
        cups: totalCups,
        totalAmount,
        note: spec.note ?? null,
        createdAt,
        createdBy: cashierUser.id,
        updatedBy: spec.edited ? superAdmin.id : null,
        updatedAt: spec.edited ? new Date(createdAt.getTime() + 10 * 60 * 1000) : createdAt,
        items: {
          create: resolvedItems.map((ri) => ({
            menuItemId: ri.menuItemId,
            name: ri.name,
            price: ri.price,
            quantity: ri.quantity,
            subtotal: ri.subtotal,
            createdAt,
          })),
        },
      },
    })

    if (spec.edited) {
      await prisma.transactionEditLog.create({
        data: {
          transactionId: tx.id,
          editedBy: superAdmin.id,
          editorName: superAdmin.name,
          reason: spec.edited.reason,
          changesSummary: spec.edited.changesSummary,
          previousData: JSON.stringify({
            cups: Math.max(1, totalCups - 1),
            totalAmount: Math.max(0, totalAmount - 60),
            note: null,
            items: [],
          }),
          createdAt: new Date(createdAt.getTime() + 10 * 60 * 1000),
        },
      })
    }

    createdCount++
  }

  console.log(`✅ สร้างข้อมูลธุรกรรมจำลอง ${createdCount} รายการ (ครอบคลุม วันนี้, เมื่อวาน, 7 วันล่าสุด, และเดือนนี้) เรียบร้อยแล้ว!`)
}

seed()
  .catch((e) => {
    console.error('Error seeding mock data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
