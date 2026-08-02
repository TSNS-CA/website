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

  -- NOTE: "when did this person first join" and "is this their first payment"
  -- are facts about a *person*, not about a transaction, and both are already
  -- implied by the rows themselves (the earliest row for that email). Storing
  -- them per row would duplicate a constant and — worse — could disagree with
  -- reality if the lookup that computes them ever failed. They live in the
  -- `members` view below instead.

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

-- Bring an older install up to date. No-ops on a fresh database.
alter table public.donors add column if not exists membership_start date;
alter table public.donors add column if not exists membership_end   date;
alter table public.donors add column if not exists student_coupon   boolean not null default false;

-- Drop the per-row copies of the per-person facts (see the note above).
drop view if exists public.members;
alter table public.donors drop column if exists is_first_time;
alter table public.donors drop column if exists first_joined_at;

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
    lower(email)    as email,

    -- Constant per person: the earliest row we have for this email.
    min(created_at) as first_joined_at,
    max(created_at) as last_payment_at,
    max(created_at) filter (where type = 'yearly') as last_membership_at,
    max(membership_end)                            as membership_end,

    -- How many times have they paid, and how many of those were memberships?
    count(*)                                    as payment_count,
    count(*) filter (where type = 'yearly')     as membership_count,
    count(*) filter (where type = 'one_time')   as donation_count,
    -- The first yearly payment is the join; every one after it is a renewal.
    greatest(count(*) filter (where type = 'yearly') - 1, 0) as renewal_count,

    -- How much have they given, split by what it was for. `filter` can return
    -- null when there are no matching rows, so coalesce to 0 for clean sums.
    coalesce(sum(amount_cents), 0)                                     as total_cents,
    coalesce(sum(amount_cents) filter (where type = 'yearly'), 0)      as membership_cents,
    coalesce(sum(amount_cents) filter (where type = 'one_time'), 0)    as donation_cents,
    max(amount_cents)                                                  as largest_payment_cents,

    bool_or(student_coupon) as ever_used_student_discount
  from public.donors
  where email is not null and email <> ''
  group by lower(email)
),
latest as (
  -- Name and phone as of their most recent payment.
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
  a.last_membership_at,
  a.membership_end,

  a.payment_count,
  a.membership_count,
  a.renewal_count,
  a.donation_count,

  a.total_cents,
  a.membership_cents,
  a.donation_cents,
  a.largest_payment_cents,
  -- Same numbers in dollars, so the dashboard is readable without mental math.
  round(a.total_cents      / 100.0, 2) as total_cad,
  round(a.membership_cents / 100.0, 2) as membership_cad,
  round(a.donation_cents   / 100.0, 2) as donation_cad,

  a.ever_used_student_discount,

  case
    when a.membership_end is null         then 'supporter'  -- only one-off gifts
    when a.membership_end >= current_date then 'active'
    else                                       'expired'
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
