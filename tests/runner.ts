// tests/runner.ts
import { testResults, setTestTier } from './helpers/assertions.ts'
import { prisma, snapshotBaseline, verifyBaselineUntouched, cleanupTestFixtures } from './helpers/db.ts'

// Import Tier 1
import { runAuthTier1Tests } from './tier1_features/auth.test.ts'
import { runStampsTier1Tests } from './tier1_features/stamps.test.ts'
import { runStaticProxyTier1Tests } from './tier1_features/static_proxy.test.ts'
import { runRevenueTimezoneTier1Tests } from './tier1_features/revenue_timezone.test.ts'
import { runUXNavigationTier1Tests } from './tier1_features/ux_navigation.test.ts'

// Import Tier 2
import { runAuthBoundariesTier2Tests } from './tier2_boundaries/auth_boundaries.test.ts'
import { runStampsConcurrencyTier2Tests } from './tier2_boundaries/stamps_concurrency.test.ts'
import { runStaticBoundariesTier2Tests } from './tier2_boundaries/static_boundaries.test.ts'
import { runRevenueBoundariesTier2Tests } from './tier2_boundaries/revenue_boundaries.test.ts'
import { runUXBoundariesTier2Tests } from './tier2_boundaries/ux_boundaries.test.ts'

// Import Tier 3
import { runLifecycleStampsRedeemTier3Tests } from './tier3_combinations/lifecycle_stamps_redeem.test.ts'
import { runAdminCreateCustomerLoginTier3Tests } from './tier3_combinations/admin_create_customer_login.test.ts'
import { runMenuEditOrderRevenueTier3Tests } from './tier3_combinations/menu_edit_order_revenue.test.ts'
import { runDualLoginSessionParityTier3Tests } from './tier3_combinations/dual_login_session_parity.test.ts'

// Import Tier 4
import { runCafeDayWorkloadTier4Tests } from './tier4_scenarios/cafe_day_workload.test.ts'

async function main() {
  const startTime = Date.now()
  console.log('=================================================================')
  console.log('       PP CAFE E2E 4-TIER TEST SUITE (OPAQUE-BOX RUNNER)         ')
  console.log('=================================================================')

  // Step 1: Pre-flight DB baseline capture
  await snapshotBaseline()
  await cleanupTestFixtures()

  try {
    // ─── TIER 1: FEATURE COVERAGE ──────────────────────────────────────────
    setTestTier('Tier 1: Feature Coverage')
    await runAuthTier1Tests()
    await runStampsTier1Tests()
    await runStaticProxyTier1Tests()
    await runRevenueTimezoneTier1Tests()
    await runUXNavigationTier1Tests()

    // ─── TIER 2: BOUNDARY & CORNER CASES ───────────────────────────────────
    setTestTier('Tier 2: Boundary & Corner Cases')
    await runAuthBoundariesTier2Tests()
    await runStampsConcurrencyTier2Tests()
    await runStaticBoundariesTier2Tests()
    await runRevenueBoundariesTier2Tests()
    await runUXBoundariesTier2Tests()

    // ─── TIER 3: CROSS-FEATURE COMBINATIONS ────────────────────────────────
    setTestTier('Tier 3: Cross-Feature Combinations')
    await runLifecycleStampsRedeemTier3Tests()
    await runAdminCreateCustomerLoginTier3Tests()
    await runMenuEditOrderRevenueTier3Tests()
    await runDualLoginSessionParityTier3Tests()

    // ─── TIER 4: REAL-WORLD SCENARIOS ──────────────────────────────────────
    setTestTier('Tier 4: Real-World Scenarios')
    await runCafeDayWorkloadTier4Tests()
  } finally {
    // Post-flight cleanup and safety audit
    console.log('\n[DB Guard] Running test fixture teardown and baseline audit...')
    await cleanupTestFixtures()
    await verifyBaselineUntouched()
    await prisma.$disconnect()
  }

  // Summary Reporting
  const total = testResults.length
  const passed = testResults.filter((r) => r.passed).length
  const failed = testResults.filter((r) => !r.passed).length
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2)

  console.log('\n=================================================================')
  console.log('                     TEST EXECUTION SUMMARY                      ')
  console.log('=================================================================')
  console.log(`Total Tests Executed : ${total}`)
  console.log(`Passed               : ${passed}`)
  console.log(`Failed (Escalations) : ${failed}`)
  console.log(`Duration             : ${totalDuration}s`)
  console.log('-----------------------------------------------------------------')

  // Breakdown per tier
  const tiers = Array.from(new Set(testResults.map((r) => r.tier)))
  for (const t of tiers) {
    const tierTests = testResults.filter((r) => r.tier === t)
    const tPassed = tierTests.filter((r) => r.passed).length
    const tFailed = tierTests.filter((r) => !r.passed).length
    console.log(`- ${t}: ${tPassed}/${tierTests.length} passed (${tFailed} failed)`)
  }

  if (failed > 0) {
    console.log('\n-----------------------------------------------------------------')
    console.log('             DISCOVERED IMPLEMENTATION DEFECTS                   ')
    console.log('   (These reflect features not yet implemented or bugs in src/)  ')
    console.log('-----------------------------------------------------------------')
    testResults
      .filter((r) => !r.passed)
      .forEach((r, idx) => {
        console.log(`${idx + 1}. [${r.tier}] ${r.name}`)
        console.log(`   Error: ${r.error}`)
      })
  }

  console.log('=================================================================\n')

  // Exit with non-zero code if any test failed
  if (failed > 0) {
    process.exit(1)
  }
}

main().catch(async (e) => {
  console.error('Test runner fatal error:', e)
  await prisma.$disconnect()
  process.exit(2)
})
