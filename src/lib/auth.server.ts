import { env } from 'cloudflare:workers'
import {
  deleteCookie,
  getCookie,
  getRequestProtocol,
  setCookie,
} from '@tanstack/react-start/server'

const COOKIE_NAME = 'admin_session'

function bytesToBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function timingSafeEqual(a: string, b: string): boolean {
  const encoder = new TextEncoder()
  const aBytes = encoder.encode(a)
  const bBytes = encoder.encode(b)
  const length = Math.max(aBytes.length, bBytes.length)
  let mismatch = aBytes.length === bBytes.length ? 0 : 1

  for (let i = 0; i < length; i++) {
    mismatch |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0)
  }

  return mismatch === 0
}

async function sessionToken(password: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode('ward-youth-admin'),
  )
  return bytesToBase64(new Uint8Array(signature))
}

export function getWardName(): string {
  return env.WARD_NAME.trim() || 'Ward'
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const password = env.ADMIN_PASSWORD
  const cookie = getCookie(COOKIE_NAME)
  if (!password || !cookie) {
    return false
  }
  const expected = await sessionToken(password)
  return timingSafeEqual(cookie, expected)
}

export async function loginAdmin(password: string): Promise<boolean> {
  const expected = env.ADMIN_PASSWORD
  if (!expected || !timingSafeEqual(password, expected)) {
    return false
  }

  setCookie(COOKIE_NAME, await sessionToken(expected), {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
    secure: getRequestProtocol() === 'https',
  })
  return true
}

export function logoutAdmin(): void {
  deleteCookie(COOKIE_NAME, { path: '/' })
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Unauthorized')
  }
}
