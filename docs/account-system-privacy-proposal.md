# Lightning Pong Optional Account System — Privacy and Consent Proposal

**Status:** Draft for Nana's review. Not published and not yet active.

**Draft date:** November 7, 2026

**Proposed consent version:** `2026-11-07-v1`

## 1. Product boundary

Lightning Pong currently has two distinct experiences:

1. **Android v0.2 Closed Alpha** — remains offline-first. Progress stays on the Android device under the existing release behavior.
2. **Three-level browser demo** — will be playable without an account. A player may optionally create an account for cloud saves, alpha enrollment, and score submission.

An account must not become a condition for trying the browser demo. Signing in adds optional continuity and community features; it does not convert the offline Android alpha into an always-online game.

## 2. Proposed account features

An authenticated player may choose to:

- create a game profile and unique public handle;
- save up to three browser-demo save slots;
- request enrollment in the Android, web, or combined alpha;
- submit a completed three-level run for review;
- separately opt in to publication on a leaderboard;
- view, export, or request deletion of account-linked information.

Public leaderboard publication requires all of the following:

- the player has selected a valid handle;
- the player has explicitly enabled leaderboard participation;
- the individual run was marked for publication;
- the run was accepted through a trusted review process.

The public leaderboard will show only the approved handle, category, build/ruleset, completion time, Px used, and publication date. It will not show an email address, authentication ID, legal name, or private save data.

## 3. Information proposed for collection

| Information | Why it is needed | Public? |
| --- | --- | --- |
| Email address and authentication record | Sign-in, account recovery, security | No |
| Optional display name | Personalize the signed-in account | No |
| Chosen game handle | Identify an opted-in leaderboard entry | Only after opt-in and score approval |
| Alpha platform choice and consent timestamp/version | Process and document a test-enrollment request | No |
| Alpha request/review/withdrawal status | Manage the testing program | No |
| Browser-demo save data | Restore optional cloud progress | No |
| Run ID, build/ruleset, completion time, Px used, and run evidence | Review score claims and prevent duplicate submissions | No, unless approved and opted in as described above |
| Security and service logs | Operate and protect authentication and database services | No |

No advertising profile, precise location, contact list, camera recording, microphone recording, or payment-card information is proposed for the Lightning Pong account system.

## 4. Service provider

The optional account system is proposed to use **Supabase** for authentication and database hosting. Supabase processes account and game-service information on the developer's behalf. Its own service, security, and infrastructure practices also apply to information processed through that platform.

The public website and browser demo are proposed to remain hosted through GitHub Pages. The website must never contain a Supabase secret key, database password, personal access token, or service-role credential. It may contain only the project's public URL and publishable browser key.

## 5. Player controls

The account interface should provide plain-language controls to:

- sign out;
- change the private display name;
- choose or change the game handle, subject to format and moderation rules;
- enable or disable future leaderboard publication;
- withdraw a pending or waitlisted alpha request without erasing its audit history;
- delete individual browser-demo save slots;
- request a machine-readable account export;
- request account deletion.

Disabling leaderboard participation prevents future publication and presents a separate choice for existing entries:

- **Keep historical entries** — the default, preserving the record of accepted past runs; or
- **Request removal of prior entries** — available when the player wants them removed, including when a record was materially incorrect, fraudulent, or otherwise seriously compromised.

Turning off future participation alone does not silently rewrite the historical leaderboard.

## 6. Retention proposal

- **Active profile and saves:** retained while the account remains active or until the player deletes them.
- **Withdrawn/declined alpha request:** retained for up to 12 months for program administration, then deleted or de-identified.
- **Rejected score claim:** retained for up to 90 days for abuse prevention and appeal handling, then deleted or de-identified.
- **Accepted public leaderboard entry:** retained as a historical record by default, even if future participation is disabled. The player may separately request removal of prior entries.
- **Deleted account:** private profile, saves, enrollment data, and score claims removed or de-identified from active systems within 30 days. Residual copies in provider-managed backups expire under the provider's normal backup cycle and are not restored for ordinary product use after deletion.

The final policy must describe these as maximum operational periods rather than a promise of instant removal from provider-managed disaster-recovery backups.

## 7. Children and family use

Self-managed Lightning Pong accounts are limited to users **age 13 or older**. The browser demo remains playable without an account. Testing involving younger players must be managed through an authorized adult unless a separate verified parental-consent workflow is designed and approved in the future.

The account interface must present the age requirement before signup and must not promote self-managed account creation to children under 13.

## 8. Proposed signup consent copy

> If you are 13 or older, you may create an optional Lightning Pong account using an email magic link or Google sign-in. An account can save browser-demo progress, request alpha access, and submit scores for review. Your email and private game data will be stored through Supabase. Nothing is posted publicly unless you separately opt in to the leaderboard and a submitted run is approved. You can play the three-level browser demo without creating an account.

Required acknowledgement:

> I confirm that I am at least 13 years old. I have read the Privacy Policy and agree to the optional account data practices described there. I understand that leaderboard publication is a separate choice.

The interface should link directly to the effective privacy policy and record the exact consent-version identifier on the server rather than accepting a version supplied by the browser.

## 9. Proposed score definitions

- **Fastest clear:** elapsed time from the official start of the three-level demo run through confirmed Level 3 victory.
- **Lowest Px used:** total Px spent or consumed from the official start of the run through confirmed Level 3 victory. The player's pre-run balance is excluded.

Both rankings must be separated by build and ruleset so mechanically different versions are never ranked together. Only one best entry per player appears in each category. Browser submissions are client claims until a trusted verification mechanism accepts them.

## 10. Required website changes before activation

The following pages currently promise no accounts, transmission, server storage, or developer-operated online services and must be revised together:

- `privacy.html`
- `qa.html`
- `index.html`
- `tester-guide.html`

The final copy must preserve the distinction between the current offline Android release and the optional online browser features. The live account controls must remain disabled until the updated policy is published and the consent version matches the server configuration.

## 11. Approved product decisions

- Minimum age for a self-managed account: **13**.
- Initial sign-in methods: **email magic link and Google sign-in**.
- Disabling future leaderboard participation does **not** automatically remove historical entries. Keeping them is the default, with a separate removal request available.
- Withdrawn or declined alpha requests are retained for up to **12 months**.
- Rejected score submissions are retained for up to **90 days**.
- Deleted-account data is removed or de-identified from active systems within **30 days**, while residual provider backups expire through the provider's normal backup cycle.

## 12. Decisions reserved for Nana

- Whether alpha enrollment uses the account email or a separate contact address.
- Public handle moderation and appeal process.
- Account export and deletion request channel.
- The build identifier and ruleset that will open the first leaderboard season.

## 13. Safe implementation order

1. Approve the decisions above and revise this proposal.
2. Publish the coordinated privacy, Q&A, home-page, and tester-guide changes.
3. Configure allowed site URLs and authentication providers in Supabase.
4. Add server-controlled enrollment, save, and score-submission functions.
5. Add account UI behind a disabled feature flag.
6. Test access as anonymous, signed-in player, reviewer, and deleted account.
7. Enable accounts for a small invited group before public promotion.
