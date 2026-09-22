// tests/tier2_boundaries/auth_boundaries.test.ts
import { runTest, assertEqual, assertTrue, assertFalse } from '../helpers/assertions.ts'
import { prisma, createTestAdmin, createTestCustomer } from '../helpers/db.ts'
import { setTestSession, clearTestSession } from '../helpers/session.ts'
import { addCustomer, login } from '@/app/actions/auth.ts'
import { LoginSchema, AddCustomerSchema } from '@/lib/validations.ts'

export async function runAuthBoundariesTier2Tests() {
  console.log('\n--- Tier 2: Auth Boundary & Corner Case Tests ---')

  // T2.1.1: Empty password in login
  await runTest('T2.1.1: Login with empty string password is rejected by validation', async () => {
    const fd = new FormData()
    fd.append('username', 'anyuser')
    fd.append('password', '')

    const res = await login(undefined, fd)
    assertTrue(Boolean(res?.errors?.password), 'Expected validation error on empty password')
  })

  // T2.1.2: Empty username in login
  await runTest('T2.1.2: Login with empty string username is rejected by validation', async () => {
    const fd = new FormData()
    fd.append('username', '')
    fd.append('password', 'password123')

    const res = await login(undefined, fd)
    assertTrue(Boolean(res?.errors?.username), 'Expected validation error on empty username')
  })

  // T2.1.3: Malformed phone with letters
  await runTest('T2.1.3: addCustomer with alphabetic phone number is rejected', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('username', 'test_e2e_badphone1')
    fd.append('name', 'Bad Phone 1')
    fd.append('phone', '081abc5678')
    fd.append('password', 'pass1234')

    const res = await addCustomer(undefined, fd)
    assertTrue(Boolean(res?.errors?.phone), 'Should reject phone containing letters')
  })

  // T2.1.4: Malformed phone with under 9 digits
  await runTest('T2.1.4: addCustomer with short phone (< 9 digits) is rejected', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('username', 'test_e2e_badphone2')
    fd.append('name', 'Bad Phone 2')
    fd.append('phone', '12345')
    fd.append('password', 'pass1234')

    const res = await addCustomer(undefined, fd)
    assertTrue(Boolean(res?.errors?.phone), 'Should reject phone with < 9 digits')
  })

  // T2.1.5: Malformed phone with over 10 digits
  await runTest('T2.1.5: addCustomer with excessively long phone (> 10 digits) is rejected', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('username', 'test_e2e_badphone3')
    fd.append('name', 'Bad Phone 3')
    fd.append('phone', '0812345678999')
    fd.append('password', 'pass1234')

    const res = await addCustomer(undefined, fd)
    assertTrue(Boolean(res?.errors?.phone), 'Should reject phone with > 10 digits')
  })

  // T2.1.6: SQL Injection / Meta-character in username rejected by validation
  await runTest('T2.1.6: Username with SQL injection metacharacters is rejected by regex', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('username', "admin' OR 1=1--")
    fd.append('name', 'Attacker')
    fd.append('password', 'pass1234')

    const res = await addCustomer(undefined, fd)
    assertTrue(Boolean(res?.errors?.username), 'Should reject username with special characters')
  })

  // T2.1.7: Duplicate username in addCustomer
  await runTest('T2.1.7: Duplicate username in addCustomer returns field error', async () => {
    const admin = await createTestAdmin()
    const existingCust = await createTestCustomer()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const fd = new FormData()
    fd.append('username', existingCust.username) // Duplicate
    fd.append('name', 'Duplicate User')
    fd.append('phone', '')
    fd.append('password', 'pass1234')

    const res = await addCustomer(undefined, fd)
    assertTrue(
      Boolean(res?.errors?.username),
      'Should return error for duplicate username'
    )
    assertEqual(res?.errors?.username?.[0], 'ชื่อผู้ใช้นี้ถูกใช้แล้ว')
  })
}
