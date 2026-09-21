import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import AddStampForm from '@/components/admin/AddStampForm'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export default async function AddStampPage() {
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
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-800">☕ ให้แต้มลูกค้า & บันทึกการขาย</h1>
        <p className="text-xs text-gray-500 mt-1">
          เลือกเมนูเครื่องดื่มที่ลูกค้าซื้อเพื่อสะสมแต้มและบันทึกยอดขายประจำวัน
        </p>
      </div>
      <AddStampForm
        customers={customers}
        menuItems={menuItems}
        stampsRequired={STAMPS_REQUIRED}
      />
    </div>
  )
}
