'use server'

import bcrypt from 'bcryptjs'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { createSession, deleteSession } from '@/lib/session'
import { RegisterSchema, LoginSchema, AddCustomerSchema } from '@/lib/validations'

export type ActionState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

// ─── Register (self-signup) ───────────────────────────────────────────────────
export async function register(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    username: formData.get('username'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const validated = RegisterSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { username, name, phone, password } = validated.data

  // Check duplicate username
  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return { errors: { username: ['ชื่อผู้ใช้นี้ถูกใช้แล้ว'] } }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      name,
      phone: phone || null,
      passwordHash,
      role: 'CUSTOMER',
    },
  })

  await createSession({
    userId: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
  })

  redirect('/dashboard')
}

// ─── Login ────────────────────────────────────────────────────────────────────
export async function login(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    username: formData.get('username'),
    password: formData.get('password'),
  }

  const validated = LoginSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { username, password } = validated.data

  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) {
    return { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatch) {
    return { message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' }
  }

  await createSession({
    userId: user.id,
    role: user.role,
    username: user.username,
    name: user.name,
  })

  if (user.role === 'CUSTOMER') {
    redirect('/dashboard')
  } else {
    redirect('/admin/dashboard')
  }
}

// ─── Logout ───────────────────────────────────────────────────────────────────
export async function logout() {
  await deleteSession()
  redirect('/login')
}

// ─── Admin: Add Customer ──────────────────────────────────────────────────────
export async function addCustomer(
  state: ActionState | undefined,
  formData: FormData
): Promise<ActionState> {
  const raw = {
    username: formData.get('username'),
    name: formData.get('name'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  }

  const validated = AddCustomerSchema.safeParse(raw)
  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { username, name, phone, password } = validated.data

  const existing = await prisma.user.findUnique({ where: { username } })
  if (existing) {
    return { errors: { username: ['ชื่อผู้ใช้นี้ถูกใช้แล้ว'] } }
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      username,
      name,
      phone: phone || null,
      passwordHash,
      role: 'CUSTOMER',
    },
  })

  return { message: 'เพิ่มลูกค้าสำเร็จ' }
}
