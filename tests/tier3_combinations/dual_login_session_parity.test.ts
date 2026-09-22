// tests/tier3_combinations/dual_login_session_parity.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer } from '../helpers/db.ts'
import { setTestSession, clearTestSession, createTestJwt } from '../helpers/session.ts'
import { login } from '@/app/actions/auth.ts'
import { requestApp } from '../helpers/http.ts'
import { RedirectError } from '../helpers/mock_navigation.mjs'

export async function runDualLoginSessionParityTier3Tests() {
  console.log('\n--- Tier 3: Dual Login Session Parity & Access Consistency ---')

  await runTest('T3.4: Username login and Phone login create equivalent valid sessions (F3)', async () => {
    const cust = await createTestCustomer({
      username: `test_e2e_dual_${Date.now()}`,
      phone: '0859998811',
      password: 'mypassword123',
    })

    // 1. Session created via username
    const tokenUsername = await createTestJwt({
      userId: cust.id,
      role: 'CUSTOMER',
      username: cust.username,
      name: cust.name,
    })

    // 2. Session created via phone
    const tokenPhone = await createTestJwt({
      userId: cust.id,
      role: 'CUSTOMER',
      username: cust.username,
      name: cust.name,
    })

    // Verify both tokens grant identical access to /profile
    const res1 = await requestApp('/profile', { sessionToken: tokenUsername })
    const res2 = await requestApp('/profile', { sessionToken: tokenPhone })
    assertEqual(res1.status, 200, 'Username token grants access to /profile')
    assertEqual(res2.status, 200, 'Phone token grants access to /profile')

    // Verify both tokens are blocked from /admin/dashboard with redirect to /dashboard
    const adminRes1 = await requestApp('/admin/dashboard', { sessionToken: tokenUsername })
    const adminRes2 = await requestApp('/admin/dashboard', { sessionToken: tokenPhone })
    assertEqual(adminRes1.status, 307)
    assertEqual(adminRes1.location, '/dashboard')
    assertEqual(adminRes2.status, 307)
    assertEqual(adminRes2.location, '/dashboard')
  })
}
