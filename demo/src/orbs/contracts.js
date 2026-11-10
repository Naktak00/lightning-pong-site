export const NORMAL_ORB_TYPES = Object.freeze(['red', 'orange', 'yellow', 'green', 'blue', 'indigo', 'purple']);

export function createOrbRuntime({ activeTypes = ['red', 'blue'], mastery = {}, stage = 1 } = {}) {
  return {
    activeTypes: [...activeTypes],
    stage,
    mastery: { red: 1, blue: 1, ...mastery },
    nextSpawnSeconds: 0,
    sequence: 0,
    activations: [],
  };
}

export function maximumActiveOrbs(stage) {
  if (stage >= 4) return 3;
  if (stage >= 2) return 2;
  return 1;
}

export function orbDescriptor(type) {
  if (type === 'red') return { type, name: 'Reflect', icon: '◆', color: '#ff3d64', shape: 'rock' };
  if (type === 'blue') return { type, name: 'Accelerate', icon: '➤', color: '#39b9ff', shape: 'rocket' };
  if (type === 'orange') return { type, name: 'Burn', icon: '🔥', color: '#ff8a2a', shape: 'flame' };
  if (type === 'yellow') return { type, name: 'Charge', icon: 'ϟ', color: '#ffe34f', shape: 'circle' };
  if (type === 'green') return { type, name: 'Magnet', icon: '∩', color: '#46df8b', shape: 'magnet' };
  if (type === 'indigo') return { type, name: 'Warp', icon: '◎', color: '#7057ff', shape: 'spiral' };
  if (type === 'purple') return { type, name: 'Shadow', icon: '◐', color: '#d36cff', shape: 'double' };
  if (type === 'inversion') return { type, name: 'Inversion', icon: '↔', color: '#eeeeee', shape: 'circle' };
  return { type, name: type, icon: '?', color: '#ffffff', shape: 'circle' };
}
