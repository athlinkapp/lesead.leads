/**
 * Monitoring Service — scans Reddit and Craigslist for people who need the user's service.
 *
 * Pipeline:
 * 1. Gemini generates targeted search queries + Craigslist city subdomain
 * 2. Reddit JSON API + Craigslist RSS fetch recent posts
 * 3. Gemini scores each post — filters out business owners/competitors, keeps real customers
 * 4. Claude writes a personalized reply for posts scoring >= 60
 */

import type { BusinessProfile, BuyerIntent, LeadAlert, MonitorPost, MonitorScanResult } from '../types';
type PlanId = 'free' | 'starter' | 'pro' | 'scale';

// ─── AI helpers ───────────────────────────────────────────────────────────────

let anthropicClient: any = null;
let geminiClient: any = null;

const getAnthropic = () => {
  if (anthropicClient) return anthropicClient;
  const { default: Anthropic } = require('@anthropic-ai/sdk');
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'sk-ant-your-api-key-here') return null;
  anthropicClient = new Anthropic({ apiKey: key });
  return anthropicClient;
};

const getGemini = () => {
  if (geminiClient) return geminiClient;
  const { GoogleGenerativeAI } = require('@google/generative-ai');
  const key = process.env.GOOGLE_API_KEY;
  if (!key || key === 'your-google-api-key-here') return null;
  geminiClient = new GoogleGenerativeAI(key);
  return geminiClient;
};

const callGemini = async (prompt: string, maxTokens = 1000): Promise<string | null> => {
  const client = getGemini();
  if (!client) return null;
  try {
    const model = client.getGenerativeModel({
      model: 'gemini-2.5-flash-lite',
      generationConfig: { maxOutputTokens: maxTokens },
    });
    const result = await model.generateContent(prompt);
    return result.response.text() ?? null;
  } catch (e: any) {
    console.error('[Monitor] Gemini error:', e?.message);
    return null;
  }
};

const callClaude = async (prompt: string, maxTokens = 400): Promise<string | null> => {
  const client = getAnthropic();
  if (!client) return null;
  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    return response.content?.[0]?.text ?? null;
  } catch (e: any) {
    console.error('[Monitor] Claude error:', e?.message);
    return null;
  }
};

const parseJSON = <T>(text: string): T | null => {
  try {
    const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
};

// ─── Industry context helpers ─────────────────────────────────────────────────

const getIndustryQueryExamples = (industry: string, offer: string): string => {
  const i = industry.toLowerCase();
  const o = offer.toLowerCase();
  if (i.includes('landscap') || i.includes('lawn') || o.includes('lawn') || o.includes('mow'))
    return `"lawn overgrown can't keep up", "HOA warning grass", "yard out of control", "need yard help"`;
  if (i.includes('pressure') || o.includes('pressure wash') || o.includes('power wash'))
    return `"driveway covered in mold", "deck needs cleaning", "house dirty need washing", "pressure wash before selling"`;
  if (i.includes('window') || o.includes('window clean'))
    return `"windows filthy can't see through", "need window cleaning", "streaky windows annoying", "windows haven't been cleaned years"`;
  if (i.includes('pest') || o.includes('pest') || o.includes('extermina'))
    return `"roaches in kitchen", "ants everywhere can't get rid", "mice in house", "pest problem getting worse"`;
  if (i.includes('clean') || o.includes('house clean') || o.includes('maid') || o.includes('janitorial'))
    return `"house a mess no time to clean", "need cleaner recommendations", "cleaning service worth it", "overwhelmed with housework"`;
  if (i.includes('pool') || o.includes('pool'))
    return `"pool turning green", "algae in pool", "pool chemicals confusing", "pool maintenance too much"`;
  if (i.includes('paint') || o.includes('paint'))
    return `"house needs painting bad", "peeling paint embarrassing", "interior looks dingy", "need painter recommendation"`;
  if (i.includes('gutter') || o.includes('gutter'))
    return `"gutters clogged overflowing", "water damage from gutters", "leaves in gutters", "gutters falling off"`;
  if (i.includes('roof') || o.includes('roof'))
    return `"roof leaking after rain", "missing shingles storm", "roof damage insurance claim", "need roofer recommendation"`;
  if (i.includes('hvac') || i.includes('air condition') || o.includes('hvac') || o.includes('ac repair'))
    return `"ac not cooling", "hvac making noise", "air conditioner broke heat wave", "need hvac tech fast"`;
  if (i.includes('plumb') || o.includes('plumb'))
    return `"pipe leaking under sink", "water heater broken", "toilet won't stop running", "need plumber fast"`;
  if (i.includes('electr') || o.includes('electr'))
    return `"outlet not working", "breaker keeps tripping", "need electrician recommendation", "electrical issue scary"`;
  // Generic fallback
  return `"need ${offer} help", "can't find reliable ${industry}", "recommend ${industry} service", "frustrated with ${industry} problem"`;
};

const getIndustryValueContext = (industry: string, offer: string): string => {
  const i = industry.toLowerCase();
  const o = offer.toLowerCase();
  if (i.includes('landscap') || i.includes('lawn') || o.includes('lawn'))
    return 'mow only=$75-150, cleanup=$200-500, full landscaping=$500-2000, ongoing monthly=$150-300';
  if (i.includes('pressure') || o.includes('pressure wash'))
    return 'driveway=$150-300, house exterior=$300-700, deck=$200-400, full property=$500-1200';
  if (i.includes('window') || o.includes('window clean'))
    return 'small home=$100-200, large home=$200-400, commercial=$300-800, recurring monthly=$150-300';
  if (i.includes('pest') || o.includes('pest'))
    return 'one-time treatment=$150-350, quarterly plan=$100-200/visit, termite=$500-2000, rodent=$200-500';
  if (i.includes('clean') || o.includes('house clean'))
    return 'standard clean=$150-300, deep clean=$300-600, recurring weekly=$100-200, move-out=$300-600';
  if (i.includes('pool') || o.includes('pool'))
    return 'weekly service=$100-200/visit, green pool cleanup=$300-600, equipment repair=$200-800';
  if (i.includes('paint') || o.includes('paint'))
    return 'room=$300-800, interior whole home=$2000-6000, exterior=$2000-8000, deck=$500-1500';
  if (i.includes('gutter') || o.includes('gutter'))
    return 'cleaning=$100-250, repair=$150-400, full replacement=$1000-3000';
  if (i.includes('roof') || o.includes('roof'))
    return 'inspection=$150-300, repair=$300-1500, full replacement=$5000-20000';
  if (i.includes('hvac') || o.includes('hvac') || o.includes('ac'))
    return 'tune-up=$100-200, repair=$200-800, new unit install=$3000-8000, duct cleaning=$300-700';
  if (i.includes('plumb') || o.includes('plumb'))
    return 'small repair=$100-300, leak fix=$200-500, water heater=$800-2000, pipe replacement=$1000-5000';
  if (i.includes('electr') || o.includes('electr'))
    return 'outlet fix=$100-250, panel upgrade=$1500-4000, wiring=$500-2000, inspection=$150-300';
  return `small job=$100-300, standard job=$300-800, large job=$800-3000`;
};

// Returns role-only terms (no city) — city is added separately in the query builder
const getLinkedInSearches = (industry: string, offer: string): string[] => {
  const i = industry.toLowerCase();
  const o = offer.toLowerCase();
  if (i.includes('landscap') || i.includes('lawn') || o.includes('lawn') || o.includes('pressure') || o.includes('window clean') || o.includes('gutter'))
    return ['property manager', 'HOA manager', 'facilities manager'];
  if (i.includes('pest') || o.includes('pest'))
    return ['property manager', 'restaurant owner', 'office manager'];
  if (i.includes('clean') || o.includes('house clean') || o.includes('maid'))
    return ['property manager', 'airbnb host', 'office manager'];
  if (i.includes('pool') || o.includes('pool'))
    return ['property manager', 'HOA board member', 'community manager'];
  if (i.includes('paint') || i.includes('roof') || i.includes('hvac') || i.includes('plumb') || i.includes('electr'))
    return ['property manager', 'real estate investor', 'general contractor'];
  return ['property manager', 'office manager', 'facilities manager'];
};

// ─── Step 1: Build queries + Craigslist city ──────────────────────────────────

interface QueryPlan {
  queries: string[];
  localSubreddits: string[]; // e.g. ["Dallas", "FortWorth", "DFW", "Southlake"]
  craigslistCity: string;    // e.g. "dallas", "losangeles", "chicago"
}

const PLAN_SETTINGS: Record<PlanId, {
  includeLinkedIn: boolean;
  extraRedditQueries: number;
  extraCraigslistQueries: number;
  maxFallbackAlerts: number;
  postScoringCap: number;
  minRelevanceScore: number;
  maxLeadsPerScan: number;
  dailyScanLimit: number;
}> = {
  free: {
    includeLinkedIn: false,
    extraRedditQueries: 2,
    extraCraigslistQueries: 1,
    maxFallbackAlerts: 3,
    postScoringCap: 150,
    minRelevanceScore: 45,
    maxLeadsPerScan: 3,
    dailyScanLimit: 1,
  },
  starter: {
    includeLinkedIn: true,
    extraRedditQueries: 4,
    extraCraigslistQueries: 2,
    maxFallbackAlerts: 5,
    postScoringCap: 300,
    minRelevanceScore: 40,
    maxLeadsPerScan: 5,
    dailyScanLimit: 1,
  },
  pro: {
    includeLinkedIn: true,
    extraRedditQueries: 6,
    extraCraigslistQueries: 3,
    maxFallbackAlerts: 8,
    postScoringCap: 500,
    minRelevanceScore: 35,
    maxLeadsPerScan: 10,
    dailyScanLimit: 1,
  },
  scale: {
    includeLinkedIn: true,
    extraRedditQueries: 8,
    extraCraigslistQueries: 5,
    maxFallbackAlerts: 12,
    postScoringCap: 800,
    minRelevanceScore: 30,
    maxLeadsPerScan: 10,
    dailyScanLimit: 2,
  },
};

const DEFAULT_METRO_SUBREDDITS = [
  'smallbusiness',
  'homeowners',
  'HomeImprovement',
  'FirstTimeHomeBuyer',
  'RealEstate',
  'Apartmentliving',
];

function uniqueStrings(values: string[]): string[] {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }

  return unique;
}

