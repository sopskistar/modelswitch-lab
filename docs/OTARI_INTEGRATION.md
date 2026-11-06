# Hosted Otari integration

The only inference gateway is hosted Otari. No local gateway or direct provider
API is used. Reviewed on 2026-11-04:

- [Repository](https://github.com/mozilla-ai/otari)
- [API reference](https://github.com/mozilla-ai/otari/blob/main/docs/api-reference.md)
- [Models](https://github.com/mozilla-ai/otari/blob/main/docs/models.md)
- [Routing](https://github.com/mozilla-ai/otari/blob/main/docs/routing.md)
- [Tools](https://github.com/mozilla-ai/otari/blob/main/docs/tools.md)
- [Guardrails](https://github.com/mozilla-ai/otari/blob/main/docs/guardrails.md)
- [Dashboard, budgets, and per-key spending limits](https://github.com/mozilla-ai/otari/blob/main/docs/dashboard.md)
- [MCP tools](https://github.com/mozilla-ai/otari/blob/main/docs/mcp.md)
- [Access control](https://github.com/mozilla-ai/otari/blob/main/docs/access-control.md)

First genuine integration commit:
[`2be9a17c37e7154a852ed9f01fb8e09c8971844c`](https://github.com/sopskistar/modelswitch-lab/commit/2be9a17c37e7154a852ed9f01fb8e09c8971844c).
It connects the hosted gateway and records live discovery and inference
refusals. Its title deliberately does not claim successful model inference.
First successful role-inference/workbench commit:
[`afdf63aa636c9df00aeb7455fe575f35bf3d7d8d`](https://github.com/sopskistar/modelswitch-lab/commit/afdf63aa636c9df00aeb7455fe575f35bf3d7d8d).
This records three real Qwen tasks, a separate Llama analyst, policy resolution,
Python execution, and the five-case live browser comparison. Both commit URLs
are published with the hackathon branch.

## Configuration and discovery

Copy `.env.example` to `.env.local`; set `OTARI_API_KEY`, `OTARI_BASE_URL`,
`OTARI_EVALUATOR_MODEL`, and `OTARI_ANALYST_MODEL`. `OTARI_FALLBACK_POLICY` is
optional for core benchmarks. Use `https://api.otari.ai/api/v1` for the US or
`https://eu.api.otari.ai/api/v1` for the EU. Keys are region-specific; 421 is
reported as a region error. Never use `NEXT_PUBLIC_` for these variables.

```sh
npm run otari:inspect
npm run otari:verify
```

Inspect is read-only. Verify is operator-only, at most seven bounded execution
calls, with no management mutations or automatic retries. It stops evaluator
calls on insufficient credit and still tests the advertised sandbox and the
fail-closed guardrail independently. Attach a small hard gateway budget first.
`-- --capabilities-only` runs just the sandbox and guardrail checks after discovery.
Review generated JSON before publishing it. Scripts require `.env.local` and
Node 22; `--conditions=react-server` enables the server-only import in these CLI
programs. Do not use that condition for ordinary test or browser tooling.

Observed hosted account: US; refreshed read-only on 2026-11-04 at
23:15:18 UTC. `/models` returned 162 entries. `otari_code_execution` is
available; web fetch and search both report `workspace_disabled`; no guardrail
service is configured. Routing and budget management reads return
authentication errors with the inference key. We did not request or expose a
management token. See the current [discovery record](../evidence/discovery.json)
and [Otari proof](OTARI_PROOF.md). Discovery alone does not prove a paid model
request or budget boundary.

## Open-weight roles and licensing

| Role | Gateway catalog ID | Family | Primary license evidence | Live inference |
| --- | --- | --- | --- | --- |
| Evaluator | `alibaba/qwen3.8-27b` | Qwen | [Model card and weight files](https://huggingface.co/Qwen/Qwen3.8-27B), Apache 2.0 | **Completed live** |
| Analyst | `meta/llama-3.3-70b-instruct` | Llama | [Meta model card](https://huggingface.co/meta-llama/Llama-3.3-70B-Instruct), Llama 3.3 Community License | **Completed live** |

Successful evaluator evidence: request `2070b955-78a2-4a8a-a02d-d72df5e5f1f9`
served `Qwen/Qwen3.8-27B` through `deepinfra`, then scored exactly against the
synthetic invoice. Classification and reasoning also passed. Analyst request
`bd24f101-ff53-452a-97a6-27016e8e8600` served
`meta.llama3-3-70b-instruct-v1:0` through `bedrock` and diagnosed those verified
metrics. The five-case browser comparison and analyst are in
`evidence/browser-smoke.json`; total reported cost $0.001741. Initial smoke
refusals are historical; funded inference subsequently succeeded.

These are distinct open-weight families. Llama's custom license includes
conditions; it is not described here as OSI open source. License evidence
establishes released weights, not successful inference. The evaluator handles
the actual extraction/classification/reasoning task. The analyst receives signed,
verified metrics in a separate request and diagnoses the result. Sending the
same benchmark task to two models is comparison, not the distinct-role proof.

## Routing and a safe fallback demonstration

In the hosted dashboard, open Routing and inspect `modelswitch-fallback`. If
creating a policy, choose Fallback, enter a unique policy name, select the exact
accessible evaluator ID, and add the analyst ID as a backup. Keep configuration
in Otari; the application sends the policy name as `model`. It does not simulate
fallback with a second application call.

The capabilities check records `Otari-Model`, `Otari-Provider`,
`Otari-Attempt-Count`, `Otari-Fallback`, and `Otari-Request-ID` when returned.
The production app request `5f2cc001-a521-435e-8b51-df0f91452dc5` resolved
through DeepInfra with one attempt, `fallback:false`, and a reported cost of
$0.000159. This verifies policy routing in the application; it does not prove
that a fallback occurred. The status/evidence view explicitly keeps those facts
separate.

A genuine isolated failover is now verified in
[evidence/fallback-live-proof.json](../evidence/fallback-live-proof.json). One
request through modelswitch-fallback-proof returned Otari-Fallback=true,
attempt count 2, and the Llama/Bedrock backup. The production policy was not
modified. The gateway response and usage summary did not expose the primary
attempt's detailed error reason.

## Web document check

Current hosted account evidence says both built-in web tools are
`workspace_disabled`. The inference key cannot change this. An authorized
workspace owner/admin should open **Tools → Web search** in the Otari dashboard,
enable the workspace web-access policy, and set the allowed-domain list to
`www.mozilla.org` and `raw.githubusercontent.com`. Then refresh discovery. If
the tools still report unavailable, an authorized deployment operator must
configure/enable the deployment search/fetch backend: a workspace policy cannot
enable a missing backend or override operator restrictions. The exact current
policy and backend split is in Otari's [tools guide](https://github.com/mozilla-ai/otari/blob/main/docs/tools.md)
and [dashboard guide](https://github.com/mozilla-ai/otari/blob/main/docs/dashboard.md).
No such account changes were made here.
The UI exposes only two exact HTTPS document URLs; custom URLs, credentials,
ports, queries, fragments, private destinations, and host lookalikes are rejected.
Otari must also enforce redirect and DNS/network safety. A fetch declaration can
authorize model-directed requests, so configure the workspace domain restriction
before enabling this feature publicly. The request uses `otari_web_fetch`, one
declared use and two tool-loop rounds. A completed `otari_tool_calls` web-fetch
entry is required for verification; a model's claim it fetched is insufficient.
The answer is a sourced document summary, not a deterministic benchmark score.
Web search can substitute if enabled and genuinely executed; no app HTTP fetch
is used as a rubric substitute.

## Verified code execution

`POST /code/execute` received fixed Python and a five-second execution limit.
The actual response was `code_execution.result`, exit 0, stdout
`{"correct":4,"total":5,"accuracy":0.8}`. Request ID:
`732c1ded-aba4-4210-8cd7-1251027e367c`. See `evidence/verification.json`.
This verifies the code target independently of model credit. The vectors are
explicit control data, not fabricated model outputs. No user-authored Python
is accepted. The endpoint returned no inline cost; cost stays unknown.

## Real budget setup and boundary test

An Otari organization owner/admin or deployment operator must create a small
test budget under **Organization → Spend and budgets**, then attach it to a
dedicated test API key. The current [dashboard guide](https://github.com/mozilla-ai/otari/blob/main/docs/dashboard.md)
also describes setting an existing budget or a custom spend amount/reset on an
API key's create/edit form. A budget record alone enforces nothing until
attached.
For a safe boundary demonstration, use a separate operator-created test key
with a request limit of 1 and a small dollar cap. Admit one tiny call, then send
one more. Record the actual refusal code `budget_exceeded`, request ID,
`Otari-Budget-Scope`, and `Retry-After` when returned; restore the normal demo
configuration afterwards. Do this locally, never through a public management
route. Do not attach a zero budget to the only working demonstration key.

The observed 402 `insufficient_funds` balance refusal is **not** a budget-limit
test. Management credentials are unavailable, so no budget was created or changed.
No live budget value is displayed without an authorized gateway response.
The current recheck again returned authentication for `/budgets`. No isolated
test credential or budget was created, and the configured inference key's
balance is not represented as an enforced spending ceiling.

## Managed MCP repository inspection

The capabilities page offers a fixed, read-only repository inspection for
`mozilla-ai/otari` through DeepWiki at `https://mcp.deepwiki.com/mcp`. It
passes `mcp_servers` directly to hosted Otari's `/messages` endpoint, restricts
the exposed tool to `read_wiki_structure`, and caps output at 180 tokens and
the managed loop at two iterations. It does not accept arbitrary URLs or
repository identifiers. Otari's current [MCP guide](https://github.com/mozilla-ai/otari/blob/main/docs/mcp.md)
documents inline servers and the streamed `mcp-client-2025-11-20` activity
blocks. Otari puts the opaque id on `mcp_tool_use`; the following result carries
content and `is_error`, without repeating that id/name. The verifier therefore
requires one allowed tool use and exactly one successful result after it in a
complete stream, along with the gateway request ID.

One bounded production request did execute this workflow. Otari request
`d9283ac4-3aec-4ee3-8151-08937bb08554` returned a successful
`read_wiki_structure` result for the fixed repository and Qwen summarized the
returned structure. See [`evidence/mcp-status.json`](../evidence/mcp-status.json)
for redacted metadata and [`docs/OTARI_PROOF.md`](OTARI_PROOF.md) for limitations.
No local GitHub fetch is used or counted.

## Guardrails and per-user budgets

The safe prompt-injection fixture requests top-level `guardrails` with profile
`prompt-injection`, mode `block`, `on_unavailable:block`. Hosted Otari returned
502, request ID `ef371ed6-bad2-4631-9e63-26f4c452509f`. No successful guardrail
evaluation is claimed. A safety model listed in the catalog is not an inference
guardrail service. `OTARI_SAFETY_MODEL` in a pre-existing local file is unused.

Per-user budgets remain unimplemented: no authorized service-key/end-user
budget setup is available. Do not put arbitrary browser user labels in Otari's
`user` field; ordinary keys bill their own user, and real per-user budgets
require a service key and configured end-user budgets.

## Vercel and public inference

Production must set `OTARI_API_KEY`, `OTARI_BASE_URL`,
`OTARI_EVALUATOR_MODEL`, and `OTARI_ANALYST_MODEL`. `OTARI_FALLBACK_POLICY` is
optional and is used only for the routing check. The selected production
catalog returned `demoEnabled: true`, which means the explicit flag and both
Upstash variable values were present when observed; this check does not test
Redis behavior or inspect private Vercel values. Keep inference enabled only
while a small Otari-side hard budget and durable limiter remain configured.
Production refuses execution without both
`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. The Redis limiter applies 120 global attempted
operations per UTC day and 12 per client per minute. This is not a substitute
for the Otari spending boundary.

`OTARI_SAFETY_MODEL` is not consumed by this application and should not be
configured as a claim of hosted guardrails. A discovered safety model is not
proof that Otari invokes it through an inference guardrail service. The hosted
profile endpoint currently reports no guardrail service.
