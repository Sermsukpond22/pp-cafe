// tests/tier1_features/static_proxy.test.ts
import { runTest, assertEqual, assertTrue, assertNotIncludes } from '../helpers/assertions.ts'
import { requestApp } from '../helpers/http.ts'
import { createTestJwt } from '../helpers/session.ts'

export async function runStaticProxyTier1Tests() {
  console.log('\n--- Tier 1: Static Asset Bypass & Proxy Routing Tests ---')

  // T1.3.1: Static SVG asset bypasses /login redirect (F7)
  await runTest('T1.3.1: Public static asset /file.svg accessible without login redirect (F7)', async () => {
    const res = await requestApp('/file.svg')
    // Bug in proxy: matcher redirects /file.svg to /login (307)
    // Fix in F7: static assets should return 200 directly
    assertEqual(res.status, 200, `Expected HTTP 200 for /file.svg, got ${res.status} (Location: ${res.location})`)
  })

  // T1.3.2: Static PNG/ICO asset bypasses /login redirect (F7)
  await runTest('T1.3.2: Static asset /favicon.ico does not redirect to /login (F7)', async () => {
    const res = await requestApp('/favicon.ico')
    assertTrue(res.status !== 307, `Static favicon must not redirect with 307`)
  })

  // T1.3.3: Unauthenticated access to /admin/dashboard redirects to /login
  await runTest('T1.3.3: Unauthenticated access to /admin/dashboard redirects to /login', async () => {
    const res = await requestApp('/admin/dashboard')
    assertEqual(res.status, 307, 'Should redirect with 307')
    assertEqual(res.location, '/login', 'Should redirect to /login')
  })

  // T1.3.4: Customer session accessing /admin/* redirects to /dashboard
  await runTest('T1.3.4: Customer session accessing /admin/dashboard redirects to /dashboard', async () => {
    const custToken = await createTestJwt({
      userId: 'test-cust-id',
      role: 'CUSTOMER',
      username: 'test_cust',
      name: 'Test Customer',
    })

    const res = await requestApp('/admin/dashboard', { sessionToken: custToken })
    assertEqual(res.status, 307, 'Should redirect with 307')
    assertEqual(res.location, '/dashboard', 'Customer should be redirected to /dashboard')
  })

  // T1.3.5: Admin session accessing /admin/manage-admins redirects to /admin/dashboard
  await runTest('T1.3.5: Regular ADMIN accessing /admin/manage-admins redirects to /admin/dashboard', async () => {
    const adminToken = await createTestJwt({
      userId: 'test-admin-id',
      role: 'ADMIN',
      username: 'test_admin',
      name: 'Test Admin',
    })

    const res = await requestApp('/admin/manage-admins', { sessionToken: adminToken })
    assertEqual(res.status, 307)
    assertEqual(res.location, '/admin/dashboard', 'Regular admin should not access manage-admins')
  })

  // T1.3.6: Super Admin session accessing /admin/manage-admins succeeds (200)
  await runTest('T1.3.6: SUPER_ADMIN accessing /admin/manage-admins returns 200', async () => {
    const saToken = await createTestJwt({
      userId: 'test-sa-id',
      role: 'SUPER_ADMIN',
      username: 'test_sa',
      name: 'Super Admin',
    })

    const res = await requestApp('/admin/manage-admins', { sessionToken: saToken })
    assertEqual(res.status, 200, 'SUPER_ADMIN should have access to /admin/manage-admins')
  })
}
