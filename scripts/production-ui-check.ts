import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = 'https://modelswitch-lab.vercel.app';
const screenshotDir = 'docs/screenshots';
await mkdir(screenshotDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors: string[] = [];
const executePosts: string[] = [];
const checks: Record<string, unknown> = {};

try {
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const desktop = await desktopContext.newPage();
  desktop.on('pageerror', (error) => errors.push(`desktop: ${error.name}`));
  desktop.on('console', (message) => {
    if (message.type() === 'error') errors.push(`desktop console: ${message.text().slice(0, 120)}`);
  });
  desktop.on('request', (request) => {
    if (request.url().includes('/api/execute') && request.method() === 'POST')
      executePosts.push(request.postData() || '');
  });
  const landingResponse = await desktop.goto(base, { waitUntil: 'networkidle' });
  const landingHeading = await desktop.locator('h1').innerText();
  const landingAxe = await new AxeBuilder({ page: desktop }).analyze();
  await desktop.screenshot({
    path: `${screenshotDir}/production-landing-desktop.png`,
    fullPage: true,
  });
  const catalogResponsePromise = desktop.waitForResponse((response) =>
    response.url().endsWith('/api/catalog'),
  );
  await desktop.getByRole('link', { name: 'Launch workspace' }).click();
  await desktop.waitForURL(/\/app\?view=model-switch/);
  await desktop.getByRole('heading', { name: 'Model switch' }).waitFor();
  const catalogResponse = await catalogResponsePromise;
  const catalog = await catalogResponse.json();
  const switchToLlama = desktop.getByRole('button', { name: /Switch to llama/i });
  await switchToLlama.waitFor();
  await switchToLlama.click();
  const activeSelection = await desktop.locator('.model-active').innerText();
  const desktopAxe = await new AxeBuilder({ page: desktop }).analyze();
  await desktop.screenshot({
    path: `${screenshotDir}/production-model-switch-desktop.png`,
    fullPage: true,
  });
  checks.desktop = {
    landingStatus: landingResponse?.status() ?? null,
    landingHeading,
    appUrl: desktop.url(),
    appHeading: await desktop.getByRole('heading', { name: 'Model switch' }).innerText(),
    catalogHttpStatus: catalogResponse.status(),
    catalogConfigured: catalog.configured,
    catalogDemoEnabled: catalog.demoEnabled,
    availableModelIds: Array.isArray(catalog.models)
      ? catalog.models.map((model: { id: string }) => model.id)
      : [],
    activeSelectionAfterManualSwitch: activeSelection,
    landingAxeViolations: landingAxe.violations.map((violation) => violation.id),
    appAxeViolations: desktopAxe.violations.map((violation) => violation.id),
  };
  await desktop.close();

  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });
  const mobile = await mobileContext.newPage();
  mobile.on('pageerror', (error) => errors.push(`mobile: ${error.name}`));
  mobile.on('request', (request) => {
    if (request.url().includes('/api/execute') && request.method() === 'POST')
      executePosts.push(request.postData() || '');
  });
  const mobileHomeResponse = await mobile.goto(base, { waitUntil: 'networkidle' });
  const mobileLandingHeading = await mobile.locator('h1').innerText();
  const mobileLandingAxe = await new AxeBuilder({ page: mobile }).analyze();
  await mobile.screenshot({
    path: `${screenshotDir}/production-landing-mobile.png`,
    fullPage: true,
  });
  const mobileCatalogPromise = mobile.waitForResponse((response) =>
    response.url().endsWith('/api/catalog'),
  );
  await mobile.getByRole('link', { name: 'Launch workspace' }).click();
  await mobile.waitForURL(/\/app\?view=model-switch/);
  await mobile.getByRole('heading', { name: 'Model switch' }).waitFor();
  const mobileCatalog = await mobileCatalogPromise;
  const mobileMetrics = await mobile.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
  }));
  const mobileAxe = await new AxeBuilder({ page: mobile }).analyze();
  await mobile.screenshot({
    path: `${screenshotDir}/production-model-switch-mobile.png`,
    fullPage: true,
  });
  checks.mobile = {
    landingStatus: mobileHomeResponse?.status() ?? null,
    landingHeading: mobileLandingHeading,
    appStatus: mobileCatalog.status(),
    ...mobileMetrics,
    landingAxeViolations: mobileLandingAxe.violations.map((violation) => violation.id),
    axeViolations: mobileAxe.violations.map((violation) => violation.id),
  };
  await mobile.close();

  const evidenceFiles = ['model-switch-production.json', 'web-fetch-diagnosis.json'];
  const evidenceStatus: Record<string, number> = {};
  for (const file of evidenceFiles) {
    const response = await fetch(`${base}/api/evidence?file=${file}`);
    evidenceStatus[file] = response.status;
  }
  const record = {
    recordVersion: 1,
    checkedAt: new Date().toISOString(),
    productionUrl: base,
    checks,
    evidenceEndpoints: evidenceStatus,
    paidInferenceRequestsSent: executePosts.length,
    pageErrors: errors,
    deploymentGitSha: null,
    limitations: [
      'This browser check performs catalog and evidence GETs only. It switches the local browser selection but does not press a model test or invoke inference.',
      'The deployment content is verified by rendered routes; its exact Vercel source commit is not exposed to this unauthenticated check.',
    ],
  };
  await writeFile('evidence/production-ui-check.json', JSON.stringify(record, null, 2) + '\n');
  console.log(JSON.stringify(record, null, 2));
} finally {
  await browser.close();
}
