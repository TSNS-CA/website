// "Takvime ekle" — bağımlılıksız .ics üretimi ve Google Calendar bağlantısı.
// Tarihler UTC (Z) yazılır; böylece VTIMEZONE bloğu gerekmez ve her takvim
// uygulaması Halifax'a göre doğru saati gösterir.
import { eventInstants } from "./dates.js";

const SITE = "https://tsns.ca";

function icsStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function esc(s) {
  return String(s ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

// RFC 5545: satırlar 75 oktet; devam satırları bir boşlukla başlar.
function fold(line) {
  const enc = new TextEncoder();
  const out = [];
  let cur = "";
  let curBytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (curBytes + b > (out.length ? 74 : 75)) {
      out.push(cur);
      cur = " " + ch;
      curBytes = 1 + b;
    } else {
      cur += ch;
      curBytes += b;
    }
  }
  out.push(cur);
  return out.join("\r\n");
}

export function venueLine(venue) {
  if (!venue) return "";
  return [venue.name, venue.street, [venue.city, venue.region].filter(Boolean).join(" "), venue.postalCode]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");
}

export function eventUrl(event) {
  return `${SITE}/etkinlikler/${event.slug}`;
}

export function buildIcs(event, lang = "tr") {
  const { start, end } = eventInstants(event);
  const title = event.title?.[lang] || event.title?.tr || event.slug;
  const summary = event.summary?.[lang] || event.summary?.tr || "";
  const url = eventUrl(event);
  const desc = [summary, event.registration?.url, url].filter(Boolean).join("\n");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Turkish Society of Nova Scotia//Events//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.slug}@tsns.ca`,
    `DTSTAMP:${icsStamp(new Date())}`,
    `DTSTART:${icsStamp(start)}`,
    `DTEND:${icsStamp(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(desc)}`,
    `LOCATION:${esc(venueLine(event.venue))}`,
    `URL:${url}`,
    event.status === "cancelled" ? "STATUS:CANCELLED" : "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

export function downloadIcs(event, lang = "tr") {
  const blob = new Blob([buildIcs(event, lang)], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = `${event.slug}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

export function googleCalendarUrl(event, lang = "tr") {
  const { start, end } = eventInstants(event);
  const title = event.title?.[lang] || event.title?.tr || event.slug;
  const summary = event.summary?.[lang] || event.summary?.tr || "";
  const details = [summary, event.registration?.url, eventUrl(event)].filter(Boolean).join("\n");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${icsStamp(start)}/${icsStamp(end)}`,
    details,
    location: venueLine(event.venue),
    ctz: "America/Halifax",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
