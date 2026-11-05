# Hosted Otari proof

## Production deployment checks — 2026-11-05

The initial post-push check at 16:47 UTC returned the previous workspace at `/`
(HTTP 200; heading “Put a model to the test.”) and HTTP 404 at
`/app?view=model-switch`. Its Vercel request IDs remain in
[`production-deployment-check.json`](../evidence/production-deployment-check.json).

At 17:26 UTC, a real browser recheck confirmed the landing and Model Switch
routes both render successfully. The catalog returned HTTP 200, reported
configured inference and the Qwen/Llama model IDs. Clicking **Switch to Llama**
changed the browser's active selection; no `/api/execute` POST was made. Desktop
and 390px mobile pages had no axe violations, page errors, or horizontal
overflow. The public model-smoke and web-diagnostic evidence endpoints returned
HTTP 200. Four production screenshots and the structured record are committed
in `docs/screenshots/production-*.png` and
[`production-ui-check.json`](../evidence/production-ui-check.json). This is a
read-only UI acceptance check, not a new inference request.

The exact Vercel source SHA remains unknown. This environment has no Vercel CLI,
linked project, or token. The operator should inspect the source commit of the
current Production deployment in the existing `modelswitch-lab` project and
confirm it matches the synchronized GitHub branches. Do not use the duplicate
project. No deployment SHA is inferred from rendered routes.

## Model Switch production smoke — 2026-11-05 14:17–14:18 UTC

The bounded smoke used two sequential POSTs to the existing public case route,
with the same synthetic invoice fixture `inv-01`, no retries, and no browser
mocking. The Qwen request returned an application-level timeout (504) without
an Otari request ID, effective model, provider, or usage. Its billing state is
unknown; no retry was made. The Llama request completed with valid six-field
output: requested ID `meta/llama-3.3-70b-instruct`, effective model
`meta.llama3-3-70b-instruct-v1:0`, provider `bedrock`, Otari request
`77cf5458-46f6-40c9-98ab-80468ba890ec`, one attempt, `fallback=false`, 929 ms,
236 tokens, and reported cost `$0.000170`. The application score was 6/6
fields. Redacted response evidence is in
[`model-switch-production.json`](../evidence/model-switch-production.json).

This demonstrates a real Llama request through Otari and a successful
model-specific route. The paired Qwen request did not complete, so this smoke
does not prove a successful two-model comparison. It also used the existing
public API, not a live browser interaction with the new model-selection screen.
The focused branch's Playwright tests verify the UI payload contract using
intercepted fixtures; those fixtures are not hosted inference evidence. No
deployment SHA is inferred from the API response.

## Web-fetch diagnostic refresh — 2026-11-05 13:33 UTC

After workspace web access was enabled, authenticated catalog discovery on the
selected production domain reported `otari_web_fetch` and `otari_web_search`
available. A single bounded request to the public Mozilla Manifesto URL still
returned HTTP 400, Otari request `32697174-cde5-4bbd-9cf3-df3f02f01542`, with no
tool call, completed response metadata, or known cost. A usage lookup returned
404, which does not resolve whether usage settled. An earlier request
`9bd36cf5-6ddf-433a-9d1a-95295a50fae5` had the same outcome. The application
does not expose raw gateway diagnostic fields, so the cause is **unknown**, not
attributed to workspace policy or a specific request parameter. The redacted
structured record is [`web-fetch-diagnosis.json`](../evidence/web-fetch-diagnosis.json).
Required next step: an authorized Otari operator inspects either request in
hosted activity and supplies the sanitized error code/detail and rejected
request field. Do not retry until that is known.

## Latest production evidence check — 2026-11-05 13:02 UTC

Read-only GETs to `/api/evidence?file=routing-production.json` and
`/api/evidence?file=mcp-status.json` both returned HTTP 200 from the selected
production URL. The MCP route served `recordVersion: 2`, `status:
verified_live`, and the redacted successful record for Otari request
`d9283ac4-3aec-4ee3-8151-08937bb08554` (Qwen/DeepInfra, one successful
`read_wiki_structure` call, no reported cost). The routing receipt contains
request `5f2cc001-a521-435e-8b51-df0f91452dc5`, policy `modelswitch-fallback`,
Qwen/DeepInfra, attempts=1, fallback=false. Vercel request ID for the MCP
evidence read: `fra1::iad1::8p7kj-1793883723166-627f2bd43331`.

These checks confirm the static receipts are served by production, not a
particular Vercel Git SHA. A later read-only catalog check at 13:02 UTC returned
HTTP 200 and reported both `otari_web_fetch` and `otari_web_search` as
`available: true` (Vercel request
`fra1::iad1::sph8m-1793883721437-6515d80340e5`). This supersedes the earlier
`workspace_disabled` discovery, but proves availability only.

