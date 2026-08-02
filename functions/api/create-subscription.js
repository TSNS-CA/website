import {
  upsertContact,
  recordActivity,
  lookupPerson,
  describeHistory,
  membershipWindow,
  normalizeEmail,
} from "../_lib/supabase";
import { sendMemberConfirmation, sendAdminNotice } from "../_lib/email";

const SQUARE_API_VERSION = "2024-10-17";
const MIN_AMOUNT_CENTS = 1000; // $10 minimum (unless a valid student coupon)
const STUDENT_AMOUNT_CENTS = 500; // $5 with student coupon

function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

function base(env) {
  return env.SQUARE_ENV === "production" ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
}

async function squarePost(env, path, body) {
  const res = await fetch(`${base(env)}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
      "Square-Version": SQUARE_API_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  let parsed = null;
  try { parsed = await res.json(); } catch (e) {}
  return { ok: res.ok, status: res.status, body: parsed };
}

/**
 * Best-effort E.164 for Square's customer API.
 *
 * People type "(902) 555-0134", "902 555 0134" or "+90 532 ...". Square wants
 * a phone number it recognises and rejects the whole customer otherwise.
 * Returns null when there is nothing sensible to send — the caller then simply
 * leaves the field out.
 */
function toE164(raw) {
  if (!raw) return null;
  const text = String(raw).trim();
  const digits = text.replace(/\D/g, "");
  if (!digits) return null;
  if (text.startsWith("+")) return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
  if (digits.length === 10) return `+1${digits}`; // Canada/US, no country code
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // "0532 111 22 33" — Turkish national format: trunk prefix 0, then ten
  // digits. Our members are Turkish, so this is the second most likely thing
  // to be typed after a Canadian number. Turkish numbers start with 5 (mobile)
  // or 2-4 (landline area codes) once the 0 is dropped, which keeps a UK
  // "07..." from being mistaken for one.
  if (digits.length === 11 && digits.startsWith("0") && /[2-5]/.test(digits[1])) {
    return `+90${digits.slice(1)}`;
  }
  // Any other leading zero is a trunk prefix we cannot resolve without knowing
  // the country. Guessing is worse than sending nothing — Supabase keeps the
  // number either way.
  if (digits.startsWith("0")) return null;
  return digits.length >= 8 && digits.length <= 15 ? `+${digits}` : null;
}

function firstError(body) {
  return Array.isArray(body?.errors) && body.errors[0] ? body.errors[0] : null;
}

function isStudentCoupon(env, code) {
  const validCodes = (env.STUDENT_COUPON_CODES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return typeof code === "string" && code.trim().length > 0 && validCodes.includes(code.trim().toLowerCase());
}


export async function onRequestPost(context) {
  const { request, env } = context;
  const { SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_YEARLY_PLAN_ID } = env;
  if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
    return json(500, { ok: false, error: "Server is not configured for payments." });
  }

  let payload;
  try { payload = await request.json(); } catch { return json(400, { ok: false, error: "Invalid JSON body." }); }

  const { sourceId, amountCents, couponCode, buyer, idempotencyKey } = payload || {};

  if (typeof sourceId !== "string" || sourceId.length === 0) {
    return json(400, { ok: false, error: "Missing card token." });
  }
  if (!SQUARE_YEARLY_PLAN_ID) {
    return json(500, { ok: false, error: "Yearly plan is not configured." });
  }
  if (!buyer?.email) {
    return json(400, { ok: false, error: "Email is required for a yearly membership." });
  }

  // Resolve the final charge: student coupon -> $5; otherwise the chosen amount (min $10).
  const couponUsed = couponCode ? isStudentCoupon(env, couponCode) : false;
  if (couponCode && !couponUsed) {
    return json(400, { ok: false, error: "Invalid discount code." });
  }
  const finalAmountCents = couponUsed
    ? STUDENT_AMOUNT_CENTS
    : Math.max(MIN_AMOUNT_CENTS, Number.isInteger(amountCents) ? amountCents : MIN_AMOUNT_CENTS);

  const key = typeof idempotencyKey === "string" && idempotencyKey.length >= 8 ? idempotencyKey : crypto.randomUUID();
  const names = (buyer.name || "").trim().split(/\s+/);
  const given = names[0] || "Supporter";
  const family = names.slice(1).join(" ") || undefined;

  // 1) Customer
  //
  // Phone is optional on our form but Square validates it, and a number it
  // dislikes ("Expected phone_number to be a valid phone number") fails the
  // whole customer — which used to fail the whole membership. An optional
  // field must never cost us a donation, so on failure we drop the phone and
  // try once more. Supabase still records whatever the person typed.
  const customerBase = {
    idempotency_key: `${key}-c`,
    given_name: given,
    family_name: family,
    email_address: buyer.email,
  };
  const phoneE164 = toE164(buyer.phone);

  let custRes = await squarePost(env, "/v2/customers", {
    ...customerBase,
    phone_number: phoneE164 || undefined,
  });
  if (!custRes.ok && phoneE164) {
    console.warn("create-subscription: retrying customer without phone", firstError(custRes.body)?.detail);
    custRes = await squarePost(env, "/v2/customers", { ...customerBase, idempotency_key: `${key}-c2` });
  }
  if (!custRes.ok) {
    const e = firstError(custRes.body);
    console.error("create-subscription: customer failed", custRes.status, custRes.body);
    return json(400, { ok: false, error: e?.detail || "Could not create donor profile." });
  }
  const customerId = custRes.body?.customer?.id;

  // 2) Card on file
  const cardRes = await squarePost(env, "/v2/cards", {
    idempotency_key: `${key}-card`,
    source_id: sourceId,
    card: { customer_id: customerId },
  });
  if (!cardRes.ok) {
    const e = firstError(cardRes.body);
    console.error("create-subscription: card failed", cardRes.status, cardRes.body);
    return json(400, { ok: false, error: e?.detail || "Could not save card." });
  }
  const cardId = cardRes.body?.card?.id;

  // 3) Subscription (yearly plan + price override = chosen/student amount)
  const subRes = await squarePost(env, "/v2/subscriptions", {
    idempotency_key: `${key}-s`,
    location_id: SQUARE_LOCATION_ID,
    plan_variation_id: SQUARE_YEARLY_PLAN_ID,
    customer_id: customerId,
    card_id: cardId,
    timezone: "America/Halifax",
    price_override_money: { amount: finalAmountCents, currency: "CAD" },
  });
  if (!subRes.ok) {
    const e = firstError(subRes.body);
    console.error("create-subscription: subscription failed", subRes.status, subRes.body);
    return json(400, { ok: false, error: e?.detail || "Could not start your yearly membership." });
  }
  const subscription = subRes.body?.subscription;

  // Membership runs one year from today. Square renews the subscription on its
  // own cadence; this window is what we show the member and what the `members`
  // view uses to decide who is currently active.
  const { start: startDate, end: endDate } = membershipWindow();
  const email = normalizeEmail(buyer.email);
  const lang = buyer.lang === "en" ? "en" : "tr";

  // Read before writing, so the notification can tell a new member from a
  // renewal — and mention it if this person already volunteers for us.
  const history = await lookupPerson(env, email);

  const contactId = await upsertContact(env, {
    email,
    name: buyer.name,
    phone: buyer.phone,
    lang,
  });
  await recordActivity(env, contactId, {
    kind: "membership",
    amount_cents: finalAmountCents,
    currency: "CAD",
    status: subscription?.status || null,
    membership_start: startDate,
    membership_end: endDate,
    student_coupon: couponUsed,
    square_customer_id: customerId || null,
    square_subscription_id: subscription?.id || null,
  });

  sendMemberConfirmation(env, context, {
    name: buyer.name,
    email,
    lang,
    type: "yearly",
    amountCents: finalAmountCents,
    membershipStart: startDate,
    membershipEnd: endDate,
  });

  sendAdminNotice(env, context, {
    kind: "membership",
    replyTo: email,
    rows: [
      ["Ad", buyer.name || null],
      ["E-posta", email],
      ["Telefon", buyer.phone || null],
      ["Tutar", `$${(finalAmountCents / 100).toFixed(2)} CAD / yıl`],
      ["Öğrenci kuponu", couponUsed ? "evet" : "hayır"],
      ["Geçmiş", describeHistory(history, { renewalLabel: true })],
      ["Başlangıç", startDate],
      ["Bitiş", endDate],
      ["Square abonelik", subscription?.id || null],
      ["Durum", subscription?.status || null],
      ["Ortam", env.SQUARE_ENV === "production" ? "production" : "sandbox"],
    ],
  });

  return json(200, {
    ok: true,
    subscriptionId: subscription?.id || null,
    status: subscription?.status || null,
    amountCents: finalAmountCents,
    endDate,
  });
}
