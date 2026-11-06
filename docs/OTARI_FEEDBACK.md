# Feedback to Mozilla

Based on actual observations on 2026-11-04. See the journal and sanitized JSON
for reproduction. Two-model inference, deterministic comparison, policy
resolution and code execution were observed. Actual routing failover and budget
boundaries were not, so they are not reviewed as if they had passed.

## 1. Temptation to skip Otari

The initial $0 balance blocked evaluator, analyst, and routing smoke calls. Calling
a provider with another credential would have made the application easier to
demonstrate, but would have bypassed the required hosted gateway and invalidated
the evidence. No direct provider was called. The adapter preserves the refusal
and its request ID instead of hiding it. Later funded calls completed both model
roles through Otari, so bypassing the gateway was unnecessary.

## 2. What we built ourselves

We built deterministic scoring, versioned synthetic datasets, composite objective
weights, signed metric receipts, recent-session storage, a request-evidence UI,
CSV/JSON exports, and a separate public request quota. Most are product-specific.
Otari could reduce the generic work with a typed capability/preflight SDK,
consistent execution evidence for tools, and a documented small-demo setup.
Application quotas supplement gateway budgets and do not replace them.

## 3. Would we continue if optional?

Yes, based on observed model discovery, inference through two providers,
reported costs, policy resolution, the Python sandbox, managed MCP execution,
and the separately verified request-count budget refusal. Actual provider
failover remains unverified; continued use would depend on an isolated,
reproducible fallback configuration.

## 4. What worked well

The documented `/api/v1/models` and `/tools` worked with the hosted US key.
The catalog included pricing/capability metadata and the policy name. Disabled
web tools were explicit (`workspace_disabled`) rather than silently omitted.
Inference refusals included traceable request IDs. Direct Python execution
worked, returned structured stdout and exit code, and needed no unnecessary LLM
round trip. A guardrail in block mode failed closed when its service was absent.
Qwen served real evaluator tasks through DeepInfra; Llama served a separate
diagnostic through Bedrock. The headers made those actual identities visible.
The five-case comparison and analyst reported $0.001741 total, with deterministic
scoring independent of model opinion.

## 5. What did not work

Initially evaluator and analyst requests could not execute because the hosted
account had no funds. Later calls succeeded. This was an account prerequisite,
not evidence of a gateway defect.
Web fetch/search were disabled at first and later became discoverable, but
bounded web requests returned HTTP 400 without tool results. No guardrails
service was configured in the checked inference context. Routing/budget
management reads were unauthorized with the inference key, which is an
appropriate separation of authority. A dedicated test-key budget refusal was
later verified. These observations do not establish an undocumented provider
bug.

## 6. What was missing

The code endpoint returned no inline cost or pricing source in its successful
response, so our UI must retain an unknown cost. A real fallback event and a
sixth advanced feature remain to be demonstrated. The request-count budget
boundary is now verified.
A supported hosted fallback fault-injection/test action and a single hosted
capability/permissions/funding readiness view would shorten setup.

## 7. Recommended improvements

- Provide one low-cost hosted readiness check covering balance, effective tools,
  region, model access, service availability, and budget attachment without
  exposing management credentials.
- Publish a safe, reproducible hosted failover test and an isolated budget-limit
  demonstration using a disposable restricted key.
- Return the same request/usage/pricing envelope from direct code execution as
  completions, or link clearly to its per-request usage record.
- Distinguish operator-only documentation from features an ordinary hosted
  workspace can configure, with the exact required role beside each example.
- Offer a small machine-readable example for exporting sanitized, role-labeled
  evidence across completion, tools, guardrails and budget refusals.

Local sandbox DNS/browser restrictions, npm's peer-resolution crash, and the
Turbopack port restriction were development-environment issues, not Otari issues.

## Follow-up observation — 2026-11-05

The current MCP guide documents managed MCP on inline `mcp_servers`. A useful
integration detail is that non-streaming Chat Completions can hide the managed
MCP tool call and result, while streamed Messages with the documented MCP beta
exposes server-owned activity blocks. One bounded production request used that
path and returned a successful DeepWiki repository result. We initially
misread the schema and expected the result event to repeat its call id/name;
the docs instead place those on the use block and pair the following result by
stream order. We corrected the parser and recorded the real request rather than
retrying it. A local direct connectivity timeout remained a local network
limitation and did not predict gateway-to-MCP reachability.
