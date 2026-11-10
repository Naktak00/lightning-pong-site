# Levels 1–3 browser recovery — local engineering handoff

This candidate was recovered from the preserved October 18 archive ZIP. The source ZIP remains unchanged. The complete browser build is under `app/`, and its relative imports resolve through `src/`.

Serve the repository over HTTP and open `/demo/`. The root entry redirects to `/demo/app/index.html`.

## Verified baseline

- All three campaign stages load with sequential unlocks.
- Level select → briefing → Start Battle runs in headless Chrome.
- Keyboard and on-screen movement controls move the player paddle.
- A player gesture unlocks audio; original stage audio requests succeed.
- Pause freezes physics and contributes zero to completion time.
- Opening and closing the volume menu preserves a manual pause.
- Restart creates a fresh match; a synthetic defeat can return to a new attempt.
- Synthetic goals through the real physics/result path unlock Levels 1, 2 and 3 and reach the existing credits.
- Reduced-motion credits use a stationary scrollable roll.
- Cleared stages and PX survive reload; a corrupt primary save can recover its prior complete backup.
- Guest play boots when the browser denies local storage.
- A 390 × 844 viewport has no horizontal overflow.
- Browser regression ended with zero runtime exceptions and zero failed asset requests.
- Explicit three-level runs show active-time, PX-spent, attempt and completion-date results.
- A real 300-PX shop debit is counted during a scored run; a zero-spend completion replaces the lowest-PX record.
- Independent fastest/lowest-PX personal bests restore after reload.
- The accessible **Back to Lightning Pong** link returns to the site's homepage.

Synthetic goal tests are state-transition evidence, not a natural player playthrough or proof of balance. No natural full-game victory is claimed.

## Changes from the archive

1. Browser demo saves use their own `lightning-pong-web-demo-save-v1` namespace.
2. Manual pause and temporary audio-menu pause are tracked separately. Restart clears the audio overlay and stale movement inputs.
3. Stage completion duration counts simulated active play rather than wall-clock pause time.
4. Storage-denied startup falls back to an in-memory guest session. The game continues, but progress cannot persist in that environment.
5. Added local progression and browser regression checks. Test-only controls are injected into a local intercepted response; they are absent from shipped JavaScript.
6. Added local three-stage scoring and results; the precise rules and schema are in `RUN-SCORING.md`.
7. Added a website return link and narrow-header wrapping.

## Reproduce

Use Node 20+ (the machine's installed system Node 18 is too old for its bundled Playwright). The existing bundled Node runtime is Node 24.22.1.

```powershell
& 'C:\Users\Nana\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test demo/tests/*.test.mjs
& 'C:\Users\Nana\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' demo/tools/browser-check.mjs
```

The browser check uses the existing bundled Playwright and an isolated headless system Chrome. `LP_PLAYWRIGHT_MODULE` and `LP_BROWSER_EXECUTABLE` can override their locations. It starts and closes its own temporary HTTP server. Evidence is written to ignored `demo/output/playwright/`.

## Remaining release work

- Complete natural player playthroughs, controller testing, and real touch-device/audio testing before acceptance.
- Review portrait gameplay usability; lack of horizontal overflow does not establish comfortable play.
- Keep production publication gated for Nana's review.

No accounts, score uploads, purchases, external administration, or production deployment were activated.
