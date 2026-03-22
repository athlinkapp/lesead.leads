/**
 * AI Service — Three-Layer Hybrid Architecture
 *
 * Layer 1 — Gemini 2.5 Flash-Lite (always runs):
 *   Generates the full rough draft: brief + personas + opportunities.
 *   Fast, cheap, structural. No polish.
 *
 * Layer 2 — Importance Router:
 *   ICP score < 60  → return Gemini draft as-is (no Claude cost)
 *   ICP score >= 60 → compress draft, send to Claude for refinement
 *
 * Layer 3 — Claude Sonnet 4.6 (premium, conditional):
 *   Receives compressed draft (~60% fewer tokens than raw).
 *   ONLY refines: ICP narrative, persona emotion/quotes, opportunity angles, strategy.
 *   Does NOT re-generate facts Gemini already produced.
 *   Always used for outreach (always user-facing, always high-value).
 */

import type {
  BusinessProfile,
  AIAnalysis,
  OutreachMessage,
  LeadOpportunity,
  OutreachTone,
} from '../types';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Client Initialisation ─────────────────────────────────────────────────────

let anthropicClient: any = null;
let geminiClient: any = null;

const getAnthropicClient = () => {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'sk-ant-your-api-key-here') return null;
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
};

const getGeminiClient = () => {
  if (geminiClient) return geminiClient;
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey || apiKey === 'your-google-api-key-here') return null;
  geminiClient = new GoogleGenerativeAI(apiKey);
  return geminiClient;
};

// ─── Model Callers ─────────────────────────────────────────────────────────────

const callGemini = async (
  prompt: string,
  maxTokens = 3000
): Promise<string | null> => {
  const client = getGeminiClient();
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { maxOutputTokens: maxTokens },
    });
    const result = await model.generateContent(prompt);
    return result.response.text() ?? null;
  } catch (error: any) {
    console.error('[AI] Gemini error:', error?.message ?? error);
    return null;
  }
};

const callClaude = async (
  prompt: string,
  maxTokens = 3000
): Promise<string | null> => {
  const client = getAnthropicClient();
  if (!client) return null;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content?.[0]?.text ?? null;
  } catch (error: any) {
    console.error('[AI] Claude error:', error?.message ?? error);
    return null;
  }
};

const parseJSON = <T>(text: string): T | null => {
  try {
    const cleaned = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error('[AI] JSON parse error — response was likely truncated. Length:', text.length);
    console.error('[AI] Last 200 chars:', text.slice(-200));
    return null;
  }
};

// ─── Internal Types ────────────────────────────────────────────────────────────

interface GeminiDraft {
  brief: {
    businessName: string;
    industry: string;
    offerType: string;
    pricingTier: string;
    revenueModel: string;
    geography: string;
    buyerType: 'B2B' | 'B2C' | 'B2B2C';
    salesCycle: 'days' | 'weeks' | 'months';
    competitionLevel: 'low' | 'medium' | 'high';
    marketMaturity: 'emerging' | 'growing' | 'mature' | 'saturated';
    primaryPain: string;
    platformPriority: string[];
    icpScore: number;          // 0–100 — used for routing decision
    audienceSummary: string;
    keyStrengths: string[];
    keyGaps: string[];
    suggestedAngles: string[];
  };
  personas: Array<{
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
  }>;
  opportunities: Array<{
    id: string;
    title: string;
    platform: string;
    audience: string;
    niche: string;
    qualityScore: number;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedReach: string;
    searchTerms: string[];
    messagingAngle: string;
    whyItFits: string;
  }>;
}

interface ClaudeRefinement {
  icp: {
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
  };
  personaUpgrades: Array<{
    id: string;
    quote: string;
    dayInLife: string;
    painPointsRefined: string[];
    buyingTriggersRefined: string[];
  }>;
  opportunityUpgrades: Array<{
    id: string;
    messagingAngleRefined: string;
    whyItFitsRefined: string;
    conversionTip: string;
    specificGroupsRefined: string[];
    searchQueriesRefined: string[];
    whereToFindRefined: string[];
    actionStepsRefined: string[];
  }>;
  strategy: {
    bestBuyer: string;
    whereToFindThem: string[];
    whatToSay: string[];
    firstSteps: string[];
    keyInsights: string[];
    competitiveEdge: string;
    contentIdeas: string[];
  };
}

