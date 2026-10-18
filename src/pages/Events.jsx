import { t, upper } from "../i18n";
import { Section, Eyebrow, Button, Card } from "../components/ui";
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
    <Section className="py-20">
      <div className="max-w-3xl">
        <Eyebrow lang={lang}>{t(lang, "home.events.eyebrow")}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {t(lang, "events.title")}
        </h1>
        <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">{t(lang, "events.intro")}</p>
      </div>

      {/* Yaklaşan */}
      <h2 className="mt-14 text-sm font-bold tracking-wider text-brand-red">{upper(lang, t(lang, "events.upcoming"))}</h2>
      {upcoming.length ? (
        <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
          {upcoming.map((e) => (
            <EventCard key={e.slug} event={e} lang={lang} now={now} />
          ))}
        </div>
      ) : (
        <Card className="mt-5 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600 dark:text-slate-300">{t(lang, "events.empty")}</p>
          <Button href="#newsletter" variant="secondary" size="sm">
            {t(lang, "action.subscribe")}
          </Button>
        </Card>
      )}

      {/* Geçmiş */}
      {past.length > 0 && (
        <div className="mt-16">
          <h2 className="text-sm font-bold tracking-wider text-slate-500 dark:text-slate-400">
            {upper(lang, t(lang, "events.past"))}
          </h2>
          {years.map(({ year, items }) => (
            <div key={year} className="mt-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="font-display text-xl font-extrabold text-brand">{year}</span>
                <span className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {items.map((e) => (
                  <EventCard key={e.slug} event={e} lang={lang} now={now} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
