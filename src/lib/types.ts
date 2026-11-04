export type ScenarioId = 'extraction' | 'classification' | 'reasoning';
export type Objective = 'balanced' | 'quality' | 'speed' | 'cost';
export type JsonRecord = Record<string, unknown>;
export interface Model {
  id: string;
  name?: string;
  owned_by?: string;
  type?: string;
  supported_parameters?: string[];
  pricing?: { input_price_per_million?: number; output_price_per_million?: number };
}
export interface Tool {
  id: string;
  available: boolean;
  reason?: string | null;
}
export interface GatewayMetadata {
  requestId: string | null;
  responseId: string | null;
  requestedModel: string;
  responseModel: string | null;
  effectiveModel: string | null;
  provider: string | null;
  attempts: number | null;
  fallback: boolean | null;
  gatewayDurationMs: number | null;
  latencyMs: number;
  promptTokens: number | null;
  completionTokens: number | null;
  totalTokens: number | null;
  costUsd: number | null;
  pricingSource: string | null;
  toolCalls: JsonRecord[];
  guardrails: unknown;
  headers: Record<string, string>;
}
export interface Completion {
  content: string;
  metadata: GatewayMetadata;
}
export interface SafeError {
  code: string;
  message: string;
  status: number;
  retryAfter: string | null;
  requestId: string | null;
}
export interface CaseFixture {
  id: string;
  title: string;
  input: string;
  expected: Record<string, string | number | null>;
}
export interface FieldScore {
  field: string;
  expected: unknown;
  actual: unknown;
  match: boolean;
}
export interface Evaluation {
  valid: boolean;
  accuracy: number;
  passed: boolean;
  missing: number;
  fields: FieldScore[];
  error?: string;
}
export interface CaseResult {
  model: string;
  caseId: string;
  output?: string;
  evaluation?: Evaluation;
  metadata?: GatewayMetadata;
  error?: SafeError;
  skipped?: boolean;
}
export interface ModelSummary {
  model: string;
  accuracy: number;
  passRate: number;
  schemaRate: number;
  failureRate: number;
  failures: number;
  skipped: number;
  meanLatencyMs: number | null;
  costUsd: number | null;
  reportedCostUsd: number;
  costsComplete: boolean;
  tokens: number | null;
  missingFieldRate: number;
  score: number;
  weights: number[];
}
export interface TraceEvent {
  at: string;
  source: 'application' | 'gateway';
  label: string;
  detail: unknown;
}
export interface Run {
  version: 1;
  id: string;
  startedAt: string;
  scenario: ScenarioId;
  objective: Objective;
  models: string[];
  caseCount: number;
  cases: CaseResult[];
  trace: TraceEvent[];
  summaries: ModelSummary[];
  analyst?: Completion;
  analystError?: SafeError;
  state: 'running' | 'complete' | 'interrupted';
}
