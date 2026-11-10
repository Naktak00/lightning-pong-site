import { COLORS } from './save.js';import { FIXED_POOLS,LEVELS } from './levels.js';
export function buildColorPool({save,level,rng}) {
  const config=LEVELS[level];if(!config)throw new Error('Unknown level');
  if(level<=4)return [...FIXED_POOLS[level]];
  if(save.freeColorSelect){const chosen=(save.selectedColorsByLevel[level]??[]).filter(c=>save.unlockedColors.includes(c)&&COLORS.includes(c));return unique(chosen).slice(0,config.slots)}
  const eligible=unique([...save.unlockedColors,config.signature].filter(c=>COLORS.includes(c)));
  const result=[];
  if(save.prizedOrbPurchased&&eligible.includes(save.prizedOrb))result.push(save.prizedOrb);
  if(config.signature&&eligible.includes(config.signature)&&!result.includes(config.signature))result.push(config.signature);
  const remaining=eligible.filter(c=>!result.includes(c));shuffle(remaining,rng);
  result.push(...remaining.slice(0,Math.max(0,config.slots-result.length)));
  return result.slice(0,config.slots);
}
const unique=a=>[...new Set(a)];
function shuffle(a,rng){for(let i=a.length-1;i>0;i--){const j=Math.floor(rng.next()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}

