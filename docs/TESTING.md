# Testing and reproduction

## Final mobile navigation pass — 2026-11-08

- Typecheck, lint, repository format check and production webpack build: passed.
- Unit tests: **119 passed in six files**.
- Final Playwright run against the production build: **41 passed, one skipped**
  (the mobile-only disclosure test is intentionally skipped on desktop).
- After stacking related mobile evidence links, **eight focused desktop/mobile
  rechecks passed**, covering 320px/430px populated/empty layouts, every view's
  light/dark axe scan, and all eight evidence links. The final build and
  Capabilities rendered audit also passed.
- Axe: no violations across the landing page, all workspace views in both
  themes, and the open mobile navigation.
- The hosted loading-state scan found an invalid label on the empty model
  container. Giving it `role="group"` fixes the semantics without changing the
  controls. Six final desktop/mobile checks passed, including delayed/empty
  discovery axe scans, both themes across every view, and the model-switch
  request contract; typecheck, lint and format checks passed again.

The mobile regression suite covers 320, 360, 375, 390, 412 and 430px widths on
desktop Chromium and mobile Chromium contexts. Each width covers the landing
page and all six workspace views, both empty and restored populated states,
expanded JSON and long request IDs. Root clipping is temporarily disabled during
overflow measurements so a broken component cannot be concealed. Export and
Model Switch buttons must remain within the viewport.

Navigation checks cover the fully visible landing CTA, launch into scenario
selection, Home from every view, every mobile destination, active location,
48px mobile navigation targets, keyboard focus, Escape, outside taps, focus
departure, breakpoint changes, preserved desktop tabs, legacy redirects, direct
links, reload, Back/Forward, saved results and active-model persistence. Axe scans
cover every view in light/dark modes and the open mobile navigation. Every
Capabilities **Inspect JSON** link is read without executing a model request;
the fallback receipt retains request `886b6cbc-a0e8-4a27-8ebf-60bbf3fd0f82`,
`fallback=true` and two attempts.

The first development run needed extra time for initial compilation. An initial
history assertion targeted the **Active** badge rather than its containing model
row; the corrected assertion passed in desktop and mobile. No application logic
was changed for those test issues. The populated layout check did find and fix
unwrapped request IDs in Request Trace.

The sandboxed production build again failed to parse the TypeScript configuration:
a `spawnSync` diagnostic returned `EPERM` and zero stdout for `tsc --showConfig`,
while direct `tsc --showConfig` succeeded. The unchanged Next.js webpack build
passed with approved process execution. Local server binds and Chromium likewise
require approved execution in this environment.

```sh
npm run typecheck
npm run lint
npm run format:check
npm test
npm run build
npm start -- --port 3111
# In another terminal:
PLAYWRIGHT_BASE_URL=http://localhost:3111 npm run test:browser
# Read-only deployed UI, screenshots, axe and existing evidence checks:
node --import tsx scripts/mobile-ui-check.ts
```

Playwright benchmark responses are intercepted test fixtures, not new hosted
inference evidence. The separate `mobile-ui-check.ts` checks rendered production
pages and existing receipts without replacing responses; it blocks execution
defensively and asserts zero attempted execution requests. Hosted navigation
assertions allow 15 seconds. A diagnostic confirmed transient Chromium
`ERR_NETWORK_CHANGED` failures on JavaScript and fonts; the verifier retries a
viewport at most twice only for that observed transport error, records retries,
and does not retry UI failures. An `axeViolations: null` entry means that axe was
not run at that width; hosted axe scans run at 390px and 1440px.

No new paid inference is needed for this UX pass. The Hallmark rendered audit passed across all seven
routes with 35 renders and **0 FAIL, 0 REFLEX, 0 WARN**; see
[`HALLMARK_LINT.md`](HALLMARK_LINT.md).

The final read-only production check on application commit `cf07a08` passed
**70 route/viewport checks** at 320, 360, 375, 390, 412, 430, 768, 960, 1024 and
1440px, including Home/Back from every workspace view. All **14 hosted axe
scans** at 390/1440px were clean; all **eight evidence receipts returned HTTP
200**. The fallback receipt retained its request ID, `true`, two attempts,
Bedrock provider and `$0.000034` cost. There were **zero execution attempts**.
Transport-only retries are recorded separately in
[`mobile-ux-production.json`](../evidence/mobile-ux-production.json).

