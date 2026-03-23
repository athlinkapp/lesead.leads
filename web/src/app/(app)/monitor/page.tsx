'use client'

import { useState } from 'react'
import { DM_Serif_Display } from 'next/font/google'
import { Radar, BookmarkPlus, Check, ChevronDown, ChevronUp } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { scanForLeads } from '@/services/apiClient'
import type { LeadAlert } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

const DEPTHS = [
  { value: 1 as const, label: 'Quick', desc: 'Fast scan, top results', time: '~15s' },
  { value: 2 as const, label: 'Standard', desc: 'Balanced depth & speed', time: '~30s' },
  { value: 3 as const, label: 'Deep', desc: 'Maximum coverage', time: '~60s' },
]

function sourceBadge(source: string) {
  if (source === 'reddit') return { bg: 'rgba(255,88,0,0.12)', border: 'rgba(255,88,0,0.25)', color: '#ff8c42' }
  if (source === 'craigslist') return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: '#60a5fa' }
  if (source === 'facebook') return { bg: 'rgba(24,119,242,0.12)', border: 'rgba(24,119,242,0.25)', color: '#6ba3e0' }
  if (source === 'nextdoor') return { bg: 'rgba(0,184,94,0.12)', border: 'rgba(0,184,94,0.25)', color: '#00c46a' }
  if (source === 'linkedin') return { bg: 'rgba(10,102,194,0.12)', border: 'rgba(10,102,194,0.25)', color: '#6ba3e0' }
  if (source === 'instagram') return { bg: 'rgba(225,48,108,0.12)', border: 'rgba(225,48,108,0.25)', color: '#f472b6' }
  if (source === 'twitter') return { bg: 'rgba(0,0,0,0.2)', border: 'rgba(255,255,255,0.12)', color: '#e2e8f0' }
  if (source === 'zillow') return { bg: 'rgba(0,111,202,0.12)', border: 'rgba(0,111,202,0.25)', color: '#60a5fa' }
  return { bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', color: '#4ade80' }
}

function intentLabel(intent: string) {
  if (intent === 'ready_to_buy') return { label: 'Ready to Buy', bg: 'rgba(74,222,128,0.1)', color: '#4ade80', border: 'rgba(74,222,128,0.25)' }
  if (intent === 'actively_looking') return { label: 'Actively Looking', bg: 'rgba(234,179,8,0.08)', color: '#fbbf24', border: 'rgba(234,179,8,0.2)' }
  return { label: 'Just Browsing', bg: 'rgba(107,114,128,0.08)', color: '#9ca3af', border: 'rgba(107,114,128,0.15)' }
}

