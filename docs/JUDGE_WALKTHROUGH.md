# Judge walkthrough

## Before you begin

Open the selected production application at [modelswitch-lab.vercel.app](https://modelswitch-lab.vercel.app) (with a hyphen). A read-only catalog observation returned `demoEnabled: true`; the separate participant-reported invoice run is recorded in [`production-observation.json`](../evidence/production-observation.json), but its request IDs and receipt were not independently retrieved. Prior independently inspectable Otari request records are in [`evidence/browser-smoke.json`](../evidence/browser-smoke.json) and [`evidence/polish-live-smoke.json`](../evidence/polish-live-smoke.json). Intercepted test responses are never live evidence.

## Seven checkpoints

### 1. Open the application

**Public visitor:** Open the [production site](https://modelswitch-lab.vercel.app). No visitor API key or sign-in is needed.

**Observe:** The Workspace, scenario ledger, theme control, and view navigation. This is an evaluation workbench, not a general chat screen.

### 2. Select a synthetic scenario

Choose invoice extraction, support classification, or bounded reasoning. Expand a case in **Test cases** to see the synthetic input and expected answer. The production catalog previously showed the demo gate enabled; if the Run action is unavailable at recording time, inspect the evidence below rather than retrying repeatedly.

**Observe:** The expected values are visible before execution, so a judge can independently understand how a response is scored.

### 3. Choose two open-weight models

The catalog lists Qwen3.8 27B (`alibaba/qwen3.8-27b`) and Llama 3.3 70B Instruct (`meta/llama-3.3-70b-instruct`). The participant reports a production Qwen evaluator run and separate Llama analyst call; inspect the production evidence record and distinguish its provenance from gateway request receipts.

**Observe:** In prior recorded runs, the evaluator performed the benchmark task and the distinct analyst made a separate request after verified results existed. Model IDs came from the gateway catalog; serving provider/model came from Otari responses. A recent production catalog observation reported the demo gate enabled; private rate/spend protections were not independently inspected in this pass.

### 4. Execute the benchmark

Select a small synthetic invoice sample and run it once. The participant reports Qwen 3/3 with a separate Llama analyst. If repeating this at a live recording, use the smallest sample and stop after the first completed run. Do not call the user-reported values independently verified without its trace/request IDs.

**Observe:** In a completed run, outcomes arrive case by case; failures and unsubmitted cases remain visible, and the app does not replace them with fixtures. Stop after one successful run; the participant-reported result lacks an independently available trace/receipt.

### 5. Compare measured results

Open **Results** and compare measured accuracy, pass rate, latency and cost. The reported production result is Qwen 3/3 at $0.001710, Llama analyst at $0.000237, total $0.001947; compare those only as a participant-reported observation. The older independent five-case comparison remains in the evidence files.

**Observe:** Weights are exposed under **Score formula and full metrics**. Historical evidence has a five-case sample: Qwen 5/5, Llama 4/5, and $0.001741 reported cost including analyst. It is one dated run, not a live average or universal ranking.

### 6. Inspect requests and analyst role

Open **Request trace** and inspect the evaluator and separate analyst events. Export a receipt after the run. The currently available participant report did not include request IDs or the receipt, so it is not independently corroborated; historical trace IDs and provider metadata are linked in [OTARI_PROOF.md](OTARI_PROOF.md).

**Observe:** In completed runs, application scoring is distinct from gateway metadata. The analyst interprets verified metrics but does not set or override scores. JSON export downloads a benchmark receipt after a run. The participant's reported run did not include a receipt that can be independently inspected here.

### 7. Inspect hosted Otari evidence

Open **Otari capabilities**. Routing and code checks each make one real request; **Inspect repository** attempts a fixed Qwen + DeepWiki managed MCP call, and the result counts only if the streamed Otari response contains a matching tool-use/result pair. Web tools are reported `workspace_disabled`; no fallback event or budget refusal is verified.

**Observe:** Only completed hosted execution with actual request evidence earns verified status. The MCP implementation remains unverified until a real call returns and is saved. See [OTARI_PROOF.md](OTARI_PROOF.md) for request IDs and status.

## Operator-only checks

These require Otari workspace/owner permissions and must not be presented as public-demo actions:

- Enable web fetch/search with a narrow domain allowlist, then capture an actual returned tool call.
- Configure an isolated fallback policy using the documented safe test method and capture `Otari-Fallback: true`.
- Create a dedicated low-limit key or budget and capture a gateway budget denial distinct from account balance or app rate limits.
- Configure the hosted inference guardrail service and capture an evaluated block verdict.

The inference key alone returned authentication errors for routing and budget management. No management token, unsafe credential, policy mutation, flood, or fake result was used. Exact blockers and reproduction guidance are in the [evidence matrix](RUBRIC_EVIDENCE.md) and [Otari integration guide](OTARI_INTEGRATION.md).
