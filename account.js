(() => {
  const $ = selector => document.querySelector(selector);
  const auth = window.LPAuth;
  const SAVE_KEY = 'lightning-pong-web-demo-save-v1';
  const RECORDS_KEY = 'lightning-pong-web-demo-records-v1';
  const setNotice = (text, bad = false) => { $('#authNotice').textContent = text; $('#authNotice').classList.toggle('error', bad); };
  const show = (selector, on = true) => $(selector)?.classList.toggle('hidden', !on);
  const whole = value => Math.max(0, Math.floor(Number(value) || 0));
  const formatTime = ms => { if (!Number.isFinite(Number(ms)) || Number(ms) <= 0) return '—'; const cs = Math.floor(Number(ms) / 10); return `${Math.floor(cs / 6000)}:${String(Math.floor(cs / 100) % 60).padStart(2, '0')}.${String(cs % 100).padStart(2, '0')}`; };

  function readLocalPlayerData() {
    try {
      const save = JSON.parse(localStorage.getItem(SAVE_KEY) || localStorage.getItem(`${SAVE_KEY}:backup`) || 'null') || {};
      const records = JSON.parse(localStorage.getItem(RECORDS_KEY) || 'null') || {};
      return { save, records };
    } catch { return { save: {}, records: {} }; }
  }
  function renderPersonalScores() {
    const { save, records } = readLocalPlayerData(); const stats = save.stats || {}; const fastest = records.bestFastest; const lowest = records.bestLowestPx;
    const hasPlay = whole(stats.matches) > 0 || whole(stats.wins) > 0 || whole(save.px) > 0 || fastest || lowest;
    if (!hasPlay) { $('#passportActivity').innerHTML = '<p>No play recorded on this browser yet. Your first match will appear here automatically.</p>'; return; }
    $('#passportActivity').innerHTML = `<div class="score-row score-head"><span>RECORD</span><span>YOUR RESULT</span></div><div class="score-row"><span>Matches played</span><strong>${whole(stats.matches)}</strong></div><div class="score-row"><span>Battle wins</span><strong>${whole(stats.wins)}</strong></div><div class="score-row"><span>Best rally</span><strong>${whole(stats.bestRally)}</strong></div><div class="score-row"><span>PX banked</span><strong>${whole(stats.pxBanked || save.px)} PX</strong></div><div class="score-row"><span>Fastest 3-level clear</span><strong>${formatTime(fastest?.activeTimeMs)}</strong></div><div class="score-row"><span>Lowest-PX clear</span><strong>${lowest ? `${whole(lowest.pxSpent)} PX` : '—'}</strong></div>`;
  }
  function updateConsentCopy() {
    const minor = $('#ageStatus').value === 'minor_13_plus';
    $('#campaignConsentText').textContent = minor ? 'I confirm that I am at least 13, have permission from my parent or legal guardian, and accept the Flash Campaign rules.' : 'I confirm that I am 18 or older and accept the Flash Campaign rules.';
    $('#campaignConsent').checked = false;
  }
  async function campaignMembership(user) {
    const { data: campaign, error: campaignError } = await auth.client.from('campaigns').select('campaign_id').eq('slug', 'flash-2026').maybeSingle();
    if (campaignError || !campaign) return false;
    const { data, error } = await auth.client.from('campaign_participants').select('accepted_at').eq('campaign_id', campaign.campaign_id).eq('user_id', user.id).maybeSingle();
    return !error && Boolean(data);
  }
  async function refresh() {
    if (!auth?.client) { setNotice('Passport sign-in is being connected. The campaign page and local demo remain available.', true); $('#magicLinkForm button').disabled = true; return; }
    const { data: { session } } = await auth.client.auth.getSession(); const user = session?.user;
    show('#signInPanel', !user); for (const id of ['#passportPanel', '#campaignPanel', '#promoPanel', '#activityPanel']) show(id, Boolean(user));
    if (!user) { setNotice('Sign in to enter verified prize runs or submit a promotional short.'); return; }
    setNotice('Passport online. Your private campaign tools are ready.'); $('#passportEmail').textContent = user.email || '';
    const { data: profile } = await auth.client.from('profiles').select('display_name,account_role').eq('user_id', user.id).maybeSingle();
    $('#passportName').textContent = profile?.display_name || auth.displayName(user); $('#passportRole').textContent = profile?.account_role || 'player'; show('#reviewLink', ['developer', 'reviewer'].includes(profile?.account_role));
    const joined = await campaignMembership(user); show('#joinCampaignForm', !joined); show('#campaignAccepted', joined); renderPersonalScores();
  }
  $('#magicLinkForm').onsubmit = async event => { event.preventDefault(); const email = $('#emailInput').value.trim(); const { error } = await auth.client.auth.signInWithOtp({ email, options: { emailRedirectTo: new URL('auth-callback.html', location.href).href } }); setNotice(error ? error.message : 'Check your email for your one-time Passport link.', Boolean(error)); };
  const oauth = provider => auth.client.auth.signInWithOAuth({ provider, options: { redirectTo: new URL('auth-callback.html', location.href).href } });
  $('#googleSignIn').onclick = async () => { const { error } = await oauth('google'); if (error) setNotice(error.message, true); };
  $('#discordSignIn').onclick = async () => { const { error } = await oauth('discord'); if (error) setNotice(error.message, true); };
  $('#signOut').onclick = async () => { await auth.client.auth.signOut(); location.reload(); };
  $('#ageStatus').onchange = updateConsentCopy;
  $('#joinCampaignForm').onsubmit = async event => { event.preventDefault(); const age = $('#ageStatus').value; if (!$('#campaignConsent').checked) return setNotice('Confirm the campaign agreement before entering.', true); const { error } = await auth.client.rpc('join_flash_campaign', { p_campaign_slug: 'flash-2026', p_age_status: age, p_guardian_permission: age === 'minor_13_plus' }); setNotice(error ? error.message : 'Campaign entry accepted. Your verified-run door is ready.', Boolean(error)); if (!error) refresh(); };
  $('#promoForm').onsubmit = async event => { event.preventDefault(); const { error } = await auth.client.rpc('submit_flash_promo', { p_campaign_slug: 'flash-2026', p_platform: $('#promoPlatform').value, p_video_url: $('#promoUrl').value.trim(), p_platform_username: $('#promoHandle').value.trim(), p_rights_confirmed: $('#rightsConfirm').checked, p_repost_permission: $('#repostConfirm').checked }); setNotice(error ? error.message : 'Promotional short received for private review.', Boolean(error)); if (!error) event.target.reset(); };
  window.addEventListener('storage', renderPersonalScores); window.addEventListener('focus', renderPersonalScores); document.addEventListener('visibilitychange', () => { if (!document.hidden) renderPersonalScores(); });
  if (auth?.client) auth.client.auth.onAuthStateChange(() => refresh()); updateConsentCopy(); refresh();
})();
