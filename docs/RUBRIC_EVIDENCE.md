# Rubric evidence

Recorded 2026-11-04; refreshed 2026-11-05. Target ceiling: 100. Current
evidence supports **55/100 potential points**: 30 for two meaningful
open-weight roles, 20 for verified advanced features (code + distinct roles),
and 5 for the working use case. This is our evidence assessment, not an
official judge score. The latest production result is participant-reported;
the underlying production request IDs and receipt were not independently
retrieved during this pass. Routing fallback, gateway budget enforcement,
MCP, web retrieval, guardrails and the personally recorded demo remain
unverified or unavailable.

| Rubric feature                | Possible points | Implementation location                            | Tested live?                 | Evidence                                                                                                                                         | Reproduction steps                                                                                           | Status                                  | Known limitations                                                  |
| ----------------------------- | --------------- | -------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------ |
| Meaningful open-weight model  | 20              | `src/lib/otari.ts`, `/api/execute` case action     | **Yes**                      | `verification.json`, evaluator request `2070b955-78a2-4a8a-a02d-d72df5e5f1f9`; real Qwen invoice output and exact scoring                        | Select Qwen, run versioned cases, inspect actual output                                                      | **Verified live**                       | Tiny synthetic samples, no general model rank                      |
| Second open-weight role       | 10              | `/api/execute` analyst action, signed receipts     | **Yes**                      | `verification.json`, Llama analyst `bd24f101-ff53-452a-97a6-27016e8e8600`; primary license links in integration guide                            | Complete evaluator cases, inspect separate analyst request and serving identity                              | **Verified live**                       | Diagnostic text supports deterministic scores                      |
| Model routing and fallbacks   | 10              | `/api/execute` routing action                      | Policy served; no failover   | `verification.json`, `79c948e4-57bf-43d8-86eb-ef8eca8ec5f7`, attempt=1, fallback=false                                                           | Check routing; configure isolated controlled fallback test through operator                                  | Implemented, full target unverified     | Policy resolution alone is not actual fallback proof               |
| MCP integrations              | 10              | `/api/execute` fixed repository MCP action; streamed Otari Messages adapter | No; implementation only | `evidence/mcp-status.json`; no Otari request ID or tool event                                                                   | Open Otari Capabilities and run **Inspect repository** after deployment; require matching gateway-owned tool-use/result events | Implemented, unverified | Local environment could not reach remote hosts; only real hosted events qualify |
| Web search or fetch           | 10              | `/api/execute` web action; exact source allowlist  | Discovery only               | Latest `discovery.json`: `workspace_disabled`                                                                                                    | Enable workspace tool/domain restriction; Fetch through Otari; inspect completed tool call                   | Unavailable on hosted account           | Model summary alone cannot prove retrieval                         |
| Code execution                | 10              | `/api/execute` code action; typed verifier         | **Yes**                      | `verification.json`, `732c1ded-aba4-4210-8cd7-1251027e367c`; exit 0, correct=4, total=5, accuracy=.8                                             | `npm run otari:verify -- --capabilities-only` or Check sandbox                                               | **Verified live**                       | Fixed control vectors; cost unreported                             |
| Budgets/spending limits       | 10              | Otari key spending ceilings; denial normalization | No gateway refusal observed | [`budget-operator-report.json`](../evidence/budget-operator-report.json): participant reports separate $1 monthly ceilings on production and test keys; management reads had 401 | Inspect Otari owner-visible spend-ceiling and usage records; use a gateway `budget_exceeded` refusal only if a safe boundary can be configured | Unverified; no enforcement evidence | Current spend/remaining is not readable; dashboard has no request-limit field; do not equate spend or `insufficient_funds` with a budget refusal |
| Multiple distinct model roles | 10              | Evaluator scoring then separate analyst action     | **Yes**                      | Typed verifier and `browser-smoke.json` record distinct role requests and real providers                                                         | Run benchmark, inspect analyst event and request IDs/models                                                  | **Verified live**                       | Comparison calls alone are not the distinct-role proof             |
| Inference guardrails          | 10              | `/api/execute` guardrail fixture                   | Fail-closed refusal observed | `verification.json`, 502, `ef371ed6-bad2-4631-9e63-26f4c452509f`; no service configured                                                          | Configure actual service; inspect evaluated verdict or violation                                             | Unavailable on hosted account           | Service outage is not a guardrail evaluation                       |
| Per-user budgets              | 10              | None                                               | No                           | None                                                                                                                                             | Requires actual service key and end-user budgets                                                             | Not implemented                         | No local label is counted                                          |
| Working real use case         | 5               | Five views, 15 fixtures, scorer and recommendation | **Yes**                      | `browser-smoke.json`, run `365aae24-b64e-43ec-ba02-3c5e9a7d8739`: 10 cases + analyst, no request failures                                        | Select five classification cases and both models; Run; inspect/export                                        | **Verified live**                       | Qwen 5/5, Llama 4/5 only on these cases                            |
| Recorded Otari demonstration  | 5               | `docs/DEMO_SCRIPT.md`                              | Not recorded                 | Script only                                                                                                                                      | Participant personally records actual screen and narrates                                                    | Awaiting participant                    | No synthetic narration or fabricated recording                     |

