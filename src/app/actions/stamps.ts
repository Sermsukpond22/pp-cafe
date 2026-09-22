'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import type { ActionState } from './auth'
import { revalidatePath } from 'next/cache'

const STAMPS_REQUIRED = Number(process.env.STAMPS_REQUIRED ?? 10)

export type SelectedOrderItem = {
  menuItemId?: string
  name: string
  price: number
  quantity: number
}

// ─── Add Stamps with Multi-item Order Support ─────────────────────────────────
export async function addStamps(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { message: 'ไม่มีสิทธิ์ดำเนินการ' }
  }

  const userId = formData.get('userId') as string
  const note = (formData.get('note') as string) || ''
  const itemsJson = formData.get('itemsJson') as string

  if (!userId) {
    return { message: 'กรุณาเลือกลูกค้า' }
  }

  let items: SelectedOrderItem[] = []
  if (itemsJson) {
    try {
      items = JSON.parse(itemsJson)
    } catch {
      items = []
    }
  }

  let cups = Number(formData.get('cups') || 0)
  let totalAmount = Number(formData.get('totalAmount') || 0)

  if (items.length > 0) {
    cups = items.reduce((sum, item) => sum + item.quantity, 0)
    totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  }

  if (cups <= 0) {
    return { message: 'กรุณาเลือกเมนูหรือระบุจำนวนแก้วอย่างน้อย 1 แก้ว' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { message: 'ไม่พบข้อมูลลูกค้า' }

  // คำนวณแต้มและการแลกฟรีอัตโนมัติ (ถ้าแต้มรวม >= STAMPS_REQUIRED)
  let newStamps = user.stamps + cups
  const autoRedeems = Math.floor(newStamps / STAMPS_REQUIRED)

  if (autoRedeems > 0) {
    newStamps = newStamps % STAMPS_REQUIRED
  }

  // สร้างบันทึกแบบ Transaction บิล + รายการเมนูย่อย
  await prisma.$transaction(async (tx) => {
    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: 'EARN',
        cups,
        totalAmount,
        note: note || (items.length > 0 ? items.map((i) => `${i.name} x${i.quantity}`).join(', ') : null),
        createdBy: session.userId,
      },
    })

    // บันทึกแต่ละเมนูที่ขายได้
    if (items.length > 0) {
      await tx.transactionItem.createMany({
        data: items.map((item) => ({
          transactionId: transaction.id,
          menuItemId: item.menuItemId || null,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          subtotal: item.price * item.quantity,
        })),
      })
    } else if (cups > 0) {
      await tx.transactionItem.create({
        data: {
          transactionId: transaction.id,
          menuItemId: null,
          name: note || 'เครื่องดื่ม (ระบุแก้วเอง)',
          price: Math.round(totalAmount / cups),
          quantity: cups,
          subtotal: totalAmount,
        },
      })
    }

    // อัปเดตแต้มของลูกค้า
    await tx.user.update({
      where: { id: userId },
      data: {
        stamps: newStamps,
        totalCups: { increment: cups },
        ...(autoRedeems > 0 ? { freeRedeems: { increment: autoRedeems } } : {}),
      },
    })
  })

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/transactions')
  revalidatePath(`/admin/customers/${userId}`)
  revalidatePath('/dashboard')
  revalidatePath('/history')

  const message =
    autoRedeems > 0
      ? `บันทึก ${cups} แก้ว (${totalAmount.toLocaleString()} บาท) สำเร็จ! 🎉 ลูกค้าครบ ${STAMPS_REQUIRED} แก้ว แลกฟรีได้ ${autoRedeems} แก้ว!`
      : `บันทึก ${cups} แก้ว (${totalAmount.toLocaleString()} บาท) สำเร็จ! (แต้มปัจจุบัน ${newStamps}/${STAMPS_REQUIRED})`

  return { message, success: true }
}

// ─── Redeem Free Cup ─────────────────────────────────────────────────────────
export async function redeemFreeCup(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const session = await getSession()
  if (!session || (session.role !== 'ADMIN' && session.role !== 'SUPER_ADMIN')) {
    return { message: 'ไม่มีสิทธิ์ดำเนินการ' }
  }

  const userId = formData.get('userId') as string
  if (!userId) return { message: 'ไม่พบ userId' }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { message: 'ไม่พบลูกค้า' }

  if (user.freeRedeems <= 0) {
    return { message: 'ลูกค้าไม่มีสิทธิ์แลกน้ำฟรี' }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.user.updateMany({
        where: {
          id: userId,
          freeRedeems: { gt: 0 },
        },
        data: {
          freeRedeems: { decrement: 1 },
        },
      })

      if (updateResult.count === 0) {
        throw new Error('INSUFFICIENT_FREE_REDEEMS')
      }

      await tx.transaction.create({
        data: {
          userId,
          type: 'REDEEM',
          cups: 1,
          totalAmount: 0,
          note: 'แลกเครื่องดื่มฟรี 1 แก้ว',
          createdBy: session.userId,
        },
      })
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'INSUFFICIENT_FREE_REDEEMS') {
      return { message: 'ลูกค้าไม่มีสิทธิ์แลกน้ำฟรี' }
    }
    throw error
  }

  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/transactions')
  revalidatePath(`/admin/customers/${userId}`)
  revalidatePath('/dashboard')
  revalidatePath('/history')

  return { message: 'แลกน้ำฟรีสำเร็จ 1 แก้ว! ☕', success: true }
}
