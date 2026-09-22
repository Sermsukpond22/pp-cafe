// tests/helpers/mock_headers.mjs
class MockCookieStore {
  constructor() {
    this.store = new Map()
  }
  get(name) {
    const val = this.store.get(name)
    return val !== undefined ? { name, value: val } : undefined
  }
  set(name, value, options) {
    this.store.set(name, typeof value === 'object' ? value.value : value)
  }
  delete(name) {
    this.store.delete(name)
  }
  clear() {
    this.store.clear()
  }
}

export const globalMockCookies = new MockCookieStore()

export async function cookies() {
  return globalMockCookies
}

export async function headers() {
  return new Headers()
}
