# tsns.ca — Kurulum ve Operasyon Rehberi

Bu doküman **senin panellerde yapman gereken** adımları anlatır. Koddaki her şey
zaten hazır; aşağıdaki değişkenler girilmediğinde ilgili özellik sessizce devre
dışı kalır (ödeme/gönüllü akışı çökmez, sadece e-posta veya kayıt atlanır).

Sıra önemli — özellikle **domain'e en son dokun**. Site preview URL'inde
çalışmadan `tsns.ca`'yı taşırsan, eski Google Sites'ı çalışmayan bir şeyle
değiştirmiş olursun:

**1) Pages projesi → 2) Supabase → 3) Resend → 4) Square Sandbox →
5) Değişkenler → 6) Preview'da test → 7) Domain + DNS → 8) Apple Pay →
9) Square Production**

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

## 1. Cloudflare Pages projesini oluştur

Henüz bir Pages projesi yok — önce bu.

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** →
   **Connect to Git**.
2. GitHub'ı yetkilendir → **TSNS-CA/website** reposunu seç.
3. **Production branch:** `main`.
4. Build ayarları:

   | Alan | Değer |
   | --- | --- |
   | Framework preset | **Vite** (yoksa *None*) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Root directory | `/` (boş bırak) |

5. **Save and Deploy.**

### Bilmen gerekenler

- **Functions otomatik bulunur.** Repodaki `functions/` klasörü ayrı bir ayar
  gerektirmez; `/api/*` uç noktaları ilk deploy'dan itibaren çalışır.
- **Compatibility flag'e gerek yok.** `nodejs_compat` bayrağı olmadan
  `@supabase/supabase-js`'in insert akışını Workers runtime'ında test ettim,
  sorunsuz çalışıyor. Sonradan Node API'si isteyen bir paket eklersen
  Settings → Functions → *Compatibility flags* altından eklersin.
- **Node sürümü:** Pages V3 build image varsayılan olarak Node 22 veriyor ve
  repoda `.nvmrc` (`22`) var, yani sürüm sabit. Cloudflare varsayılanı
  ileride değiştirse bile build kırılmaz.
- **`wrangler.toml`'a `pages_build_output_dir` EKLEME.** O anahtarı eklediğin
  anda Cloudflare bu dosyayı *source of truth* kabul eder ve aynı alanları
  panelden **düzenleyemezsin**; değişkenler de dosyadan okunmaya başlar, yani
  gizli anahtarları repoya yazmak zorunda kalırsın. Mevcut `wrangler.toml`
  sadece yerelde `wrangler pages dev` için duruyor, deploy'u etkilemiyor —
  öyle kalsın.

### İlk deploy'u doğrula

Deploy bitince Cloudflare sana `xxx.pages.dev` adresi verir. Aç ve kontrol et:

```bash
curl -s https://<projen>.pages.dev/ | grep -o "<title>[^<]*</title>"
# beklenen: <title>Nova Scotia Türk Derneği | Turkish Society of Nova Scotia</title>

curl -s -X POST https://<projen>.pages.dev/api/coupon \
  -H 'Content-Type: application/json' -d '{"code":"x"}'
# beklenen: {"ok":true,"valid":false}   -> Functions çalışıyor demektir
```

`/api/coupon` HTML dönüyorsa Functions devreye girmemiştir (build output
dizini yanlış olabilir).

---

## 2. Supabase

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

## 3. Resend (e-posta)

Kod Resend'in **REST API**'sini `fetch` ile çağırıyor
(`functions/_lib/email.js`). Cloudflare Workers ortamında Node SDK'sı gerekmez —
ayrı bir paket kurmana **gerek yok**, dolayısıyla "hangi dil?" sorusunun cevabı:
zaten HTTP/REST kullanıyoruz, hazır.

### 3.1 Domain doğrulama

