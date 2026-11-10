export const ACHIEVEMENTS = Object.freeze([
  ['first-spark','First Spark','Won a first battle.',s=>s.stats.wins>=1],
  ['hold-the-line','Hold the Line','Claimed a Crown from The Wall.',s=>s.crowns.includes(1)],
  ['pathfinder','Pathfinder','Cleared three different stages.',s=>s.clearedLevels.length>=3],
  ['live-wire','Live Wire','Sustained a 20-hit rally.',s=>s.stats.bestRally>=20],
  ['flawless-voltage','Flawless Voltage','Won a battle without losing a life.',s=>s.perfects.length>=1],
  ['through-the-fire','Through the Fire','Defeated The Furnace.',s=>s.clearedLevels.includes(5)],
  ['orb-weaver','Orb Weaver','Collected 25 orbs across completed matches.',s=>s.stats.orbsCollected>=25],
  ['beyond-the-veil','Beyond the Veil','Defeated The Phantom.',s=>s.clearedLevels.includes(8)],
  ['seasoned-hand','Seasoned Hand','Won ten battles.',s=>s.stats.wins>=10],
  ['sovereign-fall','Sovereign Fall','Defeated The Sovereign.',s=>s.clearedLevels.includes(11)],
  ['rocket-breaker','Rocket Breaker','Defeated The Rocket.',s=>s.clearedLevels.includes(2)],
  ['shepherds-crown',"Shepherd's Crown",'Claimed a Crown from The Shepherd.',s=>s.crowns.includes(3)],
  ['storm-rally','Storm Rally','Sustained a 15-hit rally.',s=>s.stats.bestRally>=15],
  ['truth-and-tricks','Truth and Tricks','Defeated The Trickster.',s=>s.clearedLevels.includes(4)],
  ['furnace-crown',"Furnace's Crown",'Claimed a Crown from The Furnace.',s=>s.crowns.includes(5)],
  ['five-victories','Five Victories','Won five battles.',s=>s.stats.wins>=5],
  ['cold-perfection','Cold Perfection','Perfected The Trapper.',s=>s.perfects.includes(6)],
  ['world-traveler','World Traveler','Defeated The Traveler.',s=>s.clearedLevels.includes(7)],
  ['ten-battles','Ten Battles','Completed ten battles.',s=>s.stats.matches>=10],
  ['nine-realms','Nine Realms','Cleared the first nine stages.',s=>[1,2,3,4,5,6,7,8,9].every(n=>s.clearedLevels.includes(n))],
  ['master-fall','Master Fall','Defeated The Master.',s=>s.clearedLevels.includes(10)],
  ['masters-crown',"Master's Crown",'Claimed a Crown from The Master.',s=>s.crowns.includes(10)],
  ['still-water','Still Water','Earned three Perfect victories.',s=>s.perfects.length>=3],
].map(([id,name,description,test])=>Object.freeze({id,name,description,test})));

export function achievementIsUnlocked(save,id){return Boolean(save.achievements?.[id])}

export function repairAchievements(save,now=Date.now()){
  save.achievements=save.achievements&&typeof save.achievements==='object'?save.achievements:{};
  for(const achievement of ACHIEVEMENTS)if(!save.achievements[achievement.id]&&achievement.test(save))save.achievements[achievement.id]=now;
}
