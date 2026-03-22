import type { BusinessProfile, AIAnalysis, OutreachMessage, LeadOpportunity, OutreachType, OutreachTone, MonitorScanResult, AudienceResult, PlanId } from '@/lib/types'

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
  if (!res.ok) { const t = await res.text().catch(() => 'Unknown error'); throw new Error(`API ${res.status}: ${t}`) }
  return res.json()
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`)
  if (!res.ok) { const t = await res.text().catch(() => 'Unknown error'); throw new Error(`API ${res.status}: ${t}`) }
  return res.json()
}

export const generateAnalysis = (profile: BusinessProfile): Promise<AIAnalysis> =>
  post('/api/analysis', profile)

export const regenerateAnalysis = (profile: BusinessProfile): Promise<AIAnalysis> =>
  post('/api/analysis/regenerate', profile)

export const generateOutreach = async (
  profile: BusinessProfile, opportunity: LeadOpportunity, type: OutreachType, tone: OutreachTone
): Promise<OutreachMessage> => {
  const msgs = await post<OutreachMessage[]>('/api/outreach', { profile, opportunity, types: [type], tone })
  if (!msgs[0]) throw new Error('No outreach message returned')
  return msgs[0]
}

export const scanForLeads = (profile: BusinessProfile, scanDepth: 1 | 2 | 3 = 1, planId?: PlanId): Promise<MonitorScanResult> =>
  post('/api/monitoring/scan', { profile, scanDepth, planId })

export const buildAudience = (profile: BusinessProfile, minHomeValue = 400000): Promise<AudienceResult> =>
  post('/api/pipeline/audience', { profile, minHomeValue })

export const createCheckoutSession = (planId: Exclude<PlanId, 'free'>, email?: string, customerId?: string, promoCode?: string) =>
  post<{ url: string; id: string }>('/api/billing/checkout-session', {
    planId, email, customerId, promoCode,
    successUrl: typeof window !== 'undefined' ? `${window.location.origin}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}` : undefined,
    cancelUrl: typeof window !== 'undefined' ? `${window.location.origin}/pricing?checkout=canceled` : undefined,
  })

export const createBillingPortalSession = (customerId: string) =>
  post<{ url: string }>('/api/billing/portal-session', {
    customerId,
    returnUrl: typeof window !== 'undefined' ? `${window.location.origin}/settings` : undefined,
  })

export const getCheckoutSessionStatus = (sessionId: string) =>
  get<{ sessionId: string; customerId: string | null; email: string | null; planId: PlanId; subscriptionStatus: string | null }>(`/api/billing/session/${encodeURIComponent(sessionId)}`)

export const getSubscriptionStatus = (customerId: string) =>
  get<{ customerId: string; planId: PlanId; subscriptionStatus: string | null; hasActiveSubscription: boolean }>(`/api/billing/subscription?customerId=${encodeURIComponent(customerId)}`)

export const loadUserSnapshot = async (userId: string) => {
  const r = await get<{ snapshot: Record<string, unknown> | null }>(`/api/user-data/${encodeURIComponent(userId)}`)
  return r.snapshot ?? null
}

export const saveUserSnapshot = (userId: string, snapshot: unknown) =>
  post<{ ok: boolean }>(`/api/user-data/${encodeURIComponent(userId)}`, { snapshot })
