// tests/tier4_scenarios/cafe_day_workload.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin, createTestMenuItem } from '../helpers/db.ts'
import { setTestSession } from '../helpers/session.ts'
import { addCustomer } from '@/app/actions/auth.ts'
import { addStamps, redeemFreeCup } from '@/app/actions/stamps.ts'
import { getBangkokStartOfDay } from '../tier1_features/revenue_timezone.test.ts'

export async function runCafeDayWorkloadTier4Tests() {
  console.log('\n--- Tier 4: Real-World Cafe Day Scenarios ---')

  await runTest('T4.1: Comprehensive Cafe Day: Morning rush, lunch rush, loyalty auto-grant, afternoon redemption, closing dashboard audit', async () => {
    // ─── 1. Shop Opening: Admin setup ──────────────────────────────────────────
    const admin = await createTestAdmin({ name: 'Head Barista' })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const bkkToday = getBangkokStartOfDay()

    // Create menu items
    const latte = await createTestMenuItem({ name: 'TEST_E2E_CafeDay_Latte', price: 55, category: 'กาแฟ' })
    const thaiTea = await createTestMenuItem({ name: 'TEST_E2E_CafeDay_ThaiTea', price: 45, category: 'ชา' })

    // Onboard 2 walk-in customers
    const rand = Math.floor(100000 + Math.random() * 900000)
    const aliceUsername = `test_e2e_al${rand}`
    const bobUsername = `test_e2e_bo${rand}`

    const aliceFd = new FormData()
    aliceFd.append('username', aliceUsername)
    aliceFd.append('name', 'Alice In CoffeeLand')
    aliceFd.append('phone', '0811112222')
    aliceFd.append('password', 'alicepass')
    const aliceRes = await addCustomer(undefined, aliceFd)
    assertEqual(aliceRes.message, 'เพิ่มลูกค้าสำเร็จ')

    const bobFd = new FormData()
    bobFd.append('username', bobUsername)
    bobFd.append('name', 'Bob The Builder')
    bobFd.append('phone', '0822223333')
    bobFd.append('password', 'bobpass')
    const bobRes = await addCustomer(undefined, bobFd)
    assertEqual(bobRes.message, 'เพิ่มลูกค้าสำเร็จ')

    const alice = await prisma.user.findUnique({ where: { username: aliceUsername } })
    const bob = await prisma.user.findUnique({ where: { username: bobUsername } })
    assertTrue(alice !== null && bob !== null, 'Customers must be created')

    // ─── 2. Morning Rush (07:30 - 08:30 AM Bangkok time) ──────────────────────
    // Alice orders 3 manual cups @ 45 = 135 Baht
    const morningAliceFd = new FormData()
    morningAliceFd.append('userId', alice!.id)
    morningAliceFd.append('cups', '3')
    morningAliceFd.append('totalAmount', '135')
    morningAliceFd.append('note', 'Morning 3 manual Americanos')
    await addStamps(undefined, morningAliceFd)

    // Bob orders 2 Lattes via menu @ 55 = 110 Baht
    const morningBobFd = new FormData()
    morningBobFd.append('userId', bob.id)
    morningBobFd.append(
      'itemsJson',
      JSON.stringify([{ menuItemId: latte.id, name: latte.name, price: 55, quantity: 2 }])
    )
    await addStamps(undefined, morningBobFd)

    // Verify morning states
    const aliceM = await prisma.user.findUnique({ where: { id: alice.id } })
    assertEqual(aliceM?.stamps, 3)
    assertEqual(aliceM?.totalCups, 3)

    const bobM = await prisma.user.findUnique({ where: { id: bob.id } })
    assertEqual(bobM?.stamps, 2)
    assertEqual(bobM?.totalCups, 2)

    // ─── 3. Lunch Rush (12:30 PM): Alice buys 7 cups -> reaches 10! ───────────
    const lunchAliceFd = new FormData()
    lunchAliceFd.append('userId', alice.id)
    lunchAliceFd.append('cups', '7')
    lunchAliceFd.append('totalAmount', '315') // 7 cups @ 45 = 315
    lunchAliceFd.append('note', 'Office lunch treat')
    await addStamps(undefined, lunchAliceFd)

    const aliceL = await prisma.user.findUnique({ where: { id: alice.id } })
    // 3 + 7 = 10 -> stamps modulo 10 = 0, freeRedeems = 1, totalCups = 10
    assertEqual(aliceL?.stamps, 0, 'Alice stamps should reset to 0 upon reaching 10')
    assertEqual(aliceL?.freeRedeems, 1, 'Alice should be awarded 1 free beverage')
    assertEqual(aliceL?.totalCups, 10, 'Alice totalCups should be 10')

    // ─── 4. Afternoon Break (15:00 PM): Alice redeems free cup, Bob buys tea ──
    const redeemFd = new FormData()
    redeemFd.append('userId', alice.id)
    const redeemRes = await redeemFreeCup(undefined, redeemFd)
    assertTrue(redeemRes.success === true)

    const bobAfternoonFd = new FormData()
    bobAfternoonFd.append('userId', bob.id)
    bobAfternoonFd.append(
      'itemsJson',
      JSON.stringify([{ menuItemId: thaiTea.id, name: thaiTea.name, price: 45, quantity: 1 }])
    )
    await addStamps(undefined, bobAfternoonFd)

    const aliceA = await prisma.user.findUnique({ where: { id: alice.id } })
    assertEqual(aliceA?.freeRedeems, 0, 'Alice freeRedeems should now be 0')

    const bobA = await prisma.user.findUnique({ where: { id: bob.id } })
    assertEqual(bobA?.stamps, 3)
    assertEqual(bobA?.totalCups, 3)

    // ─── 5. Closing Time: Daily Analytics Reconciliation ──────────────────────
    const todayEarnTx = await prisma.transaction.findMany({
      where: {
        userId: { in: [alice.id, bob.id] },
        type: 'EARN',
        createdAt: { gte: bkkToday },
      },
    })

    const totalCupsEarned = todayEarnTx.reduce((sum, tx) => sum + tx.cups, 0)
    assertEqual(totalCupsEarned, 13, 'Total cups sold today: Alice(3+7) + Bob(2+1) = 13')

    const totalRevenue = todayEarnTx.reduce((sum, tx) => sum + tx.totalAmount, 0)
    // 135 + 110 + 315 + 45 = 605 Baht
    assertEqual(totalRevenue, 605, 'Total revenue today must equal 605 Baht')

    const todayRedeemTx = await prisma.transaction.findMany({
      where: {
        userId: { in: [alice.id, bob.id] },
        type: 'REDEEM',
        createdAt: { gte: bkkToday },
      },
    })
    assertEqual(todayRedeemTx.length, 1, 'Exactly 1 redemption today')
    assertEqual(todayRedeemTx[0].cups, 1)
    assertEqual(todayRedeemTx[0].totalAmount, 0)

    // Leaderboard ranking
    const topToday = await prisma.user.findMany({
      where: { id: { in: [alice.id, bob.id] } },
      orderBy: { totalCups: 'desc' },
    })
    assertEqual(topToday[0].id, alice.id, 'Alice must be #1 with 10 cups')
    assertEqual(topToday[1].id, bob.id, 'Bob must be #2 with 3 cups')
  })

  await runTest('T4.2: High-concurrency rush hour workload maintains ledger consistency', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    // Create 3 customers
    const c1 = await createTestCustomer()
    const c2 = await createTestCustomer()
    const c3 = await createTestCustomer()

    // 6 rapid fire orders across customers
    const orders = [
      { cust: c1, cups: 2, amount: 90 },
      { cust: c2, cups: 1, amount: 50 },
      { cust: c3, cups: 3, amount: 150 },
      { cust: c1, cups: 2, amount: 90 },
      { cust: c2, cups: 2, amount: 100 },
      { cust: c3, cups: 1, amount: 50 },
    ]

    await Promise.all(
      orders.map((o) => {
        const fd = new FormData()
        fd.append('userId', o.cust.id)
        fd.append('cups', String(o.cups))
        fd.append('totalAmount', String(o.amount))
        return addStamps(undefined, fd)
      })
    )

    const u1 = await prisma.user.findUnique({ where: { id: c1.id } })
    const u2 = await prisma.user.findUnique({ where: { id: c2.id } })
    const u3 = await prisma.user.findUnique({ where: { id: c3.id } })

    assertEqual(u1?.totalCups, 4, 'C1 total cups: 2+2=4')
    assertEqual(u2?.totalCups, 3, 'C2 total cups: 1+2=3')
    assertEqual(u3?.totalCups, 4, 'C3 total cups: 3+1=4')
  })
}
