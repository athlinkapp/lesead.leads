'use client'

import { useState, useEffect } from 'react'
import { DM_Serif_Display } from 'next/font/google'
import { Copy, Check, MessageSquare } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { generateOutreach } from '@/services/apiClient'
import type { OutreachTone, OutreachType, OutreachMessage, LeadOpportunity } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

const TONES: OutreachTone[] = ['professional', 'casual', 'bold', 'friendly']
const TYPES: { value: OutreachType; label: string }[] = [
  { value: 'dm', label: 'DM' },
  { value: 'email', label: 'Email' },
  { value: 'ad', label: 'Ad' },
  { value: 'offer', label: 'Offer' },
  { value: 'cta', label: 'CTA' },
]

function PillTab({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: active ? '#111f13' : 'transparent',
        border: active ? '1px solid rgba(74,222,128,0.25)' : '1px solid rgba(232,240,233,0.1)',
        color: active ? '#4ade80' : '#a0b8a4',
        borderRadius: '8px',
        padding: '7px 15px',
        fontSize: '0.82rem',
        fontWeight: active ? '600' : '400',
        cursor: 'pointer',
        textTransform: 'capitalize',
        transition: 'all 0.15s',
        fontFamily: 'Inter, system-ui, sans-serif',
        letterSpacing: '-0.01em',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = '#e8f0e9'
          e.currentTarget.style.borderColor = 'rgba(232,240,233,0.2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = '#a0b8a4'
          e.currentTarget.style.borderColor = 'rgba(232,240,233,0.1)'
        }
      }}
    >
      {children}
    </button>
  )
}

