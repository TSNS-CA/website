// /etkinlikler/<slug>      → sayfa (SPA) + WhatsApp/Facebook önizlemesi (functions/_lib/og.js)
// /etkinlikler/<slug>.ics  → takvim dosyası, sunucudan gerçek bir dosya olarak.
//
// .ics eskiden tarayıcıda Blob ile üretilip indiriliyordu; iPhone Safari bunu
// "Takvime ekle" diye açmıyor, Instagram/WhatsApp'ın uygulama içi tarayıcısı ise
// indirmeye hiç izin vermiyordu. text/calendar olarak sunulan bir URL'yi iOS
// doğrudan Takvim'e, Android Google Takvim'e verir.
import { handleHtmlWithMeta } from "../_lib/og.js";
import { getEventBySlug } from "../../src/content/events.js";
import { buildIcs } from "../../src/lib/ics.js";

export async function onRequestGet(context) {
  const slug = String(context.params.slug || "");
  if (!slug.endsWith(".ics")) return handleHtmlWithMeta(context);

  const event = getEventBySlug(slug.slice(0, -4));
  if (!event) return new Response("Not found", { status: 404 });
  const lang = new URL(context.request.url).searchParams.get("lang") === "en" ? "en" : "tr";
  return new Response(buildIcs(event, lang), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "public, max-age=300",
    },
  });
}
