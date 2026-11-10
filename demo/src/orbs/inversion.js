import { TUNING } from '../core/tuning.js';

export function activateInversion(state) {
  const p1=state.paddles.player1,p2=state.paddles.player2;
  const x=p1.x,side=p1.side;p1.x=p2.x;p1.side=p2.side;p2.x=x;p2.side=side;
  const defender=state.goalDefenders.left;state.goalDefenders.left=state.goalDefenders.right;state.goalDefenders.right=defender;
  return { remaining: TUNING.orbs.inversionHoldSeconds, active: true };
}
export function advanceInversionHold(hold, dt) { if (!hold) return null; hold.remaining -= dt; return hold.remaining > 0 ? hold : null; }
