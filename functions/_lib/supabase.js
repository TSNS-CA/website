import { createClient } from "@supabase/supabase-js";
import { halifaxToday } from "./time";

// Data model (see supabase/migrations/0002_contacts_activities.sql):
//   contacts   — one row per person, keyed by lowercased email
//   activities — one row per thing that happened (membership, donation, signup)
//   people     — view: one row per person with roles, totals and member_type
//
// Everything here is best-effort. A payment must never fail because logging
// failed, so no function in this file throws.

/** Service-role client, or null when Supabase is not configured. */
export function getSupabase(env) {
  const url = env?.SUPABASE_URL;
  const key = env?.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function normalizeEmail(email) {
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
}

/** Drop null/undefined so an upsert never overwrites a known value with a blank. */
function defined(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== null && v !== undefined));
}

/**
 * Find or create the person behind an email and return their contact id.
 *
 * This is the single point that guarantees one row per human: a volunteer who
 * later becomes a member updates the same contact instead of creating a second
 * record. Only the fields we actually have are written, so a donation that
 * carries no phone number will not erase the phone a volunteer signup gave us.
 */
export async function upsertContact(env, { email, name, phone, lang, volunteerStatus }) {
  const address = normalizeEmail(email);
  if (!address) return null;
  try {
    const supabase = getSupabase(env);
    if (!supabase) return null;

    const payload = defined({
      email: address,
      name: name ? String(name).trim().slice(0, 200) : null,
      phone: phone ? String(phone).trim().slice(0, 60) : null,
      preferred_lang: lang === "en" ? "en" : "tr",
      volunteer_status: volunteerStatus || null,
    });

    const { data, error } = await supabase
      .from("contacts")
      .upsert(payload, { onConflict: "email" })
      .select("id")
      .single();

    if (error) {
      console.error("supabase contact upsert failed", error.message);
      return null;
    }
    return data?.id || null;
  } catch (e) {
    console.error("supabase contact upsert error", e);
    return null;
  }
}

/** Append one activity row for a contact. */
export async function recordActivity(env, contactId, row) {
  if (!contactId) return null;
  try {
    const supabase = getSupabase(env);
    if (!supabase) return null;
    const { data, error } = await supabase
      .from("activities")
      .insert({ contact_id: contactId, ...row })
      .select("id")
      .single();
    if (error) {
      console.error("supabase activity insert failed", error.message);
      return null;
    }
    return data;
  } catch (e) {
    console.error("supabase activity insert error", e);
    return null;
  }
}

/**
 * What we already know about this person, read from the `people` view *before*
 * the current activity is written. Used to enrich the internal notification —
 * none of it is stored back on the activity row.
 *
 * An unconfigured Supabase, an error, or no history all read as a newcomer,
 * which is the safe interpretation: we only claim "first time" when nothing
 * says otherwise.
 */
export async function lookupPerson(env, email) {
  const fallback = {
    isFirstTime: true,
    firstSeenAt: null,
    memberType: null,
    roles: [],
    paymentCount: 0,
    renewalCount: 0,
    totalCents: 0,
    isVolunteer: false,
    membershipEnd: null,
  };
  const address = normalizeEmail(email);
  if (!address) return fallback;
  try {
    const supabase = getSupabase(env);
    if (!supabase) return fallback;
    const { data, error } = await supabase
      .from("people")
      .select(
        "first_seen_at, member_type, roles, payment_count, renewal_count, total_cents, is_volunteer, membership_end"
      )
      .eq("email", address)
      .maybeSingle();
    if (error) {
      console.error("supabase person lookup failed", error.message);
      return fallback;
    }
    if (!data) return fallback;
    return {
      isFirstTime: false,
      firstSeenAt: data.first_seen_at || null,
      memberType: data.member_type || null,
      roles: data.roles || [],
      paymentCount: data.payment_count || 0,
      renewalCount: data.renewal_count || 0,
      totalCents: data.total_cents || 0,
      isVolunteer: !!data.is_volunteer,
      membershipEnd: data.membership_end || null,
    };
  } catch (e) {
    console.error("supabase person lookup error", e);
    return fallback;
  }
}

/**
 * One-year membership window starting today, as `YYYY-MM-DD` strings.
 *
 * Dated in Halifax, not UTC. Joining at 22:00 on 2 August used to be recorded
 * as starting on the 3rd — UTC had already rolled over — so the member's card
 * said a day they had not lived yet, and the membership expired a day late.
 */
export function membershipWindow(from = new Date()) {
  const start = halifaxToday(from);
  const [y, m, d] = start.split("-").map(Number);
  // Date.UTC here is plain calendar arithmetic on a date we have already
  // resolved in Halifax — no zone involved, so nothing to get wrong.
  const end = new Date(Date.UTC(y + 1, m - 1, d));
  // 29 February has no anniversary: Date.UTC spills it to 1 March. Pull it
  // back to the last day of February, which is how an anniversary is normally
  // read — a year later, not a year and a day.
  if (end.getUTCMonth() !== m - 1) end.setUTCDate(0);
  return { start, end: end.toISOString().slice(0, 10) };
}

/** Short human summary of a person's history, for the internal notification. */
export function describeHistory(person, { renewalLabel = false } = {}) {
  if (!person || person.isFirstTime) return renewalLabel ? "yeni üye" : "ilk kez";
  const bits = [];
  if (renewalLabel && person.renewalCount >= 0) bits.push(`${person.renewalCount + 1}. yenileme`);
  if (person.paymentCount) {
    bits.push(
      `${person.paymentCount} önceki ödeme, toplam $${(person.totalCents / 100).toFixed(2)} CAD`
    );
  }
  if (person.roles?.length) bits.push(`roller: ${person.roles.join(", ")}`);
  if (person.firstSeenAt) bits.push(`${person.firstSeenAt.slice(0, 10)} tarihinden beri`);
  return bits.length ? bits.join(" · ") : "kayıtlı kişi";
}
