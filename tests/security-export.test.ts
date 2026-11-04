import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PUBLIC_LIMITS, requestSchema, safeSourceUrl, sources } from '@/lib/security';
import { exportCsv, exportJson } from '@/lib/export';
import { readBody, readReceipt, signReceipt } from '@/lib/server';
import type { Run } from '@/lib/types';
const run: Run = {
  version: 1,
  id: 'run',
  startedAt: '2026-11-04',
  scenario: 'classification',
  objective: 'balanced',
  models: ['model'],
  caseCount: 1,
  cases: [{ model: '=formula', caseId: 'sup-01', skipped: true }],
  trace: [],
  summaries: [],
  state: 'interrupted',
};
describe('URL safety', () => {
  it.each(Object.values(sources))('permits only curated source $title', (source) =>
    expect(safeSourceUrl(source.url)).toBe(source.url),
  );
  it.each([
    'http://localhost/',
    'https://127.0.0.1/',
    'https://[::1]/',
    'https://169.254.169.254/latest/meta-data/',
    'https://10.0.0.1/',
    'file:///etc/passwd',
    'https://mozilla.org.evil.test/',
    'https://www.mozilla.org:444/en-US/about/manifesto/',
    'https://a@www.mozilla.org/en-US/about/manifesto/',
    'https://www.mozilla.org/en-US/about/manifesto/?secret=1',
    'https://www.mozilla.org/en-US/about/manifesto/#x',
    'https://internal.local/',
  ])('rejects %s', (url) => expect(() => safeSourceUrl(url)).toThrow());
});
describe('bounded inputs and receipts', () => {
  beforeEach(() => {
    vi.stubEnv('OTARI_API_KEY', 'test-secret');
  });
  it('caps a run at 11 requests and 400 case output tokens', () => {
    expect(PUBLIC_LIMITS.maxCases * PUBLIC_LIMITS.maxModels + 1).toBe(
      PUBLIC_LIMITS.maxRequestsPerRun,
    );
    expect(PUBLIC_LIMITS.maxOutputTokens).toBe(400);
  });
  it('rejects arbitrary code and freeform prompts', () => {
    expect(
      requestSchema.safeParse({ action: 'code', runId: crypto.randomUUID(), code: 'import os' })
        .success,
    ).toBe(false);
    expect(
      requestSchema.safeParse({ action: 'case', runId: crypto.randomUUID(), prompt: 'anything' })
        .success,
    ).toBe(false);
  });
  it('rejects excessive receipts', () =>
    expect(
      requestSchema.safeParse({
        action: 'analyst',
        runId: crypto.randomUUID(),
        objective: 'balanced',
        receipts: Array(11).fill('x'),
      }).success,
    ).toBe(false));
  it('verifies server-signed results and run binding', () => {
    const receipt = signReceipt(run.cases[0], 'run-1');
    expect(readReceipt(receipt, 'run-1')).toEqual(run.cases[0]);
    expect(() => readReceipt(receipt, 'run-2')).toThrow();
    expect(() => readReceipt(receipt + 'a', 'run-1')).toThrow();
  });
  it('rejects forged metrics', () =>
    expect(() =>
      readReceipt(Buffer.from('{"score":100}').toString('base64url') + '.fake', 'run'),
    ).toThrow());
  it('enforces byte limits even without Content-Length', async () => {
    const request = new Request('http://localhost/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'x'.repeat(PUBLIC_LIMITS.maxBodyBytes + 1),
    });
    await expect(readBody(request)).rejects.toThrow('too large');
  });
  it('rejects unsupported content types', async () =>
    await expect(
      readBody(new Request('http://localhost/api', { method: 'POST', body: '{}' })),
    ).rejects.toThrow('application/json'));
});
describe('exports', () => {
  it('exports reproducible metadata without secrets', () => {
    const json = exportJson(run);
    expect(JSON.parse(json)).toMatchObject({ version: 1, id: 'run', scenario: 'classification' });
    expect(json).not.toContain('test-secret');
  });
  it('escapes CSV formula cells and quotes', () => {
    const csv = exportCsv(run);
    expect(csv).toContain('"\'=formula"');
    expect(csv).toContain('"skipped"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });
});
