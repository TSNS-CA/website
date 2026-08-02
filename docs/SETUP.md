# tsns.ca — Kurulum ve Operasyon Rehberi

Bu doküman **senin panellerde yapman gereken** adımları anlatır. Koddaki her şey
zaten hazır; aşağıdaki değişkenler girilmediğinde ilgili özellik sessizce devre
dışı kalır (ödeme/gönüllü akışı çökmez, sadece e-posta veya kayıt atlanır).

Sıra önemli — özellikle **domain'e en son dokun**. Site preview URL'inde
çalışmadan `tsns.ca`'yı taşırsan, eski Google Sites'ı çalışmayan bir şeyle
değiştirmiş olursun:

**1) Worker projesi → 2) Supabase → 3) Resend → 4) Square Sandbox →
5) Değişkenler → 6) workers.dev'de test → 7) Domain + DNS → 8) Apple Pay →
9) Square Production**

---

## 0. Mimari — nerede ne çalışıyor

| Katman | Nerede | Not |
| --- | --- | --- |
| Statik site | Cloudflare Worker static assets (`dist/`) | `VITE_*` değişkenleri **build sırasında** gömülür |
| API | `functions/api/*` → tek Worker script'ine derleniyor | `SQUARE_*`, `SUPABASE_*`, `RESEND_*` **runtime**'da okunur |
| Veritabanı | Supabase (`contacts` + `activities`, `people` view) | Sadece `service_role` erişir, RLS kapalı-erişim |
| Ödeme | Square (Web Payments SDK + Payments/Subscriptions API) | Apple Pay dahil |
| E-posta | Resend | Üye/bağışçı makbuzu, gönüllü onayı, yönetim bildirimi |

Uç noktalar:

- `POST /api/volunteer` — gönüllü kaydı + onay e-postası + yönetim bildirimi
- `POST /api/create-payment` — tek seferlik bağış
- `POST /api/create-subscription` — yıllık üyelik (abonelik)
- `POST /api/coupon` — öğrenci indirim kodu doğrulama

---

## 1. Cloudflare Worker projesini kur

Cloudflare'de "Workers & Pages" tek bir sayfa, ama oluştururken **iki farklı
proje türünden** birini seçiyorsun. Sen Workers tarafından oluşturmuşsun — ki
Cloudflare'in de yeni projeler için önerdiği yol bu; Pages artık bakım modunda.
Repo buna göre ayarlandı, Pages'e geçmene gerek yok.

### Neden ilk deploy patladı

Build başarılıydı, `npx wrangler deploy` patladı:

```
✘ [ERROR] Missing entry-point to Worker script or to assets directory
```

`wrangler.toml` Pages tarzı yazılmıştı (sadece `name` + `compatibility_date`);
Workers ise "hangi script" ve "hangi klasör" bilgisini istiyor. Artık dosyada
ikisi de var.

### Build ayarları

