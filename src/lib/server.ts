import 'server-only';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { OtariClient, OtariError } from './otari';
import type { CaseResult, Model, Tool } from './types';
import { PUBLIC_LIMITS } from './security';

export function roleModels() {
  return {
    evaluator: process.env.OTARI_EVALUATOR_MODEL || '',
    analyst: process.env.OTARI_ANALYST_MODEL || '',
    policy: process.env.OTARI_FALLBACK_POLICY || '',
  };
}
let catalog: { models: Model[]; tools: Tool[]; at: number } | undefined;
let pending: Promise<NonNullable<typeof catalog>> | undefined;
export async function discover() {
  if (catalog && Date.now() - catalog.at < 60000) return catalog;
  if (pending) return pending;
  pending = (async () => {
    const client = new OtariClient();
    const [models, toolResult] = await Promise.all([
      client.models(),
      client
        .tools()
        .then((tools) => ({ tools }))
        .catch(() => ({ tools: [] as Tool[] })),
    ]);
    return (catalog = { models, tools: toolResult.tools, at: Date.now() });
  })();
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
export function demoEnabled() {
  return process.env.VERCEL
    ? process.env.PUBLIC_DEMO_ENABLED === 'true' &&
        Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
    : process.env.PUBLIC_DEMO_ENABLED !== 'false';
}
export function signReceipt(result: CaseResult, runId: string) {
  const data = Buffer.from(
    JSON.stringify({ result, runId, expires: Date.now() + 60 * 60 * 1000 }),
  ).toString('base64url');
  const signature = createHmac('sha256', process.env.OTARI_API_KEY!)
    .update('modelswitch-receipt-v1:' + data)
    .digest('base64url');
  return data + '.' + signature;
}
export function readReceipt(token: string, runId: string): CaseResult {
  const [data, signature, ...rest] = token.split('.');
  if (!data || !signature || rest.length) throw new Error('Invalid receipt.');
  const expected = createHmac('sha256', process.env.OTARI_API_KEY!)
    .update('modelswitch-receipt-v1:' + data)
    .digest();
  const provided = Buffer.from(signature, 'base64url');
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided))
    throw new Error('Invalid receipt signature.');
  const record = JSON.parse(Buffer.from(data, 'base64url').toString());
  if (record.runId !== runId || record.expires < Date.now())
    throw new Error('Receipt expired or belongs to another run.');
  return record.result;
}
const localCounters = new Map<string, { count: number; end: number }>();
export async function enforceRate(request: Request) {
  const fingerprint = createHash('sha256')
    .update(request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local')
    .digest('hex')
    .slice(0, 24);
  const day = Math.floor(Date.now() / 86400000),
    minute = Math.floor(Date.now() / 60000);
  const rules = [
    { key: `msl:day:${day}`, ttl: 86400, limit: PUBLIC_LIMITS.dailyRequests },
    { key: `msl:minute:${fingerprint}:${minute}`, ttl: 60, limit: PUBLIC_LIMITS.requestsPerMinute },
  ];
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // One atomic Lua call: global and per-client limits apply across serverless instances.
    const script =
      "local a=redis.call('INCR',KEYS[1]); if a==1 then redis.call('EXPIRE',KEYS[1],ARGV[1]) end; local b=redis.call('INCR',KEYS[2]); if b==1 then redis.call('EXPIRE',KEYS[2],ARGV[2]) end; return {a,b}";
    const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        'EVAL',
        script,
        2,
        ...rules.map((r) => r.key),
        ...rules.map((r) => r.ttl),
      ]),
      signal: AbortSignal.timeout(3000),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('The demo rate limiter is unavailable.');
    const data = await response.json();
    if (!Array.isArray(data.result) || data.result.length !== 2)
      throw new Error('Invalid rate limiter response.');
    if (data.result.some((n: number, i: number) => n > rules[i].limit))
      throw new OtariError({
        code: 'demo_limit',
        message:
          'The demo request allowance is used up. Try again after the current window resets.',
        status: 429,
        retryAfter: '60',
        requestId: null,
      });
  } else {
    if (process.env.VERCEL) throw new Error('A durable demo rate limiter is required on Vercel.');
    for (const [key, value] of localCounters) if (value.end < Date.now()) localCounters.delete(key);
    for (const rule of rules) {
      const item = localCounters.get(rule.key) ?? { count: 0, end: Date.now() + rule.ttl * 1000 };
      item.count++;
      localCounters.set(rule.key, item);
      if (item.count > rule.limit)
        throw new OtariError({
          code: 'demo_limit',
          message: 'The local demo request allowance is used up. Wait before retrying.',
          status: 429,
          retryAfter: String(rule.ttl),
          requestId: null,
        });
    }
  }
}
let active = 0;
export async function bounded<T>(fn: () => Promise<T>) {
  if (active >= 2)
    throw new OtariError({
      code: 'busy',
      message: 'Two requests are already running. Wait for them to finish.',
      status: 429,
      retryAfter: '5',
      requestId: null,
    });
  active++;
  try {
    return await fn();
  } finally {
    active--;
  }
}
export async function readBody(request: Request) {
  if (Number(request.headers.get('content-length')) > PUBLIC_LIMITS.maxBodyBytes)
    throw new Error('Request is too large.');
  if (!request.headers.get('content-type')?.includes('application/json'))
    throw new Error('Use application/json.');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('A JSON body is required.');
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > PUBLIC_LIMITS.maxBodyBytes) {
      await reader.cancel();
      throw new Error('Request is too large.');
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
