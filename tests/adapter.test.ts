import { describe, expect, it, vi } from 'vitest';
import {
  hostedBase,
  metadataFrom,
  normalizeError,
  OtariClient,
  parseCompletion,
} from '@/lib/otari';
const body = {
  id: 'response-1',
  model: 'policy',
  choices: [{ message: { content: '{"answer":16}' } }],
  usage: {
    prompt_tokens: 12,
    completion_tokens: 4,
    total_tokens: 16,
    cost_usd: '0.000012',
    pricing_source: 'deployment',
  },
};
const headers = new Headers({
  'Otari-Request-ID': 'gateway-1',
  'Otari-Provider': 'hosted-instance',
  'Otari-Model': 'actual-model',
  'Otari-Attempt-Count': '2',
  'Otari-Fallback': 'true',
});
describe('Otari response evidence', () => {
  it('uses gateway headers for effective identity and routing', () =>
    expect(parseCompletion(body, headers, 'policy', 123)).toMatchObject({
      content: '{"answer":16}',
      metadata: {
        requestId: 'gateway-1',
        requestedModel: 'policy',
        responseModel: 'policy',
        effectiveModel: 'actual-model',
        provider: 'hosted-instance',
        attempts: 2,
        fallback: true,
        latencyMs: 123,
        costUsd: 0.000012,
        totalTokens: 16,
      },
    }));
  it('leaves absent usage unknown', () =>
    expect(metadataFrom({}, new Headers(), 'a', 1)).toMatchObject({
      costUsd: null,
      totalTokens: null,
      effectiveModel: null,
      attempts: null,
      fallback: null,
    }));
  it('preserves a reported zero cost', () =>
    expect(metadataFrom({ usage: { cost_usd: '0.000000' } }, new Headers(), 'a', 0).costUsd).toBe(
      0,
    ));
  it('does not coerce blank costs into zero', () =>
    expect(metadataFrom({ usage: { cost_usd: '' } }, new Headers(), 'a', 0).costUsd).toBeNull());
  it('extracts actual gateway tool calls', () => {
    const tool = {
      id: 'tool1',
      type: 'web_fetch',
      status: 'completed',
      url: 'https://www.mozilla.org/en-US/about/manifesto/',
    };
    expect(
      parseCompletion({ ...body, otari_tool_calls: [tool] }, headers, 'm', 1).metadata.toolCalls,
    ).toEqual([tool]);
  });
  it('parses guardrail verdict separately', () =>
    expect(
      metadataFrom(
        {},
        new Headers({ 'otari-guardrails': '[{"status":"evaluated","valid":false}]' }),
        'a',
        1,
      ).guardrails,
    ).toEqual([{ status: 'evaluated', valid: false }]));
  it('does not propagate credentials in headers', () =>
    expect(
      metadataFrom(
        {},
        new Headers({ Authorization: 'secret', 'set-cookie': 'secret', 'Otari-Request-ID': 'id' }),
        'a',
        1,
      ).headers,
    ).toEqual({ 'otari-request-id': 'id' }));
  it('throws on empty output while retaining usage', () => {
    try {
      parseCompletion({ ...body, choices: [] }, headers, 'a', 4);
      throw new Error('Expected rejection');
    } catch (e) {
      expect(e).toMatchObject({
        safe: { code: 'empty_response' },
        metadata: { costUsd: 0.000012, requestId: 'gateway-1' },
      });
    }
  });
});
describe('hosted adapter', () => {
  it('authenticates server-side and uses hosted /api/v1 path', async () => {
    const mock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { headers }));
    const client = new OtariClient('private-key', undefined, 100, mock);
    await client.complete(
      { model: 'm', messages: [{ role: 'user', content: 'test' }] },
      'stable-id',
    );
    expect(mock).toHaveBeenCalledWith(
      'https://api.otari.ai/api/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer private-key',
          'Idempotency-Key': 'stable-id',
        }),
        redirect: 'error',
      }),
    );
  });
  it('captures gateway-owned MCP activity from the Otari Messages stream', async () => {
    const events = [
      { type: 'message_start', message: { id: 'msg-1', usage: { input_tokens: 9 } } },
      {
        type: 'content_block_start',
        index: 0,
        content_block: {
          type: 'mcp_tool_use',
          id: 'call-1',
          name: 'read_wiki_structure',
          input: { repoName: 'mozilla-ai/otari' },
        },
      },
      {
        type: 'content_block_start',
        index: 1,
        content_block: {
          type: 'mcp_tool_result',
          content: [{ type: 'text', text: 'docs/mcp.md' }],
          is_error: false,
        },
      },
      {
        type: 'content_block_delta',
        index: 2,
        delta: { type: 'text_delta', text: 'Otari documents MCP support.' },
      },
      { type: 'message_delta', usage: { output_tokens: 6 } },
      { type: 'message_stop' },
    ];
    const stream = events
      .map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`)
      .join('');
    const mock = vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Otari-Request-ID': 'mcp-request-1',
          'Otari-Provider': 'deepinfra',
          'Otari-Model': 'Qwen/Qwen3.8-27B',
        },
      }),
    );
    const client = new OtariClient('private-key', undefined, 100, mock);
    const result = await client.completeWithMcpActivity({
      model: 'alibaba/qwen3.8-27b',
      max_tokens: 100,
      max_tool_iterations: 2,
      messages: [{ role: 'user', content: 'Inspect the fixed repository.' }],
      mcp_servers: [
        {
          name: 'deepwiki',
          url: 'https://mcp.deepwiki.com/mcp',
          allowed_tools: ['read_wiki_structure'],
        },
      ],
    });
    expect(result.content).toBe('Otari documents MCP support.');
    expect(result.metadata).toMatchObject({
      requestId: 'mcp-request-1',
      provider: 'deepinfra',
      effectiveModel: 'Qwen/Qwen3.8-27B',
      promptTokens: 9,
      completionTokens: 6,
      costUsd: null,
    });
    expect(result.mcpActivity).toHaveLength(2);
    expect(result.streamComplete).toBe(true);
    expect(result.mcpActivity[0].name).toBe('read_wiki_structure');
    expect(result.mcpActivity[1].isError).toBe(false);
    expect(mock).toHaveBeenCalledWith(
      'https://api.otari.ai/api/v1/messages',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer private-key',
          'Anthropic-Beta': 'mcp-client-2025-11-20',
        }),
      }),
    );
  });
  it('validates accessible model metadata', async () => {
    const client = new OtariClient(
      'key',
      undefined,
      100,
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [
              {
                id: 'qwen',
                name: 'Qwen',
                supported_parameters: ['tools'],
                pricing: { input_price_per_million: 0.1 },
              },
            ],
          }),
        ),
      ),
    );
    expect(await client.models()).toEqual([
      {
        id: 'qwen',
        name: 'Qwen',
        supported_parameters: ['tools'],
        pricing: { input_price_per_million: 0.1 },
      },
    ]);
  });
  it('checks advertised tool availability', async () => {
    const client = new OtariClient(
      'key',
      undefined,
      100,
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: [{ id: 'otari_web_fetch', available: false, reason: 'workspace_disabled' }],
          }),
        ),
      ),
    );
    expect((await client.tools())[0].available).toBe(false);
  });
  it('retains a real budget denial request ID', async () => {
    const client = new OtariClient(
      'key',
      undefined,
      100,
      vi.fn().mockResolvedValue(
        new Response('{"detail":"budget exceeded"}', {
          status: 403,
          headers: {
            'Otari-Error-Code': 'budget_exceeded',
            'Otari-Request-ID': 'denied',
            'Otari-Budget-Scope': 'key',
            'Retry-After': '30',
          },
        }),
      ),
    );
    await expect(client.complete({ model: 'm', messages: [] })).rejects.toMatchObject({
      safe: { code: 'budget_exceeded', requestId: 'denied', retryAfter: '30' },
      metadata: { headers: { 'otari-budget-scope': 'key' } },
    });
  });
  it('fails closed on guardrail rejection', async () => {
    const client = new OtariClient(
      'key',
      undefined,
      100,
      vi.fn().mockResolvedValue(
        new Response('{}', {
          status: 403,
          headers: { 'Otari-Error-Code': 'guardrail_violation' },
        }),
      ),
    );
    await expect(client.complete({ model: 'm', messages: [] })).rejects.toMatchObject({
      safe: { code: 'guardrail_violation' },
    });
  });
  it('cancels timed-out fetches with no automatic retry', async () => {
    const mock = vi.fn(
      (_url, options) =>
        new Promise<Response>((_resolve, reject) =>
          options.signal.addEventListener('abort', () => reject(new Error('aborted'))),
        ),
    );
    const client = new OtariClient('key', undefined, 5, mock as typeof fetch);
    await expect(client.complete({ model: 'm', messages: [] })).rejects.toMatchObject({
      safe: { code: 'timeout' },
    });
    expect(mock).toHaveBeenCalledTimes(1);
  });
  it('reports configuration required', async () => {
    const original = process.env.OTARI_API_KEY;
    delete process.env.OTARI_API_KEY;
    await expect(new OtariClient().models()).rejects.toMatchObject({
      safe: { code: 'configuration_required' },
    });
    if (original) process.env.OTARI_API_KEY = original;
  });
  it('rejects direct provider or local URLs', () => {
    expect(() => hostedBase('http://localhost:8000/api/v1')).toThrow();
    expect(() => hostedBase('https://api.openai.com/v1')).toThrow();
    expect(hostedBase('https://eu.api.otari.ai/api/v1/')).toContain('eu.api.otari.ai');
  });
  it('rejects token limits beyond the demo ceiling', async () =>
    await expect(
      new OtariClient('key').complete({ model: 'm', messages: [], max_tokens: 701 }),
    ).rejects.toThrow('token limit'));
  it('normalizes network errors without disclosing upstream content', async () => {
    const client = new OtariClient(
      'key',
      undefined,
      100,
      vi.fn().mockRejectedValue(new Error('secret-token')),
    );
    await expect(client.models()).rejects.toMatchObject({ safe: { code: 'network_error' } });
  });
});
describe('safe error normalization', () => {
  it.each([
    [421, 'wrong_region'],
    [401, 'authentication'],
    [402, 'insufficient_credit'],
    [429, 'rate_limit'],
    [404, 'not_found'],
    [504, 'timeout'],
  ])('maps HTTP %s to %s', (status, code) =>
    expect(normalizeError(Number(status)).code).toBe(code),
  );
  it('removes free-form upstream error messages', () =>
    expect(
      JSON.stringify(normalizeError(500, new Headers(), { detail: 'secret=abc' })),
    ).not.toContain('abc'));
  it('distinguishes guardrail unavailable from guardrail violation', () =>
    expect(
      normalizeError(502, new Headers(), { detail: 'guardrail service unavailable' }).code,
    ).toBe('guardrail_unavailable'));
});
