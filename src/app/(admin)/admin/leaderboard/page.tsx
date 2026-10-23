import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'

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

  return (
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-gray-900">
          อันดับลูกค้ายอดนิยม (Leaderboard)
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          จัดอันดับสมาชิกตามจำนวนแก้วที่ซื้อสะสมทั้งหมดในร้าน
        </p>
      </div>

      {/* Top 3 Podium Cards */}
      {customers.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
          {[
            { rank: 1, c: customers[0], badge: 'อันดับ 1 · แชมป์ยอดซื้อ', border: 'border-amber-300 bg-amber-50/40', badgeCls: 'bg-amber-100 text-amber-800' },
            { rank: 2, c: customers[1], badge: 'อันดับ 2', border: 'border-gray-200 bg-white', badgeCls: 'bg-gray-100 text-gray-700' },
            { rank: 3, c: customers[2], badge: 'อันดับ 3', border: 'border-gray-200 bg-white', badgeCls: 'bg-orange-50 text-orange-800' },
          ].map(({ rank, c, badge, border, badgeCls }) => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className={`rounded-2xl p-4 border shadow-xs hover:shadow-sm transition flex flex-col justify-between ${border}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-xs font-bold px-2.5 py-0.5 rounded-md ${badgeCls}`}>
                    {badge}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">@{c.username}</span>
                </div>
                <p className="text-base font-bold text-gray-900 truncate">{c.name}</p>
              </div>
              <div className="flex items-baseline justify-between pt-3 mt-3 border-t border-black/5">
                <div>
                  <span className="text-2xl font-black text-emerald-700">{c.totalCups}</span>
                  <span className="text-xs text-gray-500 font-semibold ml-1">แก้วสะสม</span>
                </div>
                <span className="text-xs font-semibold text-gray-600">
                  แต้ม {c.stamps}/{STAMPS_REQUIRED}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Full Ranked List */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {customers.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm font-medium">ยังไม่มีข้อมูลลูกค้า</p>
        ) : (
          customers.map((c, i) => {
            const pct = Math.min(100, Math.round((c.stamps / STAMPS_REQUIRED) * 100))
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 p-4 hover:bg-gray-50/60 transition"
              >
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="flex items-center gap-3.5 flex-1 min-w-0 group"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 group-hover:text-emerald-700 text-sm truncate transition">
                        {c.name}
                      </p>
                      <span className="text-xs text-gray-400">@{c.username}</span>
                      {c.freeRedeems > 0 && (
                        <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200/80 font-bold px-2 py-0.5 rounded">
                          แลกฟรี {c.freeRedeems}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 max-w-xs">
                      <div className="h-1.5 flex-1 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 font-medium shrink-0">
                        {c.stamps}/{STAMPS_REQUIRED} แต้ม
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm sm:text-base font-black text-gray-900">
                      {c.totalCups} แก้ว
                    </p>
                  </div>
                  <Link
                    href={`/admin/add-stamp?userId=${c.id}`}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1 transition border border-emerald-200/70"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">ให้แต้ม</span>
                  </Link>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
