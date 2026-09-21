import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import StampCard from '@/components/customer/StampCard'
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

  const customer = await prisma.user.findUnique({
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
  })

  if (!customer) notFound()

  const rank = await prisma.user.count({
    where: { role: 'CUSTOMER', totalCups: { gt: customer.totalCups } },
  })

  const transactions = await prisma.transaction.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      admin: { select: { name: true } },
      items: { select: { name: true, quantity: true } },
    },
  })

  return (
    <div className="p-4 md:p-6 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/customers" className="text-gray-400 hover:text-gray-600 text-xl">←</Link>
        <h1 className="text-xl font-bold text-gray-800">ข้อมูลลูกค้า</h1>
      </div>

      {/* Profile */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 border border-gray-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-xl">
            {customer.name.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{customer.name}</h2>
            <p className="text-gray-500 text-sm">@{customer.username}</p>
            {customer.phone && <p className="text-gray-400 text-sm">📞 {customer.phone}</p>}
          </div>
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
        href={`/admin/add-stamp`}
        className="block w-full bg-emerald-600 text-white text-center font-semibold py-3 rounded-xl hover:bg-emerald-700 transition mb-4 shadow-sm"
      >
        ☕ ให้แต้มลูกค้านี้
      </Link>

      {/* Transactions */}
      <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm">ประวัติธุรกรรม</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">ยังไม่มีธุรกรรม</p>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0 text-xs">
                <span className="text-lg mt-0.5">{tx.type === 'EARN' ? '☕' : '🎁'}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-gray-800">
                      {tx.type === 'EARN' ? `ซื้อ ${tx.cups} แก้ว` : 'แลกเครื่องดื่มฟรี'}
                    </p>
                    <span className={`font-bold ${tx.type === 'EARN' ? 'text-emerald-600' : 'text-amber-500'}`}>
                      {tx.type === 'EARN' ? `+${tx.cups} แต้ม` : '🆓'}
                    </span>
                  </div>

                  {tx.items.length > 0 && (
                    <div className="flex flex-wrap gap-1 my-1">
                      {tx.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-800 text-[11px] font-medium px-2 py-0.5 rounded-md"
                        >
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  )}

                  {tx.note && <p className="text-gray-500 italic mb-0.5">{tx.note}</p>}
                  <p className="text-[11px] text-gray-400">
                    {formatDate(tx.createdAt)} · พนักงาน: {tx.admin.name}
                    {tx.totalAmount > 0 && ` · ${tx.totalAmount.toLocaleString()} ฿`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