function buildBroadIntentQueries(profile: BusinessProfile): string[] {
  const city = profile.location.split(',')[0].trim();
  const area = profile.serviceArea || profile.location;
  const offer = profile.offer.toLowerCase();
  const industry = profile.industry.toLowerCase();

  return uniqueStrings([
    `need ${offer} help`,
    `need ${industry} help`,
    `${offer} recommendation`,
    `${industry} recommendation`,
    `looking for ${offer}`,
    `looking for ${industry} service`,
    `who do you use for ${industry}`,
    `best ${industry} company`,
    `quote for ${offer}`,
    `need estimate for ${offer}`,
    `moved to ${city} need ${industry}`,
    `${area} ${industry} recommendation`,
  ]);
}

function combineQueries(baseQueries: string[], profile: BusinessProfile, planId: PlanId): string[] {
  const broadQueries = buildBroadIntentQueries(profile);
  const extra = PLAN_SETTINGS[planId].extraRedditQueries;
  return uniqueStrings([...baseQueries, ...broadQueries.slice(0, 4 + extra)]);
}

function combineSubreddits(localSubreddits: string[], profile: BusinessProfile, resolvedCities: string[] = []): string[] {
  const city = profile.location.split(',')[0].trim();
  const serviceAreaParts = resolvedCities.length > 0
    ? resolvedCities.slice(0, 15)
    : (profile.serviceArea || '')
        .split(/[\/,]/)
        .map((part: string) => part.trim())
        .filter((s: string) => s.length > 2 && !/^\d+\s*(mile|mi)/i.test(s));

  return uniqueStrings([
    ...localSubreddits,
    city,
    ...serviceAreaParts,
    ...DEFAULT_METRO_SUBREDDITS,
  ]);
}

// ─── Radius geocoding (OSM Nominatim + Overpass) ──────────────────────────────

function parseRadiusMiles(serviceArea: string): number | null {
  const match = serviceArea.match(/(\d+)\s*(?:mile|mi|miles)/i);
  return match ? parseInt(match[1]) : null;
}

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(location);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
      { headers: { 'User-Agent': 'LeSead/1.0 (lead-generation-app)' } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as any[];
    if (!data[0]) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch (e: any) {
    console.warn('[Monitor] Geocode error:', e?.message);
    return null;
  }
}

