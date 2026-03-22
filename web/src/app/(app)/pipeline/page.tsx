'use client'

import { useState } from 'react'
import { DM_Serif_Display } from 'next/font/google'
import { GitMerge, Plus, X } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import type { PipelineStage, SavedLead } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

const STAGES: PipelineStage[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost']

const STAGE_COLORS: Record<PipelineStage, { bg: string; color: string; border: string }> = {
  new: { bg: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: 'rgba(107,114,128,0.2)' },
  contacted: { bg: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: 'rgba(59,130,246,0.2)' },
  qualified: { bg: 'rgba(234,179,8,0.08)', color: '#fbbf24', border: 'rgba(234,179,8,0.18)' },
  proposal: { bg: 'rgba(139,92,246,0.08)', color: '#a78bfa', border: 'rgba(139,92,246,0.18)' },
  won: { bg: 'rgba(74,222,128,0.08)', color: '#4ade80', border: 'rgba(74,222,128,0.18)' },
  lost: { bg: 'rgba(239,68,68,0.06)', color: '#f87171', border: 'rgba(239,68,68,0.15)' },
}

function sourceBadge(source: string) {
  if (source === 'reddit') return { bg: 'rgba(255,88,0,0.1)', border: 'rgba(255,88,0,0.2)', color: '#ff8c42' }
  if (source === 'craigslist') return { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.2)', color: '#60a5fa' }
  if (source === 'facebook') return { bg: 'rgba(24,119,242,0.1)', border: 'rgba(24,119,242,0.2)', color: '#6ba3e0' }
  if (source === 'nextdoor') return { bg: 'rgba(0,184,94,0.1)', border: 'rgba(0,184,94,0.2)', color: '#00c46a' }
  if (source === 'linkedin') return { bg: 'rgba(10,102,194,0.1)', border: 'rgba(10,102,194,0.2)', color: '#6ba3e0' }
  if (source === 'instagram') return { bg: 'rgba(225,48,108,0.1)', border: 'rgba(225,48,108,0.2)', color: '#f472b6' }
  if (source === 'twitter') return { bg: 'rgba(0,0,0,0.2)', border: 'rgba(255,255,255,0.12)', color: '#e2e8f0' }
  if (source === 'zillow') return { bg: 'rgba(0,111,202,0.1)', border: 'rgba(0,111,202,0.2)', color: '#60a5fa' }
  return { bg: 'rgba(74,222,128,0.06)', border: 'rgba(74,222,128,0.15)', color: '#4ade80' }
}

function LeadRow({ lead, isEven }: { lead: SavedLead; isEven: boolean }) {
  const updateLeadStage = useAppStore((s) => s.updateLeadStage)
  const addLeadNote = useAppStore((s) => s.addLeadNote)
  const removeLead = useAppStore((s) => s.removeLead)

  const [addingNote, setAddingNote] = useState(false)
  const [noteText, setNoteText] = useState('')

  const src = sourceBadge(lead.alert.post.source)
  const stageColor = STAGE_COLORS[lead.stage]

  function submitNote() {
    if (!noteText.trim()) return
    addLeadNote(lead.alertId, noteText.trim())
    setNoteText('')
    setAddingNote(false)
  }

  return (
    <tbody>
      <tr
        style={{
          borderBottom: '1px solid #1c2e1f',
          backgroundColor: isEven ? 'rgba(17,31,19,0.5)' : 'transparent',
          transition: 'background-color 0.15s',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = 'rgba(74,222,128,0.03)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.backgroundColor = isEven ? 'rgba(17,31,19,0.5)' : 'transparent')}
      >
        {/* Title */}
        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
          <a
            href={lead.alert.post.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#e8f0e9',
              fontSize: '0.84rem',
              fontWeight: '500',
              textDecoration: 'none',
              display: 'block',
              maxWidth: '240px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#4ade80')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#e8f0e9')}
          >
            {lead.alert.post.title}
          </a>
        </td>

        {/* Source */}
        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
          <span
            style={{
              backgroundColor: src.bg,
              border: `1px solid ${src.border}`,
              color: src.color,
              borderRadius: '999px',
              padding: '2px 9px',
              fontSize: '0.67rem',
              fontWeight: '600',
              textTransform: 'capitalize',
              letterSpacing: '0.02em',
            }}
          >
            {lead.alert.post.source}
          </span>
        </td>

        {/* Score */}
        <td style={{ padding: '14px 16px', verticalAlign: 'middle', color: '#4ade80', fontSize: '0.84rem', fontWeight: '600', letterSpacing: '-0.01em' }}>
          {lead.alert.relevanceScore}%
        </td>

        {/* Stage dropdown */}
        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
          <select
            value={lead.stage}
            onChange={(e) => updateLeadStage(lead.alertId, e.target.value as PipelineStage)}
            style={{
              backgroundColor: stageColor.bg,
              border: `1px solid ${stageColor.border}`,
              color: stageColor.color,
              borderRadius: '7px',
              padding: '4px 10px',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize',
              outline: 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {STAGES.map((s) => (
              <option key={s} value={s} style={{ backgroundColor: '#111f13', color: '#e8f0e9', textTransform: 'capitalize' }}>
                {s}
              </option>
            ))}
          </select>
        </td>

        {/* Value */}
        <td style={{ padding: '14px 16px', verticalAlign: 'middle', color: '#4ade80', fontSize: '0.84rem', whiteSpace: 'nowrap', fontWeight: '500' }}>
          ${lead.alert.estimatedValueLow.toLocaleString()} – ${lead.alert.estimatedValueHigh.toLocaleString()}
        </td>

        {/* Notes */}
        <td style={{ padding: '14px 16px', verticalAlign: 'middle', minWidth: '160px' }}>
          {lead.notes.length > 0 && !addingNote && (
            <div style={{ marginBottom: '5px' }}>
              {lead.notes.slice(-1).map((n) => (
                <p key={n.id} style={{ color: '#a0b8a4', fontSize: '0.78rem', margin: 0, lineHeight: 1.4 }}>
                  {n.text}
                </p>
              ))}
              {lead.notes.length > 1 && (
                <p style={{ color: '#4ade80', fontSize: '0.7rem', margin: '2px 0 0' }}>
                  +{lead.notes.length - 1} more
                </p>
              )}
            </div>
          )}
          {addingNote ? (
            <div style={{ display: 'flex', gap: '4px', flexDirection: 'column' }}>
              <input
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitNote()}
                placeholder="Add note..."
                autoFocus
                style={{
                  backgroundColor: '#0d1a0f',
                  border: '1px solid rgba(74,222,128,0.3)',
                  color: '#e8f0e9',
                  borderRadius: '6px',
                  padding: '5px 8px',
                  fontSize: '0.78rem',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              />
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={submitNote}
                  style={{
                    backgroundColor: '#22c55e',
                    color: '#020a03',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '3px 10px',
                    fontSize: '0.72rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => { setAddingNote(false); setNoteText('') }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid rgba(232,240,233,0.12)',
                    color: '#a0b8a4',
                    borderRadius: '5px',
                    padding: '3px 8px',
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setAddingNote(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'none',
                border: 'none',
                color: '#4ade80',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0,
                fontWeight: '500',
                fontFamily: 'Inter, system-ui, sans-serif',
                opacity: 0.8,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
            >
              <Plus size={11} /> Add note
            </button>
          )}
        </td>

        {/* Remove */}
        <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
          <button
            onClick={() => removeLead(lead.alertId)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'transparent',
              border: '1px solid rgba(239,68,68,0.15)',
              color: '#f87171',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              cursor: 'pointer',
              transition: 'all 0.15s',
              gap: '4px',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.08)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.15)'
            }}
          >
            <X size={11} /> Remove
          </button>
        </td>
      </tr>
    </tbody>
  )
}

export default function PipelinePage() {
  const savedLeads = useAppStore((s) => s.savedLeads)

  const stageCounts = STAGES.reduce((acc, s) => {
    acc[s] = savedLeads.filter((l) => l.stage === s).length
    return acc
  }, {} as Record<PipelineStage, number>)

  if (savedLeads.length === 0) {
    return (
      <div style={{ maxWidth: '760px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1
          className={dmSerif.className}
          style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 28px', letterSpacing: '-0.03em' }}
        >
          Pipeline
        </h1>
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid #1c2e1f',
            borderRadius: '16px',
            padding: '64px 36px',
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
              width: '56px',
              height: '56px',
              backgroundColor: 'rgba(74,222,128,0.07)',
              border: '1px solid rgba(74,222,128,0.15)',
              borderRadius: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <GitMerge size={22} color="#4ade80" strokeWidth={1.5} />
          </div>
          <h2
            className={dmSerif.className}
            style={{ color: '#e8f0e9', margin: '0 0 8px', fontSize: '1.4rem', letterSpacing: '-0.02em' }}
          >
            No leads yet
          </h2>
          <p style={{ color: '#a0b8a4', fontSize: '0.875rem', margin: '0 0 22px', lineHeight: 1.65 }}>
            Save leads from the Monitor page to track them here.
          </p>
          <a
            href="/monitor"
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
            Go to Monitor →
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1100px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <h1
        className={dmSerif.className}
        style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 22px', letterSpacing: '-0.03em' }}
      >
        Pipeline
      </h1>

      {/* Stage summary pills */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {STAGES.map((s) => {
          const sc = STAGE_COLORS[s]
          return (
            <div
              key={s}
              style={{
                backgroundColor: sc.bg,
                border: `1px solid ${sc.border}`,
                borderRadius: '10px',
                padding: '8px 16px',
                minWidth: '76px',
                textAlign: 'center',
                transition: 'all 0.15s',
              }}
            >
              <p
                className={dmSerif.className}
                style={{ color: sc.color, margin: '0 0 2px', fontSize: '1.4rem', letterSpacing: '-0.02em', lineHeight: 1 }}
              >
                {stageCounts[s]}
              </p>
              <p style={{ color: sc.color, margin: 0, fontSize: '0.68rem', textTransform: 'capitalize', opacity: 0.8, letterSpacing: '0.02em' }}>
                {s}
              </p>
            </div>
          )
        })}
      </div>

      {/* Table */}
      <div
        style={{
          backgroundColor: '#0d1a0f',
          border: '1px solid #1c2e1f',
          borderRadius: '14px',
          overflow: 'hidden',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '760px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1c2e1f', backgroundColor: '#111f13' }}>
              {['Lead', 'Source', 'Score', 'Stage', 'Value', 'Notes', 'Actions'].map((h) => (
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
          {savedLeads.map((lead, idx) => (
            <LeadRow key={lead.id} lead={lead} isEven={idx % 2 === 0} />
          ))}
        </table>
      </div>
    </div>
  )
}
