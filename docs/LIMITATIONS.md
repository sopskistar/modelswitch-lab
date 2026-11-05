# Current limitations and external setup

- **Historical model inference verified:** initial requests returned 402 with a $0
  balance; later funded requests completed both open-weight roles and a real
  comparison. Historical refusals remain in `smoke.json`. A successful request
  does not verify that an explicit spending budget is attached.
- **Advanced points:** code execution and distinct model roles have real successful execution proof.
  Web tools are workspace-disabled. Guardrails return a fail-closed 502 with no
  service configured. Policy routing succeeded without actual failover; fallback
  and real budget enforcement remain unverified. MCP is implemented as a fixed,
  read-only Otari Messages request but has not produced a live tool event. Per-user
  budgets are not implemented. Six capabilities remain a target, not the
  delivered evidence-backed result.
- **Production is live, deployment commit unknown:** the selected
  `modelswitch-lab.vercel.app` public catalog was observed with the configured
  demo gate enabled. The exact deployed SHA and private Vercel settings are not
  available here; Redis behavior is untested. The participant-reported invoice
  run lacks request IDs/receipt for independent corroboration. See
  `production-observation.json` and the older, superseded
  `production-acceptance.json`.
- **Small sample:** five cases per scenario cannot establish statistical
  superiority. Synthetic fixtures intentionally include easy and edge cases;
  they are not a representative real-world workload.
- **Recommendations:** deterministic weights are preference choices, not learned
  truth. Unknown latency/cost axes are omitted for every model; remaining weights
  are normalized. All-failed runs produce no recommendation. Analyst text is
  supporting interpretation and can still be mistaken.
- **Costs:** reported gateway values only. No estimated dollar amount is shown
  as actual cost. Missing/failed/interrupted requests may have unknown charges.
  Direct sandbox execution returned no inline cost in the observed response.
- **Persistence:** only one recent run, in browser localStorage. No cross-browser
  sharing, authenticated user history, automatic resumption, or server-side
  benchmark jobs. Reloading during a call may lose its response while it still
  incurs usage; the app warns and does not retry automatically.
- **Public quotas:** production requires durable Redis credentials and explicit
  enablement. A failed quota store blocks execution. Local counters are temporary.
  Application quotas are not proof of Otari spending or per-user budgets. A hard
  gateway budget is still required. Concurrency of two is per server process.
  The public catalog's `demoEnabled: true` reflects the feature flag and Redis
  environment variables being present, not successful durable counter behavior.
  No rate-limit boundary test was performed.
- **Web:** only curated URLs; configure the hosted workspace allowlist before
  public enablement. Tool output remains untrusted. A model document summary is
  not a scored public-document benchmark and cannot prove retrieval without
  actual gateway tool-call evidence.
- **Testing:** successful browser run contracts use test-only intercepted HTTP
  responses. They verify UX and handling, not live model capability. Real hosted
  refusals and sandbox execution are recorded separately. No recording has been
  generated; the participant must personally record and narrate it.
- **Build tooling:** webpack is selected after this environment blocked
  Turbopack's CSS worker port. npm legacy peer resolution is pinned in `.npmrc`
  after npm 10's resolver crashed. Production dependency audit is clean; remaining
  development-only moderate advisories are recorded in the testing guide.
- **Brand asset:** the uploaded repository contains `modelswitch-icon (1).png`;
  it does not contain `modelswitch-mark.svg`. The provided PNG is used for the
  header, footer, favicon, app icon, metadata, and README. The existing wordmark
  type remains unchanged.
