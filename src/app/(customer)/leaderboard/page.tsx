import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { totalCups: 'desc' },
    select: { id: true, name: true, username: true, totalCups: true, stamps: true },
  })

  const myRank = customers.findIndex((c) => c.id === session.userId) + 1

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-black text-gray-900">อันดับนักดื่มประจำร้าน</h1>
        <p className="text-xs text-gray-500 mt-0.5">จัดอันดับตามจำนวนแก้วที่ซื้อสะสมทั้งหมด</p>
      </div>

      {myRank > 0 && (
        <div className="bg-emerald-700 text-white rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div>
            <p className="text-emerald-200 text-xs font-medium">อันดับปัจจุบันของคุณ</p>
            <p className="text-2xl font-black mt-0.5">อันดับ #{myRank}</p>
          </div>
          <span className="text-xs font-bold bg-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-600">
            จากสมาชิก {customers.length} คน
          </span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {customers.map((c, i) => {
          const isMe = c.id === session.userId
          return (
            <div
              key={c.id}
              className={`flex items-center gap-3 p-4 transition ${
                isMe ? 'bg-emerald-50/70' : ''
              }`}
            >
              <span
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                  i === 0
                    ? 'bg-amber-100 text-amber-800'
                    : i === 1
                    ? 'bg-gray-200 text-gray-800'
                    : i === 2
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {i + 1}
              </span>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {c.name}{' '}
                  {isMe && (
                    <span className="text-[11px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded ml-1">
                      คุณ
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  แต้มปัจจุบัน {c.stamps}/{STAMPS_REQUIRED}
                </p>
              </div>

              <p className="text-sm font-black text-emerald-700 shrink-0">{c.totalCups} แก้ว</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