Sixteen actual production screenshots are saved under
`docs/screenshots/mobile-ux-*.png`, including the
[320px landing](screenshots/mobile-ux-320-landing.png),
[mobile navigation](screenshots/mobile-ux-mobile-navigation.png),
[mobile Model Switch](screenshots/mobile-ux-mobile-model-switch.png),
[mobile capabilities](screenshots/mobile-ux-mobile-capabilities.png) and
[desktop workspace](screenshots/mobile-ux-desktop-workspace.png). These use fresh
browser state; Results/Trace show their real empty states, not intercepted runs.

## Documentation release validation — 2026-11-06

- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: 119 tests in 6 files passed.
- `npm run format:check`: passed; Prettier also checked the updated README,
  judge documents, and production evidence JSON.
- `npm run build`: passed with Next.js 16.4.5 and webpack. A first sandboxed
  attempt could not spawn TypeScript `--showConfig`; the unchanged build passed
  with process access. No build workaround or source code change was made.
- `PLAYWRIGHT_BASE_URL=http://localhost:3100 npm run test:browser`: 20/20
  desktop and mobile tests passed against the local production build. The
  suite includes axe checks, keyboard interaction, no horizontal overflow,
  model-switch request contracts, results, traces, exports, and capability
  evidence states. Inference responses are intercepted test fixtures.
- Read-only production GETs returned HTTP 200 for routing, MCP, budget,
  verification, and web-fetch receipts; the web-fetch response matched the
  committed request/tool IDs. The Capabilities route returned HTTP 200. These
  checks do not identify the deployed Git SHA or make new inference requests.
- A focused production Playwright check passed for the Capabilities view. It
  displayed `60 / 60` advanced points and a **Verified live** web-retrieval row
  linking the committed receipt. The test intercepted the repository-inspection
  action and made no Otari inference request.

The initial browser command used the default localhost URL and did not reach
this checkout's production build. The suite was rerun against the explicitly
started local build on port 3100; only that 20/20 run is the accepted result.
Production source-revision matching remains unverified.

## Otari request-count budget acceptance — 2026-11-06

The dedicated `OTARI_BUDGET_TEST_KEY` was confirmed present without printing
its value. One tiny non-streaming Qwen request succeeded at the gateway and its
usage record settled at `$0.000095`; a second request returned HTTP 403 with
`Otari-Error-Code: budget_exceeded` and
`Otari-Budget-Scope: api_token`. No retry or third inference was made. The
first model answer was empty, so this is enforcement evidence, not a quality
result. See [`budget-enforcement-test.json`](../evidence/budget-enforcement-test.json).

The default sandboxed `npm run build` attempt failed because Next.js could not
spawn TypeScript's `--showConfig` process (`EPERM` in the sandbox); direct
`tsc --showConfig` returned valid JSON. Running the unchanged production build
with approved process execution succeeded. No TypeScript/Next build workaround
or source change was needed.

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

Historical production requests on Nov 5 returned HTTP 400; their cause was
unknown at that time. A later hosted schema probe reproduced the rejection
and a corrected real fetch succeeded; see the latest verification below and
[`web-fetch-diagnosis.json`](../evidence/web-fetch-diagnosis.json). The
unchanged failed request was not repeated.

An initial post-push read-only HTTP check found the old workspace and `/app`
returned 404; this was superseded by a later deployment. At 2026-11-05 17:26
UTC, the new landing and Model Switch screens loaded from the official
production domain. A separate read-only Playwright check confirmed catalog
discovery, manual switching to Llama without a POST to `/api/execute`, empty
desktop/mobile axe results, no page errors, and no horizontal overflow at
390px. Production model-smoke and web-diagnostic evidence endpoints returned
HTTP 200. Zero paid inference requests were sent. Details and screenshots are
in [`production-ui-check.json`](../evidence/production-ui-check.json) and
`docs/screenshots/production-*.png`. Vercel source SHA remains unknown because
the CLI, project link, and token are unavailable; the rendered UI does not
prove the exact deployed Git revision.

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

## Final live validation — 2026-11-05

