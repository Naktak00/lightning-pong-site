import { TUNING } from './tuning.js';
import { createPxLedger } from './px.js';

export function createMatchState({ playerLives = 3, player2Lives = 3 } = {}) {
  return {
    phase: 'ready',
    readyRemaining: TUNING.match.readyHoldSeconds,
    lives: { player1: playerLives, player2: player2Lives },
    startingPlayerLives: playerLives,
    lastStriker: null,
    rally: 0,
    px: createPxLedger(),
    temporary: createTemporaryState(),
    winner: null,
    lastScore: null,
  };
}

export function createTemporaryState() {
  return {
    burn: null,
    charge: null,
    magnet: null,
    portals: [],
    shadows: [],
    inversion: null,
    stuns: { player1: null, player2: null },
    orbs: [],
  };
}

export function cleanLifeReset(match, concededBy) {
  match.phase = 'ready';
  match.readyRemaining = TUNING.match.readyHoldSeconds;
  match.lastStriker = null;
  match.rally = 0;
  match.temporary = createTemporaryState();
  match.lastScore = { concededBy, scoredBy: concededBy === 'player1' ? 'player2' : 'player1' };
}