1. Resend → **Domains** → `tsns.ca` (eklediğini söylemiştin).
2. Resend'in gösterdiği DNS kayıtlarını **Cloudflare DNS**'e ekle:
   - **MX** (`send.tsns.ca` gibi bir alt alan için) → Resend'in verdiği host
   - **TXT (SPF)** → `v=spf1 include:amazonses.com ~all`
   - **TXT (DKIM)** → `resend._domainkey` → Resend'in verdiği uzun anahtar
   - (Önerilen) **TXT (DMARC)** → `_dmarc` → `v=DMARC1; p=none; rua=mailto:info@tsns.ca`
3. ⚠️ Cloudflare'de bu kayıtları eklerken **proxy'yi kapat (gri bulut)**.
   DNS-only olmalı; turuncu bulut e-posta doğrulamasını bozar.
4. Resend'de **Verify** → "Verified" olana kadar bekle (genelde birkaç dakika).

### 3.2 API anahtarı

Resend → **API Keys** → **Create API Key**
- İzin: **Sending access**
- Domain: `tsns.ca`
- Çıkan `re_...` değerini `RESEND_API_KEY` olarak sakla.

### 3.3 Değişkenler

| Değişken | Örnek | Zorunlu |
| --- | --- | --- |
| `RESEND_API_KEY` | `re_...` | evet |
| `RESEND_FROM` | `Nova Scotia Türk Derneği <info@tsns.ca>` | evet |
| `RESEND_REPLY_TO` | `info@tsns.ca` | hayır |
| `RESEND_ADMIN_TO` | `info@tsns.ca,baskan@tsns.ca` | hayır |

`RESEND_FROM` içindeki domain **doğrulanmış domain olmak zorunda**, yoksa Resend
403 döner.

### 3.4 Hangi e-posta ne zaman gider

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

## 4. Square — Sandbox ve Production'ı ayırma

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

### 4.1 Sandbox değerlerini alma

Square Developer Dashboard → uygulaman → **Sandbox** sekmesi:
- `Application ID` → `VITE_SQUARE_APPLICATION_ID`
- `Access token` → `SQUARE_ACCESS_TOKEN`
- **Locations** → sandbox location → `SQUARE_LOCATION_ID` ve `VITE_SQUARE_LOCATION_ID`

### 4.2 Yıllık üyelik planı

Yıllık üyelik Square **Subscriptions** kullanıyor, yani bir plan gerekiyor:

1. Square Dashboard → **Items & Orders → Subscription plans** (veya Catalog API)
2. Yeni plan: cadence **ANNUAL**, para birimi **CAD**.
3. Plan **variation id**'sini `SQUARE_YEARLY_PLAN_ID` olarak kaydet.
4. Aynı planı hem sandbox hem production'da **ayrı ayrı** oluşturman gerekir —
   id'ler farklı olacak.

Tutar, plandaki fiyattan bağımsız olarak `price_override_money` ile
geçiliyor (kullanıcının seçtiği tutar; öğrenci kuponuyla $5).

### 4.3 Production değerleri

Square Developer Dashboard → **Production** sekmesi → aynı üç değer. Production
access token'ı almadan önce Square hesabının **aktivasyonu** (iş bilgileri,
banka hesabı) tamamlanmış olmalı.

---

## 5. Cloudflare Pages değişkenleri

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

## 6. Domain, DNS ve yönlendirme

### Şu anki durum (ölçüldü, 2026-08-02)

| Ne | Durum |
| --- | --- |
| Nameserver | Cloudflare ✅ (`piper` / `arnold.ns.cloudflare.com`) |
| `tsns.ca` A kayıtları | Google'a işaret ediyor (`216.239.32/34/36/38.21`) |
| `www.tsns.ca` | `ghs.googlehosted.com` → **eski Google Sites** |
| `https://tsns.ca` | ❌ TLS el sıkışması başarısız |
| `http://tsns.ca` | `301` → `http://www.tsns.ca` |

