create table public.donations (
  id uuid primary key default gen_random_uuid(),
  stripe_checkout_session_id text not null unique,
  donor_name text not null,
  donor_email text not null,
  amount_cents integer not null check (amount_cents >= 100),
  currency text not null default 'eur',
  confirmation_number text not null unique,
  receipt_path text,
  created_at timestamptz not null default now()
);

alter table public.donations enable row level security;

insert into storage.buckets (id, name, public) values ('donation-confirmations', 'donation-confirmations', false)
on conflict (id) do nothing;