// ─── Layer 1: Gemini Draft Prompt ─────────────────────────────────────────────
// Generates brief + rough personas + rough opportunities in one call.

const buildGeminiDraftPrompt = (profile: BusinessProfile): string => `
You are a data analyst. Read this business profile and produce a structured JSON draft.
Be factual and concise — you are NOT writing final copy. Another system will refine the language later.
Focus on accuracy, structure, and scoring.

BUSINESS PROFILE:
Name: ${profile.businessName}
Industry: ${profile.industry}
Offer: ${profile.offer}
Pricing: ${profile.pricing}
Revenue Goal: ${profile.revenueGoal}
Location: ${profile.location} ${profile.remoteOk ? '(Remote OK)' : '(Local only)'}
Target Audience: ${profile.targetAudience}
Budget: ${profile.budget}
Platforms: ${profile.platforms.join(', ')}
Goals: ${profile.goals?.join(', ') || 'Not specified'}

Return ONLY this JSON (no markdown):

{
  "brief": {
    "businessName": "normalized name",
    "industry": "standardized industry",
    "offerType": "product|service|saas|consulting|other",
    "pricingTier": "budget|mid-market|premium|enterprise",
    "revenueModel": "one-time|recurring|hybrid|marketplace",
    "geography": "local|regional|national|global",
    "buyerType": "B2B|B2C|B2B2C",
    "salesCycle": "days|weeks|months",
    "competitionLevel": "low|medium|high",
    "marketMaturity": "emerging|growing|mature|saturated",
    "primaryPain": "the core problem this business solves in 8 words or less",
    "platformPriority": ["ranked platforms, most relevant first"],
    "icpScore": 75,
    "audienceSummary": "2 sentences on who the actual buyer is",
    "keyStrengths": ["3 genuine competitive strengths"],
    "keyGaps": ["2 positioning or targeting gaps"],
    "suggestedAngles": ["3 specific messaging angles to test"]
  },
  "personas": [
    {
      "id": "persona_1",
      "name": "realistic full name",
      "age": "specific age",
      "income": "specific income or business revenue",
      "role": "exact job title",
      "company": "type of company they work at or run",
      "painPoints": ["4 factual pain points — what problems do they have"],
      "motivations": ["3 factual motivations — what outcomes do they want"],
      "buyingTriggers": ["3 events that would make them buy"],
      "objections": ["3 realistic objections they would raise"],
      "whereTheyHangOut": ["4 specific platforms, communities, events"],
      "preferredContent": ["3 content formats they consume"]
    }
  ],
  "opportunities": [
    {
      "id": "opp_1",
      "title": "hyper-specific opportunity name — include the exact person, situation, and platform",
      "platform": "one of the business's listed platforms",
      "audience": "razor-specific description — NOT just a demographic. Include situation, trigger, and context. E.g. 'Southlake TX homeowners who just moved in the last 90 days and haven't found a lawn service yet'",
      "niche": "the micro-niche or specific sub-community — e.g. 'New construction homeowners in Southlake Estates subdivision'",
      "qualityScore": 8,
      "difficulty": "easy|medium|hard",
      "estimatedReach": "realistic number/range",
      "searchTerms": ["3-5 keywords"],
      "messagingAngle": "specific angle tied to their exact situation and pain",
      "whyItFits": "1-2 sentences on why this sub-group fits"
    }
  ]
}

RULES:
- Generate exactly 2-3 personas
- Generate exactly 4 opportunities across the listed platforms
- EVERY opportunity must be a micro-niche — NOT a broad demographic. Think: what specific situation, life event, or trigger makes someone need this right now?
- Good example: "HOA-governed neighborhood homeowners facing fines for overgrown lawns" NOT "homeowners who need lawn care"
- Good example: "Parents of kids with spring sports seasons who have no time on weekends" NOT "busy homeowners"
- Use the business's location to find real local groups, neighborhoods, and communities by name
- icpScore must be honest — score below 60 if audience is vague or overcrowded
- Keep all text short and factual — no marketing language, no fluff
- Return ONLY valid JSON
`.trim();

