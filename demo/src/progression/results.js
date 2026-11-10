import { LEVELS } from './levels.js';import { grantUnique,repairRewards } from './save.js';import { repairAchievements } from './achievements.js';import { settlePx } from '../core/px.js';
export function applyMatchResult(save,{level,won,playerLivesRemaining,startingPlayerLives,ledger,rally=0,durationMs=0}){
  const perfect=won&&playerLivesRemaining===startingPlayerLives;const crown=won&&playerLivesRemaining>=3;const px=settlePx(ledger,{won,perfect});save.px+=px;
  if(won)grantUnique(save.clearedLevels,level);if(crown){grantUnique(save.crowns,level);const sig=LEVELS[level]?.signature;if(sig&&sig!=='inversion'){grantUnique(save.unlockedColors,sig);if(!save.orbMastery[sig])save.orbMastery[sig]=1}}if(perfect)grantUnique(save.perfects,level);
  if(level===11&&won){grantUnique(save.earnedCosmetics,'diamond-crown');save.freeColorSelect=true;if(playerLivesRemaining>=3)grantUnique(save.earnedCosmetics,'chaos-crown');if(perfect)grantUnique(save.earnedCosmetics,'glowing-chaos-crown')}
  save.stats.matches++;if(won)save.stats.wins++;save.stats.bestRally=Math.max(save.stats.bestRally,rally);save.stats.totalRallies+=rally;save.stats.orbsCollected+=ledger.orbEvents;save.stats.pxBanked+=px;
  const stage=save.stats.byStage[level]??={attempts:0,wins:0,losses:0,fastestCompletionMs:null,longestCompletionMs:null,longestRally:0};stage.attempts++;stage[won?'wins':'losses']++;stage.longestRally=Math.max(stage.longestRally,rally);if(durationMs>0){stage.fastestCompletionMs=stage.fastestCompletionMs==null?durationMs:Math.min(stage.fastestCompletionMs,durationMs);stage.longestCompletionMs=Math.max(stage.longestCompletionMs??0,durationMs)}
  repairRewards(save);repairAchievements(save);return{won,crown,perfect,px};
}
