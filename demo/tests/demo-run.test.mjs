import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewSave } from '../src/progression/save.js';
import { beginDemoRun,startDemoAttempt,advanceDemoRun,spendDemoPx,finishDemoAttempt,emptyDemoRecords,updateDemoRecords,loadDemoRecords,storeDemoRecords,formatRunTime,DEMO_RECORDS_KEY } from '../src/progression/demo-run.js';
const date = new Date('2026-11-10T23:00:00Z');
test('website leaderboard v1 uses the stable shared browser storage key',()=>{
  assert.equal(DEMO_RECORDS_KEY,'lightning-pong-web-demo-records-v1');
  assert.deepEqual(Object.keys(loadDemoRecords(null)).sort(),['bestFastest','bestLowestPx','buildId','rulesetId','schemaVersion']);
});
function complete({time=3000,spend=0}={}) {
  const run=beginDemoRun(createNewSave(),date);spendDemoPx(run,spend);
  for(const n of [1,2,3]){startDemoAttempt(run,n);advanceDemoRun(run,time/3);var result=finishDemoAttempt(run,true,date);}
  return result;
}
test('run requires three ordered wins and retains failed/restarted active time',()=>{
  const run=beginDemoRun(createNewSave(),date);
  startDemoAttempt(run,1);advanceDemoRun(run,100);finishDemoAttempt(run,false,date);
  startDemoAttempt(run,1);advanceDemoRun(run,200);finishDemoAttempt(run,true,date);
  startDemoAttempt(run,2);advanceDemoRun(run,300);startDemoAttempt(run,2);advanceDemoRun(run,400);finishDemoAttempt(run,true,date);
  startDemoAttempt(run,3);advanceDemoRun(run,500);const result=finishDemoAttempt(run,true,date);
  assert.equal(result.activeTimeMs,1500);assert.equal(result.attempts,5);assert.deepEqual(result.stageTimeMs,{1:300,2:700,3:500});
  advanceDemoRun(run,999);assert.equal(run.activeTimeMs,1500);
});
test('out-of-order or alternate-layer play ends the scored run',()=>{
  for(const [level,layer] of [[2,'tutorial'],[1,'shadowbox']]){const run=beginDemoRun(createNewSave(),date);assert.equal(startDemoAttempt(run,level,layer),false);assert.equal(run.status,'ended');assert.equal(finishDemoAttempt(run,true,date),null);}
});
test('PX spending counts positive debits; earned PX and completed runs cannot reduce or add spending',()=>{
  const run=beginDemoRun(createNewSave(),date);spendDemoPx(run,30);spendDemoPx(run,-500);spendDemoPx(run,NaN);assert.equal(run.pxSpent,30);
  run.status='complete';spendDemoPx(run,20);assert.equal(run.pxSpent,30);
});
test('fastest and lowest PX records have independent ordering and tie breakers',()=>{
  let records=updateDemoRecords(emptyDemoRecords(),complete({time:5000,spend:50}));
  records=updateDemoRecords(records,complete({time:6000,spend:0}));
  assert.equal(records.bestFastest.activeTimeMs,5000);assert.equal(records.bestLowestPx.activeTimeMs,6000);
  records=updateDemoRecords(records,complete({time:4000,spend:0}));
  assert.equal(records.bestFastest.activeTimeMs,4000);assert.equal(records.bestLowestPx.activeTimeMs,4000);
});
test('only current build valid completed results are restored; bests contain loadout snapshots',()=>{
  const result=complete();const data=new Map();const storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
  assert.equal(storeDemoRecords(storage,updateDemoRecords(null,result)),true);
  assert.equal(loadDemoRecords(storage).bestFastest.verification,'local-practice');assert.equal(loadDemoRecords(storage).bestFastest.loadout.maximumLives,3);
  data.set(DEMO_RECORDS_KEY,JSON.stringify({bestFastest:{...result,buildId:'old-build'}}));assert.equal(loadDemoRecords(storage).bestFastest,null);
  data.set(DEMO_RECORDS_KEY,'bad-json');assert.equal(loadDemoRecords(storage).bestFastest,null);
  assert.equal(storeDemoRecords({setItem(){throw Error('denied')}},emptyDemoRecords()),false);
});
test('time formatter shows centiseconds without rounding up a second',()=>{
  assert.equal(formatRunTime(59999),'0:59.99');assert.equal(formatRunTime(60000),'1:00.00');
});
