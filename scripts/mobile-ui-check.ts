import { chromium, expect as baseExpect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { destinations, fitsViewport, navigateView, noPageOverflow } from '../e2e/navigation';

// Read-only hosted UI verification. No catalog, inference, or evidence response
// is replaced with a fixture. Block execution defensively and record attempts.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://modelswitch-lab.vercel.app';
const expect = baseExpect.configure({ timeout: 15000 });
const browser = await chromium.launch({ headless: true });
const report = {
  checkedAt: new Date().toISOString(),
  baseURL,
  scope: 'Read-only rendered UI and committed evidence; no new hosted inference',
  interceptedExecutionAttempts: 0,
  transportRetries: [] as { width: number; reason: string }[],
  checks: [] as { width: number; route: string; axeViolations: number | null }[],
  evidence: [] as { file: string; status: number }[],
};
await mkdir('docs/screenshots', { recursive: true });
class HostedNetworkChange extends Error {}
async function auditWidth(width: number) {
  const context = await browser.newContext({
    viewport: { width, height: 900 },
    isMobile: width < 768,
    hasTouch: width < 768,
    colorScheme: 'dark',
  });
  const page = await context.newPage();
  await page.route('**/api/execute', (route) => {
    report.interceptedExecutionAttempts++;
    return route.abort('blockedbyclient');
  });
  let networkChanged = false;
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText === 'net::ERR_NETWORK_CHANGED') networkChanged = true;
  });
  const checkCount = report.checks.length;
  const evidenceCount = report.evidence.length;
  try {
    const screenshots = width === 390 || width === 1440;
    const device = width === 1440 ? 'desktop' : 'mobile';
    await page.goto(baseURL);
    if (networkChanged) throw new HostedNetworkChange();
    await page.evaluate(() => document.fonts.ready);
    await noPageOverflow(page);
    await fitsViewport(
      page.locator('header').getByRole('link', { name: 'Launch app', exact: true }),
    );
    await fitsViewport(page.locator('header').getByRole('button', { name: 'Toggle color theme' }));
    const landingAxe = screenshots ? (await new AxeBuilder({ page }).analyze()).violations : [];
    expect(landingAxe).toEqual([]);
    report.checks.push({
      width,
      route: '/',
      axeViolations: screenshots ? landingAxe.length : null,
    });
    if (screenshots || width === 320)
      await page.screenshot({
        path: `docs/screenshots/mobile-ux-${width === 320 ? '320' : device}-landing.png`,
        fullPage: true,
      });
    await page.getByRole('link', { name: 'Launch workspace', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: destinations[0][2], exact: true }),
    ).toBeVisible();
    for (const [view, name, heading] of destinations) {
      await navigateView(page, name);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await fitsViewport(page.getByRole('link', { name: 'Back to home', exact: true }));
      await noPageOverflow(page);
      const axe = screenshots ? (await new AxeBuilder({ page }).analyze()).violations : [];
      expect(axe).toEqual([]);
      report.checks.push({
        width,
        route: `/app?view=${view}`,
        axeViolations: screenshots ? axe.length : null,
      });
      if (screenshots)
        await page.screenshot({
          path: `docs/screenshots/mobile-ux-${device}-${view}.png`,
          fullPage: true,
        });
      await page.getByRole('link', { name: 'Back to home', exact: true }).click();
      await expect(page).toHaveURL(`${baseURL}/`);
      await page.goBack();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    }
    if (width === 390) {
      await page.getByRole('button', { name: /^Views:/ }).click();
      await page.screenshot({ path: 'docs/screenshots/mobile-ux-mobile-navigation.png' });
    }
    if (width === 1440) {
      await navigateView(page, 'Otari capabilities');
      const links = await page.getByRole('link', { name: 'Inspect JSON' }).all();
      expect(links).toHaveLength(8);
      for (const link of links) {
        const href = (await link.getAttribute('href'))!;
        const response = await page.request.get(new URL(href, baseURL).toString());
        expect(response.status()).toBe(200);
        report.evidence.push({ file: href, status: response.status() });
        if (href.endsWith('fallback-live-proof.json')) {
          const proof = await response.json();
          expect(proof.request.headers['otari-request-id']).toBe(
            '886b6cbc-a0e8-4a27-8ebf-60bbf3fd0f82',
          );
          expect(proof.request.headers['otari-fallback']).toBe('true');
          expect(proof.request.headers['otari-attempt-count']).toBe('2');
          expect(proof.request.headers['otari-provider']).toBe('bedrock');
          expect(proof.request.usage.costUsd).toBe('0.000034');
        }
      }
    }
    if (networkChanged) throw new HostedNetworkChange();
  } catch (error) {
    report.checks.length = checkCount;
    report.evidence.length = evidenceCount;
    if (networkChanged) throw new HostedNetworkChange('ERR_NETWORK_CHANGED', { cause: error });
    throw error;
  } finally {
    await context.close();
  }
  console.log(`Verified ${width}px`);
}
try {
  for (const width of [320, 360, 375, 390, 412, 430, 768, 960, 1024, 1440]) {
    for (let attempt = 0; ; attempt++) {
      try {
        await auditWidth(width);
        break;
      } catch (error) {
        if (!(error instanceof HostedNetworkChange) || attempt >= 2) throw error;
        report.transportRetries.push({ width, reason: 'ERR_NETWORK_CHANGED' });
        console.log(`Retrying ${width}px after ERR_NETWORK_CHANGED`);
      }
    }
  }
  expect(report.interceptedExecutionAttempts).toBe(0);
  await writeFile('evidence/mobile-ux-production.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    JSON.stringify({
      checks: report.checks.length,
      evidence: report.evidence.length,
      executionAttempts: report.interceptedExecutionAttempts,
    }),
  );
} finally {
  await browser.close();
}
