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

// ─── Quick Add Customer (Admin & Super Admin) ──────────────────────────────────
export interface QuickAddCustomerResult {
  success: boolean
  message?: string
  errors?: Record<string, string[]>
  customer?: {
    id: string
    name: string
    username: string
    phone: string | null
    stamps: number
    freeRedeems: number
    totalCups: number
  }
}

export async function quickAddCustomer(
  formData: FormData
): Promise<QuickAddCustomerResult> {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { success: false, message: 'ไม่มีสิทธิ์ดำเนินการ' }
  }

  const name = (formData.get('name') as string)?.trim()
  const phoneRaw = (formData.get('phone') as string)?.trim()

  if (!name || name.length < 2) {
    return {
      success: false,
      errors: { name: ['กรุณากรอกชื่อลูกค้าอย่างน้อย 2 ตัวอักษร'] },
      message: 'กรุณากรอกชื่อลูกค้าอย่างน้อย 2 ตัวอักษร',
    }
  }

  if (!phoneRaw) {
    return {
      success: false,
      errors: { phone: ['กรุณากรอกเบอร์โทรศัพท์'] },
      message: 'กรุณากรอกเบอร์โทรศัพท์',
    }
  }

  const cleanPhone = phoneRaw.replace(/[\s-]/g, '')
  if (!/^[0-9]{9,10}$/.test(cleanPhone)) {
    return {
      success: false,
      errors: { phone: ['เบอร์โทรศัพท์ต้องเป็นตัวเลข 9-10 หลัก'] },
      message: 'เบอร์โทรศัพท์ไม่ถูกต้อง (ต้องเป็นตัวเลข 9-10 หลัก)',
    }
  }

  // Check if a customer already exists with this phone number or username
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { phone: cleanPhone },
        { phone: phoneRaw },
        { username: cleanPhone },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      stamps: true,
      freeRedeems: true,
      totalCups: true,
    },
  })

  if (existingUser) {
    return {
      success: false,
      errors: { phone: [`มีลูกค้าชื่อ "${existingUser.name}" ใช้เบอร์นี้แล้ว`] },
      message: `มีลูกค้าชื่อ "${existingUser.name}" ใช้เบอร์นี้ในระบบแล้ว`,
      customer: existingUser,
    }
  }

  // Determine unique username
  let username = cleanPhone
  const existingUsername = await prisma.user.findUnique({
    where: { username },
  })
  if (existingUsername) {
    username = `c_${cleanPhone}`
  }

  // Default initial password is the customer's phone number
  const passwordHash = await bcrypt.hash(cleanPhone, 10)

  const newUser = await prisma.user.create({
    data: {
      name,
      username,
      phone: cleanPhone,
      passwordHash,
      role: 'CUSTOMER',
      stamps: 0,
      freeRedeems: 0,
      totalCups: 0,
    },
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      stamps: true,
      freeRedeems: true,
      totalCups: true,
    },
  })

  revalidatePath('/admin/add-stamp')
  revalidatePath('/admin/customers')
  revalidatePath('/admin/dashboard')

  return {
    success: true,
    message: `เพิ่มลูกค้า "${name}" เรียบร้อยแล้ว`,
    customer: newUser,
  }
}

