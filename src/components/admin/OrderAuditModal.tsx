'use client'

import { X, History, UserCheck, Calendar, FileText, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface EditLogItem {
  id: string
  editedBy: string
  editorName: string
  reason: string | null
  changesSummary: string
  previousData: string | null
  createdAt: string | Date
  editor?: {
    name: string
    username: string
  } | null
}

interface OrderAuditModalProps {
  transactionId: string
  userName: string
  userUsername: string
  type: 'EARN' | 'REDEEM'
  editLogs: EditLogItem[]
  onClose: () => void
}

export default function OrderAuditModal({
  transactionId,
  userName,
  userUsername,
  type,
  editLogs,
  onClose,
}: OrderAuditModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-gray-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-700 to-purple-800 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-purple-200" />
              <h2 className="text-lg font-bold">ประวัติการแก้ไขออเดอร์ (Super Admin)</h2>
            </div>
            <p className="text-purple-200 text-xs mt-0.5">
              ลูกค้า: <strong className="text-white">{userName}</strong> (@{userUsername}) · {type === 'EARN' ? '☕ บิลสะสมแต้ม' : '🎁 แลกของรางวัล'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {editLogs.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <History className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-semibold">ยังไม่มีประวัติการแก้ไขสำหรับออเดอร์นี้</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pb-1 border-b border-gray-100">
                <span>บันทึกการแก้ไขทั้งหมด ({editLogs.length} ครั้ง)</span>
                <span className="text-purple-600 font-bold">เรียงจากล่าสุด</span>
              </div>

              {editLogs.map((log, idx) => {
                let parsedPrev: any = null
                if (log.previousData) {
                  try {
                    parsedPrev = JSON.parse(log.previousData)
                  } catch {
                    parsedPrev = null
                  }
                }

                return (
                  <div
                    key={log.id}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 relative overflow-hidden"
                  >
                    {/* Badge count */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          #{editLogs.length - idx}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                            <p className="text-sm font-bold text-gray-900">
                              แก้ไขโดย: <span className="text-emerald-700">{log.editorName}</span>
                            </p>
                            {log.editor?.username && (
                              <span className="text-xs text-gray-400">(@{log.editor.username})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-400 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDate(log.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    {log.reason && (
                      <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl px-3 py-2 text-xs">
                        <span className="font-bold text-amber-900">เหตุผล: </span>
                        <span className="text-amber-800">{log.reason}</span>
                      </div>
                    )}

                    {/* Changes Summary */}
                    <div className="bg-white rounded-xl p-3 border border-gray-200/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        <FileText className="w-3.5 h-3.5 text-purple-600" />
                        <span>สรุปการเปลี่ยนแปลง:</span>
                      </div>
                      <p className="text-xs text-gray-800 font-medium pl-5 leading-relaxed">
                        {log.changesSummary}
                      </p>
                    </div>

                    {/* Previous Snapshot Details if available */}
                    {parsedPrev && (
                      <details className="text-xs text-gray-500 pt-1 group">
                        <summary className="cursor-pointer font-medium text-purple-700 hover:text-purple-900 flex items-center gap-1 select-none">
                          <span className="transition-transform group-open:rotate-90">▸</span>
                          <span>ดูข้อมูลเดิมก่อนแก้ไขครั้งนี้</span>
                        </summary>
                        <div className="mt-2 p-3 bg-white rounded-xl border border-gray-100 text-[11px] space-y-1.5 text-gray-600">
                          <p>
                            <strong>จำนวนแก้วเดิม:</strong> {parsedPrev.cups} แก้ว
                          </p>
                          <p>
                            <strong>ยอดเงินเดิม:</strong> {parsedPrev.totalAmount?.toLocaleString()} ฿
                          </p>
                          {parsedPrev.note && (
                            <p>
                              <strong>หมายเหตุเดิม:</strong> {parsedPrev.note}
                            </p>
                          )}
                          {parsedPrev.items && parsedPrev.items.length > 0 && (
                            <div>
                              <strong>รายการเดิม:</strong>
                              <ul className="list-disc pl-4 mt-0.5 space-y-0.5">
                                {parsedPrev.items.map((item: any, i: number) => (
                                  <li key={i}>
                                    {item.name} ×{item.quantity} ({item.price}฿)
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </details>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
