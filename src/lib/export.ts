import type { Run } from './types';
export function exportJson(run: Run) {
  return (
    JSON.stringify(
      {
        application: 'ModelSwitch Lab',
        ...run,
        methodology:
          'Normalized exact field matches; schema strict; missing cost axes omitted for all models. Results describe only these synthetic cases.',
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
