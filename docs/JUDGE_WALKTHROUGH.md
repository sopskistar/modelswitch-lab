# Judge walkthrough

## Before you begin

The production application is live at [modelswitchlab.vercel.app](https://modelswitchlab.vercel.app). On 2026-11-05, the site and public catalog were checked directly. The production catalog reports `demoEnabled: false`; the Run button is disabled and the execution route returns `503 demo_disabled`. You can inspect the full workspace and evidence views, but cannot run a production benchmark until durable rate limiting and an Otari-side spending ceiling are confirmed. Local setup is in the [README](../README.md#run-locally).

The five-case historical comparison is in [`evidence/browser-smoke.json`](../evidence/browser-smoke.json). The latest one-case live smoke is in [`evidence/polish-live-smoke.json`](../evidence/polish-live-smoke.json). Both contain real Otari responses, not test fixtures. Test-suite intercepts are not evidence of hosted execution.

## Seven checkpoints

### 1. Open the application

**Public visitor:** Open the [production site](https://modelswitchlab.vercel.app). No visitor API key or sign-in is needed. The page loads with an explicit public-inference-disabled state.

**Observe:** The Workspace, scenario ledger, theme control, and view navigation. This is an evaluation workbench, not a general chat screen.

### 2. Select a synthetic scenario

Choose invoice extraction, support classification, or bounded reasoning. Expand a case in **Test cases** to see the synthetic input and expected answer. The production workspace exposes all three scenarios and permits setup changes; its Run button remains disabled while the demo gate is off.

**Observe:** The expected values are visible before execution, so a judge can independently understand how a response is scored.

### 3. Choose two open-weight models

The live catalog currently lists Qwen3.8 27B (`alibaba/qwen3.8-27b`) and Llama 3.3 70B Instruct (`meta/llama-3.3-70b-instruct`). You can inspect their roles and select them in the workspace; production inference is not enabled. Use the independently inspectable two-role records linked above for actual executions.

**Observe:** In prior recorded runs, the evaluator performed the benchmark task and the distinct analyst made a separate request after verified results existed. Model IDs came from the gateway catalog; serving provider/model came from Otari responses. Production currently allows inspection and selection, not execution.

### 4. Execute the benchmark

Production observation: **Run benchmark** is disabled. A safe empty POST returned 503 `demo_disabled` before request parsing or upstream execution. Do not present that refusal as a benchmark or run production inference until the operator has confirmed rate and spend protections.

**Observe:** There are no production results until the operator enables the protected demo. In an enabled run, outcomes arrive case by case; failures and unsubmitted cases remain visible, and the app does not replace them with fixtures.

### 5. Compare measured results

Open **Results**. The empty state is shown for a fresh browser. Historical comparisons are linked above and in the evidence matrix; they are dated records, not production results.

**Observe:** Weights are exposed under **Score formula and full metrics**. Historical evidence has a five-case sample: Qwen 5/5, Llama 4/5, and $0.001741 reported cost including analyst. It is one dated run, not a live average or universal ranking.

### 6. Inspect requests and analyst role

Open **Request trace**. A fresh production browser has no traces, which is the correct empty state. The real request IDs, models, providers, and usage from previous Otari executions are in [OTARI_PROOF.md](OTARI_PROOF.md). JSON export is only available after a run; no production receipt was generated during acceptance because inference is disabled.

**Observe:** In completed runs, application scoring is distinct from gateway metadata. The analyst interprets verified metrics but does not set or override scores. JSON export downloads a benchmark receipt after a run; the fresh production state has no receipt to export.

### 7. Inspect hosted Otari evidence

Open **Otari capabilities**. The production catalog reports code execution available and both web tools workspace-disabled. This is tool availability, not proof of a production tool execution. No current production guardrail status, routing failover, or budget enforcement was verified.

**Observe:** Only completed hosted execution with an actual request ID earns a verified label. See [OTARI_PROOF.md](OTARI_PROOF.md) for redacted historical evidence, including the code request, distinct model requests, and the routing request that resolved without failover.

## Operator-only checks

These require Otari workspace/owner permissions and must not be presented as public-demo actions:

- Enable web fetch/search with a narrow domain allowlist, then capture an actual returned tool call.
- Configure an isolated fallback policy using the documented safe test method and capture `Otari-Fallback: true`.
- Create a dedicated low-limit key or budget and capture a gateway budget denial distinct from account balance or app rate limits.
- Configure the hosted inference guardrail service and capture an evaluated block verdict.

The inference key alone returned authentication errors for routing and budget management. No management token, unsafe credential, policy mutation, flood, or fake result was used. Exact blockers and reproduction guidance are in the [evidence matrix](RUBRIC_EVIDENCE.md) and [Otari integration guide](OTARI_INTEGRATION.md).
