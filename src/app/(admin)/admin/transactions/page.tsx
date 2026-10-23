import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import TransactionListClient, { TransactionWithDetails } from '@/components/admin/TransactionListClient'
import { getBangkokDateString } from '@/lib/utils'

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>
}) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const params = await searchParams
  const todayStr = getBangkokDateString()

  const [rawTransactions, menuItems] = await Promise.all([
    prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 500,
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
    <div className="p-4 sm:p-6 pb-24 sm:pb-8 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-gray-900">
            ประวัติธุรกรรมและการขาย
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            ตรวจสอบรายการบิลแยกตามวัน ค้นหาออเดอร์ หรือแก้ไขรายการย้อนหลัง
          </p>
        </div>
        {isSuperAdmin && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-200/80">
            สิทธิ์ตรวจสอบ Super Admin
          </span>
        )}
      </div>

      <TransactionListClient
        transactions={transactions}
        menuItems={menuItems}
        isSuperAdmin={isSuperAdmin}
        initialPeriod={params.period}
        initialDate={params.date}
        todayStr={todayStr}
      />
    </div>
  )
}
