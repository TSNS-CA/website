import { Link, useParams } from "react-router-dom";
import { t, upper } from "../i18n";
import { Container, Section, Button, Card } from "../components/ui";
import PhotoGrid from "../components/photos/PhotoGrid";
import AlbumCard from "../components/photos/AlbumCard";
import { getAlbumBySlug, getAlbums, getCategory, formatAlbumDate, albumYear } from "../content/photos.js";
import { getEventBySlug } from "../content/events.js";
import { usePageMeta } from "../lib/usePageMeta";

export default function AlbumPage({ lang }) {
  const { slug } = useParams();
  const album = getAlbumBySlug(slug);

  usePageMeta(
    album
      ? {
          title: album.title[lang],
          description: album.description[lang],
          canonical: `/fotograflar/${album.slug}`,
          jsonLd: {
            "@context": "https://schema.org",
            "@type": "ImageGallery",
            name: album.title[lang],
            description: album.description[lang],
            url: `https://tsns.ca/fotograflar/${album.slug}`,
            dateCreated: album.date,
            image: album.photos.slice(0, 20).map((p) => `https://tsns.ca${p.src}`),
            publisher: { "@type": "Organization", name: "Turkish Society of Nova Scotia", url: "https://tsns.ca" },
          },
        }
      : { title: t(lang, "photos.title") },
  );

  if (!album) {
    return (
      <Section className="py-24">
        <Card className="mx-auto max-w-lg text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{t(lang, "photos.notFound")}</p>
          <div className="mt-5">
            <Button to="/fotograflar" variant="secondary">← {t(lang, "photos.backToArchive")}</Button>
          </div>
        </Card>
      </Section>
    );
  }

  const cat = getCategory(album.category);
  const event = album.eventSlug ? getEventBySlug(album.eventSlug) : null;
  const all = getAlbums();
  const idx = all.findIndex((a) => a.slug === album.slug);
  const prev = all[idx + 1]; // daha eski
  const next = all[idx - 1]; // daha yeni
  const related = all.filter((a) => a.slug !== album.slug && (a.category === album.category || albumYear(a) === albumYear(album))).slice(0, 3);

  return (
    <>
      {/* Başlık: kapak bulanık arka plan */}
      <section className="relative isolate overflow-hidden bg-primary-900 text-white">
        <img src={album.cover} alt="" className="absolute inset-0 -z-10 h-full w-full scale-110 object-cover opacity-50 blur-2xl saturate-125" aria-hidden="true" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-900/60 via-primary-900/75 to-primary-900" aria-hidden="true" />
        <Container className="py-12 sm:py-16">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-white/80" aria-label="Breadcrumb">
            <Link to="/fotograflar" className="font-semibold hover:text-white">← {t(lang, "photos.backToArchive")}</Link>
            <span aria-hidden="true">·</span>
            <Link to={`/fotograflar?g=tarih&yil=${albumYear(album)}`} className="hover:text-white">{albumYear(album)}</Link>
            {cat && (
              <>
                <span aria-hidden="true">·</span>
                <Link to={`/fotograflar?kat=${cat.id}`} className="hover:text-white">{cat.label[lang]}</Link>
              </>
            )}
          </nav>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-primary-900">{formatAlbumDate(album, lang)}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-inset ring-white/20">📍 {album.location[lang]}</span>
            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold ring-1 ring-inset ring-white/20">{t(lang, "photos.photoCount", { count: album.photos.length })}</span>
          </div>
          <h1 className="mt-4 max-w-3xl font-display text-3xl font-black leading-tight tracking-tight sm:text-5xl">{album.title[lang]}</h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">{album.description[lang]}</p>
          {event && (
            <div className="mt-6">
              <Button to={`/etkinlikler/${event.slug}`} variant="ghostWhite" size="sm">
                {t(lang, "photos.eventPage")} →
              </Button>
            </div>
          )}
        </Container>
      </section>

      <Section className="py-10 sm:py-14">
        <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">{t(lang, "photos.hint")}</p>
        <PhotoGrid photos={album.photos} lang={lang} title={album.title[lang]} />

        {/* Önceki / sonraki albüm */}
        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {prev ? (
            <Link to={`/fotograflar/${prev.slug}`} className="group flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-card transition hover:shadow-lg dark:border-slate-800 dark:bg-primary-800">
              <img src={prev.coverThumb} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400">← {upper(lang, t(lang, "photos.older"))}</div>
                <div className="truncate text-sm font-bold text-slate-900 group-hover:text-accent-600 dark:text-white">{prev.title[lang]}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{formatAlbumDate(prev, lang)}</div>
              </div>
            </Link>
          ) : <span />}
          {next && (
            <Link to={`/fotograflar/${next.slug}`} className="group flex items-center justify-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-right shadow-card transition hover:shadow-lg dark:border-slate-800 dark:bg-primary-800">
              <div className="min-w-0">
                <div className="text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400">{upper(lang, t(lang, "photos.newer"))} →</div>
                <div className="truncate text-sm font-bold text-slate-900 group-hover:text-accent-600 dark:text-white">{next.title[lang]}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{formatAlbumDate(next, lang)}</div>
              </div>
              <img src={next.coverThumb} alt="" className="h-16 w-16 flex-none rounded-xl object-cover" />
            </Link>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="text-sm font-bold tracking-wider text-brand-red">{upper(lang, t(lang, "photos.related"))}</h2>
            <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((a) => (
                <AlbumCard key={a.slug} album={a} lang={lang} compact />
              ))}
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