| Alan | Değer |
| --- | --- |
| Build command | `npm run build:cf` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Non-production branch builds | açık (preview URL'leri için) |

`npm run build:cf` iki iş yapıyor: Vite ile siteyi `dist/`'e basıyor, sonra
`wrangler pages functions build` ile `functions/` klasörünü tek bir Worker
script'ine (`worker/index.js`) derliyor. Cloudflare bu derlemeyi resmî olarak
destekliyor — dosya bazlı yönlendirmeyi elden çıkarmadan Workers'a geçmenin yolu bu.

### ⚠️ Worker adı `wrangler.toml` ile aynı olmalı

Panel'deki Worker adı ile `wrangler.toml`'daki `name` **birebir aynı** değilse
build daha başlamadan hata verir. Dosyada şu an:

```toml
name = "tsns-ca-website"
```

Panel'deki Worker'ın adı farklıysa ya Worker'ı yeniden adlandır ya da bu satırı
panel'deki isme çevir. (Bu isim aynı zamanda `<isim>.workers.dev` adresini belirler.)

### `wrangler.toml` neden böyle

```toml
main = "./worker/index.js"          # derlenmiş API
preview_urls = true                 # branch başına önizleme adresi

[assets]
directory = "./dist"                # Vite çıktısı
binding = "ASSETS"
not_found_handling = "single-page-application"
run_worker_first = ["/api/*"]
```

Son iki satır kritik ve buradaki asıl tuzak:

- React Router `/bagis`, `/gonullu`, `/about` gibi yolları yönetiyor ve bunların
  hiçbiri diske yazılı bir dosya değil. `not_found_handling` olmadan hepsi 404 verir.
- Ama Workers, Pages'in **tersine**, önce static asset sunuyor. SPA fallback açıkken
  `/api/volunteer` isteği API'ye hiç ulaşmadan `index.html` ile yanıtlanırdı.
  `run_worker_first = ["/api/*"]` sırayı sadece API için geri çeviriyor; sayfa
  yüklemeleri saf asset isteği olarak kalıyor (Worker invocation olarak faturalanmıyor).

Bu dizi sözdizimi **wrangler v4** gerektiriyor. İlk build'in 3.114 kullanmıştı;
repodaki `package.json` artık v4'e sabitli.

### Test edildi

Bu yapı yerelde `wrangler dev` ile uçtan uca doğrulandı: ana sayfa ve SPA
rotaları 200, `/api/coupon` ve `/api/volunteer` doğru JSON dönüyor, gönüllü kaydı
Supabase'e gidiyor, `public/_headers` uygulanıyor ve Apple Pay dosyası
`text/plain` olarak byte-birebir dönüyor.

### İlk deploy'u doğrula

```bash
curl -s https://<worker-adi>.<hesabin>.workers.dev/ | grep -o "<title>[^<]*</title>"
# beklenen: <title>Nova Scotia Türk Derneği | Turkish Society of Nova Scotia</title>

curl -s -X POST https://<worker-adi>.<hesabin>.workers.dev/api/coupon \
  -H 'Content-Type: application/json' -d '{"code":"x"}'
# beklenen: {"ok":true,"valid":false}   -> API çalışıyor demektir
```

`/api/coupon` HTML dönüyorsa `run_worker_first` uygulanmamıştır.

---

## 2. Supabase

### 2.1 Projeyi aç

1. [supabase.com](https://supabase.com) → **New project**
   - Region: Halifax'a en yakını (**East US** ya da **Canada Central**)
   - Database password'ü parola yöneticine kaydet
2. **Project Settings → API**:
   - `Project URL` → `SUPABASE_URL`
   - `service_role` **secret** anahtarı → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ `service_role` RLS'i tamamen bypass eder. Asla `VITE_` önekiyle tanımlama,
> asla frontend'e koyma, asla repoya commit'leme. Sadece Cloudflare değişkeni
> olarak yaşamalı.

### 2.2 SQL'i nerede çalıştıracaksın

Repodaki migration dosyalarını **Supabase panelinde** çalıştırıyorsun —
terminalde değil, Cloudflare'de değil. Sırayla `0001` sonra `0002`; ya da
sadece `0002` (tek başına da çalışır, sıfır veritabanında da doğru şemayı kurar):

1. Supabase Dashboard → projen
2. Sol menüden **SQL Editor**
3. **+ New query**
4. `supabase/migrations/0002_contacts_activities.sql` dosyasının **tamamını**
   kopyalayıp editöre yapıştır
5. Sağ altta **Run** (veya ⌘+Enter)

Alt tarafta `Success. No rows returned` görmelisin. Dosya **idempotent** —
yeniden çalıştırmak zarar vermez, mevcut tabloları bozmaz. Postgres 17'de
çalıştırılarak test edildi.

Sonra **Table Editor**'da `contacts` ve `activities` tablolarını, **Database →
Views** altında da `people` ve `members` görünümlerini görmelisin.

`0001`'i daha önce çalıştırdıysan `0002` eski `donors`/`volunteers` verisini yeni
yapıya taşıyıp o tabloları kaldırıyor — aynı e-posta iki tablodaysa tek kişide
birleştiriyor. Bu taşıma da test edildi.

### 2.3 Neden iki tablo — tek tablo ve dört tablo neden olmadı

Kısa cevap: **bölmeyi "gönüllü mü bağışçı mı" diye değil, "kişi mi olay mı" diye
yapıyoruz.** Toplam iki tablo.

Önceki yapıda `donors` ve `volunteers` diye iki tablo vardı ve bölme yanlış
eksendeydi. Aynı insan hem gönüllü olup hem üye olduğunda iki ayrı satır
oluşuyor, aralarında hiçbir bağ bulunmuyordu: adı ve telefonu iki yerde tekrar
ediyor, biri güncellenince diğeri eskiyor, "bu gönüllü aynı zamanda üye mi?"
sorusunun güvenilir cevabı olmuyordu.

**Her şeyi tek tabloya koymak** da çözmüyor. İki kötü seçenekten birine
düşersin: ya her ödeme satırında kişi bilgisini tekrar edersin (aynı insanın
adı 5 satırda, biri güncellenince diğerleri yalan söyler), ya da kişi başına tek
satır tutup **ödeme geçmişini kaybedersin** — o zaman "2025'te ne kadar
topladık", "kim kaç kere yeniledi", "makbuz hangi ödemeye ait" sorularının
cevabı kalmaz. Bir dernek için mali geçmiş kaybedilemez.

**Her tür için ayrı tablo** (üye / bağışçı / gönüllü) ise aynı hatanın büyütülmüş
hâli: aynı insan üç tabloda üç kez.

Doğru sınır şu: *kişi* ile *olay* farklı şeylerdir.

| Tablo | Ne | Örnek |
| --- | --- | --- |
| `contacts` | **İnsan başına bir satır** | Ahmet Demir, ahmet@example.ca |
| `activities` | **Olan her şey için bir satır** | 2023: gönüllü başvurusu · 2024: üyelik · 2025: bağış |

Tek seferlik bağış yapan için ayrı tablo gerekmiyor — o da bir `activities`
satırı, sadece `kind = 'donation'`. Yeni bir ilişki türü çıkarsa (etkinlik
kaydı, bağış sözü) yine yeni tablo değil, yeni bir `kind` oluyor.

### 2.4 Aynı kişinin ikiye bölünmemesi

`contacts.email` **unique** ve her zaman küçük harf (veritabanı kısıtı
zorluyor). Kod da her yazmadan önce e-postaya göre *upsert* yapıyor. Yani:

- Gönüllü olan biri sonradan yıllık üye olursa → **aynı** `contacts` satırı, iki
  `activities` kaydı
- `Ahmet@Example.CA` ile `ahmet@example.ca` → aynı kişi
- İkinci başvuruda telefon vermezse → daha önce verdiği telefon **silinmez**
  (upsert yalnızca dolu alanları yazar)

Bu uçtan uca test edildi: aynı kişi büyük harfli e-postayla gönüllü olup sonra
küçük harfle tekrar başvurduğunda tek kişi + iki aktivite kalıyor, ardından üye
olunca `roles` değeri `{member, volunteer}` oluyor ve hâlâ tek kişi.

### 2.4.1 `contacts` kolonları

| Kolon | |
| --- | --- |
| `email` | Kimlik. Unique, küçük harf zorunlu |
| `name`, `phone` | En son bildiği bilgiler |
| `preferred_lang` | `tr` / `en` — e-postaları hangi dilde göndereceğimiz |
| `volunteer_status` | `new` / `contacted` / `active` / `inactive` — gönüllü değilse boş |
| `notes` | Serbest not |

### 2.4.2 `activities` kolonları

| Kolon | |
| --- | --- |
| `kind` | `membership` / `donation` / `volunteer_signup` |
| `amount_cents`, `currency`, `status` | Para (gönüllü başvurusunda boş) |
| `membership_start`, `membership_end` | Üyelik penceresi (yalnızca `membership`) |
| `student_coupon` | Öğrenci indirimi kullanıldı mı |
| `interests` | Gönüllünün ilgi alanları (yalnızca `volunteer_signup`) |
| `square_*` | Square müşteri / ödeme / abonelik id'leri |

Tek tabloda üç tür olay tutmanın bedeli, ilgisiz kolonların boş kalması. Bunu
**CHECK kısıtlarıyla** güvenli hâle getirdik: gönüllü başvurusuna tutar
yazılamıyor, bağışa üyelik tarihi veya ilgi alanı yazılamıyor, üyelikte tutar
zorunlu, bitiş tarihi başlangıçtan önce olamıyor. On kısıtın hepsi hatalı veriyi
gerçekten reddediyor (Postgres 17'de test edildi).

### 2.4.3 `people` görünümü — kişi başına özet

```sql
select * from people order by first_seen_at desc;
```

`member_type` istediğin tek etiketi veriyor, ama önce şunu bilmek lazım: **bir
insan aynı anda hem gönüllü hem üye olabildiği için tek değerli bir kolon
gerçeği anlatamaz.** Bu yüzden görünüm ikisini birden sunuyor:

- `roles` — dizi, hepsini gösterir: `{member, volunteer}`
- `is_member`, `was_member`, `is_volunteer`, `is_donor` — filtrelemek için
- `member_type` — tek etiket, öncelik sırası: **aktif üye > gönüllü > eski üye >
  bağışçı > sadece kayıtlı kişi**

Diğer kolonlar: `first_seen_at` (ilk kayıt tarihi, sabit), `last_activity_at`,
`membership_end`, `payment_count`, `membership_count`, `renewal_count`
(kaç kere yenilemiş), `donation_count`, `volunteer_signup_count`,
`total_cad` / `membership_cad` / `donation_cad` (ne kadar ödemiş, kırılımlı),
`largest_payment_cents`, `ever_used_student_discount`, `volunteer_status`.

Tüm kombinasyonlar test edildi:

| Kişi | member_type | roles |
| --- | --- | --- |
| Sadece gönüllü | `volunteer` | `{volunteer}` |
| Sadece tek seferlik bağış (üyeliği sürüyor) | `donor` | `{member, donor}` |
| Aktif üye | `member` | `{member}` |
| Üyeliği bitmiş | `former_member` | `{former_member}` |
| Gönüllü + aktif üye | `member` | `{member, volunteer}` |
| Gönüllü + eski üye + bağışçı | `volunteer` | `{former_member, volunteer, donor}` |
| Kayıtlı ama hiç aktivitesi yok | `contact` | `{}` |

`members` görünümü de duruyor — `people`'ın üyelik ilişkisi olanlara
daraltılmış hâli.

### 2.4.4 İşe yarayacak sorgular

```sql
-- Şu an aktif üyeler
select name, email, membership_end from people where is_member order by membership_end;

-- 30 gün içinde üyeliği bitecekler (yenileme hatırlatması)
select name, email, membership_end from people
where is_member and membership_end <= current_date + 30 order by membership_end;

-- Hem gönüllü hem üye olanlar
select name, email, roles from people where is_member and is_volunteer;

-- En çok destek olanlar
select name, email, total_cad, renewal_count from people
order by total_cents desc limit 20;

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

### 2.5 Güvenlik

`contacts` ve `activities` tablolarında RLS **açık ve hiç policy yok**. Yani
`anon`/`authenticated` anahtarlarıyla kimse hiçbir şey okuyup yazamıyor;
yalnızca Worker'ın kullandığı `service_role` erişiyor. Panelden sen her zaman
görebilirsin.

---

## 3. Resend (e-posta)

Onay e-postaları **Resend'de hazırlanmış template'ler** ile gidiyor. İki template
var ve her ikisi de **iki dilli** (aynı e-postanın içinde hem Türkçe hem
İngilizce), o yüzden dile göre ayrı id gerekmiyor:

| Template | Ne zaman | Env değişkeni |
| --- | --- | --- |
| `membership-confirmation` | Yıllık üyelik **ve** tek seferlik bağış | `RESEND_MEMBERSHIP_TEMPLATE_ID` |
| `volunteer-confirmation` | Gönüllü başvurusu | `RESEND_VOLUNTEER_TEMPLATE_ID` |

Template'in kendi **from adresi, konusu ve tasarımı** Resend panelinde duruyor;
kod yalnızca id ve değişkenleri gönderiyor. Yani metni değiştirmek için deploy
gerekmiyor, Resend'den düzenlemen yeterli.

Kod ayrı bir paket kurmuyor, Resend REST API'sini `fetch` ile çağırıyor —
Cloudflare Workers'da doğrusu bu.

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
| `RESEND_MEMBERSHIP_TEMPLATE_ID` | template uuid'si | evet |
| `RESEND_VOLUNTEER_TEMPLATE_ID` | template uuid'si | evet |
| `RESEND_FROM` | `Nova Scotia Türk Derneği <info@tsns.ca>` | iç bildirimler için |
| `RESEND_REPLY_TO` | `info@tsns.ca` | hayır |
| `RESEND_ADMIN_TO` | `info@tsns.ca,baskan@tsns.ca` | hayır |

Template id'lerini Resend → **Templates** → ilgili template → ayarlarından
alıyorsun.

`RESEND_FROM` yalnızca **iç bildirimler** ve template id'si girilmediğindeki
yedek için kullanılıyor; içindeki domain doğrulanmış olmalı yoksa Resend 403
döner. Template id'si boş bırakılırsa kod sessizce kendi ürettiği HTML'e düşer
ve loga uyarı yazar — akış kırılmaz ama tasarım senin template'in olmaz.

### 3.3.1 Template'lerin kullanabileceği değişkenler

Template yalnızca kendi kullandığı değişkeni işler, fazlası zararsız.

**`membership-confirmation`**

| Değişken | Örnek |
| --- | --- |
| `firstName` / `fullName` | `Ayşe` / `Ayşe Yılmaz` |
| `email` | `ayse@example.ca` |
| `amount` / `currency` | `$25.00` / `CAD` |
| `membershipType` | `yearly` veya `one_time` |
| `autoRenews` | `true` (yıllık) / `false` (tek seferlik) |
| `membershipStartDate` / `membershipStartDateTr` | `August 2, 2026` / `2 Ağustos 2026` |
| `membershipExpiryDate` / `membershipExpiryDateTr` | `August 2, 2027` / `2 Ağustos 2027` |
| `receiptUrl` | Square makbuz linki (bağışlarda) |

Tarihlerin hem İngilizce hem Türkçe hâli geçiliyor; template iki dilli olduğu
için her yarısında uygun olanı kullanabilirsin. `autoRenews` ile "üyeliğiniz her
yıl yenilenecek" / "bu üyelik yenilenmez" ayrımını yapabilirsin.

**`volunteer-confirmation`**

`firstName`, `fullName`, `email`, `phone`, `interests`

### 3.4 Hangi e-posta ne zaman gider

| Tetikleyici | Kime | Nasıl |
| --- | --- | --- |
| Gönüllü formu | Gönüllüye | `volunteer-confirmation` template |
| Gönüllü formu | `RESEND_ADMIN_TO` | İç bildirim (HTML), `Reply-To` = gönüllü |
| Tek seferlik bağış | Bağışçıya | `membership-confirmation` template (`membershipType=one_time`) |
| Tek seferlik bağış | `RESEND_ADMIN_TO` | İç bildirim + geçmiş özeti |
| Yıllık üyelik | Üyeye | `membership-confirmation` template (`membershipType=yearly`) |
| Yıllık üyelik | `RESEND_ADMIN_TO` | İç bildirim (kaçıncı yenileme, toplam destek dahil) |

İç bildirimler template kullanmıyor — onlar operasyonel, tasarıma ihtiyaçları
yok ve template'in bilmediği alanları taşıyorlar (Supabase'e yazıldı mı,
kaçıncı yenileme, sandbox mı production mı). E-postalar
`waitUntil` ile **yanıttan sonra** gönderiliyor; form anında dönüyor, Resend
yavaşlarsa kullanıcı beklemiyor. Resend hata verirse ödeme/kayıt yine başarılı
sayılır, hata Cloudflare loglarına düşer.

**Kontrol:** `/gonullu` formunu kendi adresinle doldur → hem sana hem
`RESEND_ADMIN_TO` adresine mail gelmeli. Gelmezse Resend → **Logs** sekmesine bak.

---

## 4. Square

Kodda ortam ayrımı hazır: `SQUARE_ENV` / `VITE_SQUARE_ENV` değerine göre hem API
host'u (`connect.squareupsandbox.com` ↔ `connect.squareup.com`) hem de
tarayıcıdaki SDK (`sandbox.web.squarecdn.com` ↔ `web.squarecdn.com`) otomatik
değişiyor. Sen sadece değişkenleri doğru yere koyuyorsun.

### 4.1 Sandbox değerleri

Square Developer Dashboard → uygulaman → **Sandbox** sekmesi:
- `Application ID` → `VITE_SQUARE_APPLICATION_ID`
- `Access token` → `SQUARE_ACCESS_TOKEN`
- **Locations** → sandbox location → `SQUARE_LOCATION_ID` ve `VITE_SQUARE_LOCATION_ID`

### 4.2 Yıllık üyelik planı

Yıllık üyelik Square **Subscriptions** kullanıyor:

1. Square Dashboard → **Items & Orders → Subscription plans**
2. Yeni plan: cadence **ANNUAL**, para birimi **CAD**
3. Plan **variation id**'si → `SQUARE_YEARLY_PLAN_ID`
4. Planı sandbox ve production'da **ayrı ayrı** oluşturman gerekir; id'ler farklı olur

Tutar plandaki fiyattan bağımsız: kod `price_override_money` ile kullanıcının
seçtiği tutarı (öğrenci kuponuyla $5) geçiyor. Üyelik penceresi de kayda
`membership_start` / `membership_end` olarak yazılıyor.

### 4.3 Production değerleri

**Production** sekmesinde aynı üç değer. Production access token'ı alabilmen için
Square hesabının aktivasyonu (iş bilgileri, banka hesabı) tamamlanmış olmalı.

### 4.4 Sandbox'tan production'a geçiş — Workers'ta nasıl

Pages'te Preview ve Production için iki ayrı değişken listesi vardı. **Workers'ta
bu yok** — Cloudflare'in kendi dokümanı açıkça söylüyor: Workers, production ve
non-production build'ler için farklı binding tanımlamayı henüz desteklemiyor.

Bu site için pratik yol **tek Worker**:

1. Önce sandbox değerleriyle doldur, `.workers.dev` adresinde test kartıyla dene
2. Her şey çalışınca aynı değişkenleri production değerleriyle **değiştir**
3. Yeniden deploy et (`VITE_*` değiştiği için build şart)

> ⚠️ **Preview URL tuzağı.** `preview_urls = true` sayesinde her branch'in
> önizleme adresi olur, **ama önizlemeler production Worker'ının değişkenlerini
> kullanır.** Yani production Square anahtarlarına geçtikten sonra bir preview
> URL'inde ödeme denersen **gerçek kart çekilir**. Geçiş sonrası ödeme testlerini
> sadece küçük tutarlı gerçek bağış + iade ile yap.

İleride gerçekten kalıcı bir staging istersen: `wrangler.toml`'a
`[env.staging]` ekleyip ikinci bir Worker (`tsns-ca-website-staging`) deploy
edilir, sandbox anahtarları orada yaşar. Şimdilik gereksiz karmaşıklık.

---

## 5. Cloudflare değişkenleri

Workers'ta **iki ayrı yer** var ve karıştırmak en sık yaşanan hata:

| Nereye | Ne zaman okunur | Buraya ne girecek |
| --- | --- | --- |
| **Settings → Variables and Secrets** | Worker çalışırken (runtime) | `SQUARE_*`, `SUPABASE_*`, `RESEND_*`, `STUDENT_COUPON_CODES` |
| **Settings → Build → Build variables and secrets** | Build sırasında | `VITE_*` olan her şey |

Sebep: `VITE_` ile başlayanlar Vite tarafından **build sırasında JS'e gömülür**.
Runtime tarafına koyarsan build onları göremez ve tarayıcıda "Ödeme
yapılandırılmamış." hatası alırsın. Pages'te bu ikisi tek listede toplanıyordu;
Workers'ta ayrı.

### Runtime (Variables and Secrets)

Gizli olanları **Secret** olarak işaretle (değeri sonradan görüntülenemez):

```
SQUARE_ENV                 = sandbox            # sonra: production
SQUARE_ACCESS_TOKEN        = <access token>     [Secret]
SQUARE_LOCATION_ID         = <location id>
SQUARE_YEARLY_PLAN_ID      = <plan variation id>

SUPABASE_URL               = https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  = <service_role>     [Secret]

RESEND_API_KEY                = re_...          [Secret]
RESEND_MEMBERSHIP_TEMPLATE_ID = <template uuid>
RESEND_VOLUNTEER_TEMPLATE_ID  = <template uuid>
RESEND_FROM                = Nova Scotia Türk Derneği <info@tsns.ca>
RESEND_REPLY_TO            = info@tsns.ca
RESEND_ADMIN_TO            = info@tsns.ca

STUDENT_COUPON_CODES       = OGRENCI2026
```

### Build (Build variables and secrets)

```
VITE_SQUARE_ENV            = sandbox            # sonra: production
VITE_SQUARE_APPLICATION_ID = <application id>
VITE_SQUARE_LOCATION_ID    = <location id>
```

Bunlar tarayıcıda görünür — sorun değil, Square application id ve location id
zaten public değerlerdir. **Gizli hiçbir şeyi `VITE_` önekiyle tanımlama.**

Bu üçünü her değiştirdiğinde **yeni deploy** gerekiyor; kaydetmek yetmez.

### Yerel geliştirme

```bash
cp .env.example .env       # VITE_* için (Vite okur)
# runtime değişkenleri için .dev.vars dosyası aç (repoya girmez):
#   SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   RESEND_API_KEY=...

npm run dev        # sadece arayüz, /api/* çalışmaz
npm run dev:api    # build + wrangler dev — production ile aynı yönlendirme
```

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

> ⚠️ Bu adım **eski siteyi canlıdan indirir.** Önce yeni siteyi `.workers.dev`
> adresinde tam test et.

### Önce karar ver: apex mi, www mi?

Biri "kanonik" olmalı, diğeri ona yönlenmeli. Öneri: **apex kanonik**
(`tsns.ca`), çünkü Square'de Apple Pay domain'ini `tsns.ca` olarak kaydettin ve
o dosyanın **yönlendirme olmadan** apex'ten dönmesi gerekiyor.

### Adımlar

1. **Eski Google kayıtlarını sil.** Cloudflare → `tsns.ca` zone → **DNS** →
   `216.239.*` A kayıtları ve `www` → `ghs.googlehosted.com` CNAME'i sil.
   (Silmeden önce ekran görüntüsü al — geri dönmen gerekirse lazım olur.)
2. **Worker'a custom domain ekle.** Workers & Pages → Worker'ın → **Settings →
   Domains & Routes** → **Add → Custom domain** → `tsns.ca`. Cloudflare gerekli
   kaydı kendisi oluşturur. Aynı yerden `www.tsns.ca`'yı da ekle.
   (Not: Workers yalnızca nameserver'ı Cloudflare'de olan domainleri kabul eder —
   `tsns.ca` zaten öyle.)
3. **Yönlendirmeyi kur.** `www` → apex yönlendirmesi için Cloudflare →
   **Rules** → **Redirect Rules** → *Create rule*:
   - Eşleşme: `Hostname` **equals** `www.tsns.ca`
   - Aksiyon: **Dynamic redirect** → `concat("https://tsns.ca", http.request.uri.path)`
   - Durum kodu: **301**, *Preserve query string* açık.
4. **SSL/TLS modunu kontrol et.** Cloudflare → SSL/TLS → **Full (strict)**
   olmalı. "Flexible" moddaysa Worker ile sonsuz yönlendirme döngüsü oluşur.
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
bu yolu `text/plain`'e sabitliyor. Build çıktısında ve `wrangler dev`
altında test edildi: `200`, `text/plain`, gövde sha256 eşleşiyor.

Sana kalanlar:

3. **PR'ı `main`'e merge et** ve production deploy'un bitmesini bekle.
   (Dosya `worktree-site-redesign` dalında; `main`'e geçmeden canlıda olmaz.)
4. **Domain'i Worker'a bağla** — bölüm 6. Bu yapılmadan `https://tsns.ca` zaten
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

- **HTTPS zorunlu** ve sertifika geçerli olmalı. Cloudflare bunu custom domain
  eklendiğinde otomatik veriyor.
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

- [ ] Worker adı `wrangler.toml`'daki `name` ile aynı
- [ ] Build command `npm run build:cf`, deploy command `npx wrangler deploy`
- [ ] İlk deploy `.workers.dev`'de açılıyor, `/api/coupon` JSON dönüyor
- [ ] Supabase projesi açıldı, SQL Editor'da `0002` çalıştırıldı,
      `people` görünümü görünüyor
- [ ] Resend'de `tsns.ca` **Verified**
- [ ] Runtime değişkenleri **Variables and Secrets**'a, `VITE_*` olanlar
      **Build variables**'a girildi (sandbox değerleriyle)
- [ ] `.workers.dev` adresinde: gönüllü formu + sandbox kartla test bağış
      denendi, e-postalar geldi, `contacts` + `activities` kaydı düştü
- [ ] Square production hesabı aktif, production plan oluşturuldu
- [ ] Değişkenler production Square değerleriyle güncellendi + yeniden deploy
- [ ] PR `main`'e merge edildi → deploy geçti
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
| `/api/*` HTML dönüyor | `run_worker_first = ["/api/*"]` uygulanmamış; wrangler v4 mü, `main` doğru mu? |
| `Missing entry-point to Worker script` | `wrangler.toml`'da `main` / `[assets] directory` yok ya da build `worker/index.js` üretmemiş (build command `npm run build:cf` mi?) |
| Build hemen "name mismatch" ile patlıyor | Panel'deki Worker adı ile `wrangler.toml`'daki `name` farklı |
| Sayfa yenileyince 404 | `not_found_handling = "single-page-application"` eksik |
| Site açılıyor ama boş/eski görünüyor | `.workers.dev` mi yoksa `tsns.ca` mı bakıyorsun? Domain hâlâ Google Sites'a bakıyor olabilir (bölüm 6). |
| `ERR_TOO_MANY_REDIRECTS` | SSL/TLS modu **Flexible** → **Full (strict)** yap |
| E-posta gitmiyor | Cloudflare → Worker → **Logs** (canlı akış); `email:` ile başlayan satırlar. Sonra Resend → Logs. |
| "Server is not configured for payments" | `SQUARE_ACCESS_TOKEN` veya `SQUARE_LOCATION_ID` o ortamda tanımlı değil |
| "Ödeme yapılandırılmamış." (tarayıcıda) | `VITE_*` değişkenleri **Build variables** yerine runtime tarafına girilmiş, ya da girildikten sonra yeniden deploy edilmemiş |
| Kayıt Supabase'e düşmüyor | `warning: "not_stored"` dönüyorsa `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` yanlış ya da migration çalıştırılmamış |
| Aynı kişi iki kez görünüyor | Olmamalı — `contacts.email` unique. İki farklı e-posta adresi kullanmış olabilir; `contacts`'ta elle birleştir |
| Apple Pay butonu görünmüyor | Safari + Apple cihaz mı? Domain doğrulandı mı? Konsolda Square SDK hatası var mı? |
| Yıllık üyelik hata veriyor | `SQUARE_YEARLY_PLAN_ID` o ortamın planına ait mi? Sandbox planı production'da çalışmaz. |
| `activities` insert hatası | Kısıtlar türe göre: gönüllü başvurusuna tutar, bağışa üyelik tarihi/ilgi alanı yazılamaz |
