'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const MenuItemSchema = z.object({
  name: z.string().min(1, 'กรุณาระบุชื่อเมนู').trim(),
  price: z.coerce.number().min(0, 'ราคาต้องไม่ติดลบ'),
  category: z.string().min(1, 'กรุณาระบุหมวดหมู่').trim(),
})

export type ActionState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function createMenuItem(
  prevState: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { message: 'ไม่มีสิทธิ์ดำเนินการ' }
  }

  const validated = MenuItemSchema.safeParse({
    name: formData.get('name'),
    price: formData.get('price'),
    category: formData.get('category'),
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  await prisma.menuItem.create({
    data: {
      name: validated.data.name,
      price: validated.data.price,
      category: validated.data.category,
      isActive: true,
    },
  })

  revalidatePath('/admin/menu')
  revalidatePath('/admin/add-stamp')
  return { message: 'เพิ่มเมนูสำเร็จ', success: true }
}

export async function toggleMenuItem(id: string, currentStatus: boolean) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('ไม่มีสิทธิ์ดำเนินการ')
  }

  await prisma.menuItem.update({
    where: { id },
    data: { isActive: !currentStatus },
  })

  revalidatePath('/admin/menu')
  revalidatePath('/admin/add-stamp')
}

export async function deleteMenuItem(id: string) {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    throw new Error('ไม่มีสิทธิ์ดำเนินการ')
  }

  await prisma.menuItem.delete({
    where: { id },
  })

  revalidatePath('/admin/menu')
  revalidatePath('/admin/add-stamp')
}
