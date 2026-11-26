-- Private assets require the same verified developer identity as the Passport entry.
create or replace function public.can_access_lp_private_playtest()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    where u.id = (select auth.uid())
      and lower(u.email) = 'frimzilla@gmail.com'
      and u.email_confirmed_at is not null
      and not u.is_anonymous
  );
$$;

revoke all on function public.can_access_lp_private_playtest() from public, anon, authenticated;
grant execute on function public.can_access_lp_private_playtest() to authenticated;

insert into storage.buckets(id, name, public)
values ('lp-private-playtest', 'lp-private-playtest', false)
on conflict (id) do update set public = false;

create policy "LP private playtest developer read"
on storage.objects for select to authenticated
using (bucket_id = 'lp-private-playtest' and (select public.can_access_lp_private_playtest()));

create policy "LP private playtest restrict authenticated reads"
on storage.objects as restrictive for select to authenticated
using (bucket_id <> 'lp-private-playtest' or (select public.can_access_lp_private_playtest()));

create policy "LP private playtest deny anonymous reads"
on storage.objects as restrictive for select to anon
using (bucket_id <> 'lp-private-playtest');

create policy "LP private playtest deny client inserts"
on storage.objects as restrictive for insert to anon, authenticated
with check (bucket_id <> 'lp-private-playtest');

create policy "LP private playtest deny client updates"
on storage.objects as restrictive for update to anon, authenticated
using (bucket_id <> 'lp-private-playtest') with check (bucket_id <> 'lp-private-playtest');

create policy "LP private playtest deny client deletes"
on storage.objects as restrictive for delete to anon, authenticated
using (bucket_id <> 'lp-private-playtest');
