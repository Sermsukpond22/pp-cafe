import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { logout } from '@/app/actions/auth'
import AdminMobileNav from '@/components/admin/AdminMobileNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  const navItems = [
    { href: '/admin/dashboard', icon: '📊', label: 'ภาพรวม' },
    { href: '/admin/add-stamp', icon: '☕', label: 'ให้แต้ม' },
    { href: '/admin/menu', icon: '📖', label: 'เมนูร้าน' },
    { href: '/admin/customers', icon: '👥', label: 'ลูกค้า' },
    { href: '/admin/leaderboard', icon: '🏆', label: 'อันดับ' },
    { href: '/admin/transactions', icon: '📋', label: 'ธุรกรรม' },
    { href: '/admin/qr-code', icon: '📱', label: 'QR ร้าน' },
    ...(session.role === 'SUPER_ADMIN'
      ? [{ href: '/admin/manage-admins', icon: '👑', label: 'จัดการ Admin' }]
      : []),
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar (จอคอมพิวเตอร์แสดงครบทุกเมนู) */}
      <aside className="hidden md:flex w-64 bg-emerald-800 flex-col min-h-screen fixed top-0 left-0 shadow-lg z-20">
        <div className="px-6 py-6 border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧋</span>
            <div>
              <p className="text-white font-black text-lg tracking-tight">PP Cafe</p>
              <p className="text-emerald-200 text-xs font-semibold">ระบบจัดการหลังร้าน</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3.5 py-5 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-emerald-100 hover:bg-emerald-700 hover:text-white font-semibold text-sm transition"
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-emerald-700/60 bg-emerald-900/30">
          <p className="text-emerald-300 text-xs mb-1 font-medium">เข้าสู่ระบบโดย</p>
          <p className="text-white text-sm font-bold truncate">{session.name}</p>
          <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-100">
            {session.role === 'SUPER_ADMIN' ? '👑 Super Admin' : '🛠️ Admin'}
          </span>
          <form action={logout} className="mt-3">
            <button
              type="submit"
              className="w-full text-center px-3 py-2 text-emerald-200 hover:text-white text-xs font-bold rounded-xl bg-emerald-800/80 hover:bg-red-600/80 transition"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Top Header & 4-Item Bottom Navigation (พร้อม Drawer สำหรับเมนูอื่นๆ) */}
      <AdminMobileNav userName={session.name} userRole={session.role} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pt-16 md:pt-0">
        {children}
      </main>
    </div>
  )
}
