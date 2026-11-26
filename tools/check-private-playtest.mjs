import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.LP_PLAYWRIGHT_MODULE ||
  'C:/Users/Nana/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const game = [
  ['app/index.html', '<!doctype html><title>Private game</title><script type="module" src="../src/test.js"></script><h1>Authorized game</h1>'],
  ['src/test.js', 'document.body.dataset.loaded = "yes";'],
];
let offset = 0;
const index = {};
const contents = game.map(([name, data]) => {
  const bytes = Buffer.from(data);
  index[name] = [offset, bytes.length];
  offset += bytes.length;
  return bytes;
});
const encodedIndex = Buffer.from(JSON.stringify(index));
const size = Buffer.alloc(4);
size.writeUInt32BE(encodedIndex.length);
const bundle = Buffer.concat([size, encodedIndex, ...contents]);
let downloads = 0;
const server = createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname === '/storage/v1/object/authenticated/lp-private-playtest/game-v1.bin') {
    if (req.headers.authorization !== 'Bearer dev-fixture') return res.writeHead(403).end();
    downloads++;
    return res.writeHead(200).end(bundle);
  }
  if (pathname === '/supabase-config.js') {
    return res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(
      'window.LP_SUPABASE_CONFIG = {url: location.origin, publishableKey: "fixture"};');
  }
  if (pathname === '/site-auth.js') {
    return res.writeHead(200, { 'Content-Type': 'text/javascript' }).end(`
      const fixture = localStorage.getItem('access-fixture');
      let change;
      window.addEventListener('fixture-sign-out', () => {
        localStorage.removeItem('access-fixture');
        change();
      });
      window.LPAuth = {
        session: async () => localStorage.getItem('access-fixture') ? {access_token: fixture} : null,
        client: {
          rpc: async () => ({data: fixture === 'dev-fixture'}),
          auth: {onAuthStateChange: callback => { change = callback; }},
        },
      };`);
  }
  const publicPaths = ['/dev-playtest/', '/dev-playtest/playtest.css', '/dev-playtest/playtest.js', '/dev-playtest/game/access-worker.js'];
  if (!publicPaths.includes(pathname)) return res.writeHead(404).end();
  const file = pathname.endsWith('/') ? pathname + 'index.html' : pathname;
  const type = { '.html':'text/html', '.css':'text/css', '.js':'text/javascript' }[extname(file)];
  res.writeHead(200, { 'Content-Type': type }).end(await readFile(resolve('.' + file)));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome' });
  for (const fixture of [null, 'player-fixture', 'dev-fixture']) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.addInitScript(key => { if (key) localStorage.setItem('access-fixture', key); }, fixture);
    await page.goto(base + '/dev-playtest/');
    if (fixture === 'dev-fixture') {
      await page.frameLocator('#game').locator('body[data-loaded=yes]').waitFor();
      assert.ok(await page.locator('#game').isVisible());
      assert.equal(downloads, 1);
      const delivery = await page.locator('#game').evaluate(async frame => {
        const result = await frame.contentWindow.fetch('../src/test.js', { headers: { Range: 'bytes=0-7' } });
        return [result.status, await result.text(), result.headers.get('Cache-Control')];
      });
      assert.deepEqual(delivery, [206, 'document', 'private, no-store']);
      await page.evaluate(() => dispatchEvent(new Event('fixture-sign-out')));
      await page.getByText('Sign in through Player Passport').waitFor();
      assert.ok(!(await page.locator('#game').isVisible()));
    } else {
      await page.getByText(fixture ? 'developer account only' : 'Sign in through Player Passport').waitFor();
      assert.equal(downloads, 0);
    }
    const directUrl = base + '/dev-playtest/game/src/test.js';
    const directResponse = page.waitForResponse(directUrl);
    await page.goto(directUrl).catch(error => {
      if (!error.message.includes('ERR_HTTP_RESPONSE_CODE_FAILURE')) throw error;
    });
    const direct = await directResponse;
    assert.ok([401, 404].includes(direct.status()));
    await context.close();
  }
  console.log('Anonymous, ordinary Passport, developer launch, private range request, sign-out, and direct asset checks passed.');
} finally {
  await browser?.close();
  server.close();
}
