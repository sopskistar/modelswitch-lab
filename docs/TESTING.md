# Testing and reproduction

## Focused landing and Model Switch checks — 2026-11-05

The final run for the landing and switch changes is recorded below. Added
checks cover landing navigation and compatibility
redirects, desktop/mobile overflow and axe scans, model selection without a
request, Qwen→Llama→Qwen request payload changes, and applying a same-fixture
recommendation without triggering inference. Unit and route tests validate the
allowlist, result/failure classification, and model ID passed to the hosted
Otari adapter. Playwright's intercepted requests are UI contract fixtures only;
they do not count as live gateway evidence.

One bounded production smoke tested a fixed invoice fixture on both configured
models, sequentially and without retry. Llama completed through Bedrock with
Otari request `77cf5458-46f6-40c9-98ab-80468ba890ec`, six correct fields, 929 ms
and `$0.000170`. Qwen timed out at the application boundary with no Otari
request ID and unknown billing state. See the redacted
[`model-switch-production.json`](../evidence/model-switch-production.json).
No additional paid request is needed to establish the documented limitation.

Web retrieval had two production HTTP 400 responses with no tool event; the
cause remains unknown. See
[`web-fetch-diagnosis.json`](../evidence/web-fetch-diagnosis.json). No repeat
request was made after the latest failure.

Use Node 22 and `npm ci` (lockfile + `.npmrc` preserve legacy peer resolution).
The first npm 10 install crashed resolving optional Vitest peers; no application
feature depends on that workaround. Production uses standard Next.js webpack
builds because this environment blocked Turbopack's CSS worker port.

```sh
npm run typecheck
npm run lint
npm test
npm run format:check
npm run build
npm start
# Another terminal; use the actual printed local production port:
PLAYWRIGHT_BASE_URL=http://localhost:3000 npm run test:browser
```

Install Chromium once with `npx playwright install chromium`. Browser subprocesses
and local server binds required approved execution outside this task's sandbox.
Those environment failures were not counted as successful checks. Use localhost
for development; `127.0.0.1` is also explicitly allowed in Next's dev origins.

## Final results — 2026-11-05

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: **113 tests in 6 files**, all passed.
- `npm run format:check`: passed.
- `npm run build`: passed with Next.js production webpack build.
- Playwright: **20/20 tests passed**, 10 desktop Chromium and 10 mobile Chromium.
- Axe: no violations on the tested landing and app views in both projects;
  responsive checks found no horizontal overflow. Light/dark theme persistence
  and keyboard navigation are covered.
- Hallmark rendered audit: **0 FAIL, 0 REFLEX, 0 WARN** after correcting a
  4px mobile header overflow; five viewport renders completed. See
  [`HALLMARK_LINT.md`](HALLMARK_LINT.md) and `.hallmark/shots/`.
- Production browser bundle scanned for the configured Otari key: no match.
- `npm audit --omit=dev`: **0 vulnerabilities** after updating Zod.
- Full dependency audit: **13 moderate**, all development lint-chain findings
  involving minimatch/ESLint/TypeScript ESLint. No high/critical remain. npm's
  suggested downgrade/major resolver changes were not applied blindly. These
  tools process trusted repository files, not public application input.

An earlier typecheck found and fixed an unchecked missing-evidence case in
capability details; the final typecheck and build passed. An initial Hallmark
render found the mobile overflow described above; the confirming render passed.
Do not treat intercepted browser responses as live Otari requests.

## Meaningful coverage

Unit coverage includes normalization, fenced JSON parsing, strict schemas,
field-level comparisons, missing/null/zero values, objective weights, zero-safe
recommendation math, missing cost axes, partial failure denominators, URL
allowlisting, request bounds, receipt signatures and binding, body byte limits,
formula-safe CSV, and reproducible JSON exports.

Mock HTTP adapter tests cover hosted URL/authentication, model/tool metadata,
effective model/routing headers, gateway tool results, reported zero versus
missing cost, guardrail verdicts, budget rejection, timeouts without retries,
empty/invalid responses, and safe error messages. Route tests exercise allowed
models, fixed cases, cross-origin rejection and public-host acceptance,
disabled tools, real result signing, partial failures, separate analyst role,
and strict sandbox verification.

Browser checks cover initial workspace, scenario/URL state, loading, completed
run contracts, results, trace, exports, reload persistence, setup-required state,
credit refusal with skipped cases, capabilities/evidence controls, network
interruption, keyboard focus, both themes, accessibility and responsive overflow.

Browser tests intercept model HTTP responses **inside the test runner only**.
Successful fixtures are labeled `TEST FIXTURE` and are never used by the live
application or counted as live evidence. No paid live requests are made by the
ordinary test suite. Test artifacts go under ignored `test-results` and
`playwright-report`; public screenshots come from the separate unmocked capture.

The MCP adapter and route tests use intercepted Messages events to test parsing,
fixed-source behavior, and evidence gating. Those mocks do not count as hosted
MCP execution. A real check requires an Otari request ID and matching streamed
tool-use/result blocks.

The latest routing regression test confirms that one production policy
resolution with an Otari request ID and effective model/provider is verified
as routing, while `fallback=false` remains visible and is not labeled failover.
The capability evidence count is now 40/60: routing, code execution, distinct
model roles, and MCP.

## Live hosted checks

### Production acceptance (2026-11-05)

