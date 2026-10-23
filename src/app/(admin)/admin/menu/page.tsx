import { getSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import MenuManager from '@/components/admin/MenuManager'

export default async function AdminMenuPage() {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    redirect('/login')
  }

  const menu = await prisma.menuItem.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return (
    <div className="p-4 sm:p-6 pb-28 sm:pb-8 max-w-5xl mx-auto w-full min-w-0 space-y-4">
      <div>
        <h1 className="text-lg sm:text-xl font-black text-gray-900">
          จัดการเมนูเครื่องดื่ม & สินค้า
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">
          ตั้งค่ารายการเครื่องดื่ม ราคา และสถานะการขายสำหรับหน้าร้าน
        </p>
      </div>

      <MenuManager initialMenu={menu} />
    </div>
  )
}
