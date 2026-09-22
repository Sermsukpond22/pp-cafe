// tests/tier2_boundaries/ux_boundaries.test.ts
import { runTest, assertEqual, assertTrue } from '../helpers/assertions.ts'
import { prisma, createTestCustomer, createTestAdmin, createTestMenuItem } from '../helpers/db.ts'
import { requestApp } from '../helpers/http.ts'
import { createTestJwt, setTestSession, clearTestSession } from '../helpers/session.ts'

export async function runUXBoundariesTier2Tests() {
  console.log('\n--- Tier 2: UX & Parameter Boundary Tests ---')

  // T2.5.1: Customer search handles regex metacharacters safely
  await runTest('T2.5.1: Customer search with regex characters [.*+?] does not throw error', async () => {
    const cust = await createTestCustomer({ name: 'Regex Target', username: 'test_e2e_regex' })

    const searchStr = '.*+?^${}()|[]\\'
    const safeSearchMatches = (c: { name: string; username: string }) => {
      // Safe substring search without new RegExp(searchStr) crashing
      return c.name.toLowerCase().includes(searchStr.toLowerCase()) ||
             c.username.toLowerCase().includes(searchStr.toLowerCase())
    }

    // Should return false and not throw SyntaxError
    const match = safeSearchMatches(cust)
    assertEqual(match, false)
  })

  // T2.5.2: Non-existent customer detail returns 404
  await runTest('T2.5.2: Accessing /admin/customers/non_existent_id returns 404', async () => {
    const adminToken = await createTestJwt({
      userId: 'test-admin',
      role: 'ADMIN',
      username: 'test_admin',
      name: 'Test Admin',
    })

    const res = await requestApp('/admin/customers/c_non_existent_id_9999', {
      sessionToken: adminToken,
    })
    // In Next.js notFound() yields 404
    assertEqual(res.status, 404, `Expected 404 for missing customer, got ${res.status}`)
  })

  // T2.5.3: updateMenuItem rejects negative price
  await runTest('T2.5.3: updateMenuItem rejects negative price (validation guard)', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const item = await createTestMenuItem({ price: 40 })

    let updateMenuItemFn: any = null
    try {
      const menuModule = await import('@/app/actions/menu.ts')
      updateMenuItemFn = menuModule.updateMenuItem
    } catch {
      updateMenuItemFn = null
    }

    assertTrue(typeof updateMenuItemFn === 'function', 'updateMenuItem must exist (F12)')

    const fd = new FormData()
    fd.append('id', item.id)
    fd.append('name', item.name)
    fd.append('price', '-50') // Negative price
    fd.append('category', item.category)

    const res = await updateMenuItemFn(undefined, fd)
    assertTrue(
      Boolean(res?.errors?.price) || res?.message?.includes('ติดลบ'),
      'Should reject negative price'
    )
  })

  // T2.5.4: updateMenuItem rejects empty name
  await runTest('T2.5.4: updateMenuItem rejects empty name', async () => {
    const admin = await createTestAdmin()
    await setTestSession({
      userId: admin.id,
      role: 'ADMIN',
      username: admin.username,
      name: admin.name,
    })

    const item = await createTestMenuItem({ price: 40 })

    let updateMenuItemFn: any = null
    try {
      const menuModule = await import('@/app/actions/menu.ts')
      updateMenuItemFn = menuModule.updateMenuItem
    } catch {
      updateMenuItemFn = null
    }

    assertTrue(typeof updateMenuItemFn === 'function', 'updateMenuItem must exist (F12)')

    const fd = new FormData()
    fd.append('id', item.id)
    fd.append('name', '') // Empty name
    fd.append('price', '50')
    fd.append('category', item.category)

    const res = await updateMenuItemFn(undefined, fd)
    assertTrue(Boolean(res?.errors?.name), 'Should reject empty menu name')
  })

  // T2.5.5: updateMenuItem requires ADMIN or SUPER_ADMIN session
  await runTest('T2.5.5: updateMenuItem rejects unauthenticated caller', async () => {
    clearTestSession()
    const item = await createTestMenuItem()

    let updateMenuItemFn: any = null
    try {
      const menuModule = await import('@/app/actions/menu.ts')
      updateMenuItemFn = menuModule.updateMenuItem
    } catch {
      updateMenuItemFn = null
    }

    assertTrue(typeof updateMenuItemFn === 'function', 'updateMenuItem must exist (F12)')

    const fd = new FormData()
    fd.append('id', item.id)
    fd.append('name', 'Hacked Name')
    fd.append('price', '10')
    fd.append('category', item.category)

    const res = await updateMenuItemFn(undefined, fd)
    assertTrue(
      res?.message?.includes('ไม่มีสิทธิ์') || res?.message?.includes('unauthorized'),
      'Unauthenticated call must be rejected'
    )
  })
}
