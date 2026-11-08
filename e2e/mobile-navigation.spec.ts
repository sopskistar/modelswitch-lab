import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { catalog } from './fixtures';
import { destinations, fitsViewport, navigateView, noPageOverflow } from './navigation';
import { fixtures } from '../src/lib/fixtures';
import { evaluate, summarize } from '../src/lib/scoring';
import type { CaseResult, Run } from '../src/lib/types';

const phoneWidths = [320, 360, 375, 390, 412, 430];
test.setTimeout(120000);
const longId = `intercepted-only-${'0123456789abcdef'.repeat(12)}`;
const output = JSON.stringify(fixtures.extraction[0].expected);
const result: CaseResult = {
  model: catalog.roles.evaluator,
  caseId: fixtures.extraction[0].id,
  output,
  evaluation: evaluate('extraction', fixtures.extraction[0], output),
  metadata: {
    requestedModel: catalog.roles.evaluator,
    responseModel: catalog.roles.evaluator,
    effectiveModel: catalog.roles.evaluator,
    provider: 'intercepted-only',
    requestId: longId,
    responseId: longId,
    attempts: 1,
    fallback: false,
    gatewayDurationMs: 100,
    latencyMs: 100,
    promptTokens: 100,
    completionTokens: 30,
    totalTokens: 130,
    costUsd: 0.0001,
    pricingSource: 'intercepted-only',
    toolCalls: [],
    guardrails: null,
    headers: { 'otari-request-id': longId },
  },
};
const savedRun: Run = {
  version: 1,
  id: 'intercepted-mobile-layout',
  startedAt: '2026-11-08T00:00:00Z',
  scenario: 'extraction',
  objective: 'balanced',
  models: [catalog.roles.evaluator],
  caseCount: 1,
  cases: [result],
  summaries: summarize([catalog.roles.evaluator], [result], 'balanced'),
  trace: [
    {
      at: '2026-11-08T00:00:00Z',
      source: 'gateway',
      label: 'Intercepted layout fixture',
      detail: { requestId: longId, nested: { value: longId } },
    },
  ],
  state: 'complete',
};

test.beforeEach(async ({ page }) => {
  await page.route('**/api/catalog', (route) => route.fulfill({ json: catalog }));
  // This suite must never spend inference credits, including on production.
  await page.route('**/api/execute', (route) => route.abort('blockedbyclient'));
});

for (const width of phoneWidths) {
  test(`landing header and all workspace views fit ${width}px without root clipping`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    await noPageOverflow(page);
    const header = page.locator('header');
    await fitsViewport(header.getByRole('link', { name: 'Launch app', exact: true }));
    await fitsViewport(header.getByRole('button', { name: 'Toggle color theme' }));
    await expect(header.getByRole('link', { name: 'ModelSwitch Lab home' })).toBeVisible();
    await page.getByRole('link', { name: 'Launch workspace', exact: true }).click();
    await expect(page.getByRole('heading', { name: destinations[0][2] })).toBeVisible();
    for (const [view, , heading] of destinations) {
      await page.goto(`/app?view=${view}`);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: /^Views:/ })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      await noPageOverflow(page);
      await fitsViewport(page.getByRole('link', { name: 'Back to home', exact: true }));
    }
    await page.evaluate(
      ({ savedRun, result }) => {
        localStorage.setItem('msl-recent', JSON.stringify(savedRun));
        localStorage.setItem(
          'msl-switch-tests',
          JSON.stringify([{ at: savedRun.startedAt, runId: savedRun.id, result }]),
        );
      },
      { savedRun, result },
    );
    for (const [view, , heading] of destinations) {
      await page.goto(`/app?view=${view}`);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(page.locator('.latest-run')).toContainText('Invoice extraction');
      await page.locator('main details').evaluateAll((elements) => {
        elements.forEach((element) => element.setAttribute('open', ''));
      });
      await noPageOverflow(page);
      if (view === 'results') {
        await fitsViewport(page.getByRole('button', { name: 'Export JSON' }));
        await fitsViewport(page.getByRole('button', { name: 'Export CSV' }));
      }
      if (view === 'model-switch') {
        await fitsViewport(page.getByRole('button', { name: /Switch to llama/i }).first());
        await fitsViewport(page.getByRole('button', { name: /Test alibaba\/qwen|Test qwen/i }));
      }
    }
  });
}

test('Home returns to / from every workspace view and browser Back restores the view', async ({
  page,
}) => {
  for (const [view, , heading] of destinations) {
    await page.goto(`/app?view=${view}`);
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Back to home', exact: true }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('heading', { name: /Find the right model/ })).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`view=${view}$`));
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
  }
});

