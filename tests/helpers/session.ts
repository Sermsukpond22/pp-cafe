// tests/helpers/session.ts
import { SignJWT, jwtVerify } from 'jose'
import { globalMockCookies } from './mock_headers.mjs'
import type { Role } from '@prisma/client'

const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'pp-cafe-super-secret-jwt-key-2026-very-secure'
)

export type SessionPayload = {
  userId: string
  role: Role
  username: string
  name: string
}

export async function createTestJwt(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey)
}

export async function setTestSession(payload: SessionPayload): Promise<string> {
  const token = await createTestJwt(payload)
  globalMockCookies.set('session', token)
  return token
}

export function clearTestSession() {
  globalMockCookies.delete('session')
}

export async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, secretKey, { algorithms: ['HS256'] })
  return payload as unknown as SessionPayload
}
