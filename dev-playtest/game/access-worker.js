self.window = self;
importScripts('../../supabase-config.js');

const { url: projectUrl, publishableKey } = self.LP_SUPABASE_CONFIG;
const scope = new URL(self.registration.scope);
const launchers = [new URL('../', scope).href, new URL('../index.html', scope).href];
const bundleUrl = `${projectUrl}/storage/v1/object/authenticated/lp-private-playtest/game-v2.bin`;
const types = {
  html: 'text/html', js: 'text/javascript', css: 'text/css', json: 'application/json',
  png: 'image/png', webp: 'image/webp', jpg: 'image/jpeg', svg: 'image/svg+xml',
  mp3: 'audio/mpeg', ogg: 'audio/ogg', wav: 'audio/wav', woff2: 'font/woff2',
};
let currentBundle;

self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('message', event => {
  if (event.data === 'lp-private-lock' && launchers.includes(event.source?.url)) currentBundle = undefined;
});

async function requestToken() {
  const clients = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  const launcher = clients.find(client => launchers.includes(client.url));
  if (!launcher) return null;
  const channel = new MessageChannel();
  return new Promise(resolve => {
    const finish = token => {
      clearTimeout(timer);
      channel.port1.close();
      resolve(token);
    };
    const timer = setTimeout(() => finish(null), 3000);
    channel.port1.onmessage = event => finish(event.data);
    launcher.postMessage('lp-private-session', [channel.port2]);
  });
}

function deny(status) {
  return new Response(null, { status, headers: { 'Cache-Control': 'no-store' } });
}

async function loadBundle(token) {
  const response = await fetch(bundleUrl, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
    cache: 'no-store', redirect: 'error',
  });
  if (!response.ok) return { status: response.status };
  const data = await response.arrayBuffer();
  const indexLength = new DataView(data).getUint32(0);
  const start = 4 + indexLength;
  if (start > data.byteLength) throw new Error('Invalid playtest bundle index');
  const index = JSON.parse(new TextDecoder().decode(new Uint8Array(data, 4, indexLength)));
  return { index, start, data };
}

async function serve(request, path) {
  const token = await requestToken();
  if (!token) {
    currentBundle = undefined;
    return deny(401);
  }
  if (currentBundle?.token !== token) currentBundle = { token, result: loadBundle(token) };
  const pending = currentBundle;
  const bundle = await pending.result.catch(() => ({ status: 503 }));
  if (currentBundle !== pending) return deny(401);
  if (bundle.status) {
    currentBundle = undefined;
    return deny(bundle.status);
  }

  const name = decodeURIComponent(path);
  const record = Object.hasOwn(bundle.index, name) ? bundle.index[name] : null;
  if (!record) return deny(404);
  const [offset, length] = record;
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Type': types[name.split('.').at(-1).toLowerCase()] || 'application/octet-stream',
    'Accept-Ranges': 'bytes',
  });
  const body = new Uint8Array(bundle.data, bundle.start + offset, length);
  const range = request.headers.get('Range');
  if (!range) return new Response(body, { headers });

  const match = /^bytes=(\d*)-(\d*)$/.exec(range);
  const start = match?.[1] ? Number(match[1]) : Math.max(0, length - Number(match?.[2]));
  const end = match?.[1] && match[2] ? Math.min(length - 1, Number(match[2])) : length - 1;
  if (!match || (!match[1] && !match[2]) || start > end) {
    headers.set('Content-Range', `bytes */${length}`);
    return new Response(null, { status: 416, headers });
  }
  headers.set('Content-Range', `bytes ${start}-${end}/${length}`);
  return new Response(body.subarray(start, end + 1), { status: 206, headers });
}

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  const path = url.pathname.slice(scope.pathname.length);
  if (path === 'access-worker.js') return;
  event.respondWith(event.request.method === 'GET' ? serve(event.request, path).catch(() => deny(503)) : deny(405));
});
