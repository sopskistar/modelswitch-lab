import { describe, expect, it } from 'vitest';
import { capabilities } from '@/lib/capabilities';
import {
  advancedVerifiedPoints,
  budgetEnforcementVerified,
  fallbackLiveVerified,
  webFetchVerified,
} from '@/lib/capabilities';

describe('routing evidence state', () => {
  it('counts an executed Otari fallback using actual serving headers and usage rows', () => {
    const route = capabilities().find((cap) => cap.id === 'routing');
    expect(fallbackLiveVerified).toBe(true);
    expect(route).toMatchObject({ status: 'Verified live', file: 'fallback-live-proof.json' });
    expect(route?.detail).toContain('fallback=true');
    expect(route?.detail).toContain('886b6cbc-a0e8-4a27-8ebf-60bbf3fd0f82');
    expect(budgetEnforcementVerified).toBe(true);
    expect(advancedVerifiedPoints).toBe(60);
  });
});

describe('native web retrieval evidence state', () => {
  it('counts only the completed hosted Otari fetch receipt', () => {
    expect(webFetchVerified).toBe(true);
    expect(capabilities().find((cap) => cap.id === 'web')).toMatchObject({
      status: 'Verified live',
      file: 'web-fetch-live.json',
      detail: expect.stringContaining('8058116e-e1b4-4f24-90d7-3b766a4f41e1'),
    });
  });
});

describe('budget capability evidence', () => {
  it('shows the actual gateway refusal and its redacted receipt', () => {
    expect(capabilities().find((cap) => cap.id === 'budgets')).toMatchObject({
      status: 'Verified live',
      file: 'budget-enforcement-test.json',
      detail: expect.stringContaining('budget_exceeded'),
    });
  });
});

describe('MCP capability evidence state', () => {
  it('uses only the committed live record for cross-session verification', () => {
    expect(capabilities().find((cap) => cap.id === 'mcp')?.status).toBe('Verified live');
    expect(
      capabilities([], { verified: true, completion: { metadata: { requestId: null } } }).find(
        (cap) => cap.id === 'mcp',
      )?.status,
    ).toBe('Verified live');
  });
  it('shows live verification only for the current session evidence with a gateway ID', () => {
    expect(
      capabilities([], {
        verified: true,
        completion: {
          metadata: {
            requestId: 'otari-req-1',
            effectiveModel: 'Qwen/Qwen3.8-27B',
            provider: 'deepinfra',
          },
        },
      }).find((cap) => cap.id === 'mcp'),
    ).toMatchObject({
      status: 'Verified live this session',
      file: '#capability-check-result',
      detail: expect.stringContaining('otari-req-1'),
    });
  });
});
