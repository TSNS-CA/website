import { recordDonor } from "../_lib/supabase";

const SQUARE_API_VERSION = "2024-10-17";
// Per-cycle amount (cents) for our two donation plans, used for the Supabase record.
const PLAN_AMOUNT_CENTS = { monthly: 500, yearly: 5000 };

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function base(env) {
  return env.SQUARE_ENV === "production"
    ? "https://connect.squareup.com"
    : "https://connect.squareupsandbox.com";
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
  try {
    parsed = await res.json();
  } catch (e) {
    /* ignore */
  }
  return { ok: res.ok, status: res.status, body: parsed };
}

function firstError(body) {
  return Array.isArray(body?.errors) && body.errors[0] ? body.errors[0] : null;
}

export async function onRequestPost({ request, env }) {
  const { SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID } = env;
  if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
    return json(500, { ok: false, error: "Server is not configured for payments." });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  const { sourceId, frequency, buyer, idempotencyKey } = payload || {};
  const planId =
    frequency === "monthly"
      ? env.SQUARE_MONTHLY_PLAN_ID
      : frequency === "yearly"
      ? env.SQUARE_YEARLY_PLAN_ID
      : null;

  if (typeof sourceId !== "string" || sourceId.length === 0) {
    return json(400, { ok: false, error: "Missing card token." });
  }
  if (!planId) {
    return json(400, { ok: false, error: "Invalid donation frequency or plan not configured." });
  }
  if (!buyer?.email) {
    return json(400, { ok: false, error: "Email is required for a recurring donation." });
  }

  const key = typeof idempotencyKey === "string" && idempotencyKey.length >= 8 ? idempotencyKey : crypto.randomUUID();
  const names = (buyer.name || "").trim().split(/\s+/);
  const given = names[0] || "Supporter";
  const family = names.slice(1).join(" ") || undefined;

  // 1) Create a customer
  const custRes = await squarePost(env, "/v2/customers", {
    idempotency_key: `${key}-c`,
    given_name: given,
    family_name: family,
    email_address: buyer.email,
    phone_number: buyer.phone || undefined,
  });
  if (!custRes.ok) {
    const e = firstError(custRes.body);
    console.error("create-subscription: customer failed", custRes.status, custRes.body);
    return json(400, { ok: false, error: e?.detail || "Could not create donor profile.", code: e?.code || null });
  }
  const customerId = custRes.body?.customer?.id;

  // 2) Save card on file
  const cardRes = await squarePost(env, "/v2/cards", {
    idempotency_key: `${key}-card`,
    source_id: sourceId,
    card: { customer_id: customerId },
  });
  if (!cardRes.ok) {
    const e = firstError(cardRes.body);
    console.error("create-subscription: card failed", cardRes.status, cardRes.body);
    return json(400, { ok: false, error: e?.detail || "Could not save card.", code: e?.code || null });
  }
  const cardId = cardRes.body?.card?.id;

  // 3) Create the subscription
  const subRes = await squarePost(env, "/v2/subscriptions", {
    idempotency_key: `${key}-s`,
    location_id: SQUARE_LOCATION_ID,
    plan_id: planId,
    customer_id: customerId,
    card_id: cardId,
    timezone: "America/Halifax",
  });
  if (!subRes.ok) {
    const e = firstError(subRes.body);
    console.error("create-subscription: subscription failed", subRes.status, subRes.body);
    return json(400, { ok: false, error: e?.detail || "Could not start your recurring donation.", code: e?.code || null });
  }
  const subscription = subRes.body?.subscription;

  await recordDonor(env, {
    name: buyer.name || null,
    email: buyer.email || null,
    phone: buyer.phone || null,
    type: frequency, // 'monthly' | 'yearly'
    amount_cents: PLAN_AMOUNT_CENTS[frequency] ?? 0,
    currency: "CAD",
    status: subscription?.status || null,
    square_customer_id: customerId || null,
    square_subscription_id: subscription?.id || null,
  });

  return json(200, {
    ok: true,
    subscriptionId: subscription?.id || null,
    status: subscription?.status || null,
  });
}
