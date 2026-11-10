import { TUNING } from '../core/tuning.js';

export function createShadow(ball) {
  return { x: ball.x, y: ball.y, vx: ball.vx, vy: -ball.vy || 120, radius: ball.radius, bounces: 0, hollow: true };
}
export function advanceShadow(shadow, width, height, dt) {
  shadow.x += shadow.vx * dt; shadow.y += shadow.vy * dt;
  if (shadow.y - shadow.radius <= 0 && shadow.vy < 0) { shadow.y = shadow.radius; shadow.vy *= -1; shadow.bounces++; }
  if (shadow.y + shadow.radius >= height && shadow.vy > 0) { shadow.y = height - shadow.radius; shadow.vy *= -1; shadow.bounces++; }
  if (shadow.x - shadow.radius <= 0 && shadow.vx < 0) { shadow.x = shadow.radius; shadow.vx *= -1; shadow.bounces++; }
  if (shadow.x + shadow.radius >= width && shadow.vx > 0) { shadow.x = width - shadow.radius; shadow.vx *= -1; shadow.bounces++; }
  return shadow.bounces < TUNING.orbs.shadowBounceLimit ? shadow : null;
}