Only six of eight advanced targets can count, capped at 60. Two are verified
now. Do not add all eight potential values or count local equivalents. The path
to 100 still needs four more verified targets and the personal recording. Web
and guardrails need hosted setup; fallback and budgets need controlled operator
tests. MCP/per-user substitutions also need real setup and execution.

Live comparison under the balance objective:

| Model         | Accuracy/pass rate | Schema validity | Mean measured request latency | Reported evaluator total | Composite score |
| ------------- | ------------------ | --------------- | ----------------------------- | ------------------------ | --------------- |
| Qwen3.8 27B   | 100% (5/5)         | 100%            | 2660 ms                       | $0.000936                | 85.0006         |
| Llama 3.3 70B | 80% (4/5)          | 100%            | 839.4 ms                      | $0.000493                | 89.0000         |

The faster/cheaper Llama wins this explicit objective despite one wrong answer.
The separate Llama analyst cost $0.000312, so the total run reports $0.001741.
These values describe one real recorded run and may differ on repetition. The
analyst fee is separate from evaluator comparison cost.

Reusable records: `discovery.json`, `smoke.json` (historical initial credit
refusals), `verification.json`, and unmocked `browser-smoke.json`, all under
`evidence/`. They retain timestamps, roles, actual IDs, outcomes, gateway headers,
measured latency, reported usage, output and scoring. Secrets, personal data,
management bodies and signed browser receipts are omitted. Test-only intercepted
HTTP responses never count as live evidence.

The final polish pass also recorded a separate one-case unmocked smoke at
`2026-11-04T23:41:17.457Z` in `evidence/polish-live-smoke.json`. It completed
one Qwen evaluator and a separate Llama analyst for $0.000384 reported total.
This confirms the current routes still execute through Otari; it is not a new
rubric point or a comparative benchmark.

The refreshed read-only discovery still reports web fetch/search as
`workspace_disabled`, no guardrail service, and authentication for routing and
budget-management reads with the inference key. Detailed request IDs and current
tool statuses are linked in [OTARI_PROOF.md](OTARI_PROOF.md).

Otari's current budget documentation and generated OpenAPI support both
`max_budget` (USD) and `request_limit` (requests per budget period). Read-only
checks with the dedicated test inference key confirmed access to the Qwen model
catalog but returned HTTP 401 `Invalid master key` for organization context,
organization budgets, and owned keys. The specific test-key ceiling attachment
could not be inspected, and no budget mutation or inference request was made.
No new budget point is verified; total evidence remains **55/100 potential**.
See the attempt record in [`OTARI_PROOF.md`](OTARI_PROOF.md).

The latest public catalog observation on the selected hyphenated domain reports
`configured: true` and `demoEnabled: true`; this does not prove rate-limit
behavior. The participant reports a production invoice run (Qwen 3/3, 5.66 s,
$0.001710; separate Llama analyst $0.000237; total $0.001947). No request IDs,
trace or receipt were available to corroborate it here, so the report does not
change capability verification or rubric coverage. The older
[`production-acceptance.json`](../evidence/production-acceptance.json) is a
historical capture of the other state/domain; consult the newer
[`production-observation.json`](../evidence/production-observation.json).

The MCP check is implemented but unverified. Otari documents inline MCP fields
and managed tool execution on the Messages endpoint. Chat Completions and
Responses hide managed MCP activity; the new route uses the Messages stream's
documented MCP activity blocks to require matching tool-use/result evidence.
The current local network could not connect to public hosts, and the hosted
call has not been made. No MCP points are counted.
