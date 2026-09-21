'use client'

import { useActionState } from 'react'
import { addCustomer } from '@/app/actions/auth'
import { useEffect } from 'react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function AddCustomerPage() {
  const [state, action, pending] = useActionState(addCustomer, undefined)

  useEffect(() => {
    if (state?.message === 'เพิ่มลูกค้าสำเร็จ') {
      toast.success(state.message)
    }
  }, [state])

  return (
    <div className="p-4 md:p-6 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/customers" className="text-gray-400 hover:text-gray-600">←</Link>
        <h1 className="text-xl font-bold text-gray-800">เพิ่มลูกค้าใหม่</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-5">
        {state?.message && state.message !== 'เพิ่มลูกค้าสำเร็จ' && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            {state.message}
          </div>
        )}
        {state?.message === 'เพิ่มลูกค้าสำเร็จ' && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4">
            ✅ เพิ่มลูกค้าสำเร็จแล้ว
          </div>
        )}

        <form action={action} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อผู้ใช้ *</label>
            <input name="username" placeholder="เช่น somchai123" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm" />
            {state?.errors?.username && <p className="text-red-500 text-xs mt-1">{state.errors.username[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล *</label>
            <input name="name" placeholder="เช่น สมชาย ใจดี" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm" />
            {state?.errors?.name && <p className="text-red-500 text-xs mt-1">{state.errors.name[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทร</label>
            <input name="phone" type="tel" placeholder="0812345678" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm" />
            {state?.errors?.phone && <p className="text-red-500 text-xs mt-1">{state.errors.phone[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน *</label>
            <input name="password" type="password" placeholder="อย่างน้อย 6 ตัวอักษร" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition text-sm" />
            {state?.errors?.password && <p className="text-red-500 text-xs mt-1">{state.errors.password[0]}</p>}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl transition"
          >
            {pending ? 'กำลังเพิ่ม...' : '+ เพิ่มลูกค้า'}
          </button>
        </form>
      </div>
    </div>
  )
}
