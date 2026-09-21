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
    <div className="p-4 md:p-6 pb-24 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-800">☕ จัดการเมนูเครื่องดื่ม / สินค้า</h1>
        <p className="text-sm text-gray-500 mt-1">
          กำหนดรายการเมนูและราคา เพื่อใช้เลือกตอนให้แต้มและคำนวณยอดขายประจำวัน
        </p>
      </div>

      <MenuManager initialMenu={menu} />
    </div>
  )
}
