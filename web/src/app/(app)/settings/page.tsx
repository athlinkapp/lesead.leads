'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DM_Serif_Display } from 'next/font/google'
import useAppStore from '@/store/useAppStore'
import useAuthStore from '@/store/useAuthStore'
import { createBillingPortalSession } from '@/services/apiClient'
import type { BusinessProfile, Industry, BudgetRange, Platform } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

const CARD: React.CSSProperties = {
  backgroundColor: '#0d1a0f',
  border: '1px solid #1c2e1f',
  borderRadius: '16px',
  padding: '28px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const INPUT: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#0d1a0f',
  border: '1px solid #1c2e1f',
  color: '#e8f0e9',
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  color: '#6b8070',
  fontSize: '0.67rem',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '7px',
  fontWeight: '600',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const INDUSTRIES: Industry[] = [
  'Landscaping', 'Pressure Washing', 'Window Cleaning', 'Pest Control',
  'House Cleaning', 'Pool Service', 'Painting', 'Gutter Cleaning',
  'Roofing', 'HVAC', 'Plumbing', 'Electrical', 'Other Service',
]

const BUDGETS: BudgetRange[] = ['<$500', '$500-2k', '$2k-5k', '$5k-10k', '$10k+']

const PLATFORMS: Platform[] = [
  'Instagram', 'LinkedIn', 'TikTok', 'Facebook', 'Google',
  'Cold Email', 'Cold DM', 'Content Marketing', 'Paid Ads',
  'Twitter/X', 'YouTube', 'Reddit',
]

function focusStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#4ade80'
}
function blurStyle(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#1c2e1f'
}

