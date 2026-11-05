// 2026–2027 sponsorları — ana sayfadaki "Sponsorlarımız" bölümü (src/pages/Home.jsx).
//
// Kademeler: gold (öne çıkan, "Hakkında" + link), silver (tek başına),
// bronze (hepsi bir arada, ızgara).
//
// Yeni sponsor eklemek için:
//   1. Logoyu public/sponsors/<slug>.<png|jpg|svg|webp> olarak koy. Şeffaf PNG ya da
//      SVG en iyisi; genişlik ≤ 800 px, dosya < 150 KB.
//   2. Aşağıya bir kayıt ekle. `logo` yoksa logonun yerine ad yazılır.
//   3. `logoBg`: logo beyaz zemine göre tasarlandıysa "white" (varsayılan);
//      koyu ya da renkli zemin üstündeyse o rengi yaz (ör. "#0b1f3a").

export const SPONSOR_SEASON = "2026–2027";

export const sponsors = [
  {
    slug: "john-atacan",
    tier: "gold",
    name: "John Atacan",
    org: "Royal LePage Atlantic",
    logo: null,
    url: "https://johnatacan.royallepage.ca/",
    about: {
      tr: "John Atacan, hizmet sektöründeki 12 yıllık deneyimini gayrimenkul danışmanlığına taşıyor. Halifax ve Dartmouth'ta ev alım, satım ve yatırım süreçlerinde; sabır, güven ve ihtiyaçlarınıza odaklanan bir yaklaşımla yanınızda. Her adımda kendinizi güvende hissedeceğiniz, rahat ve sorunsuz bir deneyim sunmayı hedefliyor.",
      en: "With 12 years of experience in hospitality, John Atacan offers client-focused support for buying, selling and investing in Halifax and Dartmouth. His approach combines patience, trust and a genuine understanding of your needs, helping you feel informed and confident throughout a smooth, stress-free real estate experience.",
    },
  },
  {
    slug: "bosphorus",
    tier: "silver",
    name: "Bosphorus Construction",
    logo: null,
  },
  // Bronze sponsorlar — logolar gelince eklenecek.
];

export const getSponsorsByTier = (tier) => sponsors.filter((s) => s.tier === tier);
