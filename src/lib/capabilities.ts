import type { Tool } from './types';
import verification from '../../evidence/verification.json';
import mcpProof from '../../evidence/mcp-status.json';
import routingProof from '../../evidence/routing-production.json';
import webFetchDiagnosis from '../../evidence/web-fetch-diagnosis.json';
import webFetchProof from '../../evidence/web-fetch-live.json';
import budgetEnforcement from '../../evidence/budget-enforcement-test.json';
import fallbackLiveProof from '../../evidence/fallback-live-proof.json';
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
export const fallbackLiveVerified =
  fallbackLiveProof.status === 'verified_live' &&
  fallbackLiveProof.request.httpStatus === 200 &&
  fallbackLiveProof.request.headers['otari-fallback'] === 'true' &&
  fallbackLiveProof.request.headers['otari-attempt-count'] === '2' &&
  fallbackLiveProof.usageLookup.rowCount === 2 &&
  Boolean(fallbackLiveProof.request.headers['otari-request-id']);
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
export const webFetchVerified =
  webFetchProof.status === 'verified_live' &&
  webFetchProof.successfulRequest.httpStatus === 200 &&
  webFetchProof.successfulRequest.toolCall.status === 'completed' &&
  webFetchProof.successfulRequest.toolCall.type === 'web_fetch' &&
  Boolean(webFetchProof.successfulRequest.requestId);
export const advancedVerifiedPoints =
  10 *
  [
    codeVerified,
    rolesVerified,
    routingVerified,
    mcpVerified,
    budgetEnforcementVerified,
    webFetchVerified,
  ].filter(Boolean).length;
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
  relatedFiles?: { label: string; file: string }[];
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
      status: fallbackLiveVerified || routingVerified ? 'Verified live' : 'Implemented, unverified',
      detail: fallbackLiveVerified
        ? `Isolated policy ${fallbackLiveProof.request.requestedPolicy} genuinely failed over: Otari reported fallback=true and ${fallbackLiveProof.request.headers['otari-attempt-count']} attempts, then served ${fallbackLiveProof.request.headers['otari-model']} through ${fallbackLiveProof.request.headers['otari-provider']}; request ${fallbackLiveProof.request.headers['otari-request-id']}, cost $${fallbackLiveProof.request.usage.costUsd}. The primary failure reason is not exposed in the response or usage summary.`
        : routingVerified
          ? `Otari routed ${routingProof.gateway.requestedPolicy} to ${routingProof.gateway.effectiveModel} through ${routingProof.gateway.provider}; attempt ${routingProof.gateway.attempts}, fallback ${routingProof.gateway.fallback}.`
          : fallbackVerified
            ? 'Actual gateway fallback recorded in serving headers.'
            : 'The routing policy has not been verified with a live request and effective model/provider metadata.',
      file: fallbackLiveVerified
        ? 'fallback-live-proof.json'
        : routingVerified
          ? 'routing-production.json'
          : 'verification.json',
      relatedFiles: fallbackLiveVerified
        ? [
            { label: 'Production policy route (no failover)', file: 'routing-production.json' },
            { label: 'Fallback preflight history', file: 'fallback-test-readiness.json' },
          ]
        : [{ label: 'Fallback readiness', file: 'fallback-test-readiness.json' }],
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
      status: webFetchVerified
        ? 'Verified live'
        : web && !web.available
          ? 'Unavailable on account'
          : 'Implemented, unverified',
      detail: webFetchVerified
        ? `Otari completed a native fetch of ${webFetchProof.successfulRequest.toolCall.url} with ${webFetchProof.successfulRequest.effectiveModel} through ${webFetchProof.successfulRequest.provider}; request ${webFetchProof.successfulRequest.requestId}, tool ${webFetchProof.successfulRequest.toolCall.id}, cost $${webFetchProof.successfulRequest.usage.costUsd}. The completion named the page but ended mid-sentence, so no full factual summary is claimed.`
        : web && !web.available
          ? `Hosted tool reports ${web.reason}.`
          : latestWebAttempt
            ? `The earlier request returned HTTP ${latestWebAttempt.applicationHttpStatus} without a completed tool event. Inspect the diagnostic receipt before retrying.`
            : 'Otari web fetch execution has not been verified; inspect the capability evidence before retrying.',
      file: webFetchVerified ? 'web-fetch-live.json' : 'web-fetch-diagnosis.json',
      relatedFiles: webFetchVerified
        ? [{ label: 'HTTP 400 diagnosis', file: 'web-fetch-diagnosis.json' }]
        : undefined,
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
        'The Otari build lists guardrail integrations, but profile discovery returned available=false and no profiles. An organization owner must configure a real guardrail and scope its mandate to the test workspace; no verdict was tested.',
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
