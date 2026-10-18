import { t, upper } from "../../i18n";
import { Container, Button } from "../ui";
import { eventInstants, fmtMediumDate, fmtTimeRange, dayMonthParts } from "../../lib/dates.js";

// Ana sayfadaki kırmızı "söz" şeridinin yerine, yaklaşan öne çıkan etkinlik
// varken gösterilen lacivert bant. İkisi birden gösterilmez.
export default function NextEventBanner({ event, lang }) {
  if (!event) return null;
  const { start, end } = eventInstants(event);
  const { day, month } = dayMonthParts(start, lang);
  const external = event.registration?.mode === "external" && event.registration.url;
  return (
    <div className="border-y border-white/10 bg-primary text-white">
      <Container className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-14 w-14 flex-none flex-col items-center justify-center rounded-xl bg-accent text-white shadow-sm"
            aria-hidden="true"
          >
            <span className="text-xl font-black leading-none">{day}</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase leading-none">{month}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold tracking-[0.18em] text-gold">
              {upper(lang, t(lang, "home.nextEvent.eyebrow"))}
            </div>
            <div className="mt-0.5 truncate text-base font-extrabold sm:text-lg">{event.title[lang]}</div>
            <div className="text-xs text-slate-200 sm:text-sm">
              {fmtMediumDate(start, lang)} · {fmtTimeRange(start, end, lang)}
              {event.venue?.name ? ` · ${event.venue.name}` : ""}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {external && (
            <Button href={event.registration.url} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
              {t(lang, "events.register")} ↗
            </Button>
          )}
          <Button to={`/etkinlikler/${event.slug}`} variant="ghostWhite" size="sm">
            {t(lang, "events.details")}
          </Button>
        </div>
      </Container>
    </div>
  );
}
