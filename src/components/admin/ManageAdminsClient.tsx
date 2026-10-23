'use client'

import { useActionState, useState, useEffect } from 'react'
import { setAdminRole } from '@/app/actions/admin'
import { Search, ShieldCheck, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  username: string
  role: string
  createdAt?: Date
}

interface Props {
  admins: User[]
  customers: User[]
  currentUserId: string
}

export default function ManageAdminsClient({ admins, customers, currentUserId }: Props) {
  const [state, action, pending] = useActionState(setAdminRole, undefined)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (state?.message) {
      if (state.message.includes('สำเร็จ')) toast.success(state.message)
      else toast.error(state.message)
    }
  }, [state])

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.username.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
      {/* Current Admins */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
        <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-gray-900 text-sm">ผู้ดูแลระบบปัจจุบัน ({admins.length})</h2>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-700 font-bold text-sm shrink-0">
                {admin.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{admin.name}</p>
                <p className="text-xs text-gray-400">@{admin.username}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-md font-semibold border ${
                    admin.role === 'SUPER_ADMIN'
                      ? 'bg-purple-50 text-purple-700 border-purple-200/80'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  }`}
                >
                  {admin.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                </span>
                {admin.role === 'ADMIN' && admin.id !== currentUserId && (
                  <form action={action}>
                    <input type="hidden" name="userId" value={admin.id} />
                    <input type="hidden" name="role" value="CUSTOMER" />
                    <button
                      type="submit"
                      disabled={pending}
                      className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg border border-red-200/70 transition cursor-pointer"
                    >
                      ถอนสิทธิ์
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Promote Customer to Admin */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
          <UserPlus className="w-4 h-4 text-emerald-600" />
          <h2 className="font-bold text-gray-900 text-sm">แต่งตั้ง Admin เพิ่มเติมจากสมาชิก</h2>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาชื่อ หรือ @username..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition"
          />
        </div>

        <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto pr-0.5">
          {filteredCustomers.length === 0 ? (
            <p className="text-gray-400 text-xs text-center py-6">ไม่พบรายชื่อสมาชิก</p>
          ) : (
            filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between py-2.5 px-2 rounded-xl hover:bg-gray-50 transition"
              >
                <div className="min-w-0 pr-2">
                  <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">@{c.username}</p>
                </div>
                <form action={action}>
                  <input type="hidden" name="userId" value={c.id} />
                  <input type="hidden" name="role" value="ADMIN" />
                  <button
                    type="submit"
                    disabled={pending}
                    className="text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-lg disabled:opacity-50 transition cursor-pointer shrink-0"
                  >
                    + ตั้งเป็น Admin
                  </button>
                </form>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
