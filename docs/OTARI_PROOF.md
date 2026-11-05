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
