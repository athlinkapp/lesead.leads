import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, 'temporary screenshots');
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const existing = fs.readdirSync(dir).filter(f => f.endsWith('.png'));
const nums = existing.map(f => parseInt(f.match(/screenshot-(\d+)/)?.[1] || '0')).filter(Boolean);
let next = nums.length ? Math.max(...nums) + 1 : 1;

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// Inject mock auth + app state so we bypass the auth guard
await page.goto('http://localhost:3004/auth', { waitUntil: 'networkidle0' });
await page.evaluate(() => {
  const authState = {
    state: {
      user: { id: 'demo-user-123', email: 'demo@lesead.com' },
      idToken: 'mock-token',
      refreshToken: 'mock-refresh',
      isHydrated: true,
    },
    version: 0,
  };
  const appState = {
    state: {
      isOnboarded: true,
      planId: 'pro',
      businessProfile: {
        id: 'bp-1', businessName: 'Apex Roofing Co.', industry: 'Roofing',
        offer: 'Residential roof replacement and repair', pricing: '$8,000–$25,000',
        revenueGoal: '$500k/year', location: 'Denver, CO', serviceArea: '50 mile radius',
        remoteOk: false, targetAudience: 'Homeowners 35–65 with storm damage or aging roofs',
        differentiators: '5-year labor warranty, same-week estimates',
        goals: ['More leads', 'Better outreach'],
        budget: '$2k-5k', platforms: ['Google', 'Facebook', 'Cold Email'],
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      },
      monitorResults: {
        alerts: [
          {
            id: 'a1', matchReason: 'Homeowner asking for roofer after storm damage',
            relevanceScore: 88, buyerIntent: 'ready_to_buy',
            estimatedValueLow: 8000, estimatedValueHigh: 18000,
            suggestedReply: 'Hi! We do storm damage assessments free — can fit you in this week.',
            responseStrategy: 'Lead with free estimate offer, mention warranty',
            status: 'new', scannedAt: new Date().toISOString(),
            post: { id: 'p1', source: 'reddit', community: 'r/Denver',
              title: 'Anyone know a good roofer after the hailstorm last week?',
              body: 'My roof took a beating, need someone ASAP', url: 'https://reddit.com/r/Denver',
              author: 'homeowner_dave', createdUtc: Date.now() / 1000 },
          },
          {
            id: 'a2', matchReason: 'Urgent roof leak in service area',
            relevanceScore: 74, buyerIntent: 'actively_looking',
            estimatedValueLow: 4000, estimatedValueHigh: 12000,
            suggestedReply: 'We can send someone out today for a free look.',
            responseStrategy: 'Urgency play, same-day response',
            status: 'new', scannedAt: new Date().toISOString(),
            post: { id: 'p2', source: 'craigslist', community: 'Denver Services',
              title: 'Roof leaking bad — need roofer today',
              body: 'Water coming in through the ceiling, urgent', url: 'https://craigslist.org',
              author: 'poster', createdUtc: Date.now() / 1000 },
          },
        ],
        scannedAt: new Date().toISOString(), queriesRun: ['roofing denver', 'roof repair near me'], totalPostsChecked: 143,
      },
      savedLeads: [
        {
          id: 'sl1', alertId: 'a1', stage: 'contacted', estimatedValue: 14000,
          savedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
          notes: [{ id: 'n1', text: 'Called Tuesday, sending estimate Thursday', createdAt: new Date().toISOString() }],
          alert: {
            id: 'a1', matchReason: 'Storm damage lead',
            relevanceScore: 88, buyerIntent: 'ready_to_buy',
            estimatedValueLow: 8000, estimatedValueHigh: 18000,
            suggestedReply: '', responseStrategy: '', status: 'replied',
            scannedAt: new Date().toISOString(),
            post: { id: 'p1', source: 'reddit', community: 'r/Denver',
              title: 'Anyone know a good roofer after the hailstorm last week?',
              body: '', url: '', author: 'homeowner_dave', createdUtc: Date.now() / 1000 },
          },
        },
      ],
      stripeCustomerId: null,
    },
    version: 0,
  };
  localStorage.setItem('lesead-auth', JSON.stringify(authState));
  localStorage.setItem('lesead-app', JSON.stringify(appState));
});

const pages = [
  ['dashboard', '/dashboard'],
  ['monitor', '/monitor'],
  ['pipeline', '/pipeline'],
  ['pricing', '/pricing'],
  ['settings', '/settings'],
  ['analysis', '/analysis'],
  ['outreach', '/outreach'],
  ['audience', '/audience'],
  ['opportunities', '/opportunities'],
];

for (const [label, route] of pages) {
  await page.goto(`http://localhost:3004${route}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));
  const filename = `screenshot-${next++}-${label}.png`;
  await page.screenshot({ path: path.join(dir, filename) });
  console.log(`Saved: temporary screenshots/${filename}`);
}

await browser.close();
