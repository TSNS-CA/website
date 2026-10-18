import { Link } from "react-router-dom";
import { t, upper } from "../../i18n";
import { Container, Button } from "../ui";
import { eventInstants, fmtMediumDate, fmtTimeRange } from "../../lib/dates.js";
import { DateLeaf, priceFrom } from "./EventCard";

function Row({ event, lang, now }) {
  const { start, end } = eventInstants(event);
  const external = event.registration?.mode === "external" && event.registration.url;
  const price = priceFrom(event, lang, now);
  return (
    <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <Link to={`/etkinlikler/${event.slug}`} className="group flex min-w-0 items-center gap-4">
        <DateLeaf date={start} lang={lang} size="md" />
        <div className="min-w-0">
          <div className="truncate text-base font-extrabold group-hover:underline sm:text-lg">{event.title[lang]}</div>
          <div className="text-xs text-slate-200 sm:text-sm">
            {fmtMediumDate(start, lang)} · {fmtTimeRange(start, event.showEndTime === false ? null : end, lang)}
            {event.venue?.name ? ` · ${event.venue.name}` : ""}
          </div>
          {price && <div className="mt-0.5 text-xs font-semibold text-gold">{price}</div>}
        </div>
      </Link>
      <div className="flex flex-none flex-wrap gap-2 pl-20 sm:pl-0">
        {external && (
          <Button href={event.registration.url} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
            {t(lang, "events.register")} ↗
          </Button>
        )}
        <Button to={`/etkinlikler/${event.slug}`} variant="ghostWhite" size="sm">
          {t(lang, "events.details")}
        </Button>
      </div>
    </div>
  );
}

// Ana sayfadaki kırmızı "söz" şeridinin yerine, yaklaşan etkinlik(ler) varken
// gösterilen lacivert bant. En fazla iki etkinlik; gerisi "Tümünü Gör"e kalır.
export default function NextEventBanner({ events, lang, now = new Date() }) {
  if (!events?.length) return null;
  const shown = events.slice(0, 2);
  const rest = events.length - shown.length;
  return (
    <div className="relative isolate overflow-hidden border-y border-white/10 bg-primary text-white">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-gold/10 blur-3xl" aria-hidden="true" />
      <Container className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="text-[11px] font-bold tracking-[0.2em] text-gold">{upper(lang, t(lang, "home.nextEvent.eyebrow"))}</div>
          <Link to="/etkinlikler" className="text-xs font-semibold text-slate-200 hover:text-white">
            {rest > 0 ? `+${t(lang, "events.moreUpcoming", { count: rest })} · ` : ""}
            {t(lang, "action.viewAll")} →
          </Link>
        </div>
        <div className="divide-y divide-white/10">
          {shown.map((e) => (
            <Row key={e.slug} event={e} lang={lang} now={now} />
          ))}
        </div>
      </Container>
    </div>
  );
}
