'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { DM_Serif_Display } from 'next/font/google'
import { signInWithEmail, signUpWithEmail } from '@/services/authClient'
import useAuthStore from '@/store/useAuthStore'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

type Tab = 'signin' | 'signup'

export default function AuthPage() {
  const router = useRouter()
  const setSession = useAuthStore((s) => s.setSession)

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result =
        tab === 'signin'
          ? await signInWithEmail(email, password)
          : await signUpWithEmail(email, password)
      setSession(result)
      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'rgba(13,26,15,0.8)',
    border: '1px solid #1c2e1f',
    color: '#e8f0e9',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    fontFamily: 'Inter, system-ui, sans-serif',
  }

  return (
    <div style={{ width: '100%', maxWidth: '420px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '10px' }}>
          <Image src="/logo.png" alt="LeSead" width={32} height={32} style={{ objectFit: 'contain' }} />
          <span
            className={dmSerif.className}
            style={{
              fontSize: '2rem',
              color: '#e8f0e9',
              letterSpacing: '-0.03em',
              lineHeight: 1,
            }}
          >
            LeSead
          </span>
        </div>
        <p style={{ color: '#6b8070', fontSize: '0.875rem', margin: 0, letterSpacing: '-0.01em' }}>
          Your AI-powered lead generation engine
        </p>
      </div>

      {/* Card */}
      <div
        style={{
          backgroundColor: 'rgba(17,31,19,0.8)',
          border: '1px solid #1c2e1f',
          borderRadius: '16px',
          padding: '32px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(74,222,128,0.04)',
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#0d1a0f',
            borderRadius: '10px',
            padding: '4px',
            marginBottom: '28px',
            border: '1px solid #1c2e1f',
          }}
        >
          {(['signin', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError('') }}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: '7px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: tab === t ? '600' : '400',
                backgroundColor: tab === t ? '#111f13' : 'transparent',
                color: tab === t ? '#4ade80' : '#6b8070',
                transition: 'all 0.15s',
                fontFamily: 'Inter, system-ui, sans-serif',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                if (tab !== t) e.currentTarget.style.color = '#a0b8a4'
              }}
              onMouseLeave={(e) => {
                if (tab !== t) e.currentTarget.style.color = '#6b8070'
              }}
            >
              {t === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '18px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: '600',
                color: '#6b8070',
                marginBottom: '7px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.06)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#1c2e1f'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '26px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.68rem',
                fontWeight: '600',
                color: '#6b8070',
                marginBottom: '7px',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={tab === 'signup' ? 'At least 6 characters' : '••••••••'}
              required
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(74,222,128,0.5)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,222,128,0.06)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#1c2e1f'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: '10px',
                padding: '12px 16px',
                color: '#fca5a5',
                fontSize: '0.875rem',
                marginBottom: '20px',
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#166534' : '#22c55e',
              color: '#020a03',
              border: 'none',
              borderRadius: '10px',
              padding: '13px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontFamily: 'Inter, system-ui, sans-serif',
              letterSpacing: '-0.01em',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(74,222,128,0.25)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#4ade80'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.35)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#22c55e'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.25)'
              }
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(2,10,3,0.25)',
                    borderTop: '2px solid #020a03',
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
                {tab === 'signin' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              tab === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {tab === 'signup' && (
          <p style={{ color: '#6b8070', fontSize: '0.75rem', textAlign: 'center', marginTop: '16px', marginBottom: 0, lineHeight: 1.6 }}>
            By creating an account you agree to our terms of service.
          </p>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
