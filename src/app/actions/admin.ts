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

// ─── Delete Customer (SUPER_ADMIN only) ─────────────────────────────────────────
export async function deleteCustomer(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return { message: 'ไม่มีสิทธิ์ดำเนินการ ต้องเป็น Super Admin เท่านั้น', success: false }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { message: 'ไม่พบรหัสลูกค้า', success: false }
  if (userId === session.userId) return { message: 'ไม่สามารถลบบัญชีตัวเองได้', success: false }

  const customer = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  })

  if (!customer) {
    return { message: 'ไม่พบข้อมูลลูกค้า', success: false }
  }

  if (customer.role !== 'CUSTOMER') {
    return { message: 'สามารถลบได้เฉพาะบัญชีลูกค้าเท่านั้น', success: false }
  }

  // Safely delete transaction items, transactions, then customer user
  await prisma.$transaction(async (tx) => {
    await tx.transactionItem.deleteMany({
      where: { transaction: { userId } },
    })
    await tx.transaction.deleteMany({
      where: { userId },
    })
    await tx.user.delete({
      where: { id: userId },
    })
  })

  revalidatePath('/admin/customers')
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/leaderboard')
  revalidatePath('/admin/add-stamp')

  return { message: `ลบลูกค้า "${customer.name}" เรียบร้อยแล้ว`, success: true }
}

// ─── Update Customer (ADMIN and SUPER_ADMIN) ──────────────────────────────────
export async function updateCustomer(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { message: 'ไม่มีสิทธิ์ดำเนินการ', success: false }
  }

  const userId = formData.get('userId') as string
  const name = (formData.get('name') as string)?.trim()
  const username = (formData.get('username') as string)?.trim()
  const rawPhone = (formData.get('phone') as string) || ''
  const phone = rawPhone.replace(/[\s-]/g, '').trim()
  const password = (formData.get('password') as string) || ''
  const stampsRaw = formData.get('stamps')
  const freeRedeemsRaw = formData.get('freeRedeems')

  if (!userId) return { message: 'ไม่พบรหัสลูกค้า', success: false }
  if (!name || name.length < 2) return { errors: { name: ['ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'] }, success: false }
  if (!username || username.length < 3 || username.length > 20 || !/^[a-zA-Z0-9_]+$/.test(username)) {
    return { errors: { username: ['ชื่อผู้ใช้ต้องมี 3-20 ตัวอักษร (ใช้ได้เฉพาะ a-z, 0-9, _)'] }, success: false }
  }
  if (phone && !/^[0-9]{9,10}$/.test(phone)) {
    return { errors: { phone: ['เบอร์โทรไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)'] }, success: false }
  }
  if (password && password.length < 6) {
    return { errors: { password: ['รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร'] }, success: false }
  }

  const customer = await prisma.user.findUnique({
    where: { id: userId },
  })

  if (!customer) {
    return { message: 'ไม่พบข้อมูลลูกค้า', success: false }
  }

  if (customer.role !== 'CUSTOMER') {
    return { message: 'สามารถแก้ไขได้เฉพาะบัญชีลูกค้าเท่านั้น', success: false }
  }

  // Check unique username if username changed
  if (username !== customer.username) {
    const existing = await prisma.user.findUnique({
      where: { username },
    })
    if (existing && existing.id !== userId) {
      return { errors: { username: ['ชื่อผู้ใช้นี้ถูกใช้งานแล้ว'] }, success: false }
    }
  }

  const updateData: {
    name: string
    username: string
    phone: string | null
    passwordHash?: string
    stamps?: number
    freeRedeems?: number
  } = {
    name,
    username,
    phone: phone || null,
  }

  if (password) {
    updateData.passwordHash = await bcrypt.hash(password, 10)
  }

  if (stampsRaw !== null && stampsRaw !== undefined && stampsRaw !== '') {
    const s = Number(stampsRaw)
    if (!isNaN(s) && s >= 0 && s <= 50) {
      updateData.stamps = s
    }
  }

  if (freeRedeemsRaw !== null && freeRedeemsRaw !== undefined && freeRedeemsRaw !== '') {
    const r = Number(freeRedeemsRaw)
    if (!isNaN(r) && r >= 0) {
      updateData.freeRedeems = r
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: updateData,
  })

  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${userId}`)
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/leaderboard')
  revalidatePath('/admin/add-stamp')

  return { message: `อัปเดตข้อมูลของ "${name}" เรียบร้อยแล้ว`, success: true }
}


