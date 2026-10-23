import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import StampCard from '@/components/customer/StampCard'
import Link from 'next/link'
import { Gift, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      username: true,
      stamps: true,
      totalCups: true,
      freeRedeems: true,
    },
  })

  if (!user) redirect('/login')

  const rank = await prisma.user.count({
    where: {
      role: 'CUSTOMER',
      totalCups: { gt: user.totalCups },
    },
  })

  const recentTx = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      items: { select: { name: true, quantity: true } },
    },
  })

  return (
    <div className="space-y-4">
      {/* Greeting Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-medium">สวัสดีคุณ</p>
          <h1 className="text-lg font-black text-gray-900">{user.name}</h1>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
          @{user.username}
        </span>
      </div>

      {/* Stamp Card Component */}
      <StampCard
        stamps={user.stamps}
        stampsRequired={STAMPS_REQUIRED}
        freeRedeems={user.freeRedeems}
      />

      {/* Free Redeems Banner */}
      {user.freeRedeems > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 shadow-2xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-amber-950 text-sm">
              คุณมีสิทธิ์แลกเครื่องดื่มฟรี {user.freeRedeems} แก้ว
            </p>
            <p className="text-amber-800 text-xs mt-0.5">
              แจ้งชื่อหรือเบอร์โทรศัพท์กับพนักงานที่เคาน์เตอร์เพื่อใช้สิทธิ์
            </p>
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">แก้วที่ซื้อสะสมทั้งหมด</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{user.totalCups} แก้ว</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-gray-100">
          <p className="text-xs text-gray-500 font-medium">อันดับสมาชิกในร้าน</p>
          <p className="text-2xl font-black text-gray-900 mt-1">#{rank + 1}</p>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow-xs border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">รายการล่าสุด</h2>
          <Link
            href="/history"
            className="text-emerald-600 text-xs font-semibold hover:underline inline-flex items-center gap-1"
          >
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentTx.length === 0 ? (
          <p className="text-gray-400 text-xs text-center py-6">ยังไม่มีประวัติการซื้อ</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentTx.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0 text-xs"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-gray-900 truncate">
                    {tx.type === 'EARN' ? `ซื้อเครื่องดื่ม ${tx.cups} แก้ว` : 'แลกเครื่องดื่มฟรี 1 แก้ว'}
                  </p>
                  <p className="text-gray-500 truncate mt-0.5">
                    {tx.items.length > 0
                      ? tx.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')
                      : formatDate(tx.createdAt)}
                  </p>
                </div>
                <span
                  className={`font-bold shrink-0 ${
                    tx.type === 'EARN' ? 'text-emerald-700' : 'text-amber-600'
                  }`}
                >
                  {tx.type === 'EARN' ? `+${tx.cups} แต้ม` : 'แลกฟรี'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
