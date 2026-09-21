import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function AdminLeaderboardPage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { totalCups: 'desc' },
    select: {
      id: true,
      name: true,
      username: true,
      totalCups: true,
      stamps: true,
      freeRedeems: true,
      createdAt: true,
    },
  })

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900">🏆 อันดับลูกค้า (Top Spender)</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">จัดอันดับตามจำนวนแก้วที่ซื้อสะสมตลอดกาล</p>
      </div>

      {/* Top 3 Podium */}
      {customers.length >= 3 && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 items-end">
          {/* 2nd Place */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 text-center border-2 border-slate-200 shadow-xs order-1">
            <span className="text-3xl sm:text-4xl">🥈</span>
            <p className="text-xs sm:text-sm font-bold text-gray-500 mt-1">อันดับ 2</p>
            <p className="text-sm sm:text-base font-black text-gray-900 truncate mt-0.5">{customers[1].name}</p>
            <p className="text-sm sm:text-base font-black text-slate-700 mt-1">{customers[1].totalCups} แก้ว</p>
          </div>

          {/* 1st Place */}
          <div className="bg-amber-50 rounded-3xl p-4 sm:p-5 text-center border-2 border-amber-300 shadow-sm order-2 -translate-y-2 scale-102">
            <span className="text-4xl sm:text-5xl">🥇</span>
            <p className="text-xs sm:text-sm font-black text-amber-700 mt-1">แชมป์ยอดซื้อ</p>
            <p className="text-base sm:text-lg font-black text-gray-900 truncate mt-0.5">{customers[0].name}</p>
            <p className="text-base sm:text-lg font-black text-amber-600 mt-1">{customers[0].totalCups} แก้ว</p>
          </div>

          {/* 3rd Place */}
          <div className="bg-white rounded-3xl p-3 sm:p-4 text-center border-2 border-amber-100 shadow-xs order-3">
            <span className="text-3xl sm:text-4xl">🥉</span>
            <p className="text-xs sm:text-sm font-bold text-gray-500 mt-1">อันดับ 3</p>
            <p className="text-sm sm:text-base font-black text-gray-900 truncate mt-0.5">{customers[2].name}</p>
            <p className="text-sm sm:text-base font-black text-amber-800 mt-1">{customers[2].totalCups} แก้ว</p>
          </div>
        </div>
      )}

      {/* Full Ranked List */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {customers.length === 0 ? (
          <p className="text-center text-gray-400 py-12 font-medium">ยังไม่มีข้อมูลลูกค้า</p>
        ) : (
          customers.map((c, i) => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="flex items-center gap-3.5 p-4 sm:p-5 hover:bg-emerald-50/40 transition active:bg-gray-50"
            >
              <span className="text-xl sm:text-2xl w-8 text-center font-black flex-shrink-0">
                {i < 3 ? medals[i] : <span className="text-gray-400 text-sm sm:text-base">{i + 1}</span>}
              </span>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{c.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  @{c.username} · แต้ม {c.stamps}/{STAMPS_REQUIRED} แก้ว
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm sm:text-base font-black text-emerald-700">{c.totalCups} แก้ว</p>
                {c.freeRedeems > 0 && (
                  <span className="inline-block text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full mt-0.5">
                    🎁 ฟรี {c.freeRedeems}
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
