'use client'

import { useActionState, useState, useEffect } from 'react'
import { setAdminRole } from '@/app/actions/admin'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

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
    <div className="space-y-5">
      {/* Current Admins */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-50">
          <h2 className="font-semibold text-gray-800">Admin ปัจจุบัน ({admins.length})</h2>
        </div>
        {admins.map((admin) => (
          <div key={admin.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
            <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold text-sm">
              {admin.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800">{admin.name}</p>
              <p className="text-xs text-gray-400">@{admin.username}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${admin.role === 'SUPER_ADMIN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                {admin.role === 'SUPER_ADMIN' ? '👑 Super' : '🛠️ Admin'}
              </span>
              {admin.role === 'ADMIN' && admin.id !== currentUserId && (
                <form action={action}>
                  <input type="hidden" name="userId" value={admin.id} />
                  <input type="hidden" name="role" value="CUSTOMER" />
                  <button
                    type="submit"
                    disabled={pending}
                    className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition"
                  >
                    ปลด
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Promote Customer to Admin */}
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="font-semibold text-gray-800 mb-3">เพิ่ม Admin จากลูกค้า</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาชื่อหรือ username..."
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 transition mb-3"
        />
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {filteredCustomers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">ไม่พบลูกค้า</p>
          ) : (
            filteredCustomers.map((c) => (
              <div key={c.id} className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-gray-50">
                <div>
                  <p className="text-sm font-medium text-gray-800">{c.name}</p>
                  <p className="text-xs text-gray-400">@{c.username}</p>
                </div>
                <form action={action}>
                  <input type="hidden" name="userId" value={c.id} />
                  <input type="hidden" name="role" value="ADMIN" />
                  <button
                    type="submit"
                    disabled={pending}
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:bg-emerald-300 transition"
                  >
                    + Admin
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
