import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default async function TransactionsPage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { name: true, username: true } },
      admin: { select: { name: true } },
      items: { select: { name: true, quantity: true, price: true, subtotal: true } },
    },
  })

  const earnCount = transactions.filter((t) => t.type === 'EARN').length
  const redeemCount = transactions.filter((t) => t.type === 'REDEEM').length
  const totalCups = transactions.filter((t) => t.type === 'EARN').reduce((s, t) => s + t.cups, 0)
  const totalRevenue = transactions.filter((t) => t.type === 'EARN').reduce((s, t) => s + t.totalAmount, 0)

  return (
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-5xl mx-auto space-y-5">
      <h1 className="text-xl font-bold text-gray-800">📋 ประวัติธุรกรรมและการขายทั้งหมด</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-black text-emerald-600">{totalRevenue.toLocaleString()} ฿</p>
          <p className="text-xs text-gray-500 mt-0.5">ยอดขายสะสม</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-black text-blue-600">{totalCups} แก้ว</p>
          <p className="text-xs text-gray-500 mt-0.5">แก้วที่ขายได้</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-black text-purple-600">{earnCount} บิล</p>
          <p className="text-xs text-gray-500 mt-0.5">รายการซื้อ</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-sm border border-gray-100">
          <p className="text-xl font-black text-amber-500">{redeemCount} แก้ว</p>
          <p className="text-xs text-gray-500 mt-0.5">แลกเครื่องดื่มฟรี</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {transactions.length === 0 ? (
          <p className="text-center text-gray-400 py-10">ยังไม่มีรายการธุรกรรม</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="p-4 flex items-center justify-between gap-3 hover:bg-gray-50/60 transition">
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{tx.type === 'EARN' ? '☕' : '🎁'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm">{tx.user.name}</p>
                    <span className="text-xs text-gray-400">(@{tx.user.username})</span>
                  </div>

                  {/* Menu items breakdown */}
                  {tx.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 my-1">
                      {tx.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="bg-emerald-50 text-emerald-800 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-emerald-100"
                        >
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                    </div>
                  ) : tx.note ? (
                    <p className="text-xs text-gray-500 my-0.5">{tx.note}</p>
                  ) : null}

                  <p className="text-[11px] text-gray-400">
                    {formatDate(tx.createdAt)} · พนักงาน: {tx.admin.name}
                  </p>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`font-bold text-sm ${tx.type === 'EARN' ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {tx.type === 'EARN' ? `+${tx.cups} แก้ว` : '🆓 แลกฟรี'}
                </p>
                {tx.totalAmount > 0 && (
                  <p className="text-xs font-semibold text-gray-600">{tx.totalAmount.toLocaleString()} ฿</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
