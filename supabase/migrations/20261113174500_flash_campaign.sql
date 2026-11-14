-- Lightning Pong Flash Campaign: server clock, account roles, eligible runs,
-- promo submissions, and a reviewer-only read surface.

begin;

alter table public.profiles
  drop constraint if exists profiles_account_role_check;

alter table public.profiles
  add column if not exists account_role text not null default 'player',
  add constraint profiles_account_role_check
    check (account_role in ('player', 'developer', 'research_agent', 'reviewer'));

-- Nana's verified account is never prize eligible and can review submissions.
update public.profiles p
set account_role = 'developer'
from auth.users u
where p.user_id = u.id and lower(u.email) = 'frimzilla@gmail.com';

create table public.campaigns (
  campaign_id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  rules_version text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default pg_catalog.now(),
  constraint campaigns_window check (starts_at < ends_at),
  constraint campaigns_slug check (slug ~ '^[a-z0-9-]{3,48}$')
);

create table public.campaign_prizes (
  campaign_id uuid not null references public.campaigns(campaign_id) on delete cascade,
  prize_key text not null,
  label text not null,
  amount_usd integer not null,
  display_order smallint not null,
  status text not null default 'open',
  winner_handle text,
  claimed_at timestamptz,
  primary key (campaign_id, prize_key),
  constraint campaign_prize_amount check (amount_usd > 0),
  constraint campaign_prize_status check (status in ('open', 'pending', 'claimed')),
  constraint campaign_prize_claim check (
    (status = 'claimed' and winner_handle is not null and claimed_at is not null)
    or status <> 'claimed'
  )
);

