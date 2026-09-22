// tests/tier3_combinations/menu_edit_order_revenue.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin, createTestMenuItem } from '../helpers/db.ts'
import { setTestSession } from '../helpers/session.ts'
import { addStamps } from '@/app/actions/stamps.ts'
import { getBangkokStartOfDay } from '../tier1_features/revenue_timezone.test.ts'

export async function runMenuEditOrderRevenueTier3Tests() {
  console.log('\n--- Tier 3: Menu Item Edit -> Order -> Revenue Flow ---')

  await runTest('T3.3: Edit menu item price -> Order with edited item -> Revenue aggregates new price', async () => {
    const admin = await createTestAdmin()
    const cust = await createTestCustomer()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    // 1. Create initial menu item at 45 Baht
    const item = await createTestMenuItem({ name: 'TEST_E2E_CaramelMilk', price: 45, category: 'นม' })

    // 2. Edit menu item to 55 Baht using updateMenuItem (F12)
    let updateMenuItemFn: any = null
    try {
      const menuModule = await import('@/app/actions/menu.ts')
      updateMenuItemFn = menuModule.updateMenuItem
    } catch {
      updateMenuItemFn = null
    }

    assertTrue(typeof updateMenuItemFn === 'function', 'updateMenuItem must be exported (F12)')

    const editFd = new FormData()
    editFd.append('id', item.id)
    editFd.append('name', 'TEST_E2E_CaramelMilk')
    editFd.append('price', '55') // Price increased to 55
    editFd.append('category', 'นม')

    await updateMenuItemFn(undefined, editFd)

    const updatedItem = await prisma.menuItem.findUnique({ where: { id: item.id } })
    assertEqual(updatedItem?.price, 55, 'Menu price should be updated to 55')

    // 3. Customer buys 2 cups of the updated menu item
    const orderFd = new FormData()
    orderFd.append('userId', cust.id)
    orderFd.append(
      'itemsJson',
      JSON.stringify([{ menuItemId: updatedItem!.id, name: updatedItem!.name, price: 55, quantity: 2 }])
    )

    const orderRes = await addStamps(undefined, orderFd)
    assertTrue(orderRes.success === true)

    // 4. Verify transaction records 55 * 2 = 110 Baht
    const tx = await prisma.transaction.findFirst({
      where: { userId: cust.id, type: 'EARN' },
      include: { items: true },
    })

    assertTrue(tx !== null)
    assertEqual(tx?.totalAmount, 110, 'Transaction totalAmount must be 110 Baht')
    assertEqual(tx?.items[0].price, 55, 'TransactionItem price must reflect updated price 55')
    assertEqual(tx?.items[0].subtotal, 110)

    // 5. Verify revenue query for today
    const bkkMidnight = getBangkokStartOfDay()
    const revSum = await prisma.transaction.aggregate({
      where: { id: tx!.id, createdAt: { gte: bkkMidnight } },
      _sum: { totalAmount: true },
    })
    assertEqual(revSum._sum.totalAmount, 110)
  })
}
