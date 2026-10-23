'use client'

import { useState, useMemo } from 'react'
import {
  Search,
  X,
  Pencil,
  History,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import {
  formatTimeOnly,
  getBangkokDateString,
  shiftBangkokDateString,
  formatThaiDateFull,
  formatThaiDateShort,
  type DashboardPeriod,
} from '@/lib/utils'
import EditOrderModal, { TransactionData, MenuItemOption } from './EditOrderModal'
import OrderAuditModal, { EditLogItem } from './OrderAuditModal'

export interface TransactionWithDetails extends TransactionData {
  editLogs: EditLogItem[]
}

interface TransactionListClientProps {
  transactions: TransactionWithDetails[]
  menuItems: MenuItemOption[]
  isSuperAdmin: boolean
  initialPeriod?: string
  initialDate?: string
  todayStr: string
}

type FilterType = 'all' | 'earn' | 'redeem' | 'edited'

export default function TransactionListClient({
  transactions,
  menuItems,
  isSuperAdmin,
  initialPeriod,
  initialDate,
  todayStr,
}: TransactionListClientProps) {
  const yesterdayStr = useMemo(() => shiftBangkokDateString(todayStr, -1), [todayStr])

  const [period, setPeriod] = useState<DashboardPeriod>(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      if (initialDate === todayStr) return 'today'
      if (initialDate === yesterdayStr) return 'yesterday'
      return 'date'
    }
    if (
      initialPeriod === 'today' ||
      initialPeriod === 'yesterday' ||
      initialPeriod === '7days' ||
      initialPeriod === 'month' ||
      initialPeriod === 'all'
    ) {
      return initialPeriod
    }
    return 'today'
  })

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      return initialDate
    }
    if (initialPeriod === 'yesterday') {
      return yesterdayStr
    }
    return todayStr
  })

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null)
  const [auditingTx, setAuditingTx] = useState<TransactionWithDetails | null>(null)

  const handleSelectPreset = (nextPeriod: DashboardPeriod) => {
    setPeriod(nextPeriod)
    if (nextPeriod === 'today') {
      setSelectedDateStr(todayStr)
    } else if (nextPeriod === 'yesterday') {
      setSelectedDateStr(yesterdayStr)
    }
  }

  const handleSelectDate = (dateVal: string) => {
    if (!dateVal) return
    setSelectedDateStr(dateVal)
    if (dateVal === todayStr) {
      setPeriod('today')
    } else if (dateVal === yesterdayStr) {
      setPeriod('yesterday')
    } else {
      setPeriod('date')
    }
  }

  const handleStepDay = (offset: number) => {
    const nextDate = shiftBangkokDateString(selectedDateStr, offset)
    if (nextDate > todayStr) return
    handleSelectDate(nextDate)
  }

  // 1. Filter by Date / Period
  const dateFilteredTransactions = useMemo(() => {
    if (period === 'all') return transactions

    const sevenDaysStartStr = shiftBangkokDateString(todayStr, -6)
    const monthPrefix = todayStr.slice(0, 7)

    return transactions.filter((tx) => {
      const txDateStr = getBangkokDateString(tx.createdAt)
      if (period === 'today') return txDateStr === todayStr
      if (period === 'yesterday') return txDateStr === yesterdayStr
      if (period === 'date') return txDateStr === selectedDateStr
      if (period === '7days') return txDateStr >= sevenDaysStartStr && txDateStr <= todayStr
      if (period === 'month') return txDateStr.startsWith(monthPrefix)
      return true
    })
  }, [transactions, period, todayStr, yesterdayStr, selectedDateStr])

  // 2. Metrics for Selected Date/Period
  const earnCount = useMemo(
    () => dateFilteredTransactions.filter((t) => t.type === 'EARN').length,
    [dateFilteredTransactions]
  )
  const redeemCount = useMemo(
    () => dateFilteredTransactions.filter((t) => t.type === 'REDEEM').length,
    [dateFilteredTransactions]
  )
  const totalCups = useMemo(
    () =>
      dateFilteredTransactions
        .filter((t) => t.type === 'EARN')
        .reduce((s, t) => s + t.cups, 0),
    [dateFilteredTransactions]
  )
  const totalRevenue = useMemo(
    () =>
      dateFilteredTransactions
        .filter((t) => t.type === 'EARN')
        .reduce((s, t) => s + t.totalAmount, 0),
    [dateFilteredTransactions]
  )
  const editedCount = useMemo(
    () =>
      dateFilteredTransactions.filter((t) => t.editLogs && t.editLogs.length > 0).length,
    [dateFilteredTransactions]
  )

  // 3. Filter by Type & Search Term
  const filtered = useMemo(() => {
    return dateFilteredTransactions.filter((tx) => {
      if (filter === 'earn' && tx.type !== 'EARN') return false
      if (filter === 'redeem' && tx.type !== 'REDEEM') return false
      if (filter === 'edited' && (!tx.editLogs || tx.editLogs.length === 0)) return false

      if (search.trim()) {
        const term = search.trim().toLowerCase()
        const matchesName = tx.userName.toLowerCase().includes(term)
        const matchesUsername = tx.userUsername.toLowerCase().includes(term)
        const matchesCashier = tx.cashierName.toLowerCase().includes(term)
        const matchesItems = tx.items.some((i) => i.name.toLowerCase().includes(term))
        const matchesNote = tx.note ? tx.note.toLowerCase().includes(term) : false
        const matchesEditor = tx.editorName ? tx.editorName.toLowerCase().includes(term) : false

        return (
          matchesName ||
          matchesUsername ||
          matchesCashier ||
          matchesItems ||
          matchesNote ||
          matchesEditor
        )
      }

      return true
    })
  }, [dateFilteredTransactions, filter, search])

  // 4. Group by Date ("YYYY-MM-DD")
  const groupedByDate = useMemo(() => {
    const groups = new Map<
      string,
      {
        dateStr: string
        items: TransactionWithDetails[]
        dayRevenue: number
        dayCups: number
        dayRedeem: number
      }
    >()

    for (const tx of filtered) {
      const dStr = getBangkokDateString(tx.createdAt)
      let g = groups.get(dStr)
      if (!g) {
        g = { dateStr: dStr, items: [], dayRevenue: 0, dayCups: 0, dayRedeem: 0 }
        groups.set(dStr, g)
      }
      g.items.push(tx)
      if (tx.type === 'EARN') {
        g.dayRevenue += tx.totalAmount
        g.dayCups += tx.cups
      } else {
        g.dayRedeem += 1
      }
    }

    return Array.from(groups.values())
  }, [filtered])

  const periodTitle = useMemo(() => {
    if (period === 'today') return 'วันนี้'
    if (period === 'yesterday') return 'เมื่อวาน'
    if (period === 'date') return formatThaiDateShort(selectedDateStr)
    if (period === '7days') return '7 วันล่าสุด'
    if (period === 'month') return 'เดือนนี้'
    return 'ทั้งหมด'
  }, [period, selectedDateStr])

  const isNextDisabled = selectedDateStr >= todayStr
  const isSingleDayMode = period === 'today' || period === 'yesterday' || period === 'date'

  const presets: { key: DashboardPeriod; label: string }[] = [
    { key: 'today', label: 'วันนี้' },
    { key: 'yesterday', label: 'เมื่อวาน' },
    { key: '7days', label: '7 วัน' },
    { key: 'month', label: 'เดือนนี้' },
    { key: 'all', label: 'ทั้งหมด' },
  ]

  const typeTabs: { key: FilterType; label: string; count: number }[] = [
    { key: 'all', label: 'ทั้งหมด', count: dateFilteredTransactions.length },
    { key: 'earn', label: 'ซื้อสะสมแต้ม', count: earnCount },
    { key: 'redeem', label: 'แลกฟรี', count: redeemCount },
    ...(editedCount > 0 || filter === 'edited'
      ? [{ key: 'edited' as FilterType, label: 'แก้ไขแล้ว', count: editedCount }]
      : []),
  ]

  return (
    <div className="space-y-4">
      {/* Unified Control & Summary Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 space-y-3.5">
        {/* Row 1: Date Segmented Control & Compact Date Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="inline-flex items-center bg-gray-100/90 p-1 rounded-xl border border-gray-200/60 overflow-x-auto no-scrollbar">
            {presets.map((item) => {
              const isActive = period === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleSelectPreset(item.key)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => handleStepDay(-1)}
              title="วันก่อนหน้า"
              className="w-8 h-8 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border border-gray-200 flex items-center justify-center transition active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center">
              <Calendar
                className={`w-3.5 h-3.5 absolute left-2.5 pointer-events-none ${
                  isSingleDayMode ? 'text-emerald-600' : 'text-gray-400'
                }`}
              />
              <input
                type="date"
                value={selectedDateStr}
                max={todayStr}
                onChange={(e) => handleSelectDate(e.target.value)}
                title="เลือกวันที่"
                className={`pl-8 pr-2.5 h-8 rounded-lg text-xs font-semibold border transition focus:outline-none focus:ring-2 focus:ring-emerald-500/30 cursor-pointer ${
                  isSingleDayMode
                    ? 'bg-emerald-50/60 text-emerald-900 border-emerald-300 font-bold'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => handleStepDay(1)}
              disabled={isNextDisabled}
              title="วันถัดไป"
              className={`w-8 h-8 rounded-lg border flex items-center justify-center transition ${
                isNextDisabled
                  ? 'bg-gray-50 text-gray-300 border-gray-200/60 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 border-gray-200 active:scale-95'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Row 2: Search Input + Type Filter Pills on the same line */}
        <div className="flex flex-col md:flex-row md:items-center gap-2.5 pt-3 border-t border-gray-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อลูกค้า, เมนู, หรือพนักงาน..."
              className="w-full pl-9 pr-8 h-9 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {typeTabs.map((tab) => {
              const active = filter === tab.key
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setFilter(tab.key)}
                  className={`px-3 h-9 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
                    active
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[11px] ${
                      active ? 'bg-emerald-700 text-emerald-50' : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 3: Compact Inline Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-gray-100">
          <div className="bg-gray-50/80 rounded-xl px-3.5 py-2.5 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium truncate">ยอดขายสุทธิ ({periodTitle})</p>
            <p className="text-base sm:text-lg font-black text-emerald-700 mt-0.5">
              {totalRevenue.toLocaleString()} ฿
            </p>
          </div>
          <div className="bg-gray-50/80 rounded-xl px-3.5 py-2.5 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">แก้วที่ขายได้</p>
            <p className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
              {totalCups} แก้ว
            </p>
          </div>
          <div className="bg-gray-50/80 rounded-xl px-3.5 py-2.5 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">บิลซื้อสะสมแต้ม</p>
            <p className="text-base sm:text-lg font-black text-gray-900 mt-0.5">
              {earnCount} บิล
            </p>
          </div>
          <div className="bg-gray-50/80 rounded-xl px-3.5 py-2.5 border border-gray-100">
            <p className="text-xs text-gray-500 font-medium">แลกเครื่องดื่มฟรี</p>
            <p className="text-base sm:text-lg font-black text-amber-600 mt-0.5">
              {redeemCount} แก้ว
            </p>
          </div>
        </div>
      </div>

      {/* Transaction List Grouped by Date */}
      {groupedByDate.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-xs border border-gray-100 text-center py-12 px-4 space-y-2">
          <p className="text-sm font-bold text-gray-700">
            ไม่พบรายการธุรกรรมใน{periodTitle}
          </p>
          <p className="text-xs text-gray-400">
            ลองเปลี่ยนช่วงเวลาด้านบน หรือล้างคำค้นหา
          </p>
          {period !== 'all' && (
            <button
              type="button"
              onClick={() => handleSelectPreset('all')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition"
            >
              ดูธุรกรรมทั้งหมด ({transactions.length} รายการ)
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3.5">
          {groupedByDate.map((group) => (
            <div
              key={group.dateStr}
              className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden"
            >
              {/* Clean Daily Group Header */}
              <div className="bg-gray-50/90 border-b border-gray-100 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-800 text-xs sm:text-sm">
                    {formatThaiDateFull(group.dateStr)}
                  </span>
                  {group.dateStr === todayStr && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                      วันนี้
                    </span>
                  )}
                  {group.dateStr === yesterdayStr && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-200 text-gray-700">
                      เมื่อวาน
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2.5 text-xs font-medium text-gray-500">
                  <span>{group.items.length} รายการ</span>
                  <span>·</span>
                  <span>ขาย {group.dayCups} แก้ว</span>
                  {group.dayRedeem > 0 && (
                    <>
                      <span>·</span>
                      <span className="text-amber-600">แลกฟรี {group.dayRedeem}</span>
                    </>
                  )}
                  <span>·</span>
                  <span className="text-emerald-700 font-bold">
                    {group.dayRevenue.toLocaleString()} ฿
                  </span>
                </div>
              </div>

              {/* Transactions inside this day */}
              <div className="divide-y divide-gray-100">
                {group.items.map((tx) => {
                  const hasBeenEdited = Boolean(tx.editLogs && tx.editLogs.length > 0)
                  const latestLog = hasBeenEdited ? tx.editLogs[0] : null

                  return (
                    <div
                      key={tx.id}
                      className="px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/50 transition"
                    >
                      {/* Left side: details */}
                      <div className="flex items-start gap-3 min-w-0">
                        <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 font-mono text-xs font-semibold flex-shrink-0 mt-0.5">
                          {formatTimeOnly(tx.createdAt)}
                        </span>

                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-gray-900 text-sm">{tx.userName}</p>
                            <span className="text-xs text-gray-400">@{tx.userUsername}</span>

                            {tx.type === 'REDEEM' && (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80">
                                แลกเครื่องดื่มฟรี
                              </span>
                            )}

                            {hasBeenEdited && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">
                                <span>แก้ไขแล้ว</span>
                              </span>
                            )}
                          </div>

                          {/* Menu items breakdown */}
                          {tx.items.length > 0 ? (
                            <p className="text-xs text-gray-600">
                              {tx.items.map((item) => `${item.name} ×${item.quantity}`).join(' , ')}
                            </p>
                          ) : tx.note ? (
                            <p className="text-xs text-gray-500 italic">{tx.note}</p>
                          ) : null}

                          {/* Cashier & Audit info */}
                          <div className="flex items-center gap-3 flex-wrap text-xs text-gray-400">
                            <span>ผู้ทำรายการ: {tx.cashierName}</span>
                            {hasBeenEdited && isSuperAdmin && latestLog && (
                              <button
                                onClick={() => setAuditingTx(tx)}
                                className="text-purple-600 hover:text-purple-800 font-semibold hover:underline inline-flex items-center gap-1 transition"
                              >
                                <History className="w-3 h-3" />
                                <span>ดูประวัติแก้ไขโดย {latestLog.editorName}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right side: Amount & Action buttons */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                        <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                          <span
                            className={`font-bold text-sm ${
                              tx.type === 'EARN' ? 'text-gray-900' : 'text-amber-600'
                            }`}
                          >
                            {tx.type === 'EARN'
                              ? `${tx.totalAmount.toLocaleString()} ฿`
                              : '0 ฿ (แลกฟรี)'}
                          </span>
                          <span className="text-xs text-emerald-600 font-semibold">
                            {tx.type === 'EARN' ? `+${tx.cups} แต้ม` : 'ใช้ 10 แต้ม'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingTx(tx)}
                            className="px-2.5 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 text-xs font-semibold flex items-center gap-1 transition border border-gray-200"
                            title="แก้ไขออเดอร์นี้"
                          >
                            <Pencil className="w-3 h-3" />
                            <span>แก้ไข</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Order Modal */}
      {editingTx && (
        <EditOrderModal
          transaction={editingTx}
          menuItems={menuItems}
          onClose={() => setEditingTx(null)}
        />
      )}

      {/* Super Admin Audit Modal */}
      {auditingTx && (
        <OrderAuditModal
          transactionId={auditingTx.id}
          userName={auditingTx.userName}
          userUsername={auditingTx.userUsername}
          type={auditingTx.type}
          editLogs={auditingTx.editLogs}
          onClose={() => setAuditingTx(null)}
        />
      )}
    </div>
  )
}
