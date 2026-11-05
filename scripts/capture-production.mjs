import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3004';
const evidencePath = process.env.CAPTURE_EVIDENCE_PATH || 'evidence/browser-smoke.json';
const replay = process.env.CAPTURE_REPLAY_EVIDENCE
  ? JSON.parse(await readFile(process.env.CAPTURE_REPLAY_EVIDENCE, 'utf8'))
  : null;
await mkdir('docs/screenshots', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
if (replay?.run)
  await page.addInitScript(
    (run) => localStorage.setItem('msl-recent', JSON.stringify(run)),
    replay.run,
  );
await page.goto(base);
await page.getByRole('checkbox', { name: /Qwen/ }).waitFor();
const views = page.getByRole('navigation', { name: 'Workbench views' });
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
const cases = replay?.cases ?? [];
page.on('response', async (response) => {
  if (!replay && response.url().endsWith('/api/execute')) {
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
let run;
if (replay?.run) {
  run = replay.run;
  await views.getByRole('link', { name: 'Results', exact: true }).click();
} else {
  await page.getByRole('button', { name: 'Run benchmark' }).click();
  await page.getByRole('button', { name: 'Export JSON' }).waitFor();
  await page.waitForFunction(
    () => JSON.parse(localStorage.getItem('msl-recent') || '{}').state !== 'running',
    {},
    { timeout: 180000 },
  );
  run = await page.evaluate(() => JSON.parse(localStorage.getItem('msl-recent') || '{}'));
}
const saveEvidence = () =>
  writeFile(
    evidencePath,
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
if (!replay) await saveEvidence();
await page.screenshot({ path: 'docs/screenshots/desktop-results-live.png', fullPage: true });
await views.getByRole('link', { name: 'Request trace', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/desktop-trace-live.png', fullPage: true });
await views.getByRole('link', { name: 'Otari capabilities', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/desktop-capabilities-live.png', fullPage: true });
await page.setViewportSize({ width: 375, height: 812 });
await views.getByRole('link', { name: 'Results', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/mobile-results-live.png', fullPage: true });
await views.getByRole('link', { name: 'Request trace', exact: true }).click();
await page.screenshot({ path: 'docs/screenshots/mobile-trace-live.png', fullPage: true });
await page.goto(base);
await page.getByRole('button', { name: /Switch to .* theme/ }).waitFor();
await page.screenshot({ path: 'docs/screenshots/mobile-dark-workspace-live.png', fullPage: true });
await page.getByRole('button', { name: 'Switch to light theme' }).click();
await page.screenshot({ path: 'docs/screenshots/mobile-light-workspace-live.png', fullPage: true });
if (!replay) await saveEvidence();
console.log(
  replay
    ? 'Replayed recorded Otari run for screenshots. Browser errors:'
    : 'Captured actual production screens. Browser errors:',
  errors.length,
  replay ? 'stored gateway responses:' : 'live gateway responses:',
  cases.length,
);
await browser.close();
