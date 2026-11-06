import { describe, expect, it } from 'vitest';
import { capabilities } from '@/lib/capabilities';
import { advancedVerifiedPoints, budgetEnforcementVerified } from '@/lib/capabilities';

describe('routing evidence state', () => {
  it('counts an executed Otari policy resolution while explicitly showing no failover', () => {
    const route = capabilities().find((cap) => cap.id === 'routing');
    expect(route).toMatchObject({ status: 'Verified live', file: 'routing-production.json' });
    expect(route?.detail).toContain('fallback false');
    expect(budgetEnforcementVerified).toBe(true);
    expect(advancedVerifiedPoints).toBe(50);
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
