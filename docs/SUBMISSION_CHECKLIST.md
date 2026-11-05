# Submission checklist

## Project identity

- [x] Public repository: <https://github.com/sopskistar/modelswitch-lab>
- [x] Submission branch: `hackathon/mozfest-otari-2026`
- [x] First Otari integration commit:
      [`2be9a17c37e7154a852ed9f01fb8e09c8971844c`](https://github.com/sopskistar/modelswitch-lab/commit/2be9a17c37e7154a852ed9f01fb8e09c8971844c)
- [x] Project summary: a reproducible open-weight model evaluation workbench using hosted Mozilla Otari, deterministic scoring, cost/latency comparison, and inspectable request evidence.

## Evidence and demo

- [x] Verified Otari capabilities: distinct open-weight roles, code execution, production policy routing (without failover), and one production-managed MCP tool call/result. See [proof](OTARI_PROOF.md) and [rubric matrix](RUBRIC_EVIDENCE.md).
- [x] Real model IDs, serving providers, request IDs, measured outputs and reported usage recorded in `evidence/`.
- [x] Existing project pull request #1 was merged into `main`.
- [x] Written Otari feedback: [OTARI_FEEDBACK.md](OTARI_FEEDBACK.md).
- [x] Personal demo and feedback recording outlines: [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
- [ ] Participant-recorded project demo: awaiting participant; no video is claimed.
- [ ] Participant-recorded feedback video, if submitted: awaiting participant.
- [ ] Otari repository issues or pull requests: none opened by this project work.

## Deployment

- [x] Selected live site: <https://modelswitch-lab.vercel.app> (public catalog observed with `demoEnabled: true`; exact deployment SHA remains unverified).
- [ ] Production run corroborated with Otari request IDs, trace and saved receipt; participant-reported results are recorded separately.
- [ ] Exact deployed Git commit: not independently confirmed. Inspect the selected `modelswitch-lab` Vercel project, not the similarly named duplicate.
- [ ] Verify durable Upstash behavior and the current Otari spending boundary before another live run.
- [x] On 2026-11-05 13:02 UTC, post-push production GETs returned HTTP 200 for routing evidence, MCP evidence, and catalog. MCP served `verified_live` with request ID `d9283ac4-3aec-4ee3-8151-08937bb08554`.
- [x] Later catalog check reported web fetch/search available. One bounded allowlisted fetch returned HTTP 400 (Otari request `9bd36cf5-6ddf-433a-9d1a-95295a50fae5`) without completed tool evidence; it is not a verified capability.
- [ ] Confirm the exact deployed Git SHA in the selected `modelswitch-lab` Vercel project; public evidence-route availability does not identify the deployment commit.
- [ ] Verify production result trace/receipt if accessible; do not repeat inference solely to replace missing historical metadata.

## Final repository state

`main` and `hackathon/mozfest-otari-2026` must be synchronized after this update. Preserve the first-integration commit and merge history; do not force-push or delete the submission branch.
