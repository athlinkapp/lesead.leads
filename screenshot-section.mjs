import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });
await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
await new Promise(r => setTimeout(r, 500));

// Scroll through to trigger observers
const h = await page.evaluate(() => document.body.scrollHeight);
for (let y = 0; y < h; y += 400) {
  await page.evaluate(v => window.scrollTo(0, v), y);
  await new Promise(r => setTimeout(r, 50));
}
await page.evaluate(() => window.scrollTo(0, 0));
await new Promise(r => setTimeout(r, 200));

// Screenshot each viewport-height chunk
const chunks = Math.ceil(h / 900);
for (let i = 0; i < chunks; i++) {
  await page.evaluate(v => window.scrollTo(0, v), i * 900);
  await new Promise(r => setTimeout(r, 100));
  await page.screenshot({ path: `temporary screenshots/chunk-${i}.png` });
}

console.log(`Saved ${chunks} chunks (0..${chunks-1})`);
await browser.close();
