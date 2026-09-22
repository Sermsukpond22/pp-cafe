// tests/tier2_boundaries/revenue_boundaries.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin, createTestMenuItem } from '../helpers/db.ts'
import { setTestSession } from '../helpers/session.ts'
import { addStamps } from '@/app/actions/stamps.ts'
import { getBangkokStartOfDay } from '../tier1_features/revenue_timezone.test.ts'

export async function runRevenueBoundariesTier2Tests() {
  console.log('\n--- Tier 2: Revenue & Timezone Boundary Tests ---')

  // T2.4.1: Precise midnight boundary test (23:59:59.999 Bangkok time yesterday)
  await runTest('T2.4.1: Transaction at 23:59:59.999 yesterday Bangkok is strictly excluded from today', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()

    const bkkTodayMidnight = getBangkokStartOfDay()
    const yesterdayLastMs = new Date(bkkTodayMidnight.getTime() - 1)

    const tx = await prisma.transaction.create({
      data: {
        userId: cust.id,
        type: 'EARN',
        cups: 1,
        totalAmount: 50,
        createdAt: yesterdayLastMs,
        createdBy: admin.id,
      },
    })

    const todayAgg = await prisma.transaction.aggregate({
      where: {
        id: tx.id,
        createdAt: { gte: bkkTodayMidnight },
        type: 'EARN',
      },
      _sum: { totalAmount: true },
    })

    assertEqual(todayAgg._sum.totalAmount ?? 0, 0, 'Must not be counted in today')
  })

  // T2.4.2: Precise midnight boundary test (00:00:00.000 Bangkok time today)
  await runTest('T2.4.2: Transaction at 00:00:00.000 today Bangkok is strictly included in today', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()

    const bkkTodayMidnight = getBangkokStartOfDay()

    const tx = await prisma.transaction.create({
      data: {
        userId: cust.id,
        type: 'EARN',
        cups: 1,
        totalAmount: 55,
        createdAt: bkkTodayMidnight,
        createdBy: admin.id,
      },
    })

    const todayAgg = await prisma.transaction.aggregate({
      where: {
        id: tx.id,
        createdAt: { gte: bkkTodayMidnight },
        type: 'EARN',
      },
      _sum: { totalAmount: true },
    })

    assertEqual(todayAgg._sum.totalAmount, 55, 'Must be counted in today')
  })

  // T2.4.3: Large catering order total amount
  await runTest('T2.4.3: High-volume order (50 cups, 2500 Baht) handles revenue precision', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const item = await createTestMenuItem({ name: 'TEST_E2E_LargeOrderCoffee', price: 50 })
    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append(
      'itemsJson',
      JSON.stringify([{ menuItemId: item.id, name: item.name, price: 50, quantity: 50 }])
    )

    const res = await addStamps(undefined, fd)
    assertTrue(res.success === true)

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'EARN', totalAmount: 2500 },
    })
    assertTrue(tx !== null, 'Large order transaction must be persisted accurately')
    assertEqual(tx?.totalAmount, 2500)
    assertEqual(tx?.cups, 50)
  })

  // T2.4.4: Decimal price calculation
  await runTest('T2.4.4: Items with float prices accumulate subtotal without rounding corruption', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const item = await createTestMenuItem({ name: 'TEST_E2E_DecimalPrice', price: 45.5 })
    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append(
      'itemsJson',
      JSON.stringify([{ menuItemId: item.id, name: item.name, price: 45.5, quantity: 2 }])
    )

    const res = await addStamps(undefined, fd)
    assertTrue(res.success === true)

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'EARN' },
    })
    assertEqual(tx?.totalAmount, 91, '45.5 * 2 = 91 Baht')
  })

  // T2.4.5: Transaction with notes containing special Thai & emoji characters
  await runTest('T2.4.5: Transaction notes containing emojis and Thai unicode are persisted safely', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const specialNote = 'หวานน้อย 25% ☕✨ ชาไทยเข้มข้น + บุกไข่มุก'
    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append('cups', '1')
    fd.append('totalAmount', '60')
    fd.append('note', specialNote)

    await addStamps(undefined, fd)

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'EARN', note: specialNote },
    })
    assertTrue(tx !== null, 'Special characters in note must be preserved')
    assertEqual(tx?.note, specialNote)
  })
}
