import { Link, useParams } from "react-router-dom";
import { t, upper } from "../i18n";
import { Section, Eyebrow, Button, Card } from "../components/ui";
import EventMeta from "../components/events/EventMeta";
import { StatusBadge } from "../components/events/EventCard";
import { getEventBySlug, tierIsAvailable, organizer } from "../content/events.js";
import { eventInstants, isoWithOffset, isPast, fmtMediumDate, zonedToDate } from "../lib/dates.js";
import { downloadIcs, googleCalendarUrl } from "../lib/ics.js";
import { usePageMeta } from "../lib/usePageMeta";

const STATUS_URL = {
  scheduled: "https://schema.org/EventScheduled",
  cancelled: "https://schema.org/EventCancelled",
  postponed: "https://schema.org/EventPostponed",
};

function buildJsonLd(e, lang) {
  const { start, end } = eventInstants(e);
  const url = `https://tsns.ca/etkinlikler/${e.slug}`;
  const offers = (e.tiers || []).map((tier) => ({
    "@type": "Offer",
    name: tier.label[lang],
    price: String(tier.priceCad),
    priceCurrency: "CAD",
    url: e.registration?.url || url,
    availability: tierIsAvailable(tier) ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    ...(tier.availableUntil ? { validThrough: `${tier.availableUntil}T23:59:59` } : {}),
  }));
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title[lang],
    description: e.summary[lang],
    startDate: isoWithOffset(start),
    endDate: isoWithOffset(end),
    eventStatus: STATUS_URL[e.status] || STATUS_URL.scheduled,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url,
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
      : { "@type": "Place", name: e.venue?.name || "Halifax, NS" },
    organizer: { "@type": "Organization", name: organizer.name, url: organizer.url, email: organizer.email },
    ...(offers.length ? { offers } : {}),
  };
}

function Tiers({ event, lang, now }) {
  if (!event.tiers?.length) return null;
  return (
    <div>
      <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">
        {upper(lang, t(lang, "events.tickets"))}
      </div>
      <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-700">
        {event.tiers.map((tier) => {
          const live = tierIsAvailable(tier, now);
          return (
            <li key={tier.id} className={`flex items-start justify-between gap-4 py-2.5 ${live ? "" : "opacity-60"}`}>
              <div className="min-w-0">
                <div className={`text-sm font-semibold text-slate-900 dark:text-white ${live ? "" : "line-through"}`}>
                  {tier.label[lang]}
                </div>
                {tier.availableUntil && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {live
                      ? t(lang, "events.tier.until", { date: fmtMediumDate(zonedToDate(tier.availableUntil), lang) })
                      : t(lang, "events.tier.expired")}
                  </div>
                )}
                {tier.note && <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{tier.note[lang]}</div>}
              </div>
              <div className={`flex-none text-sm font-black text-brand ${live ? "" : "line-through"}`}>
                {tier.priceCad === 0 ? t(lang, "events.free") : `$${tier.priceCad}`}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RegistrationCta({ event, lang, past }) {
  const reg = event.registration || { mode: "none" };
  if (past || event.status === "cancelled") return null;
  if (reg.mode === "external" && reg.url) {
    return (
      <div>
        <Button href={reg.url} target="_blank" rel="noopener noreferrer" variant="primary" size="lg" className="w-full">
          {t(lang, "events.register")} ↗
        </Button>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t(lang, "events.externalNote", { provider: reg.provider || "" }).replace(/\s{2,}/g, " ")}
        </p>
      </div>
    );
  }
  if (reg.mode === "paid" || reg.mode === "rsvp") {
    return (
      <Button variant="secondary" size="lg" className="w-full cursor-not-allowed opacity-70" disabled>
        {t(lang, "events.paidSoon")}
      </Button>
    );
  }
  return null;
}

export default function EventDetailPage({ lang }) {
  const { slug } = useParams();
  const event = getEventBySlug(slug);
  const now = new Date();

  usePageMeta(
    event
      ? {
          title: event.title[lang],
          description: event.summary[lang],
          canonical: `/etkinlikler/${event.slug}`,
          jsonLd: buildJsonLd(event, lang),
        }
      : { title: t(lang, "events.title") },
  );

  if (!event) {
    return (
      <Section className="py-24">
        <Card className="mx-auto max-w-lg text-center">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">{t(lang, "events.notFound")}</p>
          <div className="mt-5">
            <Button to="/etkinlikler" variant="secondary">
              ← {t(lang, "events.backToList")}
            </Button>
          </div>
        </Card>
      </Section>
    );
  }

  const past = isPast(event, now);
  const { start } = eventInstants(event);

  return (
    <Section className="py-14 sm:py-20">
      <nav className="text-sm" aria-label="Breadcrumb">
        <Link to="/etkinlikler" className="font-semibold text-brand-red hover:underline">
          ← {t(lang, "events.backToList")}
        </Link>
      </nav>

      {(event.status === "cancelled" || event.status === "postponed") && (
        <div className="surface-red mt-6 rounded-xl px-4 py-3 text-sm font-semibold">
          {t(lang, `events.status.${event.status}`)}
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
        {/* Sol: başlık + poster + açıklama */}
        <article>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow lang={lang}>{fmtMediumDate(start, lang)}</Eyebrow>
            <StatusBadge event={event} lang={lang} now={now} />
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {event.title[lang]}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-600 dark:text-slate-300">{event.summary[lang]}</p>

          {event.poster && (
            <img
              src={event.poster.src}
              alt={event.poster.alt?.[lang] || event.title[lang]}
              loading="lazy"
              className="mt-8 w-full max-w-xl rounded-2xl object-cover shadow-card ring-1 ring-slate-200 dark:ring-white/10"
            />
          )}

          <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-700 dark:text-slate-200">
            {(event.description?.[lang] || []).map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </article>

        {/* Sağ: bilgi kartı */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-6">
            <EventMeta event={event} lang={lang} />
            <Tiers event={event} lang={lang} now={now} />
            <RegistrationCta event={event} lang={lang} past={past} />

            {!past && event.status !== "cancelled" && (
              <div>
                <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {upper(lang, t(lang, "events.addToCalendar"))}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => downloadIcs(event, lang)}>
                    {t(lang, "events.downloadIcs")}
                  </Button>
                  <Button
                    href={googleCalendarUrl(event, lang)}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    size="sm"
                  >
                    {t(lang, "events.googleCalendar")} ↗
                  </Button>
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t(lang, "events.contactNote")}{" "}
              <a href={`mailto:${organizer.email}`} className="font-semibold text-brand-red hover:underline">
                {organizer.email}
              </a>
            </p>
          </Card>
        </aside>
      </div>
    </Section>
  );
}