The deployed site returned HTTP 200. Desktop (1440px) and mobile (iPhone 13,
390px) were inspected with Playwright. Both loaded the workspace, three
synthetic scenario choices, Otari model metadata, theme toggle/persistence,
footer links, and empty Results/Trace views. There were zero page errors, zero
axe violations, and no horizontal overflow. Screenshots are
`screenshots/production-desktop-workspace.png` and
`screenshots/production-mobile-workspace.png`.

That archived record describes the earlier non-hyphenated site and reports
`configured: true` and `demoEnabled: false`.
One empty JSON POST returned the safe `503 demo_disabled` response, which the
route returns before parsing, rate limiting, or starting an Otari request. No
live model inference was attempted. Consequently, production result export and
durable rate-limit enforcement could not be tested; the UI has no production
run to export. The Vercel deployment SHA and private env-variable presence are
not accessible from this workspace. See
[`production-acceptance.json`](../evidence/production-acceptance.json).

The selected official domain is the hyphenated
`https://modelswitch-lab.vercel.app`. Its latest catalog observation returned
`demoEnabled: true`; this reflects configuration presence, not successful
Redis limiter behavior. The participant-reported invoice benchmark still lacks
independent traces/receipt. One production policy-routing check and one
production MCP request were made. Otari resolved `modelswitch-fallback` to Qwen
through DeepInfra (`fallback=false`, $0.000159) and returned a successful
DeepWiki tool result respectively. Details and request IDs are in
[`routing-production.json`](../evidence/routing-production.json),
[`mcp-status.json`](../evidence/mcp-status.json), and
[`production-observation.json`](../evidence/production-observation.json). No
additional inference calls were sent to recreate evidence.

Historical rollout checks returned an old `implemented_unverified` MCP record
and then HTTP 404 for the routing receipt. Those results were superseded on
2026-11-05 at 12:29–12:35 UTC: both evidence routes returned HTTP 200, and the
MCP route served `verified_live`, request
`d9283ac4-3aec-4ee3-8151-08937bb08554`. The production evidence records do not
expose the exact Vercel source SHA.

After the final documentation push, read-only production GETs at 13:02 UTC
again returned HTTP 200 for routing evidence, MCP evidence, and the catalog. The catalog reported
web fetch and search available. One bounded allowlisted fetch through
`/api/execute` returned HTTP 400 and Otari request
`9bd36cf5-6ddf-433a-9d1a-95295a50fae5`; the app exposed only generic
`gateway_error`, with no tool result or cost. It was not retried and does not
count as verified web retrieval.

A fresh read-only catalog request on 2026-11-05 returned HTTP 200 and Vercel request ID
`fra1::iad1::2jdth-1793875276299-dde473d35888`; the homepage also returned HTTP
200 and its expected title/workspace HTML. A production Chromium audit attempt
failed with `ERR_NETWORK_CHANGED`, so desktop/mobile browser accessibility and
screenshots are limited to the locally built app. No inference request was sent.

Fresh local screenshots of the updated capabilities view are
[`desktop`](screenshots/capabilities-review-desktop.png) and
[`mobile`](screenshots/capabilities-review-mobile.png). They were captured from
the local production build with catalog metadata intercepted for layout only;
they do not show a live Otari MCP execution.

The production browser check is acceptance inspection, not the intercepted
Playwright test suite. No fixtures were presented as live production output.

On 2026-11-05, `npm run typecheck`, `npm run lint`, `npm test` (107 tests),
`npm run format:check`, `npm run build`, and `npm run test:browser` (16 tests)
passed. The browser suite was pointed at the existing ModelSwitch Lab dev
server on port 3002; the default port 3000 belonged to a different project.
The browser suite covered desktop/mobile interaction, fixture-intercepted
benchmark runs, export, theme, navigation, and axe checks. Those intercepted
responses are test-only and are not production inference evidence.

`npm run otari:inspect` performs model/tool/profile discovery and read-only
management-authority checks. `npm run otari:verify` makes at most seven bounded
execution calls and writes `evidence/verification.json`; attach a hard gateway
budget before running. No management token or arbitrary prompt is accepted.
`npm run otari:verify -- --capabilities-only` limits execution to the fixed
sandbox control and fail-closed guardrail fixture after discovery.

Recorded live results: model discovery succeeded; initial credit refusals were
followed by successful evaluator, analyst, and policy inference. The typed
verifier passed one real case per scenario. The actual browser completed five
cases per model plus a separate analyst: Qwen 100%, Llama 80%, no request
failures, total reported cost $0.001741. Python returned correct 4, total 5,
accuracy .8 and exit 0; guardrail service unavailable, fail-closed 502.
`scripts/capture-production.mjs` uses the actual production UI and a bounded real run (default three cases, one model; optional
`CAPTURE_COMPARE=true CAPTURE_CASES=5` uses ten evaluator calls plus analyst),
captures desktop/mobile themes, and writes `evidence/browser-smoke.json` with
receipts omitted. Run only after reviewing its small spending scope. Its browser
console error count is recorded; HTTP refusals remain explicit outcomes.

Post-polish live smoke at `2026-11-04T23:41:17Z` completed one real evaluator
case and one separate analyst request; see `evidence/polish-live-smoke.json`.
Successful two-model execution is recorded. Web tools, actual fallback,
gateway budget boundaries and per-user budgets require additional hosted-account
setup; they are not implied by mocked tests. One successful MCP execution is
recorded separately in `evidence/mcp-status.json`.
