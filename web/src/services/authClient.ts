'use client'

export interface AuthUser { id: string; email: string }

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

function mapError(msg: string) {
  const map: Record<string, string> = {
    'That email is already in use.': 'That email is already in use.',
    'Email or password is incorrect.': 'Email or password is incorrect.',
    'Password must be at least 6 characters.': 'Password must be at least 6 characters.',
  }
  return map[msg] ?? msg
}

async function post(path: string, email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(mapError(json?.error ?? 'Authentication failed.'))
  return json as { user: AuthUser; token: string }
}

export async function signUpWithEmail(email: string, password: string) {
  const r = await post('signup', email, password)
  return { user: r.user, idToken: r.token, refreshToken: r.token }
}

export async function signInWithEmail(email: string, password: string) {
  const r = await post('signin', email, password)
  return { user: r.user, idToken: r.token, refreshToken: r.token }
}
