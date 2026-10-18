import { useCallback, useEffect, useRef, useState } from "react";

// Bağımlılıksız lightbox: tam ekran görsel, ok/klavye/swipe ile gezinme,
// "3 / 43" sayacı, Escape ile kapanma, arka plana tıklayınca kapanma.
// Açıkken body kaydırması kilitlenir; kapanınca odak tetikleyen öğeye döner.
export default function Lightbox({ photos, index, onClose, onIndex, lang = "tr", title = "" }) {
  const count = photos.length;
  const drag = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const closeBtn = useRef(null);
  const labels = lang === "en"
    ? { close: "Close", prev: "Previous photo", next: "Next photo", of: "of" }
    : { close: "Kapat", prev: "Önceki fotoğraf", next: "Sonraki fotoğraf", of: "/" };

  const go = useCallback((d) => { onIndex((index + d + count) % count); setLoaded(false); }, [index, count, onIndex]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    closeBtn.current?.focus();
    return () => { document.body.style.overflow = prevOverflow; window.removeEventListener("keydown", onKey); };
  }, [go, onClose]);

  // Komşu görselleri önceden yükle
  useEffect(() => {
    [index + 1, index - 1].forEach((i) => { const p = photos[(i + count) % count]; if (p) { const im = new Image(); im.src = p.src; } });
  }, [index, photos, count]);

  const photo = photos[index];
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 text-white backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
    >
      {/* Üst çubuk */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0 truncate font-semibold">{title}</div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-white/80">{index + 1} {labels.of} {count}</span>
          <a href={photo.src} target="_blank" rel="noopener noreferrer" className="hidden rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20 sm:inline-block" onClick={(e) => e.stopPropagation()}>
            {lang === "en" ? "Open original" : "Orijinali aç"} ↗
          </a>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label={labels.close} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-none">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>

      {/* Görsel */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4 sm:px-16"
        onPointerDown={(e) => { drag.current = { x: e.clientX, t: Date.now() }; }}
        onPointerUp={(e) => { const d = drag.current; drag.current = null; if (!d) return; const dx = e.clientX - d.x; if (Math.abs(dx) > 60) { e.stopPropagation(); go(dx < 0 ? 1 : -1); } }}
      >
        {!loaded && <div className="absolute h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-white" aria-hidden="true" />}
        <img
          key={photo.src}
          src={photo.src}
          alt={photo.alt?.[lang] || `${title} — ${index + 1}`}
          onLoad={() => setLoaded(true)}
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          className={`max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
        {count > 1 && (
          <>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label={labels.prev} className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/25 focus-visible:outline-none sm:left-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5" aria-hidden="true"><path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label={labels.next} className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 hover:bg-white/25 focus-visible:outline-none sm:right-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5" aria-hidden="true"><path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
      </div>

      {/* Alt şerit: küçük resimler */}
      {count > 1 && (
        <div className="flex gap-1.5 overflow-x-auto px-4 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onClick={(e) => e.stopPropagation()}>
          {photos.map((p, i) => (
            <button key={p.src} type="button" onClick={() => { onIndex(i); setLoaded(false); }} aria-label={`${i + 1}`} aria-current={i === index}
              className={`h-12 w-12 flex-none overflow-hidden rounded-md ring-2 transition ${i === index ? "ring-gold" : "ring-transparent opacity-60 hover:opacity-100"}`}>
              <img src={p.thumb || p.src} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
