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
    <div className="p-4 md:p-6 pb-24 md:pb-6 max-w-xl mx-auto">
      <div className="mb-4 sm:mb-5">
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span>☕</span>
          <span>ให้แต้มลูกค้า & บันทึกการขาย</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          เลือกลูกค้าและเมนูเครื่องดื่มเพื่อสะสมแต้มและบันทึกยอดขาย
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
