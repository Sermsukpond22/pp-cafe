// tests/helpers/http.ts

const BASE_URL = process.env.TEST_APP_URL || 'http://localhost:3000'

export type HttpResponse = {
  status: number
  statusText: string
  headers: Headers
  location: string | null
  text: () => Promise<string>
  json: () => Promise<any>
}

export async function requestApp(
  path: string,
  options?: RequestInit & { sessionToken?: string }
): Promise<HttpResponse> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`
  const headers = new Headers(options?.headers || {})

  if (options?.sessionToken) {
    headers.set('Cookie', `session=${options.sessionToken}`)
  }

  const res = await fetch(url, {
    ...options,
    headers,
    redirect: options?.redirect || 'manual',
  })

  return {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    location: res.headers.get('location'),
    text: () => res.text(),
    json: () => res.json(),
  }
}
