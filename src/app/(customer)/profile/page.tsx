import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { logout } from '@/app/actions/auth'
import { formatDate } from '@/lib/utils'
import { LogOut } from 'lucide-react'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      stamps: true,
      totalCups: true,
      freeRedeems: true,
      createdAt: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl p-5 shadow-xs border border-gray-100 flex items-center gap-4">
        <div className="w-14 h-14 bg-emerald-700 rounded-2xl text-white text-xl font-black flex items-center justify-center shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-bold text-gray-900 truncate">{user.name}</h1>
          <p className="text-xs text-gray-400">@{user.username}</p>
          <p className="text-xs text-gray-500 mt-1">สมาชิกตั้งแต่ {formatDate(user.createdAt)}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-xs border border-gray-100">
          <p className="text-xl font-black text-emerald-700">{user.stamps}</p>
          <p className="text-xs text-gray-500 mt-0.5">แต้มปัจจุบัน</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-xs border border-gray-100">
          <p className="text-xl font-black text-gray-900">{user.totalCups}</p>
          <p className="text-xs text-gray-500 mt-0.5">แก้วสะสม</p>
        </div>
        <div className="bg-white rounded-2xl p-3.5 text-center shadow-xs border border-gray-100">
          <p className="text-xl font-black text-amber-600">{user.freeRedeems}</p>
          <p className="text-xs text-gray-500 mt-0.5">สิทธิ์แลกฟรี</p>
        </div>
      </div>

      {/* Account Details */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 divide-y divide-gray-100">
        {[
          { label: 'ชื่อผู้ใช้ (Username)', value: `@${user.username}` },
          { label: 'ชื่อ-นามสกุล', value: user.name },
          { label: 'เบอร์โทรศัพท์', value: user.phone || 'ไม่ได้ระบุ' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm">
            <p className="text-gray-500">{item.label}</p>
            <p className="font-semibold text-gray-900">{item.value}</p>
          </div>
        ))}
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="w-full bg-white hover:bg-red-50 text-red-600 border border-red-200/80 font-bold text-xs sm:text-sm py-3 rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>ออกจากระบบ</span>
        </button>
      </form>
    </div>
  )
}
