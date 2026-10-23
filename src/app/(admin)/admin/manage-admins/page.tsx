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
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-4xl mx-auto space-y-5">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-gray-900">
          จัดการสิทธิ์ผู้ดูแลระบบ (Admin)
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          แต่งตั้งพนักงานเป็นผู้ดูแลระบบ หรือถอนสิทธิ์การใช้งานหลังร้าน
        </p>
      </div>
      <ManageAdminsClient
        admins={admins}
        customers={customers}
        currentUserId={session.userId}
      />
    </div>
  )
}
