// The loading screen follows real module/image readiness. No minimum display timer.
const app = document.querySelector('#app');
const loading = document.querySelector('#loadingScreen');
const status = document.querySelector('#loadingStatus');
const progress = document.querySelector('#loadingProgress');
const retry = document.querySelector('#loadingRetry');
const assets = [
  './assets/arenas/arena-01-first-contact-court.png',
  './assets/arenas/arena-01-shadow-box-echo-chamber.png',
  './assets/arenas/arena-01-mirror-skyglass-sanctuary.png',
  './assets/arenas/arena-02-stratosphere-rail.png',
  './assets/arenas/arena-03-emerald-convergence.png',
  './assets/ui/circuit-base.png',
  './assets/ui/circuit-electrified.png',
  './assets/brand/xen-arcade-neon-constellation.png',
];
let complete = 0;
progress.max = assets.length + 1;
const advance = () => { progress.value = ++complete; };
const assetReady = url => new Promise((resolve,reject) => {
  const image = new Image();
  const deadline = setTimeout(() => reject(new Error('The arena is taking longer than expected to load.')),20000);
  image.onload = async () => {
    try { await image.decode(); clearTimeout(deadline); advance(); resolve(); }
    catch { clearTimeout(deadline); reject(new Error('An arena image could not be prepared.')); }
  };
  image.onerror = () => { clearTimeout(deadline); reject(new Error('An arena image could not be loaded.')); };
  image.src = new URL(url,import.meta.url).href;
});
retry.onclick = () => location.reload();
try {
  await Promise.all([
    import('./main.js?v=web-phone-1').then(advance),
    ...assets.map(assetReady),
  ]);
  status.textContent = 'Arena ready.';
  app.inert = false;
  app.setAttribute('aria-busy','false');
  loading.classList.add('hidden');
  document.body.classList.remove('is-loading');
  window.__LP_READY__ = true;
  window.dispatchEvent(new Event('lightning-demo-ready'));
} catch(error) {
  console.error('Lightning Pong loading failed',error);
  status.textContent = 'The arena could not finish loading. Check your connection and try again.';
  progress.classList.add('hidden');
  retry.classList.remove('hidden');
  loading.classList.add('load-failed');
  window.__LP_LOAD_FAILED__ = true;
}
