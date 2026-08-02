import { recordVolunteer } from "../_lib/supabase";
import { sendTemplate, firstNameOf } from "../_lib/resend";

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost({ request, env }) {
  let payload;
  try {
    payload = await request.json();
  } catch {
    return json(400, { ok: false, error: "Invalid JSON body." });
  }

  const { name, email, phone, interests } = payload || {};

  if (typeof name !== "string" || !name.trim()) {
    return json(400, { ok: false, error: "Name is required." });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json(400, { ok: false, error: "A valid email is required." });
  }

  const data = await recordVolunteer(env, {
    name: name.trim(),
    email: email.trim(),
    phone: (phone || "").trim() || null,
    interests: (interests || "").trim() || null,
    status: "new",
  });

  if (!data) {
    // Supabase not configured or insert failed — still acknowledge to the user,
    // but signal the operator this needs attention.
    console.error("volunteer: record not stored (Supabase misconfigured?)");
    await sendTemplate(env, {
      to: email.trim(),
      templateId: env.RESEND_VOLUNTEER_TEMPLATE_ID,
      variables: { firstName: firstNameOf(name) },
    });
    return json(201, { ok: true, warning: "not_stored" });
  }

  await sendTemplate(env, {
      to: email.trim(),
      templateId: env.RESEND_VOLUNTEER_TEMPLATE_ID,
      variables: { firstName: firstNameOf(name) },
    });

  return json(201, { ok: true });
}
