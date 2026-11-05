// Validates a discount/coupon code against server-configured codes.
// Student coupon -> yearly membership for $5 CAD.
//
// Bu uç bir "kod doğru mu?" kahinidir; korumasızken kodlar sınırsız
// denenebiliyordu. Önlemler:
//   - IP başına hız sınırı (COUPON_LIMITER, wrangler.toml)
//   - sabit zamanlı karşılaştırma (yanıt süresinden kod sızmasın)
//   - asıl indirim burada değil, create-subscription'da (Turnstile + kendi hız
//     sınırı ile) yeniden doğrulanır; buradaki "valid" yalnızca arayüz içindir.
// Kodların kendisi de tahmin edilemez olmalı: docs/SETUP.md §4.2.
import { json, rateLimit } from "../_lib/guard";

const MAX_CODE_LENGTH = 64;

/** Uzunluk dışında içerikten bağımsız süre alan eşitlik. */
function safeEqual(a, b) {
  const enc = new TextEncoder();
  const x = enc.encode(a);
  const y = enc.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const blocked = await rateLimit(context, "COUPON_LIMITER");
  if (blocked) return blocked;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, valid: false });
  }

  const code = typeof payload?.code === "string" ? payload.code.trim().toLowerCase() : "";
  if (!code || code.length > MAX_CODE_LENGTH) return json(200, { ok: true, valid: false });

  const validCodes = (env.STUDENT_COUPON_CODES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  // `some` yerine hepsini gez: eşleşmenin listedeki sırası süreye yansımasın.
  let valid = false;
  for (const c of validCodes) if (safeEqual(code, c)) valid = true;

  if (valid) {
    return json(200, {
      ok: true,
      valid: true,
      type: "student_yearly",
      frequency: "yearly",
      amountCents: 500,
    });
  }
  console.warn("coupon: invalid code attempt");
  return json(200, { ok: true, valid: false });
}
