'use client'

import Link from 'next/link'
import { Radar, MessageSquare, GitMerge, ArrowRight, Zap, TrendingUp, Activity } from 'lucide-react'
import { DM_Serif_Display } from 'next/font/google'
import useAppStore from '@/store/useAppStore'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

function getHour() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

const sourceBadgeColor = (source: string) => {
  if (source === 'reddit') return { bg: 'rgba(255,88,0,0.12)', border: 'rgba(255,88,0,0.25)', color: '#ff8c42' }
  if (source === 'craigslist') return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.25)', color: '#60a5fa' }
  return { bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)', color: '#4ade80' }
}

export default function DashboardPage() {
  const businessProfile = useAppStore((s) => s.businessProfile)
  const aiAnalysis = useAppStore((s) => s.aiAnalysis)
  const savedLeads = useAppStore((s) => s.savedLeads)
  const monitorResults = useAppStore((s) => s.monitorResults)
  const planId = useAppStore((s) => s.planId)

  const greeting = `Good ${getHour()}, ${businessProfile?.businessName ?? 'there'}`
  const alertCount = monitorResults?.alerts?.length ?? 0

  const QUICK_ACTIONS = [
    { label: 'Run Scan', sub: 'Find new leads on Reddit & Craigslist', href: '/monitor', icon: Radar },
    { label: 'Generate Outreach', sub: 'Write compelling messages for leads', href: '/outreach', icon: MessageSquare },
    { label: 'View Pipeline', sub: 'Manage your saved leads', href: '/pipeline', icon: GitMerge },
  ]

  return (
    <div style={{ maxWidth: '1020px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Hero greeting */}
      <div style={{ marginBottom: '36px', position: 'relative' }}>
        {/* Subtle radial glow behind heading */}
        <div
          style={{
            position: 'absolute',
            width: '500px',
            height: '200px',
            borderRadius: '50%',
            background: '#14532d',
            opacity: 0.18,
            filter: 'blur(80px)',
            top: '-40px',
            left: '-60px',
            pointerEvents: 'none',
          }}
        />
        <h1
          className={dmSerif.className}
          style={{
            fontSize: '2.5rem',
            background: 'linear-gradient(135deg, #ffffff 30%, #4ade80 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            margin: '0 0 8px',
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
            position: 'relative',
          }}
        >
          {businessProfile ? greeting : 'Welcome to LeSead'}
        </h1>
        <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.95rem', lineHeight: 1.7, position: 'relative' }}>
          {businessProfile
            ? "Here's what's happening with your business today."
            : 'Get started by setting up your business profile in Settings.'}
        </p>
      </div>

      {/* Setup CTAs */}
      {!businessProfile && (
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
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
              background: '#166534',
              opacity: 0.12,
              filter: 'blur(60px)',
              top: '-60px',
              right: '-40px',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 10px',
                borderRadius: '999px',
                fontSize: '0.7rem',
                fontWeight: '500',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: '#4ade80',
                marginBottom: '10px',
              }}
            >
              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              Action Required
            </span>
            <h2
              className={dmSerif.className}
              style={{ color: '#e8f0e9', margin: '0 0 6px', fontSize: '1.3rem', letterSpacing: '-0.02em' }}
            >
              Set up your business profile
            </h2>
            <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
              Tell LeSead about your business so we can find leads and generate outreach tailored to you.
            </p>
          </div>
          <Link
            href="/settings"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#22c55e',
              color: '#020a03',
              borderRadius: '10px',
              padding: '12px 22px',
              fontWeight: '600',
              fontSize: '0.875rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(74,222,128,0.2)',
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4ade80'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.2)'
            }}
          >
            Set Up Profile
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {businessProfile && !aiAnalysis && (
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '16px',
            padding: '28px 32px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap',
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
              background: '#166534',
              opacity: 0.15,
              filter: 'blur(80px)',
              top: '-50px',
              right: '-20px',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Zap size={15} color="#4ade80" />
              <span style={{ color: '#4ade80', fontSize: '0.78rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Recommended Next Step
              </span>
            </div>
            <h2
              className={dmSerif.className}
              style={{ color: '#e8f0e9', margin: '0 0 6px', fontSize: '1.3rem', letterSpacing: '-0.02em' }}
            >
              Run your first AI analysis
            </h2>
            <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
              Unlock your ICP, buyer personas, and lead opportunities with one click.
            </p>
          </div>
          <Link
            href="/analysis"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#22c55e',
              color: '#020a03',
              borderRadius: '10px',
              padding: '12px 22px',
              fontWeight: '600',
              fontSize: '0.875rem',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 16px rgba(74,222,128,0.2)',
              transition: 'all 0.2s',
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4ade80'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#22c55e'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.2)'
            }}
          >
            Run Analysis
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        {[
          { label: 'Saved Leads', value: savedLeads.length, icon: GitMerge, suffix: '' },
          { label: 'Monitor Alerts', value: alertCount, icon: Activity, suffix: '' },
          { label: 'Current Plan', value: planId.charAt(0).toUpperCase() + planId.slice(1), icon: TrendingUp, suffix: '', isText: true },
        ].map(({ label, value, icon: Icon, isText }) => (
          <div
            key={label}
            style={{
              backgroundColor: '#0d1a0f',
              border: '1px solid #1c2e1f',
              borderRadius: '16px',
              padding: '24px 28px',
              transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
              cursor: 'default',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.borderColor = 'rgba(74,222,128,0.12)'
              e.currentTarget.style.boxShadow = '0 2px 6px rgba(0,0,0,0.5), 0 0 0 1px rgba(74,222,128,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.borderColor = '#1c2e1f'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <p style={{ color: '#6b8070', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: '500' }}>
                {label}
              </p>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'rgba(74,222,128,0.07)',
                  border: '1px solid rgba(74,222,128,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon size={14} color="#4ade80" strokeWidth={1.8} />
              </div>
            </div>
            {isText ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: '500',
                  letterSpacing: '0.03em',
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.2)',
                  color: '#4ade80',
                }}
              >
                {value}
              </span>
            ) : (
              <p
                className={dmSerif.className}
                style={{ color: '#4ade80', fontSize: '3rem', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}
              >
                {value}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Recent alerts */}
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid #1c2e1f',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
            <h2
              className={dmSerif.className}
              style={{ fontSize: '1.15rem', color: '#e8f0e9', margin: 0, letterSpacing: '-0.02em' }}
            >
              Recent Signals
            </h2>
            <Link
              href="/monitor"
              style={{ color: '#4ade80', fontSize: '0.78rem', textDecoration: 'none', fontWeight: '500', transition: 'opacity 0.15s' }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              View all →
            </Link>
          </div>

          {!monitorResults || monitorResults.alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(74,222,128,0.06)',
                  border: '1px solid rgba(74,222,128,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <Radar size={18} color="#4ade80" strokeWidth={1.5} />
              </div>
              <p style={{ color: '#a0b8a4', fontSize: '0.875rem', margin: '0 0 14px', lineHeight: 1.6 }}>
                No signals yet. Run a scan to find leads.
              </p>
              <Link
                href="/monitor"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#4ade80',
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  padding: '6px 14px',
                  borderRadius: '999px',
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.2)',
                }}
              >
                Go to Monitor <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {monitorResults.alerts.slice(0, 3).map((alert) => {
                const c = sourceBadgeColor(alert.post.source)
                return (
                  <div
                    key={alert.id}
                    style={{
                      backgroundColor: '#111f13',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      border: '1px solid #1c2e1f',
                      transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.15)')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1c2e1f')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          backgroundColor: c.bg,
                          border: `1px solid ${c.border}`,
                          color: c.color,
                          borderRadius: '999px',
                          padding: '1px 8px',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {alert.post.source}
                      </span>
                      <span
                        style={{
                          backgroundColor: 'rgba(74,222,128,0.08)',
                          color: '#4ade80',
                          borderRadius: '999px',
                          padding: '1px 8px',
                          fontSize: '0.65rem',
                          fontWeight: '700',
                          border: '1px solid rgba(74,222,128,0.15)',
                        }}
                      >
                        {alert.relevanceScore}%
                      </span>
                    </div>
                    <p
                      style={{
                        color: '#e8f0e9',
                        fontSize: '0.84rem',
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {alert.post.title}
                    </p>
                    <p style={{ color: '#6b8070', fontSize: '0.75rem', margin: '3px 0 0' }}>
                      ${alert.estimatedValueLow.toLocaleString()} – ${alert.estimatedValueHigh.toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid #1c2e1f',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <h2
            className={dmSerif.className}
            style={{ fontSize: '1.15rem', color: '#e8f0e9', margin: '0 0 18px', letterSpacing: '-0.02em' }}
          >
            Quick Actions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {QUICK_ACTIONS.map(({ label, sub, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#111f13',
                  border: '1px solid #1c2e1f',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  textDecoration: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(74,222,128,0.2)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1c2e1f'
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '9px',
                      background: 'rgba(74,222,128,0.07)',
                      border: '1px solid rgba(74,222,128,0.12)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} color="#4ade80" strokeWidth={1.8} />
                  </div>
                  <div>
                    <p style={{ color: '#e8f0e9', margin: '0 0 2px', fontSize: '0.875rem', fontWeight: '500' }}>
                      {label}
                    </p>
                    <p style={{ color: '#6b8070', margin: 0, fontSize: '0.78rem' }}>{sub}</p>
                  </div>
                </div>
                <ArrowRight size={15} color="#4ade80" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
