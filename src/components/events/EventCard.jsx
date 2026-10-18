import { Link } from "react-router-dom";
import { t } from "../../i18n";
import { Button } from "../ui";
import { eventInstants, dayMonthParts, fmtDate, fmtTimeRange, isPast } from "../../lib/dates.js";
import { tierIsAvailable } from "../../content/events.js";

// ---- Takvim yaprağı -------------------------------------------------------
// Üstte kırmızı ay şeridi, ortada büyük gün, altta kısa gün adı. Kartlarda,
// bantta ve detay sayfasının hero'sunda aynı bileşen kullanılır.
const LEAF_SIZES = {
  sm: { w: "w-14", day: "text-xl", month: "text-[9px] py-0.5", wd: "text-[9px]" },
  md: { w: "w-16", day: "text-2xl", month: "text-[10px] py-1", wd: "text-[10px]" },
  lg: { w: "w-24", day: "text-5xl", month: "text-xs py-1.5", wd: "text-xs" },
};

export function DateLeaf({ date, lang, size = "md", muted = false, className = "" }) {
  const { day, month } = dayMonthParts(date, lang);
  const weekday = fmtDate(date, lang, { weekday: "short" }).replace(/\.$/, "");
  const s = LEAF_SIZES[size] || LEAF_SIZES.md;
  return (
    <div
      className={`${s.w} flex-none overflow-hidden rounded-xl bg-white text-center shadow-lg ring-1 ring-black/10 ${className}`}
      aria-hidden="true"
    >
      <div className={`${muted ? "bg-slate-500" : "bg-accent"} ${s.month} font-black uppercase tracking-[0.2em] text-white`}>{month}</div>
      <div className="px-1 pb-1.5 pt-1">
        <div className={`${s.day} font-display font-black leading-none text-slate-900`}>{day}</div>
        <div className={`${s.wd} mt-1 font-bold uppercase tracking-wider text-slate-500`}>{weekday}</div>
      </div>
    </div>
  );
}

// ---- Durum rozeti ---------------------------------------------------------
export function StatusBadge({ event, lang, now = new Date(), className = "" }) {
  let key = null;
  if (event.status === "cancelled") key = "events.status.cancelled";
  else if (event.status === "postponed") key = "events.status.postponed";
  else if (isPast(event, now)) key = "events.status.past";
  if (!key) return null;
  const cls =
    event.status === "cancelled" || event.status === "postponed"
      ? "bg-accent text-white"
      : "bg-slate-800/80 text-white backdrop-blur";
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${cls} ${className}`}>
      {t(lang, key)}
    </span>
  );
}

export function priceFrom(event, lang, now = new Date()) {
  if (event.registration?.free) return t(lang, "events.freeEntry");
  const live = (event.tiers || []).filter((tier) => tierIsAvailable(tier, now));
  if (!live.length) return null;
  const min = Math.min(...live.map((tier) => tier.priceCad));
  if (min === 0) return t(lang, "events.free");
  return t(lang, "events.ticketsFrom", { price: min });
}

// Poster yoksa (eski genel kurullar gibi) bayrak kırmızısı bir desen.
function PosterFallback({ past }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 ${past ? "" : ""}`}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/90 shadow-lg">
        <span className="text-4xl" aria-hidden="true">☪</span>
      </div>
    </div>
  );
}

// ---- Kart -------------------------------------------------------------------
export default function EventCard({ event, lang, now = new Date(), compact = false }) {
  const { start, end } = eventInstants(event);
  const past = isPast(event, now);
  const live = !past && event.status === "scheduled";
  const price = live ? priceFrom(event, lang, now) : null;
  const external = live && event.registration?.mode === "external" && event.registration.url;
  const href = `/etkinlikler/${event.slug}`;
  const timeText = fmtTimeRange(start, event.showEndTime === false ? null : end, lang);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-primary-800">
      <Link to={href} className={`relative block overflow-hidden bg-primary-900 ${compact ? "aspect-[16/9]" : "aspect-[4/3]"}`} aria-label={event.title[lang]}>
        {event.poster ? (
          <img
            src={event.poster.src}
            alt=""
            loading="lazy"
            className={`h-full w-full object-cover object-top transition duration-700 group-hover:scale-105 ${past ? "grayscale-[60%]" : ""}`}
          />
        ) : (
          <PosterFallback past={past} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/95 via-primary-900/30 to-transparent" />
        <DateLeaf date={start} lang={lang} size={compact ? "sm" : "md"} muted={past} className="absolute left-4 top-4" />
        <StatusBadge event={event} lang={lang} now={now} className="absolute right-4 top-4" />
        <div className="absolute inset-x-4 bottom-4 text-xs font-semibold text-white/90 drop-shadow">
          {timeText}
          {event.venue?.name ? ` · ${event.venue.name}` : ""}
        </div>
      </Link>

      <div className={`flex flex-1 flex-col ${compact ? "p-4" : "p-5"}`}>
        <h3 className={`font-display font-extrabold leading-snug tracking-tight text-slate-900 dark:text-white ${compact ? "text-base" : "text-lg"}`}>
          <Link to={href} className="hover:text-accent-600 dark:hover:text-accent-300">
            {event.title[lang]}
          </Link>
        </h3>
        {!compact && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{event.summary[lang]}</p>}
        {price && (
          <div className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gold/25 px-2.5 py-1 text-[11px] font-bold text-slate-900 dark:bg-gold/20 dark:text-gold">
            <span aria-hidden="true">{event.registration?.free ? "🎉" : "🎟️"}</span> {price}
          </div>
        )}
        <div className="mt-auto flex flex-wrap gap-2 pt-5">
          <Button to={href} variant={external ? "outline" : "secondary"} size="sm">
            {t(lang, "events.details")}
          </Button>
          {external && (
            <Button href={event.registration.url} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
              {t(lang, "events.register")} ↗
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
