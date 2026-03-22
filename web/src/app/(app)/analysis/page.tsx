'use client'

import { useState } from 'react'
import { DM_Serif_Display } from 'next/font/google'
import { BarChart2, ArrowRight, Sparkles } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { generateAnalysis } from '@/services/apiClient'
import type { BuyerPersona, LeadOpportunity } from '@/lib/types'

const dmSerif = DM_Serif_Display({ subsets: ['latin'], weight: '400' })

const STAGES = [
  'Gathering market data...',
  'Building your ICP...',
  'Crafting personas...',
  'Generating opportunities...',
]

function PersonaCard({ persona }: { persona: BuyerPersona }) {
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
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.borderColor = 'rgba(74,222,128,0.12)'
        e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = '#1c2e1f'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{ marginBottom: '12px' }}>
        <h3
          className={dmSerif.className}
          style={{ color: '#e8f0e9', margin: '0 0 4px', fontSize: '1.1rem', letterSpacing: '-0.02em' }}
        >
          {persona.name}
        </h3>
        <p style={{ color: '#6b8070', margin: 0, fontSize: '0.8rem' }}>
          {persona.role} · {persona.age} · {persona.income}
        </p>
      </div>
      {persona.quote && (
        <blockquote
          style={{
            borderLeft: '2px solid rgba(74,222,128,0.4)',
            paddingLeft: '12px',
            margin: '0 0 14px',
            color: '#a0b8a4',
            fontStyle: 'italic',
            fontSize: '0.84rem',
            lineHeight: 1.65,
          }}
        >
          &ldquo;{persona.quote}&rdquo;
        </blockquote>
      )}
      <div>
        <p style={{ color: '#6b8070', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px', fontWeight: '600' }}>
          Pain Points
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {persona.painPoints.map((p, i) => (
            <span
              key={i}
              style={{
                backgroundColor: 'rgba(74,222,128,0.06)',
                border: '1px solid rgba(74,222,128,0.12)',
                color: '#4ade80',
                borderRadius: '6px',
                padding: '3px 9px',
                fontSize: '0.72rem',
                letterSpacing: '-0.01em',
              }}
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function OpportunityMini({ opp }: { opp: LeadOpportunity }) {
  const scoreColor = opp.qualityScore >= 70 ? '#4ade80' : opp.qualityScore >= 40 ? '#fbbf24' : '#f87171'
  const scoreBg = opp.qualityScore >= 70 ? 'rgba(74,222,128,0.08)' : opp.qualityScore >= 40 ? 'rgba(234,179,8,0.08)' : 'rgba(239,68,68,0.08)'
  const scoreBorder = opp.qualityScore >= 70 ? 'rgba(74,222,128,0.18)' : opp.qualityScore >= 40 ? 'rgba(234,179,8,0.18)' : 'rgba(239,68,68,0.18)'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '14px',
        backgroundColor: '#111f13',
        border: '1px solid #1c2e1f',
        borderRadius: '10px',
        padding: '14px 16px',
        transition: 'border-color 0.15s',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'rgba(74,222,128,0.12)')}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1c2e1f')}
    >
      <span
        className={dmSerif.className}
        style={{
          backgroundColor: scoreBg,
          border: `1px solid ${scoreBorder}`,
          color: scoreColor,
          borderRadius: '8px',
          padding: '3px 10px',
          fontSize: '1rem',
          fontWeight: '400',
          whiteSpace: 'nowrap',
          flexShrink: 0,
          letterSpacing: '-0.02em',
        }}
      >
        {opp.qualityScore}
      </span>
      <div>
        <p style={{ color: '#e8f0e9', margin: '0 0 3px', fontWeight: '500', fontSize: '0.875rem', letterSpacing: '-0.01em' }}>{opp.title}</p>
        <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.8rem', lineHeight: 1.5 }}>{opp.whyItFits}</p>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  const businessProfile = useAppStore((s) => s.businessProfile)
  const aiAnalysis = useAppStore((s) => s.aiAnalysis)
  const isAnalyzing = useAppStore((s) => s.isAnalyzing)
  const analysisStage = useAppStore((s) => s.analysisStage)
  const setAIAnalysis = useAppStore((s) => s.setAIAnalysis)
  const setAnalyzing = useAppStore((s) => s.setAnalyzing)
  const setStage = useAppStore((s) => s.setStage)

  const [error, setError] = useState('')
  const [stageIdx, setStageIdx] = useState(0)

  async function handleRunAnalysis() {
    if (!businessProfile) return
    setError('')
    setAnalyzing(true)
    setStageIdx(0)
    setStage(STAGES[0])

    const interval = setInterval(() => {
      setStageIdx((prev) => {
        const next = Math.min(prev + 1, STAGES.length - 1)
        setStage(STAGES[next])
        return next
      })
    }, 4000)

    try {
      const result = await generateAnalysis(businessProfile)
      setAIAnalysis(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Analysis failed. Please try again.')
    } finally {
      clearInterval(interval)
      setAnalyzing(false)
    }
  }

  if (!businessProfile) {
    return (
      <div style={{ maxWidth: '640px', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <h1
          className={dmSerif.className}
          style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 24px', letterSpacing: '-0.03em' }}
        >
          AI Analysis
        </h1>
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid rgba(234,179,8,0.15)',
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
              background: 'rgba(234,179,8,0.08)',
              border: '1px solid rgba(234,179,8,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <BarChart2 size={22} color="#fbbf24" strokeWidth={1.5} />
          </div>
          <h3
            className={dmSerif.className}
            style={{ color: '#e8f0e9', margin: '0 0 8px', fontSize: '1.3rem', letterSpacing: '-0.02em' }}
          >
            Business profile required
          </h3>
          <p style={{ color: '#a0b8a4', fontSize: '0.875rem', margin: '0 0 22px', lineHeight: 1.65 }}>
            Set up your business profile in Settings before running an analysis.
          </p>
          <a
            href="/settings"
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
            Go to Settings <ArrowRight size={14} />
          </a>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '960px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1
            className={dmSerif.className}
            style={{ fontSize: '2rem', color: '#e8f0e9', margin: '0 0 6px', letterSpacing: '-0.03em' }}
          >
            AI Analysis
          </h1>
          <p style={{ color: '#a0b8a4', margin: 0, fontSize: '0.9rem', lineHeight: 1.6 }}>
            Your ICP, personas, and lead opportunities — powered by AI.
          </p>
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isAnalyzing}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isAnalyzing ? '#166534' : '#22c55e',
            color: '#020a03',
            border: 'none',
            borderRadius: '10px',
            padding: '11px 22px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: isAnalyzing ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, system-ui, sans-serif',
            boxShadow: isAnalyzing ? 'none' : '0 4px 16px rgba(74,222,128,0.2)',
          }}
          onMouseEnter={(e) => {
            if (!isAnalyzing) {
              e.currentTarget.style.backgroundColor = '#4ade80'
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(74,222,128,0.3)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isAnalyzing) {
              e.currentTarget.style.backgroundColor = '#22c55e'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(74,222,128,0.2)'
            }
          }}
        >
          {isAnalyzing ? (
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
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles size={15} strokeWidth={2} />
              {aiAnalysis ? 'Re-run Analysis' : 'Run Analysis'}
            </>
          )}
        </button>
      </div>

      {/* Loading */}
      {isAnalyzing && (
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid rgba(74,222,128,0.15)',
            borderRadius: '14px',
            padding: '40px 32px',
            marginBottom: '28px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '300px',
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
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4ade80',
                boxShadow: '0 0 12px #4ade80',
                margin: '0 auto 16px',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <p
              className={dmSerif.className}
              style={{ color: '#e8f0e9', margin: '0 0 18px', fontSize: '1.2rem', letterSpacing: '-0.02em' }}
            >
              {analysisStage || STAGES[0]}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
              {STAGES.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    opacity: i <= stageIdx ? 1 : 0.3,
                    transition: 'opacity 0.4s',
                  }}
                >
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: i <= stageIdx ? '#4ade80' : '#1c2e1f',
                      boxShadow: i === stageIdx ? '0 0 6px #4ade80' : 'none',
                      transition: 'all 0.4s',
                    }}
                  />
                  {i < STAGES.length - 1 && (
                    <div
                      style={{
                        width: '20px',
                        height: '1px',
                        backgroundColor: i < stageIdx ? 'rgba(74,222,128,0.4)' : '#1c2e1f',
                        transition: 'background-color 0.4s',
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(239,68,68,0.06)',
            border: '1px solid rgba(239,68,68,0.18)',
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

      {/* Analysis results */}
      {aiAnalysis && !isAnalyzing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* ICP */}
          <section>
            <h2
              className={dmSerif.className}
              style={{ fontSize: '1.4rem', color: '#e8f0e9', margin: '0 0 16px', letterSpacing: '-0.02em' }}
            >
              Ideal Customer Profile
            </h2>
            <div
              style={{
                backgroundColor: '#0d1a0f',
                border: '1px solid #1c2e1f',
                borderRadius: '14px',
                padding: '24px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    backgroundColor: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.2)',
                    color: '#4ade80',
                    borderRadius: '999px',
                    padding: '4px 14px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    letterSpacing: '0.02em',
                  }}
                >
                  Match Score: {aiAnalysis.icp.matchScore}%
                </span>
              </div>
              <p style={{ color: '#e8f0e9', fontSize: '0.9rem', lineHeight: 1.75, margin: '0 0 20px' }}>
                {aiAnalysis.icp.description}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div>
                  <p style={{ color: '#6b8070', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: '600' }}>
                    Demographics
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    {[
                      ['Age', aiAnalysis.icp.demographics.ageRange],
                      ['Income', aiAnalysis.icp.demographics.income],
                      ['Company', aiAnalysis.icp.demographics.companySize],
                      ['Location', aiAnalysis.icp.demographics.geography],
                    ].map(([k, v]) => (
                      <p key={k} style={{ color: '#e8f0e9', margin: 0, fontSize: '0.82rem', lineHeight: 1.5 }}>
                        <span style={{ color: '#6b8070' }}>{k}: </span>{v}
                      </p>
                    ))}
                    {aiAnalysis.icp.demographics.roles.length > 0 && (
                      <p style={{ color: '#e8f0e9', margin: 0, fontSize: '0.82rem' }}>
                        <span style={{ color: '#6b8070' }}>Roles: </span>{aiAnalysis.icp.demographics.roles.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <p style={{ color: '#6b8070', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: '600' }}>
                    Psychographics
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {[...aiAnalysis.icp.psychographics.values, ...aiAnalysis.icp.psychographics.aspirations].slice(0, 6).map((v, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: 'rgba(139,92,246,0.07)',
                          border: '1px solid rgba(139,92,246,0.15)',
                          color: '#a78bfa',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                        }}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: '#6b8070', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: '600' }}>
                    Behaviors
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {(aiAnalysis.icp.psychographics as { behaviors?: string[] }).behaviors?.slice(0, 4).map((b: string, i: number) => (
                      <p key={i} style={{ color: '#a0b8a4', margin: 0, fontSize: '0.8rem', lineHeight: 1.5 }}>
                        · {b}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Personas */}
          <section>
            <h2
              className={dmSerif.className}
              style={{ fontSize: '1.4rem', color: '#e8f0e9', margin: '0 0 16px', letterSpacing: '-0.02em' }}
            >
              Buyer Personas
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
              {aiAnalysis.personas.map((p) => (
                <PersonaCard key={p.id} persona={p} />
              ))}
            </div>
          </section>

          {/* Opportunities */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
              <h2
                className={dmSerif.className}
                style={{ fontSize: '1.4rem', color: '#e8f0e9', margin: 0, letterSpacing: '-0.02em' }}
              >
                Lead Opportunities
              </h2>
              <a
                href="/opportunities"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  color: '#4ade80',
                  fontSize: '0.82rem',
                  textDecoration: 'none',
                  fontWeight: '500',
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                View all <ArrowRight size={13} />
              </a>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {aiAnalysis.opportunities.map((opp) => (
                <OpportunityMini key={opp.id} opp={opp} />
              ))}
            </div>
          </section>

          {/* Strategy */}
          <section>
            <h2
              className={dmSerif.className}
              style={{ fontSize: '1.4rem', color: '#e8f0e9', margin: '0 0 16px', letterSpacing: '-0.02em' }}
            >
              Go-To-Market Strategy
            </h2>
            <div
              style={{
                backgroundColor: '#0d1a0f',
                border: '1px solid #1c2e1f',
                borderRadius: '14px',
                padding: '24px',
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              {/* Best buyer highlight */}
              <div
                style={{
                  backgroundColor: 'rgba(74,222,128,0.05)',
                  border: '1px solid rgba(74,222,128,0.12)',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  marginBottom: '20px',
                }}
              >
                <p style={{ color: '#6b8070', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px', fontWeight: '600' }}>
                  Best Buyer
                </p>
                <p style={{ color: '#e8f0e9', fontSize: '0.9rem', margin: 0, lineHeight: 1.65 }}>
                  {aiAnalysis.strategy.bestBuyer}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div>
                  <p style={{ color: '#6b8070', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: '600' }}>
                    Where to Find Them
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {aiAnalysis.strategy.whereToFindThem.map((w, i) => (
                      <span
                        key={i}
                        style={{
                          backgroundColor: 'rgba(74,222,128,0.06)',
                          border: '1px solid rgba(74,222,128,0.12)',
                          color: '#4ade80',
                          borderRadius: '6px',
                          padding: '3px 10px',
                          fontSize: '0.78rem',
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ color: '#6b8070', fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 10px', fontWeight: '600' }}>
                    First Steps
                  </p>
                  <ol style={{ margin: 0, paddingLeft: '18px' }}>
                    {aiAnalysis.strategy.firstSteps.map((s, i) => (
                      <li key={i} style={{ color: '#e8f0e9', fontSize: '0.84rem', marginBottom: '6px', lineHeight: 1.55 }}>{s}</li>
                    ))}
                  </ol>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Empty state */}
      {!aiAnalysis && !isAnalyzing && !error && (
        <div
          style={{
            backgroundColor: '#0d1a0f',
            border: '1px solid rgba(74,222,128,0.1)',
            borderRadius: '16px',
            padding: '60px 36px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '400px',
              height: '300px',
              borderRadius: '50%',
              background: '#14532d',
              opacity: 0.1,
              filter: 'blur(100px)',
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
              borderRadius: '15px',
              background: 'rgba(74,222,128,0.07)',
              border: '1px solid rgba(74,222,128,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 18px',
            }}
          >
            <Sparkles size={22} color="#4ade80" strokeWidth={1.5} />
          </div>
          <h3
            className={dmSerif.className}
            style={{ color: '#e8f0e9', margin: '0 0 8px', fontSize: '1.5rem', letterSpacing: '-0.03em' }}
          >
            No analysis yet
          </h3>
          <p style={{ color: '#a0b8a4', fontSize: '0.9rem', margin: '0 0 24px', lineHeight: 1.65, maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
            Click &ldquo;Run Analysis&rdquo; to generate your ICP, buyer personas, and opportunities.
          </p>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; transform:scale(1); } 50% { opacity:0.5; transform:scale(0.8); } }
      `}</style>
    </div>
  )
}