Yani domain hâlâ eski Google Sites'ta ve apex üzerinde HTTPS hiç çalışmıyor.
Nameserver zaten Cloudflare'de olduğu için registrar'a dokunmana gerek yok;
sadece Cloudflare içindeki DNS kayıtlarını değiştireceğiz.

> ⚠️ Bu adım **eski siteyi canlıdan indirir.** Önce yeni siteyi `.pages.dev`
> adresinde tam test et.

### Önce karar ver: apex mi, www mi?

Biri "kanonik" olmalı, diğeri ona yönlenmeli. Öneri: **apex kanonik**
(`tsns.ca`), çünkü Square'de Apple Pay domain'ini `tsns.ca` olarak kaydettin ve
o dosyanın **yönlendirme olmadan** apex'ten dönmesi gerekiyor.

### Adımlar

1. **Eski Google kayıtlarını sil.** Cloudflare → `tsns.ca` zone → **DNS** →
   `216.239.*` A kayıtları ve `www` → `ghs.googlehosted.com` CNAME'i sil.
   (Silmeden önce ekran görüntüsü al — geri dönmen gerekirse lazım olur.)
2. **Pages custom domain ekle.** Workers & Pages → projen → **Custom domains**
   → **Set up a custom domain** → `tsns.ca`. Cloudflare gerekli CNAME'i
   kendisi oluşturur; onayla. Aynı ekranda `www.tsns.ca`'yı da ekle.
3. **Yönlendirmeyi kur.** `www` → apex yönlendirmesi için Cloudflare →
   **Rules** → **Redirect Rules** → *Create rule*:
   - Eşleşme: `Hostname` **equals** `www.tsns.ca`
   - Aksiyon: **Dynamic redirect** → `concat("https://tsns.ca", http.request.uri.path)`
   - Durum kodu: **301**, *Preserve query string* açık.
4. **SSL/TLS modunu kontrol et.** Cloudflare → SSL/TLS → **Full (strict)**
   olmalı. "Flexible" moddaysa Pages ile sonsuz yönlendirme döngüsü oluşur.
5. **Always Use HTTPS** açık olsun (SSL/TLS → Edge Certificates).

### Doğrulama

```bash
dig +short tsns.ca                       # artık 216.239.* GÖRMEMELİSİN
curl -sI https://tsns.ca/         | head -1   # HTTP/2 200
curl -sI https://www.tsns.ca/     | head -1   # HTTP/2 301
curl -s  https://tsns.ca/ | grep -o "<title>[^<]*</title>"
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tsns.ca/api/coupon \
  -H 'Content-Type: application/json' -d '{"code":"x"}'   # 200
```

Sertifika ilk birkaç dakika "not yet valid" diyebilir — Cloudflare sertifikayı
üretene kadar normal.

---

## 7. Apple Pay — domain doğrulama

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

**✅ 1–2. adımlar bitti.** Square'in verdiği dosya repoda duruyor:

```
public/.well-known/apple-developer-merchantid-domain-association
```

Byte-birebir kopyalandı (sha256 doğrulandı). Dosya hex-encoded JSON ve **Apple
imzalı**; sonunda newline bile yok — tek karakter değişirse imza geçersiz olur,
o yüzden hiçbir editör/formatlayıcı bu dosyaya dokunmamalı. `public/_headers`
bu yolu `text/plain`'e sabitliyor. Build çıktısında ve `wrangler pages dev`
altında test edildi: `200`, `text/plain`, gövde sha256 eşleşiyor.

Sana kalanlar:

