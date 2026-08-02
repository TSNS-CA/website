// Transactional email via Resend (https://resend.com/docs/api-reference/emails/send-email).
// Requires env: RESEND_API_KEY, RESEND_FROM. Optional: RESEND_ADMIN_TO, RESEND_REPLY_TO.
//
// Every send here is best-effort: a failed email must never fail a payment or a
// volunteer signup, so nothing in this module throws.

const BRAND = "Nova Scotia Türk Derneği";
const BRAND_EN = "Turkish Society of Nova Scotia";
const NAVY = "#16466A";
const RED = "#D81E34";
const GOLD = "#FFD200";

const MISSION_TR =
  "Nova Scotia Türk Derneği olarak Türk mirasını ve kültürünü Nova Scotia genelinde yaşatıyor; insanları bir araya getiriyoruz.";
const MISSION_EN =
  "As the Nova Scotia Türk Derneği, we sustain Turkish heritage and culture across Nova Scotia, bringing people together.";

// Names, notes and interests come straight from a public form and are dropped
// into an HTML document — escape them.
function esc(v) {
  if (v === null || v === undefined || v === "") return "—";
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * POST an email to Resend. Returns the Resend response body, or null when the
 * integration is unconfigured or the send failed (both are logged, not thrown).
 */
export async function sendEmail(env, { to, subject, html, text, replyTo, tags }) {
  const key = env?.RESEND_API_KEY;
  const from = env?.RESEND_FROM;
  if (!key || !from) {
    console.warn("email: RESEND_API_KEY or RESEND_FROM not set — skipping email to", to);
    return null;
  }
  if (!to) return null;

  const body = {
    from,
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
  };
  if (text) body.text = text;
  const reply = replyTo || env.RESEND_REPLY_TO;
  if (reply) body.reply_to = reply;
  if (tags) body.tags = tags;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("email: send failed", res.status, await res.text());
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error("email: send error", e);
    return null;
  }
}

/**
 * Run an email send without making the visitor wait for Resend. Falls back to
 * awaiting when the runtime gives us no `waitUntil`.
 */
export function sendInBackground(ctx, promise) {
  const p = Promise.resolve(promise).catch((e) => console.error("email: background send error", e));
  if (ctx && typeof ctx.waitUntil === "function") {
    ctx.waitUntil(p);
    return null;
  }
  return p;
}

function rowsHtml(rows) {
  return rows
    .filter(([, v]) => v !== undefined)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 12px;color:#475569;font-size:13px;border-bottom:1px solid #eef2f7;width:42%;">${esc(
          k
        )}</td><td style="padding:8px 12px;color:#0f172a;font-size:14px;font-weight:600;border-bottom:1px solid #eef2f7;">${esc(
          v
        )}</td></tr>`
    )
    .join("");
}

function layout({ heading, lead, rows, extraHtml = "", closing, footnote, year }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px 12px;background:#f0eee6;font-family:Inter,Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e7e1d2;">
    <div style="height:5px;background:${RED};"></div>
    <div style="background:${NAVY};padding:20px 26px;">
      <span style="color:${GOLD};font-weight:800;letter-spacing:.3px;font-size:15px;">${BRAND}</span>
    </div>
    <div style="padding:26px;color:#0f172a;">
      <h1 style="font-size:20px;margin:0 0 8px;">${heading}</h1>
      <p style="margin:0 0 16px;color:#475569;font-size:14px;line-height:1.6;">${lead}</p>
      ${rows ? `<table style="width:100%;border-collapse:collapse;margin:8px 0 18px;">${rows}</table>` : ""}
      ${extraHtml}
      ${closing ? `<p style="margin:22px 0 6px;color:${NAVY};font-size:14px;font-weight:700;">${closing}</p>` : ""}
      ${footnote ? `<p style="margin:0;color:#475569;font-size:13px;line-height:1.6;font-style:italic;">${footnote}</p>` : ""}
    </div>
    <div style="background:#f8f7f3;padding:16px 26px;color:#64748b;font-size:11px;text-align:center;">
      © ${year} ${BRAND} — ${BRAND_EN}<br/>
      <a href="https://tsns.ca" style="color:${NAVY};text-decoration:none;">tsns.ca</a>
    </div>
  </div>
</body></html>`;
}

