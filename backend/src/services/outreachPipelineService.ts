/**
 * Outreach Pipeline Service
 *
 * Pipeline:
 * 1. Pull recent home sales from ATTOM Property API (sale/snapshot by zip)
 * 2. Filter by home value ($400k+) and sale date (last 90 days)
 * 3. Score by seasonality (spring = lawn/mulch, fall = leaf removal, etc.)
 * 4. Enrich with Apollo People Match to find emails
 * 5. Claude writes hyper-local personalized email per homeowner
 * 6. Resend delivers the email with CAN-SPAM compliant footer
 */

import type { BusinessProfile } from '../types';
import Anthropic from '@anthropic-ai/sdk';
import { Resend } from 'resend';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PropertyRecord {
  id: string;
  ownerFirstName: string;
  ownerLastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  homeValue: number;
  saleDateUtc: string; // ISO
  bedrooms?: number;
  lotSizeSqft?: number;
}

export interface EnrichedLead extends PropertyRecord {
  email: string | null;
  apolloPersonId: string | null;
  seasonalityScore: number;  // 0-100
  homeValueScore: number;    // 0-100
  totalScore: number;        // 0-100 composite
  emailDraft: string | null;
  emailSubject: string | null;
  status: 'pending' | 'sent' | 'skipped_no_email' | 'skipped_low_score';
}

export interface PipelineResult {
  propertiesFound: number;
  enriched: number;
  emailsSent: number;
  skippedNoEmail: number;
  skippedLowScore: number;
  leads: EnrichedLead[];
  ranAt: string;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

const getAnthropic = () => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  return new Anthropic({ apiKey: key });
};

const getResend = () => {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not set');
  return new Resend(key);
};

// ─── Step 1: Pull property records via ATTOM API ─────────────────────────────
// Uses ATTOM /sale/snapshot — real home sales by zip code
// Filters: sold in last 90 days, $400k+ home value

const ATTOM_BASE = 'https://api.gateway.attomdata.com/propertyapi/v1.0.0';

// Southlake + nearby premium DFW zips
const TARGET_ZIPS = [
  '76092', // Southlake
  '76034', // Colleyville
  '76051', // Grapevine
  '75022', // Flower Mound
  '75028', // Flower Mound
  '76248', // Keller
  '76262', // Roanoke/Trophy Club
  '75077', // Lantana
];

const getDateRange = () => {
  const now = new Date();
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { start: fmt(ninetyDaysAgo), end: fmt(now) };
};

