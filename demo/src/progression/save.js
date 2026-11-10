import { repairAchievements } from './achievements.js';
export const SAVE_VERSION = 6;
export const COLORS = Object.freeze(['red','orange','yellow','green','blue','indigo','purple']);

export function createNewSave() {
  return {
    version: SAVE_VERSION,
    px: 0,
    maximumLives: 3,
    clearedLevels: [],
    crowns: [],
    perfects: [],
    unlockedColors: [],
    orbMastery: {},
    activeOrbMastery: {},
    loreResonance: {},
    purchasedCosmetics: [],
    earnedCosmetics: [],
    equippedCosmetic: null,
    purchasedBackgrounds: ['default'],
    backgroundMode: 'single',
    selectedBackgrounds: ['default'],
    activeBackground: 'default',
    prizedOrbPurchased: false,
    prizedOrb: null,
    freeColorSelect: false,
    selectedColorsByLevel: {},
    achievements: {},
    level1Layers: { shadowDiscovered:false, shadowComplete:false, mirrorDiscovered:false, mirrorComplete:false, stagesSinceShadow:0 },
    janusHistory: { campaign:[], mirror:[] },
    stats: { matches:0, wins:0, bestRally:0, totalRallies:0, orbsCollected:0, pxBanked:0, byStage:{} },
    settings: { muted:false, volume:.62, reducedMotion:false, musicMode:'simple', rushMode:false },
    resetNoticeSeen: false,
  };
}

export function migrateSave(input) {
  const fresh = createNewSave();
  const previousVersion = Number(input?.version) || 0;
  const save = { ...fresh, ...(input && typeof input === 'object' ? input : {}) };
  save.settings = { ...fresh.settings, ...(save.settings ?? {}) };
  save.stats = { ...fresh.stats, ...(save.stats ?? {}) };
  for(const key of Object.keys(fresh.stats).filter(key=>key!=='byStage'))save.stats[key]=Math.max(0,Math.floor(Number(save.stats[key])||0));
  save.stats.byStage=repairStageStats(save.stats.byStage);
  if (previousVersion < 5) save.settings.musicMode = 'simple';
  if (save.settings.musicMode !== 'simple') save.settings.musicMode = 'simple';
  save.version = SAVE_VERSION;
  const volume=Number(save.settings.volume);
  save.settings.volume=Number.isFinite(volume)?Math.max(0,Math.min(1,volume)):.62;
  save.settings.rushMode=Boolean(save.settings.rushMode);
  save.loreResonance=Object.fromEntries(Object.entries(save.loreResonance??{}).map(([id,tier])=>[id,Math.max(0,Math.min(4,Math.floor(Number(tier)||0)))]));
  save.level1Layers={...fresh.level1Layers,...(save.level1Layers??{})};
  save.janusHistory={campaign:Array.isArray(save.janusHistory?.campaign)?save.janusHistory.campaign.slice(-24):[],mirror:Array.isArray(save.janusHistory?.mirror)?save.janusHistory.mirror.slice(-24):[]};
  save.px = Math.max(0, Math.floor(Number(save.px) || 0));
  save.maximumLives = Math.max(3, Math.min(5, Number(save.maximumLives) || 3));
  for (const key of ['clearedLevels','crowns','perfects']) save[key] = [...new Set((save[key] ?? []).map(Number).filter(n=>n>=1&&n<=11))];
  save.unlockedColors = [...new Set((save.unlockedColors ?? []).filter(c=>COLORS.includes(c)))];
  save.orbMastery = Object.fromEntries(Object.entries(save.orbMastery ?? {}).filter(([c])=>COLORS.includes(c)).map(([c,v])=>[c,Math.max(1,Math.min(5,Number(v)||1))]));
  save.activeOrbMastery = Object.fromEntries(COLORS.filter(c=>save.orbMastery[c]).map(c=>[c,Math.max(1,Math.min(save.orbMastery[c],Number(save.activeOrbMastery?.[c])||save.orbMastery[c]))]));
  save.purchasedBackgrounds=[...new Set(['default',...(save.purchasedBackgrounds??[])])];
  save.selectedBackgrounds=(save.selectedBackgrounds??['default']).filter(id=>save.purchasedBackgrounds.includes(id));
  if(!save.selectedBackgrounds.length)save.selectedBackgrounds=['default'];
  if(!['single','select','randomize'].includes(save.backgroundMode))save.backgroundMode='single';
  if(!save.purchasedBackgrounds.includes(save.activeBackground))save.activeBackground='default';
  if (!save.prizedOrbPurchased || !save.unlockedColors.includes(save.prizedOrb)) save.prizedOrb = null;
  save.freeColorSelect = save.clearedLevels.includes(11) || Boolean(save.freeColorSelect);
  repairRewards(save);
  repairAchievements(save);
  return save;
}

function repairStageStats(input){
  const result={};
  for(const [key,value] of Object.entries(input??{})){
    const stage=Number(key);if(stage<1||stage>11||!value||typeof value!=='object')continue;
    result[stage]={attempts:count(value.attempts),wins:count(value.wins),losses:count(value.losses),fastestCompletionMs:duration(value.fastestCompletionMs),longestCompletionMs:duration(value.longestCompletionMs),longestRally:count(value.longestRally)};
  }
  return result;
}
const count=value=>Math.max(0,Math.floor(Number(value)||0));
const duration=value=>value==null?null:Math.max(0,Math.floor(Number(value)||0));

export function repairRewards(save) {
  if ([1,2,3,4,5,6,7,8,9,10].every(n=>save.clearedLevels.includes(n))) grantUnique(save.earnedCosmetics,'silver-crown');
  if ([1,2,3,4,5,6,7,8,9,10].every(n=>save.crowns.includes(n))) grantUnique(save.earnedCosmetics,'gold-crown');
  if (save.clearedLevels.includes(11)) { grantUnique(save.earnedCosmetics,'diamond-crown'); save.freeColorSelect=true; }
}
export function grantUnique(array,value){if(!array.includes(value))array.push(value)}
