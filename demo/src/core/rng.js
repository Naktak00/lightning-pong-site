export function createRng(seed = 0x51f15e) {
  let state = seed >>> 0;
  return {
    next() {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    get state() { return state; },
  };
}

