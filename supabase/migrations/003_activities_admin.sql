create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 2 and 160),
  date date not null,
  place text not null check (char_length(place) between 2 and 160),
  spots integer not null check (spots between 1 and 500),
  category text not null check (category in ('Culture', 'Loisirs', 'Nature', 'Sport')),
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.activities enable row level security;

create policy "Les visiteurs peuvent voir les activités publiées"
on public.activities for select to anon using (published = true);

create policy "L administrateur peut créer des activités"
on public.activities for insert to authenticated
with check ((auth.jwt() ->> 'email') = 'infos@lesjeunesexplorateurs.fr');