test('every view is discoverable, active, and reachable; desktop tabs stay horizontal', async ({
  page,
}, testInfo) => {
  await page.goto('/app');
  const nav = page.getByRole('navigation', { name: 'Workbench views' });
  const toggle = nav.getByRole('button', { name: /^Views:/ });
  const mobile = testInfo.project.name === 'mobile';
  if (!mobile) {
    await expect(toggle).toBeHidden();
    const rows = await nav
      .getByRole('link')
      .evaluateAll((links) => links.map((link) => link.getBoundingClientRect().top));
    expect(new Set(rows).size).toBe(1);
    await expect(nav.getByRole('link')).toHaveCount(6);
  }
  for (const [view, name, heading] of destinations) {
    if (mobile) {
      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'true');
      for (const [, label] of destinations)
        await fitsViewport(nav.getByRole('link', { name: label, exact: true }));
      await nav.getByRole('link', { name, exact: true }).click();
      await expect(toggle).toHaveAttribute('aria-expanded', 'false');
      await toggle.click();
    } else await navigateView(page, name);
    await expect(nav.locator('[aria-current="page"]')).toHaveText(name);
    if (mobile) await toggle.click();
    await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    if (view !== 'workspace') await expect(page).toHaveURL(new RegExp(`view=${view}`));
  }
});

test('mobile disclosure supports keyboard, Escape, outside click, focus departure and resizing', async ({
  page,
  isMobile,
}) => {
  test.skip(!isMobile, 'Mobile disclosure only');
  await page.goto('/app');
  const nav = page.getByRole('navigation', { name: 'Workbench views' });
  const toggle = nav.getByRole('button', { name: /^Views:/ });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await expect(nav.getByRole('link', { name: 'Workspace', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await page.keyboard.press('Space');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Model switch', exact: true })).toBeFocused();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.locator('h1').click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.getByRole('link', { name: 'Back to home', exact: true }).focus();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await page.setViewportSize({ width: 1280, height: 900 });
  await expect(toggle).toBeHidden();
  await expect(nav.getByRole('link')).toHaveCount(6);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});

test('deep links, legacy routes, reload, Back and Forward preserve browser results and model selection', async ({
  page,
}) => {
  await page.goto('/?view=model-switch&scenario=classification&objective=cost');
  await expect(page).toHaveURL(/\/app\?view=model-switch&scenario=classification&objective=cost/);
  await page
    .getByRole('button', { name: /Switch to llama/i })
    .first()
    .click();
  await page.evaluate((run) => localStorage.setItem('msl-recent', JSON.stringify(run)), savedRun);
  await page.reload();
  await expect(
    page.locator('.model-choice').filter({ has: page.locator('.model-active') }),
  ).toContainText(catalog.roles.analyst);
  await navigateView(page, 'Results');
  await expect(page).toHaveURL(/view=results&scenario=classification&objective=cost/);
  await expect(page.getByRole('button', { name: 'Export JSON' })).toBeVisible();
  await navigateView(page, 'Request trace');
  await expect(page.getByText('Intercepted layout fixture', { exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole('heading', { name: 'Request trace', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Back to home', exact: true }).click();
  await page.goBack();
  await navigateView(page, 'Model switch');
  await expect(
    page.locator('.model-choice').filter({ has: page.locator('.model-active') }),
  ).toContainText(catalog.roles.analyst);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('msl-recent')!).id)).toBe(
    savedRun.id,
  );
});

test('all views and the open mobile navigation pass axe in both themes', async ({
  page,
  isMobile,
}) => {
  test.setTimeout(120000);
  for (const theme of ['light', 'dark']) {
    await page.goto('/');
    await page.locator('html').evaluate((el, theme) => el.setAttribute('data-mode', theme), theme);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.goto('/app');
    for (const [, name, heading] of destinations) {
      await navigateView(page, name);
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await page
        .locator('html')
        .evaluate((el, theme) => el.setAttribute('data-mode', theme), theme);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    if (isMobile) {
      await page.getByRole('button', { name: /^Views:/ }).click();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
  }
});

test('Model Switch discovery remains accessible while loading and empty', async ({ page }) => {
  let finishDiscovery!: () => void;
  const discovery = new Promise<void>((resolve) => {
    finishDiscovery = resolve;
  });
  await page.route('**/api/catalog', async (route) => {
    await discovery;
    await route.fulfill({ json: { ...catalog, configured: false, models: [] } });
  });
  await page.goto('/app?view=model-switch');
  await expect(page.getByRole('heading', { name: 'Model switch', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Available models' })).toHaveCount(1);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const response = page.waitForResponse('**/api/catalog');
  finishDiscovery();
  await response;
  await expect(page.locator('.model-choice')).toHaveCount(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});
