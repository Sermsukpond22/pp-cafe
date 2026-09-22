// tests/tier2_boundaries/static_boundaries.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { requestApp } from '../helpers/http.ts'

export async function runStaticBoundariesTier2Tests() {
  console.log('\n--- Tier 2: Static Asset & Routing Boundary Tests ---')

  // T2.3.1: Query parameter on static asset bypasses /login
  await runTest('T2.3.1: Static asset with query string (/file.svg?v=1.0) does not redirect to /login', async () => {
    const res = await requestApp('/file.svg?v=1.0')
    assertEqual(res.status, 200, `Expected 200 for static asset with query param, got ${res.status}`)
  })

  // T2.3.2: Image extension .png bypasses /login
  await runTest('T2.3.2: Static image route (.png) does not redirect to /login', async () => {
    const res = await requestApp('/window.svg') // public Next default asset
    assertEqual(res.status, 200, `Expected 200 for /window.svg, got ${res.status}`)
  })

  // T2.3.3: Route starting with /login-extra is protected
  await runTest('T2.3.3: Route /login-fake is not treated as public /login and redirects to /login', async () => {
    const res = await requestApp('/login-fake')
    assertEqual(res.status, 307, 'Should redirect to /login')
    assertEqual(res.location, '/login')
  })

  // T2.3.4: Dotfile .env is never accessible publicly
  await runTest('T2.3.4: Dotfile .env request is blocked or 404', async () => {
    const res = await requestApp('/.env')
    assertTrue(
      res.status === 404 || res.status === 307 || res.status === 403,
      `Dotfiles must never be served, got status ${res.status}`
    )
  })

  // T2.3.5: Public route /register accessible without session
  await runTest('T2.3.5: Public route /register is accessible without session (200)', async () => {
    const res = await requestApp('/register')
    assertEqual(res.status, 200, 'Public register page should return 200')
  })
}