// ─── Layer 2: Compression ──────────────────────────────────────────────────────
// Shrinks the Gemini draft before sending to Claude.
// Removes redundant keys, shortens property names, strips verbose text.
// Typical reduction: 55–65% fewer tokens.

const compressDraft = (draft: GeminiDraft): string => {
  const { brief: b, personas, opportunities } = draft;
  return JSON.stringify({
    b: {
      n: b.businessName,
      ind: b.industry,
      ot: b.offerType,
      pt: b.pricingTier,
      rm: b.revenueModel,
      geo: b.geography,
      bt: b.buyerType,
      sc: b.salesCycle,
      comp: b.competitionLevel,
      mm: b.marketMaturity,
      pain: b.primaryPain,
      plat: b.platformPriority,
      score: b.icpScore,
      aud: b.audienceSummary,
      str: b.keyStrengths,
      gaps: b.keyGaps,
      ang: b.suggestedAngles,
    },
    p: personas.map(p => ({
      id: p.id,
      n: p.name,
      age: p.age,
      inc: p.income,
      role: p.role,
      co: p.company,
      pains: p.painPoints,
      motiv: p.motivations,
      trig: p.buyingTriggers,
      obj: p.objections,
      hang: p.whereTheyHangOut,
      cont: p.preferredContent,
    })),
    o: opportunities.map(o => ({
      id: o.id,
      t: o.title,
      plat: o.platform,
      aud: o.audience,
      niche: o.niche,
      score: o.qualityScore,
      diff: o.difficulty,
      reach: o.estimatedReach,
      terms: o.searchTerms,
      angle: o.messagingAngle,
      why: o.whyItFits,
    })),
  });
};

// ─── Layer 3: Claude Refinement Prompt ────────────────────────────────────────
// Receives the compressed draft. Refines only what needs human-quality language.
// Does NOT re-generate facts — only upgrades emotional resonance and strategy.

