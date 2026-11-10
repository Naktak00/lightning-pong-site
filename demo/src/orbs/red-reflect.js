import { TUNING } from '../core/tuning.js';

export function activateRedReflect(ball, { mastery = 1, rng }) {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed <= 0) return { beforeSpeed: 0, afterSpeed: 0, deflection: 0 };
  const maxDeflection = TUNING.orbs.redMaximumDeflectionByMastery[Math.max(1, Math.min(5, mastery))];
  const deflection = (rng.next() * 2 - 1) * maxDeflection;
  const reversedAngle = Math.atan2(-ball.vy, -ball.vx) + deflection;
  ball.vx = Math.cos(reversedAngle) * speed;
  ball.vy = Math.sin(reversedAngle) * speed;
  return { beforeSpeed: speed, afterSpeed: Math.hypot(ball.vx, ball.vy), deflection };
}

