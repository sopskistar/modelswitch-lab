# Judge walkthrough

## Before you begin

There is currently **no confirmed production URL**. The project has not been deployed to Vercel. Until the owner provides a live URL, use a locally configured server; local setup is in the [README](../README.md#run-locally). The public demo must remain disabled until a durable request limiter and an Otari-side spending ceiling are in place.

The five-case historical comparison is in [`evidence/browser-smoke.json`](../evidence/browser-smoke.json). The latest one-case live smoke is in [`evidence/polish-live-smoke.json`](../evidence/polish-live-smoke.json). Both contain real Otari responses, not test fixtures. Test-suite intercepts are not evidence of hosted execution.

## Seven checkpoints

### 1. Open the application

**Public visitor:** Open the deployed URL when one is available, or start the locally configured app. No visitor API key or sign-in is needed. If the owner has not enabled public inference, the page still loads and clearly shows setup or demo-disabled state.

**Observe:** The Workspace, scenario ledger, theme control, and view navigation. This is an evaluation workbench, not a general chat screen.

### 2. Select a synthetic scenario

Choose invoice extraction, support classification, or bounded reasoning. Expand a case in **Test cases** to see the synthetic input and expected answer. Keep the count small for the demonstration.

**Observe:** The expected values are visible before execution, so a judge can independently understand how a response is scored.

### 3. Choose two open-weight models

Select the configured evaluator and analyst models in the model list. If the operator has restricted the public demo to one permitted model, use the independently inspectable two-role evidence linked above instead.

**Observe:** The evaluator performs benchmark tasks. The analyst is a distinct model and makes a separate request after verified results exist. Model IDs come from the gateway catalog; serving provider/model come from the Otari response.

### 4. Execute the benchmark

Select a small number of cases, choose an objective, and press **Run benchmark**. This makes real hosted Otari calls when the operator has enabled execution and configured credit.

**Observe:** Results arrive case by case. Failures and unsubmitted cases remain visible; the app never replaces them with fixture outputs. A request can incur cost even if the browser loses its response.

### 5. Compare measured results

Open **Results**. Compare per-model accuracy, pass rate, latency, reported cost, errors, and deterministic score. Read **Recommended for these cases** for the selected objective's winner and any accuracy or cost tradeoff.

**Observe:** Weights are exposed under **Score formula and full metrics**. Historical evidence has a five-case sample: Qwen 5/5, Llama 4/5, and $0.001741 reported cost including analyst. It is one dated run, not a live average or universal ranking.

### 6. Inspect requests and analyst role

Open **Request trace**. Expand application and gateway events. Find request ID, requested and effective model, provider, gateway attempts/fallback header, latency, usage, and reported cost where returned. Open **Results** to see the separate analyst interpretation and metadata.

**Observe:** Application scoring is distinct from gateway metadata. The analyst interprets verified metrics but does not set or override scores. JSON export downloads a benchmark receipt with request evidence and known limits.

### 7. Inspect hosted Otari evidence

Open **Otari capabilities**. The current refreshed catalog shows code execution available, both web tools workspace-disabled, and no configured inference guardrail service. Routing and budget management require an authorized management credential.

**Observe:** Only completed hosted execution with an actual request ID earns a verified label. See [OTARI_PROOF.md](OTARI_PROOF.md) for redacted evidence, including the code request, distinct model requests, and the routing request that resolved without failover.

## Operator-only checks

These require Otari workspace/owner permissions and must not be presented as public-demo actions:

- Enable web fetch/search with a narrow domain allowlist, then capture an actual returned tool call.
- Configure an isolated fallback policy using the documented safe test method and capture `Otari-Fallback: true`.
- Create a dedicated low-limit key or budget and capture a gateway budget denial distinct from account balance or app rate limits.
- Configure the hosted inference guardrail service and capture an evaluated block verdict.

The inference key alone returned authentication errors for routing and budget management. No management token, unsafe credential, policy mutation, flood, or fake result was used. Exact blockers and reproduction guidance are in the [evidence matrix](RUBRIC_EVIDENCE.md) and [Otari integration guide](OTARI_INTEGRATION.md).
