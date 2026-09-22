import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import { formatDate } from '@/lib/utils'

export default async function ProfilePage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true, name: true, username: true, phone: true,
      stamps: true, totalCups: true, freeRedeems: true, createdAt: true,
    },
  })

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-emerald-50">
      <header className="bg-emerald-600 text-white px-4 py-4 flex items-center gap-3">
        <Link href="/dashboard" className="text-emerald-200 hover:text-white">←</Link>
        <h1 className="text-lg font-bold">โปรไฟล์</h1>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Avatar */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-600 rounded-full text-white text-3xl font-bold mb-3 shadow">
            {user.name.charAt(0)}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500">@{user.username}</p>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm divide-y divide-gray-50">
          {[
            { label: 'ชื่อผู้ใช้', value: user.username },
            { label: 'ชื่อ-นามสกุล', value: user.name },
            { label: 'เบอร์โทร', value: user.phone || '—' },
            { label: 'สมาชิกตั้งแต่', value: formatDate(user.createdAt) },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between px-4 py-3">
              <p className="text-sm text-gray-500">{item.label}</p>
              <p className="text-sm font-medium text-gray-800">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-emerald-600">{user.stamps}</p>
            <p className="text-xs text-gray-500">แต้มปัจจุบัน</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-blue-500">{user.totalCups}</p>
            <p className="text-xs text-gray-500">แก้วทั้งหมด</p>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center shadow-sm">
            <p className="text-2xl font-bold text-amber-500">{user.freeRedeems}</p>
            <p className="text-xs text-gray-500">แลกฟรี</p>
          </div>
        </div>

        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-red-50 text-red-500 font-semibold py-3 rounded-2xl hover:bg-red-100 transition"
          >
            ออกจากระบบ
          </button>
        </form>
      </main>
    </div>
  )
}
