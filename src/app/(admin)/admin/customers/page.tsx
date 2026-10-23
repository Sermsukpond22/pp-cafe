import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CustomerListClient from '@/components/admin/CustomerListClient'

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
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-5xl mx-auto space-y-4 w-full min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg sm:text-xl font-black text-gray-900">รายชื่อสมาชิกทั้งหมด</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            จัดการข้อมูลสมาชิก ตรวจสอบแต้มสะสม และสิทธิ์แลกเครื่องดื่มฟรี ({customers.length} คน)
          </p>
        </div>
        <Link
          href="/admin/customers/add"
          className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-xs transition shrink-0"
        >
          + เพิ่มลูกค้าใหม่
        </Link>
      </div>

      <CustomerListClient
        customers={customers}
        stampsRequired={STAMPS_REQUIRED}
        isSuperAdmin={session.role === 'SUPER_ADMIN'}
      />
    </div>
  )
}
