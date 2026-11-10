import { TUNING } from '../core/tuning.js';

export function createMagnet(owner, mastery = 1) {
  const level = Math.max(1, Math.min(5, mastery));
  const duration = TUNING.orbs.magnetDurationSeconds[level];
  return { owner, mastery: level, remaining: duration, duration, programmedY: null };
}
export function advanceMagnet(magnet, state, dt) {
  if (!magnet) return null;
  magnet.remaining -= dt;
  if (magnet.remaining <= 0) return null;
  const paddle = state.paddles[magnet.owner];
  if (!paddle) return null;
  const towardOwner = magnet.owner === 'player1' ? state.ball.vx < 0 : state.ball.vx > 0;
  if (towardOwner) {
    const error = paddle.y + paddle.height / 2 - state.ball.y;
    const strength = TUNING.orbs.magnetCurveStrengthByMastery[magnet.mastery];
    state.ball.vy += Math.sign(error) * Math.min(Math.abs(error) * 1.5, strength) * dt;
    const speed = Math.hypot(state.ball.vx, state.ball.vy);
    if (speed > TUNING.ball.maximumSpeed) { state.ball.vx *= TUNING.ball.maximumSpeed / speed; state.ball.vy *= TUNING.ball.maximumSpeed / speed; }
  }
  return magnet;
}
export function magnetWallCollision(magnet, state) {
  if (!magnet) return;
  const paddle = state.paddles[magnet.owner];
  if (magnet.mastery >= 1) {
    magnet.programmedY = paddle.y + paddle.height / 2;
    const dx = magnet.owner === 'player1' ? state.ball.x : state.width - state.ball.x;
    const time = Math.max(0.15, dx / Math.max(1, Math.abs(state.ball.vx)));
    const correction = (magnet.programmedY - state.ball.y) / time;
    const authority = .45 + magnet.mastery * .11;
    state.ball.vy = state.ball.vy * (1 - authority) + correction * authority;
  }
}
