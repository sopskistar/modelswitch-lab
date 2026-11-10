<p align="center">
  <img src="public/modelswitch-icon.png" width="64" height="64" alt="ModelSwitch Lab logo">
</p>

<h1 align="center">ModelSwitch Lab</h1>

<p align="center"><strong>Find the right AI model. Know when to switch.</strong></p>

<p align="center">
  <a href="https://modelswitch-lab.vercel.app">Live application</a> ·
  <a href="https://modelswitch-lab.vercel.app/app?view=model-switch">Try Model Switch</a> ·
  <a href="docs/JUDGE_WALKTHROUGH.md">5-minute judge walkthrough</a> ·
  <a href="docs/OTARI_PROOF.md">Verified Otari evidence</a>
</p>

ModelSwitch Lab is a developer workbench for **testing open-weight AI models on the same task, identifying failures, comparing measurable results, and deliberately switching the model used for the next run**. It uses [Mozilla Otari](https://otari.ai/) for inference, routing and tool execution—and makes the resulting model and provider decisions inspectable.

![ModelSwitch Lab homepage](docs/screenshots/production-landing-desktop.png)

## Why this exists

A leaderboard cannot tell you whether a model will extract *your* invoice fields correctly, classify *your* support requests reliably, respond within *your* latency target or fit *your* cost budget. Switching models without comparable evidence can simply exchange one failure for another.

**ModelSwitch Lab holds the task constant and makes the trade-off visible.** Developers can test, compare, inspect and choose—rather than select a model by reputation alone.

## Try it in five minutes

No account or API key is needed to explore the public workbench and redacted execution receipts.

1. **[Launch the workspace](https://modelswitch-lab.vercel.app/app?view=workspace).** Choose invoice extraction, support classification or bounded reasoning. Each scenario contains synthetic examples with expected answers.
2. **[Open Model Switch](https://modelswitch-lab.vercel.app/app?view=model-switch).** Select Qwen 3.8 27B or Llama 3.3 70B. Selection is immediate and costs nothing; a new model request is sent **only** when you explicitly start a test.
3. **Inspect Results and Request Trace.** See deterministic accuracy and pass rates, failures, latency, reported cost and Otari request/provider details where returned. Recommendations require completed, comparable runs on the same fixture.
4. **[Inspect Otari capabilities](https://modelswitch-lab.vercel.app/app?view=capabilities).** Open the redacted receipts behind hosted routing and fallback, MCP, code execution, budgets, web fetch and distinct model roles.

**For judges:** Follow the [step-by-step walkthrough](docs/JUDGE_WALKTHROUGH.md) for an ordered, read-only evaluation path. A live benchmark is optional and consumes real hosted inference; public execution is subject to spending and request limits. On mobile, use the **Views** menu to navigate and **Back to home** to return to the landing page.

![Model Switch application view](docs/screenshots/production-model-switch-desktop.png)

## The model-switching decision

```text
Known-answer task
      │
      ▼
Run selected model via Otari
      │
      ▼
Validate output + score against expected answer
      │
      ├── Accuracy / schema / missing fields
      ├── Latency / failures / reported cost
      └── Requested vs. effective model and provider
      │
      ▼
Compare completed same-fixture runs
      │
      ▼
Choose primary candidate → Switch active test model
```

**The distinction matters:** Model Switch controls which model **this workbench** tests next. It does not silently rewrite an external application's configuration or Otari's gateway routing policy. Otari's automatic policy fallback is a separate feature, demonstrated independently below. One successful model run is not presented as proof that it outperforms another, and a timeout without gateway metadata remains an unknown outcome.

## What is built

| Capability | In the product |
| --- | --- |
| Task benchmarks | Invoice extraction, support classification and bounded reasoning with fixed synthetic answers |
| Open-weight roles | Qwen evaluator; separate Llama analyst of verified metrics; Llama can also be explicitly tested as an evaluator |
| Manual switching | Browser-scoped active model, explicit same-fixture test, and evidence-based recommendation when enough completed runs exist |
| Measured results | Deterministic scoring, field-level errors, pass rate, latency and reported usage/cost |
| Request inspection | Requested/effective model, provider, gateway IDs and errors when available; JSON/CSV receipts |
| Otari infrastructure | Routing and actual fallback, code execution, DeepWiki MCP, native web fetch and gateway-enforced request budgets |
| Safety controls | Server-only API credentials, fixed task/model allowlists, bounded requests and Upstash-backed rate limiting when configured |

## Real Otari proof

The following are **redacted records of hosted Otari executions**, not mocked UI tests or capabilities inferred from a dashboard toggle.

| Capability | Observed evidence |
| --- | --- |
| **Two open-weight roles** | [Qwen evaluator and separate Llama analyst](evidence/verification.json) |
| **Routing and fallback** | [Isolated live failover](evidence/fallback-live-proof.json): Qwen/DeepInfra primary → Llama/Bedrock backup, HTTP 200, `Otari-Fallback: true`, two attempts, $0.000034 |
| **Code execution** | [Hosted execution](evidence/verification.json): 4/5 correct, exit code 0 |
| **MCP integration** | [DeepWiki `read_wiki_structure`](evidence/mcp-status.json) completed through Otari |
| **Budgets and limits** | [Gateway enforcement](evidence/budget-enforcement-test.json): first request HTTP 200; second HTTP 403 `budget_exceeded` at `api_token` scope |
| **Native web fetch** | [Mozilla Manifesto retrieval](evidence/web-fetch-live.json) completed through Otari's managed fetch tool |
| **Distinct model jobs** | [Evaluator/analyst receipt](evidence/verification.json) documents separate model responsibilities |

The fallback receipt records Otari request **`886b6cbc-a0e8-4a27-8ebf-60bbf3fd0f82`**, effective Llama 3.3 70B on Bedrock and two gateway attempts. Otari did **not** expose the exact primary-provider failure reason. This was an isolated test policy; the production policy was not modified.

**Evidence boundaries:** The native web fetch completed, but the model's summary was truncated. A separate attempted Qwen/Llama same-fixture comparison had an application timeout on Qwen, so that attempt is **not** a completed comparison. Hosted guardrails and per-user budgets are not claimed as verified. See [full proof](docs/OTARI_PROOF.md), [known limitations](docs/LIMITATIONS.md) and [rubric mapping](docs/RUBRIC_EVIDENCE.md).

For the MozFest Developers Wilding Online rubric, the records support **six advanced Otari categories (the 60-point category maximum)** plus documented open-weight roles and a working application. The [evidence assessment](docs/RUBRIC_EVIDENCE.md) is **not an official judging score**.

## Architecture

```text
Browser · Next.js / React
  ├── Workspace · Model Switch · Results · Request Trace
  │
  ▼
Next.js server routes · Zod validation · request bounds
  ├── Deterministic fixture scoring
  ├── Optional Upstash Redis public limiter
  └── Server-held Otari API credentials
           │
           ▼
       Mozilla Otari
        ├── Qwen / Llama inference
        ├── Gateway routing and fallback
        ├── Native code execution, MCP and web fetch
        └── API-key budgets and usage evidence
           │
           ▼
Scored results · redacted traces · JSON/CSV export
```

Built with **Next.js App Router, TypeScript, React, Tailwind CSS and Zod**, deployed on **Vercel**. Recent run state, selected model and theme are saved in the browser. There is no application database, and provider/API secrets are never sent to the browser. For implementation details, see [Architecture](docs/ARCHITECTURE.md) and [Otari integration](docs/OTARI_INTEGRATION.md).

## Run locally

Requires **Node.js 22** and an authorized Otari key.

```bash
git clone https://github.com/sopskistar/modelswitch-lab.git
cd modelswitch-lab
npm ci
cp .env.example .env.local
```

Configure `OTARI_API_KEY`, `OTARI_BASE_URL`, `OTARI_EVALUATOR_MODEL` and `OTARI_ANALYST_MODEL` in `.env.local`, following the [integration guide](docs/OTARI_INTEGRATION.md). Do not commit secrets. Keep `PUBLIC_DEMO_ENABLED=false` unless gateway spending limits and durable public rate limiting are in place.

```bash
npm run dev
```

For quality checks:

```bash
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
npm run test:browser
```

Browser tests can intercept model requests to check interface behavior; they **do not** establish hosted Otari execution. The actual receipts above do. Read the [test methodology](docs/TESTING.md).

## Project documentation

**[Judge walkthrough](docs/JUDGE_WALKTHROUGH.md)** · **[Otari proof](docs/OTARI_PROOF.md)** · **[Architecture](docs/ARCHITECTURE.md)** · **[Testing](docs/TESTING.md)** · **[Limitations](docs/LIMITATIONS.md)** · **[Rubric evidence](docs/RUBRIC_EVIDENCE.md)**

---

Built for **MozFest Developers Wilding Online 2026**, powered by **Mozilla Otari**. Licensed under [MIT](LICENSE).
