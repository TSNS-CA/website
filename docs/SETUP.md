# tsns.ca — Kurulum ve Operasyon Rehberi

Bu doküman **senin panellerde yapman gereken** adımları anlatır. Koddaki her şey
zaten hazır; aşağıdaki değişkenler girilmediğinde ilgili özellik sessizce devre
dışı kalır (ödeme/gönüllü akışı çökmez, sadece e-posta veya kayıt atlanır).

Sıra önemli: **1) Supabase → 2) Resend → 3) Square Sandbox → 4) Cloudflare →
5) Apple Pay → 6) Square Production.**

---

## 0. Mimari — nerede ne çalışıyor

| Katman | Nerede | Not |
| --- | --- | --- |
| Statik site | Cloudflare Pages (`dist/`) | `VITE_*` değişkenleri **build sırasında** gömülür |
| API | Cloudflare Pages Functions (`functions/api/*`) | `SQUARE_*`, `SUPABASE_*`, `RESEND_*` **runtime**'da okunur |
| Veritabanı | Supabase (`donors`, `volunteers`) | Sadece `service_role` erişir, RLS kapalı-erişim |
| Ödeme | Square (Web Payments SDK + Payments/Subscriptions API) | Apple Pay dahil |
| E-posta | Resend | Üye/bağışçı makbuzu, gönüllü onayı, yönetim bildirimi |

Uç noktalar:

- `POST /api/volunteer` — gönüllü kaydı + onay e-postası + yönetim bildirimi
- `POST /api/create-payment` — tek seferlik bağış
- `POST /api/create-subscription` — yıllık üyelik (abonelik)
- `POST /api/coupon` — öğrenci indirim kodu doğrulama

---

## 1. Supabase