const buildClaudeRefinementPrompt = (
  profile: BusinessProfile,
  compressedDraft: string,
  fresh = false
): string => `
You are a senior growth strategist and world-class copywriter.
A data analyst produced the draft below. Your job is to REFINE the language and ADD the actionable intelligence fields.
Do not re-generate facts the analyst already produced (titles, scores, platforms, reach). Only upgrade language and ALWAYS generate the four actionable fields for every opportunity: specificGroupsRefined, searchQueriesRefined, whereToFindRefined, actionStepsRefined. These are NOT in the draft — you must create them from scratch using the opportunity context.

${fresh ? 'IMPORTANT: Fresh pass — find angles and insights not covered before.\n' : ''}

ANALYST DRAFT (compressed — key map: b=brief, p=personas, o=opportunities,
n=name, ind=industry, ot=offerType, pt=pricingTier, bt=buyerType, sc=salesCycle,
pain=primaryPain, plat=platforms, str=strengths, ang=angles, inc=income,
pains=painPoints, motiv=motivations, trig=buyingTriggers, obj=objections,
hang=whereTheyHangOut, cont=preferredContent, t=title, diff=difficulty,
reach=estimatedReach, terms=searchTerms, angle=messagingAngle, why=whyItFits):
${compressedDraft}

ORIGINAL CLIENT INPUTS (for voice/context):
Offer: ${profile.offer}
Pricing: ${profile.pricing}
Target Audience (their words): ${profile.targetAudience}
Revenue Goal: ${profile.revenueGoal}
Budget: ${profile.budget}

Return ONLY this JSON (no markdown):

{
  "icp": {
    "description": "2-3 vivid sentences on the single best customer — who pays fastest, stays longest, refers others",
    "demographics": {
      "ageRange": "specific range",
      "income": "specific income or revenue",
      "roles": ["3-5 exact job titles"],
      "companySize": "specific company size or life situation",
      "geography": "where they are and why it matters"
    },
    "psychographics": {
      "values": ["3-5 core values they hold"],
      "fears": ["3-5 specific fears this business's offer addresses"],
      "aspirations": ["3-5 specific aspirations"],
      "identity": "1 sentence on how they see themselves"
    },
    "behaviors": {
      "purchasingBehavior": "how and why they buy — impulse vs research, price sensitivity",
      "mediaConsumption": ["4-6 specific content channels"],
      "decisionProcess": "who influences their decision and how",
      "averageSalesCycle": "realistic estimate for this business"
    },
    "highValueSegments": ["2-3 high-value sub-segments with a reason each"]
  },
  "personaUpgrades": [
    {
      "id": "persona_1",
      "quote": "authentic first-person quote about their biggest problem — raw, not polished",
      "dayInLife": "1-2 sentences on their typical day and the specific moment this business's offer would help",
      "painPointsRefined": ["rewrite the analyst's pain points with emotional specificity — 4 items"],
      "buyingTriggersRefined": ["rewrite triggers with urgency and realism — 3 items"]
    }
  ],
  "opportunityUpgrades": [
    {
      "id": "opp_1",
      "messagingAngleRefined": "one sharp sentence tied to their specific situation and emotional trigger — what they're feeling RIGHT NOW that makes them ready to buy",
      "whyItFitsRefined": "2-3 sentences. Be specific: what life event or trigger makes this sub-group ready to buy today, and why this business is the right fit for them specifically",
      "conversionTip": "one highly specific, immediately actionable tactic — include the exact place, exact post/message type, and exact timing",
      "specificGroupsRefined": ["2 REAL groups — format: 'Group Name (platform)'. Use the business location. Only groups very likely to exist."],
      "searchQueriesRefined": ["2-3 hyper-local queries with city/zip. E.g. 'lawn mowing Southlake TX 76092'"],
      "whereToFindRefined": ["1 exact step — e.g. 'Open Nextdoor > Search lawn > reply to request posts'"],
      "actionStepsRefined": ["Step 1: exact action on specific platform", "Step 2: exactly what to say — give a short template", "Step 3: how to close — get number or book visit"]
    }
  ],
  "strategy": {
    "bestBuyer": "2-3 sentences on the single most valuable buyer type to target first and why they'll say yes",
    "whereToFindThem": ["3-4 specific channels with a tactical note each"],
    "whatToSay": ["3-4 specific hooks or messaging angles"],
    "firstSteps": ["4 ordered action items for the first 30 days"],
    "keyInsights": ["3-4 non-obvious insights specific to this business"],
    "competitiveEdge": "what makes this business uniquely positioned to win — be honest and specific",
    "contentIdeas": ["4-6 specific content ideas tailored to this audience"]
  }
}

RULES:
- Match persona IDs and opportunity IDs exactly to the analyst's draft
- Upgrade ALL personas and ALL opportunities — no skipping
- ALWAYS generate specificGroupsRefined, searchQueriesRefined, whereToFindRefined, and actionStepsRefined for EVERY opportunity — these are required fields
- Keep ALL text SHORT — max 1-2 sentences per field, max 3 items per array
- Every insight must be specific to this business — zero generic advice
- Use the business's exact location to name real local groups, neighborhoods, and communities
- Return ONLY valid JSON
`.trim();

// ─── Merge: Combine Gemini Draft + Claude Refinement ──────────────────────────

const mergeDraftAndRefinement = (
  draft: GeminiDraft,
  refinement: ClaudeRefinement
): Omit<AIAnalysis, 'id' | 'generatedAt'> => {
  const upgradeMap = new Map(
    refinement.personaUpgrades.map(u => [u.id, u])
  );
  const oppUpgradeMap = new Map(
    refinement.opportunityUpgrades.map(u => [u.id, u])
  );

  return {
    icp: {
      ...refinement.icp,
      matchScore: draft.brief.icpScore,
    },
    personas: draft.personas.map(p => {
      const upgrade = upgradeMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        age: p.age,
        income: p.income,
        role: p.role,
        company: p.company,
        painPoints: upgrade?.painPointsRefined ?? p.painPoints,
        motivations: p.motivations,
        buyingTriggers: upgrade?.buyingTriggersRefined ?? p.buyingTriggers,
        objections: p.objections,
        whereTheyHangOut: p.whereTheyHangOut,
        preferredContent: p.preferredContent,
        dayInLife: upgrade?.dayInLife ?? '',
        quote: upgrade?.quote ?? '',
      };
    }),
    opportunities: draft.opportunities.map(o => {
      const upgrade = oppUpgradeMap.get(o.id);
      return {
        id: o.id,
        title: o.title,
        platform: o.platform as LeadOpportunity['platform'],
        audience: o.audience,
        niche: o.niche,
        qualityScore: o.qualityScore,
        difficulty: o.difficulty,
        estimatedReach: o.estimatedReach,
        searchTerms: o.searchTerms,
        specificGroups: upgrade?.specificGroupsRefined ?? [],
        searchQueries: upgrade?.searchQueriesRefined ?? [],
        whereToFind: upgrade?.whereToFindRefined ?? [],
        actionSteps: upgrade?.actionStepsRefined ?? [],
        messagingAngle: upgrade?.messagingAngleRefined ?? o.messagingAngle,
        whyItFits: upgrade?.whyItFitsRefined ?? o.whyItFits,
        conversionTip: upgrade?.conversionTip ?? '',
      };
    }),
    strategy: refinement.strategy,
    overallConfidence: Math.min(draft.brief.icpScore + 8, 97),
    modelVersion: 'claude-sonnet-4-6 + gemini-2.5-flash-lite',
  };
};

