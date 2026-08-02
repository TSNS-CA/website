-- TSNS — newsletter subscriptions.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> bu dosyanin tamami -> Run.
--   Idempotent: tekrar calistirmak zararsiz.
--
-- NEDEN
--   "Bültene Abone Ol" formu eskiden hicbir yere bagli degildi. Simdi contacts
--   tablosuna bir flag ekliyoruz: bulten aboneligi kisi ozelligi, ayri tablo degil.
--   Abone olan biri daha once uye/gonullu/bagisciysa AYNI kisi guncellenir.

alter table public.contacts add column if not exists newsletter_subscribed   boolean not null default false;
alter table public.contacts add column if not exists newsletter_subscribed_at timestamptz;

create index if not exists contacts_newsletter_idx
  on public.contacts (newsletter_subscribed)
  where newsletter_subscribed;

-- people görünümüne newsletter durumu eklensin. create or replace, sütun
-- sırasını korumayı gerektirir; sıra farklıysa hata verir. Bu yüzden önce
-- drop ediyoruz (members onun üzerinden tanımlı, o da gider), sonra ikisini de
-- newsletter sütunlarıyla yeniden oluşturuyoruz.
drop view if exists public.members;
drop view if exists public.people;
create view public.people with (security_invoker = true) as
with act as (
  select
    contact_id,
    min(created_at)                                       as first_activity_at,
    max(created_at)                                       as last_activity_at,
    max(created_at) filter (where kind = 'membership')    as last_membership_at,
    min(created_at) filter (where kind = 'membership')    as first_membership_at,
    min(created_at) filter (where kind = 'donation')      as first_donation_at,
    max(created_at) filter (where kind = 'donation')      as last_donation_at,
    max(membership_end) filter (where kind = 'membership') as yearly_end,
    max(membership_end) filter (where kind = 'donation')   as donation_end,
    max(membership_end)                                    as membership_end,
    count(*) filter (where kind in ('membership', 'donation')) as payment_count,
    count(*) filter (where kind = 'membership')                as membership_count,
    count(*) filter (where kind = 'donation')                  as donation_count,
    count(*) filter (where kind = 'volunteer_signup')          as volunteer_signup_count,
    greatest(count(*) filter (where kind = 'membership') - 1, 0) as renewal_count,
    coalesce(sum(amount_cents), 0)                                    as total_cents,
    coalesce(sum(amount_cents) filter (where kind = 'membership'), 0) as membership_cents,
    coalesce(sum(amount_cents) filter (where kind = 'donation'), 0)   as donation_cents,
    max(amount_cents)                                                 as largest_payment_cents,
    bool_or(student_coupon)                                           as ever_used_student_discount
  from public.activities
  group by contact_id
)
select
  c.id,
  c.email,
  c.name,
  c.phone,
  c.preferred_lang,
  c.notes,
  least(c.created_at, coalesce(a.first_activity_at, c.created_at)) as first_seen_at,
  a.last_activity_at,
  a.first_membership_at,
  a.last_membership_at,
  a.first_donation_at,
  a.last_donation_at,
  a.membership_end,
  case
    when a.membership_end is null then null
    when a.yearly_end is not null
     and (a.donation_end is null or a.yearly_end >= a.donation_end) then 'yearly'
    else 'one_time'
  end as membership_kind,
  case
    when a.membership_end is null then false
    else a.yearly_end is not null
     and (a.donation_end is null or a.yearly_end >= a.donation_end)
  end as membership_auto_renews,
  coalesce(a.payment_count, 0)          as payment_count,
  coalesce(a.membership_count, 0)       as membership_count,
  coalesce(a.renewal_count, 0)          as renewal_count,
  coalesce(a.donation_count, 0)         as donation_count,
  coalesce(a.volunteer_signup_count, 0) as volunteer_signup_count,
  coalesce(a.total_cents, 0)       as total_cents,
  coalesce(a.membership_cents, 0)  as membership_cents,
  coalesce(a.donation_cents, 0)    as donation_cents,
  a.largest_payment_cents,
  round(coalesce(a.total_cents, 0)      / 100.0, 2) as total_cad,
  round(coalesce(a.membership_cents, 0) / 100.0, 2) as membership_cad,
  round(coalesce(a.donation_cents, 0)   / 100.0, 2) as donation_cad,
  coalesce(a.ever_used_student_discount, false)     as ever_used_student_discount,
  c.volunteer_status,
  c.newsletter_subscribed,
  c.newsletter_subscribed_at,
  (a.membership_end is not null and a.membership_end >= current_date) as is_member,
  (a.membership_end is not null and a.membership_end <  current_date) as was_member,
  (c.volunteer_status is not null and c.volunteer_status <> 'inactive') as is_volunteer,
  (coalesce(a.donation_count, 0) > 0)                                   as is_donor,
  array_remove(array[
    case when a.membership_end >= current_date                       then 'member'        end,
    case when a.membership_end <  current_date                       then 'former_member' end,
    case when c.volunteer_status is not null
          and c.volunteer_status <> 'inactive'                       then 'volunteer'     end,
    case when coalesce(a.donation_count, 0) > 0                      then 'donor'         end,
    case when c.newsletter_subscribed                                 then 'subscriber'    end
  ], null) as roles,
  case
    when a.membership_end >= current_date
     and a.yearly_end is not null
     and (a.donation_end is null or a.yearly_end >= a.donation_end)         then 'member'
    when a.membership_end >= current_date                                   then 'donor'
    when c.volunteer_status is not null and c.volunteer_status <> 'inactive' then 'volunteer'
    when a.membership_end is not null                                       then 'former_member'
    when coalesce(a.donation_count, 0) > 0                                  then 'donor'
    when c.newsletter_subscribed                                            then 'subscriber'
    else                                                                         'contact'
  end as member_type
from public.contacts c
left join act a on a.contact_id = c.id;

-- members view'ı people üzerinden yeniden (0002'de tanımlıydı, yukarıdaki
-- drop nedeniyle gitti).
create view public.members with (security_invoker = true) as
select * from public.people
where membership_end is not null;

-- Newsletter abonelerini listelemek için pratik bir görünüm.
create or replace view public.subscribers with (security_invoker = true) as
select id, email, name, preferred_lang, newsletter_subscribed_at
from public.contacts
where newsletter_subscribed
order by newsletter_subscribed_at desc;

do $$
begin
  execute 'revoke all on public.subscribers from anon, authenticated';
exception
  when undefined_object then null;
end $$;

