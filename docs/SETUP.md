# tsns.ca — Kurulum Rehberi

Baştan sona takip edeceğin liste. Kod tarafında yapılacak bir şey kalmadı;
aşağıdakiler **panellerde** yapılacak ayarlar.

Her adımın sonunda bir **Doğrula** bölümü var. O geçmeden sonrakine geçme —
sorunu ortaya çıktığı yerde yakalamak, üç adım sonra aramaktan kolay.

> **Sıra önemli.** Domain'e **en son** dokunuyoruz. Site `.workers.dev`
> adresinde çalıştığını görmeden `tsns.ca`'yı taşırsan, çalışan eski siteyi
> çalışmayan bir şeyle değiştirmiş olursun.

---

## Genel ilerleme

- [ ] **0.** Branch `main`'e merge edildi
- [ ] **1.** Supabase projesi açıldı, SQL çalıştırıldı
- [ ] **2.** Resend domain doğrulandı, template'ler yüklendi
- [ ] **3.** Square sandbox bilgileri ve yıllık plan hazır
- [ ] **4.** Cloudflare Worker kuruldu, değişkenler girildi
- [ ] **5.** `.workers.dev` adresinde uçtan uca test geçti
- [ ] **6.** Domain `tsns.ca` Worker'a taşındı
- [ ] **7.** Apple Pay domain doğrulaması yapıldı
- [ ] **8.** Square production'a geçildi

---

## 0. Önce: branch'i merge et

