// tests/tier2_boundaries/stamps_concurrency.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin } from '../helpers/db.ts'
import { setTestSession } from '../helpers/session.ts'
import { addStamps, redeemFreeCup } from '@/app/actions/stamps.ts'

export async function runStampsConcurrencyTier2Tests() {
  console.log('\n--- Tier 2: Stamps Concurrency & Boundary Tests ---')

  // T2.2.1: Stress test concurrency: 10 parallel requests when freeRedeems = 1
  await runTest('T2.2.1: 10 parallel redeem requests on balance=1: exactly 1 succeeds, balance never negative', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ freeRedeems: 1 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const requests = Array.from({ length: 10 }).map(() => {
      const fd = new FormData()
      fd.append('userId', cust.id)
      return redeemFreeCup(undefined, fd)
    })

    const results = await Promise.all(requests)
    const successes = results.filter((r) => r.success === true)

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(
      updated?.freeRedeems,
      0,
      `Balance must be exactly 0, got ${updated?.freeRedeems}`
    )
    assertEqual(
      successes.length,
      1,
      `Exactly 1 should succeed under concurrency lock, but ${successes.length} succeeded`
    )
  })

  // T2.2.2: Zero cups rejected
  await runTest('T2.2.2: addStamps with 0 cups is rejected with error message', async () => {
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
    fd.append('cups', '0')

    const res = await addStamps(undefined, fd)
    assertEqual(res.message, 'กรุณาเลือกเมนูหรือระบุจำนวนแก้วอย่างน้อย 1 แก้ว')

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.stamps, 0)
  })

  // T2.2.3: Negative cups rejected
  await runTest('T2.2.3: addStamps with negative cups is rejected', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ stamps: 5 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('userId', cust.id)
    fd.append('cups', '-3')

    const res = await addStamps(undefined, fd)
    assertEqual(res.message, 'กรุณาเลือกเมนูหรือระบุจำนวนแก้วอย่างน้อย 1 แก้ว')

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.stamps, 5, 'Stamps should remain unchanged')
  })

  // T2.2.4: Malformed itemsJson handled gracefully
  await runTest('T2.2.4: Malformed itemsJson does not throw unhandled exception', async () => {
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
    fd.append('itemsJson', '<<<MALFORMED_JSON>>>')
    fd.append('cups', '2')

    // Should gracefully parse as empty array and fallback to cups
    const res = await addStamps(undefined, fd)
    assertTrue(res.success === true, 'Should succeed falling back to manual cups')

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(updated?.stamps, 2)
  })

  // T2.2.5: Concurrent stamp additions maintain accurate totalCups ledger
  await runTest('T2.2.5: Concurrent stamp additions correctly accumulate totalCups', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ totalCups: 0, stamps: 0 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    // 4 concurrent requests of 2 cups each
    const requests = Array.from({ length: 4 }).map((_, i) => {
      const fd = new FormData()
      fd.append('userId', cust.id)
      fd.append('cups', '2')
      fd.append('note', `Batch concurrent ${i}`)
      return addStamps(undefined, fd)
    })

    await Promise.all(requests)

    const updated = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(
      updated?.totalCups,
      8,
      `Expected totalCups=8 from 4x2 concurrent orders, got ${updated?.totalCups}`
    )
  })
}
