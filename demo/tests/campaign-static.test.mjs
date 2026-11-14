import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('Flash Campaign page publishes all six bounties and the exact window', async () => {
  const page = await read('campaign.html');
  assert.equal((page.match(/class="prize-card/g) || []).length, 6);
  assert.match(page, /November 14/);
  assert.match(page, /November 22, 2026 at 12:00 PM ET/);
  assert.match(page, /Worldwide where lawful/);
});

test('launch gate points early visitors to rules and active visitors to the game', async () => {
  const gate = await read('demo/index.html');
  assert.match(gate, /2026-11-14T15:00:00-05:00/);
  assert.match(gate, /campaign\.html/);
  assert.match(gate, /app\/index\.html/);
});

test('Passport and game keep campaign runs authenticated and separate', async () => {
  const account = await read('account.html');
  const accountScript = await read('account.js');
  const client = await read('demo/app/campaign-client.js');
  assert.match(account, /joinCampaignForm/);
  assert.match(account, /promoForm/);
  assert.match(account, /discordSignIn/);
  assert.match(account, /campaignConsent/);
  assert.doesNotMatch(account, /guardianConfirm|rulesConfirm|Ollama/i);
  assert.match(accountScript, /oauth\('discord'\)/);
  assert.match(accountScript, /lightning-pong-web-demo-save-v1/);
  assert.match(client, /begin_flash_campaign_run/);
  assert.match(client, /complete_flash_campaign_run/);
  assert.match(client, /getSession/);
});

test('database policy excludes development and research roles from prizes', async () => {
  const migration = await read('supabase/migrations/20261113174500_flash_campaign.sql');
  assert.match(migration, /research_agent/);
  assert.match(migration, /v_profile\.account_role = 'player'/);
  assert.match(migration, /CAMPAIGN_NOT_STARTED/);
  assert.match(migration, /REVIEWER_REQUIRED/);
});
