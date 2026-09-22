import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import StampCard from '@/components/customer/StampCard'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      username: true,
      stamps: true,
      totalCups: true,
      freeRedeems: true,
    },
  })

  if (!user) redirect('/login')

  // Get rank (leaderboard position)
  const rank = await prisma.user.count({
    where: {
      role: 'CUSTOMER',
      totalCups: { gt: user.totalCups },
    },
  })

  // Recent transactions
  const recentTx = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      items: { select: { name: true, quantity: true } },
    },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Header */}
      <header className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between shadow-md">
        <div>
          <p className="text-emerald-200 text-xs sm:text-sm font-medium">ยินดีต้อนรับคุณ</p>
          <h1 className="text-lg sm:text-xl font-black tracking-tight">{user.name}</h1>
        </div>
        <span className="text-3xl">🧋</span>
      </header>

      <main className="max-w-md mx-auto px-4 py-5 space-y-4 pb-12">
        {/* Stamp Card Component */}
        <StampCard
          stamps={user.stamps}
          stampsRequired={STAMPS_REQUIRED}
          freeRedeems={user.freeRedeems}
        />

        {/* Free Redeems Banner */}
        {user.freeRedeems > 0 && (
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-5 flex items-center gap-3.5 shadow-md">
            <span className="text-3xl sm:text-4xl">🎉</span>
            <div>
              <p className="font-black text-base sm:text-lg">มีสิทธิ์แลกน้ำฟรี {user.freeRedeems} แก้ว!</p>
              <p className="text-emerald-100 text-xs sm:text-sm font-medium mt-0.5">
                แจ้งชื่อกับพนักงานที่เคาน์เตอร์เพื่อแลกรับเครื่องดื่มฟรีได้เลย
              </p>
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-100 text-center">
            <span className="text-2xl">☕</span>
            <p className="text-3xl sm:text-4xl font-black text-emerald-700 mt-1">{user.totalCups}</p>
            <p className="text-gray-500 text-xs sm:text-sm font-bold mt-1">แก้วที่สะสมทั้งหมด</p>
          </div>
          <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xs border border-gray-100 text-center">
            <span className="text-2xl">🏆</span>
            <p className="text-3xl sm:text-4xl font-black text-amber-500 mt-1">#{rank + 1}</p>
            <p className="text-gray-500 text-xs sm:text-sm font-bold mt-1">อันดับนักดื่มของคุณ</p>
          </div>
        </div>

        {/* Quick Nav Links - Large Finger-Friendly Tiles */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/history', icon: '📋', label: 'ประวัติแต้ม' },
            { href: '/leaderboard', icon: '🏆', label: 'อันดับนักดื่ม' },
            { href: '/profile', icon: '👤', label: 'ข้อมูลส่วนตัว' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-3xl p-4 shadow-xs border border-gray-100 text-center hover:border-emerald-300 hover:bg-emerald-50/50 active:scale-95 transition flex flex-col items-center justify-center"
            >
              <span className="text-2xl sm:text-3xl mb-1">{item.icon}</span>
              <p className="text-xs sm:text-sm text-gray-800 font-bold whitespace-nowrap">{item.label}</p>
            </Link>
          ))}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-3xl shadow-xs border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
            <h2 className="font-black text-gray-900 text-sm sm:text-base">ธุรกรรมล่าสุด</h2>
            <Link href="/history" className="text-emerald-700 text-xs sm:text-sm font-bold hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          {recentTx.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">ยังไม่มีประวัติการซื้อ</p>
          ) : (
            <div className="space-y-3">
              {recentTx.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span className="text-lg flex-shrink-0">{tx.type === 'EARN' ? '☕' : '🎁'}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 truncate">
                        {tx.type === 'EARN' ? `ซื้อ ${tx.cups} แก้ว` : 'แลกน้ำฟรี 1 แก้ว'}
                      </p>
                      <p className="text-gray-400 text-[11px] truncate">
                        {tx.items.length > 0
                          ? tx.items.map((i) => `${i.name} x${i.quantity}`).join(', ')
                          : new Date(tx.createdAt).toLocaleDateString('th-TH', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-black text-sm flex-shrink-0 ${tx.type === 'EARN' ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {tx.type === 'EARN' ? `+${tx.cups} แต้ม` : '🆓 ฟรี'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logout */}
        <form action={logout}>
          <button
            type="submit"
            className="w-full text-center text-gray-400 hover:text-red-500 text-sm font-semibold py-3 transition"
          >
            ออกจากระบบ
          </button>
        </form>
      </main>
    </div>
  )
}
