import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'

export default async function HistoryPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    include: {
      admin: { select: { name: true } },
      items: { select: { name: true, quantity: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-black text-gray-900">ประวัติแต้ม & การสั่งซื้อ</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          รายการสะสมแต้มและแลกเครื่องดื่มทั้งหมดของคุณ ({transactions.length} รายการ)
        </p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 border border-gray-100 shadow-xs">
          <p className="text-sm font-bold text-gray-600">ยังไม่มีประวัติการซื้อ</p>
          <p className="text-xs mt-1">แจ้งชื่อหรือเบอร์โทรศัพท์ที่หน้าร้านเพื่อเริ่มสะสมแต้ม</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {transactions.map((tx) => (
            <div key={tx.id} className="p-4 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-gray-900 text-sm">
                  {tx.type === 'EARN' ? `ซื้อเครื่องดื่ม ${tx.cups} แก้ว` : 'แลกเครื่องดื่มฟรี 1 แก้ว'}
                </p>
                <span
                  className={`font-bold text-xs px-2 py-0.5 rounded-md ${
                    tx.type === 'EARN'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {tx.type === 'EARN' ? `+${tx.cups} แต้ม` : 'ใช้ 10 แต้ม'}
                </span>
              </div>

              {tx.items.length > 0 && (
                <p className="text-xs text-gray-600">
                  {tx.items.map((item) => `${item.name} ×${item.quantity}`).join(' , ')}
                </p>
              )}

              {tx.note && <p className="text-xs text-gray-500 italic">{tx.note}</p>}

              <div className="flex items-center justify-between text-xs text-gray-400 pt-1">
                <span>{formatDate(tx.createdAt)}</span>
                {tx.totalAmount > 0 && (
                  <span className="font-bold text-gray-700">
                    {tx.totalAmount.toLocaleString()} ฿
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
