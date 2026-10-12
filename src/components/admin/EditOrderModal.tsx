'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Plus, Minus, Trash2, Save, Coffee, AlertCircle } from 'lucide-react'
import { editTransaction } from '@/app/actions/admin'
import toast from 'react-hot-toast'

export interface OrderItem {
  id?: string
  menuItemId?: string | null
  name: string
  price: number
  quantity: number
  subtotal?: number
}

export interface TransactionData {
  id: string
  userId: string
  userName: string
  userUsername: string
  type: 'EARN' | 'REDEEM'
  cups: number
  totalAmount: number
  note: string | null
  createdAt: string | Date
  cashierName: string
  items: OrderItem[]
  updatedAt?: string | Date | null
  editorName?: string | null
}

export interface MenuItemOption {
  id: string
  name: string
  price: number
  category: string
}

interface EditOrderModalProps {
  transaction: TransactionData
  menuItems: MenuItemOption[]
  onClose: () => void
  onSuccess?: () => void
}

export default function EditOrderModal({
  transaction,
  menuItems,
  onClose,
  onSuccess,
}: EditOrderModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Initialize editable state
  const [items, setItems] = useState<OrderItem[]>(
    transaction.items.length > 0
      ? transaction.items.map((i) => ({ ...i }))
      : [
          {
            name: transaction.note || 'เครื่องดื่มทั่วไป',
            price: transaction.cups > 0 ? Math.round(transaction.totalAmount / transaction.cups) : 0,
            quantity: transaction.cups || 1,
          },
        ]
  )
  const [note, setNote] = useState(transaction.note || '')
  const [reason, setReason] = useState('')
  const [selectedMenuId, setSelectedMenuId] = useState('')

  // Calculate totals
  const totalCups = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount =
    transaction.type === 'EARN'
      ? items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      : 0

  const handleQuantityChange = (index: number, delta: number) => {
    setItems((prev) => {
      const copy = [...prev]
      const newQty = copy[index].quantity + delta
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index)
      }
      copy[index] = { ...copy[index], quantity: newQty }
      return copy
    })
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddItem = () => {
    if (!selectedMenuId) return
    const found = menuItems.find((m) => m.id === selectedMenuId)
    if (!found) return

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.menuItemId === found.id)
      if (existingIdx >= 0) {
        const copy = [...prev]
        copy[existingIdx].quantity += 1
        return copy
      }
      return [
        ...prev,
        {
          menuItemId: found.id,
          name: found.name,
          price: found.price,
          quantity: 1,
        },
      ]
    })
    setSelectedMenuId('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (transaction.type === 'EARN' && totalCups <= 0) {
      toast.error('กรุณาระบุจำนวนสินค้าอย่างน้อย 1 รายการ')
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('transactionId', transaction.id)
      formData.set('note', note)
      formData.set('reason', reason || 'แก้ไขรายละเอียดออเดอร์')
      formData.set('itemsJson', JSON.stringify(items))
      formData.set('cups', totalCups.toString())
      formData.set('totalAmount', totalAmount.toString())

      const res = await editTransaction(undefined, formData)

      if (res?.success) {
        toast.success(res.message || 'แก้ไขออเดอร์สำเร็จ')
        router.refresh()
        if (onSuccess) onSuccess()
        onClose()
      } else {
        toast.error(res?.message || 'เกิดข้อผิดพลาดในการแก้ไขออเดอร์')
      }
    })
  }

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
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 px-6 py-5 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">✏️</span>
              <h2 className="text-lg font-bold">แก้ไขรายละเอียดออเดอร์</h2>
            </div>
            <p className="text-emerald-100 text-xs mt-0.5">
              ลูกค้า: <strong className="text-white">{transaction.userName}</strong> (@{transaction.userUsername})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Order type indicator */}
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-base">{transaction.type === 'EARN' ? '☕' : '🎁'}</span>
              <span>
                ประเภท: <strong>{transaction.type === 'EARN' ? 'ซื้อสะสมแต้ม' : 'แลกเครื่องดื่มฟรี'}</strong>
              </span>
            </div>
            <span>ผู้ทำรายการเดิม: {transaction.cashierName}</span>
          </div>

          {/* Items Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-gray-800">
                รายการสินค้าในบิล ({items.length} รายการ)
              </label>
            </div>

            {/* Item list */}
            {items.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-gray-400 text-xs">
                ยังไม่มีรายการสินค้า กรุณาเพิ่มเมนูด้านล่าง
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-3 p-3 bg-gray-50/80 hover:bg-gray-100/70 rounded-2xl border border-gray-100 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.name}</p>
                      {transaction.type === 'EARN' && (
                        <p className="text-xs text-emerald-600 font-medium">
                          {item.price.toLocaleString()} ฿ / แก้ว
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, -1)}
                        className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 flex items-center justify-center font-bold transition active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(idx, 1)}
                        className="w-7 h-7 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center justify-center font-bold transition active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="w-7 h-7 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition ml-1"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add menu item picker */}
            <div className="flex gap-2 pt-1">
              <select
                value={selectedMenuId}
                onChange={(e) => setSelectedMenuId(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
              >
                <option value="">-- เลือกเมนูที่ต้องการเพิ่ม --</option>
                {menuItems.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.price} ฿)
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddItem}
                disabled={!selectedMenuId}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition active:scale-95 flex-shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>เพิ่ม</span>
              </button>
            </div>
          </div>

          {/* Live Summary Bar */}
          <div className="bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 font-medium">รวมหลังการแก้ไข</p>
              <p className="text-lg font-black text-emerald-900 mt-0.5">
                {totalCups} แก้ว
                {transaction.type === 'EARN' && (
                  <span className="text-base font-bold text-emerald-700 ml-2">
                    · {totalAmount.toLocaleString()} ฿
                  </span>
                )}
              </p>
            </div>
            {totalCups !== transaction.cups && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-200 text-emerald-800">
                {totalCups > transaction.cups
                  ? `+${totalCups - transaction.cups} แก้ว`
                  : `${totalCups - transaction.cups} แก้ว`}
              </span>
            )}
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              หมายเหตุออเดอร์ (ไม่บังคับ)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น หวานน้อย, แยกน้ำแข็ง"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Reason for Edit Input (Auditing) */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-amber-800 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>เหตุผลในการแก้ไข (บันทึกลงระบบตรวจสอบ)</span>
            </div>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="เช่น พนักงานกดจำนวนแก้วผิด, ลูกค้าขอเปลี่ยนเครื่องดื่ม"
              required
              className="w-full px-3.5 py-2 rounded-xl border border-amber-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
            />
            <p className="text-[11px] text-amber-700">
              * ข้อมูลผู้แก้ไขและเวลาจะถูกบันทึกให้ Super Admin ตรวจสอบได้
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-sm active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
