# Judge walkthrough

Start at the selected public demo: [modelswitch-lab.vercel.app](https://modelswitch-lab.vercel.app). **Production browser check, Nov 5, 2026:** the landing and `/app?view=model-switch` both loaded; the Otari catalog returned the permitted Qwen and Llama models. A manual browser selection changed to Llama without making an inference request. Desktop and 390px mobile checks had no axe violations, page errors, or horizontal overflow. The exact Vercel deployment SHA remains unconfirmed. See the [production check record](../evidence/production-deployment-check.json) and real [desktop](screenshots/production-landing-desktop.png) / [mobile](screenshots/production-model-switch-mobile.png) captures.

## Seven checkpoints

### 1. Open the product

**Click:** **Launch workspace** on the landing page. In the app, choose **Model switch**.

**Observe:** Available model IDs come from the Otari catalog and are restricted to the configured evaluator/analyst pair. The active choice is saved in this browser only.

### 2. Test Qwen on a known case

**Click:** Select Qwen if it is not active. Only press **Test Qwen3.8 27B** after the operator confirms the current Otari spend limit and remaining balance. Otherwise inspect the saved timeout receipt and continue to the existing completed Llama evidence without sending inference.

**Observe:** The fixed synthetic invoice `inv-01` is sent only after the click. Expand the result to inspect the model response, deterministic six-field score, effective model, provider, Otari request ID, measured latency, reported cost, and fallback metadata where returned. The prior production Qwen attempt timed out at the app's 22-second wait deadline without an Otari request ID; completion and billing are unknown. Inspect [`qwen-timeout-diagnosis.json`](../evidence/qwen-timeout-diagnosis.json); do not retry without confirmed spend headroom.

### 3. Switch to Llama and send the same fixture

**Click:** **Switch to Llama 3.3 70B Instruct**, then **Test Llama 3.3 70B Instruct**.

**Observe:** Changing selection alone sends no request. The next explicit request carries the selected model ID to the server route and then hosted Otari. The production API smoke confirmed Llama served by `bedrock`, request `77cf5458-46f6-40c9-98ab-80468ba890ec`, six of six fields correct, 929 ms, reported cost $0.000170. Browser tests also verify both switch directions and request payload selection, but those tests intercept requests and are not live Otari evidence. The latest Qwen/Llama production smoke record is [`model-switch-production.json`](../evidence/model-switch-production.json).

### 4. Compare and choose

**Click:** Review the two same-fixture results. If both have valid completed results, inspect the deterministic recommendation and choose **Switch to [model]**.

**Observe:** The recommendation orders verified same-fixture scores by field accuracy and schema validity, then measured latency and reported cost. Accepting it updates the browser-scoped model and makes no request by itself. One fixture cannot establish general superiority. If only one model has a valid result, the app asks you to test another before comparing.

### 5. Inspect traces

**Click:** Open **Request trace**.

**Observe:** Model Switch requests appear with their actual response metadata, separately from full benchmark runs and application events. Missing model metadata after a timeout remains unknown; the UI does not infer which provider served it.

### 6. Check Otari policy routing

**Click:** Return to **Model switch** and use **Use Otari fallback policy** once.

**Observe:** The app sends the configured `modelswitch-fallback` alias to hosted Otari without application retry. Current verified policy evidence resolved to Qwen through DeepInfra with one attempt and `fallback=false`: the primary succeeded and no fallback occurred. This is distinct from manually selecting Llama. Inspect [`routing-production.json`](../evidence/routing-production.json). Do not describe this receipt as an actual failover.

### 7. Inspect other verified capabilities

**Click:** Open **Otari capabilities**, then inspect the **Repository evidence inspector** and **Code execution** evidence.

**Observe:** MCP proof records a completed Otari-managed DeepWiki tool use/result; code proof records a successful hosted sandbox computation. Native Otari web fetch is now verified by request `8058116e-e1b4-4f24-90d7-3b766a4f41e1`: Qwen/DeepInfra completed tool `otari_wf_66cfd3e1beb54026a97306892102ec57` for the Mozilla Manifesto URL at a settled `$0.010888`. Open the Web retrieval row and inspect [`web-fetch-live.json`](../evidence/web-fetch-live.json). The hosted endpoint rejected the old extra declaration fields; the corrected request used only `type`, one non-parallel fetch iteration, and the fixed allowlisted URL. The model summary ended mid-sentence, so the verified claim is Otari's completed retrieval, not a complete factual answer. Guardrails and per-user budgets remain unverified. See the [rubric matrix](RUBRIC_EVIDENCE.md).

Native retrieval lets a developer distinguish a model's own answer from information the gateway actually fetched, and gives benchmark tasks a reproducible public source.

## Operator-only items

- The operator can reproduce the isolated test-key budget proof from [`budget-enforcement-test.json`](../evidence/budget-enforcement-test.json): a tiny Qwen request was admitted and billed `$0.000095`, then one follow-up returned HTTP 403 `budget_exceeded` with scope `api_token`. The first model answer was empty; the proof is about gateway enforcement. No production key was used and no third request was sent. The earlier usage-read 401 preflight is recorded separately in [`budget-enforcement-preflight.json`](../evidence/budget-enforcement-preflight.json).

- The isolated budget proof is now real: one admitted Qwen request cost `$0.000095`, followed by HTTP 403 `budget_exceeded` at scope `api_token`. The first answer was empty; use this only to demonstrate gateway enforcement. See [`budget-enforcement-test.json`](../evidence/budget-enforcement-test.json).
- No safe fallback event is recorded. The dedicated key now authenticates and sees the `modelswitch-fallback-proof` alias, but the inference key cannot inspect its policy body and cannot prove provider selection. In **ModelSwitch Fallback Test**, explicitly set DeepInfra `fallback-test` to **Always use this key**, confirm the isolated Qwen→Llama policy and funded backup, then request one tiny test. Afterwards restore **Follow the organization**. See [readiness evidence](../evidence/fallback-test-readiness.json).
- Do not change the production routing policy or enable the invalid credential in Default workspace.
- Guardrail discovery reports no configured service/profile, though the Otari build lists guardrail integrations. An owner/admin must configure an actual service or guardrail definition, then mandate it only to the test workspace (`workspace_ids` is the documented API scope). Test one harmless adversarial input and a legitimate control, and inspect actual gateway decisions. No organization-wide mandate was changed. See [profile check](../evidence/guardrail-profile-check.json) and [Otari's guardrail guide](https://github.com/mozilla-ai/otari/blob/main/docs/guardrails.md).
- Vercel logs are inaccessible from this checkout. The adapter now logs a redacted `[otari_request_failed]` record for a future failure; an authorized operator should inspect one existing request's dashboard activity or provide the next single request's log before a retry.
- Per-user budgets have not been configured or verified.
- Before any additional live run, confirm the Otari spend ceiling and durable Upstash limiter. `demoEnabled: true` only confirms an environment condition; it does not prove Redis behavior.
- The operator confirmed `ff915c5` Ready. Read-only production checks confirm the new timeout evidence endpoint is served, but the public site does not provide a source SHA for future deployments. Check Vercel's selected project's source revision before claiming later changes are deployed.
