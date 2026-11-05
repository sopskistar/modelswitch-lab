# Judge walkthrough

Open the selected demo at [modelswitch-lab.vercel.app](https://modelswitch-lab.vercel.app).
The production inference gate was enabled at last catalog check. Make one small
synthetic run only; do not repeat a completed run. If the demo gate is closed,
use the linked redacted receipts instead of retrying.

## Seven checkpoints

### 1. Open the live application

**Click:** Open the production URL.

**Observe:** The Workspace, scenario list, navigation and theme control. The
application is a benchmark workbench, not a general chat screen.

### 2. Select a synthetic benchmark

**Click:** Choose invoice extraction, support classification, or bounded
reasoning. Expand a test case.

**Observe:** Synthetic input and expected output are visible before execution;
the evaluator output is scored against that ground truth.

### 3. Select two open-weight roles

**Click:** Leave Qwen3.8 27B selected as evaluator and choose Llama 3.3 70B as
the distinct analyst role in the workspace.

**Observe:** The evaluator performs the benchmark; after deterministic scoring,
the separate analyst interprets verified metrics. See [model evidence](OTARI_PROOF.md#real-model-roles).

### 4. Run one bounded benchmark

**Click:** Select the smallest available test count and press **Run benchmark**
once.

**Observe:** Each case completes, fails, or remains skipped explicitly. The
production catalog has reported the demo gate enabled, but this is not a
guarantee that Redis limiting or spend enforcement has been independently
tested. Stop after one completed run.

### 5. Compare results and recommendation

**Click:** Open **Results** and expand the score methodology.

**Observe:** Deterministic accuracy, pass rate, measured latency and reported
cost. The recommendation follows the selected objective; it does not establish
universal model superiority from a small sample. A prior five-case run and its
reported total cost are documented as historical evidence only.

### 6. Inspect traces and receipt

**Click:** Open **Request trace**, then export the benchmark receipt.

**Observe:** Evaluator and analyst have distinct Otari request IDs, identities,
providers and timings when returned. The JSON receipt is local evidence, not a
signed attestation. Historical real request records are linked from
[OTARI_PROOF.md](OTARI_PROOF.md).

### 7. Inspect Otari capabilities

**Click:** Open **Otari capabilities**. Inspect **Routing and fallbacks** and
**Repository evidence inspector** via **Inspect JSON**.

**Observe:** Routing shows the production policy, effective Qwen model,
DeepInfra provider, request ID, latency, reported cost, one attempt, and
`fallback=false`. This proves real policy resolution; no failover was observed.
The MCP row links the redacted production proof of one real Otari-managed
DeepWiki MCP call, its successful result, request ID, Qwen/DeepInfra identity,
and one attempt. The source has the corrected event parser and production
evidence, but the last production read still returned the earlier unverified
MCP record; do not claim the new evidence screen is deployed until Vercel
serves it. See [`routing-production.json`](../evidence/routing-production.json),
[`mcp-status.json`](../evidence/mcp-status.json), and [the capability matrix](RUBRIC_EVIDENCE.md).

## Operator-only evidence

These require authorized Otari workspace or owner setup and are not public-demo
actions:

- Routing is publicly demonstrable through the fixed policy check; no safe
  fallback event is yet proven. Do not alter the production policy to force it.
- Budget: two operator-reported $1 monthly ceilings exist; no gateway refusal
  or usage-record proof is available, and neither ceiling was exhausted.
- Web search/fetch and inference guardrails: unavailable in the current hosted
  workspace discovery.
- Per-user budgets: no service-key/user-budget workflow has been executed.

The selected production `/api/catalog` and evidence routes are reachable, but
the exact Vercel source commit is not independently known. The current live
MCP transaction is recorded in the redacted evidence files; do not claim a
newly committed verifier is deployed until the evidence route serves the
updated record.
