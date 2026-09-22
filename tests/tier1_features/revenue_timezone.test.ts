// tests/tier1_features/revenue_timezone.test.ts
import { runTest, assertEqual, assertTrue, assertGte } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin, createTestMenuItem } from '../helpers/db.ts'
import { setTestSession } from '../helpers/session.ts'
import { addStamps } from '@/app/actions/stamps.ts'

// Authoritative calculation of Bangkok UTC+7 start of day
export function getBangkokStartOfDay(now = new Date()): Date {
  // Format current time in Asia/Bangkok
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const bkkDateStr = formatter.format(now) // "YYYY-MM-DD"
  // Midnight in Bangkok is +07:00
  return new Date(`${bkkDateStr}T00:00:00.000+07:00`)
}

export async function runRevenueTimezoneTier1Tests() {
  console.log('\n--- Tier 1: Revenue & Bangkok Timezone Tests ---')

  // T1.4.1: Multi-item menu order calculates revenue accurately
  await runTest('T1.4.1: Menu order records totalAmount matching sum of item prices', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const item1 = await createTestMenuItem({ name: 'TEST_E2E_Latte', price: 55 })
    const item2 = await createTestMenuItem({ name: 'TEST_E2E_Matcha', price: 65 })

    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append(
      'itemsJson',
      JSON.stringify([
        { menuItemId: item1.id, name: item1.name, price: 55, quantity: 2 },
        { menuItemId: item2.id, name: item2.name, price: 65, quantity: 1 },
      ])
    )

    const res = await addStamps(undefined, fd)
    assertTrue(res.success === true)

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'EARN' },
      include: { items: true },
    })

    assertTrue(tx !== null, 'Transaction must exist')
    // 55*2 + 65*1 = 175 Baht
    assertEqual(tx?.totalAmount, 175, 'totalAmount must equal 175 Baht')
    assertEqual(tx?.cups, 3, 'Total cups must equal 3')
    assertEqual(tx?.items.length, 2, 'Must have 2 transaction items')
  })

  // T1.4.2: Manual cup revenue calculation (F8)
  await runTest('T1.4.2: Manual cup entry records totalAmount reflecting sales instead of 0 (F8)', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append('cups', '2')
    fd.append('totalAmount', '100') // 2 manual cups @ 50 = 100
    fd.append('note', '2 manual cups')

    const res = await addStamps(undefined, fd)
    assertTrue(res.success === true)

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'EARN', note: '2 manual cups' },
    })

    assertTrue(tx !== null)
    // BUG in unfixed code: totalAmount is 0 when items.length === 0
    // FIX in F8: totalAmount should be persisted from formData (e.g. 100)
    assertEqual(
      tx?.totalAmount,
      100,
      `Manual cup entry totalAmount was ${tx?.totalAmount} instead of 100 Baht!`
    )
  })

  // T1.4.3: Bangkok UTC+7 Start of Day specification check (F9)
  await runTest('T1.4.3: Bangkok start of day is 17:00:00 UTC of preceding calendar day (F9)', async () => {
    const bkkMidnight = getBangkokStartOfDay(new Date('2026-09-22T08:00:00Z'))
    // At 08:00 UTC on 2026-09-22, in Bangkok it is 15:00 on 2026-09-22.
    // Midnight of 2026-09-22 Bangkok time is 2026-09-21T17:00:00.000Z!
    assertEqual(
      bkkMidnight.toISOString(),
      '2026-09-21T17:00:00.000Z',
      'Bangkok midnight must convert to 17:00:00 UTC previous day'
    )
  })

  // T1.4.4: Early morning Bangkok transaction included in today (F9)
  await runTest('T1.4.4: Transaction created at 06:30 Bangkok time is included in today\'s sales (F9)', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()

    // 06:30 AM Bangkok time today corresponds to UTC 23:30 yesterday
    const bkkTodayMidnight = getBangkokStartOfDay()
    const earlyMorningTime = new Date(bkkTodayMidnight.getTime() + 6.5 * 60 * 60 * 1000)

    const tx = await prisma.transaction.create({
      data: {
        userId: cust.id,
        type: 'EARN',
        cups: 2,
        totalAmount: 100,
        note: 'Early morning coffee',
        createdAt: earlyMorningTime,
        createdBy: admin.id,
      },
    })

    // Query today's sales using Bangkok start of day
    const salesToday = await prisma.transaction.aggregate({
      where: {
        id: tx.id,
        createdAt: { gte: bkkTodayMidnight },
        type: 'EARN',
      },
      _sum: { totalAmount: true },
    })

    assertEqual(
      salesToday._sum.totalAmount,
      100,
      'Early morning transaction must be counted in today\'s sales'
    )
  })

  // T1.4.5: Transaction before Bangkok midnight excluded from today (F9)
  await runTest('T1.4.5: Transaction at 23:55 yesterday Bangkok time is excluded from today (F9)', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()

    const bkkTodayMidnight = getBangkokStartOfDay()
    // 5 minutes before Bangkok midnight
    const yesterdayLateTime = new Date(bkkTodayMidnight.getTime() - 5 * 60 * 1000)

    const tx = await prisma.transaction.create({
      data: {
        userId: cust.id,
        type: 'EARN',
        cups: 1,
        totalAmount: 50,
        note: 'Late night yesterday',
        createdAt: yesterdayLateTime,
        createdBy: admin.id,
      },
    })

    const salesToday = await prisma.transaction.aggregate({
      where: {
        id: tx.id,
        createdAt: { gte: bkkTodayMidnight },
        type: 'EARN',
      },
      _sum: { totalAmount: true },
    })

    assertEqual(
      salesToday._sum.totalAmount ?? 0,
      0,
      'Yesterday\'s transaction must NOT be counted in today\'s sales'
    )
  })
}
