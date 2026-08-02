-- TSNS — kişi/olay ayrımına geçiş.
--
-- HOW TO RUN
--   Supabase Dashboard -> SQL Editor -> New query -> bu dosyanın tamamı -> Run.
--   0001'i çalıştırdıysan da çalıştırmadıysan da sorunsuz çalışır; eski
--   tablolardaki veri (varsa) yeni yapıya taşınır. Tekrar çalıştırmak zararsız.
--
-- NEDEN
--   Önce `donors` ve `volunteers` diye iki tablo vardı ve bölme "kişi ne yaptı"
--   eksenindeydi. Aynı insan hem gönüllü olup hem üye olduğunda iki tabloda iki
--   ayrı kayıt oluyor, aralarında hiçbir bağ kurulmuyordu: adı ve telefonu iki
--   yerde tekrar ediyor, biri güncellenince diğeri eskiyordu ve "bu gönüllü aynı
--   zamanda üye mi?" sorusunun güvenilir bir cevabı yoktu.
--
--   Hepsini tek tabloya koymak da çözüm değil: o zaman ya kişi bilgisi her ödeme
--   satırında tekrar eder, ya da ödeme geçmişini kaybederiz.
--
--   Doğru sınır "kişi" ile "olay" arasında:
--     contacts    -> insan başına BİR satır (kimlik: e-posta)
--     activities  -> olan her şey için bir satır (üyelik, bağış, gönüllü başvurusu)
--   Toplam iki tablo. Bir insanın kaç farklı rolü olursa olsun tek `contacts`
--   satırı vardır; roller `activities`'ten hesaplanır.

-- ─────────────────────────────────────────────────────────────────────────────
-- contacts — insan başına bir satır
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.contacts (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Kimlik. Her zaman küçük harf; aynı insanın ikinci bir satırı olamaz.
  -- "Gönüllü olan kişi sonradan üye olursa iki kayıt olmasın" garantisi tam
  -- olarak bu kısıt.
  email text not null unique check (email = lower(email) and email like '%_@_%._%'),

  name  text,
  phone text,

  -- İletişim dili — e-postaları hangi dilde göndereceğimizi biliyoruz.
  preferred_lang text not null default 'tr' check (preferred_lang in ('tr', 'en')),

  -- Gönüllü takibi kişiye ait bir durum, başvuruya değil: biri iki kez başvursa
  -- bile "şu an aktif gönüllü mü" tek bir cevabı olan sorudur.
  volunteer_status text check (volunteer_status in ('new', 'contacted', 'active', 'inactive')),

  notes text
);

create index if not exists contacts_created_at_idx on public.contacts (created_at desc);
create index if not exists contacts_volunteer_idx  on public.contacts (volunteer_status)
  where volunteer_status is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- activities — olan her şey, kronolojik
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  contact_id uuid not null references public.contacts (id) on delete cascade,

  -- 'membership'       -> yıllık üyelik ödemesi
  -- 'donation'         -> tek seferlik bağış
  -- 'volunteer_signup' -> gönüllü başvurusu
  kind text not null check (kind in ('membership', 'donation', 'volunteer_signup')),

  -- Para (gönüllü başvurusunda boş)
  amount_cents integer check (amount_cents >= 0),
  currency     text default 'CAD',
  status       text,

  -- Üyelik penceresi (yalnızca kind = 'membership')
  membership_start date,
  membership_end   date,
  student_coupon   boolean not null default false,

  -- Gönüllü başvurusunun içeriği (yalnızca kind = 'volunteer_signup')
  interests text,

  square_customer_id     text,
  square_payment_id      text,
  square_subscription_id text,
  raw jsonb,

  -- Tek tabloda üç tür olay tutmanın bedeli, ilgisiz kolonların boş kalması.
  -- Bu kısıtlar o boşlukların anlamlı kalmasını sağlıyor: her tür yalnızca
  -- kendi alanlarını taşıyabiliyor.
  constraint activities_money_matches_kind check (
    (kind = 'volunteer_signup' and amount_cents is null)
    or (kind in ('membership', 'donation') and amount_cents is not null)
  ),
  constraint activities_window_only_for_membership check (
    kind = 'membership'
    or (membership_start is null and membership_end is null)
  ),
  constraint activities_window_ordered check (
    membership_end is null or membership_start is null or membership_end >= membership_start
  ),
  constraint activities_interests_only_for_volunteer check (
    kind = 'volunteer_signup' or interests is null
  )
);

create index if not exists activities_contact_idx    on public.activities (contact_id, created_at desc);
create index if not exists activities_kind_idx       on public.activities (kind, created_at desc);
create index if not exists activities_membership_idx on public.activities (membership_end desc)
  where kind = 'membership';

