// tests/tier3_combinations/admin_create_customer_login.test.ts
import { runTest, assertEqual, assertTrue, assertIncludes } from '../helpers/assertions.ts'
import { prisma, createTestAdmin } from '../helpers/db.ts'
import { setTestSession, clearTestSession, createTestJwt } from '../helpers/session.ts'
import { addCustomer, login } from '@/app/actions/auth.ts'
import { requestApp } from '../helpers/http.ts'
import { RedirectError } from '../helpers/mock_navigation.mjs'

export async function runAdminCreateCustomerLoginTier3Tests() {
  console.log('\n--- Tier 3: Admin Customer Creation -> Phone Login -> Profile Workflow ---')

  await runTest('T3.2: Admin creates customer -> Customer logs in with phone -> Views profile', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const rand = Math.floor(100000 + Math.random() * 900000)
    const username = `test_e2e_fl${rand}`
    const phone = `089${String(rand).padStart(7, '0')}`
    const password = 'mypassword123'
    const name = `Flow Customer ${rand}`

    // 1. Admin creates customer
    const createFd = new FormData()
    createFd.append('username', username)
    createFd.append('name', name)
    createFd.append('phone', phone)
    createFd.append('password', password)

    const createRes = await addCustomer(undefined, createFd)
    assertEqual(createRes.message, 'เพิ่มลูกค้าสำเร็จ')

    const createdCust = await prisma.user.findUnique({ where: { username } })
    assertTrue(createdCust !== null)

    // 2. Customer logs in using registered phone number (Dual Login F3)
    clearTestSession()
    const loginFd = new FormData()
    loginFd.append('username', phone) // Phone instead of username
    loginFd.append('password', password)

    try {
      await login(undefined, loginFd)
    } catch (err: any) {
      assertTrue(err instanceof RedirectError)
      assertEqual(err.url, '/dashboard')
    }

    // 3. Customer accesses /profile
    const custToken = await createTestJwt({
      userId: createdCust!.id,
      role: 'CUSTOMER',
      username: createdCust!.username,
      name: createdCust!.name,
    })

    const profileRes = await requestApp('/profile', { sessionToken: custToken })
    assertEqual(profileRes.status, 200)
    const profileHtml = await profileRes.text()

    assertIncludes(profileHtml, name, 'Profile must display customer name')
    assertIncludes(profileHtml, username, 'Profile must display username')
    assertIncludes(profileHtml, phone, 'Profile must display phone number')
  })
}
