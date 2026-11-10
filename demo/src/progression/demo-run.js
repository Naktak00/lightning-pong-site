export const DEMO_BUILD_ID = 'lp-web-3lv-20261110-rc1';
export const DEMO_RULESET_ID = 'three-stage-active-play-profile-loadout-v1';
export const DEMO_RECORDS_KEY = 'lightning-pong-web-demo-records-v1';
const safeCount = value => Number.isFinite(value) && value >= 0 ? Math.round(value) : 0;

export function beginDemoRun(save, now = new Date()) {
  return {
    schemaVersion: 1, buildId: DEMO_BUILD_ID, rulesetId: DEMO_RULESET_ID,
    startedAt: now.toISOString(), status: 'active', nextLevel: 1,
    activeLevel: null, activeTimeMs: 0, pxSpent: 0, attempts: 0,
    stageTimeMs: { 1:0, 2:0, 3:0 },
    loadout: {
      maximumLives: save.maximumLives,
      activeOrbMastery: { ...save.activeOrbMastery },
      prizedOrb: save.prizedOrb,
      freeColorSelect: Boolean(save.freeColorSelect),
    },
  };
}

export function startDemoAttempt(run, level, layer = 'tutorial') {
  if (!run || run.status !== 'active') return false;
  if (level !== run.nextLevel || layer !== 'tutorial') {
    run.status = 'ended'; run.activeLevel = null; return false;
  }
  run.activeLevel = level; run.attempts++; return true;
}

export function advanceDemoRun(run, dtMs) {
  if (!run || run.status !== 'active' || run.activeLevel == null || !Number.isFinite(dtMs) || dtMs <= 0) return;
  run.activeTimeMs += dtMs; run.stageTimeMs[run.activeLevel] += dtMs;
}

export function spendDemoPx(run, amount) {
  if (run?.status === 'active') run.pxSpent += safeCount(amount);
}

export function finishDemoAttempt(run, won, now = new Date()) {
  if (!run || run.status !== 'active' || run.activeLevel == null) return null;
  const level = run.activeLevel; run.activeLevel = null;
  if (!won) return null;
  run.nextLevel = level + 1;
  if (level !== 3) return null;
  run.status = 'complete';
  return {
    schemaVersion: 1, buildId: run.buildId, rulesetId: run.rulesetId,
    startedAt: run.startedAt, completedAt: now.toISOString(),
    activeTimeMs: safeCount(run.activeTimeMs), pxSpent: safeCount(run.pxSpent),
    attempts: run.attempts, stageTimeMs: Object.fromEntries(Object.entries(run.stageTimeMs).map(([key,value]) => [key,safeCount(value)])),
    loadout: structuredClone(run.loadout),
    verification: 'local-practice',
  };
}

function validResult(result) {
  return result && result.schemaVersion === 1 && result.buildId === DEMO_BUILD_ID && result.rulesetId === DEMO_RULESET_ID &&
    Number.isFinite(result.activeTimeMs) && result.activeTimeMs > 0 && Number.isFinite(result.pxSpent) && result.pxSpent >= 0 &&
    Number.isInteger(result.attempts) && result.attempts >= 3 && !Number.isNaN(Date.parse(result.completedAt));
}

export function emptyDemoRecords() {
  return { schemaVersion: 1, buildId: DEMO_BUILD_ID, rulesetId: DEMO_RULESET_ID, bestFastest: null, bestLowestPx: null };
}

export function updateDemoRecords(records, result) {
  const next = emptyDemoRecords();
  if (validResult(records?.bestFastest)) next.bestFastest = records.bestFastest;
  if (validResult(records?.bestLowestPx)) next.bestLowestPx = records.bestLowestPx;
  if (!validResult(result)) return next;
  const fast = next.bestFastest, low = next.bestLowestPx;
  if (!fast || result.activeTimeMs < fast.activeTimeMs || result.activeTimeMs === fast.activeTimeMs && result.pxSpent < fast.pxSpent) next.bestFastest = structuredClone(result);
  if (!low || result.pxSpent < low.pxSpent || result.pxSpent === low.pxSpent && result.activeTimeMs < low.activeTimeMs) next.bestLowestPx = structuredClone(result);
  return next;
}

export function loadDemoRecords(storage) {
  try { return updateDemoRecords(JSON.parse(storage.getItem(DEMO_RECORDS_KEY)), null); }
  catch { return emptyDemoRecords(); }
}

export function storeDemoRecords(storage, records) {
  try { storage.setItem(DEMO_RECORDS_KEY, JSON.stringify(records)); return true; }
  catch { return false; }
}

export function formatRunTime(ms) {
  const centiseconds = Math.floor(safeCount(ms) / 10);
  return `${Math.floor(centiseconds / 6000)}:${String(Math.floor(centiseconds / 100) % 60).padStart(2,'0')}.${String(centiseconds % 100).padStart(2,'0')}`;
}
