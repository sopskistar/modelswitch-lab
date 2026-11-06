import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { fixtures } from '../src/lib/fixtures';
const catalog = {
  configured: true,
  demoEnabled: true,
  region: 'US',
  roles: {
    evaluator: 'alibaba/qwen3.8-27b',
    analyst: 'meta/llama-3.3-70b-instruct',
    policy: 'modelswitch-fallback',
  },
  models: [
    { id: 'alibaba/qwen3.8-27b', name: 'Qwen3.8 27B' },
    { id: 'meta/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct' },
    { id: 'modelswitch-fallback' },
  ],
  tools: [
    { id: 'otari_web_fetch', available: false, reason: 'workspace_disabled' },
    { id: 'otari_code_execution', available: true },
  ],
};
// Browser fixtures are intercepted only in the test runner, never shipped as live results.
test.beforeEach(async ({ page }) => {
  await page.route('**/api/catalog', (route) => route.fulfill({ json: catalog }));
});
test('landing and legacy workspace links lead into the app', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Find the right model. Switch with confidence.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Launch workspace' }).first().click();
  await expect(page).toHaveURL(/\/app(?:\?|$)/);
  await expect(page.getByRole('heading', { name: 'Model switch' })).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Workbench views' })
    .getByRole('link', { name: 'Workspace' })
    .click();
  await expect(page.getByRole('heading', { name: 'Put a model to the test.' })).toBeVisible();
  await page.goto('/?view=results&scenario=classification');
  await expect(page).toHaveURL(/\/app\?view=results&scenario=classification/);
});
test('workspace, scenario selection, URL state, and keyboard focus', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Put a model to the test.' })).toBeVisible();
  await page.getByRole('radio', { name: /Support classification/ }).check();
  await expect(page).toHaveURL(/scenario=classification/);
  await expect(page.getByText('Duplicate charge')).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toBeVisible();
});
test('model switch changes the next bounded Otari request and switching alone sends nothing', async ({
  page,
}, testInfo) => {
  const receivedModels: string[] = [];
  await page.route('**/api/execute', async (route) => {
    const request = route.request().postDataJSON();
    receivedModels.push(request.model);
    const fixture = fixtures.extraction[0];
    const isLlama = request.model === catalog.roles.analyst;
    const expected = isLlama
      ? fixture.expected
      : { ...fixture.expected, paymentReference: 'wrong-reference' };
    await route.fulfill({
      json: {
        result: {
          model: request.model,
          caseId: fixture.id,
          output: JSON.stringify(expected),
          evaluation: {
            valid: true,
            accuracy: isLlama ? 1 : 5 / 6,
            passed: isLlama,
            missing: 0,
            fields: [],
          },
          metadata: {
            requestedModel: request.model,
            effectiveModel:
              request.model === catalog.roles.analyst
                ? 'Llama 3.3 test identity'
                : 'Qwen 3.8 test identity',
            provider: request.model === catalog.roles.analyst ? 'test-bedrock' : 'test-deepinfra',
            requestId: `intercepted-${receivedModels.length}`,
            attempts: 1,
            fallback: false,
            latencyMs: 100,
            costUsd: 0.0001,
            toolCalls: [],
          },
        },
        receipt: 'intercepted-only',
      },
    });
  });
  await page.goto('/app?view=model-switch');
  await expect(page.getByRole('heading', { name: 'Model switch' })).toBeVisible();
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-model-switch.png`,
    fullPage: true,
  });
  await expect(page.getByText(catalog.roles.evaluator, { exact: true }).first()).toBeVisible();
  expect(receivedModels).toEqual([]);
  await page.getByRole('button', { name: /Switch to llama/i }).click();
  expect(receivedModels).toEqual([]);
  await page.getByRole('button', { name: /Test meta\/llama|Test llama/i }).click();
  await page.getByText('Inspect output and gateway identity').first().click();
  await expect(page.locator('.switch-result').first().locator('.json').last()).toContainText(
    'intercepted-1',
  );
  expect(receivedModels).toEqual([catalog.roles.analyst]);
  await page.getByRole('button', { name: /Switch to alibaba\/qwen|Switch to qwen/i }).click();
  expect(receivedModels).toEqual([catalog.roles.analyst]);
  await page.getByRole('button', { name: /Test alibaba\/qwen|Test qwen/i }).click();
  await page.getByText('Inspect output and gateway identity').first().click();
  await expect(page.locator('.switch-result').first().locator('.json').last()).toContainText(
    'intercepted-2',
  );
  expect(receivedModels).toEqual([catalog.roles.analyst, catalog.roles.evaluator]);
  await expect(
    page.getByRole('heading', { name: 'Model decision for this fixture' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: /Switch to llama/i })
    .last()
    .click();
  await expect(page.locator('.model-active')).toContainText('Active');
  expect(receivedModels).toEqual([catalog.roles.analyst, catalog.roles.evaluator]);
});
test('real run UI contract, loading, results, trace, and export', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/execute', async (route) => {
    const request = route.request().postDataJSON();
    calls++;
    if (request.action === 'analyst') {
      await route.fulfill({
        json: {
          analyst: {
            content:
              'TEST FIXTURE: These cases passed. The sample is too small to establish a general ranking.',
            metadata: {
              requestedModel: catalog.roles.analyst,
              effectiveModel: 'llama-test',
              provider: 'fixture-provider',
              requestId: 'fixture-analyst',
              costUsd: 0.0001,
            },
          },
        },
      });
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
    const fixture = fixtures[request.scenario as keyof typeof fixtures].find(
      (c) => c.id === request.caseId,
    )!;
    await route.fulfill({
      json: {
        result: {
          model: request.model,
          caseId: request.caseId,
          output: JSON.stringify(fixture.expected),
          evaluation: {
            valid: true,
            accuracy: 1,
            passed: true,
            missing: 0,
            fields: Object.entries(fixture.expected).map(([field, expected]) => ({
              field,
              expected,
              actual: expected,
              match: true,
            })),
          },
          metadata: {
            requestedModel: request.model,
            responseModel: request.model,
            effectiveModel: 'qwen-test',
            provider: 'fixture-provider',
            requestId: `fixture-${calls}`,
            responseId: `fixture-response-${calls}`,
            attempts: 1,
            fallback: false,
            latencyMs: 100,
            promptTokens: 100,
            completionTokens: 30,
            totalTokens: 130,
            costUsd: 0.0001,
            pricingSource: 'fixture',
            headers: { 'otari-request-id': `fixture-${calls}` },
            toolCalls: [],
            guardrails: null,
          },
        },
        receipt: 'test-only',
      },
    });
  });
  await page.goto('/app');
  await page.getByRole('button', { name: 'Run benchmark' }).click();
  await expect(page.getByRole('status')).toContainText(/qwen|Analyst/);
  await expect(page.getByText('TEST FIXTURE:', { exact: false })).toBeVisible();
  await expect(page.getByRole('cell', { name: /100%$/ })).toHaveCount(2);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click();
  const exported = await download;
  expect(exported.suggestedFilename()).toMatch(/^modelswitch-.*\.json$/);
  const receipt = JSON.parse(await readFile((await exported.path())!, 'utf8'));
  expect(receipt).toMatchObject({
    receiptVersion: 1,
    scenario: 'extraction',
    datasetVersion: 1,
    executionStatus: 'complete',
  });
  expect(receipt.cases[0].request.requestId).toMatch(/^fixture-/);
  await page
    .getByRole('navigation', { name: 'Workbench views' })
    .getByRole('link', { name: 'Request trace', exact: true })
    .click();
  await expect(page.getByText('Deterministic scoring', { exact: true })).toHaveCount(3);
  await expect(page.getByText('Analyst response', { exact: true })).toBeVisible();
  expect(calls).toBe(4);
  await page.reload();
  await expect(page.getByText('Analyst response', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Latest run' })).toBeVisible();
  await expect(page.locator('.latest-run')).toContainText('Invoice extraction');
});
test('credit failure is honest and remaining cases are skipped', async ({ page }) => {
  let calls = 0;
  await page.route('**/api/execute', (route) => {
    calls++;
    return route.fulfill({
      json: {
        result: {
          model: catalog.roles.evaluator,
          caseId: 'inv-01',
          error: {
            code: 'insufficient_credit',
            message: 'The Otari account has insufficient credit.',
            status: 402,
            requestId: 'actual-shaped-fixture-refusal',
            retryAfter: null,
          },
        },
        receipt: 'test-only',
      },
    });
  });
  await page.goto('/app');
  await page.getByRole('button', { name: 'Run benchmark' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Otari account needs credit',
  );
  await expect(page.getByText('Skipped', { exact: true })).toHaveCount(2);
  expect(calls).toBe(1);
  await expect(page.getByText('No analyst call completed.', { exact: false })).toBeVisible();
});
test('missing configuration and disabled tools', async ({ page }) => {
  await page.route('**/api/catalog', (route) =>
    route.fulfill({
      json: {
        ...catalog,
        configured: false,
        models: [],
        error: {
          code: 'configuration_required',
          message: 'Set OTARI_API_KEY and both role models on the server.',
        },
      },
    }),
  );
  await page.goto('/app');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Connect hosted Otari');
  await expect(page.getByRole('button', { name: 'Run benchmark' })).toBeDisabled();
  await page.getByRole('button', { name: 'Open setup guide' }).click();
  await expect(page.getByRole('heading', { name: 'Configure the server' })).toBeVisible();
});
test('capabilities expose recorded evidence and keep failed checks unverified', async ({
  page,
}) => {
  await page.goto('/app?view=capabilities');
  await expect(page.getByText('60 / 60 advanced points verified')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fetch through Otari' })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Inspect JSON' })).toHaveCount(8);
  await expect(page.getByRole('link', { name: 'Fallback readiness' })).toHaveAttribute(
    'href',
    '/api/evidence?file=fallback-test-readiness.json',
  );
  const webRow = page.getByRole('row').filter({ hasText: 'Web retrieval' });
  await expect(webRow).toContainText('Verified live');
  await expect(webRow.getByRole('link', { name: 'Inspect JSON' })).toHaveAttribute(
    'href',
    '/api/evidence?file=web-fetch-live.json',
  );
  await page.route('**/api/execute', (route) => {
    const action = route.request().postDataJSON().action;
    return action === 'mcp'
      ? route.fulfill({
          json: {
            experiment: 'mcp',
            verified: false,
            evidenceNote: 'TEST FIXTURE: no hosted MCP events are represented.',
          },
        })
      : route.fulfill({
          status: 502,
          json: {
            error: {
              code: 'guardrail_unavailable',
              message: 'Otari could not evaluate the guardrail and failed closed.',
            },
            verified: false,
          },
        });
  });
  await page.getByRole('button', { name: 'Inspect repository' }).click();
  await expect(page.getByRole('heading', { name: 'Check recorded, unverified' })).toBeVisible();
  await expect(page.getByText(/TEST FIXTURE: no hosted MCP events/)).toBeVisible();
  await expect(page.getByText('60 / 60 advanced points verified')).toBeVisible();
  const mcpDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export evidence' }).click();
  expect((await mcpDownload).suggestedFilename()).toBe('otari-mcp.json');
  await page.getByRole('button', { name: 'Check guardrail' }).click();
  await expect(page.getByRole('heading', { name: 'Check recorded, unverified' })).toBeVisible();
});
test('theme persists, no horizontal page overflow, and axe passes', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Find the right model. Switch with confidence.' }),
  ).toBeVisible();
  const landingResults = await new AxeBuilder({ page }).analyze();
  expect(landingResults.violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(
    false,
  );
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-landing.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Toggle color theme' }).click();
  const landingMode = await page.locator('html').getAttribute('data-mode');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-mode', landingMode!);
  await page.goto('/app');
  await expect(page.getByRole('button', { name: 'Run benchmark' })).toBeEnabled();
  const lightResults = await new AxeBuilder({ page }).analyze();
  expect(lightResults.violations).toEqual([]);
  await page.getByRole('button', { name: /Switch to .* theme/ }).click();
  const mode = await page.locator('html').getAttribute('data-mode');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-mode', mode!);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth,
  );
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({
    path: `test-results/screenshots/${testInfo.project.name}-${mode}-workspace.png`,
    fullPage: true,
  });
});
test('network interruption retains partial results and allows navigation', async ({ page }) => {
  await page.route('**/api/execute', (route) => route.abort('failed'));
  await page.goto('/app');
  await page.getByRole('button', { name: 'Run benchmark' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'browser connection was interrupted',
  );
  await page
    .getByRole('navigation', { name: 'Workbench views' })
    .getByRole('link', { name: 'Request trace', exact: true })
    .click();
  await expect(page.getByText('Response interrupted', { exact: true })).toBeVisible();
});
test('brand marks, latest-run empty state, and footer navigation', async ({ page }) => {
  await page.goto('/app');
  await expect(page.getByRole('heading', { name: 'Latest run' })).toBeVisible();
  await expect(page.getByText('No run is saved in this browser yet.')).toBeVisible();
  const marks = page.locator('.brand-mark');
  await expect(marks).toHaveCount(2);
  await expect(marks.first()).toHaveAttribute('src', '/modelswitch-icon.png');
  await page.locator('html').evaluate((el) => el.setAttribute('data-mode', 'light'));
  await expect(marks.first()).toHaveCSS('filter', 'invert(1)');
  await page.locator('html').evaluate((el) => el.setAttribute('data-mode', 'dark'));
  await expect(marks.first()).toHaveCSS('filter', 'none');
  const footer = page.locator('footer');
  await expect(footer.getByRole('navigation', { name: 'Explore' }).getByRole('link')).toHaveCount(
    4,
  );
  await expect(footer.getByRole('navigation', { name: 'Resources' }).getByRole('link')).toHaveCount(
    4,
  );
  await expect(footer.getByRole('link', { name: 'MIT License' })).toHaveAttribute(
    'href',
    /blob\/main\/LICENSE$/,
  );
  await footer.getByRole('link', { name: 'Results', exact: true }).click();
  await expect(page).toHaveURL(/view=results/);
  await expect(page.getByRole('heading', { name: 'No benchmark results yet' })).toBeVisible();
  await footer.getByRole('link', { name: 'Workspace', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Put a model to the test.' })).toBeVisible();
});
