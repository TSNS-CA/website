import { recordVolunteer } from "../_lib/supabase";
import {
  sendEmail,
  sendInBackground,
  buildVolunteerEmail,
  buildAdminNotice,
  adminRecipients,
} from "../_lib/email";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  const { name, email, phone, interests, lang } = payload || {};

  if (typeof name !== "string" || !name.trim()) {
    return json(400, { ok: false, error: "Name is required." });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: "A valid email is required." });
  }

  const volunteer = {
    name: name.trim().slice(0, 200),
    email: email.trim().toLowerCase().slice(0, 320),
    phone: (phone || "").trim().slice(0, 60) || null,
    interests: (interests || "").trim().slice(0, 2000) || null,
  };

  const data = await recordVolunteer(env, { ...volunteer, status: "new" });

  // Confirmation to the volunteer + heads-up to the society. Both are
  // best-effort and run after the response, so the form returns immediately.
  const locale = lang === "en" ? "en" : "tr";
  const mail = buildVolunteerEmail({ ...volunteer, lang: locale });
  sendInBackground(
    context,
    sendEmail(env, {
      to: volunteer.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tags: [{ name: "type", value: "volunteer_confirmation" }],
    })
  );

  const admins = adminRecipients(env);
  if (admins) {
    const notice = buildAdminNotice({
      kind: "volunteer",
      rows: [
        ["Ad Soyad", volunteer.name],
        ["E-posta", volunteer.email],
        ["Telefon", volunteer.phone],
        ["İlgi alanları", volunteer.interests],
        ["Dil", locale],
        ["Supabase", data ? "kaydedildi" : "KAYDEDİLEMEDİ"],
      ],
    });
    sendInBackground(
      context,
      sendEmail(env, {
        to: admins,
        subject: notice.subject,
        html: notice.html,
        text: notice.text,
        replyTo: volunteer.email,
        tags: [{ name: "type", value: "volunteer_admin" }],
      })
    );
  }

  if (!data) {
    // Supabase not configured or the insert failed. The visitor is still
    // acknowledged (and both emails went out), but this needs attention.
    console.error("volunteer: record not stored (Supabase misconfigured?)");
    return json(201, { ok: true, warning: "not_stored" });
  }

  return json(201, { ok: true });
}
