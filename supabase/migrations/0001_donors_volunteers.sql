-- TSNS donors + volunteers
-- RLS is ON with NO policies -> default deny for anon/authenticated.
-- Only the `service_role` key (used server-side by Cloudflare functions) bypasses RLS.

create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text,
  email text,
  phone text,
  -- 'one_time' | 'monthly' | 'yearly'
  type text not null check (type in ('one_time', 'monthly', 'yearly')),
  amount_cents integer not null,
  currency text not null default 'CAD',
  status text,
  square_customer_id text,
  square_payment_id text,
  square_subscription_id text,
  raw jsonb
);

create index if not exists donors_created_at_idx on public.donors (created_at desc);
create index if not exists donors_email_idx on public.donors (email);

create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  interests text,
  status text not null default 'new'
);

create index if not exists volunteers_created_at_idx on public.volunteers (created_at desc);

alter table public.donors enable row level security;
alter table public.volunteers enable row level security;
-- Intentionally no policies: anon/authenticated get nothing; service_role bypasses RLS.
