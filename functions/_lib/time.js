// Saat dilimi.
//
// Dernek Halifax'ta, Worker'lar UTC'de çalışıyor. Bir *anı* takvim gününe
// çevirmek zorunda kalan her yer hangi takvimi kullanacağını söylemek
// zorunda; söylemezse sessizce UTC'ninkini kullanır — Nova Scotia'daki
// üyenin yaşadığı günden yazın 3, kışın 4 saat ileride.
//
// Saklama tarafına karışmıyoruz: `timestamptz` mutlak anı tutar ve doğrudur.
// Burası yalnızca "bugün hangi gün" sorusunun cevabı.

export const TIMEZONE = "America/Halifax";

const ymd = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Halifax'ta bugün, `YYYY-MM-DD`. */
export function halifaxToday(from = new Date()) {
  return ymd.format(from);
}

/** Halifax'ta içinde bulunulan yıl. */
export function halifaxYear(from = new Date()) {
  return Number(halifaxToday(from).slice(0, 4));
}
