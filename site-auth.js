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

  window.LPAuth = Object.freeze({ available, client, session, requireSession, config });
})();
