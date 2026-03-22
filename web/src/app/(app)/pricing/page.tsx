'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { DM_Serif_Display } from 'next/font/google'
import { Check, Tag } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import useAuthStore from '@/store/useAuthStore'
import { createCheckoutSession, getCheckoutSessionStatus } from '@/services/apiClient'
import type { PlanId } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

const PLANS: {
  id: Exclude<PlanId, 'free'>
  name: string
  price: string
  period: string
  description: string
  features: string[]
  accent?: boolean
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29.99',
    period: '/month',
    description: 'For solo service businesses ready to start finding leads.',
    features: [
      '5 leads per scan · 1 scan per day',
      'Reddit, Craigslist, Facebook, Nextdoor, Instagram & X',
      'LinkedIn monitoring',
      'Zillow new listings & recently sold homes',
      'AI-generated reply for each lead',
      'Pipeline CRM to track leads',
      'Audience builder — 8 homes shown per scan',
      '1 scan per day for home sales',
      '1 business profile',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79.99',
    period: '/month',
    description: 'For growing businesses that need more leads and deeper insights.',
    features: [
      '10 leads per scan · 1 scan per day',
      'All sources + LinkedIn',
      'Zillow new listings & recently sold homes',
      'AI outreach message generator',
      'Full AI analysis, ICP & buyer personas',
      'Audience builder — 15 homes shown per scan',
      '1 scan per day for home sales · Facebook export',
      'Deep scan mode',
      '3 business profiles',
      'Priority support',
    ],
    accent: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '$199.99',
    period: '/month',
    description: 'For agencies and high-volume operators who need maximum output.',
    features: [
      '10 leads per scan · 2 scans per day',
      'All sources + LinkedIn',
      'Zillow new listings & recently sold homes',
      'Full AI suite — all features unlocked',
      'Audience builder — 25 homes shown per scan',
      '1 scan per day for home sales · Facebook export',
      'White-label CSV exports',
      'Unlimited business profiles',
      'API access',
      'Dedicated support',
    ],
  },
]

