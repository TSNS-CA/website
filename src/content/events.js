// Etkinlik verisi — v1 statik modül. React/JSX/tarayıcı API'si İÇERMEZ; Faz 2'de
// Worker (functions/) da fiyat doğrulaması için aynı dosyayı import edebilsin.
//
// Bileşenler yalnızca alttaki adaptörleri (getEvents, getEventBySlug,
// splitEvents, getFeatured, tierIsAvailable) çağırır. Supabase'e geçince sadece
// bu fonksiyonların gövdesi değişir.
//
// Alan rehberi:
//   start/end   duvar saati, "YYYY-MM-DDTHH:mm", her zaman America/Halifax
//   status      "scheduled" | "cancelled" | "postponed" — yaklaşan/geçmiş TÜRETİLİR
//   registration.mode
//               "none"     bilgi amaçlı, CTA yok
//               "external" dış bilet sayfası (Zeffy vb.), `url` zorunlu
//               "rsvp"     ücretsiz kayıt formu (Faz 2)
//               "paid"     site içi Square ödeme (Faz 2) — v1'de "Yakında" gösterir
//   tiers[].availableUntil  Halifax takvim günü dahil ("2026-10-30" → 30 Ekim gece yarısına kadar)
import { halifaxDateKey, isPast, eventInstants } from "../lib/dates.js";

export const EVENTS_TZ = "America/Halifax";

export const organizer = {
  name: "Turkish Society of Nova Scotia",
  email: "events@tsns.ca",
  url: "https://tsns.ca",
};

const PIER21 = {
  name: "Canadian Museum of Immigration at Pier 21",
  street: "1055 Marginal Rd",
  city: "Halifax",
  region: "NS",
  postalCode: "B3H 4P7",
  mapUrl: "https://www.google.com/maps/search/?api=1&query=Canadian+Museum+of+Immigration+at+Pier+21+1055+Marginal+Rd+Halifax+NS",
};

