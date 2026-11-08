-- Lightning Pong account-data foundation.
-- This migration creates storage and read boundaries only. Client write RPCs arrive
-- with the account UI after the privacy notice and consent language are approved.

begin;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;
revoke all on function public.set_updated_at() from public, anon, authenticated;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_player_id uuid not null unique default gen_random_uuid(),
  handle text,
  display_name text,
  leaderboard_opt_in boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  constraint profiles_handle_format check (
    handle is null or handle ~ '^[a-z0-9_]{3,24}$'
  ),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) between 1 and 40
  ),
  constraint profiles_publication_requires_handle check (
    not leaderboard_opt_in or handle is not null
  )
);

create unique index profiles_handle_unique_ci
  on public.profiles (lower(handle)) where handle is not null;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    case
      when char_length(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), '')) between 1 and 40
        then btrim(new.raw_user_meta_data ->> 'display_name')
      else null
    end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;
revoke all on function public.create_profile_for_new_user() from public, anon, authenticated;

create trigger create_profile_after_signup after insert on auth.users
for each row execute function public.create_profile_for_new_user();

create table public.alpha_enrollments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'pending',
  platform text not null default 'android',
  consent_version text not null,
  consented_at timestamptz not null,
  requested_at timestamptz not null default pg_catalog.now(),
  reviewed_at timestamptz,
  withdrawn_at timestamptz,
  constraint alpha_enrollments_status check (
    status in ('pending', 'waitlisted', 'approved', 'declined', 'withdrawn')
  ),
  constraint alpha_enrollments_platform check (platform in ('android', 'web', 'both')),
  constraint alpha_enrollments_consent_version_length check (
    char_length(consent_version) between 1 and 32
  ),
  constraint alpha_enrollments_withdrawal_consistency check (
    (status = 'withdrawn' and withdrawn_at is not null)
    or (status <> 'withdrawn' and withdrawn_at is null)
  )
);

create table public.game_saves (
  user_id uuid not null references auth.users(id) on delete cascade,
  save_slot smallint not null default 1,
  build_id text not null,
  save_version integer not null,
  current_level smallint not null default 1,
  save_data jsonb not null default '{}'::jsonb,
  revision bigint not null default 1,
  client_updated_at timestamptz,
  created_at timestamptz not null default pg_catalog.now(),
  updated_at timestamptz not null default pg_catalog.now(),
  primary key (user_id, save_slot),
  constraint game_saves_slot_range check (save_slot between 1 and 3),
  constraint game_saves_demo_level_range check (current_level between 1 and 3),
  constraint game_saves_build_id_length check (char_length(build_id) between 1 and 64),
  constraint game_saves_version_range check (save_version between 1 and 1000000),
  constraint game_saves_revision_positive check (revision > 0),
  constraint game_saves_payload_limit check (pg_column_size(save_data) <= 65536)
);

create trigger game_saves_set_updated_at before update on public.game_saves
for each row execute function public.set_updated_at();

create table public.score_builds (
  build_id text not null,
  ruleset_version text not null,
  category text not null,
  submissions_enabled boolean not null default false,
  created_at timestamptz not null default pg_catalog.now(),
  primary key (build_id, ruleset_version, category),
  constraint score_builds_build_id_length check (char_length(build_id) between 1 and 64),
  constraint score_builds_ruleset_length check (char_length(ruleset_version) between 1 and 32),
  constraint score_builds_category check (category = 'demo_3_level_clear')
);

create table public.score_submissions (
  submission_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null,
  category text not null,
  build_id text not null,
  ruleset_version text not null,
  elapsed_ms bigint not null,
  px_used integer not null,
  publish_to_leaderboard boolean not null default false,
  run_data jsonb not null default '{}'::jsonb,
  verification_status text not null default 'pending',
  verification_note text,
  submitted_at timestamptz not null default pg_catalog.now(),
  verified_at timestamptz,
  unique (user_id, run_id),
  constraint score_submissions_category check (category = 'demo_3_level_clear'),
  constraint score_submissions_build_id_length check (char_length(build_id) between 1 and 64),
  constraint score_submissions_ruleset_length check (char_length(ruleset_version) between 1 and 32),
  constraint score_submissions_elapsed_range check (elapsed_ms between 1000 and 86400000),
  constraint score_submissions_px_range check (px_used between 0 and 100000000),
  constraint score_submissions_payload_limit check (pg_column_size(run_data) <= 65536),
  constraint score_submissions_status check (
    verification_status in ('pending', 'accepted', 'rejected')
  ),
  constraint score_submissions_verification_consistency check (
    (verification_status = 'pending' and verified_at is null)
    or (verification_status in ('accepted', 'rejected') and verified_at is not null)
  )
);

