const openAlphaUrl = file => `./audio/open-alpha/${file}`;

export const OPEN_ALPHA_AUDIO_VERSION = '0.2.0';

export const OPEN_ALPHA_AUDIO_PLAN = Object.freeze({
  1: Object.freeze({
    level: 1,
    name: 'The Wall',
    structure: 'tutorial-shadowbox-mirror',
    defaultMode: 'falx',
    stages: Object.freeze([
      Object.freeze({
        id: 'tutorial',
        label: 'Tutorial',
        mode: 'falx',
        file: 'level-01-falx-scarheart-convergence.wav',
        url: openAlphaUrl('level-01-falx-scarheart-convergence.wav'),
      }),
      Object.freeze({
        id: 'shadowbox',
        label: 'Shadow Box',
        mode: 'falx',
        file: 'level-01-falx-beautiful-risk-no-vocals.wav',
        url: openAlphaUrl('level-01-falx-beautiful-risk-no-vocals.wav'),
      }),
      Object.freeze({
        id: 'mirror-arena',
        label: 'Mirror Arena',
        mode: 'true',
        file: 'level-01-true-beautiful-risk.wav',
        url: openAlphaUrl('level-01-true-beautiful-risk.wav'),
      }),
    ]),
  }),
  2: Object.freeze({
    level: 2,
    name: 'The Rocket',
    defaultMode: 'falx',
    tracks: Object.freeze([
      Object.freeze({ id: 'falx-a', mode: 'falx', file: 'level-02-falx-a-redline.wav', url: openAlphaUrl('level-02-falx-a-redline.wav') }),
      Object.freeze({ id: 'falx-b', mode: 'falx', file: 'level-02-falx-b-redline.wav', url: openAlphaUrl('level-02-falx-b-redline.wav') }),
    ]),
  }),
  3: Object.freeze({
    level: 3,
    name: 'The Shepherd',
    defaultMode: 'falx',
    tracks: Object.freeze([
      Object.freeze({ id: 'falx-a', mode: 'falx', file: 'level-03-falx-three-note-takeoff.wav', url: openAlphaUrl('level-03-falx-three-note-takeoff.wav') }),
    ]),
  }),
  4: Object.freeze({
    level: 4,
    name: 'The Trickster',
    defaultMode: 'falx',
    tracks: Object.freeze([
      Object.freeze({ id: 'falx-b', mode: 'falx', file: 'level-04-falx-b-carnival-fakeout.wav', url: openAlphaUrl('level-04-falx-b-carnival-fakeout.wav') }),
    ]),
  }),
  5: Object.freeze({
    level: 5,
    name: 'The Furnace',
    defaultMode: 'falx',
    tracks: Object.freeze([
      Object.freeze({ id: 'falx-a', mode: 'falx', file: 'level-05-falx-furnace-rush.wav', url: openAlphaUrl('level-05-falx-furnace-rush.wav') }),
    ]),
  }),
  6: Object.freeze({
    level: 6,
    name: 'The Trapper',
    defaultMode: 'falx',
    tracks: Object.freeze([
      Object.freeze({ id: 'falx-x1', mode: 'falx', file: 'level-06-falx-trap-count-sprint.wav', url: openAlphaUrl('level-06-falx-trap-count-sprint.wav') }),
    ]),
  }),
  7: Object.freeze({
    level: 7,
    name: 'The Traveler',
    defaultMode: 'falx',
    unlocksAfterFirstClear: Object.freeze(['boss-falx', 'hard-true']),
    tracks: Object.freeze([
      Object.freeze({ id: 'falx-a', mode: 'falx', file: 'level-07-falx-a-warp-lane-runner.wav', url: openAlphaUrl('level-07-falx-a-warp-lane-runner.wav') }),
      Object.freeze({ id: 'falx-b', mode: 'falx', file: 'level-07-falx-b-warp-lane-runner.wav', url: openAlphaUrl('level-07-falx-b-warp-lane-runner.wav') }),
      Object.freeze({ id: 'true-a', mode: 'true', file: 'level-07-true-a-far-from-home-fast.wav', url: openAlphaUrl('level-07-true-a-far-from-home-fast.wav') }),
      Object.freeze({ id: 'true-b', mode: 'true', file: 'level-07-true-b-far-from-home-fast.wav', url: openAlphaUrl('level-07-true-b-far-from-home-fast.wav') }),
    ]),
  }),
  8: Object.freeze({
    level: 8,
    name: 'The Phantom',
    defaultMode: 'falx',
    tracks: Object.freeze([
      Object.freeze({ id: 'falx-b', mode: 'falx', file: 'level-08-falx-ghost-step-recover.wav', url: openAlphaUrl('level-08-falx-ghost-step-recover.wav') }),
    ]),
  }),
  9: Object.freeze({
    level: 9,
    name: 'The Duelist',
    defaultMode: 'true',
    role: 'open-alpha-final-boss',
    tracks: Object.freeze([
      Object.freeze({ id: 'true-a', mode: 'true', file: 'level-09-true-prove-i-spark.wav', url: openAlphaUrl('level-09-true-prove-i-spark.wav') }),
    ]),
  }),
  10: Object.freeze({
    level: 10,
    name: 'The Master',
    defaultMode: 'true',
    tracks: Object.freeze([
      Object.freeze({ id: 'true-a', mode: 'true', file: 'level-01-falx-scarheart-convergence.wav', url: openAlphaUrl('level-01-falx-scarheart-convergence.wav') }),
    ]),
  }),
  11: Object.freeze({
    level: 11,
    name: 'The Sovereign',
    defaultMode: 'true',
    role: 'closed-alpha-final-boss',
    tracks: Object.freeze([
      Object.freeze({ id: 'true-a', mode: 'true', file: 'level-11-true-golden-scar.wav', url: openAlphaUrl('level-11-true-golden-scar.wav') }),
    ]),
  }),
});

export function audioPlanForLevel(level) {
  return OPEN_ALPHA_AUDIO_PLAN[level] ?? null;
}

export function defaultTrackForLevel(level, rng = Math.random, stageId = null) {
  const plan = audioPlanForLevel(level);
  if (!plan) return null;
  if (plan.stages?.length) return plan.stages.find(stage => stage.id === stageId) ?? plan.stages[0];
  const tracks = plan.tracks?.filter(track => track.mode === plan.defaultMode) ?? [];
  if (!tracks.length) return null;
  return tracks[Math.floor(rng() * tracks.length)];
}