async function getCitiesInRadius(lat: number, lng: number, radiusMiles: number): Promise<string[]> {
  const radiusMeters = Math.round(radiusMiles * 1609.34);
  const query = `[out:json][timeout:15];(node["place"~"city|town|village|suburb"](around:${radiusMeters},${lat},${lng}););out body;`;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) return [];
    const data: any = await res.json();
    const seen = new Set<string>();
    const cities: string[] = [];
    for (const el of data?.elements ?? []) {
      const name: string = el.tags?.name ?? '';
      if (!name || name.length < 2 || seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      cities.push(name);
    }
    return cities.slice(0, 25);
  } catch (e: any) {
    console.warn('[Monitor] Overpass error:', e?.message);
    return [];
  }
}

async function resolveServiceAreaCities(profile: BusinessProfile): Promise<string[]> {
  const baseCityName = profile.location.split(',')[0].trim();
  const radiusMiles = parseRadiusMiles(profile.serviceArea ?? '');

  if (radiusMiles) {
    const coords = await geocodeLocation(profile.location);
    if (coords) {
      const cities = await getCitiesInRadius(coords.lat, coords.lng, radiusMiles);
      if (cities.length > 0) {
        console.log(`[Monitor] Radius ${radiusMiles}mi → ${cities.length} cities: ${cities.slice(0, 6).join(', ')}${cities.length > 6 ? '...' : ''}`);
        return cities;
      }
    }
  }

  // Fall back to explicit city list from serviceArea
  const explicit = (profile.serviceArea ?? '')
    .split(/[,\/]/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 2 && !/^\d+\s*(mile|mi)/i.test(s));

  return explicit.length > 0 ? explicit : [baseCityName];
}

const buildQueryPlan = async (profile: BusinessProfile): Promise<QueryPlan> => {
  const prompt = `
You are generating Reddit/Craigslist search queries to find LOCAL customers for a business.
A potential customer is anyone who has a PROBLEM that this business solves, near the business location.

Business:
- Offer: ${profile.offer}
- Industry: ${profile.industry}
- Location: ${profile.location}
- Service area: ${profile.serviceArea || profile.location}
- Target audience: ${profile.targetAudience}

Generate:
1. 4 problem-focused search queries (short, no location needed — we search local subreddits directly)
   GOOD examples: ${getIndustryQueryExamples(profile.industry, profile.offer)}
   BAD: buying equipment, product reviews, running a business

2. 3-5 local subreddits for the area (subreddit name only, no r/ prefix)
   For "Southlake, TX" serving DFW: ["Dallas", "FortWorth", "DFW", "Southlake", "TarrantCounty"]
   For "Chicago, IL": ["chicago", "ChicagoSuburbs", "Chicagoland"]
   Include subreddits for every city/suburb in the service area, plus the main metro subreddit.

3. Craigslist city subdomain

Return ONLY this JSON (no markdown):
{
  "queries": ["4 problem-focused queries, no location"],
  "localSubreddits": ["SubredditName1", "SubredditName2"],
  "craigslistCity": "closest craigslist subdomain"
}
`.trim();

  const raw = await callGemini(prompt, 500);
  if (raw) {
    const parsed = parseJSON<QueryPlan>(raw);
    if (parsed?.queries?.length && parsed?.craigslistCity) {
      return {
        ...parsed,
        localSubreddits: parsed.localSubreddits ?? [],
      };
    }
  }

  // Fallback
  const city = profile.location.split(',')[0].trim();
  const citySlug = city.toLowerCase().replace(/\s+/g, '');
  const state = (profile.location.split(',')[1] ?? '').trim();
  const industry = profile.industry.toLowerCase();
  return {
    queries: [
      `need ${industry} help`,
      `looking for ${industry} service`,
      `recommend ${industry} near me`,
      `${industry} overwhelmed can't keep up`,
      `${profile.offer} recommendation`,
      `who do you use for ${industry}`,
    ],
    localSubreddits: [city, citySlug, state, 'Dallas', 'FortWorth', 'DFW'].filter(Boolean),
    craigslistCity: citySlug,
  };
};

// ─── Recency filter (tightens on depth 1, loosens on depth 3) ─────────────────

const MAX_AGE_BY_DEPTH: Record<number, number> = { 1: 14, 2: 21, 3: 30 };
const minCreatedUtc = (scanDepth: 1 | 2 | 3) =>
  Math.floor(Date.now() / 1000) - (MAX_AGE_BY_DEPTH[scanDepth] ?? 5) * 86400;

// ─── Step 2a: Fetch Reddit posts ──────────────────────────────────────────────

const fetchRedditPosts = async (
  queries: string[],
  localSubreddits: string[],
  scanDepth: 1 | 2 | 3 = 1,
  planId: PlanId = 'free'
): Promise<MonitorPost[]> => {
  const seen = new Set<string>();
  const posts: MonitorPost[] = [];
  const cutoff = minCreatedUtc(scanDepth);
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
  };

  const addPost = (p: any, community?: string) => {
    if (!p?.id || seen.has(p.id) || !p.title) return;
    if (p.selftext === '[deleted]' || p.selftext === '[removed]') return;
    if ((p.created_utc ?? 0) < cutoff) return;
    seen.add(p.id);
    const body = p.selftext?.length > 10 ? p.selftext.slice(0, 800) : p.title;
    posts.push({
      id: `reddit_${p.id}`,
      source: 'reddit',
      community: community ?? `r/${p.subreddit}`,
      title: p.title,
      body,
      url: `https://reddit.com${p.permalink}`,
      author: p.author ?? 'unknown',
      createdUtc: p.created_utc ?? 0,
    });
  };

  // Strategy 1: Browse /new on local subreddits
  // Depth 1 = first 2 (tightest local), Depth 2 = first 4, Depth 3 = all
  const subLimit =
    scanDepth === 1
      ? Math.min(localSubreddits.length, 4 + PLAN_SETTINGS[planId].extraRedditQueries)
      : scanDepth === 2
      ? Math.min(localSubreddits.length, 7 + PLAN_SETTINGS[planId].extraRedditQueries)
      : localSubreddits.length;
  for (const sub of localSubreddits.slice(0, subLimit)) {
    try {
      const url = `https://www.reddit.com/r/${sub}/new.json?limit=50`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data: any = await res.json();
        for (const child of data?.data?.children ?? []) addPost(child?.data, `r/${sub}`);
      } else {
        console.warn(`[Monitor] Reddit r/${sub} browse: ${res.status}`);
      }
      await new Promise(r => setTimeout(r, 200));
    } catch (e: any) {
      console.warn(`[Monitor] Reddit r/${sub} error:`, e?.message);
    }
  }

  // Strategy 2: Global search
  // Depth 1 = 1 query (most specific), Depth 2 = 2 queries, Depth 3 = all 4
  const queryLimit =
    scanDepth === 1
      ? Math.min(queries.length, 3 + PLAN_SETTINGS[planId].extraRedditQueries)
      : scanDepth === 2
      ? Math.min(queries.length, 5 + PLAN_SETTINGS[planId].extraRedditQueries)
      : queries.length;
  const timeRange = scanDepth === 1 ? 'month' : 'year';
  for (const kw of queries.slice(0, queryLimit)) {
    try {
      const encoded = encodeURIComponent(kw);
      const url = `https://www.reddit.com/search.json?q=${encoded}&sort=new&limit=50&t=${timeRange}`;
      const res = await fetch(url, { headers });
      if (res.ok) {
        const data: any = await res.json();
        for (const child of data?.data?.children ?? []) addPost(child?.data);
      } else {
        console.warn(`[Monitor] Reddit global search: ${res.status}`);
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn(`[Monitor] Reddit global error:`, e?.message);
    }
  }

  console.log(`[Monitor] Reddit: ${posts.length} posts`);
  return posts;
};

