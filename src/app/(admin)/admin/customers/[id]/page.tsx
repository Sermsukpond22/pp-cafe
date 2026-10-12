import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StampCard from '@/components/customer/StampCard'
import DeleteCustomerButton from '@/components/admin/DeleteCustomerButton'
import EditCustomerButton from '@/components/admin/EditCustomerButton'
import CustomerTransactionsClient, { CustomerTransactionItem } from '@/components/admin/CustomerTransactionsClient'
import { formatDate } from '@/lib/utils'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const [customer, menuItems, rawTransactions] = await Promise.all([
    prisma.user.findUnique({
      where: { id, role: 'CUSTOMER' },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        stamps: true,
        totalCups: true,
        freeRedeems: true,
        createdAt: true,
      },
    }),
    prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, price: true, category: true },
    }),
    prisma.transaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        admin: { select: { name: true } },
        updatedByAdmin: { select: { name: true, username: true } },
        editLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            editor: { select: { name: true, username: true } },
          },
        },
        items: { select: { id: true, menuItemId: true, name: true, quantity: true, price: true, subtotal: true } },
      },
    }),
  ])

  if (!customer) notFound()

  const rank = await prisma.user.count({
    where: { role: 'CUSTOMER', totalCups: { gt: customer.totalCups } },
  })

  const transactions: CustomerTransactionItem[] = rawTransactions.map((tx) => ({
    id: tx.id,
    userId: customer.id,
    userName: customer.name,
    userUsername: customer.username,
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

  return (
    <div className="p-4 md:p-6 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/customers" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
        <h1 className="text-xl font-bold text-gray-800">ข้อมูลลูกค้า</h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
              {customer.name.charAt(0)}
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{customer.name}</h2>
              <p className="text-gray-500 text-sm">@{customer.username}</p>
              {customer.phone && <p className="text-gray-400 text-sm">📞 {customer.phone}</p>}
            </div>
          </div>
          <EditCustomerButton customer={customer} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-xl font-bold text-emerald-600">{customer.totalCups}</p>
            <p className="text-xs text-gray-500">แก้วทั้งหมด</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xl font-bold text-amber-500">#{rank + 1}</p>
            <p className="text-xs text-gray-500">อันดับ</p>
          </div>
          <div className="bg-purple-50 rounded-xl p-3">
            <p className="text-xl font-bold text-purple-500">{customer.freeRedeems}</p>
            <p className="text-xs text-gray-500">แลกฟรี</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          สมาชิกตั้งแต่ {formatDate(customer.createdAt)}
        </p>
      </div>

      {/* Stamp Card */}
      <div className="mb-4">
        <StampCard stamps={customer.stamps} stampsRequired={STAMPS_REQUIRED} freeRedeems={customer.freeRedeems} />
      </div>

      {/* Give Stamps Button */}
      <Link
        href={`/admin/add-stamp?userId=${customer.id}`}
        className="block w-full bg-emerald-600 text-white text-center font-semibold py-3 rounded-xl hover:bg-emerald-700 transition mb-3 shadow-sm"
      >
        ☕ ให้แต้มลูกค้านี้
      </Link>

      {/* Super Admin Delete Button */}
      {session.role === 'SUPER_ADMIN' && (
        <div className="mb-4">
          <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
        </div>
      )}

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">ประวัติธุรกรรม</h2>
        <CustomerTransactionsClient
          transactions={transactions}
          menuItems={menuItems}
          isSuperAdmin={session.role === 'SUPER_ADMIN'}
        />
      </div>
    </div>
  )
}
