# tsns.ca — Nova Scotia Türk Derneği

Turkish Society of Nova Scotia web sitesi: etkinlikler, fotoğraf arşivi, yeni
gelenler rehberi, üyelik/bağış ödemeleri, gönüllü ve bülten kayıtları.
Canlı: **https://tsns.ca**

*The website of the Turkish Society of Nova Scotia. Turkish is the primary
language; English is available via the TR/EN toggle.*

## Teknoloji

| Katman | Kullanılan |
| --- | --- |
| Frontend | React 18, Vite 5, Tailwind 3 (JSX), react-router v7 |
| API | Cloudflare Worker — `functions/` (Pages tarzı dosya yönlendirme) tek Worker'a derlenir |
| Barındırma | Cloudflare Workers + statik asset'ler, `main`'e merge'de otomatik deploy |
| Ödeme | Square Web Payments (kart + Apple Pay), yıllık abonelik |
| Veritabanı | Supabase (yalnızca Worker'dan, `service_role` ile; RLS açık, politika yok) |
| E-posta | Resend (onay şablonları + iç bildirimler) |
| Bot koruması | Cloudflare Turnstile + Workers Rate Limiting |

## Hızlı başlangıç

Node sürümü `.nvmrc`'de.

```bash
npm install
```

Yalnızca arayüz (`/api/*` çalışmaz):

```bash
npm run dev
```

Arayüz + API birlikte (önce `.dev.vars` oluştur, değişkenler `.env.example`'da):

```bash
npm run dev:api
```

Deploy öncesi kontrol — bu temiz geçmeli (lint/test yok):

```bash
npm run build:cf
```

## Proje yapısı

```
src/
  pages/            Sayfalar (Home, Events, EventDetail, Photos, Album, Newcomers,
                    Donate, Volunteer, Contact, About, ConfirmationPage)
  components/       Header, Footer, DonationCheckout (Square), Turnstile, ui.jsx …
  content/          Etkinlik, fotoğraf ve yeni gelenler verisi ({ tr, en })
  lib/              Tarih (America/Halifax), tema, .ics, sayfa meta
  i18n.js           Arayüz metinleri (tr / en)
functions/
  api/              create-payment, create-subscription, coupon, volunteer, newsletter
  _lib/             supabase, email/resend, guard (hız sınırı + Turnstile), og, time
  etkinlikler/ …    Paylaşım önizlemeleri için sunucu tarafı Open Graph
supabase/migrations/  SQL Editor'da elle çalıştırılan, idempotent migration'lar
docs/               SETUP.md (kurulum), e-posta şablonları, yol haritası
public/             Görseller, afişler, fotoğraf arşivi, _headers
wrangler.toml       Worker, asset ve hız sınırı yapılandırması
```

## API uçları

| Uç | İş | Koruma |
| --- | --- | --- |
| `POST /api/create-payment` | Tek seferlik bağış (min $10, bir yıllık üyelik verir) | Hız sınırı + Turnstile |
| `POST /api/create-subscription` | Yıllık üyelik (Square müşteri → kart → abonelik) | Hız sınırı + Turnstile |
| `POST /api/coupon` | Öğrenci kuponu ön kontrolü ($5/yıl) | Hız sınırı |
| `POST /api/volunteer` | Gönüllü başvurusu + onay e-postası | Hız sınırı (IP + e-posta) + Turnstile |
| `POST /api/newsletter` | Bülten kaydı | Hız sınırı (IP + e-posta) + Turnstile |

## Yapılandırma

Tüm değişkenler `.env.example`'da açıklamalı olarak listeli. İki ayrı yer var:

- **Runtime** (Cloudflare → Settings → Variables and Secrets): `SQUARE_*`,
  `SUPABASE_*`, `RESEND_*`, `STUDENT_COUPON_CODES`, `TURNSTILE_SECRET_KEY`.
- **Build** (Settings → Build → Build variables): `VITE_*` ile başlayanlar —
  build sırasında JS'e gömülür, tarayıcıda görünür; gizli bir şey koyma.

Repo herkese açık: `wrangler.toml`'a ya da koda asla anahtar yazma.

Adım adım kurulum, panel ayarları, Square/Resend/Supabase/Turnstile ve sorun
giderme: **[docs/SETUP.md](docs/SETUP.md)**.

## Katkı

- `main`'den branch aç (`feat/`, `fix/`, `chore/`, `docs/`), Conventional
  Commits, PR → `main`. Merge edilince otomatik deploy olur.
- Branch preview URL'leri kapalı: preview'lar production anahtarlarını
  kullanır. Ödemeleri yerelde `npm run dev:api` ve Square sandbox ile test et.
- Kod kuralları (Türkçe metinler, `upper()`, Halifax saat dilimi, dark mode,
  yeni sayfa/afiş/albüm ekleme): **[CLAUDE.md](CLAUDE.md)**.