create table public.campaign_participants (
  campaign_id uuid not null references public.campaigns(campaign_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rules_version text not null,
  age_status text not null,
  guardian_permission boolean not null default false,
  accepted_at timestamptz not null default pg_catalog.now(),
  primary key (campaign_id, user_id),
  constraint campaign_participant_age check (age_status in ('adult', 'minor_13_plus')),
  constraint campaign_guardian_required check (age_status = 'adult' or guardian_permission)
);

create table public.campaign_runs (
  run_id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(campaign_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  account_role text not null,
  prize_eligible boolean not null,
  exclusion_reason text,
  build_id text not null default 'lp-web-3lv-20261114-flash1',
  ruleset_version text not null default 'flash-clear-v1',
  status text not null default 'issued',
  issued_at timestamptz not null default pg_catalog.now(),
  completed_at timestamptz,
  elapsed_ms bigint,
  px_used integer,
  run_data jsonb not null default '{}'::jsonb,
  verification_status text not null default 'pending',
  verification_note text,
  constraint campaign_run_role check (account_role in ('player', 'developer', 'research_agent', 'reviewer')),
  constraint campaign_run_status check (status in ('issued', 'completed', 'abandoned')),
  constraint campaign_run_verification check (verification_status in ('pending', 'accepted', 'rejected', 'excluded')),
  constraint campaign_run_metrics check (
    (status <> 'completed' and completed_at is null and elapsed_ms is null and px_used is null)
    or (status = 'completed' and completed_at is not null and elapsed_ms between 1000 and 86400000 and px_used between 0 and 100000000)
  ),
  constraint campaign_run_payload_limit check (pg_column_size(run_data) <= 65536)
);

create index campaign_runs_review_idx on public.campaign_runs
  (campaign_id, verification_status, completed_at)
  where status = 'completed';

create table public.promo_submissions (
  submission_id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(campaign_id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null,
  video_url text not null,
  platform_username text not null,
  contact_email text not null,
  rights_confirmed boolean not null,
  repost_permission boolean not null,
  status text not null default 'submitted',
  review_note text,
  submitted_at timestamptz not null default pg_catalog.now(),
  unique (campaign_id, user_id, video_url),
  constraint promo_platform check (platform in ('tiktok', 'douyin')),
  constraint promo_url_length check (char_length(video_url) between 12 and 500),
  constraint promo_username_length check (char_length(platform_username) between 1 and 80),
  constraint promo_email_length check (char_length(contact_email) between 3 and 254),
  constraint promo_rights_required check (rights_confirmed),
  constraint promo_status check (status in ('submitted', 'reviewing', 'finalist', 'selected', 'declined'))
);

insert into public.campaigns (slug, title, starts_at, ends_at, rules_version)
values ('flash-2026', 'Lightning Pong Flash Campaign', '2026-11-14 15:00:00-05', '2026-11-22 12:00:00-05', '2026-11-13-v1')
on conflict (slug) do update set
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  rules_version = excluded.rules_version;

insert into public.campaign_prizes (campaign_id, prize_key, label, amount_usd, display_order)
select c.campaign_id, p.prize_key, p.label, p.amount_usd, p.display_order
from public.campaigns c
cross join (values
  ('first-clear', 'First verified clear', 25, 1),
  ('second-clear', 'Second verified clear', 15, 2),
  ('third-clear', 'Third verified clear', 10, 3),
  ('lowest-px', 'Lowest PX clear', 20, 4),
  ('second-lowest-px', 'Second-lowest PX clear', 10, 5),
  ('best-short', 'Best TikTok / Douyin short', 25, 6)
) as p(prize_key, label, amount_usd, display_order)
where c.slug = 'flash-2026'
on conflict (campaign_id, prize_key) do update set
  label = excluded.label,
  amount_usd = excluded.amount_usd,
  display_order = excluded.display_order;

create or replace function public.join_flash_campaign(
  p_campaign_slug text,
  p_age_status text,
  p_guardian_permission boolean default false
) returns public.campaign_participants
language plpgsql security definer set search_path = '' as $$
declare
  v_campaign public.campaigns;
  v_result public.campaign_participants;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_campaign from public.campaigns where slug = p_campaign_slug and enabled;
  if not found then raise exception 'CAMPAIGN_NOT_FOUND'; end if;
  if pg_catalog.now() >= v_campaign.ends_at then raise exception 'CAMPAIGN_CLOSED'; end if;
  if p_age_status not in ('adult', 'minor_13_plus') then raise exception 'AGE_CONFIRMATION_REQUIRED'; end if;
  if p_age_status = 'minor_13_plus' and not p_guardian_permission then raise exception 'GUARDIAN_PERMISSION_REQUIRED'; end if;
  insert into public.campaign_participants (campaign_id, user_id, rules_version, age_status, guardian_permission)
  values (v_campaign.campaign_id, auth.uid(), v_campaign.rules_version, p_age_status, p_guardian_permission)
  on conflict (campaign_id, user_id) do update set
    rules_version = excluded.rules_version,
    age_status = excluded.age_status,
    guardian_permission = excluded.guardian_permission,
    accepted_at = pg_catalog.now()
  returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.begin_flash_campaign_run(p_campaign_slug text)
returns table(run_id uuid, prize_eligible boolean, issued_at timestamptz, reason text)
language plpgsql security definer set search_path = '' as $$
declare
  v_campaign public.campaigns;
  v_profile public.profiles;
  v_participant public.campaign_participants;
  v_run public.campaign_runs;
  v_eligible boolean;
  v_reason text;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_campaign from public.campaigns where slug = p_campaign_slug and enabled;
  if not found then raise exception 'CAMPAIGN_NOT_FOUND'; end if;
  if pg_catalog.now() < v_campaign.starts_at then raise exception 'CAMPAIGN_NOT_STARTED'; end if;
  if pg_catalog.now() >= v_campaign.ends_at then raise exception 'CAMPAIGN_CLOSED'; end if;
  select * into v_profile from public.profiles where user_id = auth.uid();
  select * into v_participant from public.campaign_participants where campaign_id = v_campaign.campaign_id and user_id = auth.uid();
  if not found or v_participant.rules_version <> v_campaign.rules_version then raise exception 'RULES_ACCEPTANCE_REQUIRED'; end if;
  v_eligible := v_profile.account_role = 'player';
  v_reason := case when v_eligible then null else 'DEVELOPMENT_OR_RESEARCH_ACCOUNT' end;
  insert into public.campaign_runs (campaign_id, user_id, account_role, prize_eligible, exclusion_reason, verification_status)
  values (v_campaign.campaign_id, auth.uid(), v_profile.account_role, v_eligible, v_reason, case when v_eligible then 'pending' else 'excluded' end)
  returning * into v_run;
  return query select v_run.run_id, v_run.prize_eligible, v_run.issued_at, v_reason;
end;
$$;

create or replace function public.complete_flash_campaign_run(
  p_run_id uuid,
  p_elapsed_ms bigint,
  p_px_used integer,
  p_run_data jsonb default '{}'::jsonb
) returns public.campaign_runs
language plpgsql security definer set search_path = '' as $$
declare
  v_run public.campaign_runs;
  v_campaign public.campaigns;
  v_result public.campaign_runs;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_run from public.campaign_runs where run_id = p_run_id and user_id = auth.uid() for update;
  if not found then raise exception 'RUN_NOT_FOUND'; end if;
  if v_run.status <> 'issued' then raise exception 'RUN_ALREADY_FINALIZED'; end if;
  select * into v_campaign from public.campaigns where campaign_id = v_run.campaign_id;
  if v_run.issued_at < v_campaign.starts_at or v_run.issued_at >= v_campaign.ends_at then raise exception 'RUN_OUTSIDE_CAMPAIGN'; end if;
  if p_elapsed_ms < 1000 or p_elapsed_ms > 86400000 or p_px_used < 0 or p_px_used > 100000000 then raise exception 'INVALID_RUN_METRICS'; end if;
  if pg_catalog.now() < v_run.issued_at or p_elapsed_ms > (extract(epoch from (pg_catalog.now() - v_run.issued_at)) * 1000)::bigint + 60000 then raise exception 'INVALID_RUN_CLOCK'; end if;
  update public.campaign_runs set
    status = 'completed', completed_at = pg_catalog.now(), elapsed_ms = p_elapsed_ms,
    px_used = p_px_used, run_data = coalesce(p_run_data, '{}'::jsonb)
  where run_id = p_run_id returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.submit_flash_promo(
  p_campaign_slug text,
  p_platform text,
  p_video_url text,
  p_platform_username text,
  p_rights_confirmed boolean,
  p_repost_permission boolean
) returns public.promo_submissions
language plpgsql security definer set search_path = '' as $$
declare
  v_campaign public.campaigns;
  v_email text;
  v_result public.promo_submissions;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_campaign from public.campaigns where slug = p_campaign_slug and enabled;
  if not found then raise exception 'CAMPAIGN_NOT_FOUND'; end if;
  if pg_catalog.now() >= v_campaign.ends_at then raise exception 'CAMPAIGN_CLOSED'; end if;
  if p_platform = 'tiktok' and p_video_url !~* '^https?://([^/]+\.)?tiktok\.com/' then raise exception 'INVALID_TIKTOK_URL'; end if;
  if p_platform = 'douyin' and p_video_url !~* '^https?://([^/]+\.)?douyin\.com/' then raise exception 'INVALID_DOUYIN_URL'; end if;
  select email into v_email from auth.users where id = auth.uid();
  insert into public.promo_submissions (campaign_id, user_id, platform, video_url, platform_username, contact_email, rights_confirmed, repost_permission)
  values (v_campaign.campaign_id, auth.uid(), p_platform, p_video_url, btrim(p_platform_username), v_email, p_rights_confirmed, p_repost_permission)
  returning * into v_result;
  return v_result;
end;
$$;

create or replace function public.flash_campaign_review()
returns table(kind text, record_id uuid, player_handle text, contact_email text, detail jsonb, submitted_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  select account_role into v_role from public.profiles where user_id = auth.uid();
  if v_role not in ('developer', 'reviewer') then raise exception 'REVIEWER_REQUIRED'; end if;
  return query
    select 'run', r.run_id, p.handle, u.email,
      jsonb_build_object('eligible', r.prize_eligible, 'role', r.account_role, 'elapsed_ms', r.elapsed_ms, 'px_used', r.px_used, 'verification', r.verification_status),
      coalesce(r.completed_at, r.issued_at)
    from public.campaign_runs r join public.profiles p on p.user_id = r.user_id join auth.users u on u.id = r.user_id
    where r.status = 'completed'
    union all
    select 'promo', s.submission_id, p.handle, s.contact_email,
      jsonb_build_object('platform', s.platform, 'url', s.video_url, 'username', s.platform_username, 'status', s.status), s.submitted_at
    from public.promo_submissions s join public.profiles p on p.user_id = s.user_id
    order by submitted_at desc;
end;
$$;

alter table public.campaigns enable row level security;
alter table public.campaign_prizes enable row level security;
alter table public.campaign_participants enable row level security;
alter table public.campaign_runs enable row level security;
alter table public.promo_submissions enable row level security;

create policy campaigns_public_read on public.campaigns for select to anon, authenticated using (enabled);
create policy campaign_prizes_public_read on public.campaign_prizes for select to anon, authenticated using (true);
create policy campaign_participants_own_read on public.campaign_participants for select to authenticated using ((select auth.uid()) = user_id);
create policy campaign_runs_own_read on public.campaign_runs for select to authenticated using ((select auth.uid()) = user_id);
create policy promo_submissions_own_read on public.promo_submissions for select to authenticated using ((select auth.uid()) = user_id);

revoke all on public.campaigns, public.campaign_prizes, public.campaign_participants, public.campaign_runs, public.promo_submissions from anon, authenticated;
grant select on public.campaigns, public.campaign_prizes to anon, authenticated;
grant select on public.campaign_participants, public.campaign_runs, public.promo_submissions to authenticated;
revoke all on function public.join_flash_campaign(text,text,boolean) from public;
revoke all on function public.begin_flash_campaign_run(text) from public;
revoke all on function public.complete_flash_campaign_run(uuid,bigint,integer,jsonb) from public;
revoke all on function public.submit_flash_promo(text,text,text,text,boolean,boolean) from public;
revoke all on function public.flash_campaign_review() from public;
grant execute on function public.join_flash_campaign(text,text,boolean) to authenticated;
grant execute on function public.begin_flash_campaign_run(text) to authenticated;
grant execute on function public.complete_flash_campaign_run(uuid,bigint,integer,jsonb) to authenticated;
grant execute on function public.submit_flash_promo(text,text,text,text,boolean,boolean) to authenticated;
grant execute on function public.flash_campaign_review() to authenticated;

comment on column public.profiles.account_role is 'Server-controlled role. Developer and research roles never qualify for prizes.';
comment on table public.campaign_runs is 'Server-issued campaign run envelopes; client metrics remain pending until trusted review.';
comment on table public.promo_submissions is 'Private TikTok/Douyin campaign entries visible only to the submitter and reviewer RPC.';

commit;
