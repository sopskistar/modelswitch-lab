import type { Tool } from './types';
import verification from '../../evidence/verification.json';
import mcpProof from '../../evidence/mcp-status.json';
import routingProof from '../../evidence/routing-production.json';
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
export const routingVerified =
  routingProof.verification.routingPolicyResolution === true &&
  Boolean(
    routingProof.gateway.requestId &&
    routingProof.gateway.effectiveModel &&
    routingProof.gateway.provider,
  );
export const mcpVerified =
  mcpProof.liveExecution.verified === true && Boolean(mcpProof.liveExecution.requestId);
export const advancedVerifiedPoints =
  10 * [codeVerified, rolesVerified, routingVerified, mcpVerified].filter(Boolean).length;
export type CapabilityStatus =
  | 'Verified live'
  | 'Verified live this session'
  | 'Implemented, unverified'
  | 'Unavailable on account'
  | 'Not implemented';
export interface Capability {
  id: string;
  name: string;
  points: number;
  status: CapabilityStatus;
  detail: string;
  file: string;
}
export function capabilities(
  tools: Tool[] = [],
  mcpEvidence?: Record<string, unknown>,
): Capability[] {
  const web = tools.find((t) => t.id === 'otari_web_fetch');
  const mcpCompletion = mcpEvidence?.completion as
    | {
        metadata?: {
          requestId?: string | null;
          effectiveModel?: string | null;
          provider?: string | null;
        };
      }
    | undefined;
  const mcpRequestId = mcpCompletion?.metadata?.requestId;
  const mcpModel = mcpCompletion?.metadata?.effectiveModel;
  const mcpProvider = mcpCompletion?.metadata?.provider;
  const currentMcpVerified = mcpEvidence?.verified === true && typeof mcpRequestId === 'string';
  const proofRequestId = mcpProof.liveExecution.requestId;
  const proofEffectiveModel = mcpProof.liveExecution.effectiveModel;
  const proofProvider = mcpProof.liveExecution.provider;
  const hasMcpProof = mcpVerified && typeof proofRequestId === 'string';
  return [
    {
      id: 'routing',
      name: 'Routing and fallbacks',
      points: 10,
      status: routingVerified ? 'Verified live' : 'Implemented, unverified',
      detail: routingVerified
        ? `Otari routed ${routingProof.gateway.requestedPolicy} to ${routingProof.gateway.effectiveModel} through ${routingProof.gateway.provider}; attempt ${routingProof.gateway.attempts}, fallback ${routingProof.gateway.fallback}. Failover itself remains unverified.`
        : fallbackVerified
          ? 'Actual gateway fallback recorded in serving headers.'
          : 'The routing policy has not been verified with a live request and effective model/provider metadata.',
      file: routingVerified ? 'routing-production.json' : 'verification.json',
    },
    {
      id: 'mcp',
      name: 'MCP integration',
      points: 10,
      status: currentMcpVerified
        ? 'Verified live this session'
        : hasMcpProof
          ? 'Verified live'
          : 'Implemented, unverified',
      detail: currentMcpVerified
        ? `Otari completed the read-only repository MCP call${mcpProvider ? ` through ${mcpProvider}` : ''}${mcpModel ? ` on ${mcpModel}` : ''}; request ${mcpRequestId}.`
        : hasMcpProof
          ? `Redacted production evidence records Otari MCP on ${proofEffectiveModel} through ${proofProvider}; request ${proofRequestId}.`
          : 'A bounded Qwen request targets the fixed public mozilla-ai/otari repository through DeepWiki MCP. Verification requires a successful gateway tool-use/result pair and request ID.',
      file: currentMcpVerified ? '#capability-check-result' : 'mcp-status.json',
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
        'Participant reports separate $1 monthly ceilings on the production and test keys. Current spend, remaining balance, and a gateway budget refusal are not independently available.',
      file: 'budget-operator-report.json',
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