// ─── Step 2b: Find property managers on LinkedIn via Serper.dev ───────────────
//
// Serper proxies Google search — site:linkedin.com/in/ queries return real
// LinkedIn profile cards (name, title, snippet, URL) without any auth.
// Free tier: 2,500 queries/month. Each scan uses up to 3 queries.
// Requires SERPER_API_KEY in .env (serper.dev → sign up → copy key).

const fetchLinkedInViaSerper = async (
  profile: BusinessProfile
): Promise<MonitorPost[]> => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const city = profile.location.split(',')[0].trim();
  // Build a location clause that covers the main city + any service area cities
  const extraCities = (profile.serviceArea ?? '')
    .split(/[,\/]/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 2 && s.toLowerCase() !== city.toLowerCase())
    .slice(0, 2);
  const locationClause = [city, ...extraCities]
    .map((c: string) => `"${c}"`)
    .join(' OR ');

  const roles = getLinkedInSearches(profile.industry, profile.offer);
  const posts: MonitorPost[] = [];
  const seen = new Set<string>();

  for (const role of roles) {
    try {
      const query = `site:linkedin.com/in/ "${role}" (${locationClause})`;
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ q: query, num: 10 }),
      });

      if (!res.ok) {
        console.warn('[Monitor] Serper error:', res.status);
        break;
      }

      const data: any = await res.json();
      const items: any[] = data?.organic ?? [];

      for (const item of items) {
        const profileUrl: string = item.link ?? '';
        if (!profileUrl.includes('linkedin.com/in/') || seen.has(profileUrl)) continue;
        seen.add(profileUrl);

        // Serper titles: "Name - Title - Location | LinkedIn"
        const rawTitle: string = (item.title ?? '')
          .replace(/\s*\|\s*LinkedIn.*$/i, '')
          .replace(/\s*-\s*LinkedIn$/i, '')
          .trim();
        const parts = rawTitle.split(/\s*[-–]\s*/);
        const name = parts[0]?.trim() ?? '';
        const resolvedRole = parts.slice(1).join(' — ').trim() || role;

        if (!name || name.length < 3 || name.toLowerCase() === 'linkedin') continue;

        const snippet: string = item.snippet ?? '';

        posts.push({
          id: `linkedin_${Buffer.from(profileUrl).toString('base64').slice(0, 24)}`,
          source: 'linkedin',
          community: 'LinkedIn',
          title: `${name} — ${resolvedRole}`.slice(0, 200),
          body: `${name} is a ${resolvedRole} in the ${city} area. ${snippet.slice(0, 250)} They may manage properties or businesses that need ${profile.offer}.`,
          url: profileUrl,
          author: name,
          createdUtc: Math.floor(Date.now() / 1000) - 3600,
        });
      }

      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn('[Monitor] Serper LinkedIn error:', e?.message);
    }
  }

  console.log(`[Monitor] LinkedIn (Serper): ${posts.length} profiles found`);
  return posts;
};

// ─── Step 2b-2: Fetch Facebook Groups + Nextdoor posts via Serper ─────────────
//
// Google indexes public Facebook group posts and some Nextdoor posts.
// We run targeted queries for the business's service area and industry.

const getFacebookNextdoorQueries = (profile: BusinessProfile, resolvedCities: string[] = []): string[] => {
  const city = profile.location.split(',')[0].trim();
  const industry = profile.industry.toLowerCase();
  const offer = profile.offer.toLowerCase();

  const cities = resolvedCities.length > 0
    ? resolvedCities.slice(0, 8)
    : (() => {
        const areaParts = (profile.serviceArea ?? '')
          .split(/[,\/]/)
          .map((s: string) => s.trim())
          .filter((s: string) => s.length > 2)
          .slice(0, 3);
        return [city, ...areaParts];
      })();

  const locationOr = [...new Set([city, ...cities])].slice(0, 8).map((c: string) => `"${c}"`).join(' OR ');

  return [
    // High-intent: asking for recommendations
    `(${locationOr}) ("need ${industry}" OR "looking for ${industry}" OR "recommend ${industry}" OR "anyone know a good ${industry}")`,
    // Urgent problem signals
    `(${locationOr}) ("${offer}" OR "${industry}") ("help" OR "urgent" OR "ASAP" OR "overgrown" OR "HOA")`,
    // Explicit hiring signals
    `(${locationOr}) ("hire" OR "quote" OR "estimate" OR "price") "${industry}"`,
  ];
};

