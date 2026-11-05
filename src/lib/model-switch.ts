import type { CaseResult, Model } from './types';

export interface ModelRoles {
  evaluator: string;
  analyst: string;
}

export function switchableModels(models: Model[], roles: ModelRoles): Model[] {
  const allowed = new Set([roles.evaluator, roles.analyst].filter(Boolean));
  return models.filter(
    (model, index) => allowed.has(model.id) && models.findIndex((m) => m.id === model.id) === index,
  );
}

export function isSwitchableModel(modelId: string, models: Model[], roles: ModelRoles): boolean {
  return switchableModels(models, roles).some((model) => model.id === modelId);
}

export function switchRecommendation(results: CaseResult[]): CaseResult | undefined {
  const latestByModel = new Map<string, CaseResult>();
  for (const result of results) {
    if (!result.evaluation?.valid || result.error || result.skipped) continue;
    if (!latestByModel.has(result.model)) latestByModel.set(result.model, result);
  }
  return [...latestByModel.values()].sort((a, b) => {
    const accuracy = (b.evaluation?.accuracy ?? -1) - (a.evaluation?.accuracy ?? -1);
    if (accuracy) return accuracy;
    const validity = Number(b.evaluation?.valid) - Number(a.evaluation?.valid);
    if (validity) return validity;
    const latency = (a.metadata?.latencyMs ?? Infinity) - (b.metadata?.latencyMs ?? Infinity);
    if (latency) return latency;
    const cost = (a.metadata?.costUsd ?? Infinity) - (b.metadata?.costUsd ?? Infinity);
    if (cost) return cost;
    return a.model.localeCompare(b.model);
  })[0];
}

export function switchResultStatus(result: CaseResult): string {
  if (result.skipped) return 'Not sent';
  if (result.error) {
    if (result.error.code === 'application_timeout')
      return 'Application wait deadline reached; gateway outcome unknown';
    if (result.error.code === 'gateway_timeout') return 'Otari gateway timed out';
    if (result.error.code === 'function_timeout')
      return 'Application endpoint returned HTTP 504; Otari outcome unknown';
    if (result.error.code === 'browser_wait_timeout')
      return 'Browser stopped waiting; request outcome unknown';
    if (result.error.code === 'network_error' || result.error.code === 'network_interrupted')
      return 'Network connection interrupted; request outcome unknown';
    if (result.error.code === 'budget_exceeded') return 'Otari budget refused the request';
    if (result.error.code === 'insufficient_credit') return 'Otari account has insufficient funds';
    if (result.error.code === 'rate_limit' || result.error.code === 'demo_limit')
      return 'Request rate limited';
    if (result.error.code === 'tool_unavailable') return 'Gateway tool unavailable';
    if (result.error.code === 'forbidden' || result.error.code === 'authentication')
      return 'Gateway authorization refused';
    return 'Gateway request failed';
  }
  if (!result.evaluation?.valid) return 'Invalid structured output';
  if (!result.evaluation.passed) return 'Incorrect answer';
  return 'Passed this fixture';
}
