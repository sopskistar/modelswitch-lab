import { z } from 'zod';
export const PUBLIC_LIMITS = {
  maxCases: 5,
  maxModels: 2,
  maxOutputTokens: 400,
  maxAnalystTokens: 500,
  maxRequestsPerRun: 11,
  dailyRequests: 120,
  requestsPerMinute: 12,
  maxBodyBytes: 64000,
} as const;
export const requestSchema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('case'),
      scenario: z.enum(['extraction', 'classification', 'reasoning']),
      caseId: z.string().max(24),
      model: z.string().min(1).max(160),
      runId: z.uuid(),
    })
    .strict(),
  z
    .object({
      action: z.literal('analyst'),
      runId: z.uuid(),
      receipts: z.array(z.string().min(1).max(15000)).min(1).max(10),
      objective: z.enum(['balanced', 'quality', 'speed', 'cost']),
    })
    .strict(),
  z
    .object({
      action: z.enum(['routing', 'guardrail', 'web', 'code', 'mcp']),
      runId: z.uuid(),
      source: z.enum(['manifesto', 'otari']).optional(),
    })
    .strict(),
]);
export const sources = {
  manifesto: { title: 'Mozilla Manifesto', url: 'https://www.mozilla.org/en-US/about/manifesto/' },
  otari: {
    title: 'Otari README',
    url: 'https://raw.githubusercontent.com/mozilla-ai/otari/main/README.md',
  },
} as const;
export function safeSourceUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('Invalid source URL.');
  }
  if (
    url.protocol !== 'https:' ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !Object.values(sources).some((s) => s.url === url.href)
  )
    throw new Error('Choose an exact allowlisted public document URL.');
  return url.href;
}
