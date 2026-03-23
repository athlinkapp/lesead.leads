'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Radar, GitMerge, Users, BarChart2, MoreHorizontal, X, Lightbulb, MessageSquare, CreditCard, Settings, LogOut } from 'lucide-react'
import { useState } from 'react'
import useAuthStore from '@/store/useAuthStore'

const MAIN_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Monitor', href: '/monitor', icon: Radar },
  { label: 'Pipeline', href: '/pipeline', icon: GitMerge },
  { label: 'Audience', href: '/audience', icon: Users },
  { label: 'More', href: '', icon: MoreHorizontal },
]

const MORE_ITEMS = [
  { label: 'Opportunities', href: '/opportunities', icon: Lightbulb },
  { label: 'Outreach', href: '/outreach', icon: MessageSquare },
  { label: 'Analysis', href: '/analysis', icon: BarChart2 },
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function MobileNav() {
  const pathname = usePathname()
  const router = useRouter()
  const clearSession = useAuthStore((s) => s.clearSession)
  const [showMore, setShowMore] = useState(false)

  function handleSignOut() {
    clearSession()
    router.push('/auth')
  }

  return (
    <>
      {/* More drawer */}
      {showMore && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} onClick={() => setShowMore(false)} />
          <div style={{ position: 'relative', backgroundColor: '#0d1a0f', borderTop: '1px solid #1c2e1f', borderRadius: '16px 16px 0 0', padding: '20px 16px 40px', zIndex: 51 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ color: '#6b8070', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>More</span>
              <button onClick={() => setShowMore(false)} style={{ background: 'none', border: 'none', color: '#6b8070', cursor: 'pointer', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>
            {MORE_ITEMS.map(({ label, href, icon: Icon }) => {
              const isActive = pathname === href
              return (
                <Link key={href} href={href} onClick={() => setShowMore(false)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px', borderRadius: '10px', textDecoration: 'none', color: isActive ? '#4ade80' : '#a0b8a4', backgroundColor: isActive ? 'rgba(74,222,128,0.06)' : 'transparent', marginBottom: '2px' }}>
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.7} />
                  <span style={{ fontSize: '0.95rem', fontWeight: isActive ? 500 : 400 }}>{label}</span>
                </Link>
              )
            })}
            <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 12px', borderRadius: '10px', border: 'none', background: 'none', color: '#6b8070', cursor: 'pointer', width: '100%', marginTop: '8px', fontSize: '0.95rem' }}>
              <LogOut size={18} strokeWidth={1.7} />
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: '#070d08',
        borderTop: '1px solid #1c2e1f',
        display: 'flex',
        alignItems: 'center',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {MAIN_ITEMS.map(({ label, href, icon: Icon }) => {
          const isMore = label === 'More'
          const isActive = isMore ? showMore : (pathname === href || pathname.startsWith(href + '/'))
          return isMore ? (
            <button
              key={label}
              onClick={() => setShowMore(v => !v)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer', color: isActive ? '#4ade80' : '#6b8070', padding: '8px 0' }}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.7} />
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 400 }}>{label}</span>
            </button>
          ) : (
            <Link
              key={href}
              href={href}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', textDecoration: 'none', color: isActive ? '#4ade80' : '#6b8070', padding: '8px 0' }}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.7} />
              <span style={{ fontSize: '0.65rem', fontWeight: isActive ? 600 : 400 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
