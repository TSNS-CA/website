// Email content and orchestration.
//
// Confirmations to members, donors and volunteers go out as **Resend-hosted
// templates** (authored in the Resend dashboard, which owns their from-address,
// subject and design). We only pass the template id and the variables it
// references.
//
// The HTML builders below are the fallback used when a template id has not been
// configured yet, and are what the internal notifications always use — there is
// no template for those and they only need to be legible.
//
// Env: RESEND_API_KEY, RESEND_MEMBERSHIP_TEMPLATE_ID, RESEND_VOLUNTEER_TEMPLATE_ID.
// Optional: per-language ids with a _TR / _EN suffix, RESEND_FROM (fallback),
// RESEND_REPLY_TO, RESEND_ADMIN_TO.

import {
  sendTemplate,
  sendRaw,
  resolveTemplateId,
  firstNameOf,
  formatDate,
  formatAmount,
  sendInBackground,
} from "./resend";

export { sendInBackground };

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
  // A one-off gift grants a year of membership too — say so, and be explicit
  // that it will not renew itself, unlike the yearly subscription.
  if (endDate) {
    rows.push([
      tr ? "Üyelik Bitiş Tarihi" : "Membership Ends",
      type === "yearly"
        ? endDate
        : `${endDate} ${tr ? "(otomatik yenilenmez)" : "(does not auto-renew)"}`,
    ]);
  }

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
    lead:
      type === "yearly"
        ? tr
          ? "Desteğiniz bize ulaştı. Aşağıda üyelik detaylarınızı bulabilirsiniz:"
          : "We received your support. Here are your membership details:"
        : tr
        ? "Bağışınız bize ulaştı. Bağışınız size bir yıllık üyelik de kazandırıyor; bu üyelik kendiliğinden yenilenmez."
        : "We received your donation. It also grants you a year of membership, which will not renew itself.",
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
    newsletter: "Yeni bülten aboneliği",
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

// ─────────────────────────────────────────────────────────────────────────────
// Sending. Template first, generated HTML only as a fallback.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confirmation for a donation or a yearly membership, sent with the
 * `membership-confirmation` template.
 *
 * The template is bilingual, so both the English and the Turkish rendering of
 * each date is passed and the design picks whichever its half needs. A template
 * only renders the variables it references, so passing the full set is free:
 *
 *   firstName, fullName, email
 *   amount ("$25.00"), currency
 *   membershipType ("yearly" | "one_time"), autoRenews ("true" | "false")
 *   membershipStartDate    / membershipStartDateTr
 *   membershipExpiryDate   / membershipExpiryDateTr
 *   renewalNoteTr / renewalNoteEn — a ready-made sentence, because the same
 *     template serves both a renewing subscription and a one-off gift and
 *     Resend templates have no conditionals
 *   receiptUrl
 */
export function sendMemberConfirmation(env, ctx, opts) {
  const {
    name,
    email,
    lang = "tr",
    type,
    amountCents,
    membershipStart,
    membershipEnd,
    receiptUrl,
  } = opts;
  if (!email) return null;

  const templateId = resolveTemplateId(env, "MEMBERSHIP");
  if (templateId) {
    return sendInBackground(
      ctx,
      sendTemplate(env, {
        to: email,
        templateId,
        variables: {
          firstName: firstNameOf(name),
          fullName: name || "",
          email,
          amount: formatAmount(amountCents),
          currency: "CAD",
          membershipType: type,
          autoRenews: type === "yearly" ? "true" : "false",
          renewalNoteTr:
            type === "yearly"
              ? `Üyeliğiniz artık aktif ve ${formatDate(membershipEnd, "tr")} tarihine kadar geçerli. Her yıl otomatik olarak yenilenecek; dilediğiniz zaman info@tsns.ca adresinden iptal edebilirsiniz.`
              : `Bağışınız size ${formatDate(membershipEnd, "tr")} tarihine kadar geçerli bir yıllık üyelik kazandırıyor. Bu üyelik otomatik olarak yenilenmez; süre dolduğunda dilerseniz tekrar üye olabilirsiniz.`,
          renewalNoteEn:
            type === "yearly"
              ? `Your membership is now active and valid until ${formatDate(membershipEnd, "en")}. It renews automatically each year — you can cancel any time at info@tsns.ca.`
              : `Your donation also gives you a year of membership, valid until ${formatDate(membershipEnd, "en")}. It does not renew automatically, so you are welcome to join again when it ends.`,
          membershipStartDate: formatDate(membershipStart, "en"),
          membershipStartDateTr: formatDate(membershipStart, "tr"),
          membershipExpiryDate: formatDate(membershipEnd, "en"),
          membershipExpiryDateTr: formatDate(membershipEnd, "tr"),
          receiptUrl: receiptUrl || "",
        },
        tags: [{ name: "type", value: type === "yearly" ? "membership_welcome" : "donation_receipt" }],
      })
    );
  }

  console.warn("email: no membership template configured — falling back to built-in HTML");
  const mail = buildMemberEmail({
    name,
    email,
    type,
    amountCents,
    endDate: membershipEnd,
    receiptUrl,
    lang,
  });
  return sendInBackground(
    ctx,
    sendRaw(env, {
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tags: [{ name: "type", value: type === "yearly" ? "membership_welcome" : "donation_receipt" }],
    })
  );
}

/**
 * Confirmation for a volunteer application, sent with the
 * `volunteer-confirmation` template (bilingual, like the membership one).
 * Variables: firstName, fullName, email, phone, interests
 */
export function sendVolunteerConfirmation(env, ctx, opts) {
  const { name, email, phone, interests, lang = "tr" } = opts;
  if (!email) return null;

  const templateId = resolveTemplateId(env, "VOLUNTEER");
  if (templateId) {
    return sendInBackground(
      ctx,
      sendTemplate(env, {
        to: email,
        templateId,
        variables: {
          firstName: firstNameOf(name),
          fullName: name || "",
          email,
          phone: phone || "",
          interests: interests || "",
        },
        tags: [{ name: "type", value: "volunteer_confirmation" }],
      })
    );
  }

  console.warn("email: no volunteer template configured — falling back to built-in HTML");
  const mail = buildVolunteerEmail({ name, email, phone, interests, lang });
  return sendInBackground(
    ctx,
    sendRaw(env, {
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tags: [{ name: "type", value: "volunteer_confirmation" }],
    })
  );
}

/**
 * Internal "new signup" notice to the society. Always generated HTML — these
 * are operational, not designed, and carry fields no template knows about.
 */
export function sendAdminNotice(env, ctx, { kind, rows, replyTo, tag }) {
  const admins = adminRecipients(env);
  if (!admins) return null;
  const notice = buildAdminNotice({ kind, rows });
  return sendInBackground(
    ctx,
    sendRaw(env, {
      to: admins,
      subject: notice.subject,
      html: notice.html,
      text: notice.text,
      replyTo,
      tags: [{ name: "type", value: tag || `${kind}_admin` }],
    })
  );
}
