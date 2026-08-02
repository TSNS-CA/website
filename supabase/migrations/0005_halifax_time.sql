-- TSNS — gorunumleri Halifax saatine gore hesapla.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> bu dosyanin tamami -> Run.
--   Idempotent: tekrar calistirmak zararsiz.
--
-- NEDEN
--   Iki ayri sorun var, biri gercek biri degil.
--
--   DEGIL: contacts.created_at gibi timestamptz sutunlar mutlak ani tutar.
--   Halifax'ta 06:33 ile UTC'de 09:33 ayni andir; Supabase paneli sadece UTC
--   gosteriyor. Saklamayi yerel saate cevirmek yanlis olur — yaz saati
--   gecislerinde ayni saat iki kez yasanir ve siralama bozulur.
--
--   GERCEK: current_date, oturumun saat dilimini kullanir ve Supabase'de o da
--   UTC. Halifax yazin UTC-3, kisin UTC-4. Yani her aksam 20:00/21:00'den
--   sonra Postgres icin ertesi gun baslamis oluyor ve o saatlerde
--   `membership_end >= current_date` kiyasi, o gun biten bir uyeligi
--   suresi dolmus sayiyor. Uye hala 2 Agustos'u yasarken sistem 3 Agustos'a
--   gecmis oluyor.
--
-- NE YAPIYORUZ
--   1) today_local(): Halifax takviminde bugun. Kiyaslar bunu kullanir.
--   2) Insanin okudugu gorunumlerde (people, subscribers) zaman damgalarini
--      Halifax yerel saatine cevirip gosteriyoruz. Ham tablolar UTC kalir —
--      dogru olan o. Panelde yerel saat gormek icin `people` gorunumune bak,
--      `contacts` tablosuna degil.

create or replace function public.today_local() returns date
language sql
stable
as $$ select (now() at time zone 'America/Halifax')::date $$;

grant execute on function public.today_local() to service_role;

-- people ve members'i yeniden kur. create or replace sutun sirasini korumayi
-- gerektirir ve sutun tipleri degistigi icin hata verir; once drop ediyoruz
-- (members ona bagli, o da gider), sonra ikisini de kuruyoruz.
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
  -- Zaman damgalari Halifax yerel saatinde. Saklanan deger degismiyor.
  (least(c.created_at, coalesce(a.first_activity_at, c.created_at)) at time zone 'America/Halifax') as first_seen_at,
  (a.last_activity_at      at time zone 'America/Halifax') as last_activity_at,
  (a.first_membership_at   at time zone 'America/Halifax') as first_membership_at,
  (a.last_membership_at    at time zone 'America/Halifax') as last_membership_at,
  (a.first_donation_at     at time zone 'America/Halifax') as first_donation_at,
  (a.last_donation_at      at time zone 'America/Halifax') as last_donation_at,
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
  (c.newsletter_subscribed_at at time zone 'America/Halifax') as newsletter_subscribed_at,
  (a.membership_end is not null and a.membership_end >= public.today_local()) as is_member,
  (a.membership_end is not null and a.membership_end <  public.today_local()) as was_member,
  (c.volunteer_status is not null and c.volunteer_status <> 'inactive') as is_volunteer,
  (coalesce(a.donation_count, 0) > 0)                                   as is_donor,
  array_remove(array[
    case when a.membership_end >= public.today_local()                then 'member'        end,
    case when a.membership_end <  public.today_local()                then 'former_member' end,
    case when c.volunteer_status is not null
          and c.volunteer_status <> 'inactive'                       then 'volunteer'     end,
    case when coalesce(a.donation_count, 0) > 0                      then 'donor'         end,
    case when c.newsletter_subscribed                                 then 'subscriber'    end
  ], null) as roles,
  case
    when a.membership_end >= public.today_local()
     and a.yearly_end is not null
     and (a.donation_end is null or a.yearly_end >= a.donation_end)         then 'member'
    when a.membership_end >= public.today_local()                           then 'donor'
    when c.volunteer_status is not null and c.volunteer_status <> 'inactive' then 'volunteer'
    when a.membership_end is not null                                       then 'former_member'
    when coalesce(a.donation_count, 0) > 0                                  then 'donor'
    when c.newsletter_subscribed                                            then 'subscriber'
    else                                                                         'contact'
  end as member_type
from public.contacts c
left join act a on a.contact_id = c.id;

create view public.members with (security_invoker = true) as
select * from public.people
where membership_end is not null;

create or replace view public.subscribers with (security_invoker = true) as
select
  id,
  email,
  name,
  preferred_lang,
  (newsletter_subscribed_at at time zone 'America/Halifax') as newsletter_subscribed_at
from public.contacts
where newsletter_subscribed
order by newsletter_subscribed_at desc;

do $$
begin
  execute 'revoke all on public.subscribers from anon, authenticated';
exception
  when undefined_object then null;
end $$;

-- 0004'teki grant'lar mevcut nesnelere verilmisti; bu gorunumler yeniden
-- olusturuldugu icin tekrar veriyoruz.
grant all privileges on public.people, public.members, public.subscribers to service_role;
