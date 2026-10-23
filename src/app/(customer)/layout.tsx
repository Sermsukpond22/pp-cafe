import Image from 'next/image'
import CustomerBottomNav from '@/components/customer/CustomerBottomNav'

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Shared Top Brand Bar */}
      <header className="bg-emerald-800 text-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-emerald-600/50 bg-white shrink-0">
              <Image
                src="/logo.jpg"
                alt="ติดชาคอฟฟี่"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                unoptimized
              />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight block leading-none">
                ติดชาคอฟฟี่
              </span>
              <span className="text-[11px] text-emerald-200 font-medium">
                บัตรสมาชิกสะสมแต้ม
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-4">{children}</main>

      <CustomerBottomNav />
    </div>
  )
}
