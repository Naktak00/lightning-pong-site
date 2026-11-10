import { TUNING } from '../core/tuning.js';

export function activateBlueAccelerate(ball, { mastery = 1 }) {
  const beforeSpeed = Math.hypot(ball.vx, ball.vy);
  if (beforeSpeed <= 0) return { beforeSpeed: 0, afterSpeed: 0, multiplier: 1 };
  const requested = TUNING.orbs.blueMultiplierByMastery[Math.max(1, Math.min(5, mastery))];
  const afterSpeed = Math.min(TUNING.ball.maximumSpeed * TUNING.orbs.blueOverdriveCapMultiplier, beforeSpeed * requested);
  const factor = afterSpeed / beforeSpeed;
  ball.vx *= factor;
  ball.vy *= factor;
  ball.blueOverdriveRemaining = TUNING.orbs.blueOverdriveSeconds;
  return { beforeSpeed, afterSpeed, multiplier: factor };
}