3. **PR'ı `main`'e merge et** ve production deploy'un bitmesini bekle.
   (Dosya `worktree-site-redesign` dalında; `main`'e geçmeden canlıda olmaz.)
4. **Domain'i Pages'e bağla** — bölüm 6. Bu yapılmadan `https://tsns.ca` zaten
   TLS el sıkışması yapamıyor, dolayısıyla doğrulama kesin başarısız olur.
5. Doğrula:

   ```bash
   curl -i https://tsns.ca/.well-known/apple-developer-merchantid-domain-association
   ```

   Beklenen: `HTTP/2 200`, `content-type: text/plain`, gövdede `7B227073...`
   ile başlayan hex token. `301`, `404` veya `text/html` dönerse Square
   doğrulaması başarısız olur.
6. Square panelinde **Verify** / **Add domain** butonuna bas.

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

## 8. Canlıya alma sırası (checklist)

- [ ] **Pages projesi oluşturuldu** (build: `npm run build` → `dist`), ilk
      deploy `.pages.dev`'de açılıyor, `/api/coupon` JSON dönüyor
- [ ] Supabase projesi açıldı, migration çalıştırıldı
- [ ] Resend'de `tsns.ca` **Verified**
- [ ] Cloudflare **Preview** değişkenleri girildi (sandbox)
- [ ] Preview URL'inde: gönüllü formu + sandbox kartla ($1 test) bağış denendi,
      e-postalar geldi, Supabase'e kayıt düştü
- [ ] Square production hesabı aktif, production plan oluşturuldu
- [ ] Cloudflare **Production** değişkenleri girildi
- [ ] PR `main`'e merge edildi → production deploy geçti
- [ ] **Domain taşındı:** eski Google A/CNAME kayıtları silindi, `tsns.ca`
      custom domain olarak eklendi, `www` → apex redirect kuruldu,
      SSL/TLS **Full (strict)**
- [ ] `curl` ile Apple Pay doğrulama dosyası kontrol edildi (200 + text/plain)
- [ ] Square'de production domain doğrulandı
- [ ] Gerçek kartla küçük tutarlı ($1) bir bağış yapılıp Square'den iade edildi
- [ ] Safari + iPhone'da Apple Pay butonu görünüyor

### Sandbox test kartı

`4111 1111 1111 1111` · ileri bir son kullanma tarihi · herhangi bir CVV ·
posta kodu `B3H 1A1`. Sandbox modunda checkout ekranında bu kart zaten
hatırlatma olarak gösteriliyor.

---

## 9. Sorun giderme

| Belirti | Bak |
| --- | --- |
| Build fail: `crypto.hash is not a function` vb. | Node sürümü eski → `.nvmrc` (22) repoda mı, build log'unda hangi Node yazıyor? |
| `/api/*` HTML dönüyor | Functions devreye girmemiş: build output dizini `dist` mi, `functions/` repo kökünde mi? |
| Site açılıyor ama boş/eski görünüyor | `.pages.dev` mi yoksa `tsns.ca` mı bakıyorsun? Domain hâlâ Google Sites'a bakıyor olabilir (bölüm 6). |
| `ERR_TOO_MANY_REDIRECTS` | SSL/TLS modu **Flexible** → **Full (strict)** yap |
| E-posta gitmiyor | Cloudflare → Pages → Functions → **Real-time logs**; `email:` ile başlayan satırlar. Sonra Resend → Logs. |
| "Server is not configured for payments" | `SQUARE_ACCESS_TOKEN` veya `SQUARE_LOCATION_ID` o ortamda tanımlı değil |
| "Ödeme yapılandırılmamış." (tarayıcıda) | `VITE_SQUARE_APPLICATION_ID` / `VITE_SQUARE_LOCATION_ID` build'e girmemiş → değişkeni ekleyip **yeniden deploy et** |
| Kayıt Supabase'e düşmüyor | `warning: "not_stored"` dönüyorsa `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` yanlış ya da migration çalıştırılmamış |
| Apple Pay butonu görünmüyor | Safari + Apple cihaz mı? Domain doğrulandı mı? Konsolda Square SDK hatası var mı? |
| Yıllık üyelik hata veriyor | `SQUARE_YEARLY_PLAN_ID` o ortamın planına ait mi? Sandbox planı production'da çalışmaz. |
