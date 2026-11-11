import { formatRunTime, loadDemoRecords } from './demo/src/progression/demo-run.js';

const byId = id => document.getElementById(id);
function localStorageOrNull() { try { return window.localStorage; } catch { return null; } }
function formatDate(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : `Completed ${date.toLocaleString()}`; }

function renderRecords() {
  const storage = localStorageOrNull();
  const records = loadDemoRecords(storage);
  const fastest = records.bestFastest;
  const lowest = records.bestLowestPx;
  byId('fastestTime').textContent = fastest ? formatRunTime(fastest.activeTimeMs) : '—';
  byId('fastestDetail').textContent = fastest ? `${fastest.pxSpent} PX spent · ${fastest.attempts} match ${fastest.attempts === 1 ? 'attempt' : 'attempts'}` : 'Complete a scored three-level run to set this record.';
  byId('fastestDate').textContent = fastest ? formatDate(fastest.completedAt) : '';
  byId('lowestPx').textContent = lowest ? `${lowest.pxSpent} PX` : '—';
  byId('lowestDetail').textContent = lowest ? `${formatRunTime(lowest.activeTimeMs)} active time · ${lowest.attempts} match ${lowest.attempts === 1 ? 'attempt' : 'attempts'}` : 'Win all three battles while spending as little PX as possible.';
  byId('lowestDate').textContent = lowest ? formatDate(lowest.completedAt) : '';
  const count = Number(Boolean(fastest)) + Number(Boolean(lowest));
  byId('recordStatus').textContent = !storage ? 'Local storage is unavailable — guest records cannot persist.' : count ? `${count} personal-best ${count === 1 ? 'category' : 'categories'} saved locally.` : 'No completed scored run found yet.';
  byId('comparisonBest').textContent = fastest ? formatRunTime(fastest.activeTimeMs) : 'No clear yet';
}

byId('refreshRecords').addEventListener('click', renderRecords);
window.addEventListener('storage', renderRecords);
document.addEventListener('visibilitychange', () => { if (!document.hidden) renderRecords(); });
renderRecords();
