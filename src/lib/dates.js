// Halifax saat dilimi yardımcıları — bağımlılıksız, DST güvenli.
//
// Etkinlik verisi duvar saatiyle yazılır ("2026-11-06T19:00") ve her zaman
// America/Halifax'a göre yorumlanır. `new Date("2026-11-06T19:00")` izleyicinin
// kendi saat dilimine göre çözümlendiği için ASLA kullanılmaz; `zonedToDate`
// gerçek anı (UTC) üretir. Kasım'ın ilk pazarı DST biter (ADT -3 → AST -4);
// offset iki geçişle hesaplandığı için sınırdaki tarihler de doğru çıkar.

export const TZ = "America/Halifax";

const LOCALE = { tr: "tr-TR", en: "en-CA" };
const locale = (lang) => LOCALE[lang] || LOCALE.tr;

const dtfCache = new Map();
function partsFormatter(tz) {
  if (!dtfCache.has(tz)) {
    dtfCache.set(
      tz,
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hourCycle: "h23",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
    );
  }
  return dtfCache.get(tz);
}

function wallParts(date, tz = TZ) {
  const p = {};
  for (const { type, value } of partsFormatter(tz).formatToParts(date)) p[type] = value;
  // hourCycle h23 yine de bazı motorlarda "24" verebiliyor.
  if (p.hour === "24") p.hour = "00";
  return p;
}

// Verilen anda tz'nin UTC'ye göre offset'i (dakika). Halifax: ADT -180, AST -240.
export function tzOffsetMinutes(date, tz = TZ) {
  const p = wallParts(date, tz);
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return Math.round((asUtc - date.getTime()) / 60000);
}

// "YYYY-MM-DD" veya "YYYY-MM-DDTHH:mm" (tz duvar saati) → Date (gerçek an).
export function zonedToDate(localIso, tz = TZ) {
  if (localIso instanceof Date) return localIso;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?$/.exec(String(localIso || ""));
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00"] = m;
  const guess = Date.UTC(+y, +mo - 1, +d, +h, +mi);
  const off1 = tzOffsetMinutes(new Date(guess), tz);
  let ts = guess - off1 * 60000;
  const off2 = tzOffsetMinutes(new Date(ts), tz);
  if (off2 !== off1) ts = guess - off2 * 60000;
  return new Date(ts);
}

const pad2 = (n) => String(n).padStart(2, "0");

// schema.org / iCal için offset'li ISO: "2026-11-06T19:00:00-04:00".
export function isoWithOffset(date, tz = TZ) {
  const p = wallParts(date, tz);
  const off = tzOffsetMinutes(date, tz);
  const sign = off >= 0 ? "+" : "-";
  const a = Math.abs(off);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}${sign}${pad2(Math.floor(a / 60))}:${pad2(a % 60)}`;
}

// Halifax takvim günü anahtarı: "2026-10-30" (en-CA bu biçimi verir).
export function halifaxDateKey(date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: TZ });
}

export function fmtDate(date, lang, opts = {}) {
  return date.toLocaleDateString(locale(lang), { timeZone: TZ, ...opts });
}

// "6 Kasım 2026 Cuma" / "Friday, November 6, 2026"
export function fmtLongDate(date, lang) {
  return fmtDate(date, lang, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

// "6 Kasım 2026" / "November 6, 2026"
export function fmtMediumDate(date, lang) {
  return fmtDate(date, lang, { day: "numeric", month: "long", year: "numeric" });
}

export function fmtTime(date, lang) {
  return date.toLocaleTimeString(locale(lang), {
    timeZone: TZ,
    hour: lang === "tr" ? "2-digit" : "numeric",
    minute: "2-digit",
  });
}

// "AST" / "ADT" — kısaltma en-CA'dan alınır; tr-TR "GMT-4" döndürüyor.
export function tzAbbr(date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, timeZoneName: "short" }).formatToParts(date);
  return parts.find((p) => p.type === "timeZoneName")?.value || "";
}

// "19:00–23:00 AST" / "7:00–11:00 p.m. AST"
export function fmtTimeRange(start, end, lang) {
  const s = fmtTime(start, lang);
  if (!end) return `${s} ${tzAbbr(start)}`;
  let e = fmtTime(end, lang);
  if (lang !== "tr") {
    // İki saat aynı a.m./p.m. dilimindeyse ilkinden eki düş: "7:00–11:00 p.m."
    const suffix = /\s*(a\.m\.|p\.m\.|AM|PM)$/i;
    const ms = s.match(suffix);
    const me = e.match(suffix);
    if (ms && me && ms[1].toLowerCase() === me[1].toLowerCase()) {
      return `${s.replace(suffix, "")}–${e} ${tzAbbr(end)}`;
    }
  }
  return `${s}–${e} ${tzAbbr(end)}`;
}

// Kırmızı tarih kutusu için: { day: "6", month: "Kas" | "Nov" }
export function dayMonthParts(date, lang) {
  return {
    day: fmtDate(date, lang, { day: "numeric" }),
    month: fmtDate(date, lang, { month: "short" }).replace(/\.$/, ""),
  };
}

// Etkinliğin başlangıç/bitiş anları. Bitiş yoksa başlangıç + 3 saat varsayılır.
export function eventInstants(event) {
  const start = zonedToDate(event.start, event.timezone || TZ);
  const end = event.end ? zonedToDate(event.end, event.timezone || TZ) : new Date(start.getTime() + 3 * 3600000);
  return { start, end };
}

export function isPast(event, now = new Date()) {
  return eventInstants(event).end.getTime() < now.getTime();
}