Bütün bu iş `worktree-site-redesign` dalında ve [PR
#2](https://github.com/TSNS-CA/website/pull/2)'de duruyor. Cloudflare
production build'i `main`'den aldığı için merge etmeden hiçbiri canlıya çıkmaz.

Merge etmeden denemek istersen Cloudflare'de branch build'lerini açıp o dalın
preview adresinde test edebilirsin (adım 4.1).

---

## 1. Supabase

### 1.1 Projeyi aç

1. [supabase.com](https://supabase.com) → **New project**
2. Region: Halifax'a en yakını — **East US (North Virginia)** veya **Canada Central**
3. Database password'ünü parola yöneticine kaydet

### 1.2 Tabloları oluştur

1. Sol menü → **SQL Editor** → **+ New query**
2. Repodaki şu dosyanın **tamamını** kopyalayıp yapıştır:
   ```
   supabase/migrations/0002_contacts_activities.sql
   ```
3. **Run** (⌘+Enter)

Dosya idempotent — tekrar çalıştırmak zararsız. Postgres 17'de test edildi.

### 1.3 Anahtarları al

**Project Settings → API**:

| Panel'deki isim | Değişken adı |
| --- | --- |
| Project URL | `SUPABASE_URL` |
| `service_role` **secret** | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ `service_role` anahtarı bütün güvenlik kurallarını bypass eder. Asla
> `VITE_` önekiyle tanımlama, asla frontend'e koyma, asla repoya commit'leme.
> Yalnızca Cloudflare değişkeni olarak yaşamalı.

### ✅ Doğrula

- **Table Editor**'da `contacts` ve `activities` tabloları var
- **Database → Views** altında `people` ve `members` görünümleri var
- SQL Editor'da şu boş sonuç dönüyor (hata değil): `select * from people;`

---

## 2. Resend

### 2.1 Domain doğrula

1. Resend → **Domains** → `tsns.ca`
2. Resend'in verdiği kayıtları **Cloudflare DNS**'e ekle:
   - **MX** → Resend'in verdiği host
   - **TXT (SPF)** → Resend hangi hostname'i verdiyse ona
   - **TXT (DKIM)** → `resend._domainkey` → uzun anahtar
   - *(önerilen)* **TXT (DMARC)** → `_dmarc` → `v=DMARC1; p=none; rua=mailto:info@tsns.ca`
3. ⚠️ Bu kayıtlarda Cloudflare'de **proxy'yi kapat (gri bulut)**. Turuncu bulut
   e-posta doğrulamasını bozar.
4. 🚨 **Apex MX kaydına dokunma.** `tsns.ca` üzerindeki MX kayıtları Google
   Workspace'e ait (`aspmx.l.google.com`) — derneğin gelen e-postası oradan
   geçiyor. Resend genelde `send.tsns.ca` gibi bir **alt alan** kullanır, o
   yüzden çakışma olmaz. Resend apex'e SPF eklemeni isterse dikkat et: apex'te
   zaten bir SPF varsa **iki ayrı SPF kaydı olamaz**, tek kayıtta birleştirmen
   gerekir.
5. Resend'de **Verify** → "Verified" olana kadar bekle (genelde birkaç dakika)

### 2.2 API anahtarı

Resend → **API Keys** → **Create API Key**
- İzin: **Sending access**
- Domain: `tsns.ca`
- Çıkan `re_...` değeri → `RESEND_API_KEY`

### 2.3 Template'leri yükle

Repoda hazır iki şablon var:

```
docs/email-templates/membership-confirmation.html
docs/email-templates/volunteer-confirmation.html
```

Önce **logoyu nereden servis edeceğine** karar ver (detay: Ek C):

- **Şimdilik en kolayı:** Worker deploy olduktan sonra
  `https://tsns.<hesabin>.workers.dev/tsns.jpeg`
- **Kalıcı:** `https://tsns.ca/tsns.jpeg` — şablonlarda zaten yazan adres.
  Domain taşınınca kendiliğinden çalışır, hiçbir şey yapman gerekmez.

Geçici bir adres kullanacaksan URL'i şablonlara gömmek için:

```bash
node docs/email-templates/preview.mjs --logo https://SENIN/LOGO/ADRESIN.jpg
```

Sonra her template için: Resend → **Templates** → ilgili template → HTML
görünümü → dosyanın **tamamını** yapıştır → kaydet.

> `{{...}}` içeren asıl dosyaları yapıştır. `.preview.html` olanlar örnek
> verilerle doldurulmuş, sadece bakmak için.

### 2.4 Template id'lerini al

Resend → Templates → ilgili template → ayarlar → uuid'yi kopyala:

| Template | Değişken |
| --- | --- |
| `membership-confirmation` | `RESEND_MEMBERSHIP_TEMPLATE_ID` |
| `volunteer-confirmation` | `RESEND_VOLUNTEER_TEMPLATE_ID` |

### ✅ Doğrula

- Resend → Domains → `tsns.ca` **Verified** yazıyor
- İki template de kayıtlı, id'leri elinde
- Resend'in önizlemesinde logo görünüyor (görünmüyorsa logo URL'i henüz canlı
  değildir — adım 2.3)

---

## 3. Square (sandbox)

Square'de dört değere ihtiyacın var. Application ID ve Access Token credentials
ekranında; Location ID ve Plan ID ayrı yerlerde.

### 3.1 Application ID ve Access Token

Square Developer Dashboard → [developer.squareup.com](https://developer.squareup.com)
→ uygulamani aç → **Sandbox** sekmesi → **Credentials**:

| Panel'deki isim | Değişken |
| --- | --- |
| Square Application ID | `VITE_SQUARE_APPLICATION_ID` |
| Sandbox Access Token | `SQUARE_ACCESS_TOKEN` |

> Application ID `sandbox-sq0idb-...` formatında, Access Token `EAAAl...` ile
> başlar. Bu ikisini kolay buluyorsun.

### 3.2 Location ID — en kolay bulamayacağın

Sandbox'ta otomatik bir test location oluşturulmuştur ama ID'si credentials
sayfasında **yazmaz**. İki yolla alırsın:

**Yol A — panelden:**

1. Developer Dashboard → uygulaman → sol menüde **Sandbox** → **Sandbox API
   Tools** (veya **Locations** sekmesi)
2. "Default Test Account" altında test location listelenir → `id` alanı
   `L...` veya `...P3W...` gibi bir string
3. Aynı ID iki yere: `SQUARE_LOCATION_ID` **ve** `VITE_SQUARE_LOCATION_ID`

**Yol B — API ile (bana access token'ı verirsen ben çekerim):**

```bash
curl -H "Authorization: Bearer EAAAl-SANDBOX-TOKEN" \
  https://connect.squareupsandbox.com/v2/locations | jq '.locations[] | {name, id}'
```

Dönen listedeki `id` → `SQUARE_LOCATION_ID` + `VITE_SQUARE_LOCATION_ID`.
(Location Name genelde "Default Test Account" olur.)

### 3.3 Yıllık üyelik planı

Yıllık üyelik Square **Subscriptions** kullanıyor, plan olmadan çalışmaz:

1. **Sandbox Seller Dashboard** → [sandboxsquareup.com/dashboard](https://sandboxsquareup.com/dashboard)
   (normal dashboard değil — sandbox olan!)
2. **Items & Orders → Subscription plans → Create plan**
3. Cadence **Annual** (yillik), para birimi **CAD**, tutar ne yazarsan yaz
   (kodu override ediyor, önemli değil — örn. $25)
4. Planı kaydet → oluşan **subscription plan variation id** (`plan_variation_id`,
   `P...` formatında) → `SQUARE_YEARLY_PLAN_ID`

> Planı sandbox ve production'da **ayrı ayrı** oluşturman gerekiyor; id'ler
> farklı olur. Sandbox planı production'da çalışmaz.
>
> Tutar plandan bağımsız: kod kullanıcının seçtiği tutarı (öğrenci kuponuyla
> $5) `price_override_money` ile geçiyor, bu yüzden plandaki fiyat umurumuzda değil.

### 3.4 Neden bazıları `VITE_` ile başlıyor?

Square değerleri iki yerde çalışıyor, ve Vite bunları buna göre ayırıyor:

| Değişken | Nerede kullanılıyor | `VITE_` öneki |
| --- | --- | --- |
| `VITE_SQUARE_APPLICATION_ID` | **Tarayıcıda** — SDK kart formunu açarken | evet |
| `VITE_SQUARE_LOCATION_ID` | **Tarayıcıda** — SDK kart formunu açarken | evet |
| `VITE_SQUARE_ENV` | **Tarayıcıda** — sandbox/production SDK URL seçimi | evet |
| `SQUARE_ACCESS_TOKEN` | **Sunucuda** — kartı tahsil ederken | hayır (gizli) |
| `SQUARE_LOCATION_ID` | **Sunucuda** — ödemeyi kaydederken | hayır |
| `SQUARE_YEARLY_PLAN_ID` | **Sunucuda** — abonelik oluştururken | hayır |

`VITE_` ile başlayanlar Vita tarafından **build sırasında** tarayıcıdaki JS'e
gömülür — çünkü Square Web Payments SDK kart formunu tarayıcıda çiziyor
(`DonationCheckout.jsx`'te `Square.payments(APP_ID, LOCATION_ID)`). Tarayıcı bu
değerleri göremese form açılmaz.

Application ID ve Location ID Square'de **public** değerlerdir — herkes
görebilir, gizli değildir. O yüzden tarayıcıya gömmek güvenli. Ama Access Token
gizlidir (kart tahsil etme yetkisi verir), `VITE_` ile başlamaz ve asla
tarayıcıya gitmez — sadece Worker'da kullanılır.

> Location ID aynı değeri iki yere giriyorsun (`VITE_SQUARE_LOCATION_ID` ve
> `SQUARE_LOCATION_ID`) çünkü hem tarayıcı hem sunucu lazım. Application ID'nin
> ise sadece `VITE_` hâli var çünkü sadece tarayıcı kullanıyor.

### ✅ Doğrula

Elinde dört sandbox değeri var: application id, access token, location id,
plan variation id.

---

## 4. Cloudflare Worker

Proje **Worker** olarak kurulu (Pages değil). Repo buna göre ayarlandı.

### 4.1 Build ayarları

Cloudflare → **Workers & Pages** → Worker'ın → **Settings → Build**:

| Alan | Değer |
| --- | --- |
| Build command | `npm run build:cf` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Branch | `main` |

> ⚠️ Panel'deki Worker adı ile `wrangler.toml` içindeki
> `name = "tsns"` **birebir aynı** olmalı. Değilse build daha
> başlamadan patlar.

Branch preview'ları istersen **Non-production branch builds** açık olsun.

### 4.2 Runtime değişkenleri

**Settings → Variables and Secrets**. Gizli olanları **Secret** işaretle:

```
SQUARE_ENV                    = sandbox
SQUARE_ACCESS_TOKEN           = <sandbox access token>      [Secret]
SQUARE_LOCATION_ID            = <sandbox location id>
SQUARE_YEARLY_PLAN_ID         = <sandbox plan variation id>

SUPABASE_URL                  = https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY     = <service_role>              [Secret]

RESEND_API_KEY                = re_...                      [Secret]
RESEND_MEMBERSHIP_TEMPLATE_ID = <template uuid>
RESEND_VOLUNTEER_TEMPLATE_ID  = <template uuid>
RESEND_FROM                   = Nova Scotia Türk Derneği <info@tsns.ca>
RESEND_REPLY_TO               = info@tsns.ca
RESEND_ADMIN_TO               = info@tsns.ca

STUDENT_COUPON_CODES          = OGRENCI2026
```

### 4.3 Build değişkenleri — ayrı yer!

**Settings → Build → Build variables and secrets**:

```
VITE_SQUARE_ENV               = sandbox
VITE_SQUARE_APPLICATION_ID    = <sandbox application id>
VITE_SQUARE_LOCATION_ID       = <sandbox location id>
```

> ⚠️ **En sık yapılan hata bu.** `VITE_` ile başlayanlar Vite tarafından
> **build sırasında** JS'e gömülür. Runtime tarafına koyarsan build onları
> göremez ve sitede "Ödeme yapılandırılmamış." hatası alırsın. Pages'te bu iki
> liste tekti; Workers'ta ayrı.
>
> Bu üçünü her değiştirdiğinde **yeni deploy** gerekiyor; kaydetmek yetmez.

`VITE_` önekli hiçbir şeye gizli bilgi koyma — tarayıcıda görünür. (Square
application id ve location id zaten public değerler, sorun değil.)

### ✅ Doğrula

```bash
curl -s https://tsns.<hesabin>.workers.dev/ | grep -o "<title>[^<]*</title>"
# → Nova Scotia Türk Derneği | Turkish Society of Nova Scotia

curl -s -X POST https://tsns.<hesabin>.workers.dev/api/coupon \
  -H 'Content-Type: application/json' -d '{"code":"x"}'
# → {"ok":true,"valid":false}
```

İkincisi HTML dönüyorsa API devreye girmemiştir → Ek D.

---

## 5. Uçtan uca test (`.workers.dev`)

Domain'e dokunmadan önce her şeyin çalıştığını burada gör.

### 5.1 Gönüllü formu

`/gonullu` → formu **kendi e-postanla** doldur.

- [ ] Sana `volunteer-confirmation` e-postası geldi, logo görünüyor,
      **WhatsApp butonu kırmızı ve tıklanıyor**
- [ ] `RESEND_ADMIN_TO` adresine bildirim geldi
- [ ] Supabase → `contacts`'ta bir satır, `activities`'te `volunteer_signup` var

### 5.2 Bağış (sandbox kart)

`/bagis` → **Tek Seferlik** → tutar seç → öde:

```
4111 1111 1111 1111 · ileri son kullanma · herhangi CVV · posta kodu B3H 1A1
```

- [ ] `membership-confirmation` e-postası geldi ve **"otomatik yenilenmez"**
      diyor (tek seferlik bağış da 1 yıllık üyelik açıyor)
- [ ] `activities`'te `kind = 'donation'`, `membership_end` bir yıl sonrası
- [ ] `people` görünümünde `member_type = 'donor'`, `is_member = true`

### 5.3 Yıllık üyelik

`/bagis` → **Yıllık Üyelik** → aynı kartla öde.

- [ ] E-posta **"her yıl otomatik olarak yenilenecek"** diyor
- [ ] `people` görünümünde `member_type = 'member'`, `membership_auto_renews = true`
- [ ] Öğrenci kuponu kutusu **sadece yıllık sekmesinde** görünüyor

### 5.4 Aynı kişi iki rolde

5.1'deki e-postayla 5.3'ü tekrar yap.

- [ ] `contacts`'ta **hâlâ tek satır** var
- [ ] `people` görünümünde `roles = {member, volunteer}`

---

## 6. Domain'i taşı

> ⚠️ Bu adım **eski Google Sites'ı canlıdan indirir.** Adım 5 tamamen geçmeden
> yapma.

### Şu anki durum (2026-08-02'de ölçüldü)

| Ne | Durum |
| --- | --- |
| Nameserver | Cloudflare ✅ (`piper` / `arnold.ns.cloudflare.com`) |
| `tsns.ca` A kayıtları | Google'a işaret ediyor (`216.239.32/34/36/38.21`) |
| `www.tsns.ca` | `ghs.googlehosted.com` → eski Google Sites |
| `https://tsns.ca` | ❌ TLS el sıkışması başarısız |

Nameserver zaten Cloudflare'de, registrar'a dokunmana gerek yok.

### Adımlar

1. **Eski kayıtları sil.** Cloudflare → `tsns.ca` → **DNS**:
   - `tsns.ca` üzerindeki **4 adet A kaydı** (`216.239.32.21`, `216.239.34.21`,
     `216.239.36.21`, `216.239.38.21`)
   - `www` → `ghs.googlehosted.com` **CNAME**

   *(Silmeden önce ekran görüntüsü al.)*

   > 🚨 **MX kayıtlarına DOKUNMA.** `tsns.ca` MX kayıtları
   > `aspmx.l.google.com` vb. adreslere gidiyor — bunlar **Google Workspace
   > e-postanız**, yani `info@tsns.ca`. Silersen derneğin e-postası çalışmaz
   > hâle gelir. `google-site-verification` TXT kaydı da kalsın.
   >
   > Sadece **A** ve **CNAME** kayıtları silinecek; site nereye bakıyor onu
   > belirleyen bunlar.

   Cloudflare "already has externally managed DNS records" hatası veriyorsa
   sebebi tam olarak bu: aynı hostname için hem manuel A kaydı hem Worker
   route'u tutulamıyor. Önce sil, sonra ekle.
2. **Worker'a domain ekle.** Workers & Pages → Worker'ın → **Settings → Domains
   & Routes** → **Add → Custom domain** → `tsns.ca`. Sonra `www.tsns.ca`'yı da ekle.
3. **`www` → apex yönlendirmesi.** Cloudflare → **Rules → Redirect Rules** →
   *Create rule*:
   - Eşleşme: `Hostname` **equals** `www.tsns.ca`
   - Aksiyon: **Dynamic redirect** → `concat("https://tsns.ca", http.request.uri.path)`
   - Kod **301**, *Preserve query string* açık
4. **SSL/TLS → Full (strict)**. "Flexible" moddaysa sonsuz yönlendirme döngüsü olur.
5. **Always Use HTTPS** açık (SSL/TLS → Edge Certificates).

> Apex'i kanonik yapıyoruz çünkü Apple Pay doğrulama dosyasının `tsns.ca`'dan
> **yönlendirme olmadan** dönmesi gerekiyor.

### ✅ Doğrula

```bash
dig +short tsns.ca                         # 216.239.* GÖRMEMELİSİN
curl -sI https://tsns.ca/      | head -1   # HTTP/2 200
curl -sI https://www.tsns.ca/  | head -1   # HTTP/2 301
curl -s https://tsns.ca/ | grep -o "<title>[^<]*</title>"
```

Sertifika ilk birkaç dakika "not yet valid" diyebilir, normaldir.

---

## 7. Apple Pay domain doğrulaması

**Dosya zaten repoda.** Square'in verdiği doğrulama dosyasını byte-birebir
`public/.well-known/apple-developer-merchantid-domain-association` yoluna
koydum; `public/_headers` de onu `text/plain` olarak sabitliyor.

Sana kalan:

1. Adım 6 bitmiş olmalı (domain Worker'a bağlı, HTTPS çalışıyor)
2. Doğrula:
   ```bash
   curl -i https://tsns.ca/.well-known/apple-developer-merchantid-domain-association
   ```
   Beklenen: `HTTP/2 200`, `content-type: text/plain`, gövdede `7B227073...`
   ile başlayan hex metin (Square'in panelden verdiği dosya birebir bu
   formatta — decode edip JSON'a çevirme, byte-birebir host et). `301`,
   `404` veya `text/html` gelirse Square reddeder.
   (Not: dosya bir ara yanlışlıkla decode edilip JSON hâliyle commit
   edilmişti; Square doğrulaması "partial response" hatası veriyordu.
   Hex hâline geri döndürüldü.)
3. Square Developer Dashboard → **Apple Pay** → **Verify**

### Dikkat

- Apple Pay yalnızca **Safari + Apple cihazda** görünür. Chrome'da test edip
  "çalışmıyor" sanma.
- Sandbox ve production kayıtları **ayrı**. Production'a geçerken `tsns.ca`'yı
  orada da eklemen gerekiyor.
- `www` kullanacaksan Square'de onu da ayrı ekle.

---

## 8. Production'a geçiş

### 8.1 Square production bilgileri

Square Developer Dashboard → **Production** sekmesi → aynı dört değer.
Production access token alabilmen için Square hesabının aktivasyonu (iş
bilgileri, banka hesabı) tamamlanmış olmalı. Yıllık planı production'da da
oluştur.

### 8.2 Değişkenleri değiştir

**Runtime** (Variables and Secrets):
```
SQUARE_ENV            = production
SQUARE_ACCESS_TOKEN   = <production access token>   [Secret]
SQUARE_LOCATION_ID    = <production location id>
SQUARE_YEARLY_PLAN_ID = <production plan variation id>
```

**Build** (Build variables):
```
VITE_SQUARE_ENV            = production
VITE_SQUARE_APPLICATION_ID = <production application id>
VITE_SQUARE_LOCATION_ID    = <production location id>
```

Sonra **yeniden deploy et** — `VITE_*` değiştiği için şart.

> ⚠️ **Preview URL tuzağı.** Workers'ta Pages'teki gibi ortam bazlı değişken
> ayrımı yok; branch preview'ları **production Worker'ının değişkenlerini**
> kullanır. Production Square anahtarlarına geçtikten sonra bir preview
> adresinde ödeme denersen **gerçek kart çekilir**.

### 8.3 Son kontrol

- [ ] Gerçek kartla $1 bağış yapıldı, e-posta geldi, Supabase'e düştü
- [ ] Square'den o ödeme iade edildi
- [ ] Safari + iPhone'da Apple Pay butonu görünüyor
- [ ] `tsns.ca` ve `www.tsns.ca` doğru çalışıyor

---

# Ekler

## Ek A — Mimari

| Katman | Nerede |
| --- | --- |
| Statik site | Cloudflare Worker static assets (`dist/`) |
| API | `functions/api/*` → tek Worker script'ine derleniyor (`worker/index.js`) |
| Veritabanı | Supabase — `contacts` + `activities`, `people` görünümü |
| Ödeme | Square (Web Payments SDK + Payments/Subscriptions API), Apple Pay dahil |
| E-posta | Resend hosted template'leri + iç bildirimler |

Uç noktalar:
- `POST /api/volunteer` — gönüllü kaydı
- `POST /api/create-payment` — tek seferlik bağış
- `POST /api/create-subscription` — yıllık üyelik
- `POST /api/coupon` — öğrenci kodu doğrulama

`npm run build:cf` iki iş yapıyor: Vite ile siteyi `dist/`'e basıyor, sonra
`wrangler pages functions build` ile `functions/` klasörünü tek Worker
script'ine derliyor.

`wrangler.toml`'daki iki kritik satır:
```toml
not_found_handling = "single-page-application"   # /bagis, /gonullu gibi rotalar
run_worker_first = ["/api/*"]                    # API asset'ten önce çalışsın
```
İkincisi olmazsa `/api/*` istekleri `index.html` ile cevaplanır. Bu dizi
sözdizimi **wrangler v4** gerektiriyor (repo v4'e sabitli).

**`wrangler.toml`'a `pages_build_output_dir` ekleme** — o anahtar dosyayı
Cloudflare için *source of truth* yapar ve aynı alanları panelden düzenleyemez
hâle gelirsin.

## Ek B — Veri modeli

İki tablo. Bölme "gönüllü vs bağışçı" değil, **"kişi vs olay"**:

| Tablo | Ne |
| --- | --- |
| `contacts` | İnsan başına bir satır (kimlik: küçük harf, unique e-posta) |
| `activities` | Olan her şey: `membership`, `donation`, `volunteer_signup` |

Aynı kişinin ikiye bölünmemesini `contacts.email` unique kısıtı + koddaki
upsert garanti ediyor. Gönüllü olan biri sonradan üye olursa **aynı** satır
güncellenir, iki `activities` kaydı oluşur.

`people` görünümü kişi başına özet verir:

| Kolon | |
| --- | --- |
| `member_type` | `member` / `donor` / `volunteer` / `former_member` / `contact` |
| `roles` | Dizi — biri diğerini dışlamaz: `{member, volunteer}` |
| `is_member`, `was_member`, `is_volunteer`, `is_donor` | Filtrelemek için |
| `first_seen_at` | İlk kayıt tarihi (sabit) |
| `membership_end`, `membership_kind`, `membership_auto_renews` | Üyelik durumu ve kaynağı |
| `renewal_count` | Kaç kere yenilemiş |
| `total_cad` / `membership_cad` / `donation_cad` | Ne kadar ödemiş, kırılımlı |
| `payment_count`, `donation_count`, `volunteer_signup_count` | Sayılar |

**Tek seferlik bağış da 1 yıllık üyelik açıyor**, ama yenilenmiyor. Bu yüzden
`member_type` böyle bir kişiyi `is_member = true` olmasına rağmen **`donor`**
olarak etiketliyor; `member` yalnızca kendini yenileyen yıllık üyeliğin.

```sql
-- Şu an aktif üyeler
select name, email, membership_end from people where is_member order by membership_end;

-- 30 gün içinde bitecekler (yenileme hatırlatması)
select name, email, membership_end from people
where is_member and membership_end <= current_date + 30 order by membership_end;

-- Hem gönüllü hem üye
select name, email, roles from people where is_member and is_volunteer;

-- En çok destek olanlar
select name, email, total_cad, renewal_count from people order by total_cents desc limit 20;

-- Bekleyen gönüllü başvuruları
select p.name, p.email, a.interests, a.created_at
from activities a join people p on p.id = a.contact_id
where a.kind = 'volunteer_signup' and p.volunteer_status = 'new'
order by a.created_at desc;

-- Bir kişinin bütün geçmişi
select created_at, kind, amount_cents, membership_end, interests
from activities where contact_id = (select id from people where email = 'x@y.ca')
order by created_at;
```

**Güvenlik:** iki tabloda da RLS açık ve hiç policy yok — `anon`/`authenticated`
anahtarlarıyla kimse hiçbir şey okuyamaz/yazamaz, yalnızca Worker'ın kullandığı
`service_role` erişir. `people` görünümü `security_invoker` ile tanımlı, yani
altındaki tabloların kurallarını devralıyor.

## Ek C — E-posta şablonları

İki template, ikisi de **iki dilli** (aynı e-postada TR + EN):

| Template | Ne zaman |
| --- | --- |
| `membership-confirmation` | Yıllık üyelik **ve** tek seferlik bağış |
| `volunteer-confirmation` | Gönüllü başvurusu |

Kaynak dosyalar `docs/email-templates/`. Yerelde görmek için:

```bash
node docs/email-templates/preview.mjs --serve
# → http://localhost:4321
```

Üç varyant çıkar: üyelik, bağış, gönüllü.

### Template değişkenleri

Template yalnızca kullandığı değişkeni işler, fazlası zararsız.

**`membership-confirmation`**

| Değişken | Örnek |
| --- | --- |
| `firstName` / `fullName` | `Ayşe` / `Ayşe Yılmaz` |
| `email` | `ayse@example.ca` |
| `amount` / `currency` | `$25.00` / `CAD` |
| `membershipType` | `yearly` veya `one_time` |
| `autoRenews` | `true` / `false` |
| `membershipStartDate` / `membershipStartDateTr` | `August 2, 2026` / `2 Ağustos 2026` |
| `membershipExpiryDate` / `membershipExpiryDateTr` | `August 2, 2027` / `2 Ağustos 2027` |
| `renewalNoteTr` / `renewalNoteEn` | Hazır cümle — yıllıksa "her yıl yenilenecek", bağışsa "yenilenmez" |
| `receiptUrl` | Square makbuz linki |

**`volunteer-confirmation`**: `firstName`, `fullName`, `email`, `phone`, `interests`

Resend template'lerinde koşul yazılamadığı için, aynı şablon iki durumu da
karşılasın diye cümleyi kod hazır gönderiyor (`renewalNote*`).

### Logo

E-postadaki logo internetten erişilebilir **mutlak bir URL** olmalı:

1. **Resend'e yükle** — Templates → editörde `/image` yaz → `public/tsns.jpeg`
   yükle → **code view** panelinden oluşan `<img src="https://...">` adresini al
2. **`.workers.dev`** — Worker deploy olduğu anda
   `https://tsns.<hesabin>.workers.dev/tsns.jpeg` canlı
3. **`https://tsns.ca/tsns.jpeg`** — şablonlarda yazan adres; domain taşınınca
   kendiliğinden çalışır (kalıcı çözüm)

1 veya 2 için URL'i gömmek:
```bash
node docs/email-templates/preview.mjs --logo https://SENIN/LOGO/ADRESIN.jpg
```

### Hangi e-posta ne zaman gider

| Tetikleyici | Kime | Nasıl |
| --- | --- | --- |
| Gönüllü formu | Gönüllüye | `volunteer-confirmation` template |
| Gönüllü formu | `RESEND_ADMIN_TO` | İç bildirim, `Reply-To` = gönüllü |
| Tek seferlik bağış | Bağışçıya | `membership-confirmation` (`one_time`) |
| Yıllık üyelik | Üyeye | `membership-confirmation` (`yearly`) |
| Her ödeme/başvuru | `RESEND_ADMIN_TO` | İç bildirim + geçmiş özeti |

İç bildirimler template kullanmıyor; operasyoneller ve template'in bilmediği
alanları taşıyorlar (Supabase yazdı mı, kaçıncı yenileme, sandbox mı production
mı). E-postalar `waitUntil` ile **yanıttan sonra** gidiyor — form anında dönüyor,
Resend yavaşlasa da kullanıcı beklemiyor, Resend çökse bile ödeme etkilenmiyor.

Template id'si girilmemişse kod kendi ürettiği HTML'e düşüp loga uyarı yazar.
Akış kırılmaz ama tasarım senin şablonun olmaz.

## Ek D — Sorun giderme

| Belirti | Bak |
| --- | --- |
| Build hemen "name mismatch" ile patlıyor | Panel'deki Worker adı ≠ `wrangler.toml`'daki `name` |
| `Missing entry-point to Worker script` | Build command `npm run build:cf` mi? `worker/index.js` üretilmiş mi? |
| `/api/*` HTML dönüyor | `run_worker_first = ["/api/*"]` uygulanmamış; wrangler v4 mü? |
| Sayfa yenileyince 404 | `not_found_handling = "single-page-application"` eksik |
| Build fail: `crypto.hash is not a function` | Node sürümü eski → `.nvmrc` (22) repoda mı? |
| "Ödeme yapılandırılmamış." (tarayıcıda) | `VITE_*` runtime tarafına girilmiş, ya da girildikten sonra yeniden deploy edilmemiş |
| "Server is not configured for payments" | `SQUARE_ACCESS_TOKEN` / `SQUARE_LOCATION_ID` o Worker'da tanımlı değil |
| Yıllık üyelik hata veriyor | `SQUARE_YEARLY_PLAN_ID` o ortamın planı mı? Sandbox planı production'da çalışmaz |
| Kayıt Supabase'e düşmüyor | Yanıtta `warning: "not_stored"` varsa `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` yanlış ya da SQL çalıştırılmamış |
| Aynı kişi iki kez görünüyor | Olmamalı — `contacts.email` unique. İki farklı adres kullanmış olabilir; elle birleştir |
| `activities` insert hatası | Kısıtlar türe göre: gönüllü başvurusuna tutar, bağışa ilgi alanı yazılamaz |
| E-posta gitmiyor | Cloudflare → Worker → **Logs**; `resend:` ile başlayan satırlar. Sonra Resend → Logs |
| E-postada logo görünmüyor | Logo URL'i henüz canlı değil → Ek C |
| WhatsApp butonu görünmüyor | Eski şablon kalmış; `docs/email-templates/volunteer-confirmation.html`'i yeniden yapıştır |
| Apple Pay butonu yok | Safari + Apple cihaz mı? Domain doğrulandı mı? |
| `ERR_TOO_MANY_REDIRECTS` | SSL/TLS **Flexible** → **Full (strict)** yap |
| Site eski görünüyor | `.workers.dev`'e mi `tsns.ca`'ya mı bakıyorsun? Domain hâlâ Google'da olabilir (adım 6) |

## Ek E — Yerel geliştirme

```bash
cp .env.example .env       # VITE_* değerleri (Vite okur)

# Runtime değişkenleri için .dev.vars aç (repoya girmez):
#   SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   RESEND_API_KEY=...

npm run dev        # sadece arayüz — /api/* çalışmaz
npm run dev:api    # build + wrangler dev — production ile aynı yönlendirme
```

### Sandbox test kartı

`4111 1111 1111 1111` · ileri bir son kullanma tarihi · herhangi bir CVV ·
posta kodu `B3H 1A1`. Sandbox modunda checkout ekranında zaten hatırlatma
olarak gösteriliyor.
