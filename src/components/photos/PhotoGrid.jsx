import { useState } from "react";
import Lightbox from "./Lightbox";

// Masonry ızgara (CSS columns) + tıklayınca Lightbox. w/h oranı bilindiği için
// görsel yüklenmeden önce yer ayrılır, sayfa zıplamaz.
export default function PhotoGrid({ photos, lang = "tr", title = "" }) {
  const [open, setOpen] = useState(null);
  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4 [column-fill:balance]">
        {photos.map((p, i) => (
          <button
            key={p.src}
            type="button"
            onClick={() => setOpen(i)}
            className="group relative mb-3 block w-full break-inside-avoid overflow-hidden rounded-xl bg-slate-200 shadow-sm ring-1 ring-black/5 transition hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent dark:bg-primary-800 dark:ring-white/10"
            style={{ aspectRatio: `${p.w} / ${p.h}` }}
            aria-label={`${title} — ${i + 1}`}
          >
            <img
              src={p.thumb || p.src}
              alt={p.alt?.[lang] || ""}
              loading="lazy"
              decoding="async"
              width={p.w}
              height={p.h}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
            />
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100" aria-hidden="true">
              {i + 1}
            </span>
          </button>
        ))}
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} lang={lang} title={title} />}
    </>
  );
}