1. [supabase.com](https://supabase.com) → **New project**.
   - Region: **East US (North Virginia)** veya **Canada** — Halifax'a en yakını seç.
   - Database password'ü bir parola yöneticisine kaydet.
2. Proje açıldıktan sonra **SQL Editor** → **New query** → şu dosyanın içeriğini
   yapıştır ve çalıştır:

   ```
   supabase/migrations/0001_donors_volunteers.sql
   ```

   Bu, `donors` ve `volunteers` tablolarını oluşturur ve **RLS'i policy'siz**
   açar: `anon`/`authenticated` anahtarlarıyla hiç kimse okuyamaz/yazamaz,
   yalnızca sunucu tarafındaki `service_role` erişir.
3. **Project Settings → API** sayfasından şunları al:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` **secret** anahtarı → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ `service_role` anahtarı RLS'i tamamen bypass eder. Asla `VITE_` önekiyle
> tanımlama, asla frontend'e koyma, asla repoya commit'leme. Sadece Cloudflare
> environment variable'ı olarak yaşamalı.

**Kontrol:** Table Editor'da `donors` ve `volunteers` tabloları görünüyor mu?

---

## 2. Resend (e-posta)

Kod Resend'in **REST API**'sini `fetch` ile çağırıyor
(`functions/_lib/email.js`). Cloudflare Workers ortamında Node SDK'sı gerekmez —
ayrı bir paket kurmana **gerek yok**, dolayısıyla "hangi dil?" sorusunun cevabı:
zaten HTTP/REST kullanıyoruz, hazır.

### 2.1 Domain doğrulama

1. Resend → **Domains** → `tsns.ca` (eklediğini söylemiştin).
2. Resend'in gösterdiği DNS kayıtlarını **Cloudflare DNS**'e ekle:
   - **MX** (`send.tsns.ca` gibi bir alt alan için) → Resend'in verdiği host
   - **TXT (SPF)** → `v=spf1 include:amazonses.com ~all`
   - **TXT (DKIM)** → `resend._domainkey` → Resend'in verdiği uzun anahtar
   - (Önerilen) **TXT (DMARC)** → `_dmarc` → `v=DMARC1; p=none; rua=mailto:info@tsns.ca`
3. ⚠️ Cloudflare'de bu kayıtları eklerken **proxy'yi kapat (gri bulut)**.
   DNS-only olmalı; turuncu bulut e-posta doğrulamasını bozar.
4. Resend'de **Verify** → "Verified" olana kadar bekle (genelde birkaç dakika).

### 2.2 API anahtarı

Resend → **API Keys** → **Create API Key**
- İzin: **Sending access**
- Domain: `tsns.ca`
- Çıkan `re_...` değerini `RESEND_API_KEY` olarak sakla.

### 2.3 Değişkenler

| Değişken | Örnek | Zorunlu |
| --- | --- | --- |
| `RESEND_API_KEY` | `re_...` | evet |
| `RESEND_FROM` | `Nova Scotia Türk Derneği <info@tsns.ca>` | evet |
| `RESEND_REPLY_TO` | `info@tsns.ca` | hayır |
| `RESEND_ADMIN_TO` | `info@tsns.ca,baskan@tsns.ca` | hayır |

`RESEND_FROM` içindeki domain **doğrulanmış domain olmak zorunda**, yoksa Resend
403 döner.

### 2.4 Hangi e-posta ne zaman gider

| Tetikleyici | Kime | İçerik |
| --- | --- | --- |
| Gönüllü formu | Gönüllüye | "Başvurun alındı" + verdiği bilgiler (TR/EN) |
| Gönüllü formu | `RESEND_ADMIN_TO` | Yeni gönüllü bildirimi, `Reply-To` = gönüllü |
| Tek seferlik bağış | Bağışçıya | Makbuz + Square receipt linki |
| Tek seferlik bağış | `RESEND_ADMIN_TO` | Yeni bağış bildirimi |
| Yıllık üyelik | Üyeye | Üyelik onayı + bitiş tarihi |
| Yıllık üyelik | `RESEND_ADMIN_TO` | Yeni üyelik bildirimi (kupon kullanıldı mı dahil) |

Dil, kullanıcının sitedeki dil tercihinden (`tr` / `en`) geliyor. E-postalar
`waitUntil` ile **yanıttan sonra** gönderiliyor; form anında dönüyor, Resend
yavaşlarsa kullanıcı beklemiyor. Resend hata verirse ödeme/kayıt yine başarılı
sayılır, hata Cloudflare loglarına düşer.

**Kontrol:** `/gonullu` formunu kendi adresinle doldur → hem sana hem
`RESEND_ADMIN_TO` adresine mail gelmeli. Gelmezse Resend → **Logs** sekmesine bak.

---

## 3. Square — Sandbox ve Production'ı ayırma

Evet, önerin doğru: **ikisini Cloudflare'de ayrı environment'lara koyalım.**
Cloudflare Pages'in iki ortamı var ve her biri için ayrı değişken seti
tanımlanabiliyor:

| Cloudflare ortamı | Ne zaman çalışır | Square |
| --- | --- | --- |
| **Preview** | `main` dışındaki her branch / her PR | **Sandbox** |
| **Production** | `main` branch | **Production** |

Böylece PR önizlemelerinde gerçek kart çekilmez, `main`'e merge edilince
otomatik olarak canlı Square'e geçilir. Kodda ekstra bir şey yapmana gerek yok:
`SQUARE_ENV` / `VITE_SQUARE_ENV` değerine göre hem API host'u
(`connect.squareupsandbox.com` ↔ `connect.squareup.com`) hem de tarayıcıdaki SDK
(`sandbox.web.squarecdn.com` ↔ `web.squarecdn.com`) otomatik değişiyor.

### 3.1 Sandbox değerlerini alma

Square Developer Dashboard → uygulaman → **Sandbox** sekmesi:
- `Application ID` → `VITE_SQUARE_APPLICATION_ID`
- `Access token` → `SQUARE_ACCESS_TOKEN`
- **Locations** → sandbox location → `SQUARE_LOCATION_ID` ve `VITE_SQUARE_LOCATION_ID`

### 3.2 Yıllık üyelik planı

Yıllık üyelik Square **Subscriptions** kullanıyor, yani bir plan gerekiyor:

1. Square Dashboard → **Items & Orders → Subscription plans** (veya Catalog API)
2. Yeni plan: cadence **ANNUAL**, para birimi **CAD**.
3. Plan **variation id**'sini `SQUARE_YEARLY_PLAN_ID` olarak kaydet.
4. Aynı planı hem sandbox hem production'da **ayrı ayrı** oluşturman gerekir —
   id'ler farklı olacak.

Tutar, plandaki fiyattan bağımsız olarak `price_override_money` ile
geçiliyor (kullanıcının seçtiği tutar; öğrenci kuponuyla $5).

### 3.3 Production değerleri

Square Developer Dashboard → **Production** sekmesi → aynı üç değer. Production
access token'ı almadan önce Square hesabının **aktivasyonu** (iş bilgileri,
banka hesabı) tamamlanmış olmalı.

---

## 4. Cloudflare Pages değişkenleri

Cloudflare Dashboard → **Workers & Pages → tsns-ca-website → Settings →
Environment variables**. Orada **Production** ve **Preview** için ayrı iki liste
var. Her birine şunları gir:

### Production

```
SQUARE_ENV                 = production
SQUARE_ACCESS_TOKEN        = <production access token>      [Secret]
SQUARE_LOCATION_ID         = <production location id>
SQUARE_YEARLY_PLAN_ID      = <production plan variation id>
VITE_SQUARE_ENV            = production
VITE_SQUARE_APPLICATION_ID = <production application id>
VITE_SQUARE_LOCATION_ID    = <production location id>

SUPABASE_URL               = https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  = <service_role>                 [Secret]

RESEND_API_KEY             = re_...                         [Secret]
RESEND_FROM                = Nova Scotia Türk Derneği <info@tsns.ca>
RESEND_REPLY_TO            = info@tsns.ca
RESEND_ADMIN_TO            = info@tsns.ca

STUDENT_COUPON_CODES       = OGRENCI2026
```

### Preview

Aynı liste, ama Square tarafı sandbox:

```
SQUARE_ENV                 = sandbox
SQUARE_ACCESS_TOKEN        = <sandbox access token>         [Secret]
SQUARE_LOCATION_ID         = <sandbox location id>
SQUARE_YEARLY_PLAN_ID      = <sandbox plan variation id>
VITE_SQUARE_ENV            = sandbox
VITE_SQUARE_APPLICATION_ID = <sandbox application id>
VITE_SQUARE_LOCATION_ID    = <sandbox location id>
```

Supabase için istersen ayrı bir "staging" projesi açıp Preview'da onu
kullanabilirsin; tek proje de olur, ama o zaman test kayıtları canlı tabloya
düşer.

> **Önemli:** `VITE_` ile başlayanlar **build sırasında** JS'e gömülür. Bu
> değişkenleri değiştirdikten sonra **yeni bir deploy tetiklemen** şart —
> sadece kaydetmek yetmez. `VITE_` önekli hiçbir değere gizli bilgi koyma;
> bunlar tarayıcıda görünür (Square application id ve location id zaten public
> değerlerdir, sorun yok).

Yerel geliştirme için:

```bash
cp .env.example .env      # .env repoya girmez
npm run dev:api           # wrangler pages dev — functions'ları da çalıştırır
```

`npm run dev` tek başına sadece frontend'i çalıştırır, `/api/*` çağrıları 404 verir.

---

## 5. Apple Pay — domain doğrulama (sorduğun kısım)

Square'in gösterdiği ekran şunu istiyor:

> Download the verification file and upload it to this path:
> `https://tsns.ca/.well-known/apple-developer-merchantid-domain-association`

### Bu nedir?

Apple Pay'in web'de çalışması için Apple'ın, ödeme alacak **domain'in gerçekten
sana ait olduğunu** doğrulaması gerekir. Square sana içinde rastgele bir token
olan küçük bir metin dosyası verir; sen bunu sitenin kökünde belirli bir yola
koyarsın. Apple o adrese HTTPS ile istek atar, dosyayı okur, token tutuyorsa
domain'i merchant hesabına kaydeder. Bu tek seferlik bir sahiplik kanıtıdır —
Apple ile ayrıca developer hesabı açmana veya sertifika üretmene gerek yok,
Square merchant kimliğini kendi hesabı üzerinden yönetiyor.

### Nasıl yapılır

1. Square Developer Dashboard → uygulaman → **Apple Pay** → **Add domain** →
   `tsns.ca` yaz → **Download verification file**.
   İnen dosyanın adı: `apple-developer-merchantid-domain-association`
   (**uzantısı yok** — `.txt` ekleme, tarayıcı eklediyse kaldır).
2. Dosyayı repoda şu konuma koy:

   ```
   public/.well-known/apple-developer-merchantid-domain-association
   ```

   Vite `public/` altındaki her şeyi (nokta ile başlayan klasörler dahil)
   `dist/`'e olduğu gibi kopyalar; Cloudflare Pages de `.well-known` dizinini
   yayınlar. Repoda hazır bekleyen `public/_headers` dosyası bu yola
   `Content-Type: text/plain` veriyor, böylece dosya HTML'e sarılmadan ham
   metin olarak dönüyor.
3. Commit → push → **production deploy'un bitmesini bekle**.
4. Doğrula:

   ```bash
   curl -i https://tsns.ca/.well-known/apple-developer-merchantid-domain-association
   ```

   Beklenen: `HTTP/2 200`, `content-type: text/plain`, gövdede Square'in verdiği
   token. `301`, `404` veya HTML dönerse Square doğrulaması başarısız olur.
5. Square panelinde **Verify** / **Add domain** butonuna bas.

### Dikkat edilecekler

- **HTTPS zorunlu** ve sertifika geçerli olmalı. Cloudflare Pages bunu zaten
  veriyor.
- **Yönlendirme olmamalı.** `www.tsns.ca → tsns.ca` gibi bir redirect varsa,
  dosyayı Square'de kaydettiğin domain'in *tam olarak* servis ettiğinden emin ol.
  Hem `tsns.ca` hem `www.tsns.ca` kullanıyorsan Square'de **ikisini de ayrı ayrı**
  ekleyip aynı dosyayı ikisinden de servis etmen gerekir.
- **Sandbox ve production ayrı.** Square'de Apple Pay domain kaydı sandbox ve
  production için ayrı tutulur; canlıya geçerken production tarafında da
  `tsns.ca`'yı eklemen gerekir. Ayrıca Apple Pay yalnızca Safari + Apple
  cihazlarda görünür — Chrome'da test edip "çalışmıyor" sanma.
- Kodda ek bir şey yapmana gerek yok: `DonationCheckout.jsx` Apple Pay butonunu
  yalnızca `payments.applePay()` başarılı olduğunda gösteriyor, desteklenmeyen
  tarayıcıda sessizce gizleniyor.

---

## 6. Canlıya alma sırası (checklist)

- [ ] Supabase projesi açıldı, migration çalıştırıldı
- [ ] Resend'de `tsns.ca` **Verified**
- [ ] Cloudflare **Preview** değişkenleri girildi (sandbox)
- [ ] Bir PR açıp preview URL'inde: gönüllü formu + sandbox kartla ($1 test)
      bağış denendi, e-postalar geldi, Supabase'e kayıt düştü
- [ ] Square production hesabı aktif, production plan oluşturuldu
- [ ] Cloudflare **Production** değişkenleri girildi
- [ ] `main`'e merge → deploy
- [ ] `curl` ile Apple Pay doğrulama dosyası kontrol edildi
- [ ] Square'de production domain doğrulandı
- [ ] Gerçek kartla küçük tutarlı ($1) bir bağış yapılıp Square'den iade edildi

### Sandbox test kartı

`4111 1111 1111 1111` · ileri bir son kullanma tarihi · herhangi bir CVV ·
posta kodu `B3H 1A1`. Sandbox modunda checkout ekranında bu kart zaten
hatırlatma olarak gösteriliyor.

---

## 7. Sorun giderme

| Belirti | Bak |
| --- | --- |
| E-posta gitmiyor | Cloudflare → Pages → Functions → **Real-time logs**; `email:` ile başlayan satırlar. Sonra Resend → Logs. |
| "Server is not configured for payments" | `SQUARE_ACCESS_TOKEN` veya `SQUARE_LOCATION_ID` o ortamda tanımlı değil |
| "Ödeme yapılandırılmamış." (tarayıcıda) | `VITE_SQUARE_APPLICATION_ID` / `VITE_SQUARE_LOCATION_ID` build'e girmemiş → değişkeni ekleyip **yeniden deploy et** |
| Kayıt Supabase'e düşmüyor | `warning: "not_stored"` dönüyorsa `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` yanlış ya da migration çalıştırılmamış |
| Apple Pay butonu görünmüyor | Safari + Apple cihaz mı? Domain doğrulandı mı? Konsolda Square SDK hatası var mı? |
| Yıllık üyelik hata veriyor | `SQUARE_YEARLY_PLAN_ID` o ortamın planına ait mi? Sandbox planı production'da çalışmaz. |
