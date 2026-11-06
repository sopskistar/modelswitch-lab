# Submission checklist

## Final Model Switch changes — 2026-11-05

- [x] Landing page at `/` and existing workbench at `/app`; legacy query links redirect into the matching app view.
- [x] Browser-scoped active model choice is validated against the current Otari catalog and server-side role allowlist; selection alone sends no request.
- [x] Explicit same-fixture test sends the chosen model ID through the existing hosted Otari case route; deterministic output scoring and gateway identity are shown.
- [x] Fixed routing-policy action remains separate from manual model selection and does not perform application retries.
- [x] Real bounded production smoke record: Llama success (request `77cf5458-46f6-40c9-98ab-80468ba890ec`); Qwen timeout without a gateway request ID. No repeated request was made.
- [x] Web diagnostic updated: workspace tools discover as available; two web-fetch calls returned HTTP 400 without tool events. Root cause remains unknown.
- [x] Model Switch implementation and deployment evidence commits were pushed to `main` and `hackathon/mozfest-otari-2026` with fast-forward-only updates; the branches are synchronized.
- [x] Production browser check confirms landing and Model Switch pages load, catalog discovery works, a manual selection change makes no inference request, and desktop/mobile accessibility checks pass.
- [ ] Confirm the exact deployed Git SHA in the selected `modelswitch-lab` Vercel project. The public site does not expose it; see [`production-deployment-check.json`](../evidence/production-deployment-check.json).
- [ ] Participant records and personally narrates the project demo; no video is claimed here.

## Project identity