One bounded public-app fetch attempt used the fixed allowlisted Mozilla
Manifesto URL. The application returned HTTP 400 and Otari request
`9bd36cf5-6ddf-433a-9d1a-95295a50fae5` (Vercel request
`fra1::iad1::cvt7c-1793883384242-385af6bc5a95`). The safe app response exposed
only normalized `gateway_error`; it did not include the raw Otari error code,
provider/model response metadata, or a completed `web_fetch` tool event. Cost
is unknown. No retry was made. Thus, web retrieval remains unverified. An
authorized Otari operator should inspect that request ID in hosted request
activity to identify the 400 cause before any retry. See the structured
redacted details in [`production-observation.json`](../evidence/production-observation.json).

Otari's current [tools documentation](https://github.com/mozilla-ai/otari/blob/main/docs/tools.md)
describes `otari_web_fetch` declarations, per-request use/domain bounds, and
gateway tool-call evidence. The application used its fixed allowlisted URL and
one-use declaration. The current blocker is request-level rejection, not the
previously observed workspace policy. No second request was sent.

The current [budget](https://github.com/mozilla-ai/otari/blob/main/docs/budgets.md),
[configuration](https://github.com/mozilla-ai/otari/blob/main/docs/configuration.md),
and [API reference](https://github.com/mozilla-ai/otari/blob/main/docs/api-reference.md)
describe user-scoped budgets and service-key scoping. No authorized service or
admin key is available here; prior organization reads with the inference key
returned HTTP 401. The two $1 monthly ceilings are not per-user budget proof
and were not modified. Next action: an Otari organization owner must provision
a dedicated service key limited to two synthetic end-user budget IDs and
configure individual safe limits. Then the app can send one bounded request
per fixed identity and record separate gateway usage/refusal evidence. No
management mutation or test inference was attempted.

The latest recorded guardrail-profile discovery says no guardrail service is
configured. No further guardrail call was made; an ordinary safety-model call
would not prove gateway guardrail enforcement.

## Selected production domain and reported run — 2026-11-05

The selected demo is [modelswitch-lab.vercel.app](https://modelswitch-lab.vercel.app)
(hyphenated). A read-only `/api/catalog` observation on that domain returned
HTTP 200, `configured: true`, `demoEnabled: true`, the expected Qwen and Llama
model IDs, `modelswitch-fallback`, code execution available, and web fetch/search
`workspace_disabled`. The flag is computed from deployment environment
configuration; it does not prove that Redis counters work or reveal the deployed
commit. No inference request was sent as part of this initial catalog check;
one separate, bounded production MCP request is recorded below.

The participant reports a real production invoice run: Qwen3.8 passed 3/3
(100% accuracy/pass rate), 5.66 seconds, $0.001710; a separate Llama 3.3 analyst
through Bedrock reported $0.000237; combined reported cost $0.001947. The
production UI reportedly showed results and interpretation. The timestamp, run
ID, request IDs, receipt export and trace were not available here, so these
values are explicitly **participant-reported and not independently corroborated**.
See [`production-observation.json`](../evidence/production-observation.json).

On `2026-11-05`, a read-only request to the selected production catalog returned
HTTP 200 with Vercel request ID
`fra1::iad1::2jdth-1793875276299-dde473d35888`. It confirmed the currently
configured hosted roles, policy, tool availability and `demoEnabled: true`.
The homepage returned HTTP 200 with the expected ModelSwitch Lab title and
workspace. A live Chromium navigation attempt from this environment ended with
`ERR_NETWORK_CHANGED`; no inference was sent and no production browser
accessibility result is claimed.

Historical rollout check: after source commit
`67a4624e83dde54b3f19067a0182d85e1bbf5551` was pushed, an earlier production
evidence request returned HTTP 404. That result was superseded by the successful
HTTP 200 checks documented at the top of this file. Vercel CLI, project link,
deployment token, and project/org IDs remain absent here, so the selected
project's exact source commit cannot be identified.

The older [production acceptance record](../evidence/production-acceptance.json)
captured the earlier non-hyphenated domain with inference disabled. It is retained
as historical evidence and is not the selected production site's current state.

## Managed MCP — verified in production

The app now has a fixed, read-only **Inspect repository** check. It calls hosted
Otari `POST /api/v1/messages` with inline `mcp_servers` for the public DeepWiki
endpoint and allowlists only `read_wiki_structure` for `mozilla-ai/otari`.
It enables Otari's documented `mcp-client-2025-11-20` Messages beta and only
marks the check verified when a matching gateway-owned `mcp_tool_use` and
successful `mcp_tool_result` appear in the stream. The request is capped at 180
output tokens and two tool-loop iterations; it has no user-controlled URL or
repository input and is subject to the normal public rate limiter.

One bounded request was made on the selected production site on 2026-11-05.
Otari request `d9283ac4-3aec-4ee3-8151-08937bb08554` was served by effective
model `Qwen/Qwen3.8-27B` through `deepinfra`; the gateway reported one attempt,
`fallback=false`, and 989 ms gateway duration. The stream contained the single
allowlisted `read_wiki_structure` call for `mozilla-ai/otari`, followed by a
successful result with the wiki structure showing its MCP documentation. The
model then summarized that result. The application response was HTTP 200 and
the Vercel request ID was
`fra1::iad1::z8vsh-1793875890729-beddd0b66157`. Otari did not report cost.

The original response's app-level `verified` flag was false because the parser
incorrectly expected the result block to repeat the use-block id/name. Otari's
[documented Messages event schema](https://github.com/mozilla-ai/otari/blob/main/docs/mcp.md#messages-streaming-activity)
places the opaque id on `mcp_tool_use`; the corresponding result block carries
content and `is_error` and follows the use block. The corrected verifier
requires one allowed use, one successful result after it, a completed stream,
and the Otari request ID. This production request satisfies that evidence rule.
The fixed evidence record is in [`mcp-status.json`](../evidence/mcp-status.json).

Earlier rollout checks (HTTP 200 serving an old MCP record, then HTTP 404 for
the routing receipt) are retained as historical observations. The newer checks
at the top supersede those route-status findings: both receipts now return HTTP
200. This still does not establish the deployed source SHA. The live MCP and
routing executions are corroborated by captured production responses and Otari
headers; see their individual evidence records.

## Spending ceilings — operator-reported, no enforcement proof

The participant reports two separate $1 monthly ceilings attached in Otari:
the `Setup guide` production key and `modelswitch-budget-proof` test key. These
were not changed. The inference credential cannot read organization spending
records; past organization management reads returned HTTP 401 `Invalid master
key`. Current spend, remaining dollars, reset state, and the exact key-budget
association therefore are not fetched by the application. No `budget_exceeded`
response was observed. The redacted provenance record is
[`budget-operator-report.json`](../evidence/budget-operator-report.json).

Previously observed model costs are usage reports, not proof that the boundary
was enforced. The existing $1 ceilings must not be exhausted to establish the
point. Budget capability remains unverified pending a safe, gateway-recorded
refusal or independently inspectable Otari usage/enforcement evidence.

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

The production application sent one fixed task through the named Otari policy
`modelswitch-fallback`. Request
[`5f2cc001-a521-435e-8b51-df0f91452dc5`](../evidence/routing-production.json)
resolved to `Qwen/Qwen3.8-27B` through `deepinfra`, with one attempt, measured
latency 1,382 ms, reported cost $0.000159, and `fallback=false`. The model
returned the expected billing classification. This verifies that the
application actually invokes policy routing and that Otari returned its
effective serving identity. It does **not** demonstrate fallback: no provider
failure was induced and the gateway explicitly reported false. The old
operator verifier also recorded policy resolution in
[`verification.json`](../evidence/verification.json). No production policy was
altered; management configuration remains inaccessible to the inference key.

## Hosted tools and services — historical discovery snapshot

The read-only discovery record was refreshed at
`2026-11-04T23:15:18Z`: [discovery.json](../evidence/discovery.json).

- `/models` returned 162 accessible catalog entries.
- `otari_code_execution` is available; its completed live execution proof is
  described above.
- At this discovery timestamp, `otari_web_fetch` and `otari_web_search` both report
  `available: false`, reason `workspace_disabled`.
- Guardrail profile discovery returns `available: false` because no guardrails
  service is configured. The earlier 502 fail-closed refusal is not an evaluated
  guardrail verdict.
- `/routing/policies` and `/budgets` return authentication errors with the
  inference key. This is not evidence of budget enforcement or a broken
  management service.

No per-user budget execution is present. No management credentials
or settings changes were attempted. See the [rubric matrix](RUBRIC_EVIDENCE.md)
for status, blockers, and safe reproduction instructions.

## Record integrity

These JSON documents are application evidence exports, not signed gateway
attestations. ModelSwitch Lab never promotes an availability check, application
rate limit, insufficient-credit refusal, or model-generated claim into proof of
a hosted capability.
