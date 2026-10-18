import { t, upper } from "../../i18n";
import { eventInstants, fmtLongDate, fmtTimeRange } from "../../lib/dates.js";
import { organizer } from "../../content/events.js";

function Row({ label, lang, children }) {
  return (
    <div>
      <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">{upper(lang, label)}</div>
      <div className="mt-1 text-sm text-slate-800 dark:text-slate-100">{children}</div>
    </div>
  );
}

export default function EventMeta({ event, lang, compact = false }) {
  const { start, end } = eventInstants(event);
  const v = event.venue || {};
  const address = [v.street, [v.city, v.region].filter(Boolean).join(" "), v.postalCode].filter(Boolean).join(", ");
  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <Row label={t(lang, "events.when")} lang={lang}>
        <div className="font-semibold">{fmtLongDate(start, lang)}</div>
        <div>{fmtTimeRange(start, end, lang)}</div>
      </Row>
      {(v.name || address) && (
        <Row label={t(lang, "events.venue")} lang={lang}>
          {v.name && <div className="font-semibold">{v.name}</div>}
          {address && <div>{address}</div>}
          {v.mapUrl && (
            <a
              href={v.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-semibold text-brand-red hover:underline"
            >
              {t(lang, "events.openMap")} ↗
            </a>
          )}
        </Row>
      )}
      {event.dressCode && (
        <Row label={t(lang, "events.dressCode")} lang={lang}>
          {event.dressCode[lang]}
        </Row>
      )}
      {!compact && (
        <Row label={t(lang, "events.organizer")} lang={lang}>
          <div className="font-semibold">{organizer.name}</div>
          <a href={`mailto:${organizer.email}`} className="text-brand-red hover:underline">
            {organizer.email}
          </a>
        </Row>
      )}
    </div>
  );
}