// ─── Gemini-Only Output (low-score leads, score < 60) ─────────────────────────
// Builds a complete AIAnalysis from just the Gemini draft — no Claude cost.

const buildAnalysisFromDraftOnly = (
  draft: GeminiDraft
): Omit<AIAnalysis, 'id' | 'generatedAt'> => {
  const { brief: b } = draft;
  return {
    icp: {
      description: b.audienceSummary,
      demographics: {
        ageRange: 'Varies',
        income: 'Varies',
        roles: [],
        companySize: b.buyerType === 'B2B' ? 'Small to mid-size business' : 'Individual consumer',
        geography: b.geography,
      },
      psychographics: {
        values: [],
        fears: [],
        aspirations: [],
        identity: '',
      },
      behaviors: {
        purchasingBehavior: '',
        mediaConsumption: b.platformPriority,
        decisionProcess: '',
        averageSalesCycle: b.salesCycle,
      },
      highValueSegments: b.suggestedAngles,
      matchScore: b.icpScore,
    },
    personas: draft.personas.map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      income: p.income,
      role: p.role,
      company: p.company,
      painPoints: p.painPoints,
      motivations: p.motivations,
      buyingTriggers: p.buyingTriggers,
      objections: p.objections,
      whereTheyHangOut: p.whereTheyHangOut,
      preferredContent: p.preferredContent,
      dayInLife: '',
      quote: '',
    })),
    opportunities: draft.opportunities.map(o => ({
      id: o.id,
      title: o.title,
      platform: o.platform as LeadOpportunity['platform'],
      audience: o.audience,
      niche: o.niche,
      qualityScore: o.qualityScore,
      difficulty: o.difficulty,
      estimatedReach: o.estimatedReach,
      searchTerms: o.searchTerms,
      messagingAngle: o.messagingAngle,
      whyItFits: o.whyItFits,
      conversionTip: '',
      specificGroups: [],
      searchQueries: [],
      whereToFind: [],
      actionSteps: [],
    })),
    strategy: {
      bestBuyer: b.audienceSummary,
      whereToFindThem: b.platformPriority.map(p => `Focus on ${p}`),
      whatToSay: b.suggestedAngles,
      firstSteps: [
        'Refine your target audience definition',
        'Test messaging angles on the top platform',
        'Run analysis again with a more specific niche',
      ],
      keyInsights: b.keyGaps.concat(b.keyStrengths),
      competitiveEdge: b.keyStrengths[0] ?? '',
      contentIdeas: [],
    },
    overallConfidence: b.icpScore,
    modelVersion: 'gemini-2.5-flash-lite',
  };
};

// ─── Public API ────────────────────────────────────────────────────────────────

