import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

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
    <div className="min-h-screen bg-emerald-50">
      <header className="bg-emerald-600 text-white px-4 py-4 flex items-center gap-3 shadow-sm">
        <Link href="/dashboard" className="text-emerald-200 hover:text-white">←</Link>
        <h1 className="text-lg font-bold">ประวัติแต้ม & การสั่งซื้อ</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">
        {transactions.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">☕</p>
            <p>ยังไม่มีประวัติการซื้อ</p>
            <p className="text-sm mt-1">แจ้งชื่อหรือเบอร์ที่หน้าร้านเพื่อสะสมแต้มได้เลย!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div key={tx.id} className="bg-white rounded-2xl p-4 shadow-sm border border-emerald-50">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${tx.type === 'EARN' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
                    {tx.type === 'EARN' ? '☕' : '🎁'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-gray-900 text-sm">
                        {tx.type === 'EARN' ? `ซื้อเครื่องดื่ม ${tx.cups} แก้ว` : 'แลกเครื่องดื่มฟรี 1 แก้ว'}
                      </p>
                      <span className={`font-black text-sm ${tx.type === 'EARN' ? 'text-emerald-600' : 'text-amber-500'}`}>
                        {tx.type === 'EARN' ? `+${tx.cups} แต้ม` : '🆓 ฟรี'}
                      </span>
                    </div>

                    {/* Ordered Items */}
                    {tx.items.length > 0 && (
                      <div className="flex flex-wrap gap-1 my-1.5">
                        {tx.items.map((item, idx) => (
                          <span
                            key={idx}
                            className="bg-emerald-50 text-emerald-800 text-xs px-2 py-0.5 rounded-md font-medium"
                          >
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    )}

                    {tx.note && <p className="text-xs text-gray-500 italic mb-1">{tx.note}</p>}

                    <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                      <span>{formatDate(tx.createdAt)}</span>
                      {tx.totalAmount > 0 && (
                        <span className="font-semibold text-gray-600">{tx.totalAmount.toLocaleString()} ฿</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
