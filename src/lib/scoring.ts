import { z } from 'zod';
import type {
  CaseFixture,
  CaseResult,
  Evaluation,
  ModelSummary,
  Objective,
  ScenarioId,
} from './types';
const schemas = {
  extraction: z
    .object({
      supplier: z.string().nullable(),
      invoiceNumber: z.string().nullable(),
      date: z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .nullable(),
      amount: z.number().finite().nullable(),
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/)
        .nullable(),
      paymentReference: z.string().nullable(),
    })
    .strict(),
  classification: z
    .object({ category: z.enum(['billing', 'technical', 'account', 'cancellation', 'general']) })
    .strict(),
  reasoning: z.object({ answer: z.union([z.string(), z.number().finite(), z.null()]) }).strict(),
};
export function normalize(value: unknown): unknown {
  return typeof value === 'string'
    ? value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()
    : value;
}
export function parseOutput(text: string): unknown {
  // Accept a single JSON code fence; never repair fields or search prose for an answer.
  return JSON.parse(
    text
      .trim()
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, ''),
  );
}
export function evaluate(scenario: ScenarioId, fixture: CaseFixture, output: string): Evaluation {
  let parsed: unknown;
  try {
    parsed = parseOutput(output);
  } catch {
    return {
      valid: false,
      accuracy: 0,
      passed: false,
      missing: Object.keys(fixture.expected).length,
      fields: [],
      error: 'Output is not JSON.',
    };
  }
  const schema = schemas[scenario].safeParse(parsed);
  const actual =
    parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  const fields = Object.entries(fixture.expected).map(([field, expected]) => ({
    field,
    expected,
    actual: actual[field] ?? null,
    match: field in actual && normalize(actual[field]) === normalize(expected),
  }));
  const missing = fields.filter(
    (f) => !(f.field in actual) || (actual[f.field] === null && f.expected !== null),
  ).length;
  const accuracy = fields.filter((f) => f.match).length / fields.length;
  return {
    valid: schema.success,
    accuracy,
    passed: schema.success && accuracy === 1,
    missing,
    fields,
    ...(!schema.success ? { error: 'Output does not match the scenario schema.' } : {}),
  };
}
export const weights: Record<Objective, number[]> = {
  balanced: [0.55, 0.2, 0.15, 0.1],
  quality: [0.8, 0.15, 0.025, 0.025],
  speed: [0.35, 0.15, 0.45, 0.05],
  cost: [0.4, 0.15, 0.05, 0.4],
};
export function recommendation(summaries: ModelSummary[]) {
  const winner = summaries.reduce<ModelSummary | undefined>(
    (best, row) => (row.score > 0 && (!best || row.score > best.score) ? row : best),
    undefined,
  );
  if (!winner) return undefined;
  const comparisons = summaries.filter((row) => row.model !== winner.model);
  return {
    winner,
    moreAccurate: comparisons.filter((row) => row.accuracy > winner.accuracy),
    lessAccurate: comparisons.filter((row) => row.accuracy < winner.accuracy),
    cheaper: comparisons.filter(
      (row) => row.costUsd !== null && winner.costUsd !== null && row.costUsd < winner.costUsd,
    ),
    moreExpensive: comparisons.filter(
      (row) => row.costUsd !== null && winner.costUsd !== null && row.costUsd > winner.costUsd,
    ),
  };
}
export function summarize(
  models: string[],
  cases: CaseResult[],
  objective: Objective,
): ModelSummary[] {
  const rows = models.map((model) => {
    const group = cases.filter((c) => c.model === model),
      n = group.length || 1;
    const done = group.filter((c) => !c.error && !c.skipped && c.evaluation);
    const metered = group.filter((c) => c.metadata);
    const costsComplete = group.length > 0 && group.every((c) => c.metadata?.costUsd != null);
    const latency = metered.map((c) => c.metadata!.latencyMs);
    const reportedCostUsd = metered.reduce((a, c) => a + (c.metadata!.costUsd ?? 0), 0);
    const totalFields = done.reduce(
      (a, c) => a + (c.evaluation!.fields.length || c.evaluation!.missing),
      0,
    );
    return {
      model,
      accuracy: group.reduce((a, c) => a + (c.evaluation?.accuracy ?? 0), 0) / n,
      passRate: done.filter((c) => c.evaluation!.passed).length / n,
      schemaRate: done.filter((c) => c.evaluation!.valid).length / n,
      failures: group.filter((c) => c.error || (c.evaluation && !c.evaluation.valid)).length,
      skipped: group.filter((c) => c.skipped).length,
      failureRate: group.filter((c) => c.error || c.skipped || !c.evaluation?.valid).length / n,
      meanLatencyMs: latency.length ? latency.reduce((a, b) => a + b, 0) / latency.length : null,
      costUsd: costsComplete ? reportedCostUsd : null,
      reportedCostUsd,
      costsComplete,
      tokens:
        metered.length && metered.every((c) => c.metadata!.totalTokens !== null)
          ? metered.reduce((a, c) => a + c.metadata!.totalTokens!, 0)
          : null,
      missingFieldRate: totalFields
        ? done.reduce((a, c) => a + c.evaluation!.missing, 0) / totalFields
        : 0,
      score: 0,
      weights: weights[objective],
    };
  });
  const knownLatencies = rows.flatMap((r) => (r.meanLatencyMs !== null ? [r.meanLatencyMs] : []));
  const fastest = knownLatencies.length ? Math.min(...knownLatencies) : null;
  const allCostsKnown = rows.every((r) => r.costUsd !== null);
  const cheapest = allCostsKnown ? Math.min(...rows.map((r) => r.costUsd!)) : null;
  return rows
    .map((r) => {
      const terms = [
        r.accuracy,
        1 - r.failureRate,
        r.meanLatencyMs === null || fastest === null
          ? null
          : r.meanLatencyMs === 0
            ? 1
            : fastest / r.meanLatencyMs,
        r.costUsd === null || cheapest === null ? null : r.costUsd === 0 ? 1 : cheapest / r.costUsd,
      ];
      // Omit unavailable axes for ALL models so scores stay comparable.
      const active = weights[objective].map((w, i) =>
        (i === 2 && rows.some((x) => x.meanLatencyMs === null)) || (i === 3 && !allCostsKnown)
          ? 0
          : w,
      );
      const denominator = active.reduce((a, b) => a + b, 0);
      const hasSuccess = cases.some((c) => c.model === r.model && c.evaluation?.valid && !c.error);
      return {
        ...r,
        weights: active.map((w) => w / denominator),
        score: hasSuccess
          ? (100 * terms.reduce<number>((a, t, i) => a + (t ?? 0) * active[i], 0)) / denominator
          : 0,
      };
    })
    .sort((a, b) => b.score - a.score);
}
