// Resend transport. Two ways to send:
//
//   sendTemplate() — a template authored in the Resend dashboard. From-address
//                    and subject live on the template, so we only pass an id
//                    and the variables it references. This is how the
//                    member/volunteer confirmations go out.
//   sendRaw()      — HTML we build ourselves. Used for the internal
//                    notifications (no template exists for those) and as a
//                    fallback when a template id has not been configured yet.
//
// Both are best-effort and never throw: a failed email must not fail a payment.

const RESEND_API = "https://api.resend.com/emails";

async function post(env, body, label) {
  const key = env?.RESEND_API_KEY;
  if (!key) {
    console.warn(`resend: RESEND_API_KEY not set — ${label} skipped`);
    return null;
  }
  try {
    const res = await fetch(RESEND_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const parsed = await res.json().catch(() => null);
    if (!res.ok) {
      console.error(`resend: ${label} failed`, res.status, JSON.stringify(parsed));
      return null;
    }
    return parsed?.id || null;
  } catch (err) {
    console.error(`resend: ${label} threw`, err);
    return null;
  }
}

/** Send a Resend-hosted template. */
export async function sendTemplate(env, { to, templateId, variables, replyTo, tags }) {
  if (!templateId || !to) {
    console.error("resend: missing templateId or to — template email skipped");
    return null;
  }
  const body = {
    to: Array.isArray(to) ? to : [to],
    template: { id: templateId, variables: variables || {} },
  };
  const reply = replyTo || env?.RESEND_REPLY_TO;
  if (reply) body.reply_to = reply;
  if (tags) body.tags = tags;
  return post(env, body, "template send");
}

/** Send HTML we generated ourselves. Requires RESEND_FROM. */
export async function sendRaw(env, { to, subject, html, text, replyTo, tags }) {
  const from = env?.RESEND_FROM;
  if (!from) {
    console.warn("resend: RESEND_FROM not set — raw email skipped");
    return null;
  }
  if (!to) return null;
  const body = { from, to: Array.isArray(to) ? to : [to], subject, html };
  if (text) body.text = text;
  const reply = replyTo || env?.RESEND_REPLY_TO;
  if (reply) body.reply_to = reply;
  if (tags) body.tags = tags;
  return post(env, body, "raw send");
}

/**
 * Template id for a confirmation kind.
 *
 * There are two templates — `membership-confirmation` and
 * `volunteer-confirmation` — and each already contains both the Turkish and the
 * English copy, so there is nothing to pick between per language.
 */
export function resolveTemplateId(env, name) {
  return env?.[`RESEND_${name}_TEMPLATE_ID`] || null;
}

/** First name only — what the templates greet people by. */
export function firstNameOf(name, fallback = "friend") {
  if (!name) return fallback;
  return String(name).trim().split(/\s+/)[0] || fallback;
}

/** "August 2, 2027" (en) / "2 Ağustos 2027" (tr) from a YYYY-MM-DD string. */
export function formatDate(value, lang = "en") {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return String(value);
  try {
    return d.toLocaleDateString(lang === "en" ? "en-CA" : "tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** "$25.00" from cents. */
export function formatAmount(cents) {
  if (cents === null || cents === undefined) return "";
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Run a send without making the visitor wait for Resend. Falls back to
 * awaiting when the runtime gives us no `waitUntil`.
 */
export function sendInBackground(ctx, promise) {
  const p = Promise.resolve(promise).catch((e) => console.error("resend: background send error", e));
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(p);
    return null;
  }
  return p;
}
