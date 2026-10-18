// Fotoğraf Arşivi verisi. Albüm = etkinlik; her albümün tarihi (gün ya da ay hassasiyetinde),
// kategorisi ve fotoğraf listesi var. Fotoğraflar public/photos/<slug>/NN.jpg (en fazla 1600 px)
// ve NN-t.jpg (480 px küçük resim); EXIF/GPS verisi temizlenmiştir. Kaynak: eski Google Sites
// "Photos" sayfası (2026-10-18 yedeği). Yeni albüm eklemek için: fotoğrafları aynı iki boyutta
// kaydet, aşağıya bir kayıt ekle (w/h gerçek piksel boyutları — masonry için gerekli).
import { eventInstants } from "../lib/dates.js";

export const categories = [
  { id: "ulusal-bayram", label: { tr: "Ulusal Bayramlar", en: "National Days" }, icon: "🇹🇷" },
  { id: "anma", label: { tr: "Anma Günleri", en: "Remembrance" }, icon: "🕯️" },
  { id: "topluluk", label: { tr: "Topluluk Buluşmaları", en: "Community Gatherings" }, icon: "🧺" },
  { id: "ozel-gun", label: { tr: "Özel Günler", en: "Special Days" }, icon: "🌷" },
  { id: "gala", label: { tr: "Galalar ve Resepsiyonlar", en: "Galas & Receptions" }, icon: "🥂" },
];

