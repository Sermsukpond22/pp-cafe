// tests/tier3_combinations/lifecycle_stamps_redeem.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin } from '../helpers/db.ts'
import { setTestSession } from '../helpers/session.ts'
import { addStamps, redeemFreeCup } from '@/app/actions/stamps.ts'

export async function runLifecycleStampsRedeemTier3Tests() {
  console.log('\n--- Tier 3: Cross-Feature: Stamp Accumulation & Redemption Lifecycle ---')

  await runTest('T3.1: Full cycle: 0 stamps -> buy 10 cups -> 1 freeRedeem granted -> redeem free cup -> balance 0', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer({ stamps: 0, freeRedeems: 0, totalCups: 0 })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    // Step 1: Buy 6 cups
    const fd1 = new FormData()
    fd1.append('userId', cust.id)
    fd1.append('cups', '6')
    fd1.append('totalAmount', '300')
    const res1 = await addStamps(undefined, fd1)
    assertTrue(res1.success === true)

    let state1 = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(state1?.stamps, 6)
    assertEqual(state1?.freeRedeems, 0)
    assertEqual(state1?.totalCups, 6)

    // Step 2: Buy 4 more cups (reaches 10 threshold)
    const fd2 = new FormData()
    fd2.append('userId', cust.id)
    fd2.append('cups', '4')
    fd2.append('totalAmount', '200')
    const res2 = await addStamps(undefined, fd2)
    assertTrue(res2.success === true)

    let state2 = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(state2?.stamps, 0, 'Stamps should reset to 0 after completing 10')
    assertEqual(state2?.freeRedeems, 1, 'Auto-grant 1 free cup')
    assertEqual(state2?.totalCups, 10, 'Total lifetime cups should be 10')

    // Step 3: Redeem the earned free cup
    const fdRedeem = new FormData()
    fdRedeem.append('userId', cust.id)
    const resRedeem = await redeemFreeCup(undefined, fdRedeem)
    assertTrue(resRedeem.success === true)

    let state3 = await prisma.user.findUnique({ where: { id: cust.id } })
    assertEqual(state3?.freeRedeems, 0, 'freeRedeems should now be 0')
    assertEqual(state3?.stamps, 0, 'Stamps remain 0')
    assertEqual(state3?.totalCups, 10, 'Total lifetime cups remain 10')

    // Step 4: Verify transaction ledger
    const transactions = await prisma.transaction.findMany({
      where: { userId: cust.id },
      orderBy: { createdAt: 'asc' },
    })
    assertEqual(transactions.length, 3, 'Must have 2 EARN and 1 REDEEM transactions')
    assertEqual(transactions[0].type, 'EARN')
    assertEqual(transactions[0].cups, 6)
    assertEqual(transactions[1].type, 'EARN')
    assertEqual(transactions[1].cups, 4)
    assertEqual(transactions[2].type, 'REDEEM')
    assertEqual(transactions[2].cups, 1)
  })
}