export default function PricingPage() {
  const planId = useAppStore((s) => s.planId)
  const stripeCustomerId = useAppStore((s) => s.stripeCustomerId)
  const setPlan = useAppStore((s) => s.setPlan)
  const user = useAuthStore((s) => s.user)

  const searchParams = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')
  const [promoCodes, setPromoCodes] = useState<Record<string, string>>({ starter: '', pro: '', scale: '' })
  const [promoFocused, setPromoFocused] = useState<string | null>(null)

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const sessionId = searchParams.get('session_id')
    if (checkout === 'success' && sessionId) {
      setSuccessMsg('Payment successful! Your plan has been upgraded.')
      getCheckoutSessionStatus(sessionId)
        .then((s) => {
          if (s.planId) setPlan(s.planId, s.customerId ?? undefined)
        })
        .catch(() => {})
    } else if (checkout === 'canceled') {
      setError('Checkout was canceled. No charges were made.')
    }
  }, [searchParams, setPlan])

  async function handleUpgrade(id: Exclude<PlanId, 'free'>) {
    setError('')
    setLoadingPlan(id)
    try {
      const promo = promoCodes[id]?.trim() || undefined
      const session = await createCheckoutSession(id, user?.email ?? undefined, stripeCustomerId ?? undefined, promo)
      window.location.href = session.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not start checkout. Please try again.')
      setLoadingPlan(null)
    }
  }

  return (
    <div style={{ maxWidth: '1000px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1
          className={dmSerif.className}
          style={{
            fontSize: '2.4rem',
            color: '#e8f0e9',
            margin: '0 0 10px',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
          }}
        >
          Choose your plan
        </h1>
        <p style={{ color: '#a0b8a4', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: '420px' }}>
          Upgrade anytime. Cancel anytime. No hidden fees.
        </p>
        <div style={{ marginTop: '16px' }}>
          <span
            style={{
              backgroundColor: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.2)',
              color: '#4ade80',
              borderRadius: '999px',
              padding: '4px 16px',
              fontSize: '0.78rem',
              fontWeight: '600',
              letterSpacing: '0.01em',
            }}
          >
            Current plan: {planId.charAt(0).toUpperCase() + planId.slice(1)}
          </span>
        </div>
      </div>

      {successMsg && (
        <div style={{ backgroundColor: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '14px 20px', color: '#4ade80', fontSize: '0.875rem', marginBottom: '28px', textAlign: 'center', lineHeight: 1.6 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '12px', padding: '14px 20px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '28px', lineHeight: 1.6 }}>
          {error}
        </div>
      )}

      {/* Free plan summary */}
      <div
        style={{
          backgroundColor: '#0a1509',
          border: '1px solid #1c2e1f',
          borderRadius: '12px',
          padding: '16px 22px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <span style={{ color: '#6b8070', fontSize: '0.68rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Free plan</span>
          <p style={{ color: '#a0b8a4', margin: '4px 0 0', fontSize: '0.84rem', lineHeight: 1.5 }}>
            3 leads per scan · 1 scan per day · Reddit, Craigslist, Facebook, Nextdoor, Instagram, X & Zillow · Audience builder (3 homes/scan · 1 scan/day) · 1 business profile
          </p>
        </div>
        {planId === 'free' && (
          <span style={{ marginLeft: 'auto', backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: '999px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Your current plan
          </span>
        )}
      </div>

      {/* Paid plan cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
        {PLANS.map((plan) => {
          const isCurrent = planId === plan.id
          const isLoading = loadingPlan === plan.id
          const isPro = plan.accent

          return (
            <div
              key={plan.id}
              style={{
                backgroundColor: isPro ? 'rgba(13,26,15,0.95)' : '#0d1a0f',
                border: isCurrent
                  ? '1px solid rgba(74,222,128,0.5)'
                  : isPro
                  ? '1px solid rgba(74,222,128,0.25)'
                  : '1px solid #1c2e1f',
                borderRadius: '16px',
                padding: '28px 24px 24px',
                position: 'relative',
                boxShadow: isPro ? '0 0 40px rgba(74,222,128,0.06), 0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.2)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = isPro ? '0 0 60px rgba(74,222,128,0.1), 0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = isPro ? '0 0 40px rgba(74,222,128,0.06), 0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.2)'
              }}
            >
              {/* Badge */}
              {isPro && !isCurrent && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#22c55e', color: '#020a03', borderRadius: '999px', padding: '4px 16px', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(74,222,128,0.3)' }}>
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', borderRadius: '999px', padding: '4px 16px', fontSize: '0.68rem', fontWeight: '700', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                  Current Plan
                </div>
              )}

              {/* Plan header */}
              <div style={{ marginBottom: '20px' }}>
                <p style={{ color: '#6b8070', fontSize: '0.68rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 10px' }}>
                  {plan.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span className={dmSerif.className} style={{ fontSize: '2.6rem', color: isPro ? '#4ade80' : '#e8f0e9', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {plan.price}
                  </span>
                  <span style={{ color: '#6b8070', fontSize: '0.84rem', letterSpacing: '-0.01em' }}>{plan.period}</span>
                </div>
                <p style={{ color: '#a0b8a4', fontSize: '0.84rem', margin: 0, lineHeight: 1.55 }}>
                  {plan.description}
                </p>
              </div>

              <div style={{ height: '1px', backgroundColor: '#1c2e1f', marginBottom: '20px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: isPro ? 'rgba(74,222,128,0.15)' : 'rgba(74,222,128,0.08)', border: `1px solid ${isPro ? 'rgba(74,222,128,0.35)' : 'rgba(74,222,128,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <Check size={9} color="#4ade80" strokeWidth={3} />
                    </div>
                    <span style={{ color: '#e8f0e9', fontSize: '0.84rem', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button disabled style={{ width: '100%', backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: '10px', padding: '11px 16px', fontSize: '0.875rem', fontWeight: '600', cursor: 'default', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em' }}>
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading}
                  style={{ width: '100%', backgroundColor: isLoading ? '#166534' : isPro ? '#22c55e' : 'transparent', color: isLoading ? '#020a03' : isPro ? '#020a03' : '#4ade80', border: isPro ? 'none' : '1px solid rgba(74,222,128,0.25)', borderRadius: '10px', padding: '11px 16px', fontSize: '0.875rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.01em', boxShadow: isPro && !isLoading ? '0 4px 16px rgba(74,222,128,0.2)' : 'none' }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      if (isPro) { e.currentTarget.style.backgroundColor = '#4ade80'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)' }
                      else { e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.08)'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)' }
                      e.currentTarget.style.transform = 'translateY(-1px)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      if (isPro) { e.currentTarget.style.backgroundColor = '#22c55e'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.2)' }
                      else { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.borderColor = 'rgba(74,222,128,0.25)' }
                      e.currentTarget.style.transform = 'translateY(0)'
                    }
                  }}
                >
                  {isLoading ? (
                    <>
                      <span style={{ width: '14px', height: '14px', border: '2px solid rgba(2,10,3,0.3)', borderTop: '2px solid #020a03', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                      Redirecting...
                    </>
                  ) : 'Upgrade Now'}
                </button>
              )}

              {/* Promo code */}
              {!isCurrent && (
                <div style={{ marginTop: '12px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: promoFocused === plan.id ? 'rgba(74,222,128,0.04)' : '#0a1509',
                      border: `1px solid ${promoFocused === plan.id ? 'rgba(74,222,128,0.3)' : '#1c2e1f'}`,
                      borderRadius: '9px',
                      padding: '8px 12px',
                      transition: 'border-color 0.15s, background-color 0.15s',
                    }}
                  >
                    <Tag size={12} color={promoFocused === plan.id ? '#4ade80' : '#6b8070'} style={{ flexShrink: 0, transition: 'color 0.15s' }} />
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCodes[plan.id]}
                      onChange={(e) => setPromoCodes(p => ({ ...p, [plan.id]: e.target.value.toUpperCase() }))}
                      onFocus={() => setPromoFocused(plan.id)}
                      onBlur={() => setPromoFocused(null)}
                      style={{
                        background: 'none',
                        border: 'none',
                        outline: 'none',
                        color: '#e8f0e9',
                        fontSize: '0.8rem',
                        fontFamily: 'Inter, system-ui, sans-serif',
                        letterSpacing: '0.04em',
                        width: '100%',
                        fontWeight: promoCodes[plan.id] ? '600' : '400',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', color: '#6b8070', fontSize: '0.78rem', marginTop: '28px', lineHeight: 1.6 }}>
        All plans include a 7-day free trial. Secure payments powered by Stripe.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
