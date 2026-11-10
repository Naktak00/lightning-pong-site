import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewSave,migrateSave } from '../src/progression/save.js';
import { applyMatchResult } from '../src/progression/results.js';
import { createPxLedger,awardPx } from '../src/core/px.js';
import { loadSave,storeSave,clearSave } from '../app/persistence.js';

function memoryStorage(){const data=new Map();return{getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key),data}}
test('three-stage win progression grants each clear and preserves rewards',()=>{
  const save=createNewSave();
  for(const level of [1,2,3]){
    const ledger=createPxLedger();for(let i=0;i<3;i++)awardPx(ledger,'opponentLife');
    const result=applyMatchResult(save,{level,won:true,playerLivesRemaining:3,startingPlayerLives:3,ledger,durationMs:5000+level});
    assert.equal(result.won,true);assert.equal(save.clearedLevels.includes(level),true);
  }
  assert.deepEqual(save.clearedLevels,[1,2,3]);assert.equal(save.stats.wins,3);assert.ok(save.px>0);
  assert.deepEqual(migrateSave(save).clearedLevels,[1,2,3]);
});
test('a defeat grants no clear or crown',()=>{
  const save=createNewSave();applyMatchResult(save,{level:1,won:false,playerLivesRemaining:0,startingPlayerLives:3,ledger:createPxLedger(),durationMs:4000});
  assert.deepEqual(save.clearedLevels,[]);assert.deepEqual(save.crowns,[]);assert.equal(save.stats.wins,0);assert.equal(save.stats.byStage[1].losses,1);
});
test('reload can recover the previous complete save from corrupt primary data',()=>{
  const storage=memoryStorage(),save=createNewSave();save.px=350;storeSave(storage,'test',save);save.px=500;storeSave(storage,'test',save);storage.setItem('test','broken');
  assert.equal(loadSave(storage,'test',createNewSave,migrateSave).px,350);clearSave(storage,'test');assert.equal(storage.data.size,0);
});
