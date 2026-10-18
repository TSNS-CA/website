import { Link } from "react-router-dom";
import { t } from "../../i18n";
import { formatAlbumDate, getCategory } from "../../content/photos.js";

// Albüm kartı: kapak + sol üstte tarih etiketi + sağ üstte adet, altta başlık ve yer.
export default function AlbumCard({ album, lang, compact = false }) {
  const cat = getCategory(album.category);
  const href = `/fotograflar/${album.slug}`;
  // Kapak için 2–3 küçük resimle "yığın" hissi: ana kapak + arkada iki kart.
  return (
    <Link
      to={href}
      className="group relative block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      aria-label={album.title[lang]}
    >
      <div className="relative">
        <div className="absolute inset-x-3 -top-1.5 h-full rounded-3xl bg-white/70 ring-1 ring-black/5 transition group-hover:-top-2.5 dark:bg-primary-700/60 dark:ring-white/10" aria-hidden="true" />
        <div className="absolute inset-x-1.5 -top-0.5 h-full rounded-3xl bg-white/90 ring-1 ring-black/5 transition group-hover:-top-1.5 dark:bg-primary-700/80 dark:ring-white/10" aria-hidden="true" />
        <div className={`relative overflow-hidden rounded-3xl bg-primary-900 shadow-card ring-1 ring-black/5 transition duration-300 group-hover:shadow-2xl dark:ring-white/10 ${compact ? "aspect-[4/3]" : "aspect-[5/4]"}`}>
          <img
            src={album.cover}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/90 via-primary-900/20 to-transparent" aria-hidden="true" />
          <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold tracking-wide text-primary-900 shadow">
            {formatAlbumDate(album, lang)}
          </div>
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.5" /><path d="M21 16l-5-5-8 8" /></svg>
            {album.photos.length}
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            {cat && (
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                <span aria-hidden="true">{cat.icon}</span> {cat.label[lang]}
              </div>
            )}
            <h3 className={`font-display font-extrabold leading-snug tracking-tight ${compact ? "text-base" : "text-lg"}`}>{album.title[lang]}</h3>
            {!compact && <p className="mt-0.5 text-xs text-slate-200">📍 {album.location[lang]}</p>}
          </div>
        </div>
      </div>
      {!compact && (
        <div className="mt-3 flex items-center justify-between px-1 text-sm">
          <span className="line-clamp-1 text-slate-600 dark:text-slate-300">{album.description[lang]}</span>
          <span className="ml-3 flex-none font-semibold text-brand-red group-hover:underline">{t(lang, "photos.view")} →</span>
        </div>
      )}
    </Link>
  );
}
