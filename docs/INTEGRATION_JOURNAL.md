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
