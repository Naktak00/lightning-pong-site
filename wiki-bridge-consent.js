(() => {
  const element = (id) => document.getElementById(id);
  const root = element('wikiConsent');
  const status = element('consentStatus');
  const details = element('consentDetails');
  const signIn = element('consentSignIn');
  const approve = element('consentApprove');
  const deny = element('consentDeny');
  const clientId = root.dataset.clientId;
  const callback = root.dataset.redirectUri;
  const authorizationId = new URL(location.href).searchParams.get('authorization_id');

  function callbackMatches(value, withResult = false) {
    try {
      const actual = new URL(value);
      const expected = new URL(callback);
      if (expected.origin !== 'https://chatgpt.com' || expected.username || expected.password ||
          expected.search || expected.hash || actual.username || actual.password || actual.hash) return false;
      if (withResult) actual.search = '';
      return actual.href === expected.href &&
        (expected.pathname === '/connector_platform_oauth_redirect' ||
          /^\/connector\/oauth\/[A-Za-z0-9_-]+$/.test(expected.pathname));
    } catch {
      return false;
    }
  }

  async function load() {
    if (!clientId || !callbackMatches(callback)) throw new Error('Wiki authorization is not configured.');
    if (!authorizationId || !/^[A-Za-z0-9_-]{1,200}$/.test(authorizationId)) {
      throw new Error('Open this page from the ChatGPT connection to start authorization.');
    }
    const auth = window.LPAuth;
    if (!auth?.client?.auth?.oauth) throw new Error('Lightning Pong sign-in is unavailable.');
    const session = await auth.session();
    if (!session) {
      status.textContent = 'Sign in through Player Passport in the other tab, then return here and reload.';
      signIn.hidden = false;
      return;
    }
    const oauth = auth.client.auth.oauth;
    const request = await oauth.getAuthorizationDetails(authorizationId);
    const data = request.data;
    if (request.error || !data) throw new Error('This authorization request is invalid or expired.');
    if (data.redirect_url && !data.authorization_id) {
      if (!callbackMatches(data.redirect_url, true)) throw new Error('Unexpected return address.');
      location.replace(data.redirect_url);
      return;
    }
    if (data.authorization_id !== authorizationId || data.client?.id !== clientId ||
        !callbackMatches(data.redirect_uri)) {
      throw new Error('This request does not match the dedicated Velvet Room client.');
    }
    const scopes = new Set(String(data.scope ?? '').trim().split(/\s+/));
    if (!scopes.has('openid') || [...scopes].some((scope) => !['openid', 'email', 'offline_access'].includes(scope))) {
      throw new Error('This request asks for permissions Velvet Quill does not allow.');
    }
    element('consentAccount').textContent = session.user.email || 'your Lightning Pong account';
    element('consentEmailScope').hidden = !scopes.has('email');
    element('consentRefreshScope').hidden = !scopes.has('offline_access');
    element('consentDestination').textContent = 'ChatGPT';
    status.textContent = 'Review the request before approving.';
    details.hidden = false;
    const decide = async (approval) => {
      approve.disabled = true;
      deny.disabled = true;
      try {
        const action = approval ? oauth.approveAuthorization : oauth.denyAuthorization;
        const result = await action.call(oauth, authorizationId, { skipBrowserRedirect: true });
        if (result.error || !callbackMatches(result.data?.redirect_url, true)) throw new Error();
        location.replace(result.data.redirect_url);
      } catch {
        status.textContent = 'The authorization result could not be verified. Restart from ChatGPT.';
      }
    };
    approve.addEventListener('click', () => { void decide(true); });
    deny.addEventListener('click', () => { void decide(false); });
  }

  load().catch((error) => { status.textContent = error.message; });
})();
