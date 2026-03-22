// Shared types for the LeSead backend — mirrors frontend src/types/index.ts

export type Platform =
  | 'Instagram'
  | 'LinkedIn'
  | 'Facebook'
  | 'TikTok'
  | 'Twitter'
  | 'YouTube'
  | 'Reddit'
  | 'Pinterest'
  | 'Email'
  | 'Google Ads'
  | 'Other';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type OutreachTone = 'professional' | 'casual' | 'bold' | 'friendly';
export type OutreachType = 'dm' | 'email' | 'ad' | 'offer' | 'cta';
export type BudgetRange = 'under_500' | '500_2000' | '2000_5000' | '5000_plus' | 'bootstrapped';
export type Industry = string;

export interface BusinessProfile {
  id: string;
  businessName: string;
  industry: Industry;
  offer: string;
  pricing: string;
  revenueGoal: string;
  location: string;
  serviceArea?: string;
  remoteOk: boolean;
  targetAudience: string;
  differentiators?: string;
  budget: BudgetRange;
  platforms: Platform[];
  goals?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LeadOpportunity {
  id: string;
  title: string;
  whyItFits: string;
  qualityScore: number;
  difficulty: Difficulty;
  messagingAngle: string;
  platform: Platform;
  audience: string;
  niche: string;
  estimatedReach: string;
  conversionTip: string;
  searchTerms: string[];
}

export interface OutreachMessage {
  id: string;
  type: OutreachType;
  content: string;
  tone: OutreachTone;
  platform: Platform;
  subjectLine?: string;
  hook?: string;
  callToAction?: string;
  characterCount: number;
  createdAt: string;
}

export interface BuyerPersona {
  id: string;
  name: string;
  age: string;
  income: string;
  role: string;
  company: string;
  painPoints: string[];
  motivations: string[];
  buyingTriggers: string[];
  objections: string[];
  whereTheyHangOut: string[];
  preferredContent: string[];
  dayInLife: string;
  quote: string;
}

export interface ICP {
  description: string;
  demographics: {
    ageRange: string;
    income: string;
    roles: string[];
    companySize: string;
    geography: string;
  };
  psychographics: {
    values: string[];
    fears: string[];
    aspirations: string[];
    identity: string;
  };
  behaviors: {
    purchasingBehavior: string;
    mediaConsumption: string[];
    decisionProcess: string;
    averageSalesCycle: string;
  };
  highValueSegments: string[];
  matchScore: number;
}

export interface StrategySummary {
  bestBuyer: string;
  whereToFindThem: string[];
  whatToSay: string[];
  firstSteps: string[];
  keyInsights: string[];
  competitiveEdge: string;
  contentIdeas: string[];
}

// ─── Lead Monitoring ──────────────────────────────────────────────────────────

export type LeadAlertStatus = 'new' | 'replied' | 'dismissed';
export type LeadAlertSource = 'reddit' | 'craigslist' | 'linkedin' | 'facebook' | 'nextdoor' | 'instagram' | 'twitter' | 'zillow';
export type BuyerIntent = 'ready_to_buy' | 'actively_looking' | 'just_browsing';

export interface MonitorPost {
  id: string;
  source: LeadAlertSource;
  community: string;
  title: string;
  body: string;
  url: string;
  author: string;
  createdUtc: number;
}

export interface LeadAlert {
  id: string;
  post: MonitorPost;
  matchReason: string;
  relevanceScore: number;
  buyerIntent: BuyerIntent;
  estimatedValueLow: number;
  estimatedValueHigh: number;
  suggestedReply: string;
  responseStrategy: string;
  status: LeadAlertStatus;
  scannedAt: string;
}

export interface MonitorScanResult {
  alerts: LeadAlert[];
  scannedAt: string;
  queriesRun: string[];
  totalPostsChecked: number;
}

export interface AIAnalysis {
  id: string;
  icp: ICP;
  personas: BuyerPersona[];
  opportunities: LeadOpportunity[];
  strategy: StrategySummary;
  overallConfidence: number;
  modelVersion: string;
  generatedAt: string;
}
