// Sunucu tarafı Open Graph / Twitter kartı.
//
// WhatsApp, Facebook, iMessage, LinkedIn gibi önizleme botları JavaScript
// çalıştırmaz; yalnızca sunucunun döndürdüğü HTML'deki <meta> etiketlerini okur.
// SPA'da usePageMeta bunları tarayıcıda eklediği için botlar göremez. Bu modül,
// Worker'ın index.html'i HTMLRewriter ile zenginleştirmesi için sayfa başına
// başlık / açıklama / görsel üretir. Etkinlik verisi frontend ile aynı dosyadan
// gelir (src/content/events.js — React içermez, Worker'da da çalışır).
import { getEventBySlug, splitEvents } from "../../src/content/events.js";
import { eventInstants, fmtMediumDate, fmtTimeRange } from "../../src/lib/dates.js";
import { getAlbums, getAlbumBySlug, formatAlbumDate, photoCount } from "../../src/content/photos.js";

export const SITE = "https://tsns.ca";
const SITE_NAME = { tr: "Nova Scotia Türk Derneği", en: "Turkish Society of Nova Scotia" };
const DEFAULT_IMAGE = { url: `${SITE}/bogaz.jpg`, width: 1302, height: 601 };

// Afiş boyutları (public/events/). Yeni afiş eklenince buraya da yaz;
// yoksa width/height etiketleri atlanır (önizleme yine çıkar, biraz geç olabilir).
const IMAGE_DIMS = {
  "/events/cumhuriyet-2026.jpg": { width: 1080, height: 1350 },
  "/events/cumhuriyet-2026-program.jpg": { width: 1122, height: 1402 },
  "/events/bayrak-cekme-2026.jpg": { width: 922, height: 1152 },
};

export function pickLang(request) {
  const al = request.headers.get("accept-language") || "";
  return /^\s*en/i.test(al) ? "en" : "tr";
}

function eventMeta(event, lang) {
  const { start, end } = eventInstants(event);
  const when = `${fmtMediumDate(start, lang)} · ${fmtTimeRange(start, event.showEndTime === false ? null : end, lang)}`;
  const where = event.venue?.name ? ` · ${event.venue.name}` : "";
  const img = event.poster?.src ? { url: SITE + event.poster.src, ...(IMAGE_DIMS[event.poster.src] || {}) } : DEFAULT_IMAGE;
  return {
    title: `${event.title[lang]} — ${when}${where}`,
    description: event.summary[lang],
    image: img,
    imageAlt: event.poster?.alt?.[lang] || event.title[lang],
    url: `${SITE}/etkinlikler/${event.slug}`,
    type: "article",
    lang,
  };
}

export function metaForPath(pathname, lang = "tr") {
  const path = pathname.replace(/\/+$/, "") || "/";

  const m = path.match(/^\/(?:etkinlikler|events)\/([^/]+)$/);
  if (m) {
    const event = getEventBySlug(decodeURIComponent(m[1]));
    if (event) return eventMeta(event, lang);
  }

  if (path === "/etkinlikler" || path === "/events" || path === "/announcements-events") {
    const { upcoming } = splitEvents();
    const next = upcoming[0];
    const image = next?.poster?.src ? { url: SITE + next.poster.src, ...(IMAGE_DIMS[next.poster.src] || {}) } : DEFAULT_IMAGE;
    return {
      title: lang === "tr" ? "Etkinlikler — Nova Scotia Türk Derneği" : "Events — Turkish Society of Nova Scotia",
      description:
        lang === "tr"
          ? next
            ? `Sıradaki etkinlik: ${next.title.tr}, ${fmtMediumDate(eventInstants(next).start, "tr")}. Tüm etkinlikler, biletler ve takvim.`
            : "Topluluğumuzu bir araya getiren tüm etkinlikler, biletler ve takvim."
          : next
            ? `Next up: ${next.title.en}, ${fmtMediumDate(eventInstants(next).start, "en")}. All events, tickets and calendar.`
            : "Every gathering that brings our community together — events, tickets and calendar.",
      image,
      imageAlt: next?.poster?.alt?.[lang] || SITE_NAME[lang],
      url: `${SITE}/etkinlikler`,
      type: "website",
      lang,
    };
  }

  const pm = path.match(/^\/fotograflar\/([^/]+)$/);
  if (pm) {
    const album = getAlbumBySlug(decodeURIComponent(pm[1]));
    if (album) {
      return {
        title: `${album.title[lang]} — ${formatAlbumDate(album, lang)}`,
        description: `${album.description[lang]} (${album.photos.length} ${lang === "en" ? "photos" : "fotoğraf"})`,
        image: { url: SITE + album.cover, width: album.photos.find((p) => p.src === album.cover)?.w, height: album.photos.find((p) => p.src === album.cover)?.h },
        imageAlt: album.title[lang],
        url: `${SITE}/fotograflar/${album.slug}`,
        type: "article",
        lang,
      };
    }
  }
  if (path === "/fotograflar" || path === "/galeri" || path === "/photos" || path === "/about/photos") {
    const albums = getAlbums();
    const latest = albums[0];
    return {
      title: lang === "en" ? "Photo Archive — Turkish Society of Nova Scotia" : "Fotoğraf Arşivi — Nova Scotia Türk Derneği",
      description:
        lang === "en"
          ? `${albums.length} albums and ${photoCount()} photos from our community's national days, remembrance ceremonies and gatherings since 2015.`
          : `2015'ten bugüne bayramlar, anma günleri ve buluşmalardan ${albums.length} albüm, ${photoCount()} fotoğraf.`,
      image: latest ? { url: SITE + latest.cover } : DEFAULT_IMAGE,
      imageAlt: latest?.title[lang] || SITE_NAME[lang],
      url: `${SITE}/fotograflar`,
      type: "website",
      lang,
    };
  }

  if (path === "/yeni-gelenler" || path === "/newcomers") {
    return {
      title: lang === "tr" ? "Halifax'a Yeni Gelen Rehberi — Nova Scotia Türk Derneği" : "Newcomer's Guide to Halifax — Turkish Society of Nova Scotia",
      description:
        lang === "tr"
          ? "Havaalanından ulaşım, kiralık ev, okul kaydı, SIN, kimlik kartı, MSI sağlık kartı, aile doktoru ve ehliyet: Halifax'a yeni gelenler için pratik rehber, ISANS ve sürücü kursu ortaklıkları."
          : "Airport transit, renting, school registration, SIN, ID card, MSI health card, family doctor and driver's licence: a practical guide for newcomers to Halifax, with ISANS and driving-school partnerships.",
      image: DEFAULT_IMAGE,
      imageAlt: SITE_NAME[lang],
      url: `${SITE}/yeni-gelenler`,
      type: "article",
      lang,
    };
  }

  return null;
}

