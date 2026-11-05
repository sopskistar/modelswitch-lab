import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OtariError } from '@/lib/otari';
const mocks = vi.hoisted(() => ({
  request: vi.fn(),
  complete: vi.fn(),
  completeWithMcpActivity: vi.fn(),
  rate: vi.fn(),
  demo: vi.fn(),
  models: [{ id: 'evaluator' }, { id: 'analyst' }, { id: 'policy' }],
}));
vi.mock('@/lib/server', () => ({
  demoEnabled: mocks.demo,
  roleModels: () => ({ evaluator: 'evaluator', analyst: 'analyst', policy: 'policy' }),
  discover: async () => ({
    models: mocks.models,
    tools: [
      { id: 'otari_code_execution', available: true },
      { id: 'otari_web_fetch', available: false, reason: 'workspace_disabled' },
    ],
    at: Date.now(),
  }),
  enforceRate: mocks.rate,
  bounded: async (fn: () => unknown) => fn(),
  readBody: async (request: Request) => request.json(),
  signReceipt: () => 'signed-test-only',
  readReceipt: () => ({
    model: 'evaluator',
    caseId: 'sup-01',
    evaluation: { valid: true, accuracy: 1, passed: true, missing: 0, fields: [] },
  }),
}));
vi.mock('@/lib/otari', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/otari')>();
  return {
    ...actual,
    OtariClient: class {
      request = mocks.request;
      complete = mocks.complete;
      completeWithMcpActivity = mocks.completeWithMcpActivity;
    },
  };
});
import { POST } from '@/app/api/execute/route';
const runId = '2eb173c8-0283-42db-b5c8-f23af3850187';
const send = (body: unknown, origin = 'http://localhost') =>
  POST(
    new Request('http://localhost/api/execute', {
      method: 'POST',
      headers: { origin, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
beforeEach(() => {
  mocks.demo.mockReturnValue(true);
  mocks.rate.mockResolvedValue(undefined);
  mocks.complete.mockReset();
  mocks.completeWithMcpActivity.mockReset();
  mocks.request.mockReset();
});
describe('bounded execution route', () => {
  it('accepts the browser Host when Next uses an internal bind address', async () => {
    mocks.complete.mockResolvedValue({ content: 'billing', metadata: { fallback: false } });
    const response = await POST(
      new Request('http://0.0.0.0:3005/api/execute', {
        method: 'POST',
        headers: {
          origin: 'http://localhost:3005',
          host: 'localhost:3005',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'routing', runId }),
      }),
    );
    expect(response.status).toBe(200);
  });
  it('refuses cross-origin execution before dispatch', async () => {
    expect((await send({ action: 'routing', runId }, 'https://evil.example')).status).toBe(403);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it('fails closed when public inference is disabled', async () => {
    mocks.demo.mockReturnValue(false);
    expect((await send({ action: 'routing', runId })).status).toBe(503);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it('refuses arbitrary prompts and unknown body properties', async () =>
    expect(
      (
        await send({
          action: 'case',
          runId,
          model: 'evaluator',
          caseId: 'sup-01',
          scenario: 'classification',
          prompt: 'arbitrary',
        })
      ).status,
    ).toBe(400));
  it('refuses non-permitted models', async () => {
    expect(
      (
        await send({
          action: 'case',
          runId,
          model: 'expensive',
          caseId: 'sup-01',
          scenario: 'classification',
        })
      ).status,
    ).toBe(400);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it('refuses unknown fixture IDs', async () =>
    expect(
      (
        await send({
          action: 'case',
          runId,
          model: 'evaluator',
          caseId: 'invented',
          scenario: 'classification',
        })
      ).status,
    ).toBe(400));
  it('scores genuine adapter output before signing it', async () => {
    mocks.complete.mockResolvedValue({
      content: '{"category":"billing"}',
      metadata: { requestId: 'gateway', costUsd: 0.0001 },
    });
    const response = await send({
      action: 'case',
      runId,
      model: 'evaluator',
      caseId: 'sup-01',
      scenario: 'classification',
    });
    expect(await response.json()).toMatchObject({
      result: {
        evaluation: { valid: true, accuracy: 1, passed: true },
        metadata: { requestId: 'gateway' },
      },
      receipt: 'signed-test-only',
    });
    expect(mocks.complete).toHaveBeenCalledWith(
      expect.objectContaining({ max_tokens: 400, model: 'evaluator' }),
      expect.stringContaining(runId),
    );
  });
  it('routes a selected permitted model ID to Otari without changing analyst dispatch', async () => {
    mocks.complete.mockResolvedValue({
      content: JSON.stringify({
        supplier: 'Alder Studio',
        invoiceNumber: 'AS-1042',
        date: '2026-10-02',
        amount: 1250,
        currency: 'USD',
        paymentReference: 'ALDER1042',
      }),
      metadata: {
        requestId: 'gateway-llama-test',
        requestedModel: 'analyst',
        effectiveModel: 'llama-served',
      },
    });
    const response = await send({
      action: 'case',
      runId,
      model: 'analyst',
      caseId: 'inv-01',
      scenario: 'extraction',
    });
    expect(response.status).toBe(200);
    expect(mocks.complete).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'analyst' }),
      expect.stringContaining(runId),
    );
    expect((await response.json()).result.model).toBe('analyst');
  });
  it('retains partial case failures without fixture substitution', async () => {
    mocks.complete.mockRejectedValue(
      new OtariError({
        code: 'budget_exceeded',
        message: 'Budget refused',
        status: 403,
        retryAfter: '60',
        requestId: 'real-id',
      }),
    );
    const response = await send({
      action: 'case',
      runId,
      model: 'evaluator',
      caseId: 'sup-01',
      scenario: 'classification',
    });
    const data = await response.json();
    expect(data.result.error.code).toBe('budget_exceeded');
    expect(data.result.output).toBeUndefined();
    expect(data.result.evaluation).toBeUndefined();
  });
  it('does not claim workspace-disabled web retrieval', async () => {
    const response = await send({ action: 'web', runId, source: 'manifesto' });
    expect(response.status).toBe(409);
    expect((await response.json()).error.code).toBe('tool_unavailable');
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it('uses only the fixed public MCP source and requires gateway activity to verify', async () => {
    mocks.completeWithMcpActivity.mockResolvedValue({
      content: 'Otari documents managed MCP.',
      metadata: { requestId: 'gateway-mcp-1' },
      mcpActivity: [
        {
          type: 'mcp_tool_use',
          callId: 'call-1',
          name: 'read_wiki_structure',
          input: { repoName: 'mozilla-ai/otari' },
        },
        {
          type: 'mcp_tool_result',
          isError: false,
          result: 'docs/mcp.md',
        },
      ],
      streamComplete: true,
    });
    const response = await send({ action: 'mcp', runId });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      experiment: 'mcp',
      verified: true,
      source: { repository: 'mozilla-ai/otari' },
    });
    expect(mocks.completeWithMcpActivity).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'evaluator',
        max_tool_iterations: 2,
        mcp_servers: [
          expect.objectContaining({
            url: 'https://mcp.deepwiki.com/mcp',
            allowed_tools: ['read_wiki_structure'],
          }),
        ],
      }),
      expect.stringContaining(runId),
    );
  });
  it('does not verify an ambiguous or failed MCP result', async () => {
    mocks.completeWithMcpActivity.mockResolvedValue({
      content: 'Repository summary.',
      metadata: { requestId: 'gateway-mcp-2' },
      mcpActivity: [
        {
          type: 'mcp_tool_use',
          callId: 'call-1',
          name: 'read_wiki_structure',
          input: { repoName: 'mozilla-ai/otari' },
        },
        {
          type: 'mcp_tool_result',
          callId: null,
          name: null,
          isError: true,
          result: 'failed',
        },
      ],
      streamComplete: true,
    });
    const response = await send({ action: 'mcp', runId });
    expect((await response.json()).verified).toBe(false);
  });
  it('checks actual sandbox exit and metrics', async () => {
    mocks.request.mockResolvedValue({
      body: {
        object: 'code_execution.result',
        stdout: '{"correct":4,"total":5,"accuracy":0.8}',
        return_code: 0,
      },
      headers: new Headers({ 'otari-request-id': 'code-real' }),
      latencyMs: 20,
    });
    const data = await (await send({ action: 'code', runId })).json();
    expect(data.verified).toBe(true);
    expect(data.metadata.requestId).toBe('code-real');
    expect(mocks.request).toHaveBeenCalledWith(
      '/code/execute',
      expect.objectContaining({ timeout_seconds: 5 }),
      expect.any(String),
    );
  });
  it('rejects nonzero sandbox exits as verification', async () => {
    mocks.request.mockResolvedValue({
      body: { stdout: '{"accuracy":0.8}', return_code: 1 },
      headers: new Headers(),
      latencyMs: 1,
    });
    expect((await (await send({ action: 'code', runId })).json()).verified).toBe(false);
  });
  it('verifies policy resolution while preserving an absent fallback event', async () => {
    mocks.complete.mockResolvedValue({
      content: '{"category":"billing"}',
      metadata: {
        requestId: 'route-1',
        requestedModel: 'policy',
        effectiveModel: 'Qwen/Qwen3.8-27B',
        provider: 'deepinfra',
        attempts: 1,
        fallback: false,
      },
    });
    const result = await (await send({ action: 'routing', runId })).json();
    expect(result.verified).toBe(true);
    expect(result.completion.metadata.fallback).toBe(false);
  });
  it('does not verify routing without gateway identity metadata', async () => {
    mocks.complete.mockResolvedValue({ content: 'billing', metadata: { fallback: false } });
    expect((await (await send({ action: 'routing', runId })).json()).verified).toBe(false);
  });
  it('records unavailable guardrails without claiming a pass', async () => {
    mocks.complete.mockRejectedValue(
      new OtariError({
        code: 'guardrail_unavailable',
        message: 'Unavailable',
        status: 502,
        retryAfter: null,
        requestId: 'guardrail-id',
      }),
    );
    const response = await send({ action: 'guardrail', runId });
    expect(response.status).toBe(502);
    expect((await response.json()).verified).toBe(false);
  });
  it('uses a separate analyst model for signed metrics', async () => {
    mocks.complete.mockResolvedValue({
      content: 'Diagnostic',
      metadata: { requestId: 'analyst-id' },
    });
    expect(
      (await send({ action: 'analyst', runId, objective: 'balanced', receipts: ['receipt'] }))
        .status,
    ).toBe(200);
    expect(mocks.complete).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'analyst', max_tokens: 500 }),
      expect.any(String),
    );
  });
});
