'use client'

import { useState } from 'react'
import { DM_Serif_Display } from 'next/font/google'
import { Users, Download, ChevronDown, ChevronUp } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { buildAudience } from '@/services/apiClient'
import type { AudienceLead } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

const INPUT: React.CSSProperties = {
  width: '100%',
  backgroundColor: '#111f13',
  border: '1px solid #1c2e1f',
  color: '#e8f0e9',
  borderRadius: '9px',
  padding: '10px 14px',
  fontSize: '0.875rem',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  fontFamily: 'Inter, system-ui, sans-serif',
}

const LABEL: React.CSSProperties = {
  display: 'block',
  color: '#6b8070',
  fontSize: '0.68rem',
  fontWeight: '600',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: '6px',
  fontFamily: 'Inter, system-ui, sans-serif',
}

function exportCSV(leads: AudienceLead[]) {
  const headers = ['First Name', 'Last Name', 'Address', 'City', 'State', 'Zip', 'Home Value', 'Score', 'Email', 'Email Subject', 'Email Draft']
  const rows = leads.map((l) => [
    l.ownerFirstName,
    l.ownerLastName,
    l.address,
    l.city,
    l.state,
    l.zip,
    l.homeValue.toString(),
    l.totalScore.toString(),
    l.email ?? '',
    l.emailSubject ?? '',
    (l.emailDraft ?? '').replace(/,/g, ';').replace(/\n/g, ' '),
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lesead-audience-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// Facebook Custom Audience format: email, fn, ln, zip, country
function exportFacebookCSV(leads: AudienceLead[]) {
  const withEmail = leads.filter(l => l.email)
  if (withEmail.length === 0) return
  const headers = ['email', 'fn', 'ln', 'zip', 'country']
  const rows = withEmail.map((l) => [
    (l.email ?? '').toLowerCase().trim(),
    l.ownerFirstName.toLowerCase().trim(),
    l.ownerLastName.toLowerCase().trim(),
    l.zip.trim(),
    'us',
  ])
  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `lesead-facebook-audience-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function AudienceRow({ lead, onExpand, expanded, isEven }: { lead: AudienceLead; onExpand: () => void; expanded: boolean; isEven: boolean }) {
  const scoreColor = lead.totalScore >= 70 ? '#4ade80' : lead.totalScore >= 40 ? '#fbbf24' : '#f87171'
  const scoreBg = lead.totalScore >= 70 ? 'rgba(74,222,128,0.08)' : lead.totalScore >= 40 ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)'
  const scoreBorder = lead.totalScore >= 70 ? 'rgba(74,222,128,0.18)' : lead.totalScore >= 40 ? 'rgba(234,179,8,0.18)' : 'rgba(239,68,68,0.18)'

  return (
    <>
      <tr
        style={{
          borderBottom: '1px solid #1c2e1f',
          backgroundColor: isEven ? 'rgba(17,31,19,0.4)' : 'transparent',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(74,222,128,0.03)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = isEven ? 'rgba(17,31,19,0.4)' : 'transparent')}
      >
        <td style={{ padding: '12px 16px', color: '#e8f0e9', fontSize: '0.84rem', whiteSpace: 'nowrap', fontWeight: '500', letterSpacing: '-0.01em' }}>
          {lead.ownerFirstName} {lead.ownerLastName}
        </td>
        <td style={{ padding: '12px 16px', color: '#a0b8a4', fontSize: '0.84rem', lineHeight: 1.4 }}>
          {lead.address}, {lead.city}, {lead.state} {lead.zip}
        </td>
        <td style={{ padding: '12px 16px', color: '#e8f0e9', fontSize: '0.84rem', whiteSpace: 'nowrap', fontWeight: '500' }}>
          ${lead.homeValue.toLocaleString()}
        </td>
        <td style={{ padding: '12px 16px' }}>
          <span
            style={{
              backgroundColor: scoreBg,
              border: `1px solid ${scoreBorder}`,
              color: scoreColor,
              borderRadius: '999px',
              padding: '2px 10px',
              fontSize: '0.72rem',
              fontWeight: '700',
            }}
          >
            {lead.totalScore}
          </span>
        </td>
        <td style={{ padding: '12px 16px', color: lead.email ? '#4ade80' : '#6b8070', fontSize: '0.84rem', letterSpacing: '-0.01em' }}>
          {lead.email ?? '—'}
        </td>
        <td style={{ padding: '12px 16px' }}>
          {lead.emailDraft ? (
            <button
              onClick={onExpand}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: '#4ade80',
                fontSize: '0.78rem',
                cursor: 'pointer',
                padding: 0,
                fontWeight: '500',
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? 'Hide draft' : 'View draft'}
            </button>
          ) : (
            <span style={{ color: '#6b8070', fontSize: '0.78rem' }}>—</span>
          )}
        </td>
      </tr>
      {expanded && lead.emailDraft && (
        <tr style={{ borderBottom: '1px solid #1c2e1f' }}>
          <td colSpan={6} style={{ padding: '0 16px 16px' }}>
            {lead.emailSubject && (
              <p style={{ color: '#a0b8a4', fontSize: '0.8rem', margin: '0 0 8px', lineHeight: 1.5 }}>
                <strong style={{ color: '#e8f0e9' }}>Subject:</strong> {lead.emailSubject}
              </p>
            )}
            <div
              style={{
                backgroundColor: '#111f13',
                border: '1px solid rgba(74,222,128,0.1)',
                borderRadius: '10px',
                padding: '14px 16px',
                color: '#e8f0e9',
                fontSize: '0.84rem',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {lead.emailDraft}
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

const AUDIENCE_DAILY_LIMITS: Record<string, number> = { free: 1, starter: 1, pro: 1, scale: 1 }
const AUDIENCE_RESULTS_LIMITS: Record<string, number> = { free: 3, starter: 8, pro: 15, scale: 25 }

export default function AudiencePage() {
  const businessProfile = useAppStore((s) => s.businessProfile)
  const audienceResult = useAppStore((s) => s.audienceResult)
  const setAudienceResult = useAppStore((s) => s.setAudienceResult)
  const audienceScansToday = useAppStore((s) => s.audienceScansToday)
  const lastAudienceScanDate = useAppStore((s) => s.lastAudienceScanDate)
  const recordAudienceScan = useAppStore((s) => s.recordAudienceScan)
  const planId = useAppStore((s) => s.planId)

  const [location, setLocation] = useState(businessProfile?.location ?? '')
  const [radius, setRadius] = useState(25)
  const [minHomeValue, setMinHomeValue] = useState(400000)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const scansUsedToday = lastAudienceScanDate === today ? audienceScansToday : 0
  const dailyLimit = AUDIENCE_DAILY_LIMITS[planId] ?? 3
  const scanLimitReached = scansUsedToday >= dailyLimit
  const canExportFacebook = planId === 'pro' || planId === 'scale'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!businessProfile) { setError('Set up your business profile first.'); return }
    if (scanLimitReached) { setError(`You've used all ${dailyLimit} audience scans for today. Resets at midnight.`); return }
    setError('')
    setLoading(true)
    try {
      const profileWithLocation = { ...businessProfile, location, serviceArea: `${radius} miles` }
      const result = await buildAudience(profileWithLocation, minHomeValue)
      setAudienceResult(result)
      recordAudienceScan()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Build failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resultsLimit = AUDIENCE_RESULTS_LIMITS[planId] ?? 3
  const leads = (audienceResult?.leads ?? []).slice(0, resultsLimit)

  return (
    <div style={{ maxWidth: '1100px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          className={dmSerif.className}
          style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 6px', letterSpacing: '-0.03em' }}
        >
          Audience Builder
        </h1>
        <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Find homeowners in your area who match your ideal customer profile.
        </p>
      </div>

      {!businessProfile && (
        <div
          style={{
            backgroundColor: 'rgba(234,179,8,0.04)',
            border: '1px solid rgba(234,179,8,0.18)',
            borderRadius: '12px',
            padding: '14px 18px',
            marginBottom: '20px',
            color: '#fbbf24',
            fontSize: '0.875rem',
            lineHeight: 1.6,
          }}
        >
          Please{' '}
          <a href="/settings" style={{ color: '#4ade80', textDecoration: 'none', fontWeight: '500' }}>
            set up your business profile
          </a>{' '}
          before building an audience.
        </div>
      )}

      {/* Form card */}
      <div
        style={{
          backgroundColor: '#0d1a0f',
          border: '1px solid #1c2e1f',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '28px',
          maxWidth: '640px',
        }}
      >
        <h2
          className={dmSerif.className}
          style={{ fontSize: '1.15rem', color: '#e8f0e9', margin: '0 0 20px', letterSpacing: '-0.02em' }}
        >
          Search Parameters
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={LABEL}>Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Austin, TX"
                required
                style={INPUT}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#1c2e1f')}
              />
            </div>
            <div>
              <label style={LABEL}>Radius (miles)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                min={1}
                max={100}
                style={INPUT}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#1c2e1f')}
              />
            </div>
            <div>
              <label style={LABEL}>Min. Home Value ($)</label>
              <input
                type="number"
                value={minHomeValue}
                onChange={(e) => setMinHomeValue(Number(e.target.value))}
                min={0}
                step={50000}
                style={INPUT}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#1c2e1f')}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.18)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#fca5a5',
                fontSize: '0.84rem',
                marginBottom: '16px',
                lineHeight: 1.6,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || scanLimitReached}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: loading ? '#166534' : scanLimitReached ? 'rgba(74,222,128,0.06)' : '#22c55e',
              color: scanLimitReached ? '#4ade80' : '#020a03',
              border: scanLimitReached ? '1px solid rgba(74,222,128,0.2)' : 'none',
              borderRadius: '10px',
              padding: '11px 24px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading || scanLimitReached ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: loading || scanLimitReached ? 'none' : '0 4px 16px rgba(74,222,128,0.2)',
              opacity: scanLimitReached ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading && !scanLimitReached) {
                e.currentTarget.style.backgroundColor = '#4ade80'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading && !scanLimitReached) {
                e.currentTarget.style.backgroundColor = '#22c55e'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.2)'
              }
            }}
          >
            {loading ? (
              <>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    border: '2px solid rgba(2,10,3,0.3)',
                    borderTop: '2px solid #020a03',
                    borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite',
                    display: 'inline-block',
                  }}
                />
                Building audience...
              </>
            ) : scanLimitReached ? (
              <>
                <Users size={15} />
                Scan used today — resets tomorrow
              </>
            ) : (
              <>
                <Users size={15} />
                Build Audience
              </>
            )}
          </button>
          {!scanLimitReached && (
            <p style={{ color: '#6b8070', fontSize: '0.78rem', margin: '10px 0 0', fontFamily: 'Inter, system-ui, sans-serif' }}>
              1 scan per day · shows top {resultsLimit} results
            </p>
          )}
        </form>
      </div>

      {/* Results */}
      {audienceResult && (
        <div>
          {/* Summary stats row */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', alignItems: 'center' }}>
            {[
              { label: 'Properties Found', value: audienceResult.propertiesFound },
              { label: 'Enriched', value: audienceResult.enriched },
              { label: 'With Email', value: audienceResult.enriched - audienceResult.skippedNoEmail },
              { label: 'Skipped', value: audienceResult.skippedLowScore + audienceResult.skippedNoEmail },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  backgroundColor: '#0d1a0f',
                  border: '1px solid #1c2e1f',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  minWidth: '110px',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(74,222,128,0.12)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1c2e1f'
                }}
              >
                <p
                  className={dmSerif.className}
                  style={{ color: '#e8f0e9', margin: '0 0 2px', fontSize: '1.8rem', letterSpacing: '-0.03em', lineHeight: 1 }}
                >
                  {value}
                </p>
                <p style={{ color: '#6b8070', margin: 0, fontSize: '0.72rem', letterSpacing: '0.02em' }}>{label}</p>
              </div>
            ))}
            <div style={{ display: 'flex', gap: '8px', alignSelf: 'center', marginLeft: 'auto' }}>
              <button
                onClick={() => exportCSV(leads)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  backgroundColor: 'transparent',
                  border: '1px solid rgba(232,240,233,0.12)',
                  color: '#a0b8a4',
                  borderRadius: '9px',
                  padding: '10px 18px',
                  fontSize: '0.84rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
                  e.currentTarget.style.color = '#e8f0e9'
                  e.currentTarget.style.borderColor = 'rgba(232,240,233,0.22)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#a0b8a4'
                  e.currentTarget.style.borderColor = 'rgba(232,240,233,0.12)'
                }}
              >
                <Download size={14} /> Export CSV
              </button>
              {canExportFacebook ? (
                <button
                  onClick={() => exportFacebookCSV(leads)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    backgroundColor: 'rgba(24,119,242,0.08)',
                    border: '1px solid rgba(24,119,242,0.25)',
                    color: '#6ba3e0',
                    borderRadius: '9px',
                    padding: '10px 18px',
                    fontSize: '0.84rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(24,119,242,0.14)'
                    e.currentTarget.style.color = '#93c5fd'
                    e.currentTarget.style.borderColor = 'rgba(24,119,242,0.4)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(24,119,242,0.08)'
                    e.currentTarget.style.color = '#6ba3e0'
                    e.currentTarget.style.borderColor = 'rgba(24,119,242,0.25)'
                  }}
                >
                  <Download size={14} /> Facebook Audience
                </button>
              ) : (
                <button
                  disabled
                  title="Upgrade to Pro to export Facebook Custom Audiences"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '7px',
                    backgroundColor: 'rgba(24,119,242,0.04)',
                    border: '1px solid rgba(24,119,242,0.12)',
                    color: 'rgba(107,163,224,0.4)',
                    borderRadius: '9px',
                    padding: '10px 18px',
                    fontSize: '0.84rem',
                    fontWeight: '500',
                    cursor: 'not-allowed',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  <Download size={14} /> Facebook Audience — Pro+
                </button>
              )}
            </div>
          </div>

          {leads.length > 0 && (
            <div
              style={{
                backgroundColor: '#0d1a0f',
                border: '1px solid #1c2e1f',
                borderRadius: '14px',
                overflow: 'hidden',
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#111f13', borderBottom: '1px solid #1c2e1f' }}>
                    {['Owner', 'Address', 'Home Value', 'Score', 'Email', 'Draft'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '0.67rem',
                          fontWeight: '600',
                          color: '#6b8070',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, idx) => (
                    <AudienceRow
                      key={lead.id}
                      lead={lead}
                      expanded={expandedId === lead.id}
                      onExpand={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
                      isEven={idx % 2 === 0}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
