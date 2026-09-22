// tests/tier1_features/stamps.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin } from '../helpers/db.ts'
import { setTestSession, clearTestSession } from '../helpers/session.ts'
import { addStamps, redeemFreeCup } from '@/app/actions/stamps.ts'

export async function runStampsTier1Tests() {
  console.log('\n--- Tier 1: Stamps & Concurrency Tests ---')

  // T1.2.1: Earn stamps happy path
  await runTest('T1.2.1: Admin adds stamps to customer (happy path)', async () => {
    const admin = await createTestAdmin({ role: 'ADMIN' })
    const cust = await createTestCustomer({ stamps: 0, totalCups: 0 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append('cups', '3')
    fd.append('note', 'Espresso 3 cups')

    const res = await addStamps(undefined, fd)
    assertTrue(res.success === true, 'addStamps should return success: true')

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.stamps, 3, 'Customer stamps should be 3')
    assertEqual(updated?.totalCups, 3, 'Customer totalCups should be 3')

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'EARN' },
    })
    assertTrue(tx !== null, 'EARN transaction should be recorded')
    assertEqual(tx?.cups, 3)
  })

  // T1.2.2: Stamps reach STAMPS_REQUIRED (10) -> auto-grant 1 free cup
  await runTest('T1.2.2: Earning 10 stamps auto-grants 1 freeRedeem and resets stamps', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ stamps: 8, freeRedeems: 0, totalCups: 8 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append('cups', '4') // 8 + 4 = 12 -> 1 freeRedeem, 2 stamps left

    const res = await addStamps(undefined, fd)
    assertTrue(res.success === true)

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.freeRedeems, 1, 'Should auto-grant 1 free cup')
    assertEqual(updated?.stamps, 2, 'Stamps should wrap around to 2 (12 % 10)')
    assertEqual(updated?.totalCups, 12, 'Total cups should be 12')
  })

  // T1.2.3: Redeem free cup happy path
  await runTest('T1.2.3: Admin redeems free cup for customer with balance >= 1', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ freeRedeems: 1 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('userId', cust.id)

    const res = await redeemFreeCup(undefined, fd)
    assertTrue(res.success === true, 'Redeem should succeed')

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.freeRedeems, 0, 'freeRedeems should decrement to 0')

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'REDEEM' },
    })
    assertTrue(tx !== null, 'REDEEM transaction should be recorded')
    assertEqual(tx?.cups, 1)
  })

  // T1.2.4: Redeem rejected when freeRedeems is 0
  await runTest('T1.2.4: Redeem rejected when freeRedeems is 0', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ freeRedeems: 0 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('userId', cust.id)

    const res = await redeemFreeCup(undefined, fd)
    assertEqual(res.message, 'ลูกค้าไม่มีสิทธิ์แลกน้ำฟรี')

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.freeRedeems, 0, 'freeRedeems should remain 0')
  })

  // T1.2.5: Guard redeemFreeCup concurrency (F2)
  await runTest('T1.2.5: Concurrency lock prevents negative freeRedeems on race condition (F2)', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ freeRedeems: 1 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    // Simulate 5 parallel concurrent requests racing for the same single free cup
    const concurrentRequests = Array.from({ length: 5 }).map(() => {
      const fd = new FormData()
      fd.append('userId', cust.id)
      return redeemFreeCup(undefined, fd)
    })

    const results = await Promise.all(concurrentRequests)
    const successes = results.filter((r) => r.success === true)

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })

    // CRITICAL: freeRedeems can NEVER be less than 0!
    assertTrue(
      (updated?.freeRedeems ?? 0) >= 0,
      `freeRedeems dropped below 0: ${updated?.freeRedeems}`
    )
    assertEqual(
      successes.length,
      1,
      `Expected exactly 1 successful redemption, but ${successes.length} succeeded!`
    )
    assertEqual(updated?.freeRedeems, 0, 'Customer freeRedeems must stop at 0')
  })

  // T1.2.6: Non-admin rejected from redeemFreeCup
  await runTest('T1.2.6: Unauthenticated or customer caller rejected from redeemFreeCup', async () => {
    const cust = await createTestCustomer({ freeRedeems: 2 })
    clearTestSession()

    const fd = new FormData()
    fd.append('userId', cust.id)

    const res = await redeemFreeCup(undefined, fd)
    assertEqual(res.message, 'ไม่มีสิทธิ์ดำเนินการ')

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.freeRedeems, 2, 'Balance must remain unchanged')
  })

  // T1.2.7: Admin redeems free cup specifying menuItem and custom note
  await runTest('T1.2.7: Admin redeems free cup specifying menuItem and custom note', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ freeRedeems: 1 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const menuItem = await prisma.menuItem.create({
      data: {
        name: 'มัทฉะลาเต้เย็น-TEST',
        price: 65,
        category: 'ชา',
        isActive: true,
      },
    })

    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append('menuItemId', menuItem.id)
    fd.append('menuItemName', menuItem.name)
    fd.append('note', 'หวานน้อย 50%')

    const res = await redeemFreeCup(undefined, fd)
    assertTrue(res.success === true, 'Redeem with menu should succeed')
    assertEqual(res.message, "แลกฟรี 'มัทฉะลาเต้เย็น-TEST' สำเร็จ! 🎉")

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.freeRedeems, 0, 'freeRedeems should decrement to 0')

    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'REDEEM' },
      include: { items: true },
    })
    assertTrue(tx !== null, 'REDEEM transaction should exist')
    assertEqual(tx?.cups, 1)
    assertEqual(tx?.totalAmount, 0)
    assertEqual(tx?.note, 'แลกฟรี: มัทฉะลาเต้เย็น-TEST (หวานน้อย 50%)')
    assertEqual(tx?.items.length, 1)
    assertEqual(tx?.items[0].name, 'มัทฉะลาเต้เย็น-TEST')
    assertEqual(tx?.items[0].price, 65)
    assertEqual(tx?.items[0].quantity, 1)
    assertEqual(tx?.items[0].subtotal, 0)

    // Cleanup created menu item and transactions
    if (tx?.id) {
      await prisma.transactionItem.deleteMany({ where: { transactionId: tx.id } })
      await prisma.transaction.deleteMany({ where: { id: tx.id } })
    }
    await prisma.menuItem.delete({ where: { id: menuItem.id } })
  })
}