const fetchFacebookViaSerper = async (
  profile: BusinessProfile,
  resolvedCities: string[] = []
): Promise<MonitorPost[]> => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const posts: MonitorPost[] = [];
  const seen = new Set<string>();
  const intentQueries = getFacebookNextdoorQueries(profile, resolvedCities);

  for (const intentQuery of intentQueries) {
    try {
      const query = `site:facebook.com/groups ${intentQuery}`;
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 10, tbs: 'qdr:w' }), // past week
      });
      if (!res.ok) { console.warn('[Monitor] Serper FB error:', res.status); continue; }

      const data: any = await res.json();
      for (const item of data?.organic ?? []) {
        const url: string = item.link ?? '';
        if (!url.includes('facebook.com/groups') || seen.has(url)) continue;
        seen.add(url);

        const title: string = (item.title ?? '').replace(/\s*[\|\-]\s*Facebook.*$/i, '').trim();
        const snippet: string = item.snippet ?? '';
        if (!title || title.length < 5) continue;

        posts.push({
          id: `fb_${Buffer.from(url).toString('base64').slice(0, 24)}`,
          source: 'facebook',
          community: 'Facebook Groups',
          title: title.slice(0, 200),
          body: snippet.slice(0, 500) || title,
          url,
          author: 'Facebook user',
          createdUtc: Math.floor(Date.now() / 1000) - 3600,
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn('[Monitor] Serper Facebook error:', e?.message);
    }
  }

  console.log(`[Monitor] Facebook Groups (Serper): ${posts.length} posts found`);
  return posts;
};

const fetchNextdoorViaSerper = async (
  profile: BusinessProfile,
  resolvedCities: string[] = []
): Promise<MonitorPost[]> => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const posts: MonitorPost[] = [];
  const seen = new Set<string>();
  const intentQueries = getFacebookNextdoorQueries(profile, resolvedCities);

  for (const intentQuery of intentQueries) {
    try {
      const query = `site:nextdoor.com ${intentQuery}`;
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 10, tbs: 'qdr:m' }), // past month
      });
      if (!res.ok) { console.warn('[Monitor] Serper ND error:', res.status); continue; }

      const data: any = await res.json();
      for (const item of data?.organic ?? []) {
        const url: string = item.link ?? '';
        if (!url.includes('nextdoor.com') || seen.has(url)) continue;
        seen.add(url);

        const title: string = (item.title ?? '').replace(/\s*[\|\-]\s*Nextdoor.*$/i, '').trim();
        const snippet: string = item.snippet ?? '';
        if (!title || title.length < 5) continue;

        posts.push({
          id: `nd_${Buffer.from(url).toString('base64').slice(0, 24)}`,
          source: 'nextdoor',
          community: 'Nextdoor',
          title: title.slice(0, 200),
          body: snippet.slice(0, 500) || title,
          url,
          author: 'Nextdoor neighbor',
          createdUtc: Math.floor(Date.now() / 1000) - 7200,
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn('[Monitor] Serper Nextdoor error:', e?.message);
    }
  }

  console.log(`[Monitor] Nextdoor (Serper): ${posts.length} posts found`);
  return posts;
};

const fetchInstagramViaSerper = async (
  profile: BusinessProfile,
  resolvedCities: string[] = []
): Promise<MonitorPost[]> => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const posts: MonitorPost[] = [];
  const seen = new Set<string>();
  const intentQueries = getFacebookNextdoorQueries(profile, resolvedCities);

  for (const intentQuery of intentQueries) {
    try {
      const query = `site:instagram.com ${intentQuery}`;
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 10, tbs: 'qdr:m' }), // past month
      });
      if (!res.ok) { console.warn('[Monitor] Serper IG error:', res.status); continue; }

      const data: any = await res.json();
      for (const item of data?.organic ?? []) {
        const url: string = item.link ?? '';
        if (!url.includes('instagram.com') || seen.has(url)) continue;
        seen.add(url);

        const title: string = (item.title ?? '').replace(/\s*[\|\-]\s*(Instagram|on Instagram).*$/i, '').trim();
        const snippet: string = item.snippet ?? '';
        if (!title || title.length < 5) continue;

        posts.push({
          id: `ig_${Buffer.from(url).toString('base64').slice(0, 24)}`,
          source: 'instagram',
          community: 'Instagram',
          title: title.slice(0, 200),
          body: snippet.slice(0, 500) || title,
          url,
          author: 'Instagram user',
          createdUtc: Math.floor(Date.now() / 1000) - 3600,
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn('[Monitor] Serper Instagram error:', e?.message);
    }
  }

  console.log(`[Monitor] Instagram (Serper): ${posts.length} posts found`);
  return posts;
};

const fetchXViaSerper = async (
  profile: BusinessProfile,
  resolvedCities: string[] = []
): Promise<MonitorPost[]> => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const posts: MonitorPost[] = [];
  const seen = new Set<string>();
  const intentQueries = getFacebookNextdoorQueries(profile, resolvedCities);

  for (const intentQuery of intentQueries) {
    try {
      const query = `(site:twitter.com OR site:x.com) ${intentQuery}`;
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 10, tbs: 'qdr:w' }), // past week
      });
      if (!res.ok) { console.warn('[Monitor] Serper X error:', res.status); continue; }

      const data: any = await res.json();
      for (const item of data?.organic ?? []) {
        const url: string = item.link ?? '';
        if ((!url.includes('twitter.com') && !url.includes('x.com')) || seen.has(url)) continue;
        seen.add(url);

        const title: string = (item.title ?? '').replace(/\s*[\|\-]\s*(Twitter|X).*$/i, '').trim();
        const snippet: string = item.snippet ?? '';
        if (!title || title.length < 5) continue;

        posts.push({
          id: `x_${Buffer.from(url).toString('base64').slice(0, 24)}`,
          source: 'twitter',
          community: 'X (Twitter)',
          title: title.slice(0, 200),
          body: snippet.slice(0, 500) || title,
          url,
          author: 'X user',
          createdUtc: Math.floor(Date.now() / 1000) - 3600,
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn('[Monitor] Serper X error:', e?.message);
    }
  }

  console.log(`[Monitor] X/Twitter (Serper): ${posts.length} posts found`);
  return posts;
};