const fetchAttomSalesByZip = async (
  zip: string,
  minHomeValue: number,
  apiKey: string
): Promise<PropertyRecord[]> => {
  const { start, end } = getDateRange();
  const params = new URLSearchParams({
    postalcode: zip,
    startsalesearchdate: start,
    endsalesearchdate: end,
    minsaleamt: String(minHomeValue),
    pagesize: '50',
  });

  const url = `${ATTOM_BASE}/sale/snapshot?${params}`;
  const res = await fetch(url, {
    headers: {
      apikey: apiKey,
      accept: 'application/json',
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.warn(`[Pipeline] ATTOM ${res.status} for zip ${zip}:`, errText.slice(0, 200));
    return [];
  }

  const data: any = await res.json();
  const properties: any[] = data?.property ?? [];

  return properties
    .filter((p: any) => p?.address?.line1 && p?.sale?.amount?.saleamt > 0)
    .map((p: any) => {
      const addr = p.address ?? {};
      const sale = p.sale ?? {};
      const saleAmt = sale?.amount?.saleamt ?? 0;
      const saleDate = sale?.saleTransDate ?? new Date().toISOString();

      return {
        id: String(p.identifier?.attomId ?? `attom_${Math.random().toString(36).slice(2)}`),
        ownerFirstName: 'Homeowner',
        ownerLastName: '',
        address: toTitleCase(addr.line1 ?? ''),
        city: toTitleCase(addr.locality ?? ''),
        state: addr.countrySubd ?? 'TX',
        zip: addr.postal1 ?? zip,
        homeValue: saleAmt,
        saleDateUtc: new Date(saleDate).toISOString(),
        bedrooms: p.building?.rooms?.beds ?? undefined,
        lotSizeSqft: p.lot?.lotSize1 ? Math.round(p.lot.lotSize1 * 43560) : undefined,
      } as PropertyRecord;
    });
};

const toTitleCase = (str: string) =>
  str.replace(/\w\S*/g, t => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());

export const fetchRecentHomeSales = async (
  location: string,
  minHomeValue = 400000
): Promise<PropertyRecord[]> => {
  console.log('[Pipeline] Fetching recent home sales via ATTOM…');

  const apiKey = process.env.ATTOM_API_KEY;
  if (!apiKey) {
    console.warn('[Pipeline] ATTOM_API_KEY not set — using demo records');
    return generateDemoRecords(location, minHomeValue);
  }

  const records: PropertyRecord[] = [];
  const seen = new Set<string>();

  for (const zip of TARGET_ZIPS) {
    try {
      const zipRecords = await fetchAttomSalesByZip(zip, minHomeValue, apiKey);
      for (const r of zipRecords) {
        if (!seen.has(r.id)) {
          seen.add(r.id);
          records.push(r);
        }
      }
      console.log(`[Pipeline] ATTOM zip ${zip}: ${zipRecords.length} sales`);
      await new Promise(r => setTimeout(r, 200)); // rate limit
    } catch (e: any) {
      console.warn(`[Pipeline] ATTOM error for zip ${zip}:`, e?.message);
    }
  }

  if (records.length === 0) {
    console.log('[Pipeline] ATTOM returned 0 — using demo records');
    return generateDemoRecords(location, minHomeValue);
  }

  console.log(`[Pipeline] ATTOM total: ${records.length} properties across ${TARGET_ZIPS.length} zips`);
  return records;
};

// Demo records used when county API is unavailable — realistic enough to test pipeline
const generateDemoRecords = (location: string, minValue: number): PropertyRecord[] => {
  const city = location.split(',')[0].trim();
  const baseDate = new Date();
  baseDate.setDate(baseDate.getDate() - 21);

  return [
    {
      id: 'demo_1',
      ownerFirstName: 'James',
      ownerLastName: 'Hartwell',
      address: '412 Emerald Falls Dr',
      city,
      state: 'TX',
      zip: '76092',
      homeValue: 875000,
      saleDateUtc: baseDate.toISOString(),
    },
    {
      id: 'demo_2',
      ownerFirstName: 'Sarah',
      ownerLastName: 'Pemberton',
      address: '1803 Timarron Blvd',
      city,
      state: 'TX',
      zip: '76092',
      homeValue: 620000,
      saleDateUtc: new Date(baseDate.getTime() - 7 * 86400000).toISOString(),
    },
    {
      id: 'demo_3',
      ownerFirstName: 'Michael',
      ownerLastName: 'Torres',
      address: '908 Vintage Dr',
      city,
      state: 'TX',
      zip: '76034',
      homeValue: 520000,
      saleDateUtc: new Date(baseDate.getTime() - 14 * 86400000).toISOString(),
    },
  ];
};

// ─── Step 2: Score by home value + seasonality ────────────────────────────────

const getSeasonalityScore = (profile: BusinessProfile): { score: number; angle: string } => {
  const month = new Date().getMonth() + 1; // 1-12

  // Spring (Mar-May): lawn startup, mulch, cleanup
  if (month >= 3 && month <= 5) return { score: 95, angle: 'spring lawn startup and mulch installation' };
  // Summer (Jun-Aug): regular mowing, drought protection
  if (month >= 6 && month <= 8) return { score: 80, angle: 'weekly mowing and summer lawn care' };
  // Fall (Sep-Nov): leaf removal, aeration, overseeding
  if (month >= 9 && month <= 11) return { score: 90, angle: 'fall leaf removal and lawn aeration' };
  // Winter (Dec-Feb): planning, cleanup, early spring prep
  return { score: 60, angle: 'early spring lawn prep and cleanup' };
};

const scoreHomeValue = (value: number): number => {
  if (value >= 1000000) return 100;
  if (value >= 700000) return 90;
  if (value >= 500000) return 80;
  if (value >= 400000) return 70;
  return 50;
};

// ─── Step 3: Apollo People Match (email enrichment) ──────────────────────────

const apolloEnrich = async (
  firstName: string,
  lastName: string,
  city: string,
  state: string
): Promise<{ email: string | null; personId: string | null }> => {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return { email: null, personId: null };

  try {
    const res = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        city,
        state,
        reveal_personal_emails: true,
      }),
    });

    if (!res.ok) {
      console.warn(`[Pipeline] Apollo ${res.status} for ${firstName} ${lastName}`);
      return { email: null, personId: null };
    }

    const data: any = await res.json();
    const person = data?.person;
    const email = person?.email ?? person?.personal_emails?.[0] ?? null;

    return { email, personId: person?.id ?? null };
  } catch (e: any) {
    console.warn('[Pipeline] Apollo error:', e?.message);
    return { email: null, personId: null };
  }
};

