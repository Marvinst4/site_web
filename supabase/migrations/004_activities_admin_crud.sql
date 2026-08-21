alter table public.activities enable row level security;

revoke all on table public.activities from anon, authenticated;
grant select on table public.activities to anon;
grant select, insert, update, delete on table public.activities to authenticated;

drop policy if exists "Les visiteurs peuvent voir les activités publiées" on public.activities;
drop policy if exists "L administrateur peut créer des activités" on public.activities;
drop policy if exists "L administrateur peut consulter les activités" on public.activities;
drop policy if exists "L administrateur peut modifier les activités" on public.activities;
drop policy if exists "L administrateur peut supprimer les activités" on public.activities;

create policy "Les visiteurs peuvent voir les activités publiées"
on public.activities for select to anon
using (published = true);

create policy "L administrateur peut consulter les activités"
on public.activities for select to authenticated
using ((select auth.jwt() ->> 'email') = 'infos@lesjeunesexplorateurs.fr');

create policy "L administrateur peut créer des activités"
on public.activities for insert to authenticated
with check ((select auth.jwt() ->> 'email') = 'infos@lesjeunesexplorateurs.fr');

create policy "L administrateur peut modifier les activités"
on public.activities for update to authenticated
using ((select auth.jwt() ->> 'email') = 'infos@lesjeunesexplorateurs.fr')
with check ((select auth.jwt() ->> 'email') = 'infos@lesjeunesexplorateurs.fr');

create policy "L administrateur peut supprimer les activités"
on public.activities for delete to authenticated
using ((select auth.jwt() ->> 'email') = 'infos@lesjeunesexplorateurs.fr');