function MessageCard({ msg, onCopy }: { msg: OutreachMessage; onCopy: () => void }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(msg.content)
    setCopied(true)
    onCopy()
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      style={{
        backgroundColor: '#0d1a0f',
        border: '1px solid rgba(74,222,128,0.15)',
        borderRadius: '14px',
        padding: '18px 20px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span
            style={{
              backgroundColor: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.18)',
              color: '#4ade80',
              borderRadius: '999px',
              padding: '2px 9px',
              fontSize: '0.67rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {msg.type}
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
              textTransform: 'capitalize',
              letterSpacing: '0.02em',
            }}
          >
            {msg.tone}
          </span>
          <span style={{ color: '#6b8070', fontSize: '0.72rem' }}>{msg.characterCount} chars</span>
        </div>
        <button
          onClick={handleCopy}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: copied ? 'rgba(74,222,128,0.08)' : 'transparent',
            border: `1px solid ${copied ? 'rgba(74,222,128,0.25)' : 'rgba(232,240,233,0.12)'}`,
            color: copied ? '#4ade80' : '#a0b8a4',
            borderRadius: '7px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            fontWeight: '500',
            transition: 'all 0.15s',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
          onMouseEnter={(e) => {
            if (!copied) {
              e.currentTarget.style.color = '#e8f0e9'
              e.currentTarget.style.borderColor = 'rgba(232,240,233,0.22)'
            }
          }}
          onMouseLeave={(e) => {
            if (!copied) {
              e.currentTarget.style.color = '#a0b8a4'
              e.currentTarget.style.borderColor = 'rgba(232,240,233,0.12)'
            }
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {msg.subjectLine && (
        <p style={{ color: '#a0b8a4', fontSize: '0.8rem', margin: '0 0 10px', lineHeight: 1.5 }}>
          <strong style={{ color: '#e8f0e9' }}>Subject:</strong> {msg.subjectLine}
        </p>
      )}
      <div
        style={{
          backgroundColor: '#111f13',
          border: '1px solid #1c2e1f',
          borderRadius: '10px',
          padding: '14px 16px',
          color: '#e8f0e9',
          fontSize: '0.875rem',
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
        }}
      >
        {msg.content}
      </div>
    </div>
  )
}

export default function OutreachPage() {
  const businessProfile = useAppStore((s) => s.businessProfile)
  const aiAnalysis = useAppStore((s) => s.aiAnalysis)
  const savedLeads = useAppStore((s) => s.savedLeads)

  const [mode, setMode] = useState<'opportunity' | 'lead'>('opportunity')
  const [selectedOppId, setSelectedOppId] = useState<string>('')
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [tone, setTone] = useState<OutreachTone>('professional')
  const [type, setType] = useState<OutreachType>('dm')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [history, setHistory] = useState<OutreachMessage[]>([])

  const opportunities = aiAnalysis?.opportunities ?? []

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('lesead_selected_opportunity')
      if (stored) {
        try {
          const opp: LeadOpportunity = JSON.parse(stored)
          setSelectedOppId(opp.id)
          setMode('opportunity')
          localStorage.removeItem('lesead_selected_opportunity')
        } catch {
          // ignore parse errors
        }
      }
    }
  }, [])

  async function handleGenerate() {
    if (!businessProfile) { setError('Set up your business profile first.'); return }
    setError('')

    let opportunity: LeadOpportunity | undefined

    if (mode === 'opportunity') {
      opportunity = opportunities.find((o) => o.id === selectedOppId)
      if (!opportunity) { setError('Select an opportunity.'); return }
    } else {
      const lead = savedLeads.find((l) => l.id === selectedLeadId)
      if (!lead) { setError('Select a saved lead.'); return }
      opportunity = {
        id: lead.id,
        title: lead.alert.post.title,
        whyItFits: lead.alert.matchReason,
        qualityScore: lead.alert.relevanceScore,
        difficulty: 'medium',
        messagingAngle: lead.alert.suggestedReply,
        platform: lead.alert.post.source === 'reddit' ? 'Reddit' : 'Cold DM',
        audience: businessProfile.targetAudience,
        niche: businessProfile.industry,
        estimatedReach: 'Direct',
        conversionTip: lead.alert.responseStrategy,
        searchTerms: [],
      }
    }

    setLoading(true)
    try {
      const msg = await generateOutreach(businessProfile, opportunity, type, tone)
      setHistory((prev) => [msg, ...prev])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: '#111f13',
    border: '1px solid #1c2e1f',
    color: '#e8f0e9',
    borderRadius: '9px',
    padding: '10px 14px',
    fontSize: '0.875rem',
    outline: 'none',
    cursor: 'pointer',
    fontFamily: 'Inter, system-ui, sans-serif',
    transition: 'border-color 0.15s',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block',
    color: '#6b8070',
    fontSize: '0.7rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
    fontFamily: 'Inter, system-ui, sans-serif',
  }

  return (
    <div style={{ maxWidth: '920px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1
          className={dmSerif.className}
          style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 6px', letterSpacing: '-0.03em' }}
        >
          Outreach Generator
        </h1>
        <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
          Generate personalized outreach messages powered by AI.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left panel — controls */}
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid #1c2e1f',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          {/* Mode switcher */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '22px', backgroundColor: '#111f13', borderRadius: '10px', padding: '4px' }}>
            {(['opportunity', 'lead'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: mode === m ? '600' : '400',
                  backgroundColor: mode === m ? '#0d1a0f' : 'transparent',
                  color: mode === m ? '#4ade80' : '#a0b8a4',
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {m === 'opportunity' ? 'For Opportunity' : 'For Lead'}
              </button>
            ))}
          </div>

          {/* Source selector */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>
              {mode === 'opportunity' ? 'Select Opportunity' : 'Select Saved Lead'}
            </label>
            {mode === 'opportunity' ? (
              <select
                value={selectedOppId}
                onChange={(e) => setSelectedOppId(e.target.value)}
                style={selectStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#1c2e1f')}
              >
                <option value="">— Choose an opportunity —</option>
                {opportunities.map((o) => (
                  <option key={o.id} value={o.id} style={{ backgroundColor: '#111f13' }}>{o.title}</option>
                ))}
              </select>
            ) : (
              <select
                value={selectedLeadId}
                onChange={(e) => setSelectedLeadId(e.target.value)}
                style={selectStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.4)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#1c2e1f')}
              >
                <option value="">— Choose a saved lead —</option>
                {savedLeads.map((l) => (
                  <option key={l.id} value={l.id} style={{ backgroundColor: '#111f13' }}>{l.alert.post.title}</option>
                ))}
              </select>
            )}
          </div>

          {/* Tone */}
          <div style={{ marginBottom: '18px' }}>
            <label style={labelStyle}>Tone</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TONES.map((t) => (
                <PillTab key={t} active={tone === t} onClick={() => setTone(t)}>
                  {t}
                </PillTab>
              ))}
            </div>
          </div>

          {/* Type */}
          <div style={{ marginBottom: '24px' }}>
            <label style={labelStyle}>Message Type</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TYPES.map(({ value, label }) => (
                <PillTab key={value} active={type === value} onClick={() => setType(value)}>
                  {label}
                </PillTab>
              ))}
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
            onClick={handleGenerate}
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: loading ? '#166534' : '#22c55e',
              color: '#020a03',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 20px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
              fontFamily: 'Inter, system-ui, sans-serif',
              boxShadow: loading ? 'none' : '0 4px 16px rgba(74,222,128,0.2)',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.backgroundColor = '#4ade80'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
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
                Generating...
              </>
            ) : (
              <>
                <MessageSquare size={15} />
                Generate Message
              </>
            )}
          </button>
        </div>

        {/* Right panel — results */}
        <div>
          {history.length === 0 ? (
            <div
              style={{
                backgroundColor: '#0d1a0f',
                border: '1px dashed rgba(74,222,128,0.1)',
                borderRadius: '16px',
                padding: '48px 28px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(74,222,128,0.06)',
                  border: '1px solid rgba(74,222,128,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <MessageSquare size={18} color="#4ade80" strokeWidth={1.5} />
              </div>
              <p style={{ color: '#6b8070', margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>
                Generated messages will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {history.map((msg) => (
                <MessageCard key={msg.id} msg={msg} onCopy={() => {}} />
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
