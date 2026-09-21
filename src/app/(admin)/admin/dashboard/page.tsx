import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function AdminDashboardPage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0))

  // Stats
  const [
    totalCustomers,
    todayTransactions,
    todayRevenue,
    todayEarnedCups,
    todayItems,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.transaction.count({
      where: { createdAt: { gte: todayStart } },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: todayStart }, type: 'EARN' },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: todayStart }, type: 'EARN' },
      _sum: { cups: true },
    }),
    prisma.transactionItem.findMany({
      where: {
        transaction: {
          createdAt: { gte: todayStart },
          type: 'EARN',
        },
      },
      select: {
        name: true,
        quantity: true,
        subtotal: true,
      },
    }),
  ])

  // คำนวณยอดขายรายเมนูวันนี้
  const salesByMenuMap = new Map<string, { name: string; cups: number; revenue: number }>()
  for (const item of todayItems) {
    const existing = salesByMenuMap.get(item.name)
    if (existing) {
      existing.cups += item.quantity
      existing.revenue += item.subtotal
    } else {
      salesByMenuMap.set(item.name, {
        name: item.name,
        cups: item.quantity,
        revenue: item.subtotal,
      })
    }
  }

  const salesByMenu = Array.from(salesByMenuMap.values()).sort((a, b) => b.cups - a.cups)
  const todayTotalCupsCount = todayEarnedCups._sum.cups ?? 0
  const todayTotalRevenueAmount = todayRevenue._sum.totalAmount ?? 0

  // Recent transactions with items
  const recentTx = await prisma.transaction.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, username: true } },
      items: { select: { name: true, quantity: true } },
    },
  })

  // Top customers
  const topCustomers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { totalCups: 'desc' },
    take: 5,
    select: { name: true, username: true, totalCups: true, stamps: true, freeRedeems: true },
  })

  const stats = [
    {
      label: 'ยอดขายวันนี้',
      value: `${todayTotalRevenueAmount.toLocaleString()} ฿`,
      icon: '💰',
      color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    },
    {
      label: 'แก้วที่ขายวันนี้',
      value: `${todayTotalCupsCount} แก้ว`,
      icon: '☕',
      color: 'bg-amber-50 text-amber-800 border-amber-200',
    },
    {
      label: 'บิลวันนี้',
      value: `${todayTransactions} บิล`,
      icon: '📋',
      color: 'bg-blue-50 text-blue-800 border-blue-200',
    },
    {
      label: 'ลูกค้าทั้งหมด',
      value: `${totalCustomers} คน`,
      icon: '👥',
      color: 'bg-purple-50 text-purple-800 border-purple-200',
    },
  ]

  return (
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            📊 ภาพรวมและยอดขายวันนี้
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
        <Link
          href="/admin/add-stamp"
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm sm:text-base px-6 py-3 rounded-xl transition shadow-sm text-center flex items-center justify-center gap-2"
        >
          <span>☕</span> ให้แต้ม / บันทึกขาย
        </Link>
      </div>

      {/* 4 Stats Cards with Larger Numbers and Clear Text */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-2xl p-4 sm:p-5 ${s.color} border shadow-xs transition hover:shadow-sm`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-2xl sm:text-3xl">{s.icon}</span>
            </div>
            <p className="text-2xl sm:text-3xl font-black tracking-tight mt-1">{s.value}</p>
            <p className="text-xs sm:text-sm font-semibold opacity-85 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* 🍹 ยอดขายตามเมนูวันนี้ (Today's Menu Sales) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-black text-gray-900 text-base sm:text-lg flex items-center gap-2">
              🍹 ยอดขายตามเมนูวันนี้
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              รวม <span className="font-bold text-emerald-700">{todayTotalCupsCount} แก้ว</span> · ยอดขาย{' '}
              <span className="font-bold text-emerald-700">{todayTotalRevenueAmount.toLocaleString()} บาท</span>
            </p>
          </div>
          <Link
            href="/admin/menu"
            className="text-xs sm:text-sm text-emerald-600 font-bold hover:text-emerald-700 hover:underline bg-emerald-50 px-3 py-1.5 rounded-lg"
          >
            จัดการเมนู →
          </Link>
        </div>

        {salesByMenu.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-gray-50/50 rounded-2xl">
            <span className="text-3xl">☕</span>
            <p className="text-base font-bold text-gray-600 mt-2">ยังไม่มีการขายเมนูในวันนี้</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              เมื่อบันทึกการขายที่หน้า "ให้แต้ม" ข้อมูลจะสรุปที่นี่ทันที
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {salesByMenu.map((item, index) => {
              const percentage = todayTotalCupsCount > 0 ? (item.cups / todayTotalCupsCount) * 100 : 0
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm sm:text-base">
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-6 text-center font-black text-sm sm:text-base text-gray-400 flex-shrink-0">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                      </span>
                      <span className="font-bold text-gray-900 truncate">{item.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-black text-emerald-700">{item.cups} แก้ว</span>
                      <span className="text-xs sm:text-sm font-semibold text-gray-500 ml-2">
                        ({item.revenue.toLocaleString()} ฿)
                      </span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden ml-8">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Grid: Top Customers & Recent Transactions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Top Customers */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
              <span>🏆</span> ลูกค้าสะสมแต้มสูงสุด
            </h2>
            <Link href="/admin/leaderboard" className="text-emerald-600 text-xs sm:text-sm font-semibold hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.username} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-lg w-7 text-center font-bold text-gray-400 flex-shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-bold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">แต้ม {c.stamps}/{STAMPS_REQUIRED} แก้ว</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm sm:text-base font-black text-emerald-700">{c.totalCups} แก้ว</p>
                  {c.freeRedeems > 0 && (
                    <span className="inline-block text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full mt-0.5">
                      🎁 ฟรี ×{c.freeRedeems}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-1.5">
              <span>📋</span> รายการล่าสุด
            </h2>
            <Link href="/admin/transactions" className="text-emerald-600 text-xs sm:text-sm font-semibold hover:underline">
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="space-y-3">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-start gap-3 py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-xl mt-0.5">{tx.type === 'EARN' ? '☕' : '🎁'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{tx.user.name}</p>
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    {tx.items.length > 0
                      ? tx.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')
                      : tx.note || 'ซื้อเครื่องดื่ม'}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={`font-black text-sm sm:text-base ${tx.type === 'EARN' ? 'text-emerald-700' : 'text-amber-600'}`}>
                    {tx.type === 'EARN' ? `+${tx.cups} แก้ว` : 'แลกฟรี'}
                  </span>
                  {tx.totalAmount > 0 && (
                    <p className="text-xs font-semibold text-gray-600 mt-0.5">{tx.totalAmount.toLocaleString()} ฿</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
