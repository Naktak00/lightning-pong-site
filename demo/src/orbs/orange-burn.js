import { TUNING } from '../core/tuning.js';

export function igniteBurn(current, mastery = 1) {
  const cap = Math.min(TUNING.orbs.burnMaximumLevel, Math.max(1, mastery + 1));
  if (!current) return { phase: 'charging', level: 1, cap };
  current.cap = cap;
  current.level = Math.min(cap, current.level + 1);
  return current;
}

export function accelerateBurn(ball, multiplier = TUNING.orbs.burnCollectionSpeedMultiplier) {
  const before = Math.hypot(ball.vx, ball.vy);
  if (!before) return 0;
  const after = Math.min(TUNING.ball.maximumSpeed, before * multiplier);
  ball.vx *= after / before;
  ball.vy *= after / before;
  return after;
}

export function burnCollision(burn, kind, ball = null) {
  if (!burn) return null;
  if (burn.phase === 'charging' && kind === 'paddle') {
    burn.level = Math.min(burn.cap, burn.level + 1);
    if (ball) accelerateBurn(ball, TUNING.orbs.burnPaddleSpeedMultiplier);
    if (burn.level >= burn.cap) burn.phase = 'burnout';
  } else if (burn.phase === 'burnout' && kind === 'wall') {
    burn.level--;
    if (burn.level <= 0) return null;
  }
  return burn;
}

export function extinguishBurn() { return null; }
export function burnColor(level) { return ['transparent','#ff8b2b','#ff3d45','#3fa7ff','#ffffff'][level] ?? 'transparent'; }
