import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

// React Router, sayfa geçişinde scroll konumunu korur — "Hakkında" gibi kısa bir
// sayfaya geçince eski konumda kalırsın ve yazının ortasında başlarsın.
//
// Üç şey birlikte lazım:
//  1) Tarayıcının kendi scroll-restoration'ını kapat (o, bizim scrollTo'dan
//     sonra scroll'u eski yerine geri koyarak yarış kazanıyor).
//  2) Her gezinmede en üste al — pathname'e değil, location.key'e bak. Zaten
//     açık olan sekmeye tekrar basmak pathname'i değiştirmez (Router bunu
//     "replace" sayar) ama key her seferinde yenilenir. Böylece "Hakkında"
//     sayfasındayken tekrar "Hakkında"ya basmak da en üste götürür.
//  3) behavior:"instant" ile git. index.css'te `scroll-behavior: smooth` var;
//     onsuz geçiş animasyonlu olur, yeni sayfa kısaysa animasyon yarıda kesilip
//     sayfayı ortasında bırakır.
//
// useLayoutEffect: boyama öncesi çalışır, yani yeni sayfa hiçbir zaman bir kare
// için bile ortasından görünmez.
export default function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    // Bir gün /about#kurullar gibi bir bağlantı eklenirse hedefe gitsin.
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView();
        return;
      }
    }
    try {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    } catch (e) {
      // Eski tarayıcılar "instant"ı bilmez.
      window.scrollTo(0, 0);
    }
  }, [pathname, hash, key]);

  return null;
}
