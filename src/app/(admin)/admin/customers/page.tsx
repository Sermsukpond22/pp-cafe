import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function AdminCustomersPage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { createdAt: 'desc' },
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

  return (
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900">👥 รายชื่อลูกค้าทั้งหมด</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">รวม {customers.length} คน</p>
        </div>
        <Link
          href="/admin/customers/add"
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition"
        >
          + เพิ่มลูกค้าใหม่
        </Link>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
        {customers.length === 0 ? (
          <p className="text-center text-gray-400 py-12 font-medium">ยังไม่มีลูกค้าในระบบ</p>
        ) : (
          customers.map((c) => (
            <Link
              key={c.id}
              href={`/admin/customers/${c.id}`}
              className="flex items-center gap-3.5 p-4 sm:p-5 hover:bg-emerald-50/40 transition active:bg-gray-50"
            >
              <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-2xl flex items-center justify-center font-black text-lg flex-shrink-0">
                {c.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{c.name}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  @{c.username} {c.phone && `· 📞 ${c.phone}`}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="flex gap-1 justify-end">
                  {Array.from({ length: STAMPS_REQUIRED }).map((_, i) => (
                    <span
                      key={i}
                      className={`text-xs sm:text-sm ${i < c.stamps ? 'opacity-100' : 'opacity-20'}`}
                    >
                      ☕
                    </span>
                  ))}
                </div>
                <p className="text-xs sm:text-sm font-bold text-gray-700 mt-1">
                  {c.totalCups} แก้วสะสม
                </p>
                {c.freeRedeems > 0 && (
                  <span className="inline-block text-[11px] bg-amber-100 text-amber-800 font-extrabold px-2 py-0.5 rounded-full mt-0.5">
                    🎁 ฟรี {c.freeRedeems} แก้ว
                  </span>
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
