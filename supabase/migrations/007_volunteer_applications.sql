create table public.volunteer_applications (
  id bigint generated always as identity primary key,
  first_name text not null check (char_length(first_name) between 2 and 80),
  last_name text not null check (char_length(last_name) between 2 and 100),
  email text not null check (char_length(email) between 5 and 254),
  phone text check (phone is null or char_length(phone) between 6 and 30),
  availability text not null check (availability in ('En semaine', 'Le week-end', 'Selon mes disponibilités')),
  motivation text not null check (char_length(motivation) between 10 and 2000),
  created_at timestamptz not null default now()
);

alter table public.volunteer_applications enable row level security;

revoke all on table public.volunteer_applications from public, anon, authenticated;
revoke all on sequence public.volunteer_applications_id_seq from public, anon, authenticated;
grant insert on table public.volunteer_applications to anon;
grant usage on sequence public.volunteer_applications_id_seq to anon;

create policy "Les visiteurs peuvent proposer leur bénévolat"
on public.volunteer_applications for insert to anon
with check (true);
