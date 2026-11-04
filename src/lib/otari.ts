import 'server-only';
import { z } from 'zod';
import type { Completion, GatewayMetadata, JsonRecord, Model, SafeError, Tool } from './types';

export class OtariError extends Error {
  constructor(
    public safe: SafeError,
    public metadata?: Partial<GatewayMetadata>,
  ) {
    super(safe.message);
  }
}
export function normalizeError(
  status: number,
  headers = new Headers(),
  body: unknown = null,
): SafeError {
  const code = headers.get('Otari-Error-Code');
  const text = JSON.stringify(body ?? '').toLowerCase();
  const kind =
    code === 'budget_exceeded' || /budget.*exceed|budget remaining/.test(text)
      ? 'budget_exceeded'
      : code === 'guardrail_violation' || /guardrail_violation/.test(text)
        ? 'guardrail_violation'
        : /guardrail/.test(text) && status >= 500
          ? 'guardrail_unavailable'
          : status === 421
            ? 'wrong_region'
            : status === 401
              ? 'authentication'
              : status === 402 || /insufficient.*(credit|balance)|balance.*insufficient/.test(text)
                ? 'insufficient_credit'
                : status === 429
                  ? 'rate_limit'
                  : status === 404
                    ? 'not_found'
                    : /tool.*(unavailable|disabled|not.configured)|sandbox/.test(text)
                      ? 'tool_unavailable'
                      : status === 403
                        ? 'forbidden'
                        : status === 408 || status === 504
                          ? 'timeout'
                          : 'gateway_error';
  const messages: Record<string, string> = {
    budget_exceeded:
      'Otari refused the request at a budget boundary. Check the key or workspace budget.',
    guardrail_violation: 'Otari blocked the controlled input with an inference guardrail.',
    guardrail_unavailable: 'Otari could not evaluate the guardrail and failed closed.',
    wrong_region: 'This key belongs to another Otari region. Check OTARI_BASE_URL.',
    authentication:
      'Otari authentication failed. Check the server-side key and account permissions.',
    insufficient_credit: 'The Otari account has insufficient credit.',
    rate_limit: 'The request limit was reached. Wait before retrying.',
    not_found: 'Otari could not find this model, policy, or endpoint. Refresh discovery.',
    tool_unavailable: 'The hosted Otari tool is unavailable or disabled for this workspace.',
    forbidden: 'The Otari key is not permitted to perform this request.',
    timeout:
      'The Otari request timed out. It may still have incurred usage; inspect its request ID before retrying.',
    gateway_error: 'Otari could not complete this request. Inspect the request ID in the gateway.',
  };
  return {
    code: kind,
    message: messages[kind],
    status,
    retryAfter: headers.get('retry-after'),
    requestId: headers.get('otari-request-id'),
  };
}
export function hostedBase(value: string | undefined) {
  const base = (value || 'https://api.otari.ai/api/v1').replace(/\/$/, '');
  if (!['https://api.otari.ai/api/v1', 'https://eu.api.otari.ai/api/v1'].includes(base))
    throw new OtariError({
      code: 'configuration',
      message: 'OTARI_BASE_URL must be a supported hosted Otari API URL.',
      status: 503,
      retryAfter: null,
      requestId: null,
    });
  return base;
}
const finite = (v: unknown): number | null =>
  ((typeof v === 'string' && v.trim() !== '') || typeof v === 'number') &&
  Number.isFinite(Number(v)) &&
  Number(v) >= 0
    ? Number(v)
    : null;
