# Browser-local leaderboard contract

Stable storage key: **`lightning-pong-web-demo-records-v1`**.

The demo and `/leaderboard.html` share browser localStorage when served from the same origin. The path does not create a separate storage area. Records do not cross browser profiles, devices, origins, or private-browsing sessions, and no network write is needed to display them.

The root website should use these existing exports rather than maintain a second parser:

```js
import { loadDemoRecords, formatRunTime } from './demo/src/progression/demo-run.js';
const records = loadDemoRecords(window.localStorage);
```

`loadDemoRecords(null)` safely returns empty records when storage is unavailable. The helper validates the result schema and current compatible build/ruleset; it reads data and does not write it.

The value is a JSON object:

```json
{
  "schemaVersion": 1,
  "buildId": "lp-web-3lv-20261110-rc1",
  "rulesetId": "three-stage-active-play-profile-loadout-v1",
  "bestFastest": null,
  "bestLowestPx": null
}
```

Each non-null result contains `schemaVersion`, `buildId`, `rulesetId`, `startedAt`, `completedAt`, `activeTimeMs`, `pxSpent`, `attempts`, `stageTimeMs`, `loadout`, and `verification: "local-practice"`. Timestamps are ISO 8601 UTC strings; time values are nonnegative integer milliseconds; PX spent and attempts are nonnegative integers. A completed result has at least three attempts. Full scoring semantics and example result fields are in `RUN-SCORING.md`.

Only these two best categories are persisted. There is no new run-history table or player identifier. Browser data is editable by the user and provides personal practice comparisons rather than authoritative competitive verification. The game's existing Hard Reset clears the key. Future incompatible schema changes should use a new versioned key or an explicit migration, not silently reinterpret v1.

The phone shell removes the old visible statistics panel from level select. Run measurement, results, and this persistence contract remain active behind the normal Play/Continue flow.