- [x] Public repository: <https://github.com/sopskistar/modelswitch-lab>
- [x] Submission branch: `hackathon/mozfest-otari-2026`
- [x] First Otari integration commit:
      [`2be9a17c37e7154a852ed9f01fb8e09c8971844c`](https://github.com/sopskistar/modelswitch-lab/commit/2be9a17c37e7154a852ed9f01fb8e09c8971844c)
- [x] Project summary: a reproducible open-weight model evaluation workbench using hosted Mozilla Otari, deterministic scoring, cost/latency comparison, and inspectable request evidence.

## Evidence and demo

- [x] Otari request-count budget enforcement verified using only the dedicated test key: one admitted Qwen request, followed by an HTTP 403 `budget_exceeded` refusal scoped to `api_token`. Redacted evidence: [`budget-enforcement-test.json`](../evidence/budget-enforcement-test.json). The production budget was untouched; the admitted response content was empty.

- [x] Verified Otari capabilities: distinct open-weight roles, code execution, production policy routing (without failover), and one production-managed MCP tool call/result. See [proof](OTARI_PROOF.md) and [rubric matrix](RUBRIC_EVIDENCE.md).
- [x] Real model IDs, serving providers, request IDs, measured outputs and reported usage recorded in `evidence/`.
- [x] Existing project pull request #1 was merged into `main`.
- [x] Written Otari feedback: [OTARI_FEEDBACK.md](OTARI_FEEDBACK.md).
- [x] Personal demo and feedback recording outlines: [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
- [ ] Participant-recorded project demo: awaiting participant; no video is claimed.
- [ ] Participant-recorded feedback video, if submitted: awaiting participant.
- [ ] Otari repository issues or pull requests: none opened by this project work.

## Deployment

- [x] Selected live site: <https://modelswitch-lab.vercel.app> (public catalog observed with `demoEnabled: true`; exact deployment SHA remains unverified).
- [x] Production landing and Model Switch acceptance check at 2026-11-05 17:26 UTC; zero inference requests sent. See `evidence/production-ui-check.json`.
- [x] A recent bounded Llama production response is independently recorded with request ID and redacted output in `evidence/model-switch-production.json`; the paired Qwen request timed out with unknown billing status.
- [ ] Exact deployed Git commit: not independently confirmed. Inspect the selected `modelswitch-lab` Vercel project, not the similarly named duplicate.
- [ ] Verify durable Upstash behavior and the current Otari spending boundary before another live run.
- [x] On 2026-11-05 13:02 UTC, post-push production GETs returned HTTP 200 for routing evidence, MCP evidence, and catalog. MCP served `verified_live` with request ID `d9283ac4-3aec-4ee3-8151-08937bb08554`.
- [x] Later catalog check reported web fetch/search available. One bounded allowlisted fetch returned HTTP 400 (Otari request `9bd36cf5-6ddf-433a-9d1a-95295a50fae5`) without completed tool evidence; it is not a verified capability.
- [ ] Confirm the exact deployed Git SHA in the selected `modelswitch-lab` Vercel project; public evidence-route availability does not identify the deployment commit.
- [ ] Verify production result trace/receipt if accessible; do not repeat inference solely to replace missing historical metadata.

## Final repository state

`main` and `hackathon/mozfest-otari-2026` were synchronized with fast-forward-only updates after this work. Preserve the first-integration commit and merge history; do not force-push or delete the submission branch.

## Final live validation — 2026-11-05

- [x] Official production catalog returned HTTP 200 with Qwen/Llama roles, `demoEnabled: true`, and web tools available; this is discovery, not inference proof.
- [x] The production timeout diagnosis receipt returned HTTP 200. The operator confirmed deployment `ff915c5` Ready; the endpoint does not reveal a source SHA.
- [x] No paid inference was sent in this validation. The $5 production cap was planned but not confirmed, and current balance/usage reads returned 401 for both local inference keys.
- [x] Preserved prior Llama, MCP, code execution and routing receipts; routing still reports `fallback=false`.
- [x] Guardrail profile discovery explicitly reports no configured service. Per-user budgets remain unverified; key-scoped request-count enforcement is verified in the later 2026-11-06 test.
- [x] Added server-only redacted diagnostics for future gateway errors. Existing web-fetch 400 root cause remains unavailable; no retry was made.
- [x] Full local checks passed: typecheck, lint, formatting, 117 unit tests, production build, and 20 desktop/mobile Playwright tests with axe.
- [ ] Participant confirms the current $5 Otari cap and spend/headroom, then personally performs bounded Qwen/Llama and web-tool live acceptance if still desired.
- [ ] Check Vercel source revision for commits after `ff915c5`; this environment has no linked project or CLI. Do not claim the new diagnostic/evidence commits deployed until their production revision is confirmed.

Redacted check: [`final-live-validation.json`](../evidence/final-live-validation.json).

## Earlier rubric and readiness snapshot before web verification — 2026-11-06

- [x] Request-count budget enforcement verified: admitted test-key request followed by gateway HTTP 403 `budget_exceeded`; production budget was not used or changed.
- [x] Capability matrix and capability page now derive budget status from that redacted receipt; current advanced verified count is five (50/60 potential advanced points).
- [x] Fallback key now authenticates: `/models` HTTP 200 exposes the test policy alias and Qwen/Llama IDs. Provider pin, exact policy body and backup funding remain unverified, so no fallback request was sent; see [`fallback-test-readiness.json`](../evidence/fallback-test-readiness.json).
- [x] Test-workspace `/tools` reports web fetch/search `workspace_disabled`; guardrail profile discovery has no configured service, while the read-only catalog lists supported integrations. No mandate or inference was attempted; see [`guardrail-profile-check.json`](../evidence/guardrail-profile-check.json).
- [ ] Sixth advanced feature: actual fallback, an Otari guardrail verdict, web tool result, or per-user budget enforcement.
- [x] The prior evidence-refresh commit is synchronized to both branches; this final capability-verification update is pending release.
- [ ] Verify the deployed source SHA in the existing `modelswitch-lab` Vercel project. Public endpoints do not reveal the SHA; no Vercel CLI/project access is present here.
- [ ] Participant personally records and narrates the four-minute demo. No video is claimed.

## Native web-tool verification — 2026-11-06

- [x] Authenticated Default-key discovery returned both native web tools as available and confirmed tool support on the selected open-weight models.
- [x] Reproduced the hosted HTTP 400: extra `max_uses` and `allowed_domains` declaration keys were rejected with `declarations may contain only the type field`.
- [x] One corrected request completed Otari `web_fetch` for the fixed Mozilla Manifesto URL. Request `8058116e-e1b4-4f24-90d7-3b766a4f41e1`, tool `otari_wf_66cfd3e1beb54026a97306892102ec57`, Qwen/DeepInfra, settled cost `$0.010888`. See [`web-fetch-live.json`](../evidence/web-fetch-live.json).
- [x] The application now uses the accepted type-only declaration, static URL allowlist, non-parallel calls, and two-round bound; route test asserts the contract.
- [x] Evidence-backed advanced capability count is six (60/60 potential advanced points); total potential coverage is 95/100 before the participant-recorded demo. Routing remains conditional; actual fallback remains unverified.
- [ ] Deploy this revision to the existing `modelswitch-lab` Vercel project and verify `/api/evidence?file=web-fetch-live.json` and the Capabilities screen. No Vercel project credential is available in this checkout.
- [ ] Participant personally records the demo video.
