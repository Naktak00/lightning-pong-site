import { TUNING } from '../core/tuning.js';

export function addWarpPair(pairs, pair) {
  const next = [...pairs, { ...pair, exitLock: 0, whiteExitCount: 0 }];
  return next.length > 2 ? next.slice(next.length - 2) : next;
}
export function resetWarpCounters(pairs, ball) {
  for (const pair of pairs) pair.whiteExitCount = 0;
  ball.warpsSincePaddle = 0;
  ball.warpExitLock = 0;
}
export function advanceWarp(pairs, ball, dt, rng) {
  ball.warpExitLock = Math.max(0, (ball.warpExitLock ?? 0) - dt);
  for (const pair of pairs) {
    pair.exitLock = Math.max(0, (pair.exitLock ?? 0) - dt);
    if(pair.exitCue){pair.exitCue.remaining-=dt;if(pair.exitCue.remaining<=0)pair.exitCue=null;}
    if (pair.exitLock > 0 || ball.warpExitLock > 0 || (ball.warpsSincePaddle ?? 0) >= 6) continue;
    const dx = pair.black.x - ball.x, dy = pair.black.y - ball.y;
    const distance = Math.hypot(dx, dy);
    if (distance < TUNING.orbs.warpSuctionRadius && distance > 0) {
      const pull = (1 - distance / TUNING.orbs.warpSuctionRadius) * 95 * dt;
      ball.vx += dx / distance * pull; ball.vy += dy / distance * pull;
    }
    if (distance <= TUNING.orbs.warpEventHorizonRadius + ball.radius) {
      const speed=Math.hypot(ball.vx,ball.vy)||1,clearance=TUNING.orbs.warpEventHorizonRadius+ball.radius+4;
      const step=Math.min(5,pair.whiteExitCount??0);
      if(step){
        const angle=(rng?.next?.()??Math.random())<.5?-step*Math.PI/18:step*Math.PI/18;
        const vx=ball.vx*Math.cos(angle)-ball.vy*Math.sin(angle);
        ball.vy=ball.vx*Math.sin(angle)+ball.vy*Math.cos(angle);
        ball.vx=vx;
      }
      ball.x = pair.white.x + ball.vx / speed * clearance;
      ball.y = pair.white.y + ball.vy / speed * clearance;
      pair.whiteExitCount=Math.min(5,step+1);
      ball.warpsSincePaddle=(ball.warpsSincePaddle??0)+1;
      ball.warpExitLock=TUNING.orbs.warpExitLockSeconds;
      pair.exitLock = TUNING.orbs.warpExitLockSeconds;
      pair.exitCue={remaining:.5,vx:ball.vx/speed,vy:ball.vy/speed};
      return pair.id;
    }
  }
  return null;
}
