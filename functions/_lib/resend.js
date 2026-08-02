const RESEND_API = "https://api.resend.com/emails";

// Send a Resend-hosted template. From-address and subject are set on the
// template itself in the Resend dashboard, so we only pass id + variables.
// Best-effort: never throws. Returns Resend's send id on success, null otherwise.
export async function sendTemplate(env, { to, templateId, variables, replyTo }) {
  const key = env?.RESEND_API_KEY;
  if (!key) {
    console.error("resend: missing RESEND_API_KEY — email skipped");
    return null;
  }
  if (!templateId || !to) {
    console.error("resend: missing templateId or to — email skipped");
    return null;
  }

  const body = {
    to,
    template: { id: templateId, variables: variables || {} },
  };
  if (replyTo) body.reply_to = replyTo;

  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const parsed = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("resend: send failed", res.status, parsed);
      return null;
    }
    return parsed?.id || null;
  } catch (err) {
    console.error("resend: fetch threw", err);
    return null;
  }
}

export function firstNameOf(name) {
  if (!name) return "friend";
  return String(name).trim().split(/\s+/)[0] || "friend";
}

// Membership is valid for one year from the payment date. Formatted for
// display in the confirmation email (e.g. "August 2, 2027").
export function membershipExpiryOneYear() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
}
