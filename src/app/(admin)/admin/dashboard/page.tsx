import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  resolveBangkokFilterRange,
  formatDate,
  formatTimeOnly,
} from '@/lib/utils'
import DashboardDateFilter from '@/components/admin/DashboardDateFilter'

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; date?: string }>
}) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const params = await searchParams
  const range = resolveBangkokFilterRange(params.period, params.date)
  const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

  const dateWhere =
    range.start && range.end
      ? { createdAt: { gte: range.start, lte: range.end } }
      : {}

  // Stats queries in parallel
  const [
    totalCustomers,
    periodTransactionsCount,
    earnTxCount,
    redeemTxCount,
    periodRevenue,
    periodEarnedCups,
    periodItems,
    distinctBuyers,
    periodTxList,
    topCustomers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.transaction.count({
      where: dateWhere,
    }),
    prisma.transaction.count({
      where: { ...dateWhere, type: 'EARN' },
    }),
    prisma.transaction.count({
      where: { ...dateWhere, type: 'REDEEM' },
    }),
    prisma.transaction.aggregate({
      where: { ...dateWhere, type: 'EARN' },
      _sum: { totalAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...dateWhere, type: 'EARN' },
      _sum: { cups: true },
    }),
    prisma.transactionItem.findMany({
      where: {
        transaction: {
          ...dateWhere,
          type: 'EARN',
        },
      },
      select: {
        name: true,
        quantity: true,
        subtotal: true,
      },
    }),
    prisma.transaction.findMany({
      where: dateWhere,
      distinct: ['userId'],
      select: { userId: true },
    }),
    prisma.transaction.findMany({
      where: dateWhere,
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, username: true } },
        items: { select: { name: true, quantity: true } },
      },
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { totalCups: 'desc' },
      take: 5,
      select: { name: true, username: true, totalCups: true, stamps: true, freeRedeems: true },
    }),
  ])

  // คำนวณยอดขายรายเมนูในช่วงเวลาที่เลือก
  const salesByMenuMap = new Map<string, { name: string; cups: number; revenue: number }>()
  for (const item of periodItems) {
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
  const periodTotalCupsCount = periodEarnedCups._sum.cups ?? 0
  const periodTotalRevenueAmount = periodRevenue._sum.totalAmount ?? 0
  const avgPerBill = earnTxCount > 0 ? Math.round(periodTotalRevenueAmount / earnTxCount) : 0

  const stats = [
    {
      label: 'ยอดขายรวม',
      value: `${periodTotalRevenueAmount.toLocaleString()} ฿`,
      sub: `เฉลี่ย ${avgPerBill.toLocaleString()} ฿ / บิล`,
      accent: 'text-emerald-700',
      dot: 'bg-emerald-500',
    },
    {
      label: 'แก้วที่ขายได้',
      value: `${periodTotalCupsCount} แก้ว`,
      sub: redeemTxCount > 0 ? `แลกฟรี ${redeemTxCount} แก้ว` : 'ไม่มีรายการแลกฟรี',
      accent: 'text-gray-900',
      dot: 'bg-amber-500',
    },
    {
      label: 'จำนวนบิล',
      value: `${periodTransactionsCount} บิล`,
      sub: `ซื้อ ${earnTxCount} · แลกฟรี ${redeemTxCount}`,
      accent: 'text-gray-900',
      dot: 'bg-blue-500',
    },
    {
      label: 'ลูกค้าที่ใช้บริการ',
      value: `${distinctBuyers.length} คน`,
      sub: `จากสมาชิก ${totalCustomers} คน`,
      accent: 'text-gray-900',
      dot: 'bg-purple-500',
    },
  ]

  const txFilterHref =
    range.period === 'date'
      ? `/admin/transactions?date=${range.activeDateStr}`
      : `/admin/transactions?period=${range.period}`

  return (
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 space-y-5 max-w-5xl mx-auto">
      {/* Unified Header & Filter Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-xs border border-gray-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-gray-900">
                ภาพรวมและยอดขาย
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                {range.titleLabel}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              {range.subtitleLabel}
            </p>
          </div>
          <Link
            href="/admin/add-stamp"
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition shadow-xs text-center flex items-center justify-center gap-1.5"
          >
            <span>+ บันทึกขาย / ให้แต้ม</span>
          </Link>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <DashboardDateFilter
            basePath="/admin/dashboard"
            period={range.period}
            activeDateStr={range.activeDateStr}
            todayStr={range.todayStr}
          />
        </div>
      </div>

      {/* 4 Clean KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 border border-gray-100 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <p className="text-xs font-semibold text-gray-500">{s.label}</p>
              </div>
              <p className={`text-2xl sm:text-3xl font-black tracking-tight mt-2 ${s.accent}`}>
                {s.value}
              </p>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-2 pt-2 border-t border-gray-50">
              {s.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ยอดขายตามเมนู (Menu Sales Breakdown) */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">
              สัดส่วนยอดขายตามเมนู
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              รวม {periodTotalCupsCount} แก้ว · {periodTotalRevenueAmount.toLocaleString()} บาท
            </p>
          </div>
          <Link
            href="/admin/menu"
            className="text-xs text-emerald-600 font-semibold hover:text-emerald-700 hover:underline"
          >
            จัดการเมนู →
          </Link>
        </div>

        {salesByMenu.length === 0 ? (
          <div className="text-center py-8 text-gray-400 bg-gray-50/50 rounded-xl">
            <p className="text-sm font-semibold text-gray-600">
              ไม่มีรายการขายเมนูใน{range.titleLabel}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              ลองเลือกช่วงเวลาอื่นจากตัวกรองด้านบน
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {salesByMenu.map((item, index) => {
              const percentage =
                periodTotalCupsCount > 0 ? (item.cups / periodTotalCupsCount) * 100 : 0
              return (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-5 text-xs font-bold text-gray-400 flex-shrink-0">
                        {index + 1}.
                      </span>
                      <span className="font-semibold text-gray-800 truncate">{item.name}</span>
                      <span className="text-xs text-gray-400 hidden sm:inline">
                        ({Math.round(percentage)}%)
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="font-bold text-gray-900">{item.cups} แก้ว</span>
                      <span className="text-xs text-gray-500 ml-1.5">
                        ({item.revenue.toLocaleString()} ฿)
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden ml-7">
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

      {/* Bottom Grid: Transactions & Top Customers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Transactions in Selected Period */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">
              รายการธุรกรรม ({range.titleLabel})
            </h2>
            <Link
              href={txFilterHref}
              className="text-emerald-600 text-xs font-semibold hover:underline"
            >
              ดูทั้งหมด ({periodTransactionsCount}) →
            </Link>
          </div>
          {periodTxList.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-xs">
              ไม่มีธุรกรรมใน{range.titleLabel}
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {periodTxList.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0">
                        {range.isSingleDay ? formatTimeOnly(tx.createdAt) : formatDate(tx.createdAt)}
                      </span>
                      <p className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                        {tx.user.name}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">
                      {tx.items.length > 0
                        ? tx.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')
                        : tx.note || 'ซื้อเครื่องดื่ม'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={`font-bold text-xs sm:text-sm ${
                        tx.type === 'EARN' ? 'text-emerald-700' : 'text-amber-600'
                      }`}
                    >
                      {tx.type === 'EARN' ? `+${tx.cups} แก้ว` : 'แลกฟรี'}
                    </span>
                    {tx.totalAmount > 0 && (
                      <p className="text-xs text-gray-500">
                        {tx.totalAmount.toLocaleString()} ฿
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">
              ลูกค้าสะสมแต้มสูงสุด
            </h2>
            <Link
              href="/admin/leaderboard"
              className="text-emerald-600 text-xs font-semibold hover:underline"
            >
              ดูทั้งหมด →
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {topCustomers.map((c, i) => (
              <div
                key={c.username}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span className="text-xs w-5 text-center font-bold text-gray-400 flex-shrink-0">
                  {i + 1}.
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    สะสมปัจจุบัน {c.stamps}/{STAMPS_REQUIRED} แต้ม
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm font-bold text-gray-900">
                    {c.totalCups} แก้ว
                  </p>
                  {c.freeRedeems > 0 && (
                    <span className="inline-block text-xs text-amber-700 font-semibold">
                      สิทธิ์แลกฟรี {c.freeRedeems}
                    </span>
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