function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function metaTags(meta) {
  const tags = [
    ["property", "og:site_name", SITE_NAME[meta.lang] || SITE_NAME.tr],
    ["property", "og:type", meta.type || "website"],
    ["property", "og:locale", meta.lang === "en" ? "en_CA" : "tr_TR"],
    ["property", "og:title", meta.title],
    ["property", "og:description", meta.description],
    ["property", "og:url", meta.url],
    ["property", "og:image", meta.image.url],
    ["property", "og:image:secure_url", meta.image.url],
    meta.image.width ? ["property", "og:image:width", String(meta.image.width)] : null,
    meta.image.height ? ["property", "og:image:height", String(meta.image.height)] : null,
    ["property", "og:image:alt", meta.imageAlt || meta.title],
    ["name", "twitter:card", "summary_large_image"],
    ["name", "twitter:title", meta.title],
    ["name", "twitter:description", meta.description],
    ["name", "twitter:image", meta.image.url],
  ].filter(Boolean);
  return tags.map(([attr, key, val]) => `<meta ${attr}="${esc(key)}" content="${esc(val)}">`).join("\n    ");
}

// Statik index.html'deki varsayılan og:/twitter: etiketlerini kaldırıp
// sayfaya özel olanları ekler; <title> ve description'ı da günceller.
export async function renderWithMeta(request, env, meta) {
  const indexUrl = new URL("/", request.url);
  const res = await env.ASSETS.fetch(new Request(indexUrl.toString(), { headers: request.headers }));
  const removable = {
    element(el) {
      const p = el.getAttribute("property") || el.getAttribute("name") || "";
      if (/^(og:|twitter:)/.test(p)) el.remove();
    },
  };
  const rewritten = new HTMLRewriter()
    .on("title", {
      element(el) {
        el.setInnerContent(meta.title);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute("content", meta.description);
      },
    })
    .on("meta[property]", removable)
    .on('meta[name^="twitter:"]', removable)
    .on('link[rel="canonical"]', {
      element(el) {
        el.remove(); // sayfaya özel canonical aşağıda head sonuna eklenir
      },
    })
    .on("head", {
      element(el) {
        el.append(`\n    <link rel="canonical" href="${esc(meta.url)}">\n    ${metaTags(meta)}\n  `, { html: true });
      },
    })
    .transform(res);
  const headers = new Headers(rewritten.headers);
  // HTML önbelleğe alınmaz: deploy sonrası eski index.html, silinmiş hash'li JS'i
  // göstermesin. (Önizleme botları için önbellek gerekmiyor; görseller zaten uzun ömürlü.)
  headers.set("Cache-Control", "no-cache, must-revalidate");
  headers.set("Vary", "Accept-Language");
  return new Response(rewritten.body, { status: rewritten.status, headers });
}

export async function handleHtmlWithMeta({ request, env }) {
  const url = new URL(request.url);
  const meta = metaForPath(url.pathname, pickLang(request));
  if (!meta) return env.ASSETS.fetch(request);
  return renderWithMeta(request, env, meta);
}
