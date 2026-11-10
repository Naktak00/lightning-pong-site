# Levels 1–3 browser demo acceptance matrix

The candidate is reviewable only when each required case has evidence. Production publication remains a separate Nana decision.

## Launch and navigation

- [ ] `/demo/` loads over HTTP without missing assets or console errors.
- [ ] A first-time player understands the primary Start action.
- [ ] Start changes the game from title state to active play exactly once.
- [ ] The player can return safely to the Lightning Pong website.

## Complete game loop

- [ ] Level 1 can be won and advances to Level 2.
- [ ] Level 2 can be won and advances to Level 3.
- [ ] Level 3 can be won and reaches a results/victory state.
- [ ] A lost match offers a working retry path.
- [ ] Restart clears temporary match state without corrupting progression.
- [ ] Pause and resume preserve the current match correctly.

## Persistence and results

- [ ] Refresh restores only the intended saved state.
- [ ] A recoverable previous save remains available when supported by the build.
- [ ] Results record total clear time, PX spent, completion date, and build version.
- [ ] The best local result survives a browser restart.
- [ ] No account is required to play or store a local best result.
- [ ] No score or player data is transmitted during this candidate build.

## Input, audio, and presentation

- [ ] Keyboard controls are documented and functional.
- [ ] Touch/pointer controls remain usable on a narrow screen where supported.
- [ ] Gamepad behavior is either verified or clearly labeled unsupported.
- [ ] Audio begins only after player interaction and can be muted.
- [ ] Missing or blocked audio does not prevent play.
- [ ] HUD and controls remain readable at desktop and mobile breakpoints.
- [ ] Focus indicators and reduced-motion behavior are usable.

## Release evidence

- [ ] Existing Lightning Pong core test suite remains green.
- [ ] Automated browser smoke checks cover every primary control/state transition that can be driven safely.
- [ ] Manual normal-completion playthrough recorded.
- [ ] Manual save/refresh recovery recorded.
- [ ] Manual loss/retry playthrough recorded.
- [ ] Known issues and deferred ideas are listed without concealing failures.
- [ ] Production homepage remains unchanged until Nana accepts the candidate.
