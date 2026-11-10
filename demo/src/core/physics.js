import { TUNING } from './tuning.js';
import { awardPx } from './px.js';
import { cleanLifeReset, createMatchState } from './match.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function createArena({ seedRng, playerLives = 3, player2Lives = 3 } = {}) {
  const { width, height } = TUNING.arena;
  const p = TUNING.paddle;
  const rng = seedRng ?? { next: () => 0.5 };
  const state = {
    width,
    height,
    match: createMatchState({ playerLives, player2Lives }),
    paddles: {
      player1: { x: p.inset, y: (height - p.height) / 2, vy: 0, width: p.width, height: p.height, side:'left' },
      player2: { x: width - p.inset - p.width, y: (height - p.height) / 2, vy: 0, width: p.width, height: p.height, side:'right' },
    },
    goalDefenders: { left:'player1', right:'player2' },
    ball: { x: width / 2, y: height / 2, vx: 0, vy: 0, radius: TUNING.ball.radius },
    serveToward: 'player2',
    events: [],
  };
  prepareServe(state, 'player2', rng);
  return state;
}

export function prepareServe(state, toward, rng) {
  centerBattlefield(state);
  state.serveToward = toward;
  const angle = (rng.next() - 0.5) * 0.7;
  const direction = toward === 'player2' ? 1 : -1;
  state.ball.vx = direction * TUNING.ball.serveSpeed * Math.cos(angle);
  state.ball.vy = TUNING.ball.serveSpeed * Math.sin(angle);
}

export function centerBattlefield(state) {
  const p = TUNING.paddle;
  state.paddles.player1.y = state.paddles.player2.y = (state.height - p.height) / 2;
  for(const identity of ['player1','player2']){
    const side=state.goalDefenders.left===identity?'left':'right';
    state.paddles[identity].side=side;
    state.paddles[identity].x=side==='left'?p.inset:state.width-p.inset-p.width;
  }
  state.paddles.player1.vy = state.paddles.player2.vy = 0;
  state.ball.x = state.width / 2;
  state.ball.y = state.height / 2;
}

export function simulateStep(state, input, dt, rng) {
  state.events.length = 0;
  if (state.match.phase === 'finished') return state.events;

  movePaddle(state.paddles.player1, input.player1 ?? 0, TUNING.paddle.playerSpeed, dt, state.height);
  movePaddle(state.paddles.player2, input.player2 ?? 0, TUNING.paddle.player2Speed, dt, state.height);

  if (state.match.phase === 'ready') {
    state.match.readyRemaining -= dt;
    if (state.match.readyRemaining <= 0) {
      state.match.phase = 'playing';
      state.events.push({ type: 'serve', toward: state.serveToward });
    }
    return state.events;
  }

  const ball = state.ball;
  if (ball.blueOverdriveRemaining > 0) {
    ball.blueOverdriveRemaining = Math.max(0, ball.blueOverdriveRemaining - dt);
    if (ball.blueOverdriveRemaining === 0) clampBallSpeed(ball, TUNING.ball.maximumSpeed);
  }
  const previous = { x: ball.x, y: ball.y };
  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  collideWalls(state, previous);
  collidePaddle(state, 'player1', previous);
  collidePaddle(state, 'player2', previous);

  if (ball.x + ball.radius < 0) score(state, state.goalDefenders.left, rng);
  else if (ball.x - ball.radius > state.width) score(state, state.goalDefenders.right, rng);

  return state.events;
}

function clampBallSpeed(ball, maximum) {
  const speed = Math.hypot(ball.vx, ball.vy);
  if (speed <= maximum) return;
  const factor = maximum / speed;
  ball.vx *= factor;
  ball.vy *= factor;
}

function movePaddle(paddle, axis, speed, dt, arenaHeight) {
  const requested = clamp(axis, -1, 1) * speed;
  paddle.vy = requested;
  paddle.y = clamp(paddle.y + requested * dt, 0, arenaHeight - paddle.height);
}

