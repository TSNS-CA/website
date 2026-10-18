import { useEffect } from "react";

// Sayfa başlığı, açıklama, canonical ve JSON-LD'yi istemci tarafında yönetir.
// index.html'deki varsayılanlar modül yüklenirken bir kez okunur; sayfa
// ayrılınca geri yazılır, böylece Home gibi meta vermeyen sayfalar temiz kalır.

const SITE = "https://tsns.ca";
const SUFFIX = " | TSNS";
const JSONLD_ID = "page-jsonld";

const defaults = {
  title: typeof document !== "undefined" ? document.title : "",
  description:
    typeof document !== "undefined"
      ? document.querySelector('meta[name="description"]')?.getAttribute("content") || ""
      : "",
};

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    if (el && el.dataset.managed === "1") el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    el.dataset.managed = "1";
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!href) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(data) {
  let el = document.getElementById(JSONLD_ID);
  if (!data) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = JSONLD_ID;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

export function usePageMeta({ title, description, canonical, jsonLd } = {}) {
  const jsonLdKey = jsonLd ? JSON.stringify(jsonLd) : "";
  useEffect(() => {
    const fullTitle = title ? `${title}${SUFFIX}` : defaults.title;
    const desc = description || defaults.description;
    document.title = fullTitle;
    upsertMeta("name", "description", desc);
    upsertMeta("property", "og:title", fullTitle);
    upsertMeta("property", "og:description", desc);
    upsertMeta("property", "og:type", "website");
    setCanonical(canonical ? (canonical.startsWith("http") ? canonical : SITE + canonical) : "");
    setJsonLd(jsonLd || null);
    return () => {
      document.title = defaults.title;
      upsertMeta("name", "description", defaults.description);
      upsertMeta("property", "og:title", "");
      upsertMeta("property", "og:description", "");
      upsertMeta("property", "og:type", "");
      setCanonical("");
      setJsonLd(null);
    };
    // jsonLd nesnesi her render'da yeni referans; içerik karşılaştırması için string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description, canonical, jsonLdKey]);
}