-- updated_at'i elle güncellemeyi unutmayalım diye trigger
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists contacts_touch_updated_at on public.contacts;
create trigger contacts_touch_updated_at
  before update on public.contacts
  for each row execute function public.touch_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Eski tablolardan veri taşıma (0001'i çalıştırdıysan)
-- ─────────────────────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.donors') is not null then
    insert into public.contacts (email, name, phone, created_at)
    select lower(email), max(name), max(phone), min(created_at)
    from public.donors
    where email is not null and email <> ''
    group by lower(email)
    on conflict (email) do nothing;

    insert into public.activities (
      contact_id, created_at, kind, amount_cents, currency, status,
      membership_start, membership_end, student_coupon,
      square_customer_id, square_payment_id, square_subscription_id, raw
    )
    select c.id, d.created_at,
           case when d.type = 'yearly' then 'membership' else 'donation' end,
           d.amount_cents, d.currency, d.status,
           case when d.type = 'yearly' then d.membership_start end,
           case when d.type = 'yearly' then d.membership_end   end,
           coalesce(d.student_coupon, false),
           d.square_customer_id, d.square_payment_id, d.square_subscription_id, d.raw
    from public.donors d
    join public.contacts c on c.email = lower(d.email)
    where d.email is not null and d.email <> '';
  end if;

  if to_regclass('public.volunteers') is not null then
    insert into public.contacts (email, name, phone, volunteer_status, created_at)
    select lower(email), max(name), max(phone), 'new', min(created_at)
    from public.volunteers
    group by lower(email)
    -- Aynı kişi hem donors hem volunteers'ta olabilir. Çakışınca yeni satır
    -- açmıyoruz; sadece eksik kalan alanları dolduruyoruz.
    on conflict (email) do update
      set volunteer_status = coalesce(public.contacts.volunteer_status, 'new'),
          name             = coalesce(public.contacts.name,  excluded.name),
          phone            = coalesce(public.contacts.phone, excluded.phone),
          created_at       = least(public.contacts.created_at, excluded.created_at);

    insert into public.activities (contact_id, created_at, kind, interests)
    select c.id, v.created_at, 'volunteer_signup', v.interests
    from public.volunteers v
    join public.contacts c on c.email = lower(v.email);
  end if;
end $$;

drop view  if exists public.members;
drop table if exists public.donors;
drop table if exists public.volunteers;

-- ─────────────────────────────────────────────────────────────────────────────
-- people — her kişi için tek satır özet: rolleri, üyeliği, ne kadar verdiği
--
-- `member_type` tek bir etiket ister, ama bir insan aynı anda hem gönüllü hem
-- üye olabiliyor; tek değerli bir kolon bunu anlatamaz. Bu yüzden hem gerçeği
-- kaybetmeyen `roles` dizisi ve boolean'lar, hem de listede/filtrede rahat
-- kullanılsın diye öncelik sırası belli tek bir `member_type` üretiliyor.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace view public.people with (security_invoker = true) as
with act as (
  select
    contact_id,
    min(created_at)                                       as first_activity_at,
    max(created_at)                                       as last_activity_at,
    max(created_at) filter (where kind = 'membership')    as last_membership_at,
    max(membership_end) filter (where kind = 'membership') as membership_end,
    min(created_at) filter (where kind = 'membership')    as first_membership_at,

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

  -- Kayıt tarihi: ilk olayı varsa o, yoksa kaydın kendisi.
  least(c.created_at, coalesce(a.first_activity_at, c.created_at)) as first_seen_at,
  a.last_activity_at,
  a.first_membership_at,
  a.last_membership_at,
  a.membership_end,

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

  -- Roller — biri diğerini dışlamıyor.
  (a.membership_end is not null and a.membership_end >= current_date) as is_member,
  (a.membership_end is not null and a.membership_end <  current_date) as was_member,
  (c.volunteer_status is not null and c.volunteer_status <> 'inactive') as is_volunteer,
  (coalesce(a.donation_count, 0) > 0)                                   as is_donor,

  array_remove(array[
    case when a.membership_end >= current_date                       then 'member'        end,
    case when a.membership_end <  current_date                       then 'former_member' end,
    case when c.volunteer_status is not null
          and c.volunteer_status <> 'inactive'                       then 'volunteer'     end,
    case when coalesce(a.donation_count, 0) > 0                      then 'donor'         end
  ], null) as roles,

  -- Tek etiket isteyen yerler için, öncelik sırası:
  -- aktif üye > gönüllü > eski üye > bağışçı > (sadece kayıtlı kişi)
  case
    when a.membership_end >= current_date                              then 'member'
    when c.volunteer_status is not null and c.volunteer_status <> 'inactive' then 'volunteer'
    when a.membership_end is not null                                  then 'former_member'
    when coalesce(a.donation_count, 0) > 0                             then 'donor'
    else                                                                    'contact'
  end as member_type
from public.contacts c
left join act a on a.contact_id = c.id;

-- Geriye dönük kolaylık: sadece üyelik ilişkisi olanlar.
create or replace view public.members with (security_invoker = true) as
select * from public.people
where membership_end is not null;

-- ─────────────────────────────────────────────────────────────────────────────
-- Kilit
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.contacts   enable row level security;
alter table public.activities enable row level security;
-- Bilerek hiç policy yok: anon/authenticated hiçbir şey göremez,
-- yalnızca service_role (Worker) RLS'i bypass eder.

do $$
begin
  execute 'revoke all on public.people, public.members from anon, authenticated';
exception
  when undefined_object then null;
end $$;
