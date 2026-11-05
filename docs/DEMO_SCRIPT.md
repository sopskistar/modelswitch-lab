# Personal demo recording, 3–5 minutes

The participant records the actual application screen and narrates personally.
Do not generate narration, a synthetic presenter, or a fabricated screen recording.
The selected production site is https://modelswitch-lab.vercel.app. Its public
catalog was observed with `demoEnabled: true`; a participant reports an invoice
run and separate analyst response. The request IDs and receipt were not
independently recovered in this pass, so call those values participant-reported
unless you can open their live trace. Confirm the small Otari spending boundary
and durable Upstash limiter still apply before demonstrating inference.

| Time      | Show                                                                               | Explain in your own words                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0:00–0:30 | Workspace and a synthetic invoice                                                  | The developer's decision: which model solves this task reliably at an acceptable cost?                                                                         |
| 0:30–1:30 | A small live invoice run, if enabled; stop after one run | Real hosted Otari inference; deterministic scoring. Say whether values are live UI observations, participant-reported, or independently inspectable gateway evidence. |
| 1:30–2:00 | Comparison and objective weights                                                   | Tradeoffs measured only on tested cases; missing costs remain unknown                                                                                          |
| 2:00–2:35 | Separate analyst request in trace                                                  | Evaluator executes the task; another open-weight family diagnoses verified metrics                                                                             |
| 2:35–3:40 | Capabilities; inspect the routing and repository evidence records | Routing request `5f2cc001-a521-435e-8b51-df0f91452dc5` resolved the policy to Qwen/DeepInfra (`fallback=false`); MCP request `d9283ac4-3aec-4ee3-8151-08937bb08554` returned a successful DeepWiki tool result. Both redacted records are now served by the selected host (HTTP 200); exact deployed SHA remains unknown. Do not induce failure or rerun solely to recreate evidence. |
| 3:40–4:20 | Trace, JSON benchmark receipt, and reproduction guide                              | Separate gateway metadata from application events; inspect request IDs, effective models, providers, reported usage, tools, and fallback fields where returned |
| 4:20–4:45 | Known limitations                                                                  | Tiny datasets, missing hosted setup, exact verified scope                                                                                                      |

If the account becomes unfunded again: show the real 402 credit refusal, real working Python
sandbox, the available-but-unverified web tool status (one HTTP 400 with no
completed tool event), and the recorded unavailable guardrail. Say plainly
that the evidence-supported assessment is 75/100 potential; fallback, budgets,
web retrieval, guardrails, and the personal video remain outstanding. This is
an honest progress demonstration, not a 100-point completion claim.

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