export function metadataFrom(
  body: JsonRecord,
  headers: Headers,
  requestedModel: string,
  latencyMs: number,
): GatewayMetadata {
  const usage = (body.usage ?? {}) as JsonRecord;
  const safeHeaders: Record<string, string> = {};
  for (const key of [
    'otari-request-id',
    'otari-provider',
    'otari-model',
    'otari-attempt-count',
    'otari-fallback',
    'otari-response-duration-ms',
    'otari-guardrails',
    'otari-error-code',
    'otari-budget-scope',
    'otari-end-user-budget',
    'server-timing',
    'retry-after',
    'otari-container-id',
  ]) {
    const v = headers.get(key);
    if (v !== null) safeHeaders[key] = v;
  }
  let guardrails: unknown = null;
  try {
    guardrails = JSON.parse(headers.get('otari-guardrails') || 'null');
  } catch {
    /* retain header for inspection */
  }
  return {
    requestId: headers.get('otari-request-id'),
    responseId: typeof body.id === 'string' ? body.id : null,
    requestedModel,
    responseModel: typeof body.model === 'string' ? body.model : null,
    effectiveModel: headers.get('otari-model'),
    provider: headers.get('otari-provider'),
    attempts: finite(headers.get('otari-attempt-count')),
    fallback: headers.has('otari-fallback') ? headers.get('otari-fallback') === 'true' : null,
    gatewayDurationMs: finite(headers.get('otari-response-duration-ms')),
    latencyMs: Math.round(latencyMs),
    promptTokens: finite(usage.prompt_tokens),
    completionTokens: finite(usage.completion_tokens),
    totalTokens: finite(usage.total_tokens),
    costUsd: finite(usage.cost_usd),
    pricingSource: typeof usage.pricing_source === 'string' ? usage.pricing_source : null,
    toolCalls: Array.isArray(body.otari_tool_calls) ? (body.otari_tool_calls as JsonRecord[]) : [],
    guardrails,
    headers: safeHeaders,
  };
}
export function parseCompletion(
  body: JsonRecord,
  headers: Headers,
  model: string,
  latency: number,
): Completion {
  const metadata = metadataFrom(body, headers, model, latency);
  const choices = body.choices as { message?: { content?: unknown } }[] | undefined;
  const content = choices?.[0]?.message?.content;
  const text =
    typeof content === 'string'
      ? content
      : Array.isArray(content)
        ? content.map((x) => (typeof x?.text === 'string' ? x.text : '')).join('')
        : '';
  if (!text.trim())
    throw new OtariError(
      {
        code: 'empty_response',
        message: 'Otari returned no answer text. Usage, if reported, is retained.',
        status: 502,
        retryAfter: null,
        requestId: metadata.requestId,
      },
      metadata,
    );
  return { content: text, metadata };
}
export interface CompletionRequest {
  model: string;
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: 'json_object' };
  metadata?: Record<string, string>;
  tools?: JsonRecord[];
  guardrails?: JsonRecord[];
  max_tool_iterations?: number;
}
export class OtariClient {
  readonly base: string;
  constructor(
    private key = process.env.OTARI_API_KEY,
    base = process.env.OTARI_BASE_URL,
    private timeoutMs = 22000,
    private fetcher: typeof fetch = fetch,
  ) {
    this.base = hostedBase(base);
  }
  async request(
    path: string,
    body?: unknown,
    idempotencyKey?: string,
  ): Promise<{ body: JsonRecord; headers: Headers; latencyMs: number }> {
    if (!this.key)
      throw new OtariError({
        code: 'configuration_required',
        message: 'Set OTARI_API_KEY on the server to connect to hosted Otari.',
        status: 503,
        retryAfter: null,
        requestId: null,
      });
    const start = performance.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(this.base + path, {
        method: body ? 'POST' : 'GET',
        headers: {
          Authorization: `Bearer ${this.key}`,
          'Content-Type': 'application/json',
          ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        cache: 'no-store',
        redirect: 'error',
      });
      const raw = await response.text();
      let parsed: JsonRecord = {};
      try {
        parsed = JSON.parse(raw);
      } catch {
        if (response.ok)
          throw new OtariError({
            code: 'invalid_response',
            message: 'Otari returned an invalid JSON envelope.',
            status: 502,
            retryAfter: null,
            requestId: response.headers.get('otari-request-id'),
          });
      }
      if (!response.ok)
        throw new OtariError(
          normalizeError(response.status, response.headers, parsed),
          metadataFrom(
            parsed,
            response.headers,
            typeof (body as JsonRecord)?.model === 'string'
              ? String((body as JsonRecord).model)
              : path,
            performance.now() - start,
          ),
        );
      return { body: parsed, headers: response.headers, latencyMs: performance.now() - start };
    } catch (err) {
      if (err instanceof OtariError) throw err;
      throw new OtariError({
        code: controller.signal.aborted ? 'timeout' : 'network_error',
        message: controller.signal.aborted
          ? 'Otari timed out. Do not automatically retry: the request may be billed.'
          : 'Could not reach hosted Otari. Check network connectivity and region.',
        status: controller.signal.aborted ? 504 : 502,
        retryAfter: null,
        requestId: null,
      });
    } finally {
      clearTimeout(timer);
    }
  }
  async models(): Promise<Model[]> {
    const { body } = await this.request('/models');
    return z
      .array(
        z.object({
          id: z.string(),
          name: z.string().optional(),
          owned_by: z.string().optional(),
          type: z.string().optional(),
          supported_parameters: z.array(z.string()).optional(),
          pricing: z
            .object({
              input_price_per_million: z.number().optional(),
              output_price_per_million: z.number().optional(),
            })
            .optional(),
        }),
      )
      .parse(body.data);
  }
  async tools(): Promise<Tool[]> {
    const { body } = await this.request('/tools');
    return z
      .array(
        z.object({
          id: z.string(),
          available: z.boolean(),
          reason: z.string().nullable().optional(),
        }),
      )
      .parse(body.data);
  }
  async complete(input: CompletionRequest, idempotencyKey?: string): Promise<Completion> {
    if (input.max_tokens !== undefined && (input.max_tokens > 700 || input.max_tokens < 1))
      throw new Error('Output token limit must be 1–700.');
    const { body, headers, latencyMs } = await this.request(
      '/chat/completions',
      { ...input, max_tokens: input.max_tokens ?? 400 },
      idempotencyKey,
    );
    return parseCompletion(body, headers, input.model, latencyMs);
  }
}
