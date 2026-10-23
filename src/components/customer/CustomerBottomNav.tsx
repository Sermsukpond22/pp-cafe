'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, Trophy, User } from 'lucide-react'

export default function CustomerBottomNav() {
  const pathname = usePathname()

  const navItems = [
    { href: '/dashboard', icon: Home, label: 'หน้าแรก' },
    { href: '/history', icon: Clock, label: 'ประวัติแต้ม' },
    { href: '/leaderboard', icon: Trophy, label: 'จัดอันดับ' },
    { href: '/profile', icon: User, label: 'โปรไฟล์' },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-30">
      <div className="max-w-md mx-auto grid grid-cols-4 py-1.5 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
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
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
