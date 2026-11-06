# Judge walkthrough

**Official app:** [modelswitch-lab.vercel.app](https://modelswitch-lab.vercel.app) · **Repository:** [sopskistar/modelswitch-lab](https://github.com/sopskistar/modelswitch-lab)

This route takes about five minutes and has a safe, read-only path. Do not run inference unless you choose the optional live path below and the operator has confirmed current spending protection. A model request can time out after reaching Otari; do not automatically retry an ambiguous request.

## Eight checkpoints

### 1. Understand the product — 20 seconds

**Open:** the landing page at `/`.

**Do:** point out the **Launch workspace** action and the product promise: test known-answer tasks, compare measured behavior, switch the active test model, and inspect gateway evidence.

**Observe:** the landing page previews the existing workbench. The active selection affects ModelSwitch requests only; it does not update another application or Otari's production policy.

### 2. Launch the workspace — 30 seconds

**Click:** **Launch workspace** or open [`/app?view=workspace`](https://modelswitch-lab.vercel.app/app?view=workspace).

**Observe:** three synthetic scenarios—invoice extraction, support classification, and bounded reasoning—with fixed expected answers. Select a scenario and a small case count. No inference begins until **Run benchmark** is pressed.

### 3. Evaluate a model — 40 seconds

**Safe path:** open **Results** and **Request trace** to inspect saved runs and receipts. The repository includes actual Otari records in [`evidence/verification.json`](../evidence/verification.json) and [`evidence/model-switch-production.json`](../evidence/model-switch-production.json).

**Optional live path:** only after confirming the current Otari key ceiling, available spend and durable rate limit, choose one synthetic case and one model, then click **Run benchmark** or **Test active model** once. Inspect the result and trace. A failed, timed out, or metadata-free request is a failure/unknown outcome, not a successful evaluation. Do not retry if billing or completion is ambiguous.

### 4. Switch models — 45 seconds

**Open:** [`/app?view=model-switch`](https://modelswitch-lab.vercel.app/app?view=model-switch).

**Do:** select Qwen 3.8 27B, then Llama 3.3 70B Instruct (or switch back). Selection is browser-scoped and sends no paid request. To test, explicitly press the active-model test action using the same synthetic fixture.

**Observe:** a subsequent request carries the selected allowlisted model ID through the server to hosted Otari. The recorded Llama `inv-01` request completed with six fields correct, effective Bedrock model `meta.llama3-3-70b-instruct-v1:0`, request `77cf5458-46f6-40c9-98ab-80468ba890ec`, and reported cost `$0.000170`. The paired Qwen attempt timed out at the application deadline with no Otari request ID; its completion and billing are unknown. These receipts are not a completed two-model comparison. The analyst remains a separate role and is not counted as a second evaluator for that case.

### 5. Interpret results and recommendation — 35 seconds

**Open:** **Results**; inspect accuracy, pass rate, schema validity, missing fields, failures, measured latency and reported cost.

**Observe:** local deterministic scoring is the source of the benchmark score. The recommendation is limited to completed comparable cases; if there is only one eligible model, the app should say that another model must be tested. Small synthetic samples do not establish universal model superiority. An explicit **Switch to recommended model** selection does not itself send inference.

### 6. Inspect requests — 35 seconds

**Click:** **Request trace**.

**Observe:** local task/scoring events are distinct from gateway metadata. Where returned, inspect requested and effective model, provider, Otari request ID, attempt/fallback metadata, latency, usage and cost. Missing metadata stays unknown. Exported receipts contain only redacted application evidence.

### 7. Verify Otari capabilities — 75 seconds

**Click:** **Otari capabilities** and open the evidence rows. Each link below is a redacted record committed in the repository; the web-fetch receipt is also currently served by the public evidence endpoint.

- **Policy routing:** [`routing-production.json`](../evidence/routing-production.json), request `5f2cc001-a521-435e-8b51-df0f91452dc5`; Otari resolved `modelswitch-fallback` to Qwen/DeepInfra, attempt 1, `fallback=false`. This verifies policy resolution, not failover.
- **Code execution:** [`verification.json`](../evidence/verification.json), request `732c1ded-aba4-4210-8cd7-1251027e367c`; hosted Python returned `correct=4`, `total=5`, `accuracy=0.8`, exit code 0. Cost was not reported.
- **MCP:** [`mcp-status.json`](../evidence/mcp-status.json), request `d9283ac4-3aec-4ee3-8151-08937bb08554`; one DeepWiki `read_wiki_structure` use and successful tool result.
- **Distinct model roles:** [`verification.json`](../evidence/verification.json); Qwen evaluator requests and a separate Llama analyst request. The analyst explains verified metrics; it does not replace deterministic scoring.
- **Budget enforcement:** [`budget-enforcement-test.json`](../evidence/budget-enforcement-test.json); isolated test key admitted one request, then Otari returned HTTP 403 `budget_exceeded`, scope `api_token`. No production key was used for that experiment.
- **Native web fetch:** [`web-fetch-live.json`](../evidence/web-fetch-live.json), request `8058116e-e1b4-4f24-90d7-3b766a4f41e1`; completed `otari_web_fetch` event `otari_wf_66cfd3e1beb54026a97306892102ec57` for the Mozilla Manifesto URL, Qwen/DeepInfra, settled cost `$0.010888`. The model summary was incomplete; only the successful native retrieval is claimed.

The policy, MCP, code, budget and web tool records are distinct demonstrations. The advanced-feature assessment is up to 60/60, with routing credit conditional on judge interpretation because no fallback occurred. Guardrails, per-user budgets and actual fallback remain unverified.

### 8. Export and inspect evidence — 20 seconds

**Open:** **Results**, select a completed run, then use its JSON or CSV download control.

**Observe:** the JSON receipt preserves model IDs, measured outputs, scoring, trace references and known limitations. It is a project record, not a cryptographic external attestation. The GitHub [`evidence/`](../evidence) directory is available if the production Capabilities view is on an older deployment.

## Optional live demonstration

Only do this with the operator's approval and current protections verified:

1. Confirm the selected production Vercel project is `modelswitch-lab`, Otari has an active hard spending ceiling, and durable Upstash limits are configured.
2. Choose one fixed synthetic invoice case and one model; send one request.
3. Inspect the inner model result, deterministic score, trace, request ID, provider, latency and reported cost.
4. If it completes and the spend boundary remains clear, you may explicitly switch the selected model and send the same case once more. Keep the runs separately identified. If a request times out or its billing is ambiguous, stop and inspect usage before any further call.

There is no guarantee every provider/model request succeeds. Intercepted Playwright fixtures test UI behavior only and are not Otari evidence.

## Production verification note

On 2026-11-06, the official production Capabilities view passed a browser check: it displayed `60 / 60` advanced points and a **Verified live** web-fetch row. The row linked to `GET /api/evidence?file=web-fetch-live.json`, which returned HTTP 200 with the matching redacted receipt. The browser check intercepted its repository-inspection action and made no inference request. These checks prove the evidence view and route are deployed; public responses do not reveal the exact Vercel source SHA. Verify the selected project's deployment revision in Vercel before attributing the whole site to a particular commit. Do not use the similarly named duplicate project.