create index score_submissions_pending_idx on public.score_submissions (submitted_at)
where verification_status = 'pending';

-- This contains public-safe snapshots only: no auth user ID and no email address.
create table public.leaderboard_entries (
  submission_id uuid primary key references public.score_submissions(submission_id) on delete cascade,
  player_key uuid not null,
  player_handle text not null,
  category text not null,
  build_id text not null,
  ruleset_version text not null,
  elapsed_ms bigint not null,
  px_used integer not null,
  published_at timestamptz not null default pg_catalog.now()
);

create index leaderboard_entries_fastest_idx on public.leaderboard_entries
  (category, build_id, ruleset_version, elapsed_ms, px_used, published_at, submission_id);
create index leaderboard_entries_lowest_px_idx on public.leaderboard_entries
  (category, build_id, ruleset_version, px_used, elapsed_ms, published_at, submission_id);

create view public.leaderboard_fastest_clear with (security_barrier = true) as
with player_bests as (
  select e.*,
    row_number() over (
      partition by e.category, e.build_id, e.ruleset_version, e.player_key
      order by e.elapsed_ms, e.px_used, e.published_at, e.submission_id
    ) as player_row
  from public.leaderboard_entries e
), ranked as (
  select b.*,
    row_number() over (
      partition by b.category, b.build_id, b.ruleset_version
      order by b.elapsed_ms, b.px_used, b.published_at, b.submission_id
    ) as rank
  from player_bests b where b.player_row = 1
)
select rank, player_handle as player, category, build_id, ruleset_version,
       elapsed_ms, px_used, published_at
from ranked;

create view public.leaderboard_lowest_px with (security_barrier = true) as
with player_bests as (
  select e.*,
    row_number() over (
      partition by e.category, e.build_id, e.ruleset_version, e.player_key
      order by e.px_used, e.elapsed_ms, e.published_at, e.submission_id
    ) as player_row
  from public.leaderboard_entries e
), ranked as (
  select b.*,
    row_number() over (
      partition by b.category, b.build_id, b.ruleset_version
      order by b.px_used, b.elapsed_ms, b.published_at, b.submission_id
    ) as rank
  from player_bests b where b.player_row = 1
)
select rank, player_handle as player, category, build_id, ruleset_version,
       px_used, elapsed_ms, published_at
from ranked;

alter table public.profiles enable row level security;
alter table public.alpha_enrollments enable row level security;
alter table public.game_saves enable row level security;
alter table public.score_builds enable row level security;
alter table public.score_submissions enable row level security;
alter table public.leaderboard_entries enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated
using ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy alpha_enrollments_select_own on public.alpha_enrollments for select to authenticated
using ((select auth.uid()) = user_id);
create policy game_saves_select_own on public.game_saves for select to authenticated
using ((select auth.uid()) = user_id);
create policy score_submissions_select_own on public.score_submissions for select to authenticated
using ((select auth.uid()) = user_id);
create policy leaderboard_entries_public_read on public.leaderboard_entries
for select to anon, authenticated using (true);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.alpha_enrollments from anon, authenticated;
revoke all on table public.game_saves from anon, authenticated;
revoke all on table public.score_builds from anon, authenticated;
revoke all on table public.score_submissions from anon, authenticated;
revoke all on table public.leaderboard_entries from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (handle, display_name, leaderboard_opt_in) on table public.profiles to authenticated;
grant select on table public.alpha_enrollments to authenticated;
grant select on table public.game_saves to authenticated;
grant select on table public.score_submissions to authenticated;
grant select on table public.leaderboard_entries to anon, authenticated;

revoke all on table public.leaderboard_fastest_clear from anon, authenticated;
revoke all on table public.leaderboard_lowest_px from anon, authenticated;
grant select on table public.leaderboard_fastest_clear to anon, authenticated;
grant select on table public.leaderboard_lowest_px to anon, authenticated;

comment on table public.profiles is 'Minimal game identity; public_player_id is separate from the auth user ID.';
comment on table public.alpha_enrollments is 'Preserved opt-in and withdrawal state for playtesting.';
comment on table public.game_saves is 'Revision-ready cloud saves for the three-level browser demo.';
comment on column public.score_submissions.px_used is 'Total PX spent or consumed from demo start through Level 3 victory; starting balance is excluded.';
comment on table public.score_submissions is 'Immutable client score claims awaiting trusted verification.';
comment on table public.leaderboard_entries is 'Public-safe snapshots created only after trusted acceptance and explicit player opt-in.';

commit;