export const generateFullAnalysis = async (
  profile: BusinessProfile
): Promise<AIAnalysis> => {
  // ── Layer 1: Gemini generates everything rough ──
  console.log('[AI] Layer 1: Gemini drafting brief + personas + opportunities…');
  const rawDraft = await callGemini(buildGeminiDraftPrompt(profile), 5000);
  if (!rawDraft) return runClaudeSolo(profile);

  const draft = parseJSON<GeminiDraft>(rawDraft);
  if (!draft) return runClaudeSolo(profile);

  const icpScore = draft.brief.icpScore ?? 0;
  console.log(`[AI] ICP Score: ${icpScore} — sending to Claude for refinement…`);

  // ── Layer 3: Compress → Claude refinement (always runs) ──
  console.log('[AI] Compressing draft for Claude refinement…');
  const compressed = compressDraft(draft);
  const rawRefinement = await callClaude(buildClaudeRefinementPrompt(profile, compressed), 8000);
  if (!rawRefinement) throw new Error('Claude API call failed. Check your ANTHROPIC_API_KEY and account credits.');

  const refinement = parseJSON<ClaudeRefinement>(rawRefinement);
  if (!refinement) throw new Error('Claude response could not be parsed. Try again.');

  const merged = mergeDraftAndRefinement(draft, refinement);
  return { ...merged, id: `analysis_${Date.now()}`, generatedAt: new Date().toISOString() } as AIAnalysis;
};

export const regenerateAnalysis = async (
  profile: BusinessProfile
): Promise<AIAnalysis> => {
  console.log('[AI] Regenerating — Layer 1: Gemini fresh draft…');
  const rawDraft = await callGemini(buildGeminiDraftPrompt(profile), 5000);
  if (!rawDraft) return runClaudeSolo(profile, true);

  const draft = parseJSON<GeminiDraft>(rawDraft);
  if (!draft) return runClaudeSolo(profile, true);

  const compressed = compressDraft(draft);
  const rawRefinement = await callClaude(buildClaudeRefinementPrompt(profile, compressed, true), 8000);
  if (!rawRefinement) throw new Error('Claude API call failed. Check your ANTHROPIC_API_KEY and account credits.');

  const refinement = parseJSON<ClaudeRefinement>(rawRefinement);
  if (!refinement) throw new Error('Claude response could not be parsed. Try again.');

  const merged = mergeDraftAndRefinement(draft, refinement);
  return { ...merged, id: `analysis_${Date.now()}`, generatedAt: new Date().toISOString() } as AIAnalysis;
};

// Outreach — always Claude, always user-facing, always premium.
export const generateOutreach = async (
  profile: BusinessProfile,
  opportunity: LeadOpportunity,
  types: string[],
  tone: OutreachTone = 'professional'
): Promise<OutreachMessage[]> => {
  const prompt = buildOutreachPrompt(profile, opportunity, types, tone);
  const raw = await callClaude(prompt, 2048);
  if (!raw) throw new Error('AI service unavailable. Please try again.');

  const parsed = parseJSON<OutreachMessage[]>(raw);
  if (!parsed || !Array.isArray(parsed)) {
    throw new Error('Failed to generate outreach. Please try again.');
  }

  return parsed.map((msg, i) => ({
    ...msg,
    id: msg.id || `msg_${Date.now()}_${i}`,
    createdAt: new Date().toISOString(),
    characterCount: msg.content?.length ?? 0,
    tone,
    platform: opportunity.platform,
  }));
};

// ─── Claude Solo Fallback (when Gemini is unavailable) ────────────────────────

const runClaudeSolo = async (
  profile: BusinessProfile,
  fresh = false
): Promise<AIAnalysis> => {
  const prompt = buildClaudeSoloPrompt(profile, fresh);
  const raw = await callClaude(prompt, 8000);
  if (!raw) throw new Error('AI service unavailable. Check your API keys and try again.');

  const parsed = parseJSON<Omit<AIAnalysis, 'id' | 'generatedAt'>>(raw);
  if (!parsed) throw new Error('Analysis failed to parse. Please try again.');

  return { ...parsed, id: `analysis_${Date.now()}`, generatedAt: new Date().toISOString() } as AIAnalysis;
};

