import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function LeaderboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { totalCups: 'desc' },
    select: { id: true, name: true, username: true, totalCups: true, stamps: true },
  })

  const myRank = customers.findIndex((c) => c.id === session.userId) + 1
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-emerald-700 text-white px-5 py-4 flex items-center gap-3 shadow-md">
        <Link href="/dashboard" className="text-emerald-200 hover:text-white text-xl">←</Link>
        <h1 className="text-lg sm:text-xl font-black">🏆 อันดับนักดื่ม (Leaderboard)</h1>
      </header>

      {myRank > 0 && (
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-3xl p-5 flex items-center justify-between shadow-md">
            <div>
              <p className="text-emerald-200 text-xs sm:text-sm font-bold">อันดับปัจจุบันของคุณ</p>
              <p className="text-3xl sm:text-4xl font-black mt-0.5">อันดับ #{myRank}</p>
            </div>
            <span className="text-4xl sm:text-5xl">{myRank <= 3 ? medals[myRank - 1] : '⭐'}</span>
          </div>
        </div>
      )}

      <main className="max-w-md mx-auto px-4 py-4 pb-12">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {customers.map((c, i) => {
            const isMe = c.id === session.userId
            return (
              <div
                key={c.id}
                className={`flex items-center gap-3.5 p-4 sm:p-5 transition ${
                  isMe ? 'bg-emerald-50/80 border-l-4 border-l-emerald-600' : ''
                }`}
              >
                <span className="text-xl sm:text-2xl w-8 text-center font-black flex-shrink-0">
                  {i < 3 ? medals[i] : <span className="text-gray-400 text-sm sm:text-base font-bold">{i + 1}</span>}
                </span>

                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-base font-bold truncate ${isMe ? 'text-emerald-950 font-black' : 'text-gray-900'}`}>
                    {c.name} {isMe && <span className="text-xs bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full ml-1">(คุณ)</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">แต้มสะสม {c.stamps}/{STAMPS_REQUIRED} แก้ว</p>
                </div>

                <p className={`text-sm sm:text-base font-black flex-shrink-0 ${isMe ? 'text-emerald-700' : 'text-gray-700'}`}>
                  {c.totalCups} แก้ว
                </p>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
