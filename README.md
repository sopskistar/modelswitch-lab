<p align="center"><img src="public/modelswitch-icon.png" width="56" height="56" alt="ModelSwitch Lab mark"></p>

# ModelSwitch Lab

**Find the right AI model. Know when to switch.**

ModelSwitch Lab tests open-weight models against known answers, measures reliability, latency and reported cost, and lets developers switch the model used for their next test through Mozilla's hosted Otari gateway. It supports deliberate selection; it does not change a developer's external app or production routing policy.

**[Live app](https://modelswitch-lab.vercel.app)** · **[Launch workspace](https://modelswitch-lab.vercel.app/app?view=workspace)** · **[Model Switch](https://modelswitch-lab.vercel.app/app?view=model-switch)** · **[Judge walkthrough](docs/JUDGE_WALKTHROUGH.md)** · **[Verified evidence](docs/OTARI_PROOF.md)** · **[GitHub](https://github.com/sopskistar/modelswitch-lab)** · **Demo video:** to be recorded by the participant

![ModelSwitch Lab landing page](docs/screenshots/production-landing-desktop.png)

## Why it is useful

- Run reproducible synthetic tasks and score outputs against expected answers.
- Find incorrect fields, invalid output, failed requests, latency differences and reported costs.
- Switch the active test model, then inspect the actual model and provider returned by Otari.

## Test → Compare → Decide → Switch → Inspect

Choose a fixture in the workspace, run one or more supported models, and review deterministic scores. In **Model Switch**, selecting Qwen or Llama changes the model ID sent by the next explicitly requested test; selection alone sends no inference request. Recommendations use completed comparable results and remain limited to the small tested dataset. Otari policy routing is a separate workflow. A successful policy resolution is verified, but the recorded request reports `fallback=false`; actual gateway failover is unverified.

## What is in the application

- Landing page and workbench with invoice extraction, support classification and bounded reasoning fixtures.
- Qwen 3.8 27B evaluator and separate Llama 3.3 70B analyst; Llama can also be selected for explicit evaluator tests.
- Browser-scoped model selection, deterministic scoring, measured latency, reported usage/cost, traces and JSON/CSV receipts.
- Otari capability evidence for policy routing, hosted code execution, distinct model roles, MCP, key-scoped budget enforcement and native web fetch.

## Otari evidence

These receipts are redacted records of hosted executions. Production currently serves the web-fetch receipt at its public evidence API (HTTP 200, checked 2026-11-06); this does not reveal the deployment's source commit.

| Capability                        | Evidence                                                                | What it proves                                                                                                                                                                                         |
| --------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Open-weight evaluator and analyst | [`verification.json`](evidence/verification.json)                       | Qwen performs benchmark cases; Llama is a separate analysis role.                                                                                                                                      |
| Policy routing                    | [`routing-production.json`](evidence/routing-production.json)           | Otari resolved `modelswitch-fallback` to Qwen/DeepInfra; one attempt, `fallback=false`. Routing is verified; failover is not.                                                                          |
| Code execution                    | [`verification.json`](evidence/verification.json)                       | Otari sandbox returned a successful deterministic 4/5 calculation; cost was not reported.                                                                                                              |
| MCP                               | [`mcp-status.json`](evidence/mcp-status.json)                           | Otari emitted a successful DeepWiki `read_wiki_structure` tool use/result.                                                                                                                             |
| Budget enforcement                | [`budget-enforcement-test.json`](evidence/budget-enforcement-test.json) | Test key: one admitted request, then HTTP 403 `budget_exceeded` at `api_token` scope.                                                                                                                  |
| Native web fetch                  | [`web-fetch-live.json`](evidence/web-fetch-live.json)                   | Otari completed a Mozilla Manifesto fetch; Qwen/DeepInfra, request `8058116e-e1b4-4f24-90d7-3b766a4f41e1`, reported cost `$0.010888`. The generated summary was incomplete; only retrieval is claimed. |

The evidence supports **up to 95/100 potential points before the personal demo**, not an official score: 30 open-weight, 60 for six advanced capabilities, and 5 for the working application. Routing points are conditional on judges accepting policy resolution without an observed fallback. A personally recorded demo may be eligible for the remaining 5 points. Guardrails, per-user budgets and actual fallback are unverified. See the full [rubric matrix](docs/RUBRIC_EVIDENCE.md).

## Architecture

Next.js App Router, React, TypeScript, Tailwind and Zod run on Vercel. Browser requests submit fixed case IDs to server route handlers; the server-only Otari adapter authenticates to the hosted US or EU gateway. The application scores outputs deterministically. Upstash Redis provides public request limits when configured; recent runs, theme and active selection are browser-scoped. There is no application database. Provider keys and Otari management credentials are never sent to the client.

## Run locally

Use Node 22 and the committed lockfile:

```sh
npm ci
cp .env.example .env.local
```

Set `OTARI_API_KEY`, `OTARI_BASE_URL`, `OTARI_EVALUATOR_MODEL`, and `OTARI_ANALYST_MODEL` in `.env.local`. Use only credentials you are authorized to use. Leave `PUBLIC_DEMO_ENABLED=false` unless a real Otari spending ceiling and durable Upstash rate limiting are configured. Never commit `.env.local`.

```sh
npm run dev
```

Run quality checks with `npm run typecheck`, `npm run lint`, `npm test`, `npm run format:check`, `npm run build`, and `npm run test:browser`. Browser tests intercept inference responses for UI testing; they are not hosted Otari evidence. See [testing details](docs/TESTING.md), [integration setup](docs/OTARI_INTEGRATION.md), [architecture](docs/ARCHITECTURE.md), and [limitations](docs/LIMITATIONS.md).

## Production status

The official site is [modelswitch-lab.vercel.app](https://modelswitch-lab.vercel.app). On 2026-11-06, the Capabilities page passed its production browser check, showed `60 / 60` advanced points and linked the verified web-fetch receipt; the public receipt endpoint returned HTTP 200 with matching request/tool IDs. This confirms the evidence UI and route are deployed, but Vercel's exact deployment SHA remains unverified from this environment. Check the selected `modelswitch-lab` Vercel project's deployment details before claiming a source revision. Do not use the similarly named duplicate project.

## License and acknowledgment

MIT; see [LICENSE](LICENSE). Built for MozFest Developers Wilding Online 2026 and powered by [Mozilla Otari](https://github.com/mozilla-ai/otari).
