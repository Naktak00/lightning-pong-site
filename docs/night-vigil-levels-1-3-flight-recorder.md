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

## Current batch

1. Recover the archive build in an isolated `/demo/` site directory.
2. Establish baseline HTTP launch and gameplay-state checks.
3. Fix only verified blockers before presentation polish.

## Stop state

- Status: ACTIVE — HIGH-VIGIL
- Exact next action: create the isolated demo branch and recover the archive build without altering the production home page.