function collideWalls(state, previous) {
  const b = state.ball;
  if (b.y - b.radius <= 0 && b.vy < 0) {
    b.y = b.radius;
    b.vy = Math.abs(b.vy);
    awardPx(state.match.px, 'wall');
    state.events.push({ type: 'wallHit', wall: 'top', from: previous });
  } else if (b.y + b.radius >= state.height && b.vy > 0) {
    b.y = state.height - b.radius;
    b.vy = -Math.abs(b.vy);
    awardPx(state.match.px, 'wall');
    state.events.push({ type: 'wallHit', wall: 'bottom', from: previous });
  }
}

function collidePaddle(state, side, previous) {
  const b = state.ball;
  const paddle = state.paddles[side];
  const onLeft = paddle.side === 'left';
  const movingToward = onLeft ? b.vx < 0 : b.vx > 0;
  if (!movingToward) return;

  const face = onLeft ? paddle.x + paddle.width : paddle.x;
  const previousEdge = onLeft ? previous.x - b.radius : previous.x + b.radius;
  const currentEdge = onLeft ? b.x - b.radius : b.x + b.radius;
  const crossedFace = onLeft
    ? previousEdge >= face && currentEdge <= face
    : previousEdge <= face && currentEdge >= face;
  if (!crossedFace) return;

  const travel = currentEdge - previousEdge;
  const t = travel === 0 ? 0 : clamp((face - previousEdge) / travel, 0, 1);
  const contactY = previous.y + (b.y - previous.y) * t;
  if (contactY + b.radius < paddle.y || contactY - b.radius > paddle.y + paddle.height) return;

  b.x = onLeft ? face + b.radius : face - b.radius;
  b.y = contactY;
  reflectFromPaddle(state, side, paddle, contactY);
}

function reflectFromPaddle(state, side, paddle, contactY) {
  const b = state.ball;
  const cfg = TUNING.ball;
  const offset = clamp((contactY - (paddle.y + paddle.height / 2)) / (paddle.height / 2), -1, 1);
  const oldSpeed = Math.hypot(b.vx, b.vy);
  const cap = b.blueOverdriveRemaining > 0 ? cfg.maximumSpeed * TUNING.orbs.blueOverdriveCapMultiplier : cfg.maximumSpeed;
  const speed = clamp(oldSpeed * cfg.paddleAcceleration, cfg.serveSpeed, cap);
  const angle = offset * cfg.maximumBounceAngleRadians;
  const horizontalSign = paddle.side === 'left' ? 1 : -1;
  let vx = horizontalSign * Math.max(cfg.minimumHorizontalSpeed, Math.abs(Math.cos(angle) * speed));
  let vy = Math.sin(angle) * speed + paddle.vy * cfg.paddleVelocityInfluence;
  const adjustedSpeed = Math.hypot(vx, vy);
  if (adjustedSpeed > cap) {
    const factor = cap / adjustedSpeed;
    vx *= factor; vy *= factor;
  }
  b.vx = vx; b.vy = vy;
  state.match.lastStriker = side;
  state.match.rally++;
  if (side === 'player1') awardPx(state.match.px, 'playerPaddle');
  state.events.push({ type: 'paddleHit', side, offset, speed: Math.hypot(vx, vy) });
}

function score(state, concededBy, rng) {
  const scoredBy = concededBy === 'player1' ? 'player2' : 'player1';
  state.match.lives[concededBy]--;
  if (scoredBy === 'player1') awardPx(state.match.px, 'opponentLife');
  state.events.push({ type: 'score', scoredBy, concededBy });

  if (state.match.lives[concededBy] <= 0) {
    state.match.phase = 'finished';
    state.match.winner = scoredBy;
    state.ball.vx = state.ball.vy = 0;
    state.events.push({ type: 'matchEnd', winner: scoredBy });
    return;
  }

  cleanLifeReset(state.match, concededBy);
  prepareServe(state, concededBy, rng);
}