// ─── Edit Transaction / Order (ADMIN & SUPER_ADMIN) ───────────────────────────
const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export async function editTransaction(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { message: 'ไม่มีสิทธิ์ดำเนินการ', success: false }
  }

  const transactionId = formData.get('transactionId') as string
  if (!transactionId) {
    return { message: 'ไม่พบรหัสธุรกรรม', success: false }
  }

  const note = (formData.get('note') as string)?.trim() || null
  const reason = (formData.get('reason') as string)?.trim() || 'แก้ไขรายละเอียดออเดอร์'
  const itemsJson = formData.get('itemsJson') as string

  const tx = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      user: true,
      items: true,
    },
  })

  if (!tx) {
    return { message: 'ไม่พบข้อมูลออเดอร์', success: false }
  }

  let items: Array<{ menuItemId?: string; name: string; price: number; quantity: number }> = []
  if (itemsJson) {
    try {
      items = JSON.parse(itemsJson)
    } catch {
      items = []
    }
  }

  let newCups = tx.cups
  let newTotalAmount = tx.totalAmount

  if (tx.type === 'EARN') {
    if (items.length > 0) {
      newCups = items.reduce((sum, item) => sum + item.quantity, 0)
      newTotalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    } else {
      const rawCups = formData.get('cups')
      const rawAmount = formData.get('totalAmount')
      if (rawCups !== null) newCups = Number(rawCups)
      if (rawAmount !== null) newTotalAmount = Number(rawAmount)
    }

    if (newCups <= 0) {
      return { message: 'จำนวนแก้วต้องมากกว่า 0', success: false }
    }
  } else {
    // REDEEM
    newCups = 1
    newTotalAmount = 0
    if (items.length > 0) {
      items = [items[0]]
    }
  }

  // Calculate changes summary
  const changes: string[] = []
  if (tx.cups !== newCups) {
    changes.push(`จำนวนแก้ว: ${tx.cups} -> ${newCups} แก้ว`)
  }
  if (tx.totalAmount !== newTotalAmount) {
    changes.push(`ยอดเงิน: ${tx.totalAmount.toLocaleString()}฿ -> ${newTotalAmount.toLocaleString()}฿`)
  }
  if ((tx.note || '') !== (note || '')) {
    changes.push(`หมายเหตุ: "${tx.note || '-'}" -> "${note || '-'}"`)
  }
  if (items.length > 0) {
    const oldItemsDesc = tx.items.map((i) => `${i.name} ×${i.quantity}`).join(', ') || '-'
    const newItemsDesc = items.map((i) => `${i.name} ×${i.quantity}`).join(', ') || '-'
    if (oldItemsDesc !== newItemsDesc) {
      changes.push(`รายการ: [${oldItemsDesc}] -> [${newItemsDesc}]`)
    }
  }

  const changesSummary = changes.length > 0 ? changes.join(' | ') : 'แก้ไขรายละเอียดทั่วไป'
  const cupDiff = newCups - tx.cups

  await prisma.$transaction(async (prismaTx) => {
    // 1. Log previous data in TransactionEditLog
    await prismaTx.transactionEditLog.create({
      data: {
        transactionId: tx.id,
        editedBy: session.userId,
        editorName: session.name,
        reason,
        changesSummary,
        previousData: JSON.stringify({
          cups: tx.cups,
          totalAmount: tx.totalAmount,
          note: tx.note,
          items: tx.items.map((i) => ({
            menuItemId: i.menuItemId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            subtotal: i.subtotal,
          })),
        }),
      },
    })

    // 2. Update transaction
    await prismaTx.transaction.update({
      where: { id: tx.id },
      data: {
        cups: newCups,
        totalAmount: newTotalAmount,
        note,
        updatedBy: session.userId,
        updatedAt: new Date(),
      },
    })

    // 3. Update items if provided
    if (items.length > 0) {
      await prismaTx.transactionItem.deleteMany({
        where: { transactionId: tx.id },
      })
      await prismaTx.transactionItem.createMany({
        data: items.map((item) => ({
          transactionId: tx.id,
          menuItemId: item.menuItemId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
      })
    }

    // 4. Update customer stamps & totalCups if cups changed and type === 'EARN'
    if (tx.type === 'EARN' && cupDiff !== 0) {
      const user = tx.user
      const newTotalCups = Math.max(0, user.totalCups + cupDiff)
      let newStamps = user.stamps + cupDiff
      let extraFreeRedeems = 0

      if (newStamps >= STAMPS_REQUIRED) {
        extraFreeRedeems = Math.floor(newStamps / STAMPS_REQUIRED)
        newStamps = newStamps % STAMPS_REQUIRED
      } else if (newStamps < 0) {
        newStamps = Math.max(0, newStamps)
      }

      await prismaTx.user.update({
        where: { id: user.id },
        data: {
          stamps: newStamps,
          totalCups: newTotalCups,
          ...(extraFreeRedeems > 0 ? { freeRedeems: { increment: extraFreeRedeems } } : {}),
        },
      })
    }
  })

  revalidatePath('/admin/transactions')
  revalidatePath(`/admin/customers/${tx.userId}`)
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/leaderboard')
  revalidatePath('/dashboard')
  revalidatePath('/history')

  return {
    success: true,
    message: `แก้ไขออเดอร์เรียบร้อยแล้ว (${changesSummary})`,
  }
}


