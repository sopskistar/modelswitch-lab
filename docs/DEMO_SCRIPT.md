# Personal four-minute demo recording

The participant records the actual application screen and narrates personally.
Do not generate narration, a synthetic presenter, or a fabricated screen recording.
The selected production site is https://modelswitch-lab.vercel.app. A live
browser check on Nov 5 confirmed the landing and `/app?view=model-switch`, and
that manually changing the selection sends no request. The deployment SHA is
not independently confirmed. The bounded production API smoke has one
successful Llama request and a Qwen timeout; see
[`model-switch-production.json`](../evidence/model-switch-production.json).
Confirm the Otari spending boundary and durable Upstash limiter before further
inference.

| Time      | Show                                                     | Explain in your own words |
| --------- | -------------------------------------------------------- | ------------------------- |
| 0:00–0:30 | Landing page and product purpose                        | ModelSwitch tests models against known answers so a developer can compare reliability, speed, cost, and failures. |
| 0:30–1:00 | Launch workspace; open Model Switch                     | Browser-scoped model selection changes future ModelSwitch requests; selection itself makes no paid request. |
| 1:00–1:50 | Show the completed benchmark/results and deterministic score | Explain the synthetic cases, real model response, cost/latency provenance, and that small samples are not universal rankings. Use saved receipts; only run live inference if spend controls are confirmed. |
| 1:50–2:30 | Otari policy result and fallback-test readiness          | Policy resolution is real, but the captured production request has `fallback=false`. A genuine fallback test is pending an explicit provider pin and verified backup spend; do not imply it happened. |
| 2:30–3:10 | MCP and code execution capability receipts               | Show the gateway-owned MCP tool use/result and hosted Python execution evidence. |
| 3:10–3:40 | Budget and native web-fetch receipts                     | Show the separate-key `budget_exceeded` refusal, then the completed Otari `web_fetch` event for the Mozilla Manifesto and its settled cost. |
| 3:40–4:00 | Evidence links and conclusion                            | Emphasize inspectable request IDs, routing's `fallback=false`, and the limitations, then invite judges to follow the walkthrough. |

If inference is unavailable, do not send repeated requests. Show the saved
receipts for the real Llama call, policy resolution, MCP, code execution,
budget refusal, and native web fetch. Current evidence supports up to
**95/100 potential** before the participant-recorded demo, subject to rubric
interpretation of routing without observed failover; no official score is
claimed. Guardrails, per-user budgets, actual fallback, and the personal video
remain unverified.

Before recording: hide `.env.local`, terminal history and dashboard credentials;
confirm the production SHA in Vercel; verify the Otari spend ceiling and durable
Upstash behavior; then run at most one tiny live benchmark. If those checks are
incomplete, show the real UI and dated evidence with provenance clearly stated.
Record the actual screen, not test fixtures or composited screenshots.

# Optional personal feedback recording, 3–5 minutes

1. Introduce what was actually built and the hosted account state (30 seconds).
2. Show discovery and explain why availability differs from execution (45 seconds).
3. Show the actual working Python response and missing inline cost (45 seconds).
4. Show the reproducible insufficient-funds and absent-service responses
   without secrets (45 seconds).
5. Describe the signed receipts, deterministic scorer, and evidence UI built
   locally, and where clearer Otari preflight/account setup would help (60 seconds).
6. State whether you would continue using it, with the limitations from the
   written feedback, not an invented success story (30 seconds).