The official production catalog GET returned HTTP 200 with inference enabled,
Qwen/Llama roles, and web search/fetch available. The public timeout evidence
receipt also returned HTTP 200. These are read-only checks; no inference was
sent. Current documented tenant-usage reads returned HTTP 401 for both the
production inference key and isolated budget-test key. Guardrail profile
discovery returned `available: false` because the hosted service is not
configured; the inference key's routing-policy list returned 401. See the
redacted [`final-live-validation.json`](../evidence/final-live-validation.json).

Timeout regressions now cover local adapter abort versus actual gateway 504,
request identity retention, and diagnostic secret/URL redaction. The route
test checks the fixed single-use `otari_web_fetch` declaration and only marks
it verified when a gateway fetch event is present. These are mocked tests, not
hosted web or inference evidence. Full local verification after the final
code changes: typecheck, lint, format check, unit tests (117), production
build, and desktop/mobile Playwright (20) pass. The live Otari Qwen/Llama pair
and web tool were not tested in that pass because the prior Qwen billing
outcome was unresolved.

## Final evidence refresh — 2026-11-06

The isolated request-count budget test is complete and recorded in
[`budget-enforcement-test.json`](../evidence/budget-enforcement-test.json):
one request admitted at HTTP 200 and one refused at HTTP 403
`budget_exceeded`, scope `api_token`. The production budget was not used.
Capability logic tests now assert this evidence contributes one verified
advanced category.

The latest read-only guardrail profile query returned HTTP 200 with
`available=false` and no profiles. No inference was sent. No fallback request
was sent because this environment lacks an API key bound to the isolated
fallback workspace and the explicit provider-key preference was not confirmed;
see [`fallback-test-readiness.json`](../evidence/fallback-test-readiness.json).
No paid production request was made.

The dedicated fallback key is present locally and was used only for read-only
checks: `/models` returned HTTP 200 and listed Qwen, Llama, and
`modelswitch-fallback-proof`; `/routing/policies` returned HTTP 401 because the
inference key is not a master key; `/tools` returned HTTP 200 with web search
and fetch disabled for that test workspace. No fallback request was sent
because **Always use this key** and backup funding could not be verified. The
read-only guardrail catalog lists integrations, but profiles return
`available=false`; no owner mandate was available or changed. The default
workspace's earlier web availability remains distinct from the test workspace.

Production static route checks during this pass showed existing routing and
MCP evidence routes available but the newly added budget receipt route returned
HTTP 404. The deployed site is therefore behind this source revision at least
for that route; the exact deployment SHA remains unavailable. Deploy the
synchronized `main` revision through the existing `modelswitch-lab` Vercel
project, then verify the budget evidence route.

## Native web-fetch acceptance — 2026-11-06

Read-only Otari discovery with the Default-workspace `OTARI_API_KEY` returned
HTTP 200 for `/models` and `/tools`; Qwen and Llama advertise tool support,
and native web search/fetch are available in that key's workspace context.
The workspace tool-settings read returned 401, so its workspace name and
domain policy were not independently retrieved.

The prior request shape was sent once as a direct hosted schema diagnostic.
Otari rejected `max_uses` and `allowed_domains` inside the built-in fetch tool
declaration with HTTP 400 detail `declarations may contain only the type
field` (request `ce805efd-5297-40b6-8306-264da4537ae5`). A corrected
non-streaming request used a type-only declaration, non-parallel calls, and
the fixed Mozilla Manifesto URL. Otari returned HTTP 200 with request
`8058116e-e1b4-4f24-90d7-3b766a4f41e1`, Qwen/DeepInfra, and completed tool
event `otari_wf_66cfd3e1beb54026a97306892102ec57`. The usage lookup confirmed
`success` and `$0.010888`. The final model answer ended mid-sentence; we claim
the successful native fetch only. Full proof is in
[`web-fetch-live.json`](../evidence/web-fetch-live.json).

The application route and test now send the hosted-accepted type-only
declaration and keep the source fixed to the server-side allowlist. This is
covered by a mocked route contract test, not a public production inference
test. Deploy this revision before claiming the public Capabilities UI reflects
the receipt. Final verification on this commit: typecheck, lint, 119 unit
tests across six files, repository and documentation Prettier checks,
production build, and 20 desktop/mobile Playwright tests passed. Axe checks
passed on both viewports. The production evidence endpoint for the new receipt
still returns HTTP 404, so this pushed commit is not yet confirmed deployed.
