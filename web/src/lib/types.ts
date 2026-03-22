export type Industry =
  | 'Landscaping' | 'Pressure Washing' | 'Window Cleaning' | 'Pest Control'
  | 'House Cleaning' | 'Pool Service' | 'Painting' | 'Gutter Cleaning'
  | 'Roofing' | 'HVAC' | 'Plumbing' | 'Electrical' | 'Other Service'

export type Platform =
  | 'Instagram' | 'LinkedIn' | 'TikTok' | 'Facebook' | 'Google'
  | 'Cold Email' | 'Cold DM' | 'Content Marketing' | 'Paid Ads'
  | 'Twitter/X' | 'YouTube' | 'Reddit'

export type BudgetRange = '<$500' | '$500-2k' | '$2k-5k' | '$5k-10k' | '$10k+'
export type OutreachTone = 'professional' | 'casual' | 'bold' | 'friendly'
export type OutreachType = 'dm' | 'email' | 'ad' | 'offer' | 'cta'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type LeadAlertStatus = 'new' | 'replied' | 'dismissed'
export type LeadAlertSource = 'reddit' | 'craigslist' | 'linkedin' | 'facebook' | 'nextdoor' | 'instagram' | 'twitter' | 'zillow'
export type BuyerIntent = 'ready_to_buy' | 'actively_looking' | 'just_browsing'
export type PlanId = 'free' | 'starter' | 'pro' | 'scale'
export type PipelineStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost'

export interface BusinessProfile {
  id: string
  businessName: string
  industry: Industry
  offer: string
  pricing: string
  revenueGoal: string
  location: string
  serviceArea: string
  remoteOk: boolean
  targetAudience: string
  differentiators: string
  goals: string[]
  budget: BudgetRange
  platforms: Platform[]
  createdAt: string
  updatedAt: string
}

export interface BuyerPersona {
  id: string
  name: string
  age: string
  income: string
  role: string
  company: string
  painPoints: string[]
  motivations: string[]
  buyingTriggers: string[]
  objections: string[]
  whereTheyHangOut: string[]
  preferredContent: string[]
  dayInLife: string
  quote: string
}

export interface ICP {
  description: string
  demographics: { ageRange: string; income: string; roles: string[]; companySize: string; geography: string }
  psychographics: { values: string[]; fears: string[]; aspirations: string[]; identity: string }
  behaviors: { purchasingBehavior: string; mediaConsumption: string[]; decisionProcess: string; averageSalesCycle: string }
  highValueSegments: string[]
  matchScore: number
}

export interface LeadOpportunity {
  id: string
  title: string
  whyItFits: string
  qualityScore: number
  difficulty: Difficulty
  messagingAngle: string
  platform: Platform
  audience: string
  niche: string
  estimatedReach: string
  conversionTip: string
  searchTerms: string[]
}

export interface OutreachMessage {
  id: string
  type: OutreachType
  content: string
  tone: OutreachTone
  platform: Platform
  subjectLine?: string
  hook?: string
  callToAction?: string
  characterCount: number
  createdAt: string
}

export interface StrategySummary {
  bestBuyer: string
  whereToFindThem: string[]
  whatToSay: string[]
  firstSteps: string[]
  keyInsights: string[]
  competitiveEdge: string
  contentIdeas: string[]
}

export interface AIAnalysis {
  id: string
  icp: ICP
  personas: BuyerPersona[]
  opportunities: LeadOpportunity[]
  strategy: StrategySummary
  overallConfidence: number
  modelVersion: string
  generatedAt: string
}

export interface MonitorPost {
  id: string
  source: LeadAlertSource
  community: string
  title: string
  body: string
  url: string
  author: string
  createdUtc: number
}

export interface LeadAlert {
  id: string
  post: MonitorPost
  matchReason: string
  relevanceScore: number
  buyerIntent: BuyerIntent
  estimatedValueLow: number
  estimatedValueHigh: number
  suggestedReply: string
  responseStrategy: string
  status: LeadAlertStatus
  scannedAt: string
}

export interface MonitorScanResult {
  alerts: LeadAlert[]
  scannedAt: string
  queriesRun: string[]
  totalPostsChecked: number
}

export interface SavedLead {
  id: string
  alertId: string
  alert: LeadAlert
  stage: PipelineStage
  notes: { id: string; text: string; createdAt: string }[]
  estimatedValue: number | null
  savedAt: string
  updatedAt: string
}

export interface AudienceLead {
  id: string
  ownerFirstName: string
  ownerLastName: string
  address: string
  city: string
  state: string
  zip: string
  homeValue: number
  saleDateUtc: string
  email: string | null
  seasonalityScore: number
  homeValueScore: number
  totalScore: number
  emailDraft: string | null
  emailSubject: string | null
  status: 'pending' | 'sent' | 'skipped_no_email' | 'skipped_low_score'
}

export interface AudienceResult {
  propertiesFound: number
  enriched: number
  emailsSent: number
  skippedNoEmail: number
  skippedLowScore: number
  leads: AudienceLead[]
  ranAt: string
}
