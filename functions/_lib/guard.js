// Kötüye kullanıma karşı koruma: hız sınırı + Cloudflare Turnstile.
//
// Herkese açık her POST ucu (ödeme, abonelik, gönüllü, bülten, kupon) buradan
// geçer. Korumasız bir ödeme ucu "card testing" botlarının — çalıntı kartları
// küçük tutarlarla deneyenlerin — gözde hedefidir; Square bu yüzden hesabı
// askıya alabilir. Form uçları da korumasızken herkes herhangi bir adrese
// bizim alan adımızdan onay e-postası yollatabiliyordu.
//
// İki katman var, ikisi de yapılandırma yoksa *açık* (fail-open) kalır, yani
// değişkenler girilmeden deploy edilse de site çalışmaya devam eder:
//
//   1. Hız sınırı — wrangler.toml'daki [[ratelimits]] bağlamaları. Bağlama
//      yoksa (ör. eski bir wrangler ile yerel geliştirme) atlanır.
//   2. Turnstile — TURNSTILE_SECRET_KEY runtime değişkeni girildiyse zorunlu.
//      Girildiyse frontend'in VITE_TURNSTILE_SITE_KEY ile build edilmiş olması
//      ŞART; aksi halde tarayıcı token göndermez ve tüm formlar 403 alır.
//      Bkz. docs/SETUP.md §4.4.

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export function json(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

/** İstemcinin IP'si. Cloudflare arkasında CF-Connecting-IP her zaman dolu. */
export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim() || "unknown";
}

/**
 * `true` = devam et, `false` = sınır aşıldı.
 *
 * Workers Rate Limiting bağlaması lokasyon (colo) başına ve yaklaşık sayar;
 * kesin bir kota değil, botu yavaşlatan bir fren. Bağlama hata verirse isteği
 * geçiririz: koruma katmanı bir bağışı asla engellememeli.
 */
export async function withinLimit(env, binding, key) {
  const limiter = env?.[binding];
  if (!limiter || typeof limiter.limit !== "function") return true;
  try {
    const { success } = await limiter.limit({ key });
    return success;
  } catch (e) {
    console.error(`rate limiter ${binding} failed`, e);
    return true;
  }
}

/**
 * Turnstile token'ını Cloudflare'e doğrulatır.
 * Gizli anahtar girilmemişse koruma kapalıdır ve `true` döner.
 */
export async function verifyTurnstile(env, token, ip) {
  const secret = env?.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip && ip !== "unknown") form.append("remoteip", ip);

  try {
    const res = await fetch(SITEVERIFY_URL, { method: "POST", body: form });
    const data = await res.json();
    if (!data.success) console.warn("turnstile rejected", data["error-codes"]);
    return !!data.success;
  } catch (e) {
    // Cloudflare'in kendi servisine ulaşılamıyorsa (çok nadir) kapalı kalırız:
    // doğrulanamayan bir isteği ödeme ucuna geçirmek tam da engellemek
    // istediğimiz şey.
    console.error("turnstile siteverify unreachable", e);
    return false;
  }
}

const TOO_MANY = {
  ok: false,
  error: "Too many attempts. Please wait a minute and try again. / Çok fazla deneme yapıldı, lütfen bir dakika sonra tekrar deneyin.",
  code: "rate_limited",
};

const NOT_HUMAN = {
  ok: false,
  error: "Security check failed. Please refresh the page and try again. / Güvenlik doğrulaması başarısız, sayfayı yenileyip tekrar deneyin.",
  code: "turnstile_failed",
};

/**
 * Bir uç için hız sınırını uygular. Engellenirse hazır bir 429 yanıtı,
 * geçerse `null` döner.
 *
 *   const blocked = await rateLimit(context, "PAYMENT_LIMITER");
 *   if (blocked) return blocked;
 *
 * `extraKeys` ile IP'ye ek olarak başka anahtarlar da sayılabilir (ör.
 * e-posta adresi — aynı adrese farklı IP'lerden yüklenmeyi frenler);
 * `{ perIp: false }` IP sayımını kapatır.
 */
export async function rateLimit({ request, env }, binding, extraKeys = [], { perIp = true } = {}) {
  const keys = [...(perIp ? [`ip:${clientIp(request)}`] : []), ...extraKeys.filter(Boolean)];
  for (const key of keys) {
    if (!(await withinLimit(env, binding, key))) {
      console.warn(`rate limited ${binding}`, key);
      return json(429, TOO_MANY, { "Retry-After": "60" });
    }
  }
  return null;
}

/** Turnstile doğrulaması. Başarısızsa hazır bir 403 yanıtı, geçerse `null`. */
export async function requireHuman({ request, env }, token) {
  if (await verifyTurnstile(env, token, clientIp(request))) return null;
  return json(403, NOT_HUMAN);
}
