(function () {
  const FALLBACK_START = Date.parse('2026-11-14T15:00:00-05:00');
  const FALLBACK_END = Date.parse('2026-11-22T12:00:00-05:00');
  const slug = window.LPAuth?.config?.campaignSlug || 'flash-2026';
  let start = FALLBACK_START;
  let end = FALLBACK_END;

  const byId = id => document.getElementById(id);
  const state = byId('campaignState');
  const title = byId('launchTitle');
  const countdown = byId('campaignCountdown');
  const action = byId('campaignAction');

  function parts(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    return { days: Math.floor(total / 86400), hours: Math.floor(total % 86400 / 3600), minutes: Math.floor(total % 3600 / 60), seconds: total % 60 };
  }

  function renderClock() {
    const now = Date.now();
    const before = now < start;
    const active = now >= start && now < end;
    const remaining = parts((before ? start : end) - now);
    state.textContent = before ? 'PRE-LAUNCH' : active ? 'CAMPAIGN LIVE' : 'CAMPAIGN CLOSED';
    state.className = `campaign-state ${active ? 'live' : before ? '' : 'closed'}`;
    title.textContent = before ? 'The arena opens in' : active ? 'The arena closes in' : 'The flash has settled';
    countdown.innerHTML = before || active
      ? `<strong>${String(remaining.days).padStart(2,'0')}:${String(remaining.hours).padStart(2,'0')}:${String(remaining.minutes).padStart(2,'0')}:${String(remaining.seconds).padStart(2,'0')}</strong><span>days · hours · minutes · seconds</span>`
      : '<strong>00:00:00:00</strong><span>final verification in progress</span>';
    action.textContent = before ? 'ARENA LOCKED' : active ? 'ENTER THE FLASH RUN' : 'VIEW MY PASSPORT';
    action.href = active ? 'account.html?campaign=flash-2026&return=demo%2F%3Fcampaign%3Dflash-2026' : 'account.html?campaign=flash-2026';
    action.classList.toggle('disabled', before);
    action.setAttribute('aria-disabled', String(before));
  }

  async function hydrate() {
    const client = window.LPAuth?.client;
    if (!client) { byId('campaignClockNote').textContent = 'Public countdown loaded. Server connection is awaiting final launch configuration.'; return; }
    const { data: campaigns } = await client.from('campaigns').select('campaign_id,starts_at,ends_at').eq('slug', slug).limit(1);
    if (campaigns?.[0]) { start = Date.parse(campaigns[0].starts_at); end = Date.parse(campaigns[0].ends_at); }
    const { data: prizes } = await client.from('campaign_prizes').select('prize_key,status,winner_handle,claimed_at,campaigns!inner(slug)').eq('campaigns.slug', slug).order('display_order');
    for (const prize of prizes || []) {
      const card = document.querySelector(`[data-prize="${CSS.escape(prize.prize_key)}"]`);
      if (!card) continue;
      card.dataset.status = prize.status;
      card.querySelector('b').textContent = prize.status === 'claimed' ? `CLAIMED · ${prize.winner_handle}` : prize.status.toUpperCase();
    }
    byId('campaignClockNote').textContent = 'Launch eligibility is controlled by the Lightning Pong server clock.';
  }

  action.addEventListener('click', event => { if (Date.now() < start) event.preventDefault(); });
  renderClock(); setInterval(renderClock, 1000); hydrate().catch(() => {});
})();
