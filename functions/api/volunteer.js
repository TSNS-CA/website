import { upsertContact, recordActivity, lookupPerson, describeHistory } from "../_lib/supabase";
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

  const locale = lang === "en" ? "en" : "tr";
  const volunteer = {
    name: name.trim().slice(0, 200),
    email: email.trim().toLowerCase().slice(0, 320),
    phone: (phone || "").trim().slice(0, 60) || null,
    interests: (interests || "").trim().slice(0, 2000) || null,
  };

  // Read before writing: if they have donated or been a member before, the
  // notification should say so.
  const person = await lookupPerson(env, volunteer.email);

  // One contact per human. Someone who already gave — or who volunteers a
  // second time — updates that same row rather than creating a duplicate.
  const contactId = await upsertContact(env, {
    email: volunteer.email,
    name: volunteer.name,
    phone: volunteer.phone,
    lang: locale,
    // Don't demote an already-active volunteer back to 'new'.
    volunteerStatus: person.isVolunteer ? undefined : "new",
  });
  const stored = await recordActivity(env, contactId, {
    kind: "volunteer_signup",
    interests: volunteer.interests,
  });

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
        ["Geçmiş", describeHistory(person)],
        ["Supabase", stored ? "kaydedildi" : "KAYDEDİLEMEDİ"],
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

  if (!stored) {
    // Supabase unconfigured or the write failed. The visitor is acknowledged
    // and both emails went out, but this needs attention.
    console.error("volunteer: record not stored (Supabase misconfigured?)");
    return json(201, { ok: true, warning: "not_stored" });
  }

  return json(201, { ok: true });
}
