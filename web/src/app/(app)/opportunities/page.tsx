'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DM_Serif_Display } from 'next/font/google'
import { ArrowRight, Lightbulb } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import type { Difficulty, LeadOpportunity } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

function qualityColor(score: number) {
  if (score >= 70) return { color: '#4ade80', bg: 'rgba(74,222,128,0.1)', border: 'rgba(74,222,128,0.2)' }
  if (score >= 40) return { color: '#fbbf24', bg: 'rgba(234,179,8,0.1)', border: 'rgba(234,179,8,0.2)' }
  return { color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.18)' }
}

function difficultyBadge(diff: Difficulty) {
  if (diff === 'easy') return { bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.18)', color: '#4ade80' }
  if (diff === 'medium') return { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.18)', color: '#fbbf24' }
  return { bg: 'rgba(239,68,68,0.06)', border: 'rgba(239,68,68,0.15)', color: '#f87171' }
}

function OpportunityCard({ opp }: { opp: LeadOpportunity }) {
  const router = useRouter()
  const qc = qualityColor(opp.qualityScore)
  const db = difficultyBadge(opp.difficulty)

  function handleGenerateOutreach() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lesead_selected_opportunity', JSON.stringify(opp))
    }
    router.push('/outreach')
  }

  return (
    <div
      style={{
        backgroundColor: '#0d1a0f',
        border: '1px solid #1c2e1f',
        borderRadius: '14px',
        padding: '20px 22px',
        transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: 'Inter, system-ui, sans-serif',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'rgba(74,222,128,0.12)'
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#1c2e1f'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      {/* Score top-right */}
      <div style={{ position: 'absolute', top: '18px', right: '20px' }}>
        <span
          className={dmSerif.className}
          style={{
            fontSize: '2.2rem',
            color: qc.color,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          {opp.qualityScore}
        </span>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap', paddingRight: '60px' }}>
        <span
          style={{
            backgroundColor: db.bg,
            border: `1px solid ${db.border}`,
            color: db.color,
            borderRadius: '999px',
            padding: '2px 9px',
            fontSize: '0.67rem',
            fontWeight: '600',
            textTransform: 'capitalize',
            letterSpacing: '0.02em',
          }}
        >
          {opp.difficulty}
        </span>
        <span
          style={{
            backgroundColor: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.18)',
            color: '#a78bfa',
            borderRadius: '999px',
            padding: '2px 9px',
            fontSize: '0.67rem',
            fontWeight: '600',
            letterSpacing: '0.02em',
          }}
        >
          {opp.platform}
        </span>
        {opp.audience && (
          <span
            style={{
              backgroundColor: 'rgba(74,222,128,0.06)',
              border: '1px solid rgba(74,222,128,0.12)',
              color: '#6b8070',
              borderRadius: '999px',
              padding: '2px 9px',
              fontSize: '0.67rem',
              fontWeight: '500',
              letterSpacing: '0.02em',
            }}
          >
            {opp.audience}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 style={{ color: '#e8f0e9', fontSize: '0.95rem', fontWeight: '500', margin: 0, letterSpacing: '-0.01em', lineHeight: 1.45, paddingRight: '60px' }}>
        {opp.title}
      </h3>

      {/* Why it fits */}
      <p style={{ color: '#a0b8a4', fontSize: '0.84rem', margin: 0, lineHeight: 1.65 }}>
        {opp.whyItFits}
      </p>

      {/* Messaging angle */}
      {opp.messagingAngle && (
        <p style={{ color: '#6b8070', fontSize: '0.8rem', margin: 0, lineHeight: 1.6, fontStyle: 'italic' }}>
          &ldquo;{opp.messagingAngle}&rdquo;
        </p>
      )}

      {/* CTA */}
      <div style={{ marginTop: '4px' }}>
        <button
          onClick={handleGenerateOutreach}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            color: '#4ade80',
            fontSize: '0.82rem',
            fontWeight: '600',
            cursor: 'pointer',
            padding: 0,
            transition: 'gap 0.15s',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.gap = '9px'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.gap = '6px'
          }}
        >
          Generate Outreach <ArrowRight size={13} />
        </button>
      </div>
    </div>
  )
}

export default function OpportunitiesPage() {
  const aiAnalysis = useAppStore((s) => s.aiAnalysis)
  const [filter, setFilter] = useState<Difficulty | 'all'>('all')

  const opportunities = aiAnalysis?.opportunities ?? []
  const filtered = filter === 'all' ? opportunities : opportunities.filter((o) => o.difficulty === filter)

  if (!aiAnalysis) {
    return (
      <div style={{ maxWidth: '640px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1
          className={dmSerif.className}
          style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 24px', letterSpacing: '-0.03em' }}
        >
          Opportunities
        </h1>
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: '16px',
            padding: '52px 36px',
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
              opacity: 0.12,
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
            <Lightbulb size={22} color="#4ade80" strokeWidth={1.5} />
          </div>
          <h3
            className={dmSerif.className}
            style={{ color: '#e8f0e9', margin: '0 0 8px', fontSize: '1.3rem', letterSpacing: '-0.02em' }}
          >
            No analysis yet
          </h3>
          <p style={{ color: '#a0b8a4', fontSize: '0.875rem', margin: '0 0 22px', lineHeight: 1.65 }}>
            Run an AI analysis to unlock lead opportunities tailored to your business.
          </p>
          <a
            href="/analysis"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#22c55e',
              color: '#020a03',
              borderRadius: '10px',
              padding: '11px 22px',
              fontWeight: '600',
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 4px 16px rgba(74,222,128,0.2)',
              transition: 'all 0.2s',
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
            Go to Analysis <ArrowRight size={14} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '900px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1
              className={dmSerif.className}
              style={{ fontSize: '2rem', color: '#e8f0e9', margin: 0, letterSpacing: '-0.03em' }}
            >
              Opportunities
            </h1>
            <span
              style={{
                backgroundColor: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.2)',
                color: '#4ade80',
                borderRadius: '999px',
                padding: '3px 12px',
                fontSize: '0.75rem',
                fontWeight: '600',
              }}
            >
              {opportunities.length}
            </span>
          </div>
          <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.875rem' }}>
            Lead opportunities identified by AI
          </p>
        </div>

        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            backgroundColor: '#0d1a0f',
            border: '1px solid #1c2e1f',
            borderRadius: '10px',
            padding: '4px',
          }}
        >
          {(['all', 'easy', 'medium', 'hard'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                backgroundColor: filter === f ? '#111f13' : 'transparent',
                border: filter === f ? '1px solid rgba(74,222,128,0.2)' : '1px solid transparent',
                color: filter === f ? '#4ade80' : '#a0b8a4',
                borderRadius: '7px',
                padding: '6px 14px',
                fontSize: '0.8rem',
                fontWeight: filter === f ? '600' : '400',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.15s',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid #1c2e1f',
            borderRadius: '14px',
            padding: '36px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#a0b8a4', margin: 0 }}>No opportunities match this filter.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '14px' }}>
          {filtered.map((opp) => (
            <OpportunityCard key={opp.id} opp={opp} />
          ))}
        </div>
      )}
    </div>
  )
}
