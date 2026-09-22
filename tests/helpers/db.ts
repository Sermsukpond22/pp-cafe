// tests/helpers/db.ts
import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const prisma = new PrismaClient()

type BaselineUser = {
  id: string
  username: string
  role: Role
}

let baselineUsers: BaselineUser[] = []

export function generateTestUsername(prefix = 'c'): string {
  const timeStr = Date.now().toString(36)
  const randStr = Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')
  return `test_e2e_${prefix}${timeStr.slice(-6)}${randStr}`
}

export async function snapshotBaseline() {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, role: true },
  })
  // Filter out any leftover test users if previous runs crashed
  baselineUsers = users.filter((u) => !u.username.startsWith('test_e2e_'))
  console.log(`[DB Guard] Baseline captured: ${baselineUsers.length} existing production/seed users.`)
}

export async function verifyBaselineUntouched() {
  const currentUsers = await prisma.user.findMany({
    select: { id: true, username: true, role: true },
  })
  for (const base of baselineUsers) {
    const found = currentUsers.find((u) => u.id === base.id)
    if (!found) {
      throw new Error(`CRITICAL SECURITY ALERT: Baseline user ${base.username} (${base.id}) was DELETED!`)
    }
    if (found.role !== base.role) {
      throw new Error(`CRITICAL SECURITY ALERT: Baseline user ${base.username} role changed from ${base.role} to ${found.role}!`)
    }
  }
  console.log(`[DB Guard] Baseline verification passed: all ${baselineUsers.length} pre-existing records intact!`)
}

export async function cleanupTestFixtures() {
  // 1. Delete test transaction items
  await prisma.transactionItem.deleteMany({
    where: {
      transaction: {
        OR: [
          { user: { username: { startsWith: 'test_e2e_' } } },
          { admin: { username: { startsWith: 'test_e2e_' } } },
        ],
      },
    },
  })

  // 2. Delete test transactions
  await prisma.transaction.deleteMany({
    where: {
      OR: [
        { user: { username: { startsWith: 'test_e2e_' } } },
        { admin: { username: { startsWith: 'test_e2e_' } } },
      ],
    },
  })

  // 3. Delete test users
  await prisma.user.deleteMany({
    where: {
      username: { startsWith: 'test_e2e_' },
    },
  })

  // 4. Delete test menu items
  await prisma.menuItem.deleteMany({
    where: {
      name: { startsWith: 'TEST_E2E_' },
    },
  })
}

export async function createTestCustomer(overrides?: {
  username?: string
  name?: string
  phone?: string | null
  password?: string
  stamps?: number
  freeRedeems?: number
  totalCups?: number
}) {
  const username = overrides?.username || generateTestUsername('c')
  const randPhone = Math.floor(1000000 + Math.random() * 9000000)
  const password = overrides?.password || 'password123'
  const passwordHash = await bcrypt.hash(password, 10)

  return prisma.user.create({
    data: {
      username,
      name: overrides?.name || `Test Customer ${username.slice(-4)}`,
      phone: overrides?.phone !== undefined ? overrides.phone : `089${randPhone}`,
      passwordHash,
      role: 'CUSTOMER',
      stamps: overrides?.stamps ?? 0,
      freeRedeems: overrides?.freeRedeems ?? 0,
      totalCups: overrides?.totalCups ?? 0,
    },
  })
}

export async function createTestAdmin(overrides?: {
  username?: string
  name?: string
  role?: 'ADMIN' | 'SUPER_ADMIN'
  password?: string
}) {
  const role = overrides?.role || 'ADMIN'
  const username = overrides?.username || generateTestUsername('a')
  const password = overrides?.password || 'adminpass123'
  const passwordHash = await bcrypt.hash(password, 10)

  return prisma.user.create({
    data: {
      username,
      name: overrides?.name || `Test Admin ${username.slice(-4)}`,
      passwordHash,
      role,
    },
  })
}

export async function createTestMenuItem(overrides?: {
  name?: string
  price?: number
  category?: string
  isActive?: boolean
}) {
  const rand = Math.floor(Math.random() * 1000000)
  return prisma.menuItem.create({
    data: {
      name: overrides?.name || `TEST_E2E_Coffee_${rand}`,
      price: overrides?.price ?? 50,
      category: overrides?.category || 'กาแฟ',
      isActive: overrides?.isActive ?? true,
    },
  })
}
