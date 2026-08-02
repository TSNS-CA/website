// Configuration check — GET /api/health
//
// Every Supabase call in _lib/supabase.js swallows its error and returns null,
// so a misconfigured Worker looks exactly like a working one from outside: the
// forms answer "ok" and nothing is ever written. This endpoint is the missing
// window into that.
//
// It reports whether each variable is SET, never its value. The one exception
// is SUPABASE_URL's host and the key's `role` claim, because the two mistakes
// that actually happen are "pointed at the wrong project" and "pasted the anon
// key instead of the service_role key", and neither is visible any other way.
//
//   GET /api/health           → variables + a read from contacts
//   GET /api/health?probe=1   → also writes and deletes a throwaway contact,
//                               which is the only way to catch a write-side
//                               failure such as RLS or a missing column
//
// Safe to delete once the setup is done.

import { getSupabase } from "../_lib/supabase";

const PROBE_EMAIL = "health-probe@tsns.invalid";

function json(status, body) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

/**
 * Which kind of Supabase key this is, without revealing it.
 *
 * Legacy keys are JWTs whose payload carries `role: anon | service_role`. The
 * newer ones are opaque and only distinguishable by prefix.
 */
function describeKey(key) {
  if (!key) return "yok";
  if (key.startsWith("sb_secret_")) return "service_role (yeni format)";
  if (key.startsWith("sb_publishable_")) return "⚠️ publishable — service_role olmalı";
  const parts = key.split(".");
  if (parts.length !== 3) return "tanınmayan format";
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role === "service_role") return "service_role";
    if (payload.role) return `⚠️ ${payload.role} — service_role olmalı`;
    return "rol claim'i yok";
  } catch {
    return "çözülemeyen JWT";
  }
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return url ? "⚠️ geçersiz URL" : "yok";
  }
}

export async function onRequestGet({ request, env }) {
  const set = (k) => Boolean(env?.[k]);

  const vars = {
    SUPABASE_URL: set("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: set("SUPABASE_SERVICE_ROLE_KEY"),
    SQUARE_ENV: env?.SQUARE_ENV || null, // not a secret, and the value matters
    SQUARE_ACCESS_TOKEN: set("SQUARE_ACCESS_TOKEN"),
    SQUARE_LOCATION_ID: set("SQUARE_LOCATION_ID"),
    SQUARE_YEARLY_PLAN_ID: set("SQUARE_YEARLY_PLAN_ID"),
    RESEND_API_KEY: set("RESEND_API_KEY"),
    RESEND_FROM: set("RESEND_FROM"),
    RESEND_REPLY_TO: set("RESEND_REPLY_TO"),
    RESEND_ADMIN_TO: set("RESEND_ADMIN_TO"),
    RESEND_MEMBERSHIP_TEMPLATE_ID: set("RESEND_MEMBERSHIP_TEMPLATE_ID"),
    RESEND_VOLUNTEER_TEMPLATE_ID: set("RESEND_VOLUNTEER_TEMPLATE_ID"),
    STUDENT_COUPON_CODES: set("STUDENT_COUPON_CODES"),
  };

  const supabase = {
    host: hostOf(env?.SUPABASE_URL),
    key: describeKey(env?.SUPABASE_SERVICE_ROLE_KEY),
    read: null,
    write: null,
  };

  const client = getSupabase(env);
  if (!client) {
    supabase.read = "atlandı — SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY yok";
    return json(200, { ok: false, vars, supabase });
  }

  // Read. `newsletter_subscribed` is selected on purpose: it only exists after
  // migration 0003, so a missing-column error here names the missing migration.
  try {
    const { error, count } = await client
      .from("contacts")
      .select("id, newsletter_subscribed", { count: "exact", head: true });
    supabase.read = error ? `HATA: ${error.message}` : `ok — contacts: ${count ?? "?"} satır`;
  } catch (e) {
    supabase.read = `İSTİSNA: ${e?.message || String(e)}`;
  }

  if (new URL(request.url).searchParams.get("probe") === "1") {
    try {
      const { error: writeErr } = await client
        .from("contacts")
        .upsert({ email: PROBE_EMAIL, name: "Health Probe", preferred_lang: "tr" }, { onConflict: "email" })
        .select("id")
        .single();
      if (writeErr) {
        supabase.write = `HATA: ${writeErr.message}`;
      } else {
        const { error: delErr } = await client.from("contacts").delete().eq("email", PROBE_EMAIL);
        supabase.write = delErr ? `yazıldı, silinemedi: ${delErr.message}` : "ok — yazıldı ve silindi";
      }
    } catch (e) {
      supabase.write = `İSTİSNA: ${e?.message || String(e)}`;
    }
  }

  const ok =
    vars.SUPABASE_URL &&
    vars.SUPABASE_SERVICE_ROLE_KEY &&
    typeof supabase.read === "string" &&
    supabase.read.startsWith("ok");

  return json(200, { ok, vars, supabase });
}
