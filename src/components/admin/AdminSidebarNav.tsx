'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Coffee,
  UtensilsCrossed,
  Users,
  Trophy,
  ReceiptText,
  QrCode,
  ShieldCheck,
} from 'lucide-react'

interface AdminSidebarNavProps {
  userRole: string
}

export default function AdminSidebarNav({ userRole }: AdminSidebarNavProps) {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'ภาพรวมร้าน' },
    { href: '/admin/add-stamp', icon: Coffee, label: 'บันทึกขาย / ให้แต้ม' },
    { href: '/admin/transactions', icon: ReceiptText, label: 'ประวัติธุรกรรม' },
    { href: '/admin/customers', icon: Users, label: 'รายชื่อลูกค้า' },
    { href: '/admin/menu', icon: UtensilsCrossed, label: 'จัดการเมนูร้าน' },
    { href: '/admin/leaderboard', icon: Trophy, label: 'อันดับลูกค้า' },
    { href: '/admin/qr-code', icon: QrCode, label: 'QR Code ประจำร้าน' },
    ...(userRole === 'SUPER_ADMIN'
      ? [{ href: '/admin/manage-admins', icon: ShieldCheck, label: 'จัดการสิทธิ์ Admin' }]
      : []),
  ]

  return (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive =
          pathname === item.href ||
          (item.href !== '/admin/dashboard' && pathname.startsWith(`${item.href}/`))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all ${
              isActive
                ? 'bg-white text-emerald-900 font-bold shadow-xs'
                : 'text-emerald-100/90 hover:bg-emerald-700/70 hover:text-white font-medium'
            }`}
          >
            <Icon
              className={`w-4 h-4 shrink-0 ${
                isActive ? 'text-emerald-600' : 'text-emerald-200'
              }`}
            />
            <span className="truncate">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
