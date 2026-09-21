'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import type { ActionState } from './auth'

// ─── Set Admin Role ───────────────────────────────────────────────────────────
export async function setAdminRole(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return { message: 'ไม่มีสิทธิ์ดำเนินการ' }
  }

  const userId = formData.get('userId') as string
  const role = formData.get('role') as 'ADMIN' | 'CUSTOMER'

  if (!userId) return { message: 'ไม่พบ userId' }
  if (userId === session.userId) return { message: 'ไม่สามารถเปลี่ยนสิทธิ์ตัวเองได้' }

  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })

  revalidatePath('/admin/manage-admins')
  return { message: role === 'ADMIN' ? 'เพิ่ม Admin สำเร็จ' : 'ปลด Admin สำเร็จ' }
}
