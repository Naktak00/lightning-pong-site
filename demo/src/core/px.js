import { TUNING } from './tuning.js';

export function createPxLedger() {
  return { raw: 0, wallEvents: 0, paddleEvents: 0, orbEvents: 0, scoreEvents: 0 };
}

function diminishingValue(base, repeatedCount) {
  const { repeatEventFullValueCount, repeatEventFloor } = TUNING.px;
  if (repeatedCount < repeatEventFullValueCount) return base;
  const decay = 1 / (1 + (repeatedCount - repeatEventFullValueCount + 1) * 0.08);
  return base * Math.max(repeatEventFloor, decay);
}

export function awardPx(ledger, kind) {
  let value = 0;
  if (kind === 'wall') {
    value = diminishingValue(TUNING.px.wallBounce, ledger.wallEvents++);
  } else if (kind === 'playerPaddle') {
    value = diminishingValue(TUNING.px.playerPaddleHit, ledger.paddleEvents++);
  } else if (kind === 'orb') {
    ledger.orbEvents++;
    value = TUNING.px.orb;
    ledger.wallEvents = Math.max(0, ledger.wallEvents - 6);
    ledger.paddleEvents = Math.max(0, ledger.paddleEvents - 3);
  } else if (kind === 'opponentLife') {
    ledger.scoreEvents++;
    value = TUNING.px.opponentLife;
    ledger.wallEvents = 0;
    ledger.paddleEvents = 0;
  }
  ledger.raw += value;
  return value;
}

export function settlePx(ledger, { won, perfect }) {
  let total = ledger.raw;
  if (!won) total *= TUNING.px.lossRetention;
  if (won && perfect) total *= TUNING.px.perfectVictoryMultiplier;
  return Math.max(0, Math.floor(total + 1e-9));
}

