import { createClient } from "@supabase/supabase-js";

// Returns a Supabase client using the service_role key, or null if unconfigured.
// Only ever call this from server-side Cloudflare functions — never expose the
// service_role key to the browser.
export function getSupabase(env) {
  const url = env?.SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Has this email paid before? Returns `{ isFirstTime, firstJoinedAt }`.
 *
 * Errors and an unconfigured Supabase both fall back to `isFirstTime: true`
 * with a null join date — the caller then stamps "now", which is the right
 * answer when there is no history to find.
 */
export async function lookupDonorHistory(env, email) {
  const fallback = { isFirstTime: true, firstJoinedAt: null };
  if (!email) return fallback;
  try {
    const supabase = getSupabase(env);
    if (!supabase) return fallback;
    const { data, error } = await supabase
      .from("donors")
      .select("created_at, first_joined_at")
      .ilike("email", email.trim())
      .order("created_at", { ascending: true })
      .limit(1);
    if (error) {
      console.error("supabase donor history lookup failed", error.message);
      return fallback;
    }
    const first = data && data[0];
    if (!first) return fallback;
    return {
      isFirstTime: false,
      firstJoinedAt: first.first_joined_at || first.created_at || null,
    };
  } catch (e) {
    console.error("supabase donor history lookup error", e);
    return fallback;
  }
}

/** One-year membership window starting today, as `YYYY-MM-DD` strings. */
export function membershipWindow(from = new Date()) {
  const start = new Date(from);
  const end = new Date(from);
  end.setFullYear(end.getFullYear() + 1);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

// Best-effort donor record. Never throws/fails the request because of logging.
export async function recordDonor(env, row) {
  try {
    const supabase = getSupabase(env);
    if (!supabase) return null;
    const { data, error } = await supabase.from("donors").insert(row).select().single();
    if (error) console.error("supabase donor insert failed", error.message);
    return data;
  } catch (e) {
    console.error("supabase donor insert error", e);
    return null;
  }
}

export async function recordVolunteer(env, row) {
  try {
    const supabase = getSupabase(env);
    if (!supabase) return null;
    const { data, error } = await supabase.from("volunteers").insert(row).select().single();
    if (error) console.error("supabase volunteer insert failed", error.message);
    return data;
  } catch (e) {
    console.error("supabase volunteer insert error", e);
    return null;
  }
}
