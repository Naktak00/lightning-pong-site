const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const rounded = value => Math.round(value * 1000) / 1000;

export function createJanusEngine({ level, enabled = false, stageName = '' } = {}) {
  const state = {
    enabled: Boolean(enabled),
    level,
    stageName,
    elapsed: 0,
    sampleTimer: 0,
    pressure: 0,
    focus: 0,
    flow: 0,
    echo: 0,
    rallies: 0,
    longestRally: 0,
    playerHits: 0,
    opponentHits: 0,
    wallHits: 0,
    scoresFor: 0,
    scoresAgainst: 0,
    orbCollections: 0,
    warpMoments: 0,
    nearMisses: 0,
    lastRally: 0,
    lastPlayerY: null,
    paddleTravel: 0,
    samples: [],
    markers: [],
  };
  return state;
}

export function updateJanusEngine(janus, { arena, events = [], playerAxis = 0, dt = 0 } = {}) {
  if (!janus?.enabled || !arena) return output(janus);
  janus.elapsed += dt;
  janus.sampleTimer += dt;

  const player = arena.paddles.player1;
  if (janus.lastPlayerY != null) janus.paddleTravel += Math.abs(player.y - janus.lastPlayerY);
  janus.lastPlayerY = player.y;

  const ball = arena.ball;
  const towardPlayer = ball.vx < 0;
  const distanceToPlayerFace = Math.max(0, ball.x - (player.x + player.width));
  const verticalError = Math.abs(ball.y - (player.y + player.height / 2));
  const nearMiss = towardPlayer && distanceToPlayerFace < 95 && verticalError > player.height * 0.48 && verticalError < player.height * 0.95;
  if (nearMiss) janus.nearMisses += dt;

  for (const event of events) {
    if (event.type === 'paddleHit') {
      janus.rallies++;
      janus.longestRally = Math.max(janus.longestRally, arena.match.rally);
      if (event.side === 'player1') {
        janus.playerHits++;
        mark(janus, 'player-hit', { rally: arena.match.rally, offset: rounded(event.offset ?? 0) });
      } else {
        janus.opponentHits++;
      }
    } else if (event.type === 'wallHit') {
      janus.wallHits++;
    } else if (event.type === 'score') {
      if (event.scoredBy === 'player1') janus.scoresFor++;
      else janus.scoresAgainst++;
      mark(janus, event.scoredBy === 'player1' ? 'won-life' : 'lost-life', { rally: arena.match.rally });
    } else if (event.type === 'orbCollected') {
      janus.orbCollections++;
      if (event.orb?.type === 'indigo') {
        janus.warpMoments++;
        mark(janus, 'warp-orb', { owner: event.activation?.owner ?? 'unknown' });
      }
    }
  }

  const speed = Math.hypot(ball.vx, ball.vy);
  const speedPressure = clamp((speed - 280) / 460);
  const rallyPressure = clamp(arena.match.rally / 14);
  const missPressure = clamp(janus.nearMisses / Math.max(1, janus.elapsed * 0.12));
  const movementIntent = clamp(Math.abs(playerAxis));
  const recovery = janus.scoresAgainst > janus.scoresFor ? 0.18 : 0;

  janus.pressure = smooth(janus.pressure, clamp(speedPressure * 0.38 + rallyPressure * 0.32 + missPressure * 0.2 + recovery + movementIntent * 0.08), dt, 1.8);
  janus.focus = smooth(janus.focus, clamp(janus.playerHits / Math.max(1, janus.playerHits + janus.scoresAgainst + janus.nearMisses * 0.4)), dt, 2.6);
  janus.flow = smooth(janus.flow, clamp(arena.match.rally / 10 + janus.orbCollections * 0.025), dt, 2.2);
  janus.echo = smooth(janus.echo, clamp(janus.pressure * 0.52 + janus.flow * 0.33 + janus.focus * 0.15), dt, 1.4);

  if (arena.match.rally !== janus.lastRally) janus.lastRally = arena.match.rally;
  if (janus.sampleTimer >= 3) {
    janus.sampleTimer = 0;
    janus.samples.push(snapshot(janus));
    if (janus.samples.length > 40) janus.samples.shift();
  }
  return output(janus);
}

export function summarizeJanusEngine(janus) {
  if (!janus?.enabled) return null;
  const samples = janus.samples.length ? janus.samples : [snapshot(janus)];
  const avg = key => rounded(samples.reduce((sum, item) => sum + item[key], 0) / samples.length);
  return {
    level: janus.level,
    stageName: janus.stageName,
    durationSeconds: Math.round(janus.elapsed),
    averagePressure: avg('pressure'),
    averageFlow: avg('flow'),
    averageEcho: avg('echo'),
    peakPressure: rounded(Math.max(...samples.map(item => item.pressure))),
    longestRally: janus.longestRally,
    playerHits: janus.playerHits,
    opponentHits: janus.opponentHits,
    wallHits: janus.wallHits,
    scoresFor: janus.scoresFor,
    scoresAgainst: janus.scoresAgainst,
    orbCollections: janus.orbCollections,
    warpMoments: janus.warpMoments,
    paddleTravel: Math.round(janus.paddleTravel),
    markers: [...janus.markers],
    samples: [...janus.samples],
  };
}

function output(janus) {
  return janus?.enabled ? {
    active: true,
    pressure: rounded(janus.pressure),
    focus: rounded(janus.focus),
    flow: rounded(janus.flow),
    echo: rounded(janus.echo),
  } : { active: false, pressure: 0, focus: 0, flow: 0, echo: 0 };
}

function snapshot(janus) {
  return {
    t: Math.round(janus.elapsed),
    pressure: rounded(janus.pressure),
    focus: rounded(janus.focus),
    flow: rounded(janus.flow),
    echo: rounded(janus.echo),
  };
}

function smooth(current, target, dt, seconds) {
  const amount = 1 - Math.exp(-dt / Math.max(0.001, seconds));
  return current + (target - current) * amount;
}

function mark(janus, type, data = {}) {
  janus.markers.push({ t: Math.round(janus.elapsed * 10) / 10, type, ...data });
  if (janus.markers.length > 24) janus.markers.shift();
}