// ─── Step 4: Claude writes hyper-local email ─────────────────────────────────

const generateEmail = async (
  lead: PropertyRecord,
  profile: BusinessProfile,
  seasonalAngle: string
): Promise<{ subject: string; body: string } | null> => {
  const client = getAnthropic();
  const daysAgo = Math.floor(
    (Date.now() - new Date(lead.saleDateUtc).getTime()) / 86400000
  );

  const prompt = `
You are writing a cold outreach email FROM "${profile.businessName}" TO a new homeowner.
This email should feel like a local neighbor reaching out — warm, specific, not salesy.

SENDER (your business):
- Name: ${profile.businessName}
- Service: ${profile.offer}
- Pricing: ${profile.pricing}
- Location: ${profile.location}

RECIPIENT (new homeowner):
- Name: ${lead.ownerFirstName} ${lead.ownerLastName}
- Address: ${lead.address}, ${lead.city}, ${lead.state}
- Home value: $${lead.homeValue.toLocaleString()}
- Moved in: approximately ${daysAgo} days ago
- Seasonal opportunity: ${seasonalAngle}

Write a short, genuine email that:
1. References their specific address or neighborhood (not generic)
2. Mentions they recently moved in (feels personal, not mass blast)
3. Connects the seasonal timing to why NOW is the right time
4. Offers a free quote — no pressure, no commitment
5. Sounds like a real local business owner, not a marketer
6. Under 120 words in the body

Return ONLY this JSON (no markdown):
{
  "subject": "short subject line referencing their address or move-in",
  "body": "full email body — no salutation or sign-off, just the body paragraphs"
}
`.trim();

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });
    const block = response.content?.[0];
    const raw = block?.type === 'text' ? block.text : '';
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleaned);
  } catch (e: any) {
    console.warn('[Pipeline] Claude email error:', e?.message);
    return null;
  }
};

// ─── Step 5: Send email via Resend ───────────────────────────────────────────