const fetchZillowViaSerper = async (
  profile: BusinessProfile,
  resolvedCities: string[] = []
): Promise<MonitorPost[]> => {
  const apiKey = process.env.SERPER_API_KEY;
  if (!apiKey) return [];

  const city = profile.location.split(',')[0].trim();
  const cities = resolvedCities.length > 0 ? resolvedCities.slice(0, 6) : [city];
  const locationOr = [...new Set([city, ...cities])].slice(0, 6).map((c: string) => `"${c}"`).join(' OR ');

  const queries = [
    // Recently sold — homeowners who just transacted, likely need services
    `site:zillow.com/homedetails (${locationOr}) "sold"`,
    // New listings — people about to move in
    `site:zillow.com/homedetails (${locationOr}) "for sale"`,
    // Recently listed in the last month
    `site:zillow.com (${locationOr}) "just listed" OR "new listing"`,
  ];

  const posts: MonitorPost[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    try {
      const res = await fetch('https://google.serper.dev/search', {
        method: 'POST',
        headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: query, num: 10, tbs: 'qdr:m' }), // past month
      });
      if (!res.ok) { console.warn('[Monitor] Serper Zillow error:', res.status); continue; }

      const data: any = await res.json();
      for (const item of data?.organic ?? []) {
        const url: string = item.link ?? '';
        if (!url.includes('zillow.com') || seen.has(url)) continue;
        seen.add(url);

        const title: string = (item.title ?? '').replace(/\s*[\|\-]\s*Zillow.*$/i, '').trim();
        const snippet: string = item.snippet ?? '';
        if (!title || title.length < 5) continue;

        // Extract address from title if possible for community label
        const addressMatch = title.match(/^([\d].*?)(?:,|\s+-\s+|$)/);
        const address = addressMatch ? addressMatch[1].trim() : title.slice(0, 40);

        posts.push({
          id: `zl_${Buffer.from(url).toString('base64').slice(0, 24)}`,
          source: 'zillow',
          community: 'Zillow',
          title: title.slice(0, 200),
          body: snippet.slice(0, 500) || `Property listing in your service area: ${address}. Homeowners who recently bought or listed may need ${profile.industry.toLowerCase()} services.`,
          url,
          author: 'Zillow listing',
          createdUtc: Math.floor(Date.now() / 1000) - 3600,
        });
      }
      await new Promise(r => setTimeout(r, 300));
    } catch (e: any) {
      console.warn('[Monitor] Serper Zillow error:', e?.message);
    }
  }

  console.log(`[Monitor] Zillow (Serper): ${posts.length} listings found`);
  return posts;
};

// ─── Step 2c: Fetch Craigslist posts (HTML) ───────────────────────────────────

const parseCraigslistHTML = (html: string, city: string): MonitorPost[] => {
  const posts: MonitorPost[] = [];
  const itemRegex = /<li[^>]*class="[^"]*cl-static-search-result[^"]*"[^>]*title="([^"]*)"[^>]*>[\s\S]*?<a[^>]+href="(https?:\/\/[^"]+\.html)"[\s\S]*?<\/li>/g;
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    const title = match[1].trim();
    const url = match[2].trim();
    if (!title || !url) continue;
    const id = url.split('/').pop()?.replace('.html', '') ?? `${Date.now()}`;
    posts.push({
      id: `craigslist_${id}`,
      source: 'craigslist',
      community: `${city} craigslist`,
      title,
      body: title,
      url,
      author: 'craigslist poster',
      createdUtc: Math.floor(Date.now() / 1000) - 3600, // CL listings are recent by default
    });
  }
  return posts;
};

const fetchCraigslistPosts = async (
  queries: string[],
  city: string,
  planId: PlanId = 'free'
): Promise<MonitorPost[]> => {
  const seen = new Set<string>();
  const posts: MonitorPost[] = [];
  const categories = ['sss', 'sgd'];
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
  };

  const queryCount = Math.min(queries.length, 3 + PLAN_SETTINGS[planId].extraCraigslistQueries);
  for (const query of queries.slice(0, queryCount)) {
    for (const cat of categories) {
      try {
        const encoded = encodeURIComponent(query);
        const url = `https://${city}.craigslist.org/search/${cat}?query=${encoded}&sort=date`;
        const res = await fetch(url, { headers });
        if (!res.ok) { console.warn(`[Monitor] Craigslist ${res.status} (${cat})`); continue; }
        const html = await res.text();
        const parsed = parseCraigslistHTML(html, city);
        for (const post of parsed) {
          if (seen.has(post.id)) continue;
          seen.add(post.id);
          posts.push(post);
        }
        await new Promise(r => setTimeout(r, 400));
      } catch (e: any) {
        console.warn(`[Monitor] Craigslist error (${cat}):`, e?.message);
      }
    }
  }

  console.log(`[Monitor] Craigslist: ${posts.length} posts`);
  return posts;
};

// ─── Step 3: Batch score posts for relevance ──────────────────────────────────

interface PostScore {
  id: string;
  relevanceScore: number;
  matchReason: string;
  buyerIntent: BuyerIntent;
  estimatedValueLow: number;
  estimatedValueHigh: number;
}

const scorePostsBatch = async (
  posts: MonitorPost[],
  profile: BusinessProfile
): Promise<PostScore[]> => {
  const postsJson = posts.map(p => ({
    id: p.id,
    title: p.title.slice(0, 120),
    body: p.body.slice(0, 200),
  }));

  const prompt = `
You are scoring social media posts to find customers for: ${profile.offer} in ${profile.location}

For each post return a relevanceScore and buyerIntent:

relevanceScore (0-100) — weight URGENCY heavily:
- 80-100: Urgent problem right now, asking for help immediately, HOA deadline, just moved and overwhelmed, expressed frustration about current situation
- 60-79: Clear need, actively seeking a solution or recommendations
- 40-59: Has the problem but passive about it, no urgency signals
- 0-39: Buying equipment themselves, running a business, unrelated, general tips

buyerIntent — pick one:
- "ready_to_buy": urgent problem, time pressure, asking who to hire, HOA warning, "need this done ASAP"
- "actively_looking": researching options, asking for recommendations, comparing prices, knows they need help
- "just_browsing": venting, curious, no clear intent to hire, informational

estimatedValueLow and estimatedValueHigh — realistic dollar range for ONE job based on what they described:
- Reference values for this business type: ${getIndustryValueContext(profile.industry, profile.offer)}
- Read their post carefully and pick the most appropriate range based on job size, urgency, and property type
- Keep ranges tight and realistic for a local ${profile.industry} business in ${profile.location}

Posts:
${JSON.stringify(postsJson)}

Return ONLY a JSON array (no markdown):
[{"id":"post_id","relevanceScore":85,"matchReason":"one sentence: their specific problem","buyerIntent":"ready_to_buy","estimatedValueLow":150,"estimatedValueHigh":400}]
`.trim();

  const raw = await callGemini(prompt, posts.length * 80);
  if (!raw) return [];

  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];

  try {
    return JSON.parse(arrayMatch[0]) as PostScore[];
  } catch {
    return [];
  }
};

