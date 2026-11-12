// Local regression harness. Test controls are injected into a routed response only;
// the distributed game never exposes them.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { formatRunTime,DEMO_RECORDS_KEY } from '../src/progression/demo-run.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = resolve(root, 'demo/output/playwright');
await mkdir(evidence, { recursive: true });
const require = createRequire(import.meta.url);
const playwrightPath = process.env.LP_PLAYWRIGHT_MODULE || 'C:/Users/Nana/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright';
const { chromium } = require(playwrightPath);
const mime = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.mp3':'audio/mpeg', '.svg':'image/svg+xml' };
const server = createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let path = resolve(root, '.' + pathname);
  if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
  if (pathname.endsWith('/')) path = resolve(path, 'index.html');
  try { const body = await readFile(path); res.writeHead(200, { 'content-type':mime[extname(path)] || 'application/octet-stream', 'cache-control':'no-store' }).end(body); }
  catch { res.writeHead(404).end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const defaultExe = chromium.executablePath();
const systemChrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const browser = await chromium.launch({ headless: true, executablePath: process.env.LP_BROWSER_EXECUTABLE || (existsSync(defaultExe) ? defaultExe : systemChrome) });
const context = await browser.newContext({ viewport: { width:1280, height:900 }, reducedMotion:'reduce' });
const page = await context.newPage();
const errors = [], missing = [], writes = [], checks = [];
page.on('request', request => { if(!['GET','HEAD'].includes(request.method())) writes.push(`${request.method()} ${request.url()}`); });
page.on('pageerror', e => errors.push(e.message));
page.on('response', response => { if(response.status() >= 400 && !response.url().endsWith('favicon.ico')) missing.push(`${response.status()} ${response.url()}`); });
const hook = `\nwindow.__DEMO_TEST__ = {
  snapshot: () => ({ scene, level, battleMode, coopCountdownRemaining, paused, audioMenuOpen, resultApplied, elapsed:typeof battleElapsedMs==='undefined'?performance.now()-battleStartedAt:battleElapsedMs, phase:state?.match.phase, lives:state?.match.lives, ball:state?{...state.ball}:null, paddleY:state?.paddles.player1.y, paddle2Y:state?.paddles.player2.y, audioContext:audio.context?.state, audioMediaError:audio.verbosePlayer.error?.code??null, px:save.px, cleared:[...save.clearedLevels], matches:save.stats.matches, run:typeof demoRun==='undefined'?null:structuredClone(demoRun), records:typeof demoRecords==='undefined'?null:structuredClone(demoRecords), result:typeof lastDemoResult==='undefined'?null:structuredClone(lastDemoResult) }),
  goal: concededBy => { state.match.phase='playing'; state.ball.y=-200; state.ball.vy=0; state.ball.vx=concededBy==='player1'?-500:500; state.ball.x=concededBy==='player1'?-100:state.width+100; tick(TUNING.fixedStepSeconds); },
  advance: seconds => { for(let elapsed=0;elapsed<seconds;elapsed+=TUNING.fixedStepSeconds) tick(TUNING.fixedStepSeconds); },
  saveKey: SAVE_KEY,
};`;
await page.route('**/demo/app/main.js*', async route => {
  const source = await readFile(resolve(root, 'demo/app/main.js'), 'utf8');
  await route.fulfill({ contentType:'text/javascript', body:source + hook });
});
const record = (name, detail='passed') => { checks.push({name, detail}); console.log(`${name}: ${detail}`); };
try {
  const loadingPage=await context.newPage();
  let releaseAsset;const assetGate=new Promise(resolve=>releaseAsset=resolve);
  await loadingPage.route('**/assets/arenas/arena-01-first-contact-court.png',async route=>{await assetGate;await route.continue();});
  await loadingPage.goto(`${base}/demo/app/index.html`,{waitUntil:'commit'});
  await loadingPage.locator('#loadingScreen').waitFor({state:'visible'});
  assert.equal(await loadingPage.locator('#app').evaluate(el=>el.inert),true);
  assert.equal(await loadingPage.locator('.run-panel').count(),0);
  await loadingPage.screenshot({path:resolve(evidence,'phone-loading.png'),fullPage:true});
  releaseAsset();await loadingPage.waitForFunction(()=>window.__LP_READY__===true);
  assert.equal(await loadingPage.locator('#loadingScreen').isVisible(),false);
  assert.equal(await loadingPage.locator('#app').evaluate(el=>el.inert),false);
  record('Readiness loader gates input until required assets and modules finish');await loadingPage.close();
  const failedLoading=await context.newPage();
  await failedLoading.route('**/assets/arenas/arena-01-first-contact-court.png',route=>route.fulfill({status:404,body:'missing'}));
  await failedLoading.goto(`${base}/demo/`);await failedLoading.waitForFunction(()=>window.__LP_LOAD_FAILED__===true);
  assert.equal(await failedLoading.locator('#loadingRetry').isVisible(),true);assert.equal(await failedLoading.locator('#app').evaluate(el=>el.inert),true);
  record('Failed required asset leaves an accessible retry action');await failedLoading.close();
  await page.goto(`${base}/demo/`);
  await page.waitForFunction(() => window.__LP_READY__ && window.__DEMO_TEST__);
  assert.equal(await page.locator('.run-panel,.run-metrics,#bestRunTime,#bestRunPx').count(),0);
  assert.ok(await page.locator('.phone-device').evaluate(el=>parseFloat(getComputedStyle(el).borderRadius)>0));
  record('Desktop phone shell displays game actions without a personal-best dashboard');
  if(await page.locator('#dismissReset').isVisible()) await page.locator('#dismissReset').click();
  assert.equal(await page.locator('#levelGrid .level-card').count(),3);
  assert.equal(await page.locator('#levelGrid .level-card').nth(0).isEnabled(),true);
  assert.equal(await page.locator('#levelGrid .level-card').nth(1).isEnabled(),false);
  record('HTTP boot and three-stage gate');
  await page.screenshot({path:resolve(evidence,'baseline-level-select.png'), fullPage:true});
  await page.locator('#startCoop').click();
  await page.waitForFunction(() => window.__DEMO_TEST__.snapshot().scene==='battle');
  const coopStart=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());
  assert.equal(coopStart.battleMode,'coop');assert.equal(coopStart.run,null);assert.ok(coopStart.coopCountdownRemaining>4.5);
  await page.screenshot({path:resolve(evidence,'local-coop-countdown.png'),fullPage:true});
  await page.keyboard.down('w');await page.waitForTimeout(100);await page.keyboard.up('w');
  const countdownFrozen=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());assert.equal(countdownFrozen.paddleY,coopStart.paddleY);assert.equal(countdownFrozen.ball.x,coopStart.ball.x);
  await page.evaluate(()=>window.__DEMO_TEST__.advance(5.1));
  await page.keyboard.down('w');await page.waitForTimeout(100);await page.keyboard.up('w');
  const coopLeftUp=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());assert.ok(coopLeftUp.paddleY<coopStart.paddleY);
  await page.keyboard.down('s');await page.waitForTimeout(140);await page.keyboard.up('s');
  const coopLeftDown=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());assert.ok(coopLeftDown.paddleY>coopLeftUp.paddleY);
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(180);await page.keyboard.up('ArrowUp');
  const coopRightUp=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());assert.ok(coopRightUp.paddle2Y<coopLeftDown.paddle2Y);
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(140);await page.keyboard.up('ArrowDown');
  const coopRightDown=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());assert.ok(coopRightDown.paddle2Y>coopRightUp.paddle2Y);
  const fixedBattleViewport=await page.locator('#phoneScreen').evaluate(el=>({overflow:getComputedStyle(el).overflowY,scrollHeight:el.scrollHeight,clientHeight:el.clientHeight}));
  assert.equal(fixedBattleViewport.overflow,'hidden');assert.ok(fixedBattleViewport.scrollHeight<=fixedBattleViewport.clientHeight+1,JSON.stringify(fixedBattleViewport));
  assert.equal(coopRightDown.records.bestFastest,null);assert.equal(coopRightDown.records.bestLowestPx,null);
  await page.screenshot({path:resolve(evidence,'local-coop-landscape.png'),fullPage:true});
  for(let n=0;n<3;n++)await page.evaluate(()=>window.__DEMO_TEST__.goal('player2'));
  const coopFinished=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());assert.equal(coopFinished.resultApplied,true);assert.equal(coopFinished.records.bestFastest,null);assert.equal(coopFinished.records.bestLowestPx,null);
  assert.match(await page.locator('#battleOverlay strong').textContent(),/PLAYER 1 WINS/);assert.equal(await page.locator('#coopActions').isVisible(),true);
  record('Local co-op uses a frozen five-second countdown and W/S plus Up/Down controls without creating ranked records');
  await page.locator('#leaveCoop').click();
  await page.locator('#levelGrid .level-card').nth(0).click();
  await page.locator('#startBriefingBattle').click();
  await page.waitForFunction(() => window.__DEMO_TEST__.snapshot().scene==='battle');
  await page.waitForTimeout(250);
  record('Level select → briefing → battle');
  const beforeMove=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());
  await page.keyboard.down('ArrowUp');await page.waitForTimeout(180);await page.keyboard.up('ArrowUp');
  const afterMove=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());
  assert.ok(afterMove.paddleY<beforeMove.paddleY);record('Keyboard input moves player paddle');
  assert.equal(afterMove.audioContext,'running');assert.equal(afterMove.audioMediaError,null);record('User gesture unlocks audio without media errors');
  await page.locator('#pauseBattle').click();
  const paused = await page.evaluate(() => window.__DEMO_TEST__.snapshot());
  await page.waitForTimeout(180);
  const still = await page.evaluate(() => window.__DEMO_TEST__.snapshot());
  assert.equal(still.paused,true); assert.equal(still.ball.x,paused.ball.x); assert.equal(still.ball.y,paused.ball.y);
  record('Pause freezes physics');
  const pauseTimeDelta = still.elapsed-paused.elapsed;
  record('Pause time delta',Math.round(pauseTimeDelta));
  assert.equal(pauseTimeDelta,0,'Paused time must not count toward clear time');
  await page.locator('#audioToggle').click();
  await page.locator('#audioToggle').click();
  await page.waitForTimeout(1100);
  const afterAudio = await page.evaluate(() => window.__DEMO_TEST__.snapshot());
  record('Paused before audio menu remains paused',afterAudio.paused);
  assert.equal(afterAudio.paused,true,'Audio menu must preserve a manual pause');
  await page.locator('#restartBattle').click({force:true});
  assert.equal((await page.evaluate(() => window.__DEMO_TEST__.snapshot())).resultApplied,false);
  record('Restart creates fresh match');
  for(let n=0;n<3;n++) await page.evaluate(() => window.__DEMO_TEST__.goal('player1'));
  assert.equal((await page.evaluate(() => window.__DEMO_TEST__.snapshot())).resultApplied,true);
  assert.equal(await page.locator('#battleOverlay strong').innerText(),'DEFEAT');
  await page.locator('#continueButton').click();
  await page.locator('#levelGrid .level-card').nth(0).click(); await page.locator('#startBriefingBattle').click();
  record('Synthetic loss → retry');
  for(let levelIndex=0;levelIndex<3;levelIndex++) {
    for(let n=0;n<3;n++) await page.evaluate(() => window.__DEMO_TEST__.goal('player2'));
    const snap=await page.evaluate(() => window.__DEMO_TEST__.snapshot());
    assert.equal(snap.cleared.includes(levelIndex+1),true);
    if(levelIndex<2){await page.locator('#continueButton').click();await page.locator('#levelGrid .level-card').nth(levelIndex+1).click();await page.locator('#startBriefingBattle').click();}
  }
  assert.equal((await page.evaluate(() => window.__DEMO_TEST__.snapshot())).scene,'archiveCredits');
  record('Synthetic goal path unlocks 1 → 2 → 3 → credits');
  await page.screenshot({path:resolve(evidence,'baseline-victory.png'),fullPage:true});
  if(await page.locator('#creditsPause').isVisible()){
    await page.locator('#creditsPause').click();assert.equal(await page.locator('#creditsPause').getAttribute('aria-pressed'),'true');
  }else{
    assert.equal(await page.locator('#creditsRoll').evaluate(el=>getComputedStyle(el).animationName),'none');
    record('Reduced-motion credits use a stationary readable roll');
  }
  await page.locator('#creditsLevels').click(); await page.reload();await page.waitForFunction(()=>window.__LP_READY__&&window.__DEMO_TEST__);
  assert.deepEqual((await page.evaluate(() => window.__DEMO_TEST__.snapshot())).cleared,[1,2,3]);
  record('Progress survives reload; credits controls work');
  await page.locator('#startRun').click();await page.locator('#startBriefingBattle').click();await page.reload();await page.waitForFunction(()=>window.__LP_READY__&&window.__DEMO_TEST__);
  assert.equal(await page.evaluate(()=>window.__DEMO_TEST__.snapshot().run),null);record('Reload ends an unfinished scored run');
  await page.locator('#startRun').click();await page.locator('#startBriefingBattle').click();
  assert.equal((await page.evaluate(()=>window.__DEMO_TEST__.snapshot())).run.nextLevel,1);
  await page.waitForTimeout(100);await page.locator('#pauseBattle').click();
  const scoredPaused=await page.evaluate(()=>window.__DEMO_TEST__.snapshot().run.activeTimeMs);
  await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>window.__DEMO_TEST__.snapshot().run.activeTimeMs),scoredPaused);
  await page.locator('#resumeBattle').click();
  for(let n=0;n<3;n++)await page.evaluate(()=>window.__DEMO_TEST__.goal('player2'));
  await page.locator('#continueButton').click();
  await page.locator('[data-scene="shop"]').click();await page.locator('[data-shop="backgrounds"]').click();
  await page.locator('.background-card').filter({hasText:'Neon Grid'}).getByRole('button',{name:'300 PX',exact:true}).click();
  assert.equal(await page.evaluate(()=>window.__DEMO_TEST__.snapshot().run.pxSpent),300);
  record('Scored run counts a real successful shop debit');
  await page.locator('nav [data-scene="levels"]').click();
  for(const stage of [2,3]){
    await page.locator('#continueRun').click();await page.locator('#startBriefingBattle').click();
    await page.waitForTimeout(60);
    for(let n=0;n<3;n++)await page.evaluate(()=>window.__DEMO_TEST__.goal('player2'));
    if(stage===2)await page.locator('#continueButton').click();
  }
  const scored=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());
  assert.equal(scored.scene,'demoResults');assert.equal(scored.result.pxSpent,300);assert.equal(scored.result.attempts,3);assert.ok(scored.result.activeTimeMs>0);
  assert.equal(await page.locator('#resultRunPx').innerText(),'300 PX');
  await page.screenshot({path:resolve(evidence,'scored-run-results.png'),fullPage:true});
  record('Explicit three-stage run shows completion results and captured loadout');
  await page.locator('#resultLevels').click();await page.reload();await page.waitForFunction(()=>window.__LP_READY__&&window.__DEMO_TEST__);
  const persistedRecord=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());
  assert.equal(persistedRecord.run,null);assert.equal(persistedRecord.records.bestFastest.pxSpent,300);assert.equal(persistedRecord.records.bestLowestPx.pxSpent,300);
  record('Only completed personal bests restore after reload');
  await page.locator('#startRun').click();await page.locator('#startBriefingBattle').click();await page.waitForTimeout(60);
  for(const stage of [1,2,3]){
    for(let n=0;n<3;n++)await page.evaluate(()=>window.__DEMO_TEST__.goal('player2'));
    if(stage<3){await page.locator('#continueButton').click();await page.locator('#continueRun').click();await page.locator('#startBriefingBattle').click();}
  }
  const zeroRun=await page.evaluate(()=>window.__DEMO_TEST__.snapshot());assert.equal(zeroRun.records.bestLowestPx.pxSpent,0);
  record('A zero-spend clear replaces the local lowest-PX record');
  const leaderboard=await context.newPage();
  leaderboard.on('pageerror',e=>errors.push(e.message));
  leaderboard.on('request',request=>{if(!['GET','HEAD'].includes(request.method()))writes.push(`${request.method()} ${request.url()}`)});
  await leaderboard.goto(`${base}/leaderboard.html`);
  await leaderboard.waitForFunction(()=>document.querySelector('#lowestPx')?.textContent==='0 PX');
  assert.equal(await leaderboard.locator('#fastestTime').innerText(),formatRunTime(zeroRun.records.bestFastest.activeTimeMs));
  assert.equal(await leaderboard.locator('#lowestPx').innerText(),'0 PX');
  const sharedRecord=await leaderboard.evaluate(key=>JSON.parse(localStorage.getItem(key)),DEMO_RECORDS_KEY);
  assert.equal(sharedRecord.schemaVersion,1);assert.equal(sharedRecord.bestLowestPx.verification,'local-practice');
  await leaderboard.screenshot({path:resolve(evidence,'website-local-leaderboard.png'),fullPage:true});
  record('Game-created local best renders on the website Local Leaderboard');await leaderboard.close();
  await page.locator('#resultCredits').click();assert.equal(await page.locator('#archiveCredits').isVisible(),true);
  await page.locator('#creditsLevels').click();
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
  assert.equal(await page.locator('.phone-device').evaluate(el=>getComputedStyle(el).borderRadius),'0px');
  assert.equal(await page.locator('.phone-top').isVisible(),false);
  record('Small mobile viewport removes the decorative phone frame');
  await page.screenshot({path:resolve(evidence,'mobile-level-select.png'),fullPage:true});
  await page.locator('#levelGrid .level-card').nth(0).click();await page.locator('#startBriefingBattle').click();
  const touchBefore=await page.evaluate(()=>window.__DEMO_TEST__.snapshot().paddleY);
  const upBox=await page.locator('#up').boundingBox();
  await page.mouse.move(upBox.x+upBox.width/2,upBox.y+upBox.height/2);await page.mouse.down();await page.waitForTimeout(100);await page.mouse.up();
  assert.ok((await page.evaluate(()=>window.__DEMO_TEST__.snapshot().paddleY))<touchBefore);
  record('On-screen movement button moves player paddle');
  record('Narrow viewport has no horizontal overflow');
  await page.screenshot({path:resolve(evidence,'mobile-battle.png'),fullPage:true});
  await page.locator('#pauseBattle').click();await page.locator('#leaveBattle').click({force:true});
  await page.getByRole('link',{name:'Back to Lightning Pong',exact:false}).click();
  assert.equal(page.url(),`${base}/index.html`);record('Accessible return link reaches the Lightning Pong homepage');
  const denied=await context.newPage();
  const deniedErrors=[];denied.on('pageerror',e=>deniedErrors.push(e.message));
  await denied.addInitScript(()=>Object.defineProperty(window,'localStorage',{get(){throw new DOMException('Storage unavailable','SecurityError')}}));
  await denied.goto(`${base}/demo/`);await denied.waitForFunction(()=>window.__LP_READY__);
  assert.equal(await denied.locator('#levelGrid .level-card').count(),3);assert.deepEqual(deniedErrors,[]);
  record('Storage-denied browser still boots into guest play');await denied.close();
  assert.deepEqual(errors,[]); assert.deepEqual(missing,[]);assert.deepEqual(writes,[]);
  record('Runtime errors and missing assets','0');
  record('Network writes or score uploads','0');
} catch(error) {
  console.error(error);
  console.error(await page.evaluate(()=>({width:innerWidth,media:matchMedia('(max-width:760px)').matches,overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).slice(0,12).map(el=>({tag:el.tagName,id:el.id,className:el.className,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width}))})));
  await page.screenshot({path:resolve(evidence,'failure.png'),fullPage:true});
  checks.push({name:'FAIL',detail:error.message}); process.exitCode=1;
} finally {
  await writeFile(resolve(evidence,'browser-results.json'),JSON.stringify({checks,errors,missing,writes},null,2));
  await browser.close(); await new Promise(r=>server.close(r));
}
