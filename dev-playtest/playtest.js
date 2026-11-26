(() => {
  const status = document.querySelector('#status');
  const game = document.querySelector('#game');
  const auth = window.LPAuth;
  const entry = new URL('game/app/index.html', location.href);
  let authorized = false;
  let refreshVersion = 0;

  async function refresh() {
    const version = ++refreshVersion;
    try {
      const session = await auth.session();
      const { data, error } = session
        ? await auth.client.rpc('can_access_lp_private_playtest')
        : { data: false };
      if (version !== refreshVersion) return;
      if (error) throw error;
      authorized = data === true;
      if (!authorized) {
        const registration = await navigator.serviceWorker.getRegistration(entry);
        if (version !== refreshVersion) return;
        registration?.active?.postMessage('lp-private-lock');
        game.hidden = true;
        game.removeAttribute('src');
        status.textContent = session
          ? 'This playtest is available to the developer account only.'
          : 'Sign in through Player Passport to open the playtest.';
        return;
      }
      if (game.hasAttribute('src')) return;

      status.textContent = 'Loading the private build…';
      const registration = await navigator.serviceWorker.register('game/access-worker.js?v=2');
      const ready = registration.active || await new Promise((resolve, reject) => {
        const worker = registration.installing || registration.waiting;
        if (!worker) return reject(new Error('Missing playtest worker'));
        const check = () => {
          if (worker.state === 'activated') resolve(worker);
          if (worker.state === 'redundant') reject(new Error('Playtest worker failed'));
        };
        worker.addEventListener('statechange', check);
        check();
      });
      if (version !== refreshVersion || !ready) return;
      game.src = entry.href;
    } catch {
      if (version !== refreshVersion) return;
      authorized = false;
      game.hidden = true;
      game.removeAttribute('src');
      status.textContent = 'The private build could not be opened. Return to Passport and try again.';
    }
  }

  game.addEventListener('load', () => {
    if (!authorized || !game.hasAttribute('src')) return;
    if (game.contentDocument?.URL === 'about:blank') return;
    if (game.contentDocument?.URL !== entry.href || !game.contentDocument.querySelector('title')) {
      game.removeAttribute('src');
      status.textContent = 'The developer build is unavailable. Try reopening the playtest.';
      return;
    }
    game.hidden = false;
    status.textContent = '';
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', async event => {
      if (event.data !== 'lp-private-session' || !event.ports[0]) return;
      const expected = new URL('game/access-worker.js?v=2', location.href);
      if (event.source?.scriptURL !== expected.href) return;
      try {
        const session = authorized ? await auth.session() : null;
        event.ports[0].postMessage(session && authorized ? session.access_token : null);
      } catch {
        event.ports[0].postMessage(null);
      }
    });
    auth.client?.auth.onAuthStateChange(() => setTimeout(refresh, 0));
    refresh();
  } else {
    status.textContent = 'Open this playtest in a browser with service worker support.';
  }
})();
