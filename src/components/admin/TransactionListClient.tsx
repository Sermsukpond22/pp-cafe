'use client'

import { useState, useMemo } from 'react'
import { Search, X, Pencil, History } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import EditOrderModal, { TransactionData, MenuItemOption } from './EditOrderModal'
import OrderAuditModal, { EditLogItem } from './OrderAuditModal'

export interface TransactionWithDetails extends TransactionData {
  editLogs: EditLogItem[]
}

interface TransactionListClientProps {
  transactions: TransactionWithDetails[]
  menuItems: MenuItemOption[]
  isSuperAdmin: boolean
}

type FilterType = 'all' | 'earn' | 'redeem' | 'edited'

export default function TransactionListClient({
  transactions,
  menuItems,
  isSuperAdmin,
}: TransactionListClientProps) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null)
  const [auditingTx, setAuditingTx] = useState<TransactionWithDetails | null>(null)

  // Filtering
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      // Type filter
      if (filter === 'earn' && tx.type !== 'EARN') return false
      if (filter === 'redeem' && tx.type !== 'REDEEM') return false
      if (filter === 'edited' && (!tx.editLogs || tx.editLogs.length === 0)) return false

      // Search term
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
  }, [transactions, filter, search])

  // Statistics from all transactions
  const earnCount = transactions.filter((t) => t.type === 'EARN').length
  const redeemCount = transactions.filter((t) => t.type === 'REDEEM').length
  const totalCups = transactions.filter((t) => t.type === 'EARN').reduce((s, t) => s + t.cups, 0)
  const totalRevenue = transactions.filter((t) => t.type === 'EARN').reduce((s, t) => s + t.totalAmount, 0)
  const editedCount = transactions.filter((t) => t.editLogs && t.editLogs.length > 0).length

  return (
    <div className="space-y-5">
      {/* Stat Cards */}
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

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาตามชื่อลูกค้า, เมนู, พนักงาน, หรือผู้แก้ไข..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ทั้งหมด ({transactions.length})
          </button>
          <button
            onClick={() => setFilter('earn')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filter === 'earn'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ☕ การซื้อสะสมแต้ม ({earnCount})
          </button>
          <button
            onClick={() => setFilter('redeem')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition ${
              filter === 'redeem'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🎁 แลกฟรี ({redeemCount})
          </button>
          <button
            onClick={() => setFilter('edited')}
            className={`px-3 py-1.5 rounded-xl font-semibold transition flex items-center gap-1 ${
              filter === 'edited'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            <span>✏️ มีการแก้ไข</span>
            <span className="font-bold">({editedCount})</span>
          </button>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12 space-y-1">
            <p className="text-sm font-semibold">ไม่พบรายการธุรกรรมที่ตรงกับการค้นหา</p>
            <p className="text-xs text-gray-400">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : (
          filtered.map((tx) => {
            const hasBeenEdited = Boolean(tx.editLogs && tx.editLogs.length > 0)
            const latestLog = hasBeenEdited ? tx.editLogs[0] : null

            return (
              <div
                key={tx.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50/70 transition"
              >
                {/* Left side: details */}
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{tx.type === 'EARN' ? '☕' : '🎁'}</span>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{tx.userName}</p>
                      <span className="text-xs text-gray-400">(@{tx.userUsername})</span>

                      {/* Edited Badge */}
                      {hasBeenEdited && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                          <span>✏️</span>
                          <span>แก้ไขแล้ว</span>
                          {tx.editLogs.length > 1 && <span>({tx.editLogs.length})</span>}
                        </span>
                      )}
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
                      <p className="text-xs text-gray-600 my-0.5 italic">{tx.note}</p>
                    ) : null}

                    {/* Cashier & Date */}
                    <p className="text-[11px] text-gray-400">
                      {formatDate(tx.createdAt)} · พนักงาน: {tx.cashierName}
                    </p>

                    {/* Super Admin Audit Banner */}
                    {hasBeenEdited && isSuperAdmin && latestLog && (
                      <div className="flex items-center gap-2 pt-1 text-[11px]">
                        <span className="text-purple-700 font-semibold bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200/60">
                          🔍 แก้ไขล่าสุดโดย: <strong>{latestLog.editorName}</strong>
                        </span>
                        <button
                          onClick={() => setAuditingTx(tx)}
                          className="text-purple-600 hover:text-purple-800 font-bold underline flex items-center gap-0.5 transition"
                        >
                          <History className="w-3 h-3" />
                          <span>ดูประวัติการแก้ไข ({tx.editLogs.length})</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right side: Amount & Action buttons */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                  <div className="text-left sm:text-right">
                    <p
                      className={`font-black text-sm ${
                        tx.type === 'EARN' ? 'text-emerald-600' : 'text-amber-500'
                      }`}
                    >
                      {tx.type === 'EARN' ? `+${tx.cups} แก้ว` : '🆓 แลกฟรี'}
                    </p>
                    {tx.totalAmount > 0 && (
                      <p className="text-xs font-bold text-gray-700">
                        {tx.totalAmount.toLocaleString()} ฿
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    {/* Edit Order button for Admins */}
                    <button
                      onClick={() => setEditingTx(tx)}
                      className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-600 text-xs font-bold flex items-center gap-1 transition active:scale-95 border border-gray-200 hover:border-emerald-200"
                      title="แก้ไขออเดอร์นี้"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>แก้ไข</span>
                    </button>

                    {/* Super Admin History View button if edited */}
                    {hasBeenEdited && isSuperAdmin && (
                      <button
                        onClick={() => setAuditingTx(tx)}
                        className="px-2.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1 transition active:scale-95 border border-purple-200"
                        title="ดูประวัติการแก้ไข"
                      >
                        <History className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">ประวัติ</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

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
