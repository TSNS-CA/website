import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { t, upper } from "../i18n";
import { Container, Section, Card, Button } from "../components/ui";
import AlbumCard from "../components/photos/AlbumCard";
import { getAlbums, categories, groupAlbumsByYearMonth, albumYear, photoCount } from "../content/photos.js";
import { usePageMeta } from "../lib/usePageMeta";

// Fotoğraf Arşivi: iki görünüm — "Etkinliğe göre" (kategori filtreli albüm ızgarası)
// ve "Tarihe göre" (yıl → ay zaman çizelgesi). Yıl filtresi her iki görünümde ortak.
// Durum URL'de tutulur (?g=tarih&yil=2015&kat=anma) ki paylaşılabilsin.
export default function PhotosPage({ lang }) {
  const [params, setParams] = useSearchParams();
  const view = params.get("g") === "tarih" ? "date" : "event";
  const year = params.get("yil") || "";
  const cat = params.get("kat") || "";

  const all = useMemo(() => getAlbums(), []);
  const years = useMemo(() => [...new Set(all.map(albumYear))].sort((a, b) => b - a), [all]);
  const filtered = all.filter((a) => (!year || albumYear(a) === year) && (!cat || a.category === cat));
  const timeline = groupAlbumsByYearMonth(filtered, lang);
  const usedCats = categories.filter((c) => all.some((a) => a.category === c.id));

  function set(key, val) {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val); else next.delete(key);
    setParams(next, { replace: true });
  }

  usePageMeta({
    title: t(lang, "photos.title"),
    description: t(lang, "photos.intro"),
    canonical: "/fotograflar",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: t(lang, "photos.title"),
      description: t(lang, "photos.intro"),
      url: "https://tsns.ca/fotograflar",
      hasPart: all.map((a) => ({ "@type": "ImageGallery", name: a.title[lang], url: `https://tsns.ca/fotograflar/${a.slug}`, image: `https://tsns.ca${a.cover}` })),
    },
  });

  const chip = (active) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
      active ? "bg-accent text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:ring-accent hover:text-accent-600 dark:bg-primary-800 dark:text-slate-200 dark:ring-slate-600"
    }`;

  return (
    <>
      {/* Başlık bandı — kapaklardan kolaj */}
      <section className="relative isolate overflow-hidden bg-primary-900 text-white">
        <div className="absolute inset-0 -z-10 grid grid-cols-3 opacity-25 sm:grid-cols-6" aria-hidden="true">
          {all.slice(0, 6).map((a) => (
            <img key={a.slug} src={a.coverThumb} alt="" className="h-full w-full object-cover" />
          ))}
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-900/70 via-primary-900/80 to-primary-900" aria-hidden="true" />
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-gold">{upper(lang, t(lang, "photos.eyebrow"))}</span>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-6xl">{t(lang, "photos.title")}</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200">{t(lang, "photos.intro")}</p>
            <p className="mt-4 text-sm font-semibold text-slate-300">
              {t(lang, "photos.stats", { albums: all.length, photos: photoCount(), from: years[years.length - 1], to: years[0] })}
            </p>
          </div>
        </Container>
      </section>

      <Section className="py-10 sm:py-14">
        {/* Araç çubuğu */}
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-primary-800 lg:flex-row lg:items-center lg:justify-between">
          <div className="inline-flex self-start rounded-full bg-cream-200 p-1 dark:bg-primary-900" role="tablist" aria-label={t(lang, "photos.viewLabel")}>
            <button type="button" role="tab" aria-selected={view === "event"} onClick={() => set("g", "")} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${view === "event" ? "bg-primary text-white shadow" : "text-slate-700 hover:text-primary dark:text-slate-200"}`}>
              {t(lang, "photos.byEvent")}
            </button>
            <button type="button" role="tab" aria-selected={view === "date"} onClick={() => set("g", "tarih")} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${view === "date" ? "bg-primary text-white shadow" : "text-slate-700 hover:text-primary dark:text-slate-200"}`}>
              {t(lang, "photos.byDate")}
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400">{upper(lang, t(lang, "photos.year"))}</span>
            <button type="button" onClick={() => set("yil", "")} className={chip(!year)}>{t(lang, "photos.all")}</button>
            {years.map((y) => (
              <button key={y} type="button" onClick={() => set("yil", y)} className={chip(year === y)}>{y}</button>
            ))}
          </div>
        </div>

        {view === "event" && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400">{upper(lang, t(lang, "photos.category"))}</span>
            <button type="button" onClick={() => set("kat", "")} className={chip(!cat)}>{t(lang, "photos.all")}</button>
            {usedCats.map((c) => (
              <button key={c.id} type="button" onClick={() => set("kat", c.id)} className={chip(cat === c.id)}>
                <span aria-hidden="true">{c.icon}</span> {c.label[lang]}
              </button>
            ))}
          </div>
        )}

        {/* İçerik */}
        {filtered.length === 0 ? (
          <Card className="mt-8 text-center text-sm text-slate-600 dark:text-slate-300">{t(lang, "photos.empty")}</Card>
        ) : view === "event" ? (
          <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <AlbumCard key={a.slug} album={a} lang={lang} />
            ))}
          </div>
        ) : (
          <div className="mt-8 space-y-14">
            {timeline.map(({ year: y, months }) => (
              <section key={y} aria-labelledby={`y-${y}`}>
                <div className="flex items-center gap-4">
                  <h2 id={`y-${y}`} className="font-display text-4xl font-black tracking-tight text-brand sm:text-5xl">{y}</h2>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {t(lang, "photos.albumCount", { count: months.reduce((n, m) => n + m.albums.length, 0) })}
                  </span>
                </div>
                <div className="mt-6 space-y-8 border-l-2 border-accent/30 pl-6 dark:border-accent/40">
                  {months.map(({ month, label, albums }) => (
                    <div key={month} className="relative">
                      <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-accent ring-4 ring-cream dark:ring-primary-900" aria-hidden="true" />
                      <h3 className="text-sm font-bold tracking-wider text-brand-red">{upper(lang, label)}</h3>
                      <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                        {albums.map((a) => (
                          <AlbumCard key={a.slug} album={a} lang={lang} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {/* Katkı çağrısı */}
        <div className="mt-16 flex flex-col items-start gap-4 rounded-3xl bg-primary p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <div className="text-[11px] font-bold tracking-[0.2em] text-gold">{upper(lang, t(lang, "photos.contributeEyebrow"))}</div>
            <p className="mt-1 text-lg font-bold">{t(lang, "photos.contributeTitle")}</p>
            <p className="mt-1 text-sm text-slate-200">{t(lang, "photos.contributeBody")}</p>
          </div>
          <Button href="mailto:info@tsns.ca?subject=Foto%C4%9Fraf%20Ar%C5%9Fivi" variant="solidWhite" size="md">
            {t(lang, "photos.contributeCta")}
          </Button>
        </div>
      </Section>
    </>
  );
}
