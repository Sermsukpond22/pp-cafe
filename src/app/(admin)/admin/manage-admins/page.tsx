import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import ManageAdminsClient from '@/components/admin/ManageAdminsClient'

export default async function ManageAdminsPage() {
  const session = await getSession()
  if (session?.role !== 'SUPER_ADMIN') redirect('/admin/dashboard')

  const admins = await prisma.user.findMany({
    where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, name: true, username: true, role: true, createdAt: true },
  })

  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, username: true, role: true },
  })

  return (
    <div className="p-4 md:p-6 pb-24 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-800 mb-1">👑 จัดการ Admin</h1>
      <p className="text-gray-400 text-sm mb-5">เพิ่มหรือถอนสิทธิ์ Admin</p>
      <ManageAdminsClient admins={admins} customers={customers} currentUserId={session.userId} />
    </div>
  )
}
