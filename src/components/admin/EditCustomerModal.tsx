'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCustomer } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { X, UserCheck, Key, Phone, User, Award, Gift } from 'lucide-react'

export interface CustomerEditable {
  id: string
  name: string
  username: string
  phone?: string | null
  stamps?: number
  freeRedeems?: number
}

interface EditCustomerModalProps {
  customer: CustomerEditable | null
  isOpen: boolean
  onClose: () => void
}

export default function EditCustomerModal({
  customer,
  isOpen,
  onClose,
}: EditCustomerModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  if (!isOpen || !customer) return null

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)
    formData.set('userId', customer.id)

    startTransition(async () => {
      const res = await updateCustomer(undefined, formData)

      if (res?.success) {
        toast.success(res.message || 'บันทึกข้อมูลเรียบร้อยแล้ว')
        onClose()
        router.refresh()
      } else {
        if (res?.errors) {
          setErrors(res.errors)
        }
        if (res?.message) {
          toast.error(res.message)
        }
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 my-8 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-base sm:text-lg">แก้ไขข้อมูลลูกค้า</h3>
              <p className="text-xs text-gray-500">@{customer.username}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-200 flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Name */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" /> ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              name="name"
              defaultValue={customer.name}
              required
              placeholder="เช่น สมชาย ใจดี"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name[0]}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <span className="text-emerald-600 font-black">@</span> ชื่อผู้ใช้ (Username) *
            </label>
            <input
              type="text"
              name="username"
              defaultValue={customer.username}
              required
              placeholder="เช่น somchai123 (a-z, 0-9, _)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username[0]}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-600" /> เบอร์โทรศัพท์
            </label>
            <input
              type="tel"
              name="phone"
              defaultValue={customer.phone || ''}
              placeholder="เช่น 0812345678"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone[0]}</p>}
          </div>

          {/* Optional Password Reset */}
          <div className="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/70 space-y-1.5">
            <label className="block text-xs sm:text-sm font-bold text-amber-900 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber-600" /> รีเซ็ตรหัสผ่านใหม่ (ไม่บังคับ)
            </label>
            <input
              type="password"
              name="password"
              placeholder="เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน"
              className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300/80 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 transition"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password[0]}</p>}
            <p className="text-[11px] text-amber-700">
              💡 กรอกเฉพาะเมื่อลูกค้าลืมรหัสผ่าน หรือต้องการตั้งรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
            </p>
          </div>

          {/* Stamps & Free Redeems Adjustment */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-emerald-600" /> แต้มสะสมปัจจุบัน
              </label>
              <input
                type="number"
                name="stamps"
                min="0"
                max="50"
                defaultValue={customer.stamps ?? 0}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5 text-amber-600" /> สิทธิ์แลกฟรี
              </label>
              <input
                type="number"
                name="freeRedeems"
                min="0"
                max="50"
                defaultValue={customer.freeRedeems ?? 0}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-3 border-t border-gray-100">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-black text-sm rounded-xl transition shadow-sm"
            >
              {isPending ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
