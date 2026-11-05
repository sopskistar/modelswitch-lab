# Hosted Otari proof

Historical request evidence below is redacted, checked into the repository, and
linked to its machine-readable record. Request IDs can be checked against the
Otari account's request/usage history by an authorized owner. Those requests
were made on 2026-11-04; they are not production runs or current service health.

## Production acceptance — 2026-11-05

The deployed site [modelswitchlab.vercel.app](https://modelswitchlab.vercel.app)
returned HTTP 200 from Vercel. The read-only production catalog returned HTTP
200, `configured: true`, US region, 162 accessible catalog models, and the
Qwen3.8 evaluator plus Llama 3.3 analyst IDs. This confirms server-side Otari
model discovery authentication; it does not prove a completion request.

The catalog reports `demoEnabled: false`. One empty JSON POST to `/api/execute`
returned HTTP 503 with `demo_disabled`. The route checks this flag before
reading the body, invoking the rate limiter, or constructing an Otari client;
the request therefore generated no model call, request ID, or cost. A live
production benchmark, result trace, and export receipt were not run. This was
intentional because Upstash credentials and an Otari hard spend limit could not
be verified from the public site.

Desktop and iPhone 13 browser checks found no page errors, no axe violations,
no horizontal overflow, and working theme persistence and view navigation.
The workspace scenario controls and empty Results/Trace states load. The run
button remains disabled. Captures: [desktop](screenshots/production-desktop-workspace.png)
and [mobile](screenshots/production-mobile-workspace.png). Full machine-readable
observations are in [`production-acceptance.json`](../evidence/production-acceptance.json).

Vercel CLI/authentication and a linked `.vercel` project are absent from this
workspace; GitHub's public deployments API returned no records. The exact
deployed commit therefore remains **unverified**. The requested source commit
is `53671da73606e5e619e8224224a8647ee21cdae1`, but it cannot be asserted as the
deployed SHA without Vercel project access. The live catalog's policy field is
`=modelswitch-fallback` and is not one of the listed model IDs. The operator
must inspect that Vercel environment value and actual Otari policy name before
trying the application's policy check. Do not change the production policy to
force fallback.

The composite `demoEnabled: false` does not disclose whether
`PUBLIC_DEMO_ENABLED` is false, Upstash URL/token are missing, or both. Vercel
production environment values were not accessible or read. The public catalog
lists model metadata and tool availability only; it returns no API credentials.

## Dedicated budget-key management investigation — 2026-11-05

The test credential was confirmed present in `.env.local` as
`OTARI_BUDGET_TEST_KEY` without printing its value. It was used only for
read-only checks. `GET /models` returned HTTP 200 with 162 accessible model
entries and included configured evaluator `alibaba/qwen3.8-27b`, confirming
that the dedicated test key can access Qwen. No completion or other billable
inference was sent.

Read-only management requests with that same credential returned HTTP 401 and
`Invalid master key` for `GET /organizations/me`,
`GET /organizations/me/budgets`, and `GET /organizations/me/keys?limit=100`.
These responses had no Otari request ID or budget scope. Therefore this
inference credential does not provide the management authority needed to
inspect or update the named budget. It does not establish whether the human
account owner has sufficient dashboard-session authority.

Current [Otari budget docs](https://github.com/mozilla-ai/otari/blob/main/docs/budgets.md)
define `request_limit` as a request count over a budget period, independently
of the existing USD `max_budget`. The generated
[OpenAPI specification](https://github.com/mozilla-ai/otari/blob/main/docs/public/openapi.json)
defines `PATCH /api/v1/organizations/me/budgets/{budget_id}` with
`OrganizationBudgetUpdate`; `request_limit` is an optional integer (or null),
and omitted fields remain unchanged. The organization-budget API is owner/admin
scoped. The separate scoped-ceiling API describes a ceiling as referring to a
budget and reports the scope, including `api_token`; changing a budget can
therefore affect every ceiling that references it. The dashboard docs state
that owners/admins can manage their organization budgets and key spending
ceilings, while the account's budget editor currently exposes only Name,
Limit (USD), and Resets.

The current docs support organization owner/admin management: the generated
OpenAPI marks `GET /api/v1/organizations/me/spend-ceilings` as owner/admin only,
and the dashboard guide says owners/admins manage their organization's budgets
and ceilings. To inspect the association, an authorized owner/admin reads that
endpoint and identifies the test key's ceiling by its `scope_type: "api_token"`
and the test key's ID; the response includes `budget_id`, `request_limit`,
`max_budget`, reset fields, and `manageable`. Then the supported update is
`PATCH /api/v1/organizations/me/budgets/{budget_id}` with
`{"request_limit":1}`. `OrganizationBudgetUpdate` treats omitted fields as
unchanged, so that body preserves the target budget's existing name, $1
`max_budget`, and monthly reset. Do not include nulls, since explicit null
clears a field. This patch changes the budget itself, so it is safe only after
the owner confirms the budget is attached only to the test-key ceiling; never
patch the Setup guide budget.

The documentation establishes this owner/admin API capability, but this run
could not exercise it: the dedicated inference key received HTTP 401
`Invalid master key`, and no separate authorized management channel was
provided. The UI editor the operator inspected exposes only Name, Limit (USD),
and Resets. Do not extract a dashboard session credential or try another
unauthorized credential. The precise human action is to ask Mozilla Otari for
an approved way to invoke the organization-owner API operation on the hosted
account (or expose the request limit in its dashboard editor), then:

1. Read `GET /api/v1/organizations/me/spend-ceilings`; verify the test
   `api_token` scope and that it is the only ceiling referencing the target
   budget.
2. Read `GET /api/v1/organizations/me/budgets`; select the matching budget ID
   and confirm the existing $1 monthly boundary.
3. PATCH only that budget ID with `{"request_limit":1}` and read it back to
   confirm both `request_limit: 1` and unchanged `max_budget: 1` / monthly
   reset.

Until those reads and the owner-authorized patch are possible, keep both $1
monthly ceilings unchanged and do not consume the test budget. Consequently
there is no observed request-limit configuration, `budget_exceeded` refusal,
inference request ID, or budget enforcement proof. The budget rubric remains
unverified.

The relevant API calls made here were read-only metadata checks, not inference:
`GET /models` (200; no request ID), `GET /organizations/me` (401),
`GET /organizations/me/budgets` (401), and
`GET /organizations/me/keys?limit=100` (401). The three 401 responses had no
Otari request ID, `Otari-Error-Code`, or budget scope header.

Keep refusal types separate: Otari documents `budget_exceeded` as HTTP 403
with `Otari-Budget-Scope` (and `Retry-After` when a reset will make it admissible);
`insufficient_funds` as HTTP 402 because the hosted organization has no funds;
and `rate_limited` as HTTP 429 for a gateway rate rule. ModelSwitch Lab's own
`demo_disabled`/`demo_limit` responses are application-level refusals and have
no Otari budget proof. These are documented response semantics, not results
observed from this test key. See the [Otari API error reference](https://github.com/mozilla-ai/otari/blob/main/docs/api-reference.md).

## Real model roles

The bounded verifier completed at `2026-11-04T16:10:07Z`:

- **Evaluator:** Qwen3.8 27B through DeepInfra. Three distinct synthetic tasks
  completed and scored against expected output. Invoice request
  [`2070b955-78a2-4a8a-a02d-d72df5e5f1f9`](../evidence/verification.json)
  reported $0.000848; classification and reasoning IDs and usage are in the
  same record.
- **Analyst:** separate Llama 3.3 70B request through Bedrock,
  [`bd24f101-ff53-452a-97a6-27016e8e8600`](../evidence/verification.json),
  reported $0.000171. It interpreted already-scored evaluator results.
- **Unmocked browser run:**
  [`365aae24-b64e-43ec-ba02-3c5e9a7d8739`](../evidence/browser-smoke.json)
  began `2026-11-04T16:32:53Z`, with five classification fixtures per model
  and a separate Llama analyst request. Qwen scored 5/5; Llama scored 4/5.
  Evaluator reported costs were $0.000936 and $0.000493; analyst reported
  $0.000312; combined reported cost was $0.001741. These are observed values
  from that run only.
- **Post-polish live smoke:** [`polish-live-smoke.json`](../evidence/polish-live-smoke.json)
  started `2026-11-04T23:41:17.457Z`, used one support-classification case, and
  completed both roles with no browser errors. Qwen passed 1/1 and reported
  $0.000167 (`39b2e17c-39dc-48da-b9e1-7625045435a4`); the separate Llama analyst
  reported $0.000217 (`074fe482-0097-4385-aef4-7795ed966cb2`). Total reported
  cost was $0.000384. This one-case smoke is not a comparative ranking.

## Hosted code execution

The actual `/code/execute` request
[`732c1ded-aba4-4210-8cd7-1251027e367c`](../evidence/verification.json)
returned exit code 0 and the fixed Python result `correct=4`, `total=5`,
`accuracy=0.8`. The endpoint response did not include a cost, so cost remains
unknown. Tool availability by itself is not counted; this completed result is.

## Routing evidence

Policy request
[`79c948e4-57bf-43d8-86eb-ef8eca8ec5f7`](../evidence/verification.json)
was served by Qwen through DeepInfra with one attempt and fallback false. This
proves policy resolution only. **Actual gateway failover is not verified.**
The current inference credential cannot read routing policy management (401).
No production policy was altered and no provider failure was induced.

## Refreshed hosted tools and services

The read-only discovery record was refreshed at
`2026-11-04T23:15:18Z`: [discovery.json](../evidence/discovery.json).

- `/models` returned 162 accessible catalog entries.
- `otari_code_execution` is available; its completed live execution proof is
  described above.
- `otari_web_fetch` and `otari_web_search` both report
  `available: false`, reason `workspace_disabled`.
- Guardrail profile discovery returns `available: false` because no guardrails
  service is configured. The earlier 502 fail-closed refusal is not an evaluated
  guardrail verdict.
- `/routing/policies` and `/budgets` return authentication errors with the
  inference key. This is not evidence of budget enforcement or a broken
  management service.

No MCP call or per-user budget execution is present. No management credentials
or settings changes were attempted. See the [rubric matrix](RUBRIC_EVIDENCE.md)
for status, blockers, and safe reproduction instructions.

## Record integrity

These JSON documents are application evidence exports, not signed gateway
attestations. ModelSwitch Lab never promotes an availability check, application
rate limit, insufficient-credit refusal, or model-generated claim into proof of
a hosted capability.
