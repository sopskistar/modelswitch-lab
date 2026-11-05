# Testing and reproduction

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

## Results observed

- TypeScript, ESLint, production build: passed on the implemented application.
- Vitest: **107 tests in 5 files**, all passed on the final tested source.
- Playwright: **16 tests**, 8 in desktop Chromium and 8 in mobile Chromium
  (iPhone 13 emulation), **all passed against the final production build**.
- Axe: automated checks in the theme/responsive tests; no violations on checked
  workspace screens. Both light and dark are included in the final test revision.
- Hallmark: final static and rendered audit passed with 0 FAIL, 0 REFLEX,
  0 WARN; five viewport renders completed. See `HALLMARK_LINT.txt`, captures,
  and `DESIGN_REVIEW.md`.
- Production browser bundle scanned for the configured Otari key: no match.
- `npm audit --omit=dev`: **0 vulnerabilities** after updating Zod.
- Full dependency audit: **13 moderate**, all development lint-chain findings
  involving minimatch/ESLint/TypeScript ESLint. No high/critical remain. npm's
  suggested downgrade/major resolver changes were not applied blindly. These
  tools process trusted repository files, not public application input.

The final report and journal record any later run counts or failures. Never
interpret the earlier blocked browser/build attempts as passing runs.

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

The selected production evidence route now returns HTTP 200, but its response
was the previous `implemented_unverified` MCP record. Thus the route from
`67a4624e83dde54b3f19067a0182d85e1bbf5551` is deployed, while the corrected
parser/evidence and routing-status commit is not yet confirmed deployed. Exact
Vercel source SHA remains unavailable.

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

The first final local browser attempt could not connect because the sandbox
denied the Next server's `0.0.0.0:3011` bind (`EPERM`). Starting the same built
server with host permission resolved the environment issue; the complete
desktop/mobile suite then passed 16/16. The initial production URL request was
also blocked by sandbox DNS; the same read-only request outside the sandbox
returned HTTP 200. Neither was an application test failure.

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
