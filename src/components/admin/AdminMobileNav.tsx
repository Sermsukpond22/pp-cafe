'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, LogOut, ChevronRight } from 'lucide-react'
import { logout } from '@/app/actions/auth'

interface Props {
  userName: string
  userRole: string
}

export default function AdminMobileNav({ userName, userRole }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // 4 เมนูหลักที่สำคัญที่สุดในชีวิตประจำวัน (แสดงที่ Menu Bar ด้านล่าง 4 ตัว)
  const primaryNav = [
    { href: '/admin/dashboard', icon: '📊', label: 'ภาพรวม' },
    { href: '/admin/add-stamp', icon: '☕', label: 'ให้แต้ม' },
    { href: '/admin/menu', icon: '📖', label: 'เมนูร้าน' },
    { href: '/admin/customers', icon: '👥', label: 'ลูกค้า' },
  ]

  // เมนูอื่นๆ ที่เก็บไว้ใน Drawer (เปิดเมื่อกดปุ่ม "เมนูอื่นๆ ☰")
  const secondaryNav = [
    { href: '/admin/leaderboard', icon: '🏆', label: 'อันดับลูกค้า (Leaderboard)', desc: 'ดูลำดับลูกค้าที่ซื้อสะสมมากที่สุด' },
    { href: '/admin/transactions', icon: '📋', label: 'ประวัติธุรกรรมทั้งหมด', desc: 'ดูรายการบิลและการขายย้อนหลัง' },
    { href: '/admin/qr-code', icon: '📱', label: 'QR Code ประจำร้าน', desc: 'ดาวน์โหลดหรือพิมพ์ QR ให้ลูกค้าสแกน' },
    ...(userRole === 'SUPER_ADMIN'
      ? [{ href: '/admin/manage-admins', icon: '👑', label: 'จัดการสิทธิ์ Admin', desc: 'เพิ่มหรือปลดสิทธิ์แอดมินคนอื่น' }]
      : []),
  ]

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-emerald-700 text-white px-4 py-3 flex items-center justify-between z-30 shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧋</span>
          <span className="font-black text-base tracking-tight">PP Cafe</span>
        </div>

        {/* ปุ่มเปิดเมนูอื่นๆ ด้านบน */}
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-900 active:scale-95 text-emerald-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-emerald-600 transition"
        >
          <Menu className="w-4 h-4" />
          <span>เมนูอื่นๆ</span>
        </button>
      </header>

      {/* Mobile Bottom Navigation Bar: แสดงเฉพาะ 4 ตัวสำคัญเท่านั้น! */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/98 backdrop-blur-md border-t border-gray-200 grid grid-cols-4 z-30 shadow-2xl py-2 px-1">
        {primaryNav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 ${
                isActive
                  ? 'text-emerald-700 font-black'
                  : 'text-gray-500 font-bold hover:text-emerald-600'
              }`}
            >
              <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className="text-xs mt-1 text-center font-bold">
                {item.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full mt-0.5" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Slide-up Drawer: สำหรับเก็บเมนูอื่นๆ ไม่ให้รกด้านล่าง */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-gray-100 z-10 animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <div>
                  <h3 className="font-black text-gray-900 text-base">เมนูเพิ่มเติม</h3>
                  <p className="text-xs text-gray-500">
                    เข้าสู่ระบบ: {userName} ({userRole === 'SUPER_ADMIN' ? '👑 Super Admin' : '🛠️ Admin'})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Stored Menu Items */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
                ฟังก์ชันอื่นๆ
              </p>
              {secondaryNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50 active:bg-emerald-100/70 border border-gray-100 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300" />
                </Link>
              ))}
            </div>

            {/* Logout Button inside Drawer */}
            <div className="pt-2 border-t border-gray-100">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-2xl text-sm transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