function AlertCard({ alert }: { alert: LeadAlert }) {
  const [expanded, setExpanded] = useState(false)
  const saveLead = useAppStore((s) => s.saveLead)
  const savedLeads = useAppStore((s) => s.savedLeads)
  const isSaved = savedLeads.some((l) => l.alertId === alert.id)

  const src = sourceBadge(alert.post.source)
  const intent = intentLabel(alert.buyerIntent)
  const scoreColor = alert.relevanceScore >= 70 ? '#4ade80' : alert.relevanceScore >= 40 ? '#fbbf24' : '#f87171'

  return (
    <div
      style={{
        backgroundColor: '#111f13',
        border: '1px solid #1c2e1f',
        borderRadius: '14px',
        padding: '20px 22px',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(74,222,128,0.12)'
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1c2e1f'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span
          style={{
            backgroundColor: src.bg,
            border: `1px solid ${src.border}`,
            color: src.color,
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '0.68rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          {alert.post.source}
        </span>
        <span
          style={{
            backgroundColor: intent.bg,
            border: `1px solid ${intent.border}`,
            color: intent.color,
            borderRadius: '999px',
            padding: '3px 10px',
            fontSize: '0.68rem',
            fontWeight: '600',
            letterSpacing: '0.02em',
          }}
        >
          {intent.label}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            color: '#4ade80',
            fontSize: '0.84rem',
            fontWeight: '600',
            letterSpacing: '-0.01em',
          }}
        >
          ${alert.estimatedValueLow.toLocaleString()} – ${alert.estimatedValueHigh.toLocaleString()}
        </span>
      </div>

      {/* Title */}
      <h3
        style={{
          color: '#e8f0e9',
          fontSize: '0.95rem',
          fontWeight: '500',
          margin: '0 0 6px',
          lineHeight: 1.45,
          letterSpacing: '-0.01em',
        }}
      >
        <a
          href={alert.post.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#4ade80')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#e8f0e9')}
        >
          {alert.post.title}
        </a>
      </h3>

      <p style={{ color: '#a0b8a4', fontSize: '0.84rem', margin: '0 0 14px', lineHeight: 1.6 }}>
        {alert.matchReason}
      </p>

      {/* Score bar */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
          <span style={{ color: '#6b8070', fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Relevance</span>
          <span style={{ color: scoreColor, fontSize: '0.78rem', fontWeight: '600' }}>{alert.relevanceScore}%</span>
        </div>
        <div style={{ height: '4px', backgroundColor: '#1c2e1f', borderRadius: '999px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${alert.relevanceScore}%`,
              backgroundColor: scoreColor,
              borderRadius: '999px',
              transition: 'width 0.5s ease',
              boxShadow: `0 0 8px ${scoreColor}60`,
            }}
          />
        </div>
      </div>

      {/* Suggested reply toggle */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: 'none',
            border: 'none',
            color: '#4ade80',
            fontSize: '0.8rem',
            cursor: 'pointer',
            padding: 0,
            fontWeight: '500',
            transition: 'opacity 0.15s',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Hide suggested reply' : 'Show suggested reply'}
        </button>
        {expanded && (
          <div
            style={{
              marginTop: '10px',
              backgroundColor: '#0d1a0f',
              border: '1px solid rgba(74,222,128,0.12)',
              borderRadius: '10px',
              padding: '14px',
              color: '#e8f0e9',
              fontSize: '0.84rem',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {alert.suggestedReply}
          </div>
        )}
      </div>

      {/* Actions */}
      <button
        onClick={() => !isSaved && saveLead(alert)}
        disabled={isSaved}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          backgroundColor: isSaved ? 'rgba(74,222,128,0.08)' : '#22c55e',
          color: isSaved ? '#4ade80' : '#020a03',
          border: isSaved ? '1px solid rgba(74,222,128,0.2)' : 'none',
          borderRadius: '8px',
          padding: '8px 16px',
          fontSize: '0.82rem',
          fontWeight: '600',
          cursor: isSaved ? 'default' : 'pointer',
          transition: 'all 0.2s',
          fontFamily: 'Inter, system-ui, sans-serif',
          boxShadow: isSaved ? 'none' : '0 2px 10px rgba(74,222,128,0.2)',
        }}
        onMouseEnter={(e) => {
          if (!isSaved) {
            e.currentTarget.style.backgroundColor = '#4ade80'
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.3)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSaved) {
            e.currentTarget.style.backgroundColor = '#22c55e'
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = '0 2px 10px rgba(74,222,128,0.2)'
          }
        }}
      >
        {isSaved ? <Check size={13} /> : <BookmarkPlus size={13} />}
        {isSaved ? 'Saved to Pipeline' : 'Save to Pipeline'}
      </button>
    </div>
  )
}

const DAILY_SCAN_LIMITS: Record<string, number> = { free: 1, starter: 1, pro: 1, scale: 2 }

export default function MonitorPage() {
  const businessProfile = useAppStore((s) => s.businessProfile)
  const monitorResults = useAppStore((s) => s.monitorResults)
  const isScanning = useAppStore((s) => s.isScanning)
  const setScanning = useAppStore((s) => s.setScanning)
  const setMonitorResults = useAppStore((s) => s.setMonitorResults)
  const planId = useAppStore((s) => s.planId)
  const monitorScansToday = useAppStore((s) => s.monitorScansToday)
  const lastMonitorScanDate = useAppStore((s) => s.lastMonitorScanDate)
  const recordMonitorScan = useAppStore((s) => s.recordMonitorScan)

  const [scanDepth, setScanDepth] = useState<1 | 2 | 3>(1)
  const [error, setError] = useState('')

  const today = new Date().toISOString().slice(0, 10)
  const scansUsedToday = lastMonitorScanDate === today ? monitorScansToday : 0
  const dailyLimit = DAILY_SCAN_LIMITS[planId] ?? 1
  const scanLimitReached = scansUsedToday >= dailyLimit

  async function handleScan() {
    if (!businessProfile) return
    if (scanLimitReached) return
    setError('')
    setScanning(true)
    try {
      const result = await scanForLeads(businessProfile, scanDepth, planId)
      recordMonitorScan()
      if (result.alerts.length > 0) {
        setMonitorResults(result)
      }
      // If no new leads found, keep showing previous results
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Scan failed. Please try again.')
    } finally {
      setScanning(false)
    }
  }

  return (
    <div style={{ maxWidth: '860px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1
          className={dmSerif.className}
          style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 6px', letterSpacing: '-0.03em' }}
        >
          Lead Monitor
        </h1>
        <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Find real-time leads from Reddit &amp; Craigslist matching your business.
        </p>
      </div>

      {!businessProfile && (
        <div
          style={{
            backgroundColor: 'rgba(234,179,8,0.04)',
            border: '1px solid rgba(234,179,8,0.2)',
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
          before running a scan.
        </div>
      )}

      {/* Scan depth selector */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ color: '#6b8070', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px', fontWeight: '600' }}>
          Scan Depth
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {DEPTHS.map((d) => {
            const isSelected = scanDepth === d.value
            return (
              <button
                key={d.value}
                onClick={() => setScanDepth(d.value)}
                style={{
                  backgroundColor: isSelected ? 'rgba(74,222,128,0.06)' : '#0d1a0f',
                  border: isSelected ? '1px solid rgba(74,222,128,0.3)' : '1px solid #1c2e1f',
                  borderRadius: '12px',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  boxShadow: isSelected ? '0 0 0 1px rgba(74,222,128,0.1)' : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = 'rgba(74,222,128,0.15)'
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.borderColor = '#1c2e1f'
                }}
              >
                <p style={{ color: isSelected ? '#4ade80' : '#e8f0e9', margin: '0 0 3px', fontWeight: '600', fontSize: '0.9rem', letterSpacing: '-0.01em' }}>
                  {d.label}
                </p>
                <p style={{ color: '#a0b8a4', margin: '0 0 6px', fontSize: '0.78rem' }}>{d.desc}</p>
                <p style={{ color: '#4ade80', margin: 0, fontSize: '0.72rem', opacity: isSelected ? 1 : 0.7 }}>{d.time}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Run button */}
      <div style={{ marginBottom: '24px' }}>
        <button
          onClick={handleScan}
          disabled={isScanning || !businessProfile || scanLimitReached}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            width: '100%',
            backgroundColor: scanLimitReached ? 'rgba(74,222,128,0.06)' : isScanning || !businessProfile ? '#166534' : '#22c55e',
            color: scanLimitReached ? '#4ade80' : '#020a03',
            border: scanLimitReached ? '1px solid rgba(74,222,128,0.2)' : 'none',
            borderRadius: '14px',
            padding: '18px 24px',
            fontSize: '1rem',
            fontWeight: '700',
            cursor: isScanning || !businessProfile || scanLimitReached ? 'not-allowed' : 'pointer',
            opacity: !businessProfile ? 0.5 : scanLimitReached ? 0.7 : 1,
            transition: 'all 0.2s',
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '-0.01em',
            boxShadow: !businessProfile || isScanning || scanLimitReached ? 'none' : '0 6px 24px rgba(74,222,128,0.3), 0 0 0 1px rgba(74,222,128,0.1)',
          }}
          onMouseEnter={(e) => {
            if (!isScanning && businessProfile && !scanLimitReached) {
              e.currentTarget.style.backgroundColor = '#4ade80'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(74,222,128,0.35), 0 0 0 1px rgba(74,222,128,0.15)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isScanning && businessProfile && !scanLimitReached) {
              e.currentTarget.style.backgroundColor = '#22c55e'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(74,222,128,0.3), 0 0 0 1px rgba(74,222,128,0.1)'
            }
          }}
        >
          {isScanning ? (
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
              Scanning...
            </>
          ) : scanLimitReached ? (
            <>
              <Radar size={16} strokeWidth={2} />
              Scan limit reached — resets tomorrow
            </>
          ) : (
            <>
              <Radar size={16} strokeWidth={2} />
              Run New Scan
            </>
          )}
        </button>
        <p style={{ color: '#6b8070', fontSize: '0.75rem', textAlign: 'center', margin: '8px 0 0' }}>
          {scanLimitReached ? 'Scan limit reached — resets at midnight' : `${scansUsedToday}/${dailyLimit} scan${dailyLimit !== 1 ? 's' : ''} used today`}
        </p>
      </div>

      {/* Scanning state */}
      {isScanning && (
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: '14px',
            padding: '36px 28px',
            marginBottom: '20px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '300px',
              height: '200px',
              borderRadius: '50%',
              background: '#14532d',
              opacity: 0.15,
              filter: 'blur(60px)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#4ade80',
                  boxShadow: '0 0 10px #4ade80',
                  display: 'inline-block',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              />
              <p style={{ color: '#e8f0e9', fontWeight: '600', margin: 0, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                Scanning Reddit &amp; Craigslist{businessProfile ? ` for ${businessProfile.businessName}` : ''}...
              </p>
            </div>
            <p style={{ color: '#6b8070', fontSize: '0.84rem', margin: 0 }}>
              Finding posts that match your business profile.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: '10px',
            padding: '14px 18px',
            color: '#fca5a5',
            fontSize: '0.875rem',
            marginBottom: '20px',
            lineHeight: 1.6,
          }}
        >
          {error}
        </div>
      )}

      {/* Results */}
      {!isScanning && monitorResults && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <p style={{ color: '#a0b8a4', fontSize: '0.875rem', margin: 0, lineHeight: 1.5 }}>
              Found <strong style={{ color: '#e8f0e9' }}>{monitorResults.alerts.length}</strong> leads
              {' '}·{' '}
              <span style={{ color: '#6b8070' }}>{monitorResults.totalPostsChecked} posts scanned</span>
            </p>
            <span style={{ color: '#6b8070', fontSize: '0.78rem' }}>
              {new Date(monitorResults.scannedAt).toLocaleString()}
            </span>
          </div>
          {monitorResults.alerts.length === 0 ? (
            <div
              style={{
                backgroundColor: '#0d1a0f',
                border: '1px solid #1c2e1f',
                borderRadius: '14px',
                padding: '44px 28px',
                textAlign: 'center',
              }}
            >
              <p style={{ color: '#a0b8a4', margin: '0 0 6px', fontSize: '1rem' }}>No leads found this scan.</p>
              <p style={{ color: '#6b8070', fontSize: '0.84rem', margin: 0 }}>
                Try a deeper scan or check back later as new posts appear.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {monitorResults.alerts.map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      )}

      {!isScanning && !monitorResults && !error && (
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid #1c2e1f',
            borderRadius: '16px',
            padding: '56px 32px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '300px',
              height: '200px',
              borderRadius: '50%',
              background: '#14532d',
              opacity: 0.1,
              filter: 'blur(80px)',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%,-50%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'rgba(74,222,128,0.07)',
              border: '1px solid rgba(74,222,128,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Radar size={22} color="#4ade80" strokeWidth={1.5} />
          </div>
          <h3
            className={dmSerif.className}
            style={{ color: '#e8f0e9', margin: '0 0 8px', fontSize: '1.3rem', letterSpacing: '-0.02em' }}
          >
            No scans yet
          </h3>
          <p style={{ color: '#a0b8a4', fontSize: '0.875rem', margin: '0 0 22px', lineHeight: 1.6 }}>
            Click &ldquo;Run New Scan&rdquo; to start finding leads for your business.
          </p>
          <button
            onClick={handleScan}
            disabled={!businessProfile}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#22c55e',
              color: '#020a03',
              border: 'none',
              borderRadius: '10px',
              padding: '11px 22px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: !businessProfile ? 'not-allowed' : 'pointer',
              opacity: !businessProfile ? 0.5 : 1,
              transition: 'all 0.2s',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: businessProfile ? '0 4px 16px rgba(74,222,128,0.2)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (businessProfile) {
                e.currentTarget.style.backgroundColor = '#4ade80'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (businessProfile) {
                e.currentTarget.style.backgroundColor = '#22c55e'
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.2)'
              }
            }}
          >
            <Radar size={15} />
            Run First Scan
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; transform: scale(1); } 50% { opacity:0.5; transform: scale(0.85); } }
      `}</style>
    </div>
  )
}
