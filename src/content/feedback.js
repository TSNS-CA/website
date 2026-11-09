// Etkinlik geri bildirim anketleri — /geri-bildirim/<etkinlik-slug>.
//
// Anket tamamen anonim: ad, e-posta, IP saklanmaz. Kategoriler 1–5 yıldız,
// sonunda isteğe bağlı bir yorum. E-postadaki yıldız linkleri
// (/geri-bildirim/<slug>?yemek=4) o puanı önceden seçili getirir, bu yüzden
// kategori `key`leri Resend şablonundaki sorgu parametreleriyle AYNI olmalı.
//
// Yeni anket: aşağıya etkinliğin slug'ıyla bir kayıt ekle, `closes` tarihini
// (Halifax, gün sonu) ver. Sunucu da buradan okur (functions/api/feedback.js),
// yani kapanan ya da tanımsız bir anket API'de de reddedilir.
import { zonedToDate } from "../lib/dates.js";
import { getEventBySlug } from "./events.js";

export const FEEDBACK_CATEGORIES = {
  yemek: { icon: "🍽️", label: { tr: "Yemek", en: "Food" } },
  organizasyon: { icon: "📋", label: { tr: "Organizasyon", en: "Organization" } },
  muzik: { icon: "🎶", label: { tr: "Müzik", en: "Music" } },
  konum: { icon: "📍", label: { tr: "Konum", en: "Venue" } },
  ilgi: { icon: "🤝", label: { tr: "İlgi ve alaka", en: "Hospitality" } },
};

const surveys = {
  "cumhuriyet-bayrami-2026": {
    categories: ["yemek", "organizasyon", "muzik", "konum", "ilgi"],
    closes: "2026-12-31",
  },
};

export const COMMENT_MAX = 2000;

/** Etkinlik + anket, ya da yoksa null. `open`: kapanış tarihi geçmediyse. */
export function getSurvey(slug, now = new Date()) {
  const survey = surveys[slug];
  const event = survey ? getEventBySlug(slug) : null;
  if (!survey || !event) return null;
  const open = now <= zonedToDate(`${survey.closes}T23:59`);
  return { slug, event, categories: survey.categories, closes: survey.closes, open };
}

/**
 * Bir sorgu dizesinden ya da gövdeden gelen puanları temizler:
 * yalnızca bu anketin kategorileri, yalnızca 1–5 arası tam sayılar.
 */
export function cleanRatings(survey, raw) {
  const out = {};
  for (const key of survey.categories) {
    const n = Number(raw?.[key]);
    if (Number.isInteger(n) && n >= 1 && n <= 5) out[key] = n;
  }
  return out;
}
