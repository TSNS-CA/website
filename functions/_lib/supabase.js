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
 * What we already know about this email, read from the `members` view *before*
 * the current payment is written. Used only to enrich the internal notification
 * — none of it is stored back on the transaction row.
 *
 * Returns `{ isFirstTime, firstJoinedAt, paymentCount, renewalCount,
 * totalCents }`. An unconfigured Supabase, an error, or simply no history all
 * come back as a first-timer, which is the safe reading: we say "first time"
 * only when we have nothing that says otherwise.
 */
export async function lookupDonorHistory(env, email) {
  const fallback = {
    isFirstTime: true,
    firstJoinedAt: null,
    paymentCount: 0,
    renewalCount: 0,
    totalCents: 0,
  };
  if (!email) return fallback;
  try {
    const supabase = getSupabase(env);
    if (!supabase) return fallback;
    const { data, error } = await supabase
      .from("members")
      .select("first_joined_at, payment_count, renewal_count, total_cents")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (error) {
      console.error("supabase member lookup failed", error.message);
      return fallback;
    }
    if (!data) return fallback;
    return {
      isFirstTime: false,
      firstJoinedAt: data.first_joined_at || null,
      paymentCount: data.payment_count || 0,
      renewalCount: data.renewal_count || 0,
      totalCents: data.total_cents || 0,
    };
  } catch (e) {
    console.error("supabase member lookup error", e);
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
