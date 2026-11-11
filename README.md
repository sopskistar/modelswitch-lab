<p align="center">
  <img src="public/modelswitch-icon.png" width="72" height="72" alt="ModelSwitch Lab logo" />
</p>

<h1 align="center">ModelSwitch Lab</h1>

<p align="center"><strong>Find the right AI model. Know when to switch.</strong></p>

<p align="center">
  Benchmark open-weight models on known answers, understand the trade-offs, and switch the model used for your next test—with inspectable evidence from Mozilla Otari.
</p>

<p align="center">
  <a href="https://modelswitch-lab.vercel.app">Live app</a> ·
  <a href="https://modelswitch-lab.vercel.app/app?view=model-switch">Try Model Switch</a> ·
  <a href="docs/JUDGE_WALKTHROUGH.md">Judge walkthrough</a> ·
  <a href="docs/OTARI_PROOF.md">Execution evidence</a>
</p>

<p align="center">
  <img src="docs/screenshots/production-landing-desktop.png" width="850" alt="ModelSwitch Lab landing page with the developer workbench preview" />
</p>

## Why ModelSwitch Lab?

A generic leaderboard cannot tell you which model will extract **your** invoice fields correctly, classify **your** support tickets reliably, or meet **your** latency and cost constraints. Switching based on reputation alone can replace one failure with another.

**ModelSwitch Lab tests the same task against known answers.** It helps developers spot incorrect or malformed outputs, compare completed runs, inspect gateway metadata and deliberately choose a model for their next evaluation.

It is an **evaluation and switching workbench**, not a tool that silently changes a developer's production application or gateway routing configuration.

## Try it

