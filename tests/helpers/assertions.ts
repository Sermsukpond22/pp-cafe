// tests/helpers/assertions.ts

export type TestResult = {
  tier: string
  name: string
  passed: boolean
  durationMs: number
  error?: string
  implementationBug?: boolean
}

export const testResults: TestResult[] = []
let currentTier = 'General'

export function setTestTier(tier: string) {
  currentTier = tier
}

export function getCurrentTier(): string {
  return currentTier
}

export function assert(condition: unknown, message = 'Assertion failed'): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

export function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (actual !== expected) {
    const defaultMsg = `Expected ${JSON.stringify(expected)} but got ${JSON.stringify(actual)}`
    throw new Error(message ? `${message}: ${defaultMsg}` : defaultMsg)
  }
}

export function assertTrue(actual: unknown, message = 'Expected true') {
  if (actual !== true) {
    throw new Error(`${message}: got ${actual}`)
  }
}

export function assertFalse(actual: unknown, message = 'Expected false') {
  if (actual !== false) {
    throw new Error(`${message}: got ${actual}`)
  }
}

export function assertIncludes(haystack: string, needle: string, message?: string) {
  if (!haystack.includes(needle)) {
    const defaultMsg = `Expected text to include "${needle}"`
    throw new Error(message ? `${message}: ${defaultMsg}` : defaultMsg)
  }
}

export function assertNotIncludes(haystack: string, needle: string, message?: string) {
  if (haystack.includes(needle)) {
    const defaultMsg = `Expected text NOT to include "${needle}"`
    throw new Error(message ? `${message}: ${defaultMsg}` : defaultMsg)
  }
}

export function assertGte(actual: number, expected: number, message?: string) {
  if (actual < expected) {
    throw new Error(`${message || 'Assertion failed'}: expected ${actual} >= ${expected}`)
  }
}

export async function assertThrows(fn: () => Promise<unknown> | unknown, expectedErrorSubstr?: string) {
  let threw = false
  let thrownError: unknown = null
  try {
    await fn()
  } catch (err) {
    threw = true
    thrownError = err
  }

  if (!threw) {
    throw new Error('Expected function to throw, but it succeeded')
  }

  if (expectedErrorSubstr && thrownError instanceof Error) {
    if (!thrownError.message.includes(expectedErrorSubstr)) {
      throw new Error(`Expected error message to include "${expectedErrorSubstr}", got "${thrownError.message}"`)
    }
  }
}

export async function runTest(name: string, fn: () => Promise<void> | void, opts?: { isBugExpected?: boolean }) {
  const start = Date.now()
  try {
    await fn()
    const durationMs = Date.now() - start
    testResults.push({
      tier: currentTier,
      name,
      passed: true,
      durationMs,
    })
    console.log(`  ✓ [PASS] ${name} (${durationMs}ms)`)
  } catch (err: any) {
    const durationMs = Date.now() - start
    const errorMsg = err?.message || String(err)
    testResults.push({
      tier: currentTier,
      name,
      passed: false,
      durationMs,
      error: errorMsg,
      implementationBug: opts?.isBugExpected ?? true,
    })
    console.log(`  ✗ [FAIL] ${name} (${durationMs}ms)`)
    console.log(`    → ${errorMsg}`)
  }
}
