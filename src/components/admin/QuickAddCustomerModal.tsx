'use client'

import { useState, useTransition, useEffect } from 'react'
import { quickAddCustomer } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { Zap, X, User, Phone, Check, Loader2, ArrowRight } from 'lucide-react'

export interface CustomerSummary {
  id: string
  name: string
  username: string
  phone?: string | null
  stamps: number
  freeRedeems: number
  totalCups: number
}

interface Props {
  isOpen: boolean
  onClose: () => void
  defaultPhone?: string
  defaultName?: string
  onCustomerCreated: (customer: CustomerSummary) => void
}

export default function QuickAddCustomerModal({
  isOpen,
  onClose,
  defaultPhone = '',
  defaultName = '',
  onCustomerCreated,
}: Props) {
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [existingCustomer, setExistingCustomer] = useState<CustomerSummary | null>(null)
  const [isPending, startTransition] = useTransition()


  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, isPending, onClose])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setExistingCustomer(null)

    const trimmedName = name.trim()
    const cleanPhone = phone.replace(/[\s-]/g, '')

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('กรุณากรอกชื่อลูกค้าอย่างน้อย 2 ตัวอักษร')
      return
    }

    if (!cleanPhone || !/^[0-9]{9,10}$/.test(cleanPhone)) {
      setErrorMessage('เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก')
      return
    }

    const formData = new FormData()
    formData.append('name', trimmedName)
    formData.append('phone', cleanPhone)

    startTransition(async () => {
      const res = await quickAddCustomer(formData)
      if (res.success && res.customer) {
        toast.success(`🎉 เพิ่มคุณ ${res.customer.name} สำเร็จและเลือกลูกค้าพร้อมให้แต้มแล้ว!`, {
          duration: 4000,
        })
        onCustomerCreated(res.customer)
        onClose()
      } else {
        setErrorMessage(res.message || 'ไม่สามารถเพิ่มข้อมูลได้ กรุณาลองใหม่อีกครั้ง')
        if (res.customer) {
          setExistingCustomer(res.customer)
        }
      }
    })
  }

  const handleSelectExisting = () => {
    if (existingCustomer) {
      toast.success(`เลือกลูกค้า "${existingCustomer.name}" เรียบร้อยแล้ว`)
      onCustomerCreated(existingCustomer)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">เพิ่มลูกค้าด่วน</h2>
              <p className="text-xs text-emerald-100 font-medium mt-0.5">
                กรอกแค่ 2 ช่อง แล้วเริ่มสะสมแต้มได้ทันที
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition cursor-pointer disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error / Duplicate Warning Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs sm:text-sm font-medium">
              <p className="flex items-center gap-1.5 font-bold">
                <span>⚠️</span> {errorMessage}
              </p>
              {existingCustomer && (
                <div className="mt-2.5 pt-2.5 border-t border-red-200/80 flex items-center justify-between gap-2">
                  <div className="text-xs">
                    <span className="font-bold text-gray-900">{existingCustomer.name}</span>
                    <span className="text-gray-500 ml-1">(@{existingCustomer.username})</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectExisting}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shrink-0 shadow-xs"
                  >
                    <span>เลือกคนนี้เลย</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Input: ชื่อลูกค้า */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              <span>ชื่อลูกค้า (สำหรับเรียกชื่อ)</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น คุณพลอย, บอส, พี่หนุ่ม"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base font-medium transition"
              disabled={isPending}
            />
          </div>

          {/* Input: เบอร์โทรศัพท์ */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>เบอร์โทรศัพท์ (ใช้บอกแต้ม & เข้าสู่ระบบ)</span>
              <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="เช่น 0812345678"
              maxLength={12}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm sm:text-base font-medium transition font-mono"
              disabled={isPending}
            />
            <p className="text-[11px] text-gray-400 mt-1">
              ตัวเลข 9-10 หลัก (ใช้เป็น Username และ รหัสผ่านเริ่มต้น)
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="text-base leading-none mt-0.5">💡</span>
            <div className="space-y-0.5">
              <p className="font-bold text-amber-950">สะดวก รวดเร็ว คิวไม่สะดุด</p>
              <p className="text-amber-800/90 leading-relaxed text-[11px] sm:text-xs">
                ระบบจะตั้ง username และรหัสผ่านเป็น <strong>เบอร์โทรศัพท์</strong> ให้อัตโนมัติ ลูกค้าสามารถใช้เบอร์โทรล็อกอินเช็คแต้มได้ทันที
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังบันทึก...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึก & สะสมแต้ม</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
