import { describe, expect, it } from 'vitest';
import { capabilities } from '@/lib/capabilities';

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
