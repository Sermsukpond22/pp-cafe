'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Menu,
  X,
  LogOut,
  ChevronRight,
  LayoutDashboard,
  Coffee,
  ReceiptText,
  Users,
  UtensilsCrossed,
  Trophy,
  QrCode,
  ShieldCheck,
} from 'lucide-react'
import { logout } from '@/app/actions/auth'

interface Props {
  userName: string
  userRole: string
}

export default function AdminMobileNav({ userName, userRole }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const primaryNav = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'ภาพรวม' },
    { href: '/admin/add-stamp', icon: Coffee, label: 'บันทึกขาย' },
    { href: '/admin/transactions', icon: ReceiptText, label: 'ธุรกรรม' },
    { href: '/admin/customers', icon: Users, label: 'ลูกค้า' },
  ]

  const secondaryNav = [
    {
      href: '/admin/menu',
      icon: UtensilsCrossed,
      label: 'จัดการเมนูร้าน',
      desc: 'เพิ่ม แก้ไข หรือเปิด/ปิดเมนูเครื่องดื่ม',
    },
    {
      href: '/admin/leaderboard',
      icon: Trophy,
      label: 'อันดับลูกค้า (Leaderboard)',
      desc: 'ดูลำดับลูกค้าที่ซื้อสะสมมากที่สุด',
    },
    {
      href: '/admin/qr-code',
      icon: QrCode,
      label: 'QR Code ประจำร้าน',
      desc: 'ดาวน์โหลดหรือพิมพ์ป้าย QR ให้ลูกค้าสแกน',
    },
    ...(userRole === 'SUPER_ADMIN'
      ? [
          {
            href: '/admin/manage-admins',
            icon: ShieldCheck,
            label: 'จัดการสิทธิ์ Admin',
            desc: 'เพิ่มหรือถอนสิทธิ์ผู้ดูแลระบบ',
          },
        ]
      : []),
  ]

  return (
    <>
      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-emerald-800 text-white px-4 py-3 flex items-center justify-between z-30 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-600/50 flex-shrink-0 bg-white">
            <Image
              src="/logo.jpg"
              alt="Logo"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight block leading-none">ติดชาคอฟฟี่</span>
            <span className="text-[11px] text-emerald-200 font-medium">ระบบจัดการร้าน</span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 bg-emerald-700/80 hover:bg-emerald-700 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-emerald-600/60 transition"
        >
          <Menu className="w-4 h-4" />
          <span>เมนูเพิ่มเติม</span>
        </button>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 grid grid-cols-4 z-30 py-1.5 px-1">
        {primaryNav.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(`${item.href}/`))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition active:scale-95 ${
                isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-gray-400 font-medium hover:text-gray-700'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
              <span className="text-xs mt-1 text-center">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Slide-up Drawer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
          />

          <div className="relative bg-white rounded-t-3xl p-5 space-y-4 max-h-[85vh] overflow-y-auto shadow-2xl border-t border-gray-100 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">เมนูจัดการร้าน</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  ผู้ใช้งาน: {userName} ({userRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'})
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {secondaryNav.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-gray-50 border border-gray-100 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                )
              })}
            </div>

            <div className="pt-2 border-t border-gray-100">
              <form action={logout}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl text-sm transition"
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
