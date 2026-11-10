import { TUNING } from '../core/tuning.js';

export function createCharge(mastery = 1) { return { mastery:Math.max(1,Math.min(5,mastery)), count:0, phase:'charging', live:false }; }
export function reinforceCharge(current, mastery = 1) {
  if (!current) return createCharge(mastery);
  current.mastery = Math.max(current.mastery, Math.max(1, Math.min(5, mastery)));
  if (current.phase === 'charging') current.count = Math.min(5, current.count + 2);
  return current;
}
export function chargeCollision(charge) {
  if (!charge || charge.phase === 'live') return { charge, becameLive:false };
  charge.count = Math.min(6, charge.count + 1);
  const becameLive = charge.count === 6;
  if (becameLive) { charge.phase = 'live'; charge.live = true; }
  return { charge, becameLive };
}
export function dischargeCharge(charge, struckSide) {
  if (charge?.phase !== 'live') return { charge, stun: null };
  const duration = TUNING.orbs.chargeStunSeconds[Math.max(1, Math.min(5, charge.mastery))];
  return { charge: null, stun: { side: struckSide, remaining: duration, duration } };
}
export function advanceStun(stun, dt) { if (!stun) return null; stun.remaining -= dt; return stun.remaining > 0 ? stun : null; }
export function voltTackle(ball, physicalSide) {
  const speed = Math.min(TUNING.ball.maximumSpeed, Math.hypot(ball.vx, ball.vy) * 3);
  ball.vx = (physicalSide === 'left' ? 1 : -1) * speed;
  ball.vy = 0;
  return { cleared: true, speed };
}

export function chargePips(charge){return Array.from({length:6},(_,index)=>({filled:Boolean(charge)&&charge.phase==='charging'&&index<charge.count}))}
export function stunPips(stun){const filled=stun?Math.max(0,Math.ceil(stun.remaining/stun.duration*6)):0;return Array.from({length:6},(_,index)=>({filled:index<filled}))}
