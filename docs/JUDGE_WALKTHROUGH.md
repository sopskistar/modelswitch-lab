# Judge walkthrough

Start the application and open the Workspace. No visitor key or sign-up is
needed; credentials belong on the server. If credit is still unavailable, the
run will show the genuine Otari refusal. Do not substitute unit-test results.

1. Expand a synthetic case. Read its input and expected JSON. Select one case
   initially to minimize spend; choose the evaluator discovered from hosted Otari.
2. Run the benchmark. Inspect actual output, strict schema validity, field
   matches, accuracy, latency, gateway-reported cost if present, and request ID.
   The final account run succeeded; historical credit refusals remain inspectable.
3. Once funded, compare the two permitted models on three or five cases. Change
   the objective before a new run. Explain the fixed weights and tiny sample size.
4. Inspect the separate analyst interpretation. The evaluator performed the
   target task. Llama's diagnostic call reads server-signed metrics and cannot
   change scores. A second comparison call alone is not the distinct-role proof.
5. Open Request trace. Expand a Gateway response and a Deterministic scoring
   event. The former is gateway metadata; the latter is local application work.
   Compare `requestedModel` to actual responding model and provider when returned.
6. Export JSON and CSV. Reload to confirm the recent run persists locally.
7. Open Otari capabilities. Inspect the checked-in JSON for code execution. Run
   Check sandbox: Python should return correct=4, total=5, accuracy=.8 and a real
   request ID. Those are fixed control vectors, not live benchmark outputs.
8. Inspect other capabilities without claiming them. Web requires an enabled
   workspace tool and domain policy; routing needs successful serving metadata
   and an observed fallback; guardrails need an evaluated verdict rather than
   service failure; budgets need a genuine enforced boundary.

For the targeted six advanced features, follow the exact setup and boundary
tests in [OTARI_INTEGRATION.md](OTARI_INTEGRATION.md). Today's verified advanced
evidence covers code and distinct model roles. A real five-case comparison
reported Qwen accuracy 100%, Llama 80%, total $0.001741 including the analyst. No $0 account-balance denial is counted as a budget
test. No unsafe fault, bad credential, or request flood is needed.

The open-weight IDs and primary license links are in the integration guide.
The actual provider must come from Otari's response, not model-family inference.
Check request IDs against the hosted account's Requests/Usage UI if authorized.
Keep credentials out of screenshots, developer tools, recordings and exports.

The public demo is capped at 1–5 cases per model, two fixed permitted model IDs,
400 output tokens per case, 500 analyst tokens, 12 operations/minute/client and
120/day globally with the production limiter. A separate hard gateway budget
must be attached. No browser-accessible management routes exist.
