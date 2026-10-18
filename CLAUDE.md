# CLAUDE.md — tsns.ca

Turkish Society of Nova Scotia web sitesi. React 18 + Vite 5 + Tailwind 3 (JSX, TypeScript yok),
react-router v7, Cloudflare Worker (`functions/api/*.js`), Supabase (yalnızca service_role),
Square Web Payments (üyelik/bağış), Resend (e-posta). Canlı: https://tsns.ca

## Komutlar

- `npm run dev` — Vite (sadece frontend, `/api/*` çalışmaz)
- `npm run build:cf` — Vite build + `functions/` → `worker/index.js`
- `npm run dev:api` — `build:cf` sonrası `wrangler dev` (frontend + API birlikte; `.dev.vars` gerekir)
- Lint/test yok. **Bitirmeden önce `npm run build:cf` temiz geçmeli.**

## Deploy

Cloudflare **Workers Builds**, `main`'e merge olunca otomatik deploy eder (GitHub Actions yok).
Branch preview URL'leri açık. Runtime değişkenleri dashboard'da; `wrangler.toml`'a asla secret
yazma — repo public. `keep_vars = true` dashboard değerlerini korur.

## Kurallar

- **Türkçe birincil dil.** Metinler `src/i18n.js` (düz anahtarlar, `t(lang, key)`) ya da
  `src/content/*.js` (`{ tr, en }` nesneleri, `x[lang]`) içinde. Bileşene sabit metin yazma.
- Büyük harf için CSS `uppercase` **kullanma**; `upper(lang, text)` kullan (Türkçe İ/ı ve
  `LATIN_NAMES` koruması). Yeni yabancı yer adı geçiyorsa `LATIN_NAMES`'e ekle.
- **Tüm tarihler `America/Halifax`.** `src/lib/dates.js` (`zonedToDate`, `fmtDate`, `isPast`)
  kullan; asla `new Date("YYYY-MM-DDTHH:mm")` (izleyici yereline göre çözümlenir).
- Dark mode `class` tabanlı; her yeni yüzeyde `dark:` çifti zorunlu. Lacivert metin için
  `text-brand`, kırmızı metin için `text-brand-red`, kırmızı yüzey için `surface-red`.
- UI ilkelleri `src/components/ui.jsx` (`Section`, `Container`, `Eyebrow`, `SectionHeading`,
  `Button`, `Card`). Sayfalar `export default function XPage({ lang })`.
- Rotalar `src/App.jsx`'te. Türkçe yollar kanonik (`/etkinlikler`, `/yeni-gelenler`,
  `/bagis`, `/uye-ol`, `/gonullu`); İngilizce takma adlar `Navigate` ile yönlendirilir.
  Worker `not_found_handling = "single-page-application"` olduğu için yeni SPA rotası config
  gerektirmez; `/api/*` `run_worker_first` ile Worker'a gider.
- Etkinlik verisi `src/content/events.js`; bileşenler yalnızca `getEvents/getEventBySlug/
  splitEvents/getFeatured` adaptörlerini çağırır (Faz 2'de Supabase'e geçiş için).
- Fotoğraf arşivi `src/content/photos.js` (albüm = etkinlik; `public/photos/<slug>/NN.jpg` ≤1600 px +
  `NN-t.jpg` 480 px, EXIF/GPS temizlenmiş; `w/h` gerçek boyut — masonry için şart). Yeni albüm:
  görselleri iki boyutta kaydet, kayıt ekle, kategori seç; sayfa/OG kendiliğinden güncellenir.
- **Paylaşım önizlemesi (WhatsApp/Facebook):** botlar JS çalıştırmaz. `functions/_lib/og.js`
  etkinlik ve yeni gelenler sayfalarında index.html'i HTMLRewriter ile sunucu tarafında
  og:/twitter: etiketleriyle zenginleştirir; bu yollar `wrangler.toml` `run_worker_first`
  listesinde olmalı. Yeni bir SEO'lu sayfa eklersen: `functions/<yol>.js` + `metaForPath`
  + `run_worker_first`. Yeni afiş eklersen `IMAGE_DIMS`'e boyutunu yaz; og:image < 300 KB tut.
- Supabase migration'ları `supabase/migrations/` altında, idempotent, SQL Editor'da elle
  çalıştırılır. Tarayıcı Supabase'e doğrudan konuşmaz; her şey Worker üzerinden.
- API rotaları: `onRequestPost({ request, env })`, `400 {ok:false,error}` / `201 {ok:true}`;
  DB hataları yutulur ve `warning:"not_stored"` döner — bkz. `functions/_lib/supabase.js`.

## Git

`main`'den branch aç (`feat/`, `fix/`, `chore/`, `docs/`), Conventional Commits, PR → `main`.
Commit mesajlarına "Generated with Claude Code" / "Co-Authored-By" satırı ekleme.

Kurulum rehberi ve panel ayarları için `docs/SETUP.md`.
