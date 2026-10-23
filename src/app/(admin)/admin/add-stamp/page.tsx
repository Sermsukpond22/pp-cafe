import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AddStampForm from '@/components/admin/AddStampForm'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function AddStampPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string }>
}) {
  const { userId } = await searchParams
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) redirect('/login')

  const [customers, menuItems] = await Promise.all([
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        stamps: true,
        freeRedeems: true,
        totalCups: true,
      },
    }),
    prisma.menuItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        price: true,
        category: true,
        isActive: true,
      },
    }),
  ])

  return (
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-5xl mx-auto space-y-4">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-gray-900">
          บันทึกการขาย & ให้แต้มสะสม
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          เลือกลูกค้าและรายการเครื่องดื่มเพื่อคำนวณยอดเงินและเพิ่มแต้มสะสมอัตโนมัติ
        </p>
      </div>
      <AddStampForm
        customers={customers}
        menuItems={menuItems}
        stampsRequired={STAMPS_REQUIRED}
        initialUserId={userId}
      />
    </div>
  )
}
