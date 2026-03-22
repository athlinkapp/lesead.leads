'use client'

export interface AuthUser { id: string; email: string }

interface FirebaseAuthResponse {
  localId: string; email: string; idToken: string; refreshToken: string; expiresIn: string
}

function getKey() {
  const k = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  if (!k) throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY is not set.')
  return k
}

function mapError(msg: string) {
  const map: Record<string, string> = {
    EMAIL_EXISTS: 'That email is already in use.',
    EMAIL_NOT_FOUND: 'Email or password is incorrect.',
    INVALID_LOGIN_CREDENTIALS: 'Email or password is incorrect.',
    INVALID_PASSWORD: 'Email or password is incorrect.',
    WEAK_PASSWORD: 'Password must be at least 6 characters.',
    MISSING_PASSWORD: 'Password is required.',
    INVALID_EMAIL: 'Enter a valid email address.',
  }
  return map[msg] ?? msg.replace(/_/g, ' ').toLowerCase()
}

async function firebasePost(path: 'accounts:signUp' | 'accounts:signInWithPassword', email: string, password: string) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${getKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) throw new Error(mapError(json?.error?.message ?? 'Authentication failed.'))
  return json as FirebaseAuthResponse
}

export async function signUpWithEmail(email: string, password: string) {
  const r = await firebasePost('accounts:signUp', email, password)
  return { user: { id: r.localId, email: r.email } as AuthUser, idToken: r.idToken, refreshToken: r.refreshToken }
}

export async function signInWithEmail(email: string, password: string) {
  const r = await firebasePost('accounts:signInWithPassword', email, password)
  return { user: { id: r.localId, email: r.email } as AuthUser, idToken: r.idToken, refreshToken: r.refreshToken }
}
