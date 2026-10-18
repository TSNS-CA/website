# Etkinlikler — Faz 2: site içi bilet satışı (Square) ve Supabase

Durum: **tasarım, uygulanmadı.** v1 (bu PR) etkinlikleri `src/content/events.js` içinde
statik tutar; bilet satışı `registration.mode = "external"` ile dış sayfaya (Zeffy) gider.
Bir sonraki ücretli etkinlikte aşağıdaki plan uygulanır. Bileşenler yalnızca
`getEvents / getEventBySlug / splitEvents / getFeatured / tierIsAvailable` adaptörlerini
kullandığı için veri kaynağı değişince UI'a dokunulmaz.

## 1. Veri: Supabase migration `0006_events.sql`

```sql
create table if not exists events (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  featured      boolean not null default false,
  status        text not null default 'scheduled' check (status in ('scheduled','cancelled','postponed')),
  title_tr      text not null,  title_en text not null,
  summary_tr    text,           summary_en text,
  description_tr text[],        description_en text[],
  start_at      timestamptz not null,
  end_at        timestamptz,
  timezone      text not null default 'America/Halifax',
  venue         jsonb,          -- {name, street, city, region, postalCode, mapUrl}
  registration  jsonb not null default '{"mode":"none"}',
  tiers         jsonb not null default '[]',
  program       jsonb,          -- [{time, title:{tr,en}, note?}]
  menu          jsonb,          -- {tr:[], en:[]}
  poster        jsonb,          -- {src, alt:{tr,en}}
  gallery       jsonb,
  tags          text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists event_registrations (
  id                uuid primary key default gen_random_uuid(),
  event_id          uuid not null references events(id) on delete restrict,
  contact_id        uuid not null references contacts(id) on delete restrict,
  tier_id           text not null,
  quantity          int  not null check (quantity > 0),
  amount_cents      int  not null check (amount_cents >= 0),
  currency          text not null default 'CAD',
  square_payment_id text unique,
  status            text not null default 'paid' check (status in ('paid','refunded','cancelled','rsvp')),
  raw               jsonb,
  created_at        timestamptz not null default now()
);

alter table activities drop constraint if exists activities_kind_check;
alter table activities add constraint activities_kind_check
  check (kind in ('membership','donation','volunteer_signup','event_ticket'));
alter table activities add column if not exists event_id uuid references events(id);

-- people görünümüne: event_ticket_count, last_event_at
-- RLS: açık, politika yok (yalnızca service_role); 0004'teki grant kalıbı tekrarlanır.
```

Public okuma için **anon'a tablo açılmaz**; `GET /api/events` Worker'da service_role ile
okur ve yalnızca yayınlanabilir alanları döner (5 dk edge cache).

## 2. API

### `GET /api/events` (`functions/api/events.js`)
`{ ok, events: Event[] }` — `src/content/events.js` ile aynı şekil. Frontend adaptörleri
`fetch` ile değiştirilir; `events.js`'teki seed, ilk import için `scripts/seed-events.mjs`
olur.

### `POST /api/event-checkout` (`functions/api/event-checkout.js`)
İstek: `{ eventSlug, tierId, quantity, name, email, phone?, lang, sourceId }`
(`sourceId` Square Web Payments SDK kart token'ı).

Sunucu adımları (istemciden gelen fiyata asla güvenilmez):
1. Etkinliği ve tier'ı veri kaynağından bul; `tierIsAvailable` ve `status === 'scheduled'`
   değilse `400`.
2. `amount = tier.priceCad * 100 * quantity`; kapasite varsa `event_registrations` toplamını
   kontrol et.
3. Square `createPayment` — `functions/api/create-payment.js` içindeki yardımcılar
   (idempotency key, locationId, hata eşleme) ortak `_lib/square.js`'e çıkarılır.
4. `upsertContact(env, {email, name, phone, lang})` → `event_registrations` insert →
   `recordActivity(env, contactId, { kind: 'event_ticket', event_id, amount_cents,
   square_payment_id })`.
5. Resend: `RESEND_TICKET_TEMPLATE_ID` ile bilet e-postası (etkinlik adı, tarih/saat Halifax,
   mekân, adet, tutar, `.ics` eki `src/lib/ics.js`'ten üretilir — modül tarayıcı API'si
   içermez, `downloadIcs` hariç). Adminlere `RESEND_ADMIN_TO` bildirimi.
6. Yanıt `201 { ok, registrationId }`; DB yazımı başarısızsa ödeme yine tamamlanmıştır →
   `warning: "not_stored"` + admin e-postasında kırmızı uyarı (mevcut kalıp).

### `POST /api/event-rsvp`
Ücretsiz etkinlikler için: `{ eventSlug, name, email, guests, lang }` → contact + registration
(`status:'rsvp'`, `amount_cents:0`) + onay e-postası.

## 3. UI

- `registration.mode === 'paid'`: detay sayfasındaki sağ kartta tier seçici + adet + ad/e-posta
  + `DonationCheckout.jsx`'teki Square kart formunun etkinlik varyantı (`EventCheckout.jsx`).
  Üye indirimi için `lookupPerson` ile e-postadan üyelik durumu bakılıp `audience:'member'`
  tier'ı açılabilir.
- `mode === 'rsvp'`: kısa form, "Yerimi ayır".
- Başarı sayfası `/etkinlikler/:slug/tesekkurler?ref=…` (ConfirmationPage kalıbı).
- Admin: v2'de Supabase Auth magic-link ile `/yonetim/etkinlikler` (2–3 yönetim kurulu
  üyesi); o zamana kadar etkinlikler SQL Editor / seed script ile girilir.

## 4. Ortam değişkenleri (yeni)
`RESEND_TICKET_TEMPLATE_ID`, `EVENTS_CACHE_TTL` (ops.), kapasite/iade politikası metni
`docs/SETUP.md`'ye eklenir.

## 5. Test listesi
Sandbox kartla ücretli bilet; erken dönem süresi geçmiş tier → 400; kapasite dolu → 409;
aynı `sourceId` ile tekrar → idempotent; RSVP; e-posta `.ics` Apple Calendar'da 6 Kas 19:00
Halifax; `people` görünümünde `event_ticket_count` artıyor.
