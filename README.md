# ModelSwitch Lab

A reproducible model reliability workbench powered by **hosted Otari.ai**.
Run synthetic tasks against known answers, inspect every case, compare measured
quality, latency and reported cost, and ask a separate model to diagnose the
verified results. No chat, fabricated analytics, or fixture responses in live runs.

**Current live status:** hosted Qwen3.8 and Llama 3.3 inference works in distinct
roles. A real five-case comparison and separate analyst call completed, with
$0.001741 total reported cost. Hosted Python execution also succeeded. Routing
resolved a policy but no fallback occurred. Web tools remain workspace-disabled;
no inference guardrail service is configured. Evidence supports 55/100 possible
rubric points, with no official score claimed. See the [evidence matrix](docs/RUBRIC_EVIDENCE.md).

## Run locally

Requires Node 22+ and npm. On the current branch:

```sh
npm ci
cp .env.example .env.local
# Set the private server key and actual accessible model IDs.
npm run dev
```

Open the URL printed by Next.js (normally `http://localhost:3000`). Without
credentials, the app renders a setup-required workspace and lets visitors inspect
all synthetic cases. A configured but unfunded account shows the actual refusal.
Never overwrite an existing `.env.local` containing working credentials.

| Variable | Purpose |
| --- | --- |
| `OTARI_API_KEY` | Server-only hosted inference key; fund account and attach a hard budget |
| `OTARI_BASE_URL` | US `https://api.otari.ai/api/v1` or EU `https://eu.api.otari.ai/api/v1` |
| `OTARI_EVALUATOR_MODEL` | Accessible evaluator ID; tested discovery: `alibaba/qwen3.8-27b` |
| `OTARI_ANALYST_MODEL` | Distinct analyst ID; tested discovery: `meta/llama-3.3-70b-instruct` |
| `OTARI_FALLBACK_POLICY` | Optional existing Otari policy; discovered `modelswitch-fallback` |
| `PUBLIC_DEMO_ENABLED` | Explicitly enable inference; required `true` in production |
| `UPSTASH_REDIS_REST_URL` | Durable production rate-limit service URL |
| `UPSTASH_REDIS_REST_TOKEN` | Server-only rate-limit credential |

The example disables public inference. Set `PUBLIC_DEMO_ENABLED=true` locally
when ready to spend gateway credit. With an existing key file and no flag, local
development enables bounded execution. Vercel requires both explicit enablement
and the durable limiter. No management credential is required or exposed.

## Use the workbench

Choose invoice extraction, support classification, or bounded reasoning. Each
scenario has five varied, versioned synthetic cases. Select one or two discovered
models, a test count, and an objective. Results arrive case by case. Open a case
for the actual output and deterministic field comparison; open Request trace for
gateway identity, request IDs, usage and local scoring events. Export JSON or CSV.

Accuracy is normalized exact field matching. Pass rate also requires the strict
schema. Recommendation weights are visible and deterministic; the analyst only
explains them. Unknown cost stays unknown and is omitted from every model's
comparison score. These tiny samples describe tested cases, not a universal rank.

One recent run and theme persist in this browser. No shared history/database is
used. Reloading an active run keeps completed cases and marks it interrupted.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm start
# In a second terminal, against the printed production URL:
npm run test:browser
# Operator-only real hosted checks, after attaching a small gateway budget:
npm run otari:inspect
npm run otari:verify
```

`npx playwright install chromium` installs the test browser. Set
`PLAYWRIGHT_BASE_URL` if the app uses another port. Automated browser successes
use intercepted HTTP fixtures in the test process; they are never public results
or rubric evidence. The separate unmocked capture script records actual runtime
behavior, real outputs, and the separate analyst role. Initial credit refusals
are retained as historical evidence.

## Deploy to Vercel

Import this repository/branch in Vercel, choose Next.js and Node 22, use `npm ci`
and `npm run build`, and set the variables above in Vercel's server environment.
`vercel.json` sets the execution routes to a 30-second function duration. Gateway
calls time out after 22 seconds; benchmark orchestration spans small independent
requests. Run the deployed URL through the judge walkthrough before recording.

**No production deployment was made in this session:** the Vercel CLI,
authentication token/session, and linked Vercel project are absent. The project
is production-build ready. It does not claim a production URL exists. Full
runtime and dependency details are in [architecture](docs/ARCHITECTURE.md) and
[testing](docs/TESTING.md).

## Submission material

- [Judge walkthrough](docs/JUDGE_WALKTHROUGH.md) and [personal demo script](docs/DEMO_SCRIPT.md)
- [Integration, license evidence, and controlled setup](docs/OTARI_INTEGRATION.md)
- [Rubric evidence](docs/RUBRIC_EVIDENCE.md) and [limitations](docs/LIMITATIONS.md)
- [Observed Otari feedback](docs/OTARI_FEEDBACK.md) and [implementation journal](docs/INTEGRATION_JOURNAL.md)
- [Hallmark design review](docs/DESIGN_REVIEW.md)

First genuine integration:
[`2be9a17c37e7154a852ed9f01fb8e09c8971844c`](https://github.com/sopskistar/modelswitch-lab/commit/2be9a17c37e7154a852ed9f01fb8e09c8971844c)
on `hackathon/mozfest-otari-2026`. This commit records a real connection and
inference refusal, not a successful inference. The first successful live-role
implementation is [`afdf63a`](https://github.com/sopskistar/modelswitch-lab/commit/afdf63aa636c9df00aeb7455fe575f35bf3d7d8d).
The participant must personally record and narrate the actual demo.
