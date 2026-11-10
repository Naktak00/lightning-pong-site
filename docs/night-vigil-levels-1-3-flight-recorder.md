# Levels 1–3 browser demo — Night Vigil flight recorder

## Window

- Started: November 10, 2026, America/New_York
- Objective: create a polished, browser-playable Levels 1–3 release candidate from the verified archive build and integrate it into the Lightning Pong website.
- Production anchor: `bb97cfd`
- Production publication: held for Nana's final review.
- Completion condition: verified release candidate or LOW reserve.
- LOW: approximately 20% five-hour capacity remaining.
- SUSPEND: approximately 10% five-hour capacity remaining.
- Shared-PC guard: no shutdown, restart, or competition with an active protected simulator session.

## Roles

- Mana-Prime: scope, resource governor, verification, checkpoints, and GitHub/external actions.
- MANA-LP: local implementation, debugging, builds, tests, and evidence.

## Entry state

- Live player-facing website verified at commit `bb97cfd`.
- Source archive preserved at `E:\_MANA\_LP Open Alpha\output\releases\lightning-pong-1.0.0-archive-demo-20261018-123412.zip`.
- Archive contains a complete `app/` browser build, shared `src/` modules, Windows launch helpers, and three level audio tracks.
- gBridge continuity surface was not available locally; current direct authorization permits this bounded local build only.

## Completed batches

1. Recovered the preserved archive into an isolated `/demo/` site directory without modifying the source ZIP.
2. Fixed verified pause-time, audio-menu pause, restart-input, and storage-denied startup defects.
3. Added an explicit scored Levels 1–3 run with active-play timing, successful-shop-debit PX spending, attempts, loadout capture, results, and separate local fastest/lowest-spend bests.
4. Connected the player-facing website to the demo and added an accessible route back home.
5. Replaced remaining homepage “coming soon” language with player-facing preview language.

## Verification evidence

- Source project: 81/81 tests passed.
- Browser-demo unit tests: 9/9 passed.
- JavaScript/MJS syntax checks: 39 passed.
- Browser regression: 23 checks passed.
- Runtime errors: 0.
- Missing assets: 0.
- Network writes or score uploads: 0.
- Real-browser route verified: homepage → demo → scored-run setup → homepage.
- Results screenshot reviewed: `demo/output/playwright/scored-run-results.png`.
- Rules/schema: `demo/RUN-SCORING.md`.
- Engineering handoff: `demo/WEB-DEMO-HANDOFF.md`.

Synthetic completions exercise the real result and progression paths but are not represented as natural player victories or balance proof.

## Stop state

- Status: VERIFIED LOCAL RELEASE CANDIDATE — HELD FOR NANA REVIEW
- Exact next action: Nana naturally plays Levels 1–3 and reviews the candidate on desktop; controller and real touch-device/audio checks remain manual acceptance items.
- Publication: not pushed and not deployed.
