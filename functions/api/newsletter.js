import { upsertContact, getSupabase } from "../_lib/supabase";
import { sendAdminNotice } from "../_lib/email";
import { json, rateLimit, requireHuman } from "../_lib/guard";

// Newsletter subscriptions. A subscriber is a contact with newsletter_subscribed
// = true; if the email already exists (member/volunteer/donor) the same contact
// is updated, never duplicated.


export async function onRequestPost(context) {
  const { request, env } = context;

  const blocked = await rateLimit(context, "FORM_LIMITER");
  if (blocked) return blocked;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  const { name, email, lang, turnstileToken } = payload || {};

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: "A valid email is required." });
  }

  // Bu form, girilen adrese bizim alan adımızdan e-posta gönderiyor (ve
  // admin'e bildirim). Korumasızken bir bot herhangi bir adresi bizim
  // adımıza bombalayabilir, Resend kotasını ve alan adı itibarını
  // tüketebilirdi. Turnstile + IP ve adres başına hız sınırı.
  const notHuman = await requireHuman(context, turnstileToken);
  if (notHuman) return notHuman;
  const perAddress = await rateLimit(context, "EMAIL_LIMITER", [`email:${email.trim().toLowerCase()}`], { perIp: false });
  if (perAddress) return perAddress;

  const locale = lang === "en" ? "en" : "tr";
  const subscriber = {
    email: email.trim().toLowerCase().slice(0, 320),
    name: typeof name === "string" && name.trim() ? name.trim().slice(0, 200) : null,
  };

  // Find-or-create the contact, then flip the newsletter flag on. upsertContact
  // writes only the fields it receives, so an existing member/volunteer keeps
  // everything else they had.
  const contactId = await upsertContact(env, {
    email: subscriber.email,
    name: subscriber.name,
    lang: locale,
  });

  let stored = !!contactId;
  if (contactId) {
    const supabase = getSupabase(env);
    if (supabase) {
      const { error } = await supabase
        .from("contacts")
        .update({ newsletter_subscribed: true, newsletter_subscribed_at: new Date().toISOString() })
        .eq("id", contactId);
      if (error) {
        console.error("newsletter: flag update failed", error.message);
        stored = false;
      }
    }
  }

  // Heads-up so a real person can add the subscriber to the broadcast tool
  // (Resend Broadcast, etc.) until a direct integration is wired up.
  sendAdminNotice(env, context, {
    kind: "newsletter",
    replyTo: subscriber.email,
    rows: [
      ["Ad", subscriber.name],
      ["E-posta", subscriber.email],
      ["Dil", locale],
      ["Supabase", stored ? "kaydedildi" : "KAYDEDİLEMEDİ"],
    ],
  });

  if (!stored) {
    console.error("newsletter: record not stored (Supabase misconfigured?)");
    return json(201, { ok: true, warning: "not_stored" });
  }

  return json(201, { ok: true });
}
