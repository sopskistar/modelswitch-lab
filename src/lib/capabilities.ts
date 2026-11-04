import type { Tool } from './types';
import verification from '../../evidence/verification.json';
interface EvidenceRecord {
  role: string;
  status: string;
  result?: {
    verified?: boolean;
    content?: string;
    evaluation?: { valid: boolean };
    metadata?: {
      requestId?: string | null;
      requestedModel?: string;
      effectiveModel?: string | null;
      fallback?: boolean | null;
    };
  };
}
const records = verification.records as EvidenceRecord[];
const completed = (role: string) =>
  records.filter(
    (r) => r.role === role && r.status === 'completed' && r.result?.metadata?.requestId,
  );
export const codeVerified = completed('code').some((r) => r.result?.verified === true);
export const rolesVerified = completed('evaluator').some(
  (e) =>
    e.result?.evaluation?.valid &&
    completed('analyst').some(
      (a) =>
        a.result?.content &&
        a.result.metadata?.effectiveModel &&
        a.result.metadata?.requestedModel !== e.result?.metadata?.requestedModel,
    ),
);
export const fallbackVerified = completed('routing').some(
  (r) => r.result?.metadata?.fallback === true,
);
export const advancedVerifiedPoints =
  10 * [codeVerified, rolesVerified, fallbackVerified].filter(Boolean).length;
export type CapabilityStatus =
  'Verified live' | 'Implemented, unverified' | 'Unavailable on account' | 'Not implemented';
export interface Capability {
  id: string;
  name: string;
  points: number;
  status: CapabilityStatus;
  detail: string;
  file: string;
}
export function capabilities(tools: Tool[] = []): Capability[] {
  const web = tools.find((t) => t.id === 'otari_web_fetch');
  return [
    {
      id: 'routing',
      name: 'Routing and fallbacks',
      points: 10,
      status: fallbackVerified ? 'Verified live' : 'Implemented, unverified',
      detail: fallbackVerified
        ? 'Actual gateway fallback recorded in serving headers.'
        : 'The policy served a real request. Observed attempt count 1, fallback false; actual failover remains unverified.',
      file: 'verification.json',
    },
    {
      id: 'mcp',
      name: 'MCP integration',
      points: 10,
      status: 'Not implemented',
      detail: 'No read-only MCP integration is configured or executed.',
      file: 'discovery.json',
    },
    {
      id: 'web',
      name: 'Web retrieval',
      points: 10,
      status: web && !web.available ? 'Unavailable on account' : 'Implemented, unverified',
      detail:
        web && !web.available
          ? `Hosted tool reports ${web.reason}.`
          : 'A curated document task uses the Otari fetch tool. Completed tool-call evidence is required.',
      file: 'discovery.json',
    },
    {
      id: 'code',
      name: 'Code execution',
      points: 10,
      status: codeVerified ? 'Verified live' : 'Implemented, unverified',
      detail: codeVerified
        ? 'Hosted /code/execute returned 4 correct of 5, accuracy 0.8, with a gateway request ID. Fixed control vectors.'
        : 'Fixed Python metric control through /code/execute. Availability alone does not verify execution.',
      file: 'verification.json',
    },
    {
      id: 'budgets',
      name: 'Budgets and spending limits',
      points: 10,
      status: 'Implemented, unverified',
      detail:
        'Setup guide and denial parsing are implemented. Insufficient account credit is not budget enforcement.',
      file: 'smoke.json',
    },
    {
      id: 'roles',
      name: 'Distinct model roles',
      points: 10,
      status: rolesVerified ? 'Verified live' : 'Implemented, unverified',
      detail: rolesVerified
        ? 'Qwen completed three scored tasks; a separate Llama call diagnosed their verified metrics. Actual identities and usage recorded.'
        : 'Evaluator performs tasks; a separate analyst interprets signed metrics. Successful execution evidence is still required.',
      file: 'verification.json',
    },
    {
      id: 'guardrail',
      name: 'Inference guardrails',
      points: 10,
      status: 'Unavailable on account',
      detail:
        'Hosted profile discovery reports no guardrails service. The safe fixture fails closed.',
      file: 'discovery.json',
    },
    {
      id: 'users',
      name: 'Per-user budgets',
      points: 10,
      status: 'Not implemented',
      detail: 'Requires a service key and genuine Otari end-user budgets.',
      file: 'discovery.json',
    },
  ];
}