// ─── Step 4: Generate reply + strategy ───────────────────────────────────────

interface ReplyAndStrategy {
  reply: string;
  strategy: string;
}

const generateReplyAndStrategy = async (
  post: MonitorPost,
  profile: BusinessProfile
): Promise<ReplyAndStrategy> => {
  const isLinkedIn = post.community === 'LinkedIn';
  const platform = post.source === 'craigslist' ? 'Craigslist' : isLinkedIn ? 'LinkedIn' : 'Reddit';
  const fallbackReply = `Hey, I run ${profile.businessName} in ${profile.location} — we specialize in ${profile.offer}. Sounds like something we could help with. Happy to chat if you're still looking, just shoot me a message!`;

  const prompt = `
You are a sales coach helping "${profile.businessName}" convert a social media lead.

Business:
- Name: ${profile.businessName}
- Offer: ${profile.offer}
- Pricing: ${profile.pricing}
- Location: ${profile.location}
- What makes them stand out: ${profile.differentiators || 'reliable local service'}
- Target customers: ${profile.targetAudience}

${isLinkedIn ? 'LinkedIn outreach to a local business decision-maker:' : `${platform} post:`}
Title: "${post.title}"
Body: "${post.body.slice(0, 300)}"

Return ONLY this JSON (no markdown):
{
  "reply": "The actual reply message to send. Under 90 words. Sounds like a real local business owner. References something specific from their post. Mentions business name, what you do, pricing if relevant. Soft CTA. No emojis, no corporate speak.",
  "strategy": "One punchy sentence on HOW to approach this lead: timing, tone, and the #1 thing to mention. Example: 'Reply within 20 min, keep it friendly, lead with HOA compliance and offer a same-week estimate.'"
}
`.trim();

  const raw = await callClaude(prompt, 400);
  if (!raw) return { reply: fallbackReply, strategy: 'Respond quickly with a friendly tone and a clear offer.' };

  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      reply: parsed.reply ?? fallbackReply,
      strategy: parsed.strategy ?? 'Respond quickly with a friendly tone and a clear offer.',
    };
  } catch {
    return { reply: raw.slice(0, 400), strategy: 'Respond quickly with a friendly tone and a clear offer.' };
  }
};

// ─── Fallback alerts ──────────────────────────────────────────────────────────

const buildFallbackAlerts = (
  profile: BusinessProfile,
  scannedAt: string,
  planId: PlanId
): LeadAlert[] => {
  const city = profile.location.split(',')[0].trim() || 'your area';
  const offer = profile.offer || profile.industry.toLowerCase();
  const industry = profile.industry.toLowerCase();
  const lowerOffer = offer.toLowerCase();

  const landscapingAngles = [
    {
      title: `Demo lead: homeowner in ${city} asking for help after HOA grass warning`,
      body: `Fallback lead generated because no live posts were found. This simulates a common ${industry} request: a homeowner needs fast help with an overgrown yard after receiving an HOA notice.`,
      reason: 'Common urgent landscaping trigger with a clear time deadline.',
      low: 150,
      high: 450,
      reply: `Hey, I run ${profile.businessName} in ${city}. We help homeowners get yards back under control quickly, especially for HOA situations. If you still need help, I can take a look and give you a fast estimate.`,
      strategy: 'Lead with speed and HOA compliance, and offer a same-week estimate.',
    },
    {
      title: `Demo lead: recent ${city} homebuyer looking for regular lawn service`,
      body: `Fallback lead generated because no live posts were found. This simulates a new homeowner asking for reliable recurring lawn care after moving into the area.`,
      reason: 'New homeowners often convert well into recurring service customers.',
      low: 120,
      high: 300,
      reply: `Hey, I’m with ${profile.businessName} here in ${city}. We help new homeowners get set up with reliable ongoing lawn care so you don’t have to worry about it. Happy to send over pricing if you’re still looking.`,
      strategy: 'Keep it welcoming and recurring-service focused rather than pushing a one-time cleanup.',
    },
    {
      title: `Demo lead: property manager in ${city} asking for cleanup before showings`,
      body: `Fallback lead generated because no live posts were found. This simulates a local property manager needing quick outdoor cleanup before upcoming tenant tours or home showings.`,
      reason: 'Property managers are high-value repeat buyers for exterior service work.',
      low: 250,
      high: 700,
      reply: `Hi, I run ${profile.businessName} in ${city}. We handle fast exterior cleanup and curb-appeal work for listings and rentals. If you need a crew this week, I’d be glad to help.`,
      strategy: 'Position the offer around speed, reliability, and listing-ready curb appeal.',
    },
  ];

  const genericAngles = [
    {
      title: `Demo lead: ${city} resident asking for ${lowerOffer} recommendations`,
      body: `Fallback lead generated because no live posts were found. This simulates a local resident asking neighbors who they trust for ${lowerOffer}.`,
      reason: 'Recommendation-style posts are warm because the person already knows they need help.',
      low: 150,
      high: 400,
      reply: `Hey, I run ${profile.businessName} in ${city}. We specialize in ${offer} and would be happy to help if you’re still comparing options. I can send pricing or answer any questions.`,
      strategy: 'Keep the first touch low-pressure and make it easy for them to compare you quickly.',
    },
    {
      title: `Demo lead: ${city} homeowner dealing with an urgent ${industry} problem`,
      body: `Fallback lead generated because no live posts were found. This simulates an urgent local request tied to the kind of problem ${profile.businessName} solves.`,
      reason: 'Urgent household pain points usually outperform generic awareness leads.',
      low: 200,
      high: 600,
      reply: `Hey, this is ${profile.businessName} in ${city}. We help with exactly this kind of issue all the time and can usually move quickly. If you still need help, I can get you a quote.`,
      strategy: 'Lead with reassurance and speed so the customer feels the problem can be resolved quickly.',
    },
  ];

  const templates =
    industry.includes('landscap') || industry.includes('lawn') || lowerOffer.includes('lawn')
      ? landscapingAngles
      : genericAngles;

  return templates
    .slice(0, PLAN_SETTINGS[planId].maxFallbackAlerts)
    .map((template, index) => ({
    id: `fallback_alert_${index + 1}`,
    post: {
      id: `fallback_post_${index + 1}`,
      source: 'reddit',
      community: 'Demo fallback lead',
      title: template.title,
      body: template.body,
      url: '',
      author: 'system',
      createdUtc: Math.floor(Date.now() / 1000) - index * 3600,
    },
    matchReason: `${template.reason} No live posts matched during this scan, so LeSead is showing a fallback example.`,
    relevanceScore: 62 - index * 4,
    buyerIntent: index === 0 ? 'ready_to_buy' : 'actively_looking',
    estimatedValueLow: template.low,
    estimatedValueHigh: template.high,
    suggestedReply: template.reply,
    responseStrategy: template.strategy,
    status: 'new',
    scannedAt,
  }));
};

