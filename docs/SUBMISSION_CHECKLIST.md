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

- [ ] Live site: not deployed or confirmed. Do not submit a placeholder URL.
- [ ] Production branch: `main` is the deployment source; no Vercel project/deployment is linked in this workspace.
- [ ] Before enabling public inference, configure an Otari-side hard spending ceiling, durable Upstash Redis limits, and `PUBLIC_DEMO_ENABLED=true`; otherwise leave it disabled.
- [ ] Once the owner provides the production URL, run the production browser/safety checks, update the README and record the exact commit deployed.

## Final repository state

Both `main` and `hackathon/mozfest-otari-2026` should contain the merged project and final submitted polish. Preserve the first-integration commit and merge history; do not force-push or delete the submission branch.