export const events = [
  {
    id: "cumhuriyet-bayrami-2026",
    slug: "cumhuriyet-bayrami-2026",
    featured: true,
    title: {
      tr: "29 Ekim Cumhuriyet Bayramı Kutlaması",
      en: "October 29 Republic Day Celebration",
    },
    summary: {
      tr: "Cumhuriyetimizin 103. yılını Halifax'ta birlikte kutluyoruz: akşam yemeği, gece programı ve Türk-Kanada dostluğu.",
      en: "Celebrating the 103rd anniversary of the Republic of Türkiye in Halifax with dinner, an evening program, and Turkish–Canadian friendship.",
    },
    description: {
      tr: [
        "29 Ekim Cumhuriyet Bayramı, Mustafa Kemal Atatürk'ün önderliğinde 1923 yılında kurulan Türkiye Cumhuriyeti'nin yıl dönümüdür. Cumhuriyetimizin 103. yılını kutlamak, kültürümüzü paylaşmak ve toplum olarak bir araya gelmek için sizleri 6 Kasım'da Cumhuriyet Balomuza davet ediyoruz.",
        "Bilete giriş, akşam yemeği ve gece programı dahildir. Gönüllü olarak destek vermek isteyen öğrenciler, bilet satın almadan önce info@tsns.ca üzerinden bizimle iletişime geçebilir.",
      ],
      en: [
        "Republic Day, celebrated on October 29, commemorates the founding of the Republic of Türkiye in 1923 under the leadership of Mustafa Kemal Atatürk. Join us at our Republic Day Gala on November 6 as we celebrate its 103rd anniversary, share Turkish culture, and come together as a community.",
        "Tickets include admission, dinner and the evening program. Students interested in volunteering are invited to contact us at info@tsns.ca before purchasing a ticket.",
      ],
    },
    start: "2026-11-06T19:00",
    end: "2026-11-06T23:00",
    timezone: EVENTS_TZ,
    venue: {
      name: "Steel Wheels Motor Museum",
      street: "66 Otter Lake Ct",
      city: "Halifax",
      region: "NS",
      postalCode: "B3S 1L9",
      mapUrl: "https://www.google.com/maps?q=44.6481704,-63.66929810000001",
    },
    status: "scheduled",
    registration: {
      mode: "external",
      url: "https://www.zeffy.com/en-CA/ticketing/annual-republic-day-gala",
      provider: "Zeffy",
    },
    tiers: [
      {
        id: "early-bird",
        label: { tr: "Erken Dönem Bileti", en: "Early Bird Ticket" },
        priceCad: 70,
        audience: "adult",
        availableUntil: "2026-10-30",
        note: {
          tr: "30 Ekim 2026'ya kadar yetişkin bileti. Giriş, akşam yemeği ve gece programı dahil.",
          en: "Adult ticket until October 30, 2026. Includes admission, dinner and the evening program.",
        },
      },
      {
        id: "adult",
        label: { tr: "Yetişkin Bileti", en: "Adult Ticket" },
        priceCad: 75,
        audience: "adult",
        note: {
          tr: "Giriş, akşam yemeği ve gece programı dahil.",
          en: "Includes admission, dinner and the evening program.",
        },
      },
      {
        id: "student",
        label: { tr: "Öğrenci Bileti", en: "Student Ticket" },
        priceCad: 40,
        audience: "student",
        note: {
          tr: "Öğrencilere özel; giriş, akşam yemeği ve gece programı dahil.",
          en: "Student admission includes dinner and the evening program.",
        },
      },
    ],
    poster: {
      src: "/events/cumhuriyet-2026.jpg",
      alt: {
        tr: "29 Ekim Cumhuriyet Bayramı Kutlaması afişi — 6 Kasım 2026, Steel Wheels Motor Museum",
        en: "Republic Day Celebration poster — November 6, 2026, Steel Wheels Motor Museum",
      },
    },
    program: [
      { time: "19:00 – 19:30", title: { tr: "Karşılama ve Giriş", en: "Welcome & Reception" } },
      { time: "19:30 – 19:45", title: { tr: "Resmî Açılış", en: "Official Opening" } },
      { time: "19:45 – 20:05", title: { tr: "Konuşmalar", en: "Speeches" } },
      { time: "20:05 – 20:15", title: { tr: "Çocukların Sahneye Çıkışı", en: "Children's Performance" } },
      { time: "20:15 – 21:30", title: { tr: "Cumhuriyet Yemeği", en: "Republic Dinner" } },
      { time: "21:30 – 22:15", title: { tr: "Şimal – DJ Performansı", en: "Şimal – DJ Set" } },
      {
        time: "22:15 →",
        title: { tr: "Driven Music – DJ Performansı", en: "Driven Music – DJ Set" },
        note: { tr: "Anadolu tarzı müzik eşliğinde serbest eğlence.", en: "Open dance floor with Anatolian-style music." },
      },
    ],
    menu: {
      tr: ["Çorba", "Dolma", "Közlenmiş Kırmızı Biber", "Patlıcan Salatası", "Ispanaklı Börek (Vegan)", "Tavuk Şiş", "Tavuk Köfte", "Kuzu Köfte", "Baklava"],
      en: ["Soup", "Dolma", "Roasted Red Peppers", "Eggplant Salad", "Spinach Börek (Vegan)", "Chicken Shish", "Chicken Köfte", "Lamb Köfte", "Baklava"],
    },
    // Katkıda bulunanlar: logo varsa `logo`, yoksa `wordmark` metin olarak çizilir.
    partners: [
      {
        id: "turkuaz",
        name: "Turkuaz Restaurant",
        href: "https://turkuazrestaurant.ca/",
        logo: { src: "/events/partners/turkuaz.jpg", alt: "Turkuaz Restaurant" },
        icon: "🍽️",
        role: { tr: "Akşam yemeği", en: "Dinner" },
        blurb: {
          tr: "Cumhuriyet Yemeği'nin tüm lezzetleri Halifax'ın Türk restoranı Turkuaz'ın mutfağından.",
          en: "Every dish of the Republic Dinner comes from the kitchen of Turkuaz, Halifax's Turkish restaurant.",
        },
      },
      {
        id: "bertossi",
        name: "The Bertossi Group",
        href: "https://bertossigroup.com/",
        wordmark: "The Bertossi Group",
        mark: { src: "/events/partners/bertossi-mark.png", alt: "" },
        icon: "🍷",
        role: { tr: "Şarap ikramı", en: "Wine" },
        blurb: {
          tr: "Gece boyunca ücretsiz şarap ikramı The Bertossi Group'un katkılarıyla.",
          en: "Complimentary wine throughout the evening, courtesy of The Bertossi Group.",
        },
      },
    ],
    menuNote: {
      tr: "Menü Turkuaz Restaurant tarafından hazırlanmaktadır.",
      en: "Menu prepared by Turkuaz Restaurant.",
    },
    gallery: [
      {
        src: "/events/cumhuriyet-2026-program.jpg",
        alt: { tr: "Gecenin programı ve akşam menüsü afişi", en: "Evening program and dinner menu poster" },
        dwellMs: 7000, // program/menü sayfası okunabilsin diye daha uzun kalır (ilk sayfa 4,5 sn)
      },
    ],
    tags: ["republic-day", "gala"],
  },

  {
    id: "bayrak-cekme-2026",
    slug: "bayrak-cekme-2026",
    title: { tr: "29 Ekim Bayrak Çekme Töreni", en: "Republic Day Flag-Raising Ceremony" },
    summary: {
      tr: "Cumhuriyetimizin 103. yılında şanlı bayrağımızı Halifax Belediye Binası önünde birlikte göndere çekiyoruz. Herkese açık, ücretsiz.",
      en: "On the 103rd anniversary of the Republic, we raise our flag together at Halifax City Hall. Free and open to everyone.",
    },
    description: {
      tr: [
        "29 Ekim Cumhuriyet Bayramı'nda, Cumhuriyetimizin 103. yılını kutlamak üzere Halifax City Hall önünde bayrak çekme töreni düzenliyoruz. Şanlı bayrağımızı birlikte göndere çekmek üzere tüm vatandaşlarımızı ve dostlarımızı törenimize davet ediyoruz.",
        "Tören öğle saatinde kısa sürecek; aileler ve çocuklar için uygundur. Kayıt gerekmez.",
      ],
      en: [
        "On October 29, Turkish Republic Day, we hold a flag-raising ceremony at Halifax City Hall to mark the 103rd anniversary of the Republic of Türkiye. Everyone is cordially invited to join us as we raise our flag together.",
        "The ceremony is short and family-friendly. No registration needed.",
      ],
    },
    start: "2026-10-29T13:00",
    end: "2026-10-29T13:45",
    showEndTime: false,
    timezone: EVENTS_TZ,
    venue: {
      name: "Halifax City Hall",
      street: "1841 Argyle St",
      city: "Halifax",
      region: "NS",
      postalCode: "B3J 3A5",
      mapUrl: "https://www.google.com/maps/search/?api=1&query=Halifax+City+Hall+1841+Argyle+St+Halifax+NS",
    },
    status: "scheduled",
    registration: { mode: "none", free: true },
    tiers: [],
    poster: {
      src: "/events/bayrak-cekme-2026.jpg",
      alt: {
        tr: "29 Ekim Bayrak Çekme Töreni afişi — 29 Ekim 2026 Perşembe 13:00, Halifax City Hall",
        en: "Flag-Raising Ceremony poster — Thursday October 29, 2026, 1:00 PM, Halifax City Hall",
      },
    },
    tags: ["republic-day", "ceremony", "free"],
  },

  // ---- Geçmiş etkinlikler (arşiv; eski Google Sites duyurularından aktarıldı) ----
  {
    id: "genel-kurul-2026",
    slug: "genel-kurul-2026",
    title: { tr: "2026 Yıllık Genel Kurul", en: "2026 Annual General Meeting" },
    summary: {
      tr: "Üyelerimizle bir yılın değerlendirmesi, yönetim kurulu seçimi ve gelecek planları.",
      en: "Reviewing the year with our members, electing the board, and sharing plans ahead.",
    },
    description: {
      tr: [
        "Nova Scotia Türk Derneği'nin yıllık genel kurulu üyelerimizin katılımıyla çevrim içi yapıldı. Toplantıda geçen yılın faaliyetleri değerlendirildi ve yeni dönem planları paylaşıldı.",
      ],
      en: [
        "The Turkish Society of Nova Scotia held its annual general meeting online with its members. The meeting reviewed last year's activities and shared plans for the new term.",
      ],
    },
    start: "2026-06-21T11:30",
    end: "2026-06-21T13:00",
    timezone: EVENTS_TZ,
    venue: { name: "Çevrim içi / Online", city: "Halifax", region: "NS" },
    status: "scheduled",
    registration: { mode: "none" },
    tiers: [],
    tags: ["agm"],
  },
  {
    id: "cumhuriyet-102-yil-2025",
    slug: "cumhuriyet-102-yil-2025",
    title: {
      tr: "Cumhuriyet'in 102. Yılı: Türk-Kanada Dostluk Resepsiyonu",
      en: "102 Years of the Turkish Republic: Turkish-Canadian Friendship Reception",
    },
    summary: {
      tr: "Pier 21'de dördüncü yıllık resepsiyonumuzla Cumhuriyet'in 102. yılını ve Türk-Kanada dostluğunu kutladık.",
      en: "Our fourth annual reception at Pier 21 celebrated 102 years of the Republic and Turkish-Canadian friendship.",
    },
    description: {
      tr: [
        "Kanada Göçmenlik Müzesi Pier 21'de düzenlenen resepsiyonda topluluğumuz, dostlarımız ve konuklarımızla Cumhuriyet'in 102. yılını kutladık. Kokteyl kıyafeti ve 1920'ler teması gecenin ruhunu yansıttı.",
      ],
      en: [
        "At the Canadian Museum of Immigration at Pier 21, our community, friends and guests celebrated 102 years of the Republic. Cocktail attire with a 1920s theme set the tone for the evening.",
      ],
    },
    start: "2025-11-01T18:00",
    end: "2025-11-01T23:00",
    timezone: EVENTS_TZ,
    venue: PIER21,
    status: "scheduled",
    registration: { mode: "none" },
    tiers: [],
    dressCode: { tr: "Kokteyl / 1920'ler teması", en: "Cocktail / 1920s attire" },
    tags: ["republic-day", "reception"],
  },
  {
    id: "genel-kurul-2025",
    slug: "genel-kurul-2025",
    title: { tr: "2025 Yıllık Genel Kurul", en: "2025 Annual General Meeting" },
    summary: {
      tr: "Yıllık genel kurul ve konuk konuşmacı Cenk Haznacı (RCIC) ile Atlantik Göçmenlik Programı sohbeti.",
      en: "Annual general meeting with guest speaker Cenk Haznacı (RCIC) on the Atlantic Immigration Program.",
    },
    description: {
      tr: [
        "2025 genel kurulumuzda bir yılın değerlendirmesinin yanı sıra konuk konuşmacımız Cenk Haznacı (RCIC) Atlantik Göçmenlik Programı hakkında üyelerimizin sorularını yanıtladı.",
      ],
      en: [
        "Alongside the yearly review, our guest speaker Cenk Haznacı (RCIC) answered members' questions about the Atlantic Immigration Program.",
      ],
    },
    start: "2025-06-29T15:00",
    end: "2025-06-29T16:30",
    timezone: EVENTS_TZ,
    venue: { name: "Çevrim içi / Online", city: "Halifax", region: "NS" },
    status: "scheduled",
    registration: { mode: "none" },
    tiers: [],
    tags: ["agm"],
  },
];

