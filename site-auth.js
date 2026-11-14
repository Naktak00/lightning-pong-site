(function () {
  const config = window.LP_SUPABASE_CONFIG;
  const available = Boolean(config?.url && config?.publishableKey && window.supabase?.createClient);
  const client = available
    ? window.supabase.createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

  async function session() {
    if (!client) return null;
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function requireSession(returnTo = 'account.html') {
    const current = await session();
    if (current) return current;
    const target = new URL('account.html', location.href);
    target.searchParams.set('return', new URL(returnTo, location.href).href);
    location.href = target.href;
    return null;
  }

  function displayName(user) {
    const emailName = user?.email?.split('@')[0];
    return emailName || user?.user_metadata?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || 'Passport';
  }

  function paintPassportNavigation(currentSession) {
    const name = currentSession?.user ? displayName(currentSession.user) : 'Passport';
    document.querySelectorAll('[data-passport-nav]').forEach(link => {
      link.textContent = name;
      link.title = currentSession?.user ? `Open ${name}'s Player Passport` : 'Open Player Passport';
    });
  }

  if (client) {
    client.auth.getSession().then(({ data }) => paintPassportNavigation(data.session));
    client.auth.onAuthStateChange((_event, currentSession) => paintPassportNavigation(currentSession));
  } else paintPassportNavigation(null);

  window.LPAuth = Object.freeze({ available, client, session, requireSession, displayName, config });
})();
