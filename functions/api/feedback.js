// Anonim etkinlik geri bildirimi — /geri-bildirim/<slug> formu.
//
// Ad, e-posta, IP saklanmaz (formda zaten istenmiyor). Anket tanımı ve
// kapanış tarihi src/content/feedback.js'te; tanımsız ya da kapanmış bir anket
// burada da reddedilir.
//
// Her gönderim için admin'e e-posta GİTMEZ (yüzlerce katılımcı = yüzlerce
// e-posta). Sonuçlar Supabase'de: `event_feedback_summary` görünümü. Yalnızca
// kayıt başarısız olursa cevap kaybolmasın diye admin'e yedek bildirim gider.
import { json, rateLimit, requireHuman } from "../_lib/guard";
import { getSupabase } from "../_lib/supabase";
import { sendAdminNotice } from "../_lib/email";
import { getSurvey, cleanRatings, COMMENT_MAX, FEEDBACK_CATEGORIES } from "../../src/content/feedback.js";

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

  const { event: slug, ratings, comment, lang, turnstileToken } = payload || {};
  const survey = typeof slug === "string" ? getSurvey(slug) : null;
  if (!survey) return json(400, { ok: false, error: "Unknown survey." });
  if (!survey.open) return json(400, { ok: false, error: "This survey is closed.", code: "closed" });

  const clean = cleanRatings(survey, ratings);
  const text = typeof comment === "string" ? comment.trim().slice(0, COMMENT_MAX) : "";
  if (Object.keys(clean).length === 0 && !text) {
    return json(400, { ok: false, error: "Please rate at least one item.", code: "empty" });
  }

  const notHuman = await requireHuman(context, turnstileToken);
  if (notHuman) return notHuman;

  const row = { event_slug: survey.slug, ...clean, comment: text || null, lang: lang === "en" ? "en" : "tr" };

  let stored = false;
  try {
    const supabase = getSupabase(env);
    if (supabase) {
      const { error } = await supabase.from("event_feedback").insert(row);
      if (error) console.error("feedback: insert failed", error.message);
      else stored = true;
    }
  } catch (e) {
    console.error("feedback: insert error", e);
  }

  if (!stored) {
    // Cevap kaybolmasın: kaydedilemediyse içeriği admin'e e-postayla gönder.
    sendAdminNotice(env, context, {
      kind: "feedback",
      rows: [
        ["Etkinlik", survey.event.title.tr],
        ...survey.categories.map((k) => [FEEDBACK_CATEGORIES[k].label.tr, clean[k] ? `${clean[k]} / 5` : null]),
        ["Yorum", text || null],
        ["Dil", row.lang],
        ["Supabase", "KAYDEDİLEMEDİ — tablo yok ya da hata (migration 0006?)"],
      ],
    });
    return json(201, { ok: true, warning: "not_stored" });
  }

  return json(201, { ok: true });
}