const buildClaudeSoloPrompt = (profile: BusinessProfile, fresh = false): string => `
You are a senior growth strategist. Produce a complete lead intelligence analysis for this business.
${fresh ? 'Fresh pass — find new angles.\n' : ''}

Business: ${profile.businessName} | ${profile.industry}
Offer: ${profile.offer} | Pricing: ${profile.pricing}
Revenue Goal: ${profile.revenueGoal}
Location: ${profile.location} ${profile.remoteOk ? '(Remote OK)' : ''}
Audience: ${profile.targetAudience}
Budget: ${profile.budget}
Platforms: ${profile.platforms.join(', ')}

Return ONLY valid JSON matching this exact structure:
{
  "icp": { "description": "", "demographics": { "ageRange": "", "income": "", "roles": [], "companySize": "", "geography": "" }, "psychographics": { "values": [], "fears": [], "aspirations": [], "identity": "" }, "behaviors": { "purchasingBehavior": "", "mediaConsumption": [], "decisionProcess": "", "averageSalesCycle": "" }, "highValueSegments": [], "matchScore": 85 },
  "personas": [{ "id": "persona_1", "name": "", "age": "", "income": "", "role": "", "company": "", "painPoints": [], "motivations": [], "buyingTriggers": [], "objections": [], "whereTheyHangOut": [], "preferredContent": [], "dayInLife": "", "quote": "" }],
  "opportunities": [{ "id": "opp_1", "title": "", "platform": "${profile.platforms[0] || 'LinkedIn'}", "audience": "", "niche": "", "qualityScore": 8, "difficulty": "easy", "estimatedReach": "", "searchTerms": [], "messagingAngle": "", "whyItFits": "", "conversionTip": "", "specificGroups": ["Group Name (platform) — why"], "searchQueries": ["hyper-local search phrase"], "whereToFind": ["exact step to find them"], "actionSteps": ["Step 1: exact action", "Step 2: what to say", "Step 3: handle response", "Step 4: close the deal"] }],
  "strategy": { "bestBuyer": "", "whereToFindThem": [], "whatToSay": [], "firstSteps": [], "keyInsights": [], "competitiveEdge": "", "contentIdeas": [] },
  "overallConfidence": 88,
  "modelVersion": "claude-sonnet-4-6"
}
Rules: 3-4 personas, 6-8 opportunities. Every opportunity must be a micro-niche with a specific life trigger — NOT a broad demographic. Use the business location to name real local groups, neighborhoods, and communities. Return ONLY valid JSON.
`.trim();

// ─── Outreach Prompt ───────────────────────────────────────────────────────────

const buildOutreachPrompt = (
  profile: BusinessProfile,
  opportunity: LeadOpportunity,
  types: string[],
  tone: OutreachTone
): string => `
You are a world-class direct-response copywriter.
You are writing messages that ${profile.businessName} will send to potential customers.
The goal: the recipient reads this and immediately understands WHO ${profile.businessName} is, WHAT they offer, and WHY it matters to them personally.

THE BUSINESS SENDING THIS:
Name: ${profile.businessName}
What they do: ${profile.offer}
Pricing: ${profile.pricing}
Location: ${profile.location}
Their target customer: ${profile.targetAudience}

THE PERSON RECEIVING THIS:
Audience: ${opportunity.audience}
Context/Niche: ${opportunity.niche}
Lead with this angle: ${opportunity.messagingAngle}
Platform: ${opportunity.platform}

Tone: ${tone}
Message types needed: ${types.join(', ')}

CRITICAL RULES:
- Reference specific details from the business's actual offer — not vague generalities
- Make the recipient feel like this message was written specifically for their situation
- The recipient should clearly understand what ${profile.businessName} does and what outcome they'll get
- Sound like a real local business owner reaching out — not a marketer or an AI
- Never say "I love your content", never use corporate buzzwords, never be generic
- Use the business's pricing/offer details naturally where it adds credibility

Return ONLY a JSON array:
[{ "id": "msg_1", "type": "dm", "content": "full message text", "tone": "${tone}", "platform": "${opportunity.platform}", "subjectLine": "for email type only, leave empty string for others", "hook": "the opening hook line", "callToAction": "specific CTA", "characterCount": 0 }]

dm: under 150 words, opens with their situation not your pitch, mention what you do naturally mid-message
email: subject line specific to their pain, body under 200 words, show what they get, one CTA
ad: hook calls out the exact person in first 5 words, 50-100 words, outcome-focused, clear CTA
offer: specific value stack using real details from the offer, exact outcome, removes risk, pricing if relevant
cta: one sentence, names the specific result they get

Return ONLY the JSON array. No markdown, no explanation.
`.trim();

export default { generateFullAnalysis, regenerateAnalysis, generateOutreach };
