# Integration journal

2026-11-04: Read official Otari README, API reference, models, routing, tools,
guardrails, budgets, end users and access control documentation from main.
Hosted US discovery succeeded with the supplied inference key: 163 models,
including both configured roles and `modelswitch-fallback`. Code execution is
advertised available; fetch/search report `workspace_disabled`. Guardrail profile
discovery reports no configured service. Routing and budget management GETs
return 401 for this inference credential; no management writes attempted.

The first genuine inference attempts for evaluator `alibaba/qwen3.8-27b`, analyst
`meta/llama-3.3-70b-instruct`, and policy `modelswitch-fallback` all returned 402
`insufficient_funds`, with a reported balance of $0.00. See `evidence/smoke.json`
for actual request IDs. These are failed requests, not completed model roles or
budget-enforcement proof. Credit availability is an external blocker.

Local setup: sandbox DNS blocked documentation and npm downloads; approved
network commands were required. npm 10's peer resolver crashed in Vitest's
optional peer graph. Retried using legacy peer resolution and will preserve a
lockfile for reproducibility. This is local tooling friction, not an Otari bug.

2026-11-04 15:37 UTC: direct hosted code execution succeeded, exit 0, correct=4/5, accuracy=.8. The guardrail fixture failed closed with 502 because the service is unavailable. No guardrail evaluation was claimed.

2026-11-04 16:00 UTC: unmocked browser inference began succeeding. Qwen3.8 returned the correct billing classification through DeepInfra, then the separate Llama analyst completed. No assumption is made about who changed account funding. The earlier $0 refusals remain in smoke.json as historical evidence.

2026-11-04 16:10 UTC: fresh discovery lists 162 models. Web tools are still workspace_disabled; no guardrail service exists. The typed verifier completed all three evaluator scenarios (one case each), Llama analyst through Bedrock, routing policy, and Python. All three scored cases passed. Policy headers report one attempt, fallback false; actual failover remains unverified. Those five completion calls report $0.001480 combined. Sandbox cost is unreported. Management routes remain unauthorized. Reviewed official MCP and API-key docs: stored MCP setup requires workspace/admin context and per-user budgets require service-key setup. No management mutation was attempted.

2026-11-04: the unmocked production check found the Origin comparison used Next's internal bind address. Fixed against public Host/protocol, added a regression, and repeated successfully. This was an application defect, not an Otari error. Final live browser run 365aae24-b64e-43ec-ba02-3c5e9a7d8739 completed ten evaluator cases plus one analyst call. Qwen 5/5; Llama 4/5. Llama was faster/cheaper and won the balance objective (89 vs about 85). Reported total including analyst: $0.001741. Browser errors: zero. Full evidence retains actual outputs and omits signing receipts.

2026-11-04 23:15Z: refreshed read-only hosted discovery. The account still exposes
162 models and code execution, but web search/fetch is workspace-disabled,
guardrails have no configured service, and inference-key access to policy and
budget management is unauthorized. No setting was changed.

2026-11-04 23:41Z: one-case post-polish live smoke completed through hosted Otari:
Qwen evaluator and separate Llama analyst, both with actual request IDs and
reported cost. The browser had zero errors. Browser review caught a footer
navigation issue caused by using Next Link with the existing view state; that
was corrected. The tablet footer wrap was also corrected after Hallmark review.
Latest captures replay this saved run and do not incur additional inference.

2026-11-05: The official Otari MCP guide confirms inline `mcp_servers` on the
managed completion routes, with explicit iteration limits. Non-streaming Chat
Completions hides managed MCP activity; Messages streaming with
`mcp-client-2025-11-20` reports tool-use and tool-result blocks. Added a fixed,
read-only Qwen repository inspector for DeepWiki, limited to
`mozilla-ai/otari` and `read_wiki_structure`; no arbitrary URLs, repo selection,
or mutations are accepted. Added parsing/evidence-gating tests, but no live
gateway request was made. The direct external endpoint check timed out at the
environment network boundary and is not treated as an Otari failure. The latest
production catalog is observed with `demoEnabled: true`; a reported invoice run
was not independently corroborated because request IDs/receipt were unavailable.

2026-11-05: Pushed source commit `67a4624e83dde54b3f19067a0182d85e1bbf5551`
to both `main` and `hackathon/mozfest-otari-2026`. The selected production
evidence endpoint first returned 404 during deployment, so the deployed SHA
was unknown. A later bounded production request completed through hosted Otari
and returned one `read_wiki_structure` MCP use plus one successful tool result.
Otari request `d9283ac4-3aec-4ee3-8151-08937bb08554`, effective Qwen model,
DeepInfra provider, one attempt, fallback false. The first response's app
verification was false because the result event omits the id/name fields the
verifier expected. The current Otari docs confirm that event shape; corrected
the verifier to require a unique single call/result pair in stream order and
recorded the redacted proof in `evidence/mcp-status.json`. A subsequent
read-only evidence-route request returned 200 but still served the previous
unverified JSON, confirming the source fix is not yet verified in production.
Vercel auth/project metadata remains unavailable; do not claim the exact
deployment SHA.

2026-11-05: One bounded production UI/API routing check verified that the app
actually sent `modelswitch-fallback` to Otari. Request
`5f2cc001-a521-435e-8b51-df0f91452dc5` resolved to Qwen/DeepInfra, with one
attempt, `fallback=false`, 1,382 ms measured latency, and $0.000159 reported
cost. No policy was edited and no failure was induced. The old app-level
`verified` bit meant “fallback occurred” and was false despite successful
policy resolution; updated its meaning to verify reported policy selection and
effective identity, while preserving `fallback=false` as a separate fact.
Added `routing-production.json` and an explicit regression test. This counts
the rubric's routing use, not a demonstrated failover.
