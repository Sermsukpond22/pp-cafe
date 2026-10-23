import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Phone, Calendar } from 'lucide-react'
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
      take: 30,
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
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-5xl mx-auto space-y-5">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/customers"
            className="w-9 h-9 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900">ข้อมูลสมาชิก</h1>
            <p className="text-xs text-gray-500">รายละเอียดแต้มสะสมและประวัติการสั่งซื้อรายบุคคล</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/add-stamp?userId=${customer.id}`}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl transition shadow-2xs flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>บันทึกขาย / ให้แต้ม</span>
          </Link>
          <EditCustomerButton customer={customer} />
        </div>
      </div>

      {/* Main 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (5 cols): Profile Summary + Stamp Card */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl shadow-xs p-5 border border-gray-100 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-200/60 rounded-2xl flex items-center justify-center text-emerald-700 font-black text-xl shrink-0">
                {customer.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-gray-900 text-base sm:text-lg truncate">
                  {customer.name}
                </h2>
                <p className="text-gray-400 text-xs">@{customer.username}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                  {customer.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-600" />
                      {customer.phone}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    สมัคร {formatDate(customer.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-gray-100 text-center">
              <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                <p className="text-lg font-black text-emerald-700">{customer.totalCups}</p>
                <p className="text-xs text-gray-500 font-medium">แก้วสะสม</p>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                <p className="text-lg font-black text-gray-900">#{rank + 1}</p>
                <p className="text-xs text-gray-500 font-medium">อันดับร้าน</p>
              </div>
              <div className="bg-gray-50/80 rounded-xl p-2.5 border border-gray-100">
                <p className="text-lg font-black text-amber-600">{customer.freeRedeems}</p>
                <p className="text-xs text-gray-500 font-medium">สิทธิ์แลกฟรี</p>
              </div>
            </div>
          </div>

          {/* Stamp Card */}
          <StampCard
            stamps={customer.stamps}
            stampsRequired={STAMPS_REQUIRED}
            freeRedeems={customer.freeRedeems}
          />

          {/* Super Admin Delete Button */}
          {session.role === 'SUPER_ADMIN' && (
            <DeleteCustomerButton customerId={customer.id} customerName={customer.name} />
          )}
        </div>

        {/* Right Column (7 cols): Customer Transactions */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-xs p-4 sm:p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div>
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">
                ประวัติธุรกรรมของลูกค้า
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                รายการสั่งซื้อและแลกเครื่องดื่มล่าสุด ({transactions.length} รายการ)
              </p>
            </div>
          </div>
          <CustomerTransactionsClient
            transactions={transactions}
            menuItems={menuItems}
            isSuperAdmin={session.role === 'SUPER_ADMIN'}
          />
        </div>
      </div>
    </div>
  )
}
