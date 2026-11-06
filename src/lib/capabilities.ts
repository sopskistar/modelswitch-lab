import type { Tool } from './types';
import verification from '../../evidence/verification.json';
import mcpProof from '../../evidence/mcp-status.json';
import routingProof from '../../evidence/routing-production.json';
import webFetchDiagnosis from '../../evidence/web-fetch-diagnosis.json';
import budgetEnforcement from '../../evidence/budget-enforcement-test.json';
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
export const budgetEnforcementVerified =
  budgetEnforcement.classification.requestLimitEnforcement === 'confirmed' &&
  budgetEnforcement.requests.length === 2 &&
  budgetEnforcement.requests[0]?.httpStatus === 200 &&
  budgetEnforcement.requests[0]?.usageLookup.status === 'success' &&
  budgetEnforcement.requests[1]?.httpStatus === 403 &&
  budgetEnforcement.requests[1]?.gatewayErrorCode === 'budget_exceeded' &&
  budgetEnforcement.requests[1]?.budgetScope === 'api_token';
export const advancedVerifiedPoints =
  10 *
  [codeVerified, rolesVerified, routingVerified, mcpVerified, budgetEnforcementVerified].filter(
    Boolean,
  ).length;
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
  const latestWebAttempt = webFetchDiagnosis.attempts.at(-1);
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
        ? `Otari routed ${routingProof.gateway.requestedPolicy} to ${routingProof.gateway.effectiveModel} through ${routingProof.gateway.provider}; attempt ${routingProof.gateway.attempts}, fallback ${routingProof.gateway.fallback}. The test-workspace fallback attempt is not ready: its own API key and explicit provider pin are not verified.`
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
          : latestWebAttempt
            ? `Otari discovery reports web fetch available, but the latest allowlisted request returned HTTP ${latestWebAttempt.applicationHttpStatus} without a completed tool event. Request ${latestWebAttempt.otariRequestId}; inspect the redacted diagnostic before retrying.`
            : 'Otari web fetch execution has not been verified; inspect the capability evidence before retrying.',
      file: 'web-fetch-diagnosis.json',
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
      status: budgetEnforcementVerified ? 'Verified live' : 'Implemented, unverified',
      detail: budgetEnforcementVerified
        ? `Otari admitted Qwen request ${budgetEnforcement.requests[0].requestId} at $${budgetEnforcement.requests[0].costUsd}, then refused ${budgetEnforcement.requests[1].requestId} with HTTP 403 budget_exceeded for scope api_token. The first answer content was empty; this proves enforcement, not answer quality.`
        : 'A real Otari key-scoped request-count refusal has not been verified.',
      file: budgetEnforcementVerified
        ? 'budget-enforcement-test.json'
        : 'budget-operator-report.json',
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
      status: 'Implemented, unverified',
      detail:
        'The latest read-only profile check returned available=false because no guardrails service is configured for this inference context. An organization owner may still configure a workspace-scoped mandate; no verdict was tested.',
      file: 'guardrail-profile-check.json',
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
