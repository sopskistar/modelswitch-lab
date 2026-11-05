# Personal demo recording, 3–5 minutes

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

| Time      | Show                                                     | Explain in your own words                                                                                          |
| --------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 0:00–0:25 | Landing page, then Launch workspace                      | The product tests, compares, and switches the model used for future ModelSwitch requests.                          |
| 0:25–1:15 | Model Switch: active model, fixed invoice fixture, result | A model switch is browser-scoped; only the explicit test button sends a request.                                    |
| 1:15–1:50 | Switch to the second model; inspect its result           | After testing, show actual effective model/provider and request ID. Current production record has Llama success and Qwen timeout.  |
| 1:50–2:20 | Deterministic comparison and recommendation              | The recommendation uses successful same-fixture evidence; one case is not a general ranking.                      |
| 2:20–2:55 | Otari fallback policy outcome                            | Current policy evidence shows Qwen/DeepInfra, one attempt, `fallback=false`; a manual switch is not failover.       |
| 2:55–3:35 | Request trace and receipt                                 | Separate app events from actual gateway metadata and show reported usage only.                                     |
| 3:35–4:20 | Capabilities and evidence                                 | Show MCP and code execution receipts; state that web fetch returned 400 without a tool event.                      |
| 4:20–4:45 | Limitations                                               | Tiny fixture sample, Qwen timeout in latest smoke, no verified gateway budget refusal or actual fallback.          |

If inference is unavailable, do not send repeated requests. Show the existing
redacted Llama receipt, actual routing and MCP evidence, and the real web-fetch
400 diagnostic. The evidence-supported assessment remains up to 75/100
potential, conditional on rubric interpretation of policy routing. Budget
enforcement, web retrieval, guardrails, per-user budgets, actual fallback, and
the personal video remain unverified.

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
