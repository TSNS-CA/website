import { t, upper } from "../i18n";
import { Container, Section, Eyebrow, Button, Card } from "../components/ui";
import EventCard from "../components/events/EventCard";
import { splitEvents, groupByYear, organizer } from "../content/events.js";
import { eventInstants, isoWithOffset } from "../lib/dates.js";
import { usePageMeta } from "../lib/usePageMeta";

function eventJsonLd(e, lang) {
  const { start, end } = eventInstants(e);
  return {
    "@type": "Event",
    name: e.title[lang],
    startDate: isoWithOffset(start),
    endDate: isoWithOffset(end),
    url: `https://tsns.ca/etkinlikler/${e.slug}`,
    ...(e.poster ? { image: [`https://tsns.ca${e.poster.src}`] } : {}),
    location: e.venue?.street
      ? {
          "@type": "Place",
          name: e.venue.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: e.venue.street,
            addressLocality: e.venue.city,
            addressRegion: e.venue.region,
            postalCode: e.venue.postalCode,
            addressCountry: "CA",
          },
        }
      : undefined,
    organizer: { "@type": "Organization", name: organizer.name, url: organizer.url },
  };
}

export default function EventsPage({ lang }) {
  const now = new Date();
  const { upcoming, past } = splitEvents(now);
  const years = groupByYear(past);

  usePageMeta({
    title: t(lang, "events.title"),
    description: t(lang, "events.intro"),
    canonical: "/etkinlikler",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: upcoming.map((e, i) => ({ "@type": "ListItem", position: i + 1, item: eventJsonLd(e, lang) })),
    },
  });

  return (
    <>
      {/* Başlık bandı: lacivert, hafif ışık lekeleri */}
      <section className="relative isolate overflow-hidden bg-primary-900 text-white">
        <div className="pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-gold/15 blur-3xl" aria-hidden="true" />
        <Container className="py-16 sm:py-20">
          <div className="max-w-3xl">
            <span className="inline-block text-xs font-bold tracking-[0.2em] text-gold">{upper(lang, t(lang, "home.events.eyebrow"))}</span>
            <h1 className="mt-3 font-display text-4xl font-black tracking-tight sm:text-6xl">{t(lang, "events.title")}</h1>
            <p className="mt-5 text-lg leading-relaxed text-slate-200">{t(lang, "events.intro")}</p>
          </div>
        </Container>
      </section>

      <Section className="py-16">
        {/* Yaklaşan */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow lang={lang}>{t(lang, "events.upcoming")}</Eyebrow>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {upcoming.length ? t(lang, "events.upcoming") : t(lang, "home.events.recentTitle")}
            </h2>
          </div>
          <span className="surface-red hidden rounded-full px-3 py-1 text-xs font-bold sm:inline-block">{upcoming.length}</span>
        </div>

        {upcoming.length ? (
          <div className="mt-8 grid grid-cols-1 gap-7 md:grid-cols-2">
            {upcoming.map((e) => (
              <EventCard key={e.slug} event={e} lang={lang} now={now} />
            ))}
          </div>
        ) : (
          <Card className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600 dark:text-slate-300">{t(lang, "events.empty")}</p>
            <Button href="#newsletter" variant="secondary" size="sm">
              {t(lang, "action.subscribe")}
            </Button>
          </Card>
        )}

        {/* Geçmiş */}
        {past.length > 0 && (
          <div className="mt-20">
            <Eyebrow lang={lang} className="!text-slate-500 dark:!text-slate-400">
              {t(lang, "events.pastEyebrow")}
            </Eyebrow>
            <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {t(lang, "events.past")}
            </h2>
            {years.map(({ year, items }) => (
              <div key={year} className="mt-8">
                <div className="mb-4 flex items-center gap-3">
                  <span className="font-display text-lg font-extrabold text-brand">{year}</span>
                  <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((e) => (
                    <EventCard key={e.slug} event={e} lang={lang} now={now} compact />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
