import { TUNING } from '../core/tuning.js';
import { awardPx } from '../core/px.js';
import { activateRedReflect } from './red-reflect.js';
import { activateBlueAccelerate } from './blue-accelerate.js';
import { maximumActiveOrbs } from './contracts.js';
import { igniteBurn,extinguishBurn,accelerateBurn } from './orange-burn.js';
import { reinforceCharge } from './yellow-charge.js';
import { createMagnet } from './green-magnet.js';
import { addWarpPair } from './indigo-warp.js';
import { createShadow } from './purple-shadow.js';
import { activateInversion } from './inversion.js';

export function resetOrbRuntime(runtime) {
  runtime.nextSpawnSeconds = TUNING.orbs.firstSpawnSeconds;
  runtime.activations.length = 0;
}

export function advanceOrbSystem(state, runtime, previousBall, dt, rng) {
  const events = [];
  if (state.match.phase !== 'playing') return events;
  const orbs = state.match.temporary.orbs;
  for (const orb of orbs) {
    orb.remaining -= dt;
    if (orb.baseY == null) orb.baseY = orb.y;
    if (orb.floatPhase == null) orb.floatPhase = 0;
    if (orb.floatElapsed == null) orb.floatElapsed = 0;
    orb.floatElapsed += dt;
    const angle = orb.floatPhase + orb.floatElapsed * Math.PI * 2 * TUNING.orbs.floatCyclesPerSecond;
    orb.y = orb.baseY + Math.sin(angle) * TUNING.orbs.floatAmplitude;
  }
  for (let i = orbs.length - 1; i >= 0; i--) {
    if (orbs[i].remaining <= 0) {
      events.push({ type: 'orbExpired', orb: orbs[i] });
      orbs.splice(i, 1);
    }
  }

  runtime.nextSpawnSeconds -= dt;
  if (runtime.nextSpawnSeconds <= 0 && orbs.length < maximumActiveOrbs(runtime.stage) && runtime.activeTypes.length) {
    const orb = spawnOrb(state, runtime, rng);
    orbs.push(orb);
    events.push({ type: 'orbSpawned', orb });
    scheduleNext(runtime, rng);
  } else if (runtime.nextSpawnSeconds <= 0) {
    runtime.nextSpawnSeconds = 0;
  }

  for (let i = orbs.length - 1; i >= 0; i--) {
    const orb = orbs[i];
    if (!sweptBallCollects(previousBall, state.ball, orb)) continue;
    const activation = activateOrb(state, runtime, orb, rng);
    awardPx(state.match.px, 'orb');
    runtime.activations.push(activation);
    if (runtime.activations.length > 8) runtime.activations.shift();
    orbs.splice(i, 1);
    events.push({ type: 'orbCollected', orb, activation });
  }
  return events;
}

export function spawnOrb(state, runtime, rng) {
  const type = runtime.activeTypes[Math.min(runtime.activeTypes.length - 1, Math.floor(rng.next() * runtime.activeTypes.length))];
  const margin = TUNING.orbs.safeArenaMargin;
  const halfWidth = state.width / 2;
  const x = margin + rng.next() * (state.width - margin * 2);
  const y = margin + rng.next() * (state.height - margin * 2);
  const floatPhase = rng.next() * Math.PI * 2;
  return {
    id: `orb-${++runtime.sequence}`,
    type,
    x: Math.abs(x - halfWidth) < 20 ? x + 25 : x,
    y,
    baseY: y,
    floatPhase,
    floatElapsed: 0,
    radius: TUNING.orbs.radius,
    remaining: TUNING.orbs.lifetimeSeconds,
  };
}

export function activateOrb(state, runtime, orb, rng) {
  const mastery = runtime.mastery[orb.type] ?? 1;
  const owner = state.match.lastStriker;
  let result;
  if (orb.type === 'red') result = activateRedReflect(state.ball, { mastery, rng });
  else if (orb.type === 'blue') result = activateBlueAccelerate(state.ball, { mastery });
  else if (orb.type === 'orange') { state.match.temporary.burn=igniteBurn(state.match.temporary.burn,mastery);accelerateBurn(state.ball);result={burn:{...state.match.temporary.burn},speed:Math.hypot(state.ball.vx,state.ball.vy)}; }
  else if (orb.type === 'yellow') { state.match.temporary.burn=extinguishBurn();const hadCharge=Boolean(state.match.temporary.charge);state.match.temporary.charge=reinforceCharge(state.match.temporary.charge,mastery);result={charge:true,reinforced:hadCharge,count:state.match.temporary.charge.count}; }
  else if (orb.type === 'green') { state.match.temporary.magnet=owner?createMagnet(owner,mastery):null;result={magnetOwner:owner,active:Boolean(owner)}; }
  else if (orb.type === 'indigo') { const pair=createPortalPair(state,++runtime.sequence,rng);pair.mastery=mastery;state.match.temporary.portals=addWarpPair(state.match.temporary.portals,pair);result={pairId:pair.id}; }
  else if (orb.type === 'purple') { state.match.temporary.burn=extinguishBurn();state.match.temporary.shadows.push(createShadow(state.ball));result={shadow:true}; }
  else if (orb.type === 'inversion') { state.match.temporary.inversion=activateInversion(state);result={inversion:true}; }
  else result = { ignored: true };
  return { type: orb.type, owner, mastery, result };
}

function createPortalPair(state,id,rng){const margin=90;const left={x:margin+rng.next()*(state.width/2-margin*2),y:margin+rng.next()*(state.height-margin*2)};const right={x:state.width/2+margin+rng.next()*(state.width/2-margin*2),y:margin+rng.next()*(state.height-margin*2)};const blackOnLeft=rng.next()<.5;return{id:`warp-${id}`,black:blackOnLeft?left:right,white:blackOnLeft?right:left,exitLock:0}}

function scheduleNext(runtime, rng) {
  const { minimumSpawnSeconds, maximumSpawnSeconds } = TUNING.orbs;
  runtime.nextSpawnSeconds = minimumSpawnSeconds + rng.next() * (maximumSpawnSeconds - minimumSpawnSeconds);
}

function sweptBallCollects(previous, ball, orb) {
  const dx = ball.x - previous.x;
  const dy = ball.y - previous.y;
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((orb.x - previous.x) * dx + (orb.y - previous.y) * dy) / lengthSq));
  const closestX = previous.x + dx * t;
  const closestY = previous.y + dy * t;
  const reach = ball.radius + orb.radius;
  return (closestX - orb.x) ** 2 + (closestY - orb.y) ** 2 <= reach ** 2;
}
