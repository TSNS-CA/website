import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { t, upper } from "../i18n";
import { Container, Section, Button, Card } from "../components/ui";
import EventMeta from "../components/events/EventMeta";
import { DateLeaf, StatusBadge } from "../components/events/EventCard";
import { getEventBySlug, tierIsAvailable, organizer } from "../content/events.js";
import { eventInstants, isoWithOffset, isPast, fmtLongDate, fmtMediumDate, fmtTimeRange, zonedToDate } from "../lib/dates.js";
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
  if (!offers.length && e.registration?.free) {
    offers.push({ "@type": "Offer", price: "0", priceCurrency: "CAD", url, availability: "https://schema.org/InStock" });
  }
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
    isAccessibleForFree: !!e.registration?.free,
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

const Label = ({ lang, children }) => (
  <div className="text-[11px] font-bold tracking-[0.16em] text-slate-500 dark:text-slate-400">{upper(lang, children)}</div>
);

function Tiers({ event, lang, now }) {
  if (!event.tiers?.length) return null;
  return (
    <div>
      <Label lang={lang}>{t(lang, "events.tickets")}</Label>
      <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-700">
        {event.tiers.map((tier) => {
          const live = tierIsAvailable(tier, now);
          return (
            <li key={tier.id} className={`flex items-start justify-between gap-4 py-3 ${live ? "" : "opacity-60"}`}>
              <div className="min-w-0">
                <div className={`text-sm font-semibold text-slate-900 dark:text-white ${live ? "" : "line-through"}`}>{tier.label[lang]}</div>
                {tier.availableUntil && (
                  <div className={`text-xs ${live ? "font-semibold text-brand-red" : "text-slate-500 dark:text-slate-400"}`}>
                    {live
                      ? t(lang, "events.tier.until", { date: fmtMediumDate(zonedToDate(tier.availableUntil), lang) })
                      : t(lang, "events.tier.expired")}
                  </div>
                )}
                {tier.note && <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{tier.note[lang]}</div>}
              </div>
              <div className={`flex-none font-display text-lg font-black text-brand ${live ? "" : "line-through"}`}>
                {tier.priceCad === 0 ? t(lang, "events.free") : `$${tier.priceCad}`}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function RegistrationCta({ event, lang, past, size = "lg" }) {
  const reg = event.registration || { mode: "none" };
  if (past || event.status === "cancelled") return null;
  if (reg.mode === "external" && reg.url) {
    return (
      <div>
        <Button href={reg.url} target="_blank" rel="noopener noreferrer" variant="primary" size={size} className="w-full shadow-lg shadow-accent/30">
          <span aria-hidden="true">🎟️</span>{t(lang, "events.register")} ↗
        </Button>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t(lang, "events.externalNote", { provider: reg.provider || "" })}</p>
      </div>
    );
  }
  if (reg.mode === "paid" || reg.mode === "rsvp") {
    return (
      <Button variant="secondary" size={size} className="w-full cursor-not-allowed opacity-70" disabled>
        {t(lang, "events.paidSoon")}
      </Button>
    );
  }
  if (reg.free) {
    return (
      <div className="rounded-xl bg-gold/20 px-4 py-3 text-sm font-semibold text-slate-900 dark:bg-gold/15 dark:text-gold">
        🎉 {t(lang, "events.freeEntry")}
        <div className="mt-0.5 text-xs font-normal text-slate-700 dark:text-slate-200">{t(lang, "events.noRegistration")}</div>
      </div>
    );
  }
  return null;
}

function CalendarButtons({ event, lang, light = false }) {
  const variant = light ? "ghostWhite" : "outline";
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant={variant} size="sm" onClick={() => downloadIcs(event, lang)}>
        <span aria-hidden="true">📅</span>{t(lang, "events.downloadIcs")}
      </Button>
      <Button href={googleCalendarUrl(event, lang)} target="_blank" rel="noopener noreferrer" variant={variant} size="sm">
        {t(lang, "events.googleCalendar")} ↗
      </Button>
    </div>
  );
}

function ShareButton({ event, lang }) {
  const [copied, setCopied] = useState(false);
  const url = `https://tsns.ca/etkinlikler/${event.slug}`;
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title[lang], text: event.summary[lang], url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  }
  return (
    <Button type="button" variant="ghostWhite" size="sm" onClick={share}>
      {copied ? `✓ ${t(lang, "events.copied")}` : `${t(lang, "events.share")} ↗`}
    </Button>
  );
}

function Program({ event, lang }) {
  if (!event.program?.length) return null;
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">🗓️ {t(lang, "events.program")}</h2>
      <ol className="mt-5 space-y-0">
        {event.program.map((p, i) => (
          <li key={i} className="relative grid grid-cols-[112px_1fr] gap-4 border-l-2 border-accent/30 pb-5 pl-5 last:pb-0 dark:border-accent/40">
            <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full bg-accent ring-4 ring-cream dark:ring-primary-900" aria-hidden="true" />
            <span className="font-mono text-sm font-bold text-brand-red">{p.time}</span>
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-white">{p.title[lang]}</div>
              {p.note && <div className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{p.note[lang]}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Menu({ event, lang }) {
  if (!event.menu?.[lang]?.length) return null;
  return (
    <div>
      <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">🍽️ {t(lang, "events.menu")}</h2>
      <ul className="mt-5 flex flex-wrap gap-2">
        {event.menu[lang].map((m) => (
          <li key={m} className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-800 dark:border-slate-700 dark:bg-primary-800 dark:text-slate-100">
            {m}
          </li>
        ))}
      </ul>
      {event.sponsorNote && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gold/20 px-3 py-2 text-xs font-semibold text-slate-800 dark:bg-gold/15 dark:text-gold">
          🍷 {event.sponsorNote[lang]}
        </p>
      )}
    </div>
  );
}

export default function EventDetailPage({ lang }) {
  const { slug } = useParams();
  const event = getEventBySlug(slug);
  const now = new Date();

  usePageMeta(
    event
      ? { title: event.title[lang], description: event.summary[lang], canonical: `/etkinlikler/${event.slug}`, jsonLd: buildJsonLd(event, lang) }
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
  const live = !past && event.status !== "cancelled";
  const { start, end } = eventInstants(event);
  const timeText = fmtTimeRange(start, event.showEndTime === false ? null : end, lang);
  const v = event.venue || {};
  const address = [v.street, [v.city, v.region].filter(Boolean).join(" "), v.postalCode].filter(Boolean).join(", ");

  return (
    <>
      {/* HERO — poster bulanık arka plan (Zeffy tarzı), üstte net poster kartı */}
      <section className="relative isolate overflow-hidden bg-primary-900 text-white">
        {event.poster && (
          <div className="absolute inset-0 -z-10" aria-hidden="true">
            <img src={event.poster.src} alt="" className="h-full w-full scale-125 object-cover opacity-90 blur-3xl saturate-150" />
          </div>
        )}
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-900/45 via-primary-900/60 to-primary-900" aria-hidden="true" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" aria-hidden="true" />

        <Container className="py-10 sm:py-14 lg:py-20">
          <nav className="text-sm" aria-label="Breadcrumb">
            <Link to="/etkinlikler" className="font-semibold text-white/80 hover:text-white">
              ← {t(lang, "events.backToList")}
            </Link>
          </nav>

          <div className="mt-8 grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_400px]">
            <div>
              <div className="flex items-center gap-4">
                <DateLeaf date={start} lang={lang} size="lg" muted={past} />
                <div>
                  <div className="text-[11px] font-bold tracking-[0.2em] text-gold">{upper(lang, t(lang, "events.heroEyebrow"))}</div>
                  <div className="mt-1 text-base font-bold sm:text-lg">{fmtLongDate(start, lang)}</div>
                  <div className="text-sm text-slate-200">{timeText}</div>
                  <StatusBadge event={event} lang={lang} now={now} className="mt-2" />
                </div>
              </div>

              <h1 className="mt-7 font-display text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{event.title[lang]}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-200">{event.summary[lang]}</p>

              {(v.name || address) && (
                <a
                  href={v.mapUrl || undefined}
                  target={v.mapUrl ? "_blank" : undefined}
                  rel={v.mapUrl ? "noopener noreferrer" : undefined}
                  className="mt-6 inline-flex max-w-full items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-inset ring-white/15 backdrop-blur transition hover:bg-white/15"
                >
                  <span className="text-xl" aria-hidden="true">📍</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{v.name}</span>
                    {address && <span className="block truncate text-xs text-slate-200">{address}</span>}
                  </span>
                  {v.mapUrl && <span className="ml-1 text-xs font-semibold text-gold">↗</span>}
                </a>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {live && event.registration?.mode === "external" && event.registration.url && (
                  <Button href={event.registration.url} target="_blank" rel="noopener noreferrer" variant="primary" size="lg" className="shadow-xl shadow-accent/30">
                    <span aria-hidden="true">🎟️</span>{t(lang, "events.register")} ↗
                  </Button>
                )}
                {live && event.registration?.free && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-black text-primary-900">
                    🎉 {t(lang, "events.freeEntry")}
                  </span>
                )}
                {live && <CalendarButtons event={event} lang={lang} light />}
                <ShareButton event={event} lang={lang} />
              </div>
            </div>

            {event.poster && (
              <div className="relative mx-auto w-full max-w-xs sm:max-w-sm lg:max-w-none">
                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-gold/40 via-accent/30 to-transparent blur-xl" aria-hidden="true" />
                <img
                  src={event.poster.src}
                  alt={event.poster.alt?.[lang] || event.title[lang]}
                  className={`relative w-full rounded-3xl shadow-2xl ring-1 ring-white/20 ${past ? "grayscale-[50%]" : ""}`}
                />
              </div>
            )}
          </div>
        </Container>
      </section>

      {(event.status === "cancelled" || event.status === "postponed") && (
        <div className="bg-accent py-3 text-center text-sm font-bold text-white">{t(lang, `events.status.${event.status}`)}</div>
      )}

      {/* İÇERİK */}
      <Section className="py-14 sm:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
          <article className="space-y-14">
            <div>
              <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t(lang, "events.about")}</h2>
              <div className="mt-5 space-y-5 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                {(event.description?.[lang] || []).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              {event.dressCode && (
                <p className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cream-200 px-3 py-2 text-sm font-semibold text-slate-800 dark:bg-primary-800 dark:text-slate-100">
                  👗 {t(lang, "events.dressCode")}: {event.dressCode[lang]}
                </p>
              )}
            </div>

            <Program event={event} lang={lang} />
            <Menu event={event} lang={lang} />

            {event.gallery?.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">🖼️ {t(lang, "events.gallery")}</h2>
                <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {event.gallery.map((g) => (
                    <a key={g.src} href={g.src} target="_blank" rel="noopener noreferrer" className="group block overflow-hidden rounded-2xl shadow-card ring-1 ring-slate-200 dark:ring-white/10">
                      <img src={g.src} alt={g.alt?.[lang] || ""} loading="lazy" className="w-full transition duration-500 group-hover:scale-[1.02]" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </article>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card className="space-y-6 border-t-4 border-t-accent">
              <EventMeta event={event} lang={lang} />
              <Tiers event={event} lang={lang} now={now} />
              <RegistrationCta event={event} lang={lang} past={past} />
              {live && (
                <div>
                  <Label lang={lang}>{t(lang, "events.addToCalendar")}</Label>
                  <div className="mt-2">
                    <CalendarButtons event={event} lang={lang} />
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
    </>
  );
}
