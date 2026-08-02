// Validates a discount/coupon code against server-configured codes.
// Student coupon -> yearly membership for $5 CAD.
function json(status, body) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, valid: false });
  }

  const code = (payload?.code || "").trim().toLowerCase();
  const validCodes = (env.STUDENT_COUPON_CODES || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (code && validCodes.includes(code)) {
    return json(200, {
      ok: true,
      valid: true,
      type: "student_yearly",
      frequency: "yearly",
      amountCents: 500,
    });
  }
  return json(200, { ok: true, valid: false });
}
