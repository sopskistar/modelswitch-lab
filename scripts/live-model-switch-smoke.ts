import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';

const base = (process.env.MODELSWITCH_BASE_URL || 'https://modelswitch-lab.vercel.app').replace(
  /\/$/,
  '',
);
const models = ['alibaba/qwen3.8-27b', 'meta/llama-3.3-70b-instruct'];
const requests: Record<string, unknown>[] = [];

for (const model of models) {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();
  try {
    const response = await fetch(`${base}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'case',
        scenario: 'extraction',
        caseId: 'inv-01',
        model,
        runId,
      }),
      signal: AbortSignal.timeout(29000),
    });
    const body = await response.json();
    const result = body?.result;
    requests.push({
      startedAt,
      applicationHttpStatus: response.status,
      runId,
      caseId: 'inv-01',
      requestedModel: model,
      result: result
        ? {
            model: result.model,
            output: result.output,
            evaluation: result.evaluation,
            error: result.error,
            metadata: result.metadata
              ? {
                  requestedModel: result.metadata.requestedModel,
                  responseModel: result.metadata.responseModel,
                  effectiveModel: result.metadata.effectiveModel,
                  provider: result.metadata.provider,
                  requestId: result.metadata.requestId,
                  attempts: result.metadata.attempts,
                  fallback: result.metadata.fallback,
                  latencyMs: result.metadata.latencyMs,
                  costUsd: result.metadata.costUsd,
                  totalTokens: result.metadata.totalTokens,
                }
              : null,
          }
        : null,
      error: body?.error
        ? {
            code: body.error.code,
            message: body.error.message,
            status: body.error.status,
            requestId: body.error.requestId,
          }
        : null,
    });
  } catch {
    requests.push({
      startedAt,
      applicationHttpStatus: null,
      runId,
      caseId: 'inv-01',
      requestedModel: model,
      networkError: 'No response received. Inspect gateway records before retrying.',
    });
  }
}

const evidence = {
  recordVersion: 1,
  capturedAt: new Date().toISOString(),
  productionUrl: base,
  execution:
    'Two sequential calls through the public ModelSwitch Lab bounded case route; synthetic fixture inv-01; no retries.',
  fixture: {
    scenario: 'extraction',
    datasetVersion: 1,
    caseId: 'inv-01',
    description: 'Synthetic Alder Studio invoice with six known fields.',
  },
  requests,
  limitations: [
    'These requests verify gateway model identities for one synthetic fixture; they do not establish a general model ranking.',
    'The production UI deployment SHA is not inferred from the presence of this API route.',
    'Application receipts are intentionally excluded from this public evidence file.',
  ],
};
await writeFile('evidence/model-switch-production.json', JSON.stringify(evidence, null, 2) + '\n');
console.log(
  JSON.stringify(
    requests.map((item) => ({
      requestedModel: item.requestedModel,
      applicationHttpStatus: item.applicationHttpStatus,
      requestId: (item.result as Record<string, unknown> | null)?.metadata
        ? ((item.result as { metadata: Record<string, unknown> }).metadata.requestId ?? null)
        : ((item.error as Record<string, unknown> | null)?.requestId ?? null),
      error: (item.result as Record<string, unknown> | null)?.error ?? item.error ?? null,
    })),
    null,
    2,
  ),
);
