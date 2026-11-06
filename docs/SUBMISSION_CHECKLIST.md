# Submission checklist

## Project information

- [x] **Project:** ModelSwitch Lab — open-weight model testing, decision support and manual test-model switching through Mozilla Otari.
- [x] **Official production URL:** <https://modelswitch-lab.vercel.app>
- [x] **Public repository:** <https://github.com/sopskistar/modelswitch-lab>
- [x] **Submission branch:** `hackathon/mozfest-otari-2026`
- [x] **Judge entry point:** [five-minute walkthrough](JUDGE_WALKTHROUGH.md)
- [x] **First Otari integration commit:** [`2be9a17c37e7154a852ed9f01fb8e09c8971844c`](https://github.com/sopskistar/modelswitch-lab/commit/2be9a17c37e7154a852ed9f01fb8e09c8971844c)
- [x] **Evidence matrix:** [RUBRIC_EVIDENCE.md](RUBRIC_EVIDENCE.md)
- [x] **Written platform feedback:** [OTARI_FEEDBACK.md](OTARI_FEEDBACK.md)
- [x] **Personal video outline:** [DEMO_SCRIPT.md](DEMO_SCRIPT.md)
- [ ] **Demo video:** participant must record and narrate the actual screen; no video is claimed.
- [ ] **Video publication URL:** add the real URL after the participant publishes the recording: `________________`.
- [ ] **Hackathon submission form:** complete required fields and submit through the official event form; the form URL/status is not available in this repository.
- [x] **Otari repository issues/PRs opened by this work:** none recorded.

## Evidence and claims

- [x] Qwen evaluator and distinct Llama analyst use real hosted Otari requests; see [`verification.json`](../evidence/verification.json).
- [x] Hosted code execution, DeepWiki MCP, policy routing, key-scoped request-limit enforcement, and native Otari web fetch have redacted records in [`evidence/`](../evidence).
- [x] Routing is described as policy execution only: the captured response has `fallback=false`; actual failover is not claimed.
- [x] Budget evidence is an Otari HTTP 403 `budget_exceeded` for the dedicated test key; it is not an application or Redis rate-limit simulation.
- [x] Native fetch claim is limited to Otari's completed tool event; the model-generated summary was incomplete.
- [x] Current assessment is up to **95/100 potential before the participant demo**, conditional on routing credit being accepted. This is not an official judge score.
- [x] Guardrails, per-user budgets and actual provider fallback remain unverified.

## Production and release

- [x] Latest public verification: `GET /api/evidence?file=web-fetch-live.json` on the official URL returned HTTP 200 on 2026-11-06 and matched request `8058116e-e1b4-4f24-90d7-3b766a4f41e1`.
- [ ] **Exact production Git SHA:** verify in the existing `modelswitch-lab` Vercel project's deployment details. Public endpoints do not reveal it; do not infer it from a successful evidence URL.
- [x] Final documentation release is synchronized to `main` and `hackathon/mozfest-otari-2026` with a fast-forward-only push; both branches should point to the same final release commit.
- [ ] Confirm the final docs commit is included in Vercel's production deployment if required. Do not deploy to the duplicate no-hyphen project.
- [x] No production key, budget, policy or Vercel environment setting was changed for this documentation pass.

## Participant's final actions

1. Verify the selected production project's source revision and current public environment protections in Vercel.
2. Personally record and narrate a 3–5 minute screen demonstration using [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md).
3. Publish the recording and add its actual URL above and to the submission form.
4. Submit the project and required written Otari feedback through the event's official process; record any form confirmation privately.