// ---- Adaptörler ----------------------------------------------------------

export function getEvents() {
  return events;
}

export function getEventBySlug(slug) {
  return events.find((e) => e.slug === slug) || null;
}

// { upcoming: başlangıca göre artan, past: başlangıca göre azalan }
export function splitEvents(now = new Date()) {
  const upcoming = [];
  const past = [];
  for (const e of events) (isPast(e, now) ? past : upcoming).push(e);
  const startMs = (e) => eventInstants(e).start.getTime();
  upcoming.sort((a, b) => startMs(a) - startMs(b));
  past.sort((a, b) => startMs(b) - startMs(a));
  return { upcoming, past };
}

export function getFeatured(now = new Date()) {
  const { upcoming } = splitEvents(now);
  return upcoming.find((e) => e.featured && e.status !== "cancelled") || upcoming[0] || null;
}

export function tierIsAvailable(tier, now = new Date()) {
  if (!tier.availableUntil) return true;
  return halifaxDateKey(now) <= tier.availableUntil;
}

// Yıla göre gruplama (geçmiş listesi için): [{ year: "2025", items: [...] }]
export function groupByYear(list, tz = EVENTS_TZ) {
  const map = new Map();
  for (const e of list) {
    const y = eventInstants(e).start.toLocaleDateString("en-CA", { timeZone: tz, year: "numeric" });
    if (!map.has(y)) map.set(y, []);
    map.get(y).push(e);
  }
  return [...map.entries()].map(([year, items]) => ({ year, items }));
}
