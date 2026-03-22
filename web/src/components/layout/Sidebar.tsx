'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  LayoutDashboard,
  Radar,
  Lightbulb,
  MessageSquare,
  GitMerge,
  Users,
  BarChart2,
  CreditCard,
  Settings,
  LogOut,
} from 'lucide-react'
import useAuthStore from '@/store/useAuthStore'

const WORKSPACE_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Monitor', href: '/monitor', icon: Radar },
  { label: 'Opportunities', href: '/opportunities', icon: Lightbulb },
  { label: 'Outreach', href: '/outreach', icon: MessageSquare },
  { label: 'Pipeline', href: '/pipeline', icon: GitMerge },
  { label: 'Audience', href: '/audience', icon: Users },
  { label: 'Analysis', href: '/analysis', icon: BarChart2 },
]

const ACCOUNT_ITEMS = [
  { label: 'Pricing', href: '/pricing', icon: CreditCard },
  { label: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const clearSession = useAuthStore((s) => s.clearSession)

  function handleSignOut() {
    clearSession()
    router.push('/auth')
  }

  function NavItem({ label, href, icon: Icon }: { label: string; href: string; icon: React.ElementType }) {
    const isActive = pathname === href || pathname.startsWith(href + '/')
    return (
      <Link
        href={href}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 12px',
          borderRadius: '7px',
          marginBottom: '1px',
          textDecoration: 'none',
          fontSize: '0.875rem',
          fontWeight: isActive ? '500' : '400',
          color: isActive ? '#4ade80' : '#a0b8a4',
          backgroundColor: isActive ? 'rgba(74,222,128,0.06)' : 'transparent',
          borderLeft: isActive ? '2px solid #4ade80' : '2px solid transparent',
          transition: 'all 0.15s cubic-bezier(0.4,0,0.2,1)',
          fontFamily: 'Inter, system-ui, sans-serif',
          letterSpacing: '-0.01em',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.color = '#e8f0e9'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#a0b8a4'
          }
        }}
      >
        <Icon size={15} strokeWidth={isActive ? 2 : 1.7} />
        {label}
      </Link>
    )
  }

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        height: '100vh',
        backgroundColor: '#070d08',
        borderRight: '1px solid #1c2e1f',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 18px 18px',
          borderBottom: '1px solid #1c2e1f',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <Image
          src="/logo.png"
          alt="LeSead logo"
          width={28}
          height={28}
          style={{ objectFit: 'contain' }}
        />
        <span
          style={{
            fontFamily: '"DM Serif Display", Georgia, serif',
            fontSize: '1.25rem',
            color: '#e8f0e9',
            letterSpacing: '-0.02em',
            lineHeight: 1,
          }}
        >
          LeSead
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '14px 10px', overflowY: 'auto' }}>
        {/* Workspace section */}
        <p
          style={{
            color: '#6b8070',
            fontSize: '0.65rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '0 0 8px 12px',
          }}
        >
          Workspace
        </p>
        {WORKSPACE_ITEMS.map(({ label, href, icon }) => (
          <NavItem key={href} label={label} href={href} icon={icon} />
        ))}

        {/* Account section */}
        <p
          style={{
            color: '#6b8070',
            fontSize: '0.65rem',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            margin: '18px 0 8px 12px',
          }}
        >
          Account
        </p>
        {ACCOUNT_ITEMS.map(({ label, href, icon }) => (
          <NavItem key={href} label={label} href={href} icon={icon} />
        ))}
      </nav>

      {/* Sign out */}
      <div style={{ padding: '10px', borderTop: '1px solid #1c2e1f' }}>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            padding: '8px 12px',
            borderRadius: '7px',
            border: 'none',
            backgroundColor: 'transparent',
            color: '#6b8070',
            fontSize: '0.875rem',
            fontWeight: '400',
            cursor: 'pointer',
            transition: 'all 0.15s',
            textAlign: 'left',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.07)'
            e.currentTarget.style.color = '#fca5a5'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
            e.currentTarget.style.color = '#6b8070'
          }}
        >
          <LogOut size={15} strokeWidth={1.7} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
