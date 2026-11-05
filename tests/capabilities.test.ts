import { describe, expect, it } from 'vitest';
import { capabilities } from '@/lib/capabilities';

describe('MCP capability evidence state', () => {
  it('does not count implementation or a response without a request ID', () => {
    expect(capabilities().find((cap) => cap.id === 'mcp')?.status).toBe('Implemented, unverified');
    expect(
      capabilities([], { verified: true, completion: { metadata: { requestId: null } } }).find(
        (cap) => cap.id === 'mcp',
      )?.status,
    ).toBe('Implemented, unverified');
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
