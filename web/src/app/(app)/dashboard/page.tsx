'use client'

import Link from 'next/link'
import { Radar, MessageSquare, GitMerge, ArrowRight, Zap, TrendingUp, Activity, Sparkles, ChevronRight } from 'lucide-react'
import { DM_Serif_Display } from 'next/font/google'
import useAppStore from '@/store/useAppStore'
import { useIsMobile } from '@/hooks/useIsMobile'

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

const PLAN_UPGRADE: Record<string, { next: string; label: string; color: string } | null> = {
  free: { next: 'starter', label: 'Upgrade to Starter — unlock 5 leads/scan & more sources', color: '#fbbf24' },
  starter: { next: 'pro', label: 'Upgrade to Pro — unlock 10 leads/scan & Facebook export', color: '#a78bfa' },
  pro: { next: 'scale', label: 'Upgrade to Scale — unlock 2 scans/day & 25 audience results', color: '#38bdf8' },
  scale: null,
}

export default function DashboardPage() {
  const businessProfile = useAppStore((s) => s.businessProfile)
  const aiAnalysis = useAppStore((s) => s.aiAnalysis)
  const savedLeads = useAppStore((s) => s.savedLeads)
  const monitorResults = useAppStore((s) => s.monitorResults)
  const planId = useAppStore((s) => s.planId)
  const isMobile = useIsMobile()

  const greeting = `Good ${getHour()}, ${businessProfile?.businessName ?? 'there'}`
  const alertCount = monitorResults?.alerts?.length ?? 0
  const upgradeInfo = PLAN_UPGRADE[planId]

  const QUICK_ACTIONS = [
    { label: 'Run Lead Scan', sub: 'Find new leads across 8 platforms', href: '/monitor', icon: Radar, primary: true },
    { label: 'Generate Outreach', sub: 'Write compelling messages', href: '/outreach', icon: MessageSquare, primary: false },
    { label: 'View Pipeline', sub: 'Manage your saved leads', href: '/pipeline', icon: GitMerge, primary: false },
  ]

  return (
    <div style={{ maxWidth: '1020px', fontFamily: 'Inter, system-ui, sans-serif', width: '100%' }}>
      {/* Hero greeting */}
      <div style={{ marginBottom: '28px', position: 'relative' }}>
        <div style={{ position: 'absolute', width: '500px', height: '200px', borderRadius: '50%', background: '#14532d', opacity: 0.18, filter: 'blur(80px)', top: '-40px', left: '-60px', pointerEvents: 'none' }} />
        <h1
          className={dmSerif.className}
          style={{ fontSize: isMobile ? '1.8rem' : '2.4rem', background: 'linear-gradient(135deg, #ffffff 30%, #4ade80 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', margin: '0 0 6px', letterSpacing: '-0.04em', lineHeight: 1.1, position: 'relative' }}
        >
          {businessProfile ? greeting : 'Welcome to LeSead'}
        </h1>
        <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.9rem', lineHeight: 1.7, position: 'relative' }}>
          {businessProfile ? "Here's your lead engine overview." : 'Get started by setting up your business profile in Settings.'}
        </p>
      </div>

      {/* Setup CTA */}
      {!businessProfile && (
        <div style={{ backgroundColor: '#0d1a0f', border: '1px solid rgba(74,222,128,0.25)', borderRadius: '16px', padding: isMobile ? '20px' : '24px 28px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '300px', height: '200px', borderRadius: '50%', background: '#166534', opacity: 0.12, filter: 'blur(60px)', top: '-60px', right: '-40px', pointerEvents: 'none' }} />
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '999px', fontSize: '0.7rem', fontWeight: '600', letterSpacing: '0.04em', textTransform: 'uppercase', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80', marginBottom: '10px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            Action Required
          </span>
          <h2 className={dmSerif.className} style={{ color: '#e8f0e9', margin: '0 0 6px', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Set up your business profile</h2>
          <p style={{ color: '#a0b8a4', margin: '0 0 16px', fontSize: '0.875rem', lineHeight: 1.6 }}>Tell LeSead about your business so we can find leads tailored to you.</p>
          <Link href="/settings" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#22c55e', color: '#020a03', borderRadius: '10px', padding: '11px 20px', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none', boxShadow: '0 4px 16px rgba(74,222,128,0.25)' }}>
            Set Up Profile <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {businessProfile && !aiAnalysis && (
        <div style={{ backgroundColor: '#0d1a0f', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '16px', padding: isMobile ? '20px' : '24px 28px', marginBottom: '20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', width: '300px', height: '200px', borderRadius: '50%', background: '#166534', opacity: 0.15, filter: 'blur(80px)', top: '-50px', right: '-20px', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Zap size={14} color="#4ade80" />
            <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recommended</span>
          </div>
          <h2 className={dmSerif.className} style={{ color: '#e8f0e9', margin: '0 0 6px', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Run your first AI analysis</h2>
          <p style={{ color: '#a0b8a4', margin: '0 0 16px', fontSize: '0.875rem', lineHeight: 1.6 }}>Unlock your ICP, buyer personas, and lead opportunities.</p>
          <Link href="/analysis" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: '#22c55e', color: '#020a03', borderRadius: '10px', padding: '11px 20px', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none', boxShadow: '0 4px 16px rgba(74,222,128,0.25)' }}>
            Run Analysis <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Saved Leads', value: savedLeads.length, icon: GitMerge },
          { label: 'Monitor Alerts', value: alertCount, icon: Activity },
          { label: 'Current Plan', value: planId.charAt(0).toUpperCase() + planId.slice(1), icon: TrendingUp, isText: true },
        ].map(({ label, value, icon: Icon, isText }) => (
          <div key={label} style={{ backgroundColor: '#0d1a0f', border: '1px solid #1c2e1f', borderRadius: '14px', padding: isMobile ? '14px' : '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <p style={{ color: '#6b8070', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0, fontWeight: '600' }}>{label}</p>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={13} color="#4ade80" strokeWidth={1.8} />
              </div>
            </div>
            {isText ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: '600', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', color: '#4ade80' }}>{value}</span>
            ) : (
              <p className={dmSerif.className} style={{ color: '#4ade80', fontSize: isMobile ? '2.2rem' : '2.8rem', margin: 0, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Upgrade CTA — only for non-scale plans */}
      {upgradeInfo && (
        <Link
          href="/pricing"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'rgba(251,191,36,0.04)',
            border: '1px solid rgba(251,191,36,0.2)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px',
            textDecoration: 'none',
            transition: 'all 0.2s',
            gap: '12px',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(251,191,36,0.07)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.35)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(251,191,36,0.04)'; e.currentTarget.style.borderColor = 'rgba(251,191,36,0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} color="#fbbf24" strokeWidth={1.8} />
            </div>
            <p style={{ margin: 0, color: '#fbbf24', fontSize: '0.875rem', fontWeight: '500' }}>{upgradeInfo.label}</p>
          </div>
          <ChevronRight size={16} color="#fbbf24" style={{ flexShrink: 0 }} />
        </Link>
      )}

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px', alignItems: 'start' }}>
        {/* Quick actions */}
        <div style={{ backgroundColor: '#0d1a0f', border: '1px solid #1c2e1f', borderRadius: '16px', padding: '20px' }}>
          <h2 className={dmSerif.className} style={{ fontSize: '1.1rem', color: '#e8f0e9', margin: '0 0 14px', letterSpacing: '-0.02em' }}>Quick Actions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {QUICK_ACTIONS.map(({ label, sub, href, icon: Icon, primary }) => (
              <Link
                key={href}
                href={href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: primary ? 'rgba(74,222,128,0.06)' : '#111f13',
                  border: primary ? '1px solid rgba(74,222,128,0.2)' : '1px solid #1c2e1f',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                  boxShadow: primary ? '0 0 20px rgba(74,222,128,0.06)' : 'none',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(74,222,128,0.3)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = primary ? 'rgba(74,222,128,0.2)' : '#1c2e1f'; e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: primary ? 'rgba(74,222,128,0.12)' : 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={15} color="#4ade80" strokeWidth={primary ? 2.2 : 1.8} />
                  </div>
                  <div>
                    <p style={{ color: '#e8f0e9', margin: '0 0 2px', fontSize: '0.875rem', fontWeight: primary ? '600' : '500' }}>{label}</p>
                    <p style={{ color: '#6b8070', margin: 0, fontSize: '0.75rem' }}>{sub}</p>
                  </div>
                </div>
                <ArrowRight size={14} color={primary ? '#4ade80' : '#6b8070'} />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent alerts */}
        <div style={{ backgroundColor: '#0d1a0f', border: '1px solid #1c2e1f', borderRadius: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <h2 className={dmSerif.className} style={{ fontSize: '1.1rem', color: '#e8f0e9', margin: 0, letterSpacing: '-0.02em' }}>Recent Signals</h2>
            <Link href="/monitor" style={{ color: '#4ade80', fontSize: '0.75rem', textDecoration: 'none', fontWeight: '500' }}>View all →</Link>
          </div>

          {!monitorResults || monitorResults.alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <Radar size={18} color="#4ade80" strokeWidth={1.5} />
              </div>
              <p style={{ color: '#a0b8a4', fontSize: '0.875rem', margin: '0 0 14px', lineHeight: 1.6 }}>No signals yet. Run a scan to find leads.</p>
              <Link href="/monitor" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '0.82rem', textDecoration: 'none', fontWeight: '500', padding: '8px 16px', borderRadius: '999px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                Go to Monitor <ArrowRight size={12} />
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {monitorResults.alerts.slice(0, 3).map((alert) => {
                const c = sourceBadgeColor(alert.post.source)
                return (
                  <div key={alert.id} style={{ backgroundColor: '#111f13', borderRadius: '10px', padding: '12px 14px', border: '1px solid #1c2e1f' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ backgroundColor: c.bg, border: `1px solid ${c.border}`, color: c.color, borderRadius: '999px', padding: '1px 8px', fontSize: '0.63rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{alert.post.source}</span>
                      <span style={{ backgroundColor: 'rgba(74,222,128,0.08)', color: '#4ade80', borderRadius: '999px', padding: '1px 8px', fontSize: '0.63rem', fontWeight: '700', border: '1px solid rgba(74,222,128,0.15)' }}>{alert.relevanceScore}%</span>
                    </div>
                    <p style={{ color: '#e8f0e9', fontSize: '0.84rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.5 }}>{alert.post.title}</p>
                    <p style={{ color: '#6b8070', fontSize: '0.73rem', margin: '3px 0 0' }}>${alert.estimatedValueLow.toLocaleString()} – ${alert.estimatedValueHigh.toLocaleString()}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
