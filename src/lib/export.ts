import type { Run } from './types';
export function exportJson(run: Run) {
  return (
    JSON.stringify(
      {
        receiptVersion: 1,
        application: 'ModelSwitch Lab',
        runId: run.id,
        executedAt: run.startedAt,
        startedAt: run.startedAt,
        completedAt:
          [...run.trace].reverse().find((event) => event.label === 'Benchmark finished')?.at ??
          null,
        executionStatus: run.state,
        scenario: run.scenario,
        datasetVersion: 1,
        scoringMethodVersion: 1,
        objective: run.objective,
        modelIds: run.models,
        caseCountPerModel: run.caseCount,
        results: run.summaries,
        cases: run.cases.map((result) => ({
          modelId: result.model,
          caseId: result.caseId,
          status: result.skipped
            ? 'skipped'
            : result.error
              ? 'error'
              : result.evaluation?.passed
                ? 'passed'
                : 'failed',
          evaluation: result.evaluation ?? null,
          request: result.metadata
            ? {
                requestId: result.metadata.requestId,
                requestedModel: result.metadata.requestedModel,
                respondingModel: result.metadata.effectiveModel ?? result.metadata.responseModel,
                provider: result.metadata.provider,
                attempts: result.metadata.attempts,
                fallback: result.metadata.fallback,
                toolCalls: result.metadata.toolCalls,
                latencyMs: result.metadata.latencyMs,
                gatewayDurationMs: result.metadata.gatewayDurationMs,
                promptTokens: result.metadata.promptTokens,
                completionTokens: result.metadata.completionTokens,
                totalTokens: result.metadata.totalTokens,
                reportedCostUsd: result.metadata.costUsd,
                pricingSource: result.metadata.pricingSource,
              }
            : null,
          error: result.error ?? null,
        })),
        analyst: run.analyst
          ? {
              interpretation: run.analyst.content,
              requestId: run.analyst.metadata.requestId,
              requestedModel: run.analyst.metadata.requestedModel,
              respondingModel:
                run.analyst.metadata.effectiveModel ?? run.analyst.metadata.responseModel,
              provider: run.analyst.metadata.provider,
              attempts: run.analyst.metadata.attempts,
              fallback: run.analyst.metadata.fallback,
              toolCalls: run.analyst.metadata.toolCalls,
              latencyMs: run.analyst.metadata.latencyMs,
              gatewayDurationMs: run.analyst.metadata.gatewayDurationMs,
              reportedCostUsd: run.analyst.metadata.costUsd,
              totalTokens: run.analyst.metadata.totalTokens,
            }
          : null,
        analystError: run.analystError ?? null,
        events: run.trace,
        methodology:
          'Normalized exact field matches; schema strict; missing cost axes omitted for all models. Results describe only these synthetic cases.',
        limitations: [
          'Small synthetic benchmark samples do not establish universal model superiority.',
          'Costs and usage are reported only when Otari returned them; missing values remain unknown.',
          'This receipt is an application export, not a cryptographic signature or external attestation.',
        ],
      },
      null,
      2,
    ) + '\n'
  );
}
export function exportCsv(run: Run) {
  const cell = (x: unknown) =>
    '"' +
    String(x ?? '')
      .replace(/"/g, '""')
      .replace(/^[=+@-]/, "'$&") +
    '"';
  return (
    [
      [
        'run',
        'scenario',
        'model',
        'case',
        'status',
        'accuracy',
        'latency_ms',
        'reported_cost_usd',
        'gateway_request_id',
      ],
      ...run.cases.map((c) => [
        run.id,
        run.scenario,
        c.model,
        c.caseId,
        c.skipped ? 'skipped' : (c.error?.code ?? (c.evaluation?.passed ? 'passed' : 'failed')),
        c.evaluation?.accuracy,
        c.metadata?.latencyMs,
        c.metadata?.costUsd,
        c.metadata?.requestId,
      ]),
    ]
      .map((row) => row.map(cell).join(','))
      .join('\r\n') + '\r\n'
  );
}
