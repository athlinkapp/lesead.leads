'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import useAuthStore from '@/store/useAuthStore'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/monitor': 'Lead Monitor',
  '/opportunities': 'Opportunities',
  '/outreach': 'Outreach',
  '/pipeline': 'Pipeline',
  '/audience': 'Audience Builder',
  '/analysis': 'AI Analysis',
  '/pricing': 'Pricing',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  return PAGE_TITLES[pathname] ?? Object.entries(PAGE_TITLES).find(([k]) => pathname.startsWith(k + '/') || pathname === k)?.[1] ?? 'LeSead'
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    if (isHydrated && !user) {
      router.replace('/auth')
    }
  }, [isHydrated, user, router])

  if (!isHydrated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#070d08', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ position: 'absolute', width: '300px', height: '300px', borderRadius: '50%', background: '#166534', opacity: 0.15, filter: 'blur(80px)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', pointerEvents: 'none' }} />
          <div style={{ width: '36px', height: '36px', border: '2px solid rgba(74,222,128,0.15)', borderTop: '2px solid #4ade80', borderRadius: '50%', animation: 'spin 0.9s linear infinite', margin: '0 auto 14px', position: 'relative' }} />
          <p style={{ color: '#6b8070', fontSize: '0.82rem', fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '0.02em' }}>Loading...</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!user) return null

  const pageTitle = getPageTitle(pathname)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070d08', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {!isMobile && <Sidebar />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top bar */}
        <header style={{
          height: '56px',
          background: 'rgba(7,13,8,0.9)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1c2e1f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: isMobile ? '0 16px' : '0 28px',
          flexShrink: 0,
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}>
          <span style={{ fontFamily: '"DM Serif Display", Georgia, serif', fontSize: '1.1rem', color: '#e8f0e9', letterSpacing: '-0.02em' }}>
            {pageTitle}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#4ade80', boxShadow: '0 0 6px #4ade80', display: 'inline-block', flexShrink: 0 }} />
            {!isMobile && (
              <span style={{ fontSize: '0.8rem', color: '#a0b8a4', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {user.email}
              </span>
            )}
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, padding: isMobile ? '20px 16px 80px' : '32px 28px', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      {isMobile && <MobileNav />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
