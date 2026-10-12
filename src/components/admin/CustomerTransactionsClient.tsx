'use client'

import { useState } from 'react'
import { Pencil, History } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import EditOrderModal, { TransactionData, MenuItemOption } from './EditOrderModal'
import OrderAuditModal, { EditLogItem } from './OrderAuditModal'

export interface CustomerTransactionItem extends TransactionData {
  editLogs: EditLogItem[]
}

interface CustomerTransactionsClientProps {
  transactions: CustomerTransactionItem[]
  menuItems: MenuItemOption[]
  isSuperAdmin: boolean
}

export default function CustomerTransactionsClient({
  transactions,
  menuItems,
  isSuperAdmin,
}: CustomerTransactionsClientProps) {
  const [editingTx, setEditingTx] = useState<TransactionData | null>(null)
  const [auditingTx, setAuditingTx] = useState<CustomerTransactionItem | null>(null)

  if (transactions.length === 0) {
    return <p className="text-gray-400 text-sm text-center py-4">ยังไม่มีธุรกรรม</p>
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map((tx) => {
          const hasBeenEdited = Boolean(tx.editLogs && tx.editLogs.length > 0)
          const latestLog = hasBeenEdited ? tx.editLogs[0] : null

          return (
            <div
              key={tx.id}
              className="p-3 bg-gray-50/70 hover:bg-gray-100/60 rounded-2xl border border-gray-100 transition space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tx.type === 'EARN' ? '☕' : '🎁'}</span>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">
                        {tx.type === 'EARN' ? `ซื้อ ${tx.cups} แก้ว` : 'แลกเครื่องดื่มฟรี'}
                      </p>
                      {hasBeenEdited && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                          ✏️ แก้ไขแล้ว
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {formatDate(tx.createdAt)} · พนักงาน: {tx.cashierName}
                      {tx.totalAmount > 0 && ` · ${tx.totalAmount.toLocaleString()} ฿`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setEditingTx(tx)}
                    className="p-1.5 rounded-lg bg-white hover:bg-emerald-50 hover:text-emerald-700 text-gray-500 border border-gray-200 hover:border-emerald-200 transition active:scale-95"
                    title="แก้ไขออเดอร์นี้"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  {hasBeenEdited && isSuperAdmin && (
                    <button
                      onClick={() => setAuditingTx(tx)}
                      className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition active:scale-95"
                      title="ดูประวัติการแก้ไข"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              {tx.items.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tx.items.map((item, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-50 text-emerald-800 text-[11px] font-medium px-2 py-0.5 rounded-md border border-emerald-100"
                    >
                      {item.name} ×{item.quantity}
                    </span>
                  ))}
                </div>
              )}

              {tx.note && <p className="text-gray-500 italic text-[11px]">{tx.note}</p>}

              {/* Super Admin Audit note */}
              {hasBeenEdited && isSuperAdmin && latestLog && (
                <div className="flex items-center justify-between text-[11px] bg-purple-50/70 border border-purple-100 rounded-xl px-2.5 py-1 text-purple-800">
                  <span>
                    🔍 แก้ไขล่าสุดโดย: <strong>{latestLog.editorName}</strong>
                  </span>
                  <button
                    onClick={() => setAuditingTx(tx)}
                    className="text-purple-600 hover:text-purple-900 font-bold underline"
                  >
                    ดูประวัติ ({tx.editLogs.length})
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {editingTx && (
        <EditOrderModal
          transaction={editingTx}
          menuItems={menuItems}
          onClose={() => setEditingTx(null)}
        />
      )}

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
    </>
  )
}
