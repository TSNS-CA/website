import { recordDonor } from "../_lib/supabase";

const SQUARE_API_VERSION = "2024-10-17";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  const { SQUARE_ACCESS_TOKEN, SQUARE_LOCATION_ID, SQUARE_ENV } = env;
  if (!SQUARE_ACCESS_TOKEN || !SQUARE_LOCATION_ID) {
    console.error("create-payment: missing SQUARE_ACCESS_TOKEN or SQUARE_LOCATION_ID");
    return json(500, { ok: false, error: "Server is not configured for payments." });
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  const { sourceId, amountCents, currency, buyer, idempotencyKey } = payload || {};

  if (typeof sourceId !== "string" || sourceId.length === 0) {
    return json(400, { ok: false, error: "Missing card token." });
  }
  if (!Number.isInteger(amountCents) || amountCents < 100) {
    return json(400, { ok: false, error: "Amount must be at least $1.00 CAD." });
  }
  if (currency !== "CAD") {
    return json(400, { ok: false, error: "Only CAD is supported." });
  }

  const key =
    typeof idempotencyKey === "string" && idempotencyKey.length >= 8
      ? idempotencyKey
      : crypto.randomUUID();

  const base =
    SQUARE_ENV === "production"
      ? "https://connect.squareup.com"
      : "https://connect.squareupsandbox.com";

  const body = {
    source_id: sourceId,
    idempotency_key: key,
    amount_money: { amount: amountCents, currency: "CAD" },
    location_id: SQUARE_LOCATION_ID,
    note: "TSNS Membership",
  };
  if (buyer && typeof buyer.email === "string" && buyer.email.length > 0) {
    body.buyer_email_address = buyer.email;
  }

  let squareRes;
  try {
    squareRes = await fetch(`${base}/v2/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SQUARE_ACCESS_TOKEN}`,
        "Square-Version": SQUARE_API_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("create-payment: fetch to Square failed", err);
    return json(502, { ok: false, error: "Payment processor unreachable. Please try again." });
  }

  let squareBody;
  try {
    squareBody = await squareRes.json();
  } catch {
    console.error("create-payment: could not parse Square response", squareRes.status);
    return json(502, { ok: false, error: "Payment processor returned an invalid response." });
  }

  if (!squareRes.ok) {
    const firstErr = Array.isArray(squareBody?.errors) ? squareBody.errors[0] : null;
    console.error("create-payment: Square error", squareRes.status, squareBody);
    return json(squareRes.status === 401 || squareRes.status === 403 ? 500 : 400, {
      ok: false,
      error: firstErr?.detail || "Your card could not be charged.",
      code: firstErr?.code || null,
    });
  }

  const payment = squareBody?.payment;

  await recordDonor(env, {
    name: buyer?.name || null,
    email: buyer?.email || null,
    phone: buyer?.phone || null,
    type: "one_time",
    amount_cents: amountCents,
    currency: "CAD",
    status: payment?.status || null,
    square_payment_id: payment?.id || null,
  });

  return json(200, {
    ok: true,
    paymentId: payment?.id || null,
    status: payment?.status || null,
    receiptUrl: payment?.receipt_url || null,
  });
}
