create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  first_name text not null check (char_length(first_name) between 2 and 80),
  last_name text not null check (char_length(last_name) between 2 and 100),
  email text not null check (char_length(email) between 5 and 254),
  phone text not null check (char_length(phone) between 6 and 30),
  age integer not null check (age between 1 and 120),
  city text not null check (char_length(city) between 2 and 120),
  created_at timestamptz not null default now()
);

alter table public.volunteers enable row level security;

revoke all on table public.volunteers from public, anon, authenticated;
grant select, insert, update, delete on table public.volunteers to authenticated;

drop policy if exists "L administrateur peut consulter les bénévoles" on public.volunteers;
drop policy if exists "L administrateur peut créer des bénévoles" on public.volunteers;
drop policy if exists "L administrateur peut modifier les bénévoles" on public.volunteers;
drop policy if exists "L administrateur peut supprimer les bénévoles" on public.volunteers;

create policy "L administrateur peut consulter les bénévoles"
on public.volunteers for select to authenticated
using (((select auth.jwt()) ->> 'email') = 'infos@lesjeunesexplorateurs.fr');

create policy "L administrateur peut créer des bénévoles"
on public.volunteers for insert to authenticated
with check (((select auth.jwt()) ->> 'email') = 'infos@lesjeunesexplorateurs.fr');

create policy "L administrateur peut modifier les bénévoles"
on public.volunteers for update to authenticated
using (((select auth.jwt()) ->> 'email') = 'infos@lesjeunesexplorateurs.fr')
with check (((select auth.jwt()) ->> 'email') = 'infos@lesjeunesexplorateurs.fr');

create policy "L administrateur peut supprimer les bénévoles"
on public.volunteers for delete to authenticated
using (((select auth.jwt()) ->> 'email') = 'infos@lesjeunesexplorateurs.fr');