export const albums = [
  {
    slug: "23-nisan-2022",
    title: {"tr": "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı 2022", "en": "April 23 National Sovereignty and Children's Day 2022"},
    date: "2022-04-23", // gün hassasiyeti
    datePrecision: "day",
    category: "ulusal-bayram",
    location: {"tr": "Halifax, açık hava pikniği", "en": "Halifax, outdoor picnic"},
    description: {"tr": "Pandemi sonrası ilk açık hava 23 Nisan'ımız: liman kıyısında piknik, pasta, balonlar ve çocukların elinde bayraklar.", "en": "Our first outdoor April 23 after the pandemic: a picnic by the harbour, cake, balloons and flags in the children's hands."},
    cover: "/photos/23-nisan-2022/09.jpg",
    coverThumb: "/photos/23-nisan-2022/09-t.jpg",
    photos: [
      { src: "/photos/23-nisan-2022/01.jpg", thumb: "/photos/23-nisan-2022/01-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/02.jpg", thumb: "/photos/23-nisan-2022/02-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/03.jpg", thumb: "/photos/23-nisan-2022/03-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/04.jpg", thumb: "/photos/23-nisan-2022/04-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/05.jpg", thumb: "/photos/23-nisan-2022/05-t.jpg", w: 1600, h: 900 },
      { src: "/photos/23-nisan-2022/06.jpg", thumb: "/photos/23-nisan-2022/06-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/07.jpg", thumb: "/photos/23-nisan-2022/07-t.jpg", w: 900, h: 1600 },
      { src: "/photos/23-nisan-2022/08.jpg", thumb: "/photos/23-nisan-2022/08-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/09.jpg", thumb: "/photos/23-nisan-2022/09-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/10.jpg", thumb: "/photos/23-nisan-2022/10-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/23-nisan-2022/11.jpg", thumb: "/photos/23-nisan-2022/11-t.jpg", w: 1600, h: 1200 },
      { src: "/photos/23-nisan-2022/12.jpg", thumb: "/photos/23-nisan-2022/12-t.jpg", w: 1600, h: 1200 },
      { src: "/photos/23-nisan-2022/13.jpg", thumb: "/photos/23-nisan-2022/13-t.jpg", w: 1600, h: 1200 },
      { src: "/photos/23-nisan-2022/14.jpg", thumb: "/photos/23-nisan-2022/14-t.jpg", w: 450, h: 600 },
    ],
  },
  {
    slug: "23-nisan-2021",
    title: {"tr": "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı 2021", "en": "April 23 National Sovereignty and Children's Day 2021"},
    date: "2021-04-23", // gün hassasiyeti
    datePrecision: "day",
    category: "ulusal-bayram",
    location: {"tr": "Halifax", "en": "Halifax"},
    description: {"tr": "Çocuklarımızın sahne gösterileri, şiirler ve aile portreleri: bayram coşkusu stüdyo karelerinde.", "en": "Children's stage performances, poems and family portraits: the festive spirit captured in studio frames."},
    cover: "/photos/23-nisan-2021/08.jpg",
    coverThumb: "/photos/23-nisan-2021/08-t.jpg",
    photos: [
      { src: "/photos/23-nisan-2021/01.jpg", thumb: "/photos/23-nisan-2021/01-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/02.jpg", thumb: "/photos/23-nisan-2021/02-t.jpg", w: 636, h: 960 },
      { src: "/photos/23-nisan-2021/03.jpg", thumb: "/photos/23-nisan-2021/03-t.jpg", w: 960, h: 815 },
      { src: "/photos/23-nisan-2021/04.jpg", thumb: "/photos/23-nisan-2021/04-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/05.jpg", thumb: "/photos/23-nisan-2021/05-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/06.jpg", thumb: "/photos/23-nisan-2021/06-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/07.jpg", thumb: "/photos/23-nisan-2021/07-t.jpg", w: 960, h: 944 },
      { src: "/photos/23-nisan-2021/08.jpg", thumb: "/photos/23-nisan-2021/08-t.jpg", w: 636, h: 960 },
      { src: "/photos/23-nisan-2021/09.jpg", thumb: "/photos/23-nisan-2021/09-t.jpg", w: 960, h: 663 },
      { src: "/photos/23-nisan-2021/10.jpg", thumb: "/photos/23-nisan-2021/10-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/11.jpg", thumb: "/photos/23-nisan-2021/11-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/12.jpg", thumb: "/photos/23-nisan-2021/12-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/13.jpg", thumb: "/photos/23-nisan-2021/13-t.jpg", w: 960, h: 899 },
      { src: "/photos/23-nisan-2021/14.jpg", thumb: "/photos/23-nisan-2021/14-t.jpg", w: 681, h: 960 },
      { src: "/photos/23-nisan-2021/15.jpg", thumb: "/photos/23-nisan-2021/15-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/16.jpg", thumb: "/photos/23-nisan-2021/16-t.jpg", w: 723, h: 960 },
      { src: "/photos/23-nisan-2021/17.jpg", thumb: "/photos/23-nisan-2021/17-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/18.jpg", thumb: "/photos/23-nisan-2021/18-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/19.jpg", thumb: "/photos/23-nisan-2021/19-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/20.jpg", thumb: "/photos/23-nisan-2021/20-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/21.jpg", thumb: "/photos/23-nisan-2021/21-t.jpg", w: 687, h: 960 },
      { src: "/photos/23-nisan-2021/22.jpg", thumb: "/photos/23-nisan-2021/22-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/23.jpg", thumb: "/photos/23-nisan-2021/23-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/24.jpg", thumb: "/photos/23-nisan-2021/24-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/25.jpg", thumb: "/photos/23-nisan-2021/25-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/26.jpg", thumb: "/photos/23-nisan-2021/26-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/27.jpg", thumb: "/photos/23-nisan-2021/27-t.jpg", w: 960, h: 744 },
      { src: "/photos/23-nisan-2021/28.jpg", thumb: "/photos/23-nisan-2021/28-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/29.jpg", thumb: "/photos/23-nisan-2021/29-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/30.jpg", thumb: "/photos/23-nisan-2021/30-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/31.jpg", thumb: "/photos/23-nisan-2021/31-t.jpg", w: 960, h: 582 },
      { src: "/photos/23-nisan-2021/32.jpg", thumb: "/photos/23-nisan-2021/32-t.jpg", w: 960, h: 671 },
      { src: "/photos/23-nisan-2021/33.jpg", thumb: "/photos/23-nisan-2021/33-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/34.jpg", thumb: "/photos/23-nisan-2021/34-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/35.jpg", thumb: "/photos/23-nisan-2021/35-t.jpg", w: 616, h: 960 },
      { src: "/photos/23-nisan-2021/36.jpg", thumb: "/photos/23-nisan-2021/36-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/37.jpg", thumb: "/photos/23-nisan-2021/37-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/38.jpg", thumb: "/photos/23-nisan-2021/38-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/39.jpg", thumb: "/photos/23-nisan-2021/39-t.jpg", w: 960, h: 640 },
      { src: "/photos/23-nisan-2021/40.jpg", thumb: "/photos/23-nisan-2021/40-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/41.jpg", thumb: "/photos/23-nisan-2021/41-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/42.jpg", thumb: "/photos/23-nisan-2021/42-t.jpg", w: 640, h: 960 },
      { src: "/photos/23-nisan-2021/43.jpg", thumb: "/photos/23-nisan-2021/43-t.jpg", w: 865, h: 960 },
    ],
  },
  {
    slug: "18-mart-2019",
    title: {"tr": "18 Mart Çanakkale Şehitleri Anma Günü 2019", "en": "March 18 Gallipoli Memorial Day 2019"},
    date: "2019-03-18", // gün hassasiyeti
    datePrecision: "day",
    category: "anma",
    location: {"tr": "Halifax, anıt önü", "en": "Halifax, memorial"},
    description: {"tr": "Çanakkale şehitlerimizi Halifax'taki anıt önünde çelenk bırakarak andık.", "en": "We honoured the fallen of Gallipoli with a wreath at the memorial in Halifax."},
    cover: "/photos/18-mart-2019/02.jpg",
    coverThumb: "/photos/18-mart-2019/02-t.jpg",
    photos: [
      { src: "/photos/18-mart-2019/01.jpg", thumb: "/photos/18-mart-2019/01-t.jpg", w: 1600, h: 1200 },
      { src: "/photos/18-mart-2019/02.jpg", thumb: "/photos/18-mart-2019/02-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/18-mart-2019/03.jpg", thumb: "/photos/18-mart-2019/03-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/18-mart-2019/04.jpg", thumb: "/photos/18-mart-2019/04-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/18-mart-2019/05.jpg", thumb: "/photos/18-mart-2019/05-t.jpg", w: 1200, h: 1600 },
      { src: "/photos/18-mart-2019/06.jpg", thumb: "/photos/18-mart-2019/06-t.jpg", w: 750, h: 422 },
      { src: "/photos/18-mart-2019/07.jpg", thumb: "/photos/18-mart-2019/07-t.jpg", w: 1200, h: 1600 },
    ],
  },
  {
    slug: "elma-toplama-2015",
    title: {"tr": "Wolfville Elma Toplama 2015", "en": "Wolfville Apple Picking 2015"},
    date: "2015-10", // ay hassasiyeti
    datePrecision: "month",
    category: "topluluk",
    location: {"tr": "Wolfville, Annapolis Vadisi", "en": "Wolfville, Annapolis Valley"},
    description: {"tr": "Annapolis Vadisi'nde sonbahar: hep birlikte elma topladık, piknik yaptık.", "en": "Autumn in the Annapolis Valley: apple picking and a picnic together."},
    cover: "/photos/elma-toplama-2015/04.jpg",
    coverThumb: "/photos/elma-toplama-2015/04-t.jpg",
    photos: [
      { src: "/photos/elma-toplama-2015/01.jpg", thumb: "/photos/elma-toplama-2015/01-t.jpg", w: 800, h: 600 },
      { src: "/photos/elma-toplama-2015/02.jpg", thumb: "/photos/elma-toplama-2015/02-t.jpg", w: 450, h: 600 },
      { src: "/photos/elma-toplama-2015/03.jpg", thumb: "/photos/elma-toplama-2015/03-t.jpg", w: 450, h: 600 },
      { src: "/photos/elma-toplama-2015/04.jpg", thumb: "/photos/elma-toplama-2015/04-t.jpg", w: 800, h: 600 },
    ],
  },
  {
    slug: "18-mart-2015",
    title: {"tr": "18 Mart Çanakkale Şehitleri Anma Günü 2015", "en": "March 18 Gallipoli Memorial Day 2015"},
    date: "2015-03-18", // gün hassasiyeti
    datePrecision: "day",
    category: "anma",
    location: {"tr": "Halifax, Grand Parade", "en": "Halifax, Grand Parade"},
    description: {"tr": "Grand Parade'deki anıtta çelenk töreni ve anma konuşmaları.", "en": "Wreath-laying and remembrance speeches at the Grand Parade cenotaph."},
    cover: "/photos/18-mart-2015/04.jpg",
    coverThumb: "/photos/18-mart-2015/04-t.jpg",
    photos: [
      { src: "/photos/18-mart-2015/01.jpg", thumb: "/photos/18-mart-2015/01-t.jpg", w: 800, h: 587 },
      { src: "/photos/18-mart-2015/02.jpg", thumb: "/photos/18-mart-2015/02-t.jpg", w: 450, h: 600 },
      { src: "/photos/18-mart-2015/03.jpg", thumb: "/photos/18-mart-2015/03-t.jpg", w: 474, h: 600 },
      { src: "/photos/18-mart-2015/04.jpg", thumb: "/photos/18-mart-2015/04-t.jpg", w: 600, h: 600 },
      { src: "/photos/18-mart-2015/05.jpg", thumb: "/photos/18-mart-2015/05-t.jpg", w: 450, h: 600 },
      { src: "/photos/18-mart-2015/06.jpg", thumb: "/photos/18-mart-2015/06-t.jpg", w: 450, h: 600 },
      { src: "/photos/18-mart-2015/07.jpg", thumb: "/photos/18-mart-2015/07-t.jpg", w: 800, h: 587 },
    ],
  },
  {
    slug: "kadinlar-gunu-2015",
    title: {"tr": "Dünya Kadınlar Günü 2015", "en": "International Women's Day 2015"},
    date: "2015-03-08", // gün hassasiyeti
    datePrecision: "day",
    category: "ozel-gun",
    location: {"tr": "Halifax", "en": "Halifax"},
    description: {"tr": "8 Mart'ta kadın üyelerimizle söyleşi, ikramlar ve çekiliş.", "en": "A talk, treats and a raffle with our women members on March 8."},
    cover: "/photos/kadinlar-gunu-2015/03.jpg",
    coverThumb: "/photos/kadinlar-gunu-2015/03-t.jpg",
    photos: [
      { src: "/photos/kadinlar-gunu-2015/01.jpg", thumb: "/photos/kadinlar-gunu-2015/01-t.jpg", w: 800, h: 600 },
      { src: "/photos/kadinlar-gunu-2015/02.jpg", thumb: "/photos/kadinlar-gunu-2015/02-t.jpg", w: 800, h: 600 },
      { src: "/photos/kadinlar-gunu-2015/03.jpg", thumb: "/photos/kadinlar-gunu-2015/03-t.jpg", w: 450, h: 600 },
      { src: "/photos/kadinlar-gunu-2015/04.jpg", thumb: "/photos/kadinlar-gunu-2015/04-t.jpg", w: 450, h: 600 },
      { src: "/photos/kadinlar-gunu-2015/05.jpg", thumb: "/photos/kadinlar-gunu-2015/05-t.jpg", w: 450, h: 600 },
      { src: "/photos/kadinlar-gunu-2015/06.jpg", thumb: "/photos/kadinlar-gunu-2015/06-t.jpg", w: 450, h: 600 },
      { src: "/photos/kadinlar-gunu-2015/07.jpg", thumb: "/photos/kadinlar-gunu-2015/07-t.jpg", w: 450, h: 600 },
      { src: "/photos/kadinlar-gunu-2015/08.jpg", thumb: "/photos/kadinlar-gunu-2015/08-t.jpg", w: 450, h: 600 },
    ],
  },
];

