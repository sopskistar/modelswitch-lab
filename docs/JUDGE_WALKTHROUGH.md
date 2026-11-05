# Judge walkthrough

Start at the selected public demo: [modelswitch-lab.vercel.app](https://modelswitch-lab.vercel.app). **Deployment status checked Nov 5, 2026:** the domain still serves the previous workspace at `/` and returns 404 for `/app?view=model-switch`; this commit has not reached production. The walkthrough below describes the verified local build. Until the existing `modelswitch-lab` Vercel project deploys commit `1e74ef7`, judges should inspect the committed receipts and follow the prior production capabilities page. See [`production-deployment-check.json`](../evidence/production-deployment-check.json) for Vercel request IDs and the operator action.

## Seven checkpoints

### 1. Open the product

**Click:** **Launch workspace** on the landing page. In the app, choose **Model switch**.

**Observe:** Available model IDs come from the Otari catalog and are restricted to the configured evaluator/analyst pair. The active choice is saved in this browser only.

### 2. Test Qwen on a known case

**Click:** Select Qwen if it is not active, then press **Test Qwen3.8 27B** once.

**Observe:** The fixed synthetic invoice `inv-01` is sent only after the click. Expand the result to inspect the model response, deterministic six-field score, effective model, provider, Otari request ID, measured latency, reported cost, and fallback metadata where returned. A recent bounded production Qwen attempt timed out without a request ID; do not repeatedly retry if it does so again.

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

**Observe:** The app sends the configured `modelswitch-fallback` alias to hosted Otari without application retry. Current verified policy evidence resolved to Qwen through DeepInfra with one attempt and `fallback=false`: the primary succeeded and no fallback occurred. This is distinct from manually selecting Llama. Inspect [`routing-production.json`](../evidence/routing-production.json).

### 7. Inspect other verified capabilities

**Click:** Open **Otari capabilities**, then inspect the **Repository evidence inspector** and **Code execution** evidence.

**Observe:** MCP proof records a completed Otari-managed DeepWiki tool use/result; code proof records a successful hosted sandbox computation. Web discovery now reports tools available, but requests `9bd36cf5-6ddf-433a-9d1a-95295a50fae5` and `32697174-cde5-4bbd-9cf3-df3f02f01542` both returned HTTP 400 with no tool event. Do not count web retrieval. The [rubric matrix](RUBRIC_EVIDENCE.md) separates verified features from blocked ones.

## Operator-only items

- Do not change the production routing policy to force failover. No safe fallback event is recorded.
- Two $1 monthly ceilings are operator-reported; no budget refusal or usage-limit evidence was obtained. Do not exhaust either key.
- The raw sanitized Otari diagnostic for either web-fetch 400 is needed before a single corrected retry.
- Hosted inference guardrails and per-user budgets have not been configured or verified.
- Before any additional live run, confirm the Otari spend ceiling and durable Upstash limiter. `demoEnabled: true` only confirms an environment condition; it does not prove Redis behavior.
- Public API/model smoke evidence does not prove the new landing or Model Switch UI is deployed. Confirm the selected Vercel project’s deployment commit; do not infer it from static evidence URLs.
