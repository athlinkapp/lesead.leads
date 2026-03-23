'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { DM_Serif_Display } from 'next/font/google'
import { Check, Tag, Sparkles, Zap, Shield, Globe } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import useAuthStore from '@/store/useAuthStore'
import { createCheckoutSession, getCheckoutSessionStatus } from '@/services/apiClient'
import type { PlanId } from '@/lib/types'
import { useIsMobile } from '@/hooks/useIsMobile'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

// Promo codes that bypass Stripe and unlock plans directly
const PROMO_CODES: Record<string, PlanId> = {
  'STARTER2026': 'starter',
  'PRO2026': 'pro',
  'SCALE2026': 'scale',
  'BETASTARTER': 'starter',
  'BETAPRO': 'pro',
  'BETASCALE': 'scale',
  'FREEPRO': 'pro',
  'FREESCALE': 'scale',
}

const PLANS: {
  id: Exclude<PlanId, 'free'>
  name: string
  price: string
  period: string
  description: string
  tagline: string
  icon: React.ElementType
  features: string[]
  highlight?: string
  moneyBack?: string
  accent?: boolean
}[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '$29.99',
    period: '/month',
    tagline: 'For solo service businesses ready to start finding leads.',
    description: 'Everything you need to start generating qualified leads daily across the major platforms.',
    icon: Zap,
    moneyBack: '14-day money-back guarantee',
    features: [
      '5 leads per scan · 1 scan per day',
      'Reddit, Craigslist, Facebook & Nextdoor',
      'Instagram, X (Twitter) & Zillow',
      'LinkedIn monitoring',
      'AI-scored relevance on every lead',
      'AI-generated outreach reply per lead',
      'Pipeline CRM — track lead stages & notes',
      'Audience builder — 8 homes shown per scan',
      '1 home scan per day',
      '1 business profile',
      'Email support',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$79.99',
    period: '/month',
    tagline: 'For growing businesses that need more leads and deeper insights.',
    description: 'Triple your lead output with deeper AI analysis, more results, and Facebook audience export.',
    icon: Sparkles,
    highlight: 'Most Popular',
    features: [
      '10 leads per scan · 1 scan per day',
      'All 8 sources — Reddit, Craigslist, Facebook, Nextdoor, Instagram, X, LinkedIn & Zillow',
      'Deep scan mode — maximum web coverage',
      'Full AI analysis — ICP, buyer personas & market opportunities',
      'AI outreach message generator per lead',
      'Lead scoring with intent signals',
      'Pipeline CRM with deal value estimates',
      'Audience builder — 15 homes shown per scan',
      '1 home scan per day · CSV export to Facebook Ads',
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
    tagline: 'For agencies and high-volume operators who need maximum output.',
    description: 'Built for teams that run lean and close fast. Double your daily scans, get the deepest audience data, and unlock API access.',
    icon: Globe,
    features: [
      '10 leads per scan · 2 scans per day — double the daily leads',
      'All 8 sources with priority crawling',
      'Deep scan mode on every run',
      'Full AI suite — all Pro features unlocked',
      'Advanced lead scoring with purchase timeline estimates',
      'Multi-lead bulk outreach generation',
      'Full pipeline CRM with team notes',
      'Audience builder — 25 homes shown per scan',
      '1 home scan per day · Facebook Ads CSV export',
      'White-label CSV exports — your brand, your data',
      'API access — integrate leads into your own systems',
      'Unlimited business profiles',
      'Dedicated account support',
      'Early access to new features',
    ],
  },
]

export default function PricingPage() {
  const planId = useAppStore((s) => s.planId)
  const stripeCustomerId = useAppStore((s) => s.stripeCustomerId)
  const setPlan = useAppStore((s) => s.setPlan)
  const user = useAuthStore((s) => s.user)
  const isMobile = useIsMobile()

  const searchParams = useSearchParams()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState('')
  const [error, setError] = useState('')
  const [promoCodes, setPromoCodes] = useState<Record<string, string>>({ starter: '', pro: '', scale: '' })
  const [promoFocused, setPromoFocused] = useState<string | null>(null)
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null)

  useEffect(() => {
    const checkout = searchParams.get('checkout')
    const sessionId = searchParams.get('session_id')
    if (checkout === 'success' && sessionId) {
      setSuccessMsg('Payment successful! Your plan has been upgraded.')
      getCheckoutSessionStatus(sessionId)
        .then((s) => { if (s.planId) setPlan(s.planId, s.customerId ?? undefined) })
        .catch(() => {})
    } else if (checkout === 'canceled') {
      setError('Checkout was canceled. No charges were made.')
    }
  }, [searchParams, setPlan])

  function handleApplyPromo(planCardId: string) {
    const code = promoCodes[planCardId]?.trim().toUpperCase()
    if (!code) return
    const unlocksPlan = PROMO_CODES[code]
    if (unlocksPlan) {
      setPlan(unlocksPlan)
      setPromoSuccess(`Code applied! You now have the ${unlocksPlan.charAt(0).toUpperCase() + unlocksPlan.slice(1)} plan.`)
      setError('')
    } else {
      setError(`Promo code "${code}" is not valid.`)
      setPromoSuccess(null)
    }
  }

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
    <div style={{ maxWidth: '1060px', fontFamily: 'Inter, system-ui, sans-serif', width: '100%' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <h1 className={dmSerif.className} style={{ fontSize: isMobile ? '2rem' : '2.4rem', color: '#e8f0e9', margin: '0 0 10px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
          Choose your plan
        </h1>
        <p style={{ color: '#a0b8a4', margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.65, maxWidth: '420px' }}>
          Upgrade anytime. Cancel anytime. No hidden fees.
        </p>
        <div style={{ marginTop: '14px' }}>
          <span style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: '999px', padding: '4px 16px', fontSize: '0.78rem', fontWeight: '600' }}>
            Current plan: {planId.charAt(0).toUpperCase() + planId.slice(1)}
          </span>
        </div>
      </div>

      {(successMsg || promoSuccess) && (
        <div style={{ backgroundColor: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '12px', padding: '14px 20px', color: '#4ade80', fontSize: '0.875rem', marginBottom: '24px', textAlign: 'center' }}>
          {successMsg || promoSuccess}
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: '12px', padding: '14px 20px', color: '#fca5a5', fontSize: '0.875rem', marginBottom: '24px' }}>
          {error}
        </div>
      )}

      {/* Free plan summary */}
      <div style={{ backgroundColor: '#0a1509', border: '1px solid #1c2e1f', borderRadius: '12px', padding: '14px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <Shield size={14} color="#6b8070" strokeWidth={1.8} style={{ flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <span style={{ color: '#6b8070', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Free — $0</span>
          <p style={{ color: '#a0b8a4', margin: '3px 0 0', fontSize: '0.82rem', lineHeight: 1.5 }}>
            3 leads/scan · 1 scan/day · Reddit, Craigslist, Facebook, Nextdoor, Instagram, X & Zillow · Audience builder (3 homes · 1 scan/day) · 1 business profile
          </p>
        </div>
        {planId === 'free' && (
          <span style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: '999px', padding: '3px 12px', fontSize: '0.72rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
            Your plan
          </span>
        )}
      </div>

      {/* Paid plan cards */}
      <div style={{ display: isMobile ? 'flex' : 'grid', gridTemplateColumns: 'repeat(3, 1fr)', flexDirection: isMobile ? 'row' : undefined, gap: '16px', alignItems: 'start', overflowX: isMobile ? 'auto' : 'visible', WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], paddingBottom: isMobile ? '8px' : 0, paddingTop: '16px' }}>
        {PLANS.map((plan) => {
          const isCurrent = planId === plan.id
          const isLoading = loadingPlan === plan.id
          const isPro = plan.accent
          const PlanIcon = plan.icon

          return (
            <div
              key={plan.id}
              style={{
                backgroundColor: isPro ? 'rgba(13,26,15,0.98)' : '#0d1a0f',
                border: isCurrent ? '1px solid rgba(74,222,128,0.5)' : isPro ? '1px solid rgba(74,222,128,0.28)' : '1px solid #1c2e1f',
                borderRadius: '16px',
                padding: '24px 20px 20px',
                minWidth: isMobile ? '280px' : undefined,
                flex: isMobile ? '0 0 280px' : undefined,
                position: 'relative',
                boxShadow: isPro ? '0 0 40px rgba(74,222,128,0.07), 0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = isPro ? '0 0 60px rgba(74,222,128,0.1), 0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.3)' }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isPro ? '0 0 40px rgba(74,222,128,0.07), 0 4px 20px rgba(0,0,0,0.3)' : '0 2px 12px rgba(0,0,0,0.2)' }}
            >
              {/* Badge */}
              {plan.highlight && !isCurrent && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#22c55e', color: '#020a03', borderRadius: '999px', padding: '4px 16px', fontSize: '0.68rem', fontWeight: '700', letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap', boxShadow: '0 4px 12px rgba(74,222,128,0.3)' }}>
                  {plan.highlight}
                </div>
              )}
              {isCurrent && (
                <div style={{ position: 'absolute', top: '-13px', left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.35)', color: '#4ade80', borderRadius: '999px', padding: '4px 16px', fontSize: '0.68rem', fontWeight: '700', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>
                  Current Plan
                </div>
              )}

              {/* Plan header */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isPro ? 'rgba(74,222,128,0.12)' : 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <PlanIcon size={13} color="#4ade80" strokeWidth={2} />
                  </div>
                  <p style={{ color: '#6b8070', fontSize: '0.68rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>{plan.name}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '8px' }}>
                  <span className={dmSerif.className} style={{ fontSize: '2.4rem', color: isPro ? '#4ade80' : '#e8f0e9', letterSpacing: '-0.04em', lineHeight: 1 }}>{plan.price}</span>
                  <span style={{ color: '#6b8070', fontSize: '0.82rem' }}>{plan.period}</span>
                </div>
                <p style={{ color: '#a0b8a4', fontSize: '0.82rem', margin: 0, lineHeight: 1.55 }}>{plan.description}</p>
              </div>

              <div style={{ height: '1px', backgroundColor: '#1c2e1f', marginBottom: '16px' }} />

              {/* Features */}
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', flex: 1 }}>
                {plan.features.map((f, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px', marginBottom: '9px' }}>
                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', backgroundColor: isPro ? 'rgba(74,222,128,0.15)' : 'rgba(74,222,128,0.08)', border: `1px solid ${isPro ? 'rgba(74,222,128,0.35)' : 'rgba(74,222,128,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                      <Check size={8} color="#4ade80" strokeWidth={3} />
                    </div>
                    <span style={{ color: '#e8f0e9', fontSize: '0.82rem', lineHeight: 1.5 }}>{f}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <button disabled style={{ width: '100%', backgroundColor: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: '10px', padding: '11px 16px', fontSize: '0.875rem', fontWeight: '600', cursor: 'default', fontFamily: 'Inter, system-ui, sans-serif' }}>
                  Current Plan
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isLoading}
                  style={{ width: '100%', backgroundColor: isLoading ? '#166534' : isPro ? '#22c55e' : 'transparent', color: isLoading ? '#020a03' : isPro ? '#020a03' : '#4ade80', border: isPro ? 'none' : '1px solid rgba(74,222,128,0.25)', borderRadius: '10px', padding: '11px 16px', fontSize: '0.875rem', fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s', fontFamily: 'Inter, system-ui, sans-serif', boxShadow: isPro && !isLoading ? '0 4px 16px rgba(74,222,128,0.2)' : 'none' }}
                  onMouseEnter={(e) => { if (!isLoading) { if (isPro) { e.currentTarget.style.backgroundColor = '#4ade80'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)' } else { e.currentTarget.style.backgroundColor = 'rgba(74,222,128,0.08)' } e.currentTarget.style.transform = 'translateY(-1px)' } }}
                  onMouseLeave={(e) => { if (!isLoading) { if (isPro) { e.currentTarget.style.backgroundColor = '#22c55e'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.2)' } else { e.currentTarget.style.backgroundColor = 'transparent' } e.currentTarget.style.transform = 'translateY(0)' } }}
                >
                  {isLoading ? (<><span style={{ width: '14px', height: '14px', border: '2px solid rgba(2,10,3,0.3)', borderTop: '2px solid #020a03', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />Redirecting...</>) : 'Upgrade Now'}
                </button>
              )}

              {/* Money-back guarantee */}
              {plan.moneyBack && (
                <p style={{ textAlign: 'center', color: '#6b8070', fontSize: '0.7rem', margin: '8px 0 0', lineHeight: 1.5 }}>
                  ✓ {plan.moneyBack}
                </p>
              )}

              {/* Promo code */}
              {!isCurrent && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: promoFocused === plan.id ? 'rgba(74,222,128,0.04)' : '#0a1509', border: `1px solid ${promoFocused === plan.id ? 'rgba(74,222,128,0.3)' : '#1c2e1f'}`, borderRadius: '9px', padding: '7px 10px', transition: 'border-color 0.15s' }}>
                    <Tag size={11} color={promoFocused === plan.id ? '#4ade80' : '#6b8070'} style={{ flexShrink: 0 }} />
                    <input
                      type="text"
                      placeholder="Promo code"
                      value={promoCodes[plan.id]}
                      onChange={(e) => setPromoCodes(p => ({ ...p, [plan.id]: e.target.value.toUpperCase() }))}
                      onFocus={() => setPromoFocused(plan.id)}
                      onBlur={() => setPromoFocused(null)}
                      style={{ background: 'none', border: 'none', outline: 'none', color: '#e8f0e9', fontSize: '0.78rem', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.04em', width: '100%', fontWeight: promoCodes[plan.id] ? '600' : '400' }}
                    />
                    {promoCodes[plan.id] && (
                      <button
                        onClick={() => handleApplyPromo(plan.id)}
                        style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', borderRadius: '6px', padding: '3px 8px', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'Inter, system-ui, sans-serif' }}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', color: '#6b8070', fontSize: '0.78rem', marginTop: '28px', lineHeight: 1.6 }}>
        Starter includes a 14-day money-back guarantee. Secure payments powered by Stripe.
      </p>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
