// tests/tier1_features/auth.test.ts
import { runTest, assertEqual, assertTrue, assertIncludes } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin } from '../helpers/db.ts'
import { setTestSession, clearTestSession } from '../helpers/session.ts'
import { login, addCustomer } from '@/app/actions/auth.ts'
import { RedirectError } from '../helpers/mock_navigation.mjs'

export async function runAuthTier1Tests() {
  console.log('\n--- Tier 1: Auth & Role Security Tests ---')

  // T1.1: Login with valid username
  await runTest('T1.1.1: Customer login with valid username succeeds', async () => {
    const cust = await createTestCustomer({ password: 'password123' })
    const fd = new FormData()
    fd.append('username', cust.username)
    fd.append('password', 'password123')

    clearTestSession()
    try {
      const res = await login(undefined, fd)
      // If no redirect thrown, check for errors
      assertEqual(res?.message, undefined, 'Login should not return error message on success')
    } catch (err: any) {
      // In Next.js server actions, successful login redirects to /dashboard
      assertTrue(err instanceof RedirectError, 'Expected RedirectError on successful login')
      assertEqual(err.url, '/dashboard', 'Customer login should redirect to /dashboard')
    }
  })

  // T1.1.2: Login with registered phone number (Dual Login F3)
  await runTest('T1.1.2: Customer login with registered phone number succeeds (Dual Login F3)', async () => {
    const cust = await createTestCustomer({ phone: '0812345678', password: 'password123' })
    const fd = new FormData()
    fd.append('username', '0812345678')
    fd.append('password', 'password123')

    clearTestSession()
    try {
      const res = await login(undefined, fd)
      assertEqual(res?.message, undefined, 'Phone login should succeed without error message')
    } catch (err: any) {
      assertTrue(err instanceof RedirectError, 'Expected RedirectError on successful phone login')
      assertEqual(err.url, '/dashboard', 'Phone login should redirect to /dashboard')
    }
  })

  // T1.1.3: addCustomer with active ADMIN session succeeds
  await runTest('T1.1.3: addCustomer with active ADMIN session creates customer', async () => {
    const admin = await createTestAdmin({ role: 'ADMIN' })
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const rand = Math.floor(100000 + Math.random() * 900000)
    const newUsername = `test_e2e_c${rand}`
    const fd = new FormData()
    fd.append('username', newUsername)
    fd.append('name', `Created Customer ${rand}`)
    fd.append('phone', '0891112233')
    fd.append('password', 'secret123')

    const res = await addCustomer(undefined, fd)
    assertEqual(res?.message, 'เพิ่มลูกค้าสำเร็จ')

    const dbUser = await prisma.user.findUnique({ where: { username: newUsername } })
    assertTrue(dbUser !== null, 'Customer should be saved in database')
    assertEqual(dbUser?.role, 'CUSTOMER')
  })

  // T1.1.4: addCustomer with active SUPER_ADMIN session succeeds
  await runTest('T1.1.4: addCustomer with active SUPER_ADMIN session creates customer', async () => {
    const superAdmin = await createTestAdmin({ role: 'SUPER_ADMIN' })
    await setTestSession({
      userId: superAdmin.id,
      role: 'SUPER_ADMIN',
      username: superAdmin.username,
      name: superAdmin.name,
    })

    const rand = Math.floor(100000 + Math.random() * 900000)
    const newUsername = `test_e2e_s${rand}`
    const fd = new FormData()
    fd.append('username', newUsername)
    fd.append('name', `SA Customer ${rand}`)
    fd.append('phone', '0894445566')
    fd.append('password', 'secret123')

    const res = await addCustomer(undefined, fd)
    assertEqual(res?.message, 'เพิ่มลูกค้าสำเร็จ')

    const dbUser = await prisma.user.findUnique({ where: { username: newUsername } })
    assertTrue(dbUser !== null, 'Customer should be created by SUPER_ADMIN')
  })

  // T1.1.5: Rejection of unauthenticated addCustomer (F1)
  await runTest('T1.1.5: Rejection of unauthenticated addCustomer (Security F1)', async () => {
    clearTestSession() // No session cookie

    const rand = Math.floor(100000 + Math.random() * 900000)
    const unauthUsername = `test_e2e_u${rand}`
    const fd = new FormData()
    fd.append('username', unauthUsername)
    fd.append('name', 'Unauth Hacker')
    fd.append('phone', '0899998877')
    fd.append('password', 'secret123')

    const res = await addCustomer(undefined, fd)

    // MUST return unauthorized message and NOT create user in DB
    const isUnauthorized = res?.message?.includes('ไม่มีสิทธิ์') || res?.message?.includes('เข้าสู่ระบบ') || res?.message?.includes('unauthorized')
    assertTrue(isUnauthorized, `Expected unauthorized error message, got: ${res?.message}`)

    const dbUser = await prisma.user.findUnique({ where: { username: unauthUsername } })
    assertTrue(dbUser === null, 'Unauthenticated request must NOT create customer in database!')
  })

  // T1.1.6: Rejection of CUSTOMER role calling addCustomer (F1)
  await runTest('T1.1.6: Rejection of CUSTOMER role calling addCustomer (Role Guard F1)', async () => {
    const cust = await createTestCustomer()
    await setTestSession({
      userId: cust.id,
      role: 'CUSTOMER',
      username: cust.username,
      name: cust.name,
    })

    const rand = Math.floor(100000 + Math.random() * 900000)
    const illegalUsername = `test_e2e_x${rand}`
    const fd = new FormData()
    fd.append('username', illegalUsername)
    fd.append('name', 'By Customer')
    fd.append('phone', '0895556677')
    fd.append('password', 'secret123')

    const res = await addCustomer(undefined, fd)
    const isUnauthorized = res?.message?.includes('ไม่มีสิทธิ์') || res?.message?.includes('เข้าสู่ระบบ')
    assertTrue(isUnauthorized, `CUSTOMER role should receive unauthorized message, got: ${res?.message}`)

    const dbUser = await prisma.user.findUnique({ where: { username: illegalUsername } })
    assertTrue(dbUser === null, 'Customer role call must NOT create customer in database!')
  })
}
