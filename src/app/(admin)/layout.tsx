import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { logout } from '@/app/actions/auth'
import AdminMobileNav from '@/components/admin/AdminMobileNav'
import AdminSidebarNav from '@/components/admin/AdminSidebarNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row w-full max-w-full overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-60 bg-emerald-800 flex-col min-h-screen fixed top-0 left-0 shadow-sm z-20">
        <div className="px-5 py-5 border-b border-emerald-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-600/50 flex-shrink-0 shadow-2xs bg-white">
              <Image
                src="/logo.jpg"
                alt="Logo"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <p className="text-white font-black text-base tracking-tight truncate">
                ติดชาคอฟฟี่
              </p>
              <p className="text-emerald-200 text-xs font-medium">ระบบจัดการหลังร้าน</p>
            </div>
          </div>
        </div>

        <AdminSidebarNav userRole={session.role} />

        <div className="px-4 py-4 border-t border-emerald-700/60 bg-emerald-900/30">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="min-w-0">
              <p className="text-white text-xs font-bold truncate">{session.name}</p>
              <p className="text-emerald-300 text-[11px] font-medium">
                {session.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" title="ออนไลน์" />
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-center px-3 py-2 text-emerald-100 hover:text-white text-xs font-semibold rounded-xl bg-emerald-800/80 hover:bg-red-600/90 transition"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile Top Header & Bottom Navigation */}
      <AdminMobileNav userName={session.name} userRole={session.role} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full min-w-0 md:ml-60 pt-14 md:pt-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  )
}