export default function SettingsPage() {
  const router = useRouter()
  const businessProfile = useAppStore((s) => s.businessProfile)
  const setBusinessProfile = useAppStore((s) => s.setBusinessProfile)
  const planId = useAppStore((s) => s.planId)
  const stripeCustomerId = useAppStore((s) => s.stripeCustomerId)
  const user = useAuthStore((s) => s.user)
  const clearSession = useAuthStore((s) => s.clearSession)

  const [saved, setSaved] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')

  const [form, setForm] = useState({
    businessName: '',
    industry: 'Landscaping' as Industry,
    offer: '',
    pricing: '',
    revenueGoal: '',
    location: '',
    serviceArea: '',
    targetAudience: '',
    differentiators: '',
    budget: '<$500' as BudgetRange,
    platforms: [] as Platform[],
  })

  useEffect(() => {
    if (businessProfile) {
      setForm({
        businessName: businessProfile.businessName,
        industry: businessProfile.industry,
        offer: businessProfile.offer,
        pricing: businessProfile.pricing,
        revenueGoal: businessProfile.revenueGoal,
        location: businessProfile.location,
        serviceArea: businessProfile.serviceArea,
        targetAudience: businessProfile.targetAudience,
        differentiators: businessProfile.differentiators,
        budget: businessProfile.budget,
        platforms: businessProfile.platforms,
      })
    }
  }, [businessProfile])

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function togglePlatform(p: Platform) {
    setForm((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(p)
        ? prev.platforms.filter((x) => x !== p)
        : [...prev.platforms, p],
    }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const profile: BusinessProfile = {
      id: businessProfile?.id ?? `bp-${Date.now()}`,
      ...form,
      remoteOk: false,
      goals: [],
      createdAt: businessProfile?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setBusinessProfile(profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function handleBillingPortal() {
    if (!stripeCustomerId) { setBillingError('No billing account found. Upgrade to a paid plan first.'); return }
    setBillingError('')
    setBillingLoading(true)
    try {
      const session = await createBillingPortalSession(stripeCustomerId)
      window.location.href = session.url
    } catch (err: unknown) {
      setBillingError(err instanceof Error ? err.message : 'Could not open billing portal.')
      setBillingLoading(false)
    }
  }

  function handleSignOut() {
    clearSession()
    router.push('/auth')
  }

  const textareaStyle: React.CSSProperties = {
    ...INPUT,
    resize: 'vertical',
    minHeight: '80px',
    fontFamily: 'inherit',
    lineHeight: 1.5,
  }

  return (
    <div style={{ maxWidth: '720px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1
        className={dmSerif.className}
        style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 28px', letterSpacing: '-0.03em' }}
      >
        Settings
      </h1>

      {/* Business Profile */}
      <div style={{ ...CARD, marginBottom: '24px' }}>
        <h2
          className={dmSerif.className}
          style={{ fontSize: '1.3rem', color: '#e8f0e9', margin: '0 0 20px', letterSpacing: '-0.02em' }}
        >
          Business Profile
        </h2>
        <form onSubmit={handleSave}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={LABEL}>Business Name</label>
              <input
                type="text"
                value={form.businessName}
                onChange={(e) => update('businessName', e.target.value)}
                placeholder="My Business LLC"
                required
                style={INPUT}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={LABEL}>Industry</label>
              <select
                value={form.industry}
                onChange={(e) => update('industry', e.target.value as Industry)}
                style={{ ...INPUT, cursor: 'pointer' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i} style={{ backgroundColor: '#111f13' }}>{i}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Your Offer</label>
              <textarea
                value={form.offer}
                onChange={(e) => update('offer', e.target.value)}
                placeholder="What service do you provide and what makes it great?"
                style={textareaStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={LABEL}>Pricing</label>
              <input
                type="text"
                value={form.pricing}
                onChange={(e) => update('pricing', e.target.value)}
                placeholder="e.g. $250–$1,200/job"
                style={INPUT}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={LABEL}>Revenue Goal</label>
              <input
                type="text"
                value={form.revenueGoal}
                onChange={(e) => update('revenueGoal', e.target.value)}
                placeholder="e.g. $10k/month"
                style={INPUT}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={LABEL}>Location</label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => update('location', e.target.value)}
                placeholder="Austin, TX"
                style={INPUT}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={LABEL}>Service Area</label>
              <input
                type="text"
                value={form.serviceArea}
                onChange={(e) => update('serviceArea', e.target.value)}
                placeholder="30-mile radius around Austin"
                style={INPUT}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Target Audience</label>
              <textarea
                value={form.targetAudience}
                onChange={(e) => update('targetAudience', e.target.value)}
                placeholder="Who are your ideal customers? Be specific."
                style={textareaStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Differentiators</label>
              <textarea
                value={form.differentiators}
                onChange={(e) => update('differentiators', e.target.value)}
                placeholder="What makes you different from competitors?"
                style={textareaStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
            </div>
            <div>
              <label style={LABEL}>Marketing Budget</label>
              <select
                value={form.budget}
                onChange={(e) => update('budget', e.target.value as BudgetRange)}
                style={{ ...INPUT, cursor: 'pointer' }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              >
                {BUDGETS.map((b) => (
                  <option key={b} value={b} style={{ backgroundColor: '#111f13' }}>{b}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Platforms */}
          <div style={{ marginBottom: '20px' }}>
            <label style={LABEL}>Marketing Platforms</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {PLATFORMS.map((p) => {
                const isSelected = form.platforms.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePlatform(p)}
                    style={{
                      backgroundColor: isSelected ? 'rgba(74,222,128,0.12)' : 'transparent',
                      border: isSelected ? '1px solid rgba(74,222,128,0.35)' : '1px solid rgba(232,240,233,0.12)',
                      color: isSelected ? '#4ade80' : '#a0b8a4',
                      borderRadius: '7px',
                      padding: '5px 12px',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.12s',
                    }}
                  >
                    {p}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="submit"
              style={{
                backgroundColor: '#22c55e',
                color: '#020a03',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#4ade80')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#22c55e')}
            >
              Save Profile
            </button>
            {saved && (
              <span
                style={{
                  color: '#4ade80',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                ✓ Profile saved
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Account */}
      <div style={CARD}>
        <h2
          className={dmSerif.className}
          style={{ fontSize: '1.3rem', color: '#e8f0e9', margin: '0 0 20px', letterSpacing: '-0.02em' }}
        >
          Account
        </h2>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ color: '#a0b8a4', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>
            Email
          </p>
          <p style={{ color: '#e8f0e9', fontSize: '0.9rem', margin: '0 0 4px' }}>{user?.email ?? '—'}</p>
          <p style={{ color: '#a0b8a4', fontSize: '0.8rem', margin: 0 }}>
            Plan: <span style={{ color: '#4ade80', fontWeight: '600' }}>{planId.charAt(0).toUpperCase() + planId.slice(1)}</span>
          </p>
        </div>

        {billingError && (
          <div
            style={{
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#fca5a5',
              fontSize: '0.84rem',
              marginBottom: '16px',
            }}
          >
            {billingError}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleBillingPortal}
            disabled={billingLoading}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(232,240,233,0.15)',
              color: '#e8f0e9',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: billingLoading ? 'not-allowed' : 'pointer',
              opacity: billingLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'background-color 0.12s',
            }}
            onMouseEnter={(e) => { if (!billingLoading) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={(e) => { if (!billingLoading) e.currentTarget.style.backgroundColor = 'transparent' }}
          >
            {billingLoading ? (
              <>
                <span
                  style={{
                    width: '12px', height: '12px',
                    border: '2px solid rgba(232,240,233,0.2)',
                    borderTop: '2px solid #e8f0e9',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Loading...
              </>
            ) : 'Manage Billing'}
          </button>

          <button
            onClick={handleSignOut}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
              borderRadius: '8px',
              padding: '9px 18px',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
