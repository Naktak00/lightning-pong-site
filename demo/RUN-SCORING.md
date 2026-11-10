# Local three-level run rules and result schema

Build: `lp-web-3lv-20261110-rc1`

Ruleset: `three-stage-active-play-profile-loadout-v1`

Select **Start 3-level run** to begin. The standard tutorial arenas for Levels 1, 2 and 3 must be won in order. The normal level cards remain available for unscored practice. Selecting a different stage or an alternate arena ends the scored run. Starting another run replaces the unfinished attempt, while leaving saved personal bests intact.

## Time and PX

- **Active time** is the sum of the game's simulated active time across every stage attempt. Ready/serve holds, losses, restarts, and retries count. Manual pauses, the audio menu, briefings, other menus, and time while the browser tab is hidden do not count. A stalled render frame advances only the simulation's normal capped interval; this metric is not a wall-clock speedrun timer.
- **PX spent** is the sum of successful shop debits after starting the run, including orb/life/cosmetic/background/lore purchases and paid orb-level switches. Failed purchases, equipping owned items, and earned PX do not change this figure. Existing upgrades are allowed and captured as the starting loadout; their historical purchase cost is not charged again.
- **Attempts** counts each match started, including a restarted or retried match.
- Reloading ends an unfinished scored run because match state is not restored. The normal profile's unlocked stages, PX, and settings continue to save separately.

These are local practice records. They are editable browser data and are not suitable as authoritative competition claims. No score or player data is sent to a server.

## Completed result, schema version 1

```json
{
  "schemaVersion": 1,
  "buildId": "lp-web-3lv-20261110-rc1",
  "rulesetId": "three-stage-active-play-profile-loadout-v1",
  "startedAt": "ISO 8601 UTC timestamp",
  "completedAt": "ISO 8601 UTC timestamp",
  "activeTimeMs": 123456,
  "pxSpent": 300,
  "attempts": 4,
  "stageTimeMs": { "1": 30000, "2": 40000, "3": 53456 },
  "loadout": {
    "maximumLives": 3,
    "activeOrbMastery": { "red": 1 },
    "prizedOrb": null,
    "freeColorSelect": false
  },
  "verification": "local-practice"
}
```

Only the best-fastest and best-lowest-PX completed results are stored under `lightning-pong-web-demo-records-v1`. There is no added persistent run history or active-run recovery ledger. A faster time wins the fastest record; lower spending breaks equal-time ties. Lower spending wins the lowest-PX record; faster time breaks equal-spend ties. Incompatible build/ruleset records are ignored rather than silently compared. The game's existing Hard Reset also clears these records.
