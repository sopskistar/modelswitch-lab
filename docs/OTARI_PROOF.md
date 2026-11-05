# Hosted Otari proof

All request evidence below is redacted, checked into the repository, and linked
to its machine-readable record. Request IDs can be checked against the Otari
account's request/usage history by an authorized owner. The records contain no
API key. They describe requests made on 2026-11-04, not current service health.

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
