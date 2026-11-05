# Submission checklist

## Project identity

- [x] Public repository: <https://github.com/sopskistar/modelswitch-lab>
- [x] Submission branch: `hackathon/mozfest-otari-2026`
- [x] First Otari integration commit:
      [`2be9a17c37e7154a852ed9f01fb8e09c8971844c`](https://github.com/sopskistar/modelswitch-lab/commit/2be9a17c37e7154a852ed9f01fb8e09c8971844c)
- [x] Project summary: a reproducible open-weight model evaluation workbench using hosted Mozilla Otari, deterministic scoring, cost/latency comparison, and inspectable request evidence.

## Evidence and demo

- [x] Verified Otari capabilities: distinct open-weight roles and code execution. See [proof](OTARI_PROOF.md) and [rubric matrix](RUBRIC_EVIDENCE.md).
- [x] Real model IDs, serving providers, request IDs, measured outputs and reported usage recorded in `evidence/`.
- [x] Existing project pull request #1 was merged into `main`.
- [x] Written Otari feedback: [OTARI_FEEDBACK.md](OTARI_FEEDBACK.md).
- [x] Personal demo and feedback recording outlines: [DEMO_SCRIPT.md](DEMO_SCRIPT.md).
- [ ] Participant-recorded project demo: awaiting participant; no video is claimed.
- [ ] Participant-recorded feedback video, if submitted: awaiting participant.
- [ ] Otari repository issues or pull requests: none opened by this project work.

## Deployment

- [x] Live site responds: <https://modelswitchlab.vercel.app> (HTTP 200, checked 2026-11-05).
- [x] Production smoke: public catalog confirms hosted model discovery; inference remains disabled and returns `503 demo_disabled`.
- [ ] Exact deployed Git commit: not independently confirmed. The workspace has no Vercel CLI/auth or linked project file, and GitHub's public deployment API returned no deployment records. See `evidence/production-acceptance.json`.
- [x] Production branch intent: `main` at `53671da73606e5e619e8224224a8647ee21cdae1`; whether Vercel currently serves that exact commit still needs owner dashboard confirmation.
- [ ] Before enabling public inference, configure an Otari-side hard spending ceiling, durable Upstash Redis limits, and `PUBLIC_DEMO_ENABLED=true`; otherwise leave it disabled.
- [ ] Confirm the deployed SHA in Vercel and add the production domain to its build/deployment record.
- [ ] Once durable Upstash limits, Otari hard budget, and public inference flag are verified, run one small production benchmark and verify rate-limiter behavior.

## Final repository state

Both `main` and `hackathon/mozfest-otari-2026` should contain the merged project and final submitted polish. Preserve the first-integration commit and merge history; do not force-push or delete the submission branch.