const sendEmail = async (
  to: string,
  subject: string,
  body: string,
  profile: BusinessProfile,
  fromEmail: string
): Promise<boolean> => {
  const resend = getResend();

  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a1a1a; line-height: 1.7;">
      <p>Hi ${body.split('\n')[0].includes('Hi') ? '' : ''},</p>
      ${body.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('')}
      <p style="margin-top: 24px;">— ${profile.businessName}</p>
      <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 11px; color: #999; margin-top: 8px;">
        You received this because your property at this address was recently listed in public county records.
        <a href="mailto:${fromEmail}?subject=Unsubscribe" style="color: #999;">Unsubscribe</a>
      </p>
    </div>
  `;

  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });
    console.log('[Pipeline] Email sent to', to, '| ID:', result.data?.id);
    return true;
  } catch (e: any) {
    console.warn('[Pipeline] Resend error for', to, ':', e?.message);
    return false;
  }
};

// ─── Audience Builder (for Facebook Custom Audiences) ─────────────────────────
// Runs steps 1 & 2 only — no Apollo, no email. Returns scored homeowner list.

export interface AudienceResult {
  propertiesFound: number;
  leads: Array<PropertyRecord & {
    seasonalityScore: number;
    homeValueScore: number;
    totalScore: number;
    seasonalAngle: string;
  }>;
  ranAt: string;
}

export const buildAudienceList = async (
  profile: BusinessProfile,
  minHomeValue = 400000
): Promise<AudienceResult> => {
  const ranAt = new Date().toISOString();
  const { score: seasonScore, angle: seasonAngle } = getSeasonalityScore(profile);

  const properties = await fetchRecentHomeSales(profile.location, minHomeValue);
  console.log(`[Audience] ${properties.length} properties found`);

  const leads = properties.map(prop => ({
    ...prop,
    seasonalityScore: seasonScore,
    homeValueScore: scoreHomeValue(prop.homeValue),
    totalScore: Math.round((scoreHomeValue(prop.homeValue) * 0.4) + (seasonScore * 0.6)),
    seasonalAngle: seasonAngle,
  })).sort((a, b) => b.totalScore - a.totalScore);

  return { propertiesFound: properties.length, leads, ranAt };
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface PipelineOptions {
  minHomeValue?: number;
  minTotalScore?: number;
  maxEmailsToSend?: number;
  fromEmail: string;      // verified Resend sender email
  dryRun?: boolean;       // if true, generate emails but don't send
}

export const runOutreachPipeline = async (
  profile: BusinessProfile,
  options: PipelineOptions
): Promise<PipelineResult> => {
  const {
    minHomeValue = 400000,
    minTotalScore = 60,
    maxEmailsToSend = 20,
    fromEmail,
    dryRun = false,
  } = options;

  const ranAt = new Date().toISOString();
  const { score: seasonScore, angle: seasonAngle } = getSeasonalityScore(profile);

  // Step 1: property records
  const properties = await fetchRecentHomeSales(profile.location, minHomeValue);
  console.log(`[Pipeline] ${properties.length} properties found`);

  const leads: EnrichedLead[] = [];
  let emailsSent = 0;

  for (const prop of properties) {
    if (emailsSent >= maxEmailsToSend) break;

    const hvScore = scoreHomeValue(prop.homeValue);
    const totalScore = Math.round((hvScore * 0.4) + (seasonScore * 0.6));

    if (totalScore < minTotalScore) {
      leads.push({ ...prop, email: null, apolloPersonId: null, seasonalityScore: seasonScore, homeValueScore: hvScore, totalScore, emailDraft: null, emailSubject: null, status: 'skipped_low_score' });
      continue;
    }

    // Step 2: Apollo enrichment
    console.log(`[Pipeline] Enriching ${prop.ownerFirstName} ${prop.ownerLastName}…`);
    const { email, personId } = await apolloEnrich(prop.ownerFirstName, prop.ownerLastName, prop.city, prop.state);

    await new Promise(r => setTimeout(r, 300)); // rate limit

    if (!email) {
      leads.push({ ...prop, email: null, apolloPersonId: personId, seasonalityScore: seasonScore, homeValueScore: hvScore, totalScore, emailDraft: null, emailSubject: null, status: 'skipped_no_email' });
      continue;
    }

    // Step 3: Claude generates email
    console.log(`[Pipeline] Generating email for ${email}…`);
    const generated = await generateEmail(prop, profile, seasonAngle);

    if (!generated) {
      leads.push({ ...prop, email, apolloPersonId: personId, seasonalityScore: seasonScore, homeValueScore: hvScore, totalScore, emailDraft: null, emailSubject: null, status: 'skipped_no_email' });
      continue;
    }

    // Step 4: Send
    let sent = false;
    if (!dryRun) {
      sent = await sendEmail(email, generated.subject, generated.body, profile, fromEmail);
    } else {
      sent = true; // dry run counts as "would send"
    }

    if (sent) emailsSent++;

    leads.push({
      ...prop,
      email,
      apolloPersonId: personId,
      seasonalityScore: seasonScore,
      homeValueScore: hvScore,
      totalScore,
      emailDraft: generated.body,
      emailSubject: generated.subject,
      status: 'sent',
    });
  }

  const result: PipelineResult = {
    propertiesFound: properties.length,
    enriched: leads.filter(l => l.email).length,
    emailsSent: dryRun ? 0 : emailsSent,
    skippedNoEmail: leads.filter(l => l.status === 'skipped_no_email').length,
    skippedLowScore: leads.filter(l => l.status === 'skipped_low_score').length,
    leads,
    ranAt,
  };

  console.log(`[Pipeline] Done — ${result.emailsSent} sent, ${result.skippedNoEmail} no email, ${result.skippedLowScore} low score`);
  return result;
};
