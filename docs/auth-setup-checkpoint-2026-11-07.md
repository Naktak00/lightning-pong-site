# Lightning Pong authentication setup checkpoint

Recorded: November 7, 2026

## Confirmed complete

- Supabase project `lightning-pong-accounts` is healthy.
- Google OAuth application `Lightning Pong` exists.
- Google OAuth web client `Lightning Pong Web` exists.
- Authorized browser origin is the Lightning Pong GitHub Pages origin.
- Authorized Google callback is the Supabase authentication callback.
- Google sign-in is enabled in Supabase.
- Email authentication remains enabled.
- Public user signups remain disabled during construction.
- Anonymous sign-ins and manual account linking remain disabled.
- Site and post-authentication return URLs point to the Lightning Pong GitHub Pages site.
- No OAuth client secret is stored in this repository.

## Safe next action

Create a browser-safe Supabase publishable key, place only that public key and the project URL in the website, then add the invitation-only account and callback pages. Do not place a secret key, service-role key, database password, Google client secret, or Supabase account token in the website or repository.

## Credential cleanup

The broad Supabase account token named `Blue-Krait Codex LP Setup` is no longer required for the completed dashboard setup and may be revoked. Future command-line work should use a new narrowly scoped, short-lived token when needed.
