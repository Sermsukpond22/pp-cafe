import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TransactionListClient, { TransactionWithDetails } from '@/components/admin/TransactionListClient'

export default async function TransactionsPage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const [rawTransactions, menuItems] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: { select: { id: true, name: true, username: true } },
        admin: { select: { name: true } },
        updatedByAdmin: { select: { name: true, username: true } },
        editLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            editor: { select: { name: true, username: true } },
          },
        },
        items: {
          select: {
            id: true,
            menuItemId: true,
            name: true,
            quantity: true,
            price: true,
            subtotal: true,
          },
        },
      },
    }),
    prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, price: true, category: true },
    }),
  ])

  // Transform transactions for Client Component
  const transactions: TransactionWithDetails[] = rawTransactions.map((tx) => ({
    id: tx.id,
    userId: tx.userId,
    userName: tx.user.name,
    userUsername: tx.user.username,
    type: tx.type,
    cups: tx.cups,
    totalAmount: tx.totalAmount,
    note: tx.note,
    createdAt: tx.createdAt.toISOString(),
    cashierName: tx.admin.name,
    updatedAt: tx.updatedAt ? tx.updatedAt.toISOString() : null,
    editorName: tx.updatedByAdmin?.name || (tx.editLogs[0]?.editorName ?? null),
    items: tx.items.map((i) => ({
      id: i.id,
      menuItemId: i.menuItemId,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.subtotal,
    })),
    editLogs: tx.editLogs.map((log) => ({
      id: log.id,
      editedBy: log.editedBy,
      editorName: log.editorName,
      reason: log.reason,
      changesSummary: log.changesSummary,
      previousData: log.previousData,
      createdAt: log.createdAt.toISOString(),
      editor: log.editor
        ? {
            name: log.editor.name,
            username: log.editor.username,
          }
        : null,
    })),
  }))

  const isSuperAdmin = session.role === 'SUPER_ADMIN'

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">📋 ประวัติธุรกรรมและการขายทั้งหมด</h1>
        {isSuperAdmin && (
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            👑 สิทธิ์ตรวจสอบ Super Admin
          </span>
        )}
      </div>

      <TransactionListClient
        transactions={transactions}
        menuItems={menuItems}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  )
}
