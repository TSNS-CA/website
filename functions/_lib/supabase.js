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
