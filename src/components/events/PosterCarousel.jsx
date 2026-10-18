import { useEffect, useRef, useState } from "react";

// Çok sayfalı afiş görüntüleyici.
// - Geçiş CSS transform ile (translateX + transition); native scroll-snap
//   kullanılmıyor çünkü programatik smooth scroll bazı motorlarda snap ile
//   çakışıp geri sekiyor.
// - Parmakla/fareyle sürükleyerek sayfa değiştirme (pointer olayları).
// - Otomatik kayma: her sayfa `img.dwellMs` kadar (yoksa autoplayMs) ekranda
//   kalır; üzerine gelince, odaklanınca, sürüklerken ve sekme arka plandayken
//   durur; elle geçişten sonra iki tur bekler.
//   prefers-reduced-motion açıksa otomatik kayma yok.
// - "1 / 2" sayacı, nokta göstergesi, ok butonları, klavye okları.
export default function PosterCarousel({ images, alt = "", lang = "tr", className = "", autoplayMs = 4500 }) {
  const list = (images || []).filter(Boolean);
  const count = list.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragX, setDragX] = useState(0);
  const indexRef = useRef(0);
  const resumeAt = useRef(0);
  const drag = useRef(null); // { startX, pointerId, width }
  const rootRef = useRef(null);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  function goTo(i, manual = true) {
    if (!count) return;
    const next = ((i % count) + count) % count;
    if (manual) resumeAt.current = Date.now() + autoplayMs * 2;
    indexRef.current = next;
    setIndex(next);
  }

  // Otomatik kayma: sayfa başına bekleme (dwellMs), 250 ms'lik tik ile kontrol.
  useEffect(() => {
    if (count < 2 || !autoplayMs) return;
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let shownAt = Date.now();
    let lastIndex = indexRef.current;
    const id = setInterval(() => {
      if (indexRef.current !== lastIndex) {
        lastIndex = indexRef.current;
        shownAt = Date.now();
      }
      if (paused || document.hidden || drag.current || Date.now() < resumeAt.current) {
        shownAt = Date.now(); // duraklama bitince bekleme süresi baştan başlar
        return;
      }
      const dwell = list[lastIndex]?.dwellMs || autoplayMs;
      if (Date.now() - shownAt >= dwell) goTo(indexRef.current + 1, false);
    }, 250);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, autoplayMs, paused]);

  // Sürükleme
  function onPointerDown(e) {
    if (count < 2) return;
    const width = rootRef.current?.clientWidth || 1;
    drag.current = { startX: e.clientX, pointerId: e.pointerId, width };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    setDragX(e.clientX - drag.current.startX);
  }
  function onPointerUp(e) {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.startX;
    const threshold = Math.min(80, drag.current.width * 0.15);
    drag.current = null;
    setDragX(0);
    if (dx <= -threshold) goTo(indexRef.current + 1);
    else if (dx >= threshold) goTo(indexRef.current - 1);
    else resumeAt.current = Date.now() + autoplayMs; // dokunup bıraktı: bir tur bekle
  }

  if (!count) return null;
  if (count === 1) {
    return <img src={list[0].src} alt={list[0].alt?.[lang] || alt} className={`w-full ${className}`} />;
  }

  const pageLabel = lang === "tr" ? "Sayfa" : "Page";
  const prevLabel = lang === "tr" ? "Önceki sayfa" : "Previous page";
  const nextLabel = lang === "tr" ? "Sonraki sayfa" : "Next page";
  const width = rootRef.current?.clientWidth || 0;
  const dragPct = width ? (dragX / width) * 100 : 0;

  return (
    <div
      ref={rootRef}
      className="group/carousel relative select-none"
      role="region"
      aria-roledescription="carousel"
      aria-label={alt}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        if (e.key === "ArrowLeft") goTo(index - 1);
      }}
      tabIndex={0}
    >
      <div
        className={`touch-pan-y overflow-hidden rounded-3xl ${className}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ cursor: drag.current ? "grabbing" : "grab" }}
      >
        <div
          className={`flex ${drag.current ? "" : "transition-transform duration-700 ease-[cubic-bezier(.22,.61,.36,1)]"}`}
          style={{ transform: `translateX(calc(${-index * 100}% + ${dragPct}%))` }}
          aria-live="polite"
        >
          {list.map((img, i) => (
            <div key={img.src} className="w-full flex-none" aria-hidden={i !== index} role="group" aria-label={`${pageLabel} ${i + 1} / ${count}`}>
              <img
                src={img.src}
                alt={img.alt?.[lang] || `${alt} — ${pageLabel} ${i + 1}`}
                className="block w-full"
                loading={i === 0 ? "eager" : "lazy"}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Kontrol çubuğu — görselin ALTINDA; afişteki yazıları kapatmaz. */}
      <div className="mt-3 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          aria-label={prevLabel}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/20 focus-visible:outline-none"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2.5 rounded-full bg-white/10 px-3.5 py-1.5 text-white ring-1 ring-inset ring-white/20">
          <span className="text-xs font-bold tabular-nums">
            {index + 1} / {count}
          </span>
          <span className="h-3 w-px bg-white/30" aria-hidden="true" />
          <div className="flex items-center gap-1.5" role="tablist" aria-label={pageLabel}>
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${pageLabel} ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all ${i === index ? "w-5 bg-gold" : "w-2 bg-white/50 hover:bg-white/80"}`}
              />
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          aria-label={nextLabel}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-inset ring-white/25 transition hover:bg-white/20 focus-visible:outline-none"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-4 w-4" aria-hidden="true">
            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