/** Receipt / welcome mail for a donation or a yearly membership. */
export function buildMemberEmail({ name, email, type, amountCents, endDate, receiptUrl, lang = "tr", year = new Date().getFullYear() }) {
  const tr = lang !== "en";
  const amount = `$${(amountCents / 100).toFixed(2)} CAD`;
  const typeLabel =
    type === "yearly"
      ? tr ? "Yıllık Üyelik" : "Yearly Membership"
      : tr ? "Tek Seferlik Bağış" : "One-time Donation";

  const rows = [
    [tr ? "Ad" : "Name", name],
    [tr ? "E-posta" : "Email", email],
    [tr ? "Tür" : "Type", typeLabel],
    [tr ? "Tutar" : "Amount", amount],
  ];
  if (endDate) rows.push([tr ? "Üyelik Bitiş Tarihi" : "Membership Ends", endDate]);

  const subject = tr
    ? `${BRAND} — ${type === "yearly" ? "Üyeliğiniz Onaylandı" : "Bağışınız Alındı"}`
    : `${BRAND} — ${type === "yearly" ? "Your Membership is Confirmed" : "Your Donation was Received"}`;

  const receiptLink = receiptUrl
    ? `<p style="margin:0 0 16px;"><a href="${esc(receiptUrl)}" style="color:${NAVY};font-weight:600;">${
        tr ? "Makbuzu görüntüle" : "View receipt"
      } →</a></p>`
    : "";

  const html = layout({
    heading: tr ? `Merhaba ${esc(name)},` : `Hello ${esc(name)},`,
    lead: tr
      ? "Desteğiniz bize ulaştı. Aşağıda kaydınızın detaylarını bulabilirsiniz:"
      : "We received your support. Here are the details of your record:",
    rows: rowsHtml(rows),
    extraHtml: receiptLink,
    closing: tr ? "Topluluğumuza katıldığınız için teşekkür ederiz." : "Thank you for being part of our community.",
    footnote: tr ? MISSION_TR : MISSION_EN,
    year,
  });

  const text = [
    tr ? `Merhaba ${name || ""},` : `Hello ${name || ""},`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v ?? "—"}`),
    receiptUrl ? `\n${tr ? "Makbuz" : "Receipt"}: ${receiptUrl}` : "",
    "",
    tr ? MISSION_TR : MISSION_EN,
  ].join("\n");

  return { subject, html, text };
}

/** Thank-you mail for someone who signed up to volunteer. */
export function buildVolunteerEmail({ name, email, phone, interests, lang = "tr", year = new Date().getFullYear() }) {
  const tr = lang !== "en";

  const rows = [
    [tr ? "Ad Soyad" : "Full name", name],
    [tr ? "E-posta" : "Email", email],
    [tr ? "Telefon" : "Phone", phone || "—"],
    [tr ? "İlgi alanları" : "Interests", interests || "—"],
  ];

  const subject = tr
    ? `${BRAND} — Gönüllü Başvurunuz Alındı`
    : `${BRAND} — We Received Your Volunteer Application`;

  const html = layout({
    heading: tr ? `Merhaba ${esc(name)},` : `Hello ${esc(name)},`,
    lead: tr
      ? "Gönüllü başvurunuz bize ulaştı — teşekkür ederiz. Ekibimiz en kısa sürede sizinle iletişime geçecek. Aşağıda bize ilettiğiniz bilgiler var:"
      : "Your volunteer application reached us — thank you. Our team will be in touch shortly. Here is what you shared with us:",
    rows: rowsHtml(rows),
    closing: tr
      ? "Zamanınızı topluluğumuza ayırdığınız için teşekkür ederiz."
      : "Thank you for giving your time to our community.",
    footnote: tr ? MISSION_TR : MISSION_EN,
    year,
  });

  const text = [
    tr ? `Merhaba ${name || ""},` : `Hello ${name || ""},`,
    "",
    tr
      ? "Gönüllü başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz."
      : "Your volunteer application was received. We'll be in touch shortly.",
    "",
    ...rows.map(([k, v]) => `${k}: ${v ?? "—"}`),
  ].join("\n");

  return { subject, html, text };
}

/**
 * Internal heads-up to the society's inbox. `kind` is "volunteer" | "donation"
 * | "membership"; `rows` is an array of [label, value] pairs.
 */
export function buildAdminNotice({ kind, rows, year = new Date().getFullYear() }) {
  const titles = {
    volunteer: "Yeni gönüllü başvurusu",
    donation: "Yeni bağış",
    membership: "Yeni üyelik",
  };
  const title = titles[kind] || "Yeni kayıt";
  return {
    subject: `[TSNS] ${title}`,
    html: layout({
      heading: title,
      lead: "Web sitesi üzerinden yeni bir kayıt geldi.",
      rows: rowsHtml(rows),
      year,
    }),
    text: `${title}\n\n${rows.map(([k, v]) => `${k}: ${v ?? "—"}`).join("\n")}`,
  };
}

/** Comma-separated list of internal recipients, or null when unconfigured. */
export function adminRecipients(env) {
  const raw = env?.RESEND_ADMIN_TO;
  if (!raw) return null;
  const list = raw.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : null;
}
