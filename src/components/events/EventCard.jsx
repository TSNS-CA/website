import { Link } from "react-router-dom";
import { t } from "../../i18n";
import { eventInstants, dayMonthParts, fmtTimeRange, isPast } from "../../lib/dates.js";
import { tierIsAvailable } from "../../content/events.js";

export function StatusBadge({ event, lang, now = new Date() }) {
  let key = null;
  if (event.status === "cancelled") key = "events.status.cancelled";
  else if (event.status === "postponed") key = "events.status.postponed";
  else if (isPast(event, now)) key = "events.status.past";
  if (!key) return null;
  const cls =
    event.status === "cancelled" || event.status === "postponed"
      ? "surface-red"
      : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200";
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${cls}`}>
      {t(lang, key)}
    </span>
  );
}

export function DateTile({ event, lang, muted = false }) {
  const { start } = eventInstants(event);
  const { day, month } = dayMonthParts(start, lang);
  return (
    <div
      className={`flex w-16 flex-none flex-col items-center justify-center rounded-xl px-1 py-2 text-center ${
        muted ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-200" : "surface-red"
      }`}
      aria-hidden="true"
    >
      <span className="text-xl font-black leading-none">{day}</span>
      <span className="mt-1 text-[11px] font-bold uppercase leading-tight">{month}</span>
    </div>
  );
}

function priceFrom(event, lang, now) {
  const live = (event.tiers || []).filter((tier) => tierIsAvailable(tier, now));
  if (!live.length) return null;
  const min = Math.min(...live.map((tier) => tier.priceCad));
  if (min === 0) return t(lang, "events.free");
  return lang === "tr" ? `${min} $'dan` : `from $${min}`;
}

export default function EventCard({ event, lang, now = new Date() }) {
  const { start, end } = eventInstants(event);
  const past = isPast(event, now);
  const price = !past && event.status === "scheduled" ? priceFrom(event, lang, now) : null;
  return (
    <Link
      to={`/etkinlikler/${event.slug}`}
      className={`group flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-primary-800 ${
        past ? "opacity-90" : ""
      }`}
    >
      <DateTile event={event} lang={lang} muted={past} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold text-slate-900 group-hover:text-accent-600 dark:text-white dark:group-hover:text-accent-300">
            {event.title[lang]}
          </h3>
          <StatusBadge event={event} lang={lang} now={now} />
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{event.summary[lang]}</p>
        <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
          {fmtTimeRange(start, end, lang)}
          {event.venue?.name ? ` · ${event.venue.name}` : ""}
          {price ? ` · ${price}` : ""}
        </p>
      </div>
    </Link>
  );
}