// ---- Yardımcılar -----------------------------------------------------------

const MONTHS = {
  tr: ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};

export function getAlbums() {
  // Yeniden eskiye
  return [...albums].sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAlbumBySlug(slug) {
  return albums.find((a) => a.slug === slug) || null;
}

export function getCategory(id) {
  return categories.find((c) => c.id === id) || null;
}

export function albumYear(album) {
  return album.date.slice(0, 4);
}

// "23 Nisan 2022" / "April 23, 2022" — ay hassasiyetinde "Ekim 2015" / "October 2015"
export function formatAlbumDate(album, lang) {
  const [y, m, d] = album.date.split("-").map(Number);
  const month = MONTHS[lang === "en" ? "en" : "tr"][m - 1];
  if (album.datePrecision === "month" || !d) return lang === "en" ? `${month} ${y}` : `${month} ${y}`;
  return lang === "en" ? `${month} ${d}, ${y}` : `${d} ${month} ${y}`;
}

export function monthName(m, lang) {
  return MONTHS[lang === "en" ? "en" : "tr"][m - 1];
}

// Tarihe göre görünüm: [{ year, months: [{ month, label, albums }] }] (yeni → eski)
export function groupAlbumsByYearMonth(list, lang) {
  const years = new Map();
  for (const a of list) {
    const [y, m] = a.date.split("-").map(Number);
    if (!years.has(y)) years.set(y, new Map());
    const months = years.get(y);
    if (!months.has(m)) months.set(m, []);
    months.get(m).push(a);
  }
  return [...years.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year: String(year),
      months: [...months.entries()].sort((a, b) => b[0] - a[0]).map(([month, albums]) => ({ month, label: monthName(month, lang), albums })),
    }));
}

export function photoCount() {
  return albums.reduce((n, a) => n + a.photos.length, 0);
}

// Etkinlik sayfası ↔ albüm bağı (eventSlug alanı olan albümler)
export function getAlbumForEvent(eventSlug) {
  return albums.find((a) => a.eventSlug === eventSlug) || null;
}

export { eventInstants };
