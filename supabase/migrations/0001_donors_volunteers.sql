-- TSNS — donors, volunteers, and a members view.
--
-- HOW TO RUN THIS
--   Supabase Dashboard -> your project -> SQL Editor -> New query
--   -> paste this whole file -> Run.
--   Safe to run more than once (everything is create-if-not-exists / or-replace).
--
-- SECURITY MODEL
--   RLS is ON with NO policies, so the anon and authenticated keys can read and
--   write nothing. Only the `service_role` key — used server-side by the
--   Cloudflare Worker — bypasses RLS. The service_role key must never reach the
--   browser.

-- ─────────────────────────────────────────────────────────────────────────────
-- donors — one row per transaction (a donation or a membership payment)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  name  text,
  email text,
  phone text,

  -- Monthly was dropped from the product; the site only offers these two.
  type text not null check (type in ('one_time', 'yearly')),

  amount_cents integer not null check (amount_cents >= 0),
  currency     text    not null default 'CAD',
  status       text,

  -- Membership window. Set for 'yearly'; null for one-off donations.
  membership_start date,
  membership_end   date,

  -- Was this the email's very first payment? Decided at insert time by looking
  -- for an earlier row with the same (lowercased) email.
  is_first_time boolean not null default true,
  -- created_at of that email's first ever row. Equals this row's created_at the
  -- first time, and is carried forward on every renewal.
  first_joined_at timestamptz,

  -- Did they use the student discount code?
  student_coupon boolean not null default false,

  square_customer_id     text,
  square_payment_id      text,
  square_subscription_id text,
  raw jsonb,

  -- Deliberately lenient: a bad date must not reject the row, because the
  -- Worker writes this best-effort and a rejected insert means a lost payment
  -- record.
  constraint donors_membership_window_ordered
    check (membership_end is null or membership_start is null or membership_end >= membership_start)
);

-- Widen an older install that still had the 'monthly' option or lacked the
-- membership columns. No-ops on a fresh database.
alter table public.donors add column if not exists membership_start  date;
alter table public.donors add column if not exists membership_end    date;
alter table public.donors add column if not exists is_first_time     boolean not null default true;
alter table public.donors add column if not exists first_joined_at   timestamptz;
alter table public.donors add column if not exists student_coupon    boolean not null default false;

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'donors_type_check' and conrelid = 'public.donors'::regclass
  ) then
    alter table public.donors drop constraint donors_type_check;
  end if;
  alter table public.donors
    add constraint donors_type_check check (type in ('one_time', 'yearly'));
exception
  when duplicate_object then null;
end $$;

create index if not exists donors_created_at_idx      on public.donors (created_at desc);
create index if not exists donors_email_idx           on public.donors (lower(email));
create index if not exists donors_membership_end_idx  on public.donors (membership_end desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- volunteers — one row per application
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.volunteers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name      text not null,
  email     text not null,
  phone     text,
  interests text,
  -- 'new' | 'contacted' | 'active' | 'inactive'
  status text not null default 'new'
);

create index if not exists volunteers_created_at_idx on public.volunteers (created_at desc);
create index if not exists volunteers_email_idx      on public.volunteers (lower(email));

-- ─────────────────────────────────────────────────────────────────────────────
-- members — one row per person, derived from donors.
--
-- "Who is a member right now, since when, and until when" is a question about a
-- person, not a transaction, so it is a view over donors rather than a second
-- table that could drift out of sync.
--
-- security_invoker = true makes the view run with the *caller's* rights, so it
-- inherits the RLS deny above. Without it a view runs as its owner and would
-- hand the data to anon.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.members with (security_invoker = true) as
with agg as (
  select
    lower(email)        as email,
    min(created_at)     as first_joined_at,
    max(created_at)     as last_payment_at,
    max(membership_end) as membership_end,
    count(*)            as payment_count,
    sum(amount_cents)   as total_cents
  from public.donors
  where email is not null and email <> ''
  group by lower(email)
),
latest as (
  select distinct on (lower(email))
    lower(email) as email,
    name,
    phone
  from public.donors
  where email is not null and email <> ''
  order by lower(email), created_at desc
)
select
  a.email,
  l.name,
  l.phone,
  a.first_joined_at,
  a.last_payment_at,
  a.membership_end,
  a.payment_count,
  a.total_cents,
  case
    when a.membership_end is null            then 'supporter'  -- only one-off gifts
    when a.membership_end >= current_date    then 'active'
    else                                          'expired'
  end as status
from agg a
join latest l on l.email = a.email;

-- ─────────────────────────────────────────────────────────────────────────────
-- Lock everything down
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.donors     enable row level security;
alter table public.volunteers enable row level security;
-- Intentionally no policies: anon/authenticated get nothing, service_role bypasses RLS.

-- Belt and braces on top of security_invoker. Wrapped because `anon` and
-- `authenticated` only exist on Supabase — this keeps the file runnable against
-- a plain Postgres too.
do $$
begin
  execute 'revoke all on public.members from anon, authenticated';
exception
  when undefined_object then null;
end $$;