// ─── Public API ───────────────────────────────────────────────────────────────

export const runMonitoringScan = async (
  profile: BusinessProfile,
  scanDepth: 1 | 2 | 3 = 1,
  planId: PlanId = 'free'
): Promise<MonitorScanResult> => {
  const scannedAt = new Date().toISOString();
  const planSettings = PLAN_SETTINGS[planId];

  console.log(`[Monitor] Scan depth: ${scanDepth} | Age limit: ${MAX_AGE_BY_DEPTH[scanDepth]}d | Post cap: ${scanDepth === 1 ? 100 : scanDepth === 2 ? 150 : 200}`);
  console.log('[Monitor] Building query plan…');
  const { queries: plannedQueries, localSubreddits, craigslistCity } = await buildQueryPlan(profile);
  console.log('[Monitor] Resolving service area cities…');
  const resolvedCities = await resolveServiceAreaCities(profile);

  const queries = combineQueries(plannedQueries, profile, planId);
  const subredditTargets = combineSubreddits(localSubreddits, profile, resolvedCities);
  console.log('[Monitor] Queries:', queries, '| Subreddits:', subredditTargets, '| Craigslist city:', craigslistCity, '| Plan:', planId);

  console.log('[Monitor] Fetching Reddit + Craigslist + LinkedIn + Facebook + Nextdoor + Instagram + X + Zillow posts…');
  const [redditPosts, craigslistPosts, linkedInPosts, facebookPosts, nextdoorPosts, instagramPosts, xPosts, zillowPosts] = await Promise.all([
    fetchRedditPosts(queries, subredditTargets, scanDepth, planId),
    fetchCraigslistPosts(queries, craigslistCity, planId),
    planSettings.includeLinkedIn ? fetchLinkedInViaSerper(profile) : Promise.resolve([]),
    fetchFacebookViaSerper(profile, resolvedCities),
    fetchNextdoorViaSerper(profile, resolvedCities),
    fetchInstagramViaSerper(profile, resolvedCities),
    fetchXViaSerper(profile, resolvedCities),
    fetchZillowViaSerper(profile, resolvedCities),
  ]);

  const allPosts = [...redditPosts, ...craigslistPosts, ...linkedInPosts, ...facebookPosts, ...nextdoorPosts, ...instagramPosts, ...xPosts, ...zillowPosts];
  console.log(`[Monitor] ${redditPosts.length} Reddit + ${craigslistPosts.length} Craigslist + ${linkedInPosts.length} LinkedIn + ${facebookPosts.length} Facebook + ${nextdoorPosts.length} Nextdoor + ${instagramPosts.length} Instagram + ${xPosts.length} X + ${zillowPosts.length} Zillow = ${allPosts.length} total posts`);

  if (allPosts.length === 0) {
    return { alerts: [], scannedAt, queriesRun: queries, totalPostsChecked: 0 };
  }

  // Cap posts — use per-plan postScoringCap; scale slightly by scanDepth
  const baseCap = planSettings.postScoringCap;
  const postCap = scanDepth === 1 ? Math.round(baseCap * 0.6) : scanDepth === 2 ? Math.round(baseCap * 0.8) : baseCap;
  const cappedPosts = allPosts.slice(0, postCap);
  console.log(`[Monitor] Scoring ${cappedPosts.length} posts in batches…`);

  const BATCH_SIZE = 15;
  const scoreMap = new Map<string, PostScore>();

  for (let i = 0; i < cappedPosts.length; i += BATCH_SIZE) {
    const batch = cappedPosts.slice(i, i + BATCH_SIZE);
    const scores = await scorePostsBatch(batch, profile);
    for (const s of scores) scoreMap.set(s.id, s);
  }

  // Filter to qualifying posts and generate replies in parallel (max 5 at once)
  const qualifying = cappedPosts.filter(p => {
    const s = scoreMap.get(p.id);
    return s && s.relevanceScore >= planSettings.minRelevanceScore;
  });

  console.log(`[Monitor] ${qualifying.length} qualifying posts — generating replies…`);

  const REPLY_CONCURRENCY = 5;
  const alertsWithReplies: LeadAlert[] = [];

  for (let i = 0; i < qualifying.length; i += REPLY_CONCURRENCY) {
    const chunk = qualifying.slice(i, i + REPLY_CONCURRENCY);
    const results = await Promise.all(chunk.map(p => generateReplyAndStrategy(p, profile)));
    chunk.forEach((post, idx) => {
      const scored = scoreMap.get(post.id)!;
      alertsWithReplies.push({
        id: `alert_${post.id}`,
        post,
        matchReason: scored.matchReason,
        relevanceScore: scored.relevanceScore,
        buyerIntent: scored.buyerIntent ?? 'actively_looking',
        estimatedValueLow: scored.estimatedValueLow ?? 100,
        estimatedValueHigh: scored.estimatedValueHigh ?? 300,
        suggestedReply: results[idx].reply,
        responseStrategy: results[idx].strategy,
        status: 'new',
        scannedAt,
      });
    });
  }

  const alerts = alertsWithReplies;
  alerts.sort((a, b) => b.post.createdUtc - a.post.createdUtc);
  const cappedAlerts = alerts.slice(0, planSettings.maxLeadsPerScan);
  console.log(`[Monitor] Found ${alerts.length} leads, returning ${cappedAlerts.length} (plan cap: ${planSettings.maxLeadsPerScan})`);

  return { alerts: cappedAlerts, scannedAt, queriesRun: queries, totalPostsChecked: cappedPosts.length };
};
