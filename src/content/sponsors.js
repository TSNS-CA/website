// 2026–2027 sponsorları — ana sayfadaki "Sponsorlarımız" bölümü (src/pages/Home.jsx).
//
// Kademeler: gold (öne çıkan, "Hakkında" + link), silver (tek başına),
// bronze (hepsi bir arada, ızgara).
//
// Yeni sponsor eklemek için:
//   1. Logoyu public/sponsor-logos/<slug>.webp olarak koy: şeffaf kenarları kırpılmış,
//      uzun kenarı ≤ 800 px, dosya < 150 KB.
//   2. Aşağıya bir kayıt ekle. `logo` yoksa logonun yerine ad yazılır.
//   3. `logoBg`: logo beyaz zemine göre tasarlandıysa "white" (varsayılan);
//      koyu ya da renkli zemin üstündeyse o rengi yaz (ör. "#0b1f3a").

export const SPONSOR_SEASON = "2026–2027";

// /sponsorlar paylaşım önizlemesi (WhatsApp/Facebook), 1200×630. Sponsor
// listesi değişince görseli `python3 scripts/sponsor-og.py` ile yeniden üretin.
export const SPONSOR_OG_IMAGE = { src: "/sponsor-logos/og-2026-2027.jpg", width: 1200, height: 630 };

export const sponsors = [
  {
    slug: "john-atacan",
    tier: "gold",
    name: "John Atacan",
    org: "Royal LePage Atlantic",
    logo: "/sponsor-logos/john-atacan.webp",
    url: "https://johnatacan.royallepage.ca/",
    about: {
      tr: "John Atacan, hizmet sektöründeki 12 yıllık deneyimini gayrimenkul danışmanlığına taşıyor. Halifax ve Dartmouth'ta ev alım, satım ve yatırım süreçlerinde; sabır, güven ve ihtiyaçlarınıza odaklanan bir yaklaşımla yanınızda. Her adımda kendinizi güvende hissedeceğiniz, rahat ve sorunsuz bir deneyim sunmayı hedefliyor.",
      en: "With 12 years of experience in hospitality, John Atacan offers client-focused support for buying, selling and investing in Halifax and Dartmouth. His approach combines patience, trust and a genuine understanding of your needs, helping you feel informed and confident throughout a smooth, stress-free real estate experience.",
    },
  },
  {
    slug: "bosphorus",
    tier: "silver",
    name: "Bosphorus Home Construction",
    logo: "/sponsor-logos/bosphorus.webp",
  },
  // Bronze — alfabetik. Bir bronze daha gelecek (Şeyma netleştirecek).
  { slug: "abaci-cleaning", tier: "bronze", name: "Abacı Cleaning Services", logo: "/sponsor-logos/abaci-cleaning.webp", logoBg: "#fdfcf7" },
  { slug: "craig-spicer", tier: "bronze", name: "Craig Spicer Mortgages", logo: "/sponsor-logos/craig-spicer.webp", url: "https://www.craigspicermortgages.ca/" },
  { slug: "emin-gulenc", tier: "bronze", name: "Emin Gulenc", org: "Scotiabank", logo: "/sponsor-logos/emin-gulenc.webp" },
  { slug: "er-construction", tier: "bronze", name: "ER Construction & Property Development", logo: "/sponsor-logos/er-construction.webp" },
  { slug: "nikki-jafari", tier: "bronze", name: "Nikki Jafari", org: "Scotiabank", logo: "/sponsor-logos/nikki-jafari.webp" },
  { slug: "tonys", tier: "bronze", name: "Tony's Donair", logo: "/sponsor-logos/tonys.webp", url: "https://www.tonysdonair.com/" },
];

export const getSponsorsByTier = (tier) => sponsors.filter((s) => s.tier === tier);
