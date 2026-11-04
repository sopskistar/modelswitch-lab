import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3004';
await mkdir('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(base);
await page.getByRole('radio', { name: /Support classification/ }).check();
await page
  .getByRole('combobox', { name: 'Test cases', exact: true })
  .selectOption(process.env.CAPTURE_CASES || '3');
await page.screenshot({
  path: 'docs/screenshots/desktop-light-workspace-live.png',
  fullPage: true,
});
await page.getByRole('button', { name: 'Switch to dark theme' }).click();
await page.screenshot({ path: 'docs/screenshots/desktop-dark-workspace-live.png', fullPage: true });
if (process.env.CAPTURE_COMPARE === 'true') {
  await page.getByRole('checkbox', { name: /Llama 3.3/ }).check();
}
const cases = [];
page.on('response', async (response) => {
  if (response.url().endsWith('/api/execute')) {
    try {
      const data = await response.json();
      cases.push({
        status: response.status(),
        result: data.result,
        analyst: data.analyst,
        error: data.error,
      });
    } catch {}
  }
});
await page.getByRole('button', { name: 'Run benchmark' }).click();
await page.getByRole('button', { name: 'Export JSON' }).waitFor();
await page.waitForFunction(
  () => JSON.parse(localStorage.getItem('msl-recent') || '{}').state !== 'running',
  {},
  { timeout: 180000 },
);
const run = await page.evaluate(() => JSON.parse(localStorage.getItem('msl-recent') || '{}'));
await page.screenshot({ path: 'docs/screenshots/desktop-results-live.png', fullPage: true });
await page.getByRole('link', { name: 'Request trace', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/desktop-trace-live.png', fullPage: true });
await page.getByRole('link', { name: 'Otari capabilities', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/desktop-capabilities-live.png', fullPage: true });
await page.setViewportSize({ width: 375, height: 812 });
await page.getByRole('link', { name: 'Results', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/mobile-results-live.png', fullPage: true });
await page.getByRole('link', { name: 'Request trace', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/mobile-trace-live.png', fullPage: true });
await page.goto(base);
await page.getByRole('button', { name: /Switch to .* theme/ }).waitFor();
await page.screenshot({ path: 'docs/screenshots/mobile-dark-workspace-live.png', fullPage: true });
await page.getByRole('button', { name: 'Switch to light theme' }).click();
await page.screenshot({ path: 'docs/screenshots/mobile-light-workspace-live.png', fullPage: true });
await writeFile(
  'evidence/browser-smoke.json',
  JSON.stringify(
    {
      at: new Date().toISOString(),
      base,
      errors,
      cases,
      run,
      notes: 'Unmocked production browser run. No synthetic model responses; receipts omitted.',
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Captured actual production screens. Browser errors:',
  errors.length,
  'execution responses:',
  cases.length,
);
await browser.close();