**[Open Model Switch →](https://modelswitch-lab.vercel.app/app?view=model-switch)**

1. **Test.** In the [workspace](https://modelswitch-lab.vercel.app/app?view=workspace), choose a synthetic invoice-extraction, support-classification or bounded-reasoning case with an expected answer.
2. **Compare.** Evaluate Qwen 3.8 27B or Llama 3.3 70B against the same fixture. Inspect deterministic scores, failures, latency, reported cost and request traces. A model recommendation is meaningful only when comparable runs have completed.
3. **Switch.** In **Model Switch**, choose which evaluator model the *next* explicit test will use. Changing the selection alone makes no paid request.
4. **Inspect.** In [Otari Capabilities](https://modelswitch-lab.vercel.app/app?view=capabilities), open the redacted receipts behind real hosted execution, including automatic gateway fallback.

No account or API key is required to explore the public UI and published evidence. Live inference, where enabled, is subject to request and spending limits. On mobile, use the **Views** menu; every workspace view includes **Back to home**.

**Judging this project?** Start with the [five-minute judge walkthrough](docs/JUDGE_WALKTHROUGH.md), which includes a read-only path and an optional bounded live test.

<p align="center">
  <img src="docs/screenshots/production-model-switch-desktop.png" width="850" alt="Model Switch view showing deliberate selection and comparison of evaluator models" />
</p>

## What it does

| Workflow | Implementation |
| --- | --- |
| **Evaluate** | Three fixed synthetic scenarios; known-answer, deterministic scoring; field-level errors and pass rates |
| **Compare** | Same-fixture model tests with measured latency, request failures and Otari-reported usage/cost |
| **Switch** | Browser-scoped active evaluator selection; the next explicitly submitted test uses the selected model |
| **Explain** | A separate Llama analyst interprets recorded metrics; recommendations distinguish complete comparisons from incomplete runs |
| **Inspect** | Requested and effective model/provider, Otari request IDs and errors when available; JSON/CSV export |
| **Operate** | Otari routing and fallback, hosted tools, gateway budgets; server-held credentials and optional Upstash rate limiting |

**Manual switching and automatic fallback are different.** The former selects what ModelSwitch Lab tests next. The latter is a real Otari routing policy that can try a backup when a primary provider fails. ModelSwitch Lab demonstrates both, but does not claim to reconfigure a third-party app.

## Verified Otari execution

These are redacted receipts from **real hosted Otari requests**, not browser fixtures, mocked tool responses or settings merely marked “available.”

| Capability | Evidence |
| --- | --- |
| Open-weight model roles | [Qwen evaluator and separate Llama analyst](evidence/verification.json) |
| **Routing + actual fallback** | [Live failover receipt](evidence/fallback-live-proof.json): Qwen/DeepInfra primary → Llama/Bedrock backup; HTTP 200, `Otari-Fallback: true`, two attempts |
| Code execution | [Successful hosted execution](evidence/verification.json) |
| MCP | [Successful DeepWiki `read_wiki_structure` tool result](evidence/mcp-status.json) |
| Web fetch | [Completed Mozilla Manifesto retrieval through Otari](evidence/web-fetch-live.json) |
| Budget enforcement | [One admitted request followed by HTTP 403 `budget_exceeded`](evidence/budget-enforcement-test.json) |

The fallback request ID is `886b6cbc-a0e8-4a27-8ebf-60bbf3fd0f82`; Otari reported the effective Llama 3.3 70B model on Amazon Bedrock, two attempts and $0.000034 cost. The exact failure reason of the primary attempt was **not** exposed. This proof used an isolated test workspace; the production routing policy was not changed.

**Evidence limits:** The native web-fetch tool completed, but the model-generated summary was truncated. An earlier Qwen request timed out at the application boundary and cannot support a completed Qwen-versus-Llama comparison. Hosted guardrails and per-user budgets are not claimed as verified.

The hackathon [rubric mapping](docs/RUBRIC_EVIDENCE.md) documents six evidenced advanced categories and their limitations. These are evidence-supported claims, **not an official judging score**. See the [full Otari proof](docs/OTARI_PROOF.md) and [known limitations](docs/LIMITATIONS.md).

## Architecture

```text
Browser · Next.js / React
  ├─ Workspace / Model Switch / Results / Request Trace
  │
  ▼
Next.js server routes · Zod validation · request bounds
  ├─ Known-answer deterministic scoring
  ├─ Optional Upstash Redis public rate limiter
  └─ Server-held Otari API credentials
       │
       ▼
  Mozilla Otari gateway
    ├─ Qwen and Llama inference
    ├─ Routing and live provider fallback
    ├─ Hosted code execution / MCP / web fetch
    └─ API-key budgets and usage records
       │
       ▼
Scored results · evidence traces · JSON/CSV exports
```

Built with **Next.js App Router, React, TypeScript, Tailwind CSS and Zod**, deployed on **Vercel**. Active model, recent runs and theme are browser-scoped. The app has no database. API and provider secrets remain server-side. See [architecture](docs/ARCHITECTURE.md) and [Otari integration](docs/OTARI_INTEGRATION.md).

## Run locally

Requires **Node.js 22** and an authorized Otari API key.

```bash
git clone https://github.com/sopskistar/modelswitch-lab.git
cd modelswitch-lab
npm ci
cp .env.example .env.local
```

In `.env.local`, configure `OTARI_API_KEY`, `OTARI_BASE_URL`, `OTARI_EVALUATOR_MODEL` and `OTARI_ANALYST_MODEL`, following the [integration guide](docs/OTARI_INTEGRATION.md). Never commit secrets. Keep `PUBLIC_DEMO_ENABLED=false` unless gateway spending ceilings and durable public rate limiting are configured.

```bash
npm run dev
```

Quality checks:

```bash
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
npm run test:browser
```

Browser tests can intercept inference for UI validation; **only recorded hosted requests establish Otari execution evidence**. See [testing](docs/TESTING.md).

## Documentation

[Judge walkthrough](docs/JUDGE_WALKTHROUGH.md) · [Otari evidence](docs/OTARI_PROOF.md) · [Architecture](docs/ARCHITECTURE.md) · [Integration guide](docs/OTARI_INTEGRATION.md) · [Testing](docs/TESTING.md) · [Limitations](docs/LIMITATIONS.md) · [Rubric mapping](docs/RUBRIC_EVIDENCE.md)

## License

Built for **MozFest Developers Wilding Online 2026** using **Mozilla Otari**. Licensed under [MIT](LICENSE).
