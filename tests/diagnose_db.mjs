import { cleanupTestFixtures, verifyBaselineUntouched, prisma } from './helpers/db.ts'

async function main() {
  console.log('Running cleanupTestFixtures...')
  await cleanupTestFixtures()
  console.log('Cleanup finished without error!')
  await verifyBaselineUntouched()
  console.log('Baseline verification passed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
