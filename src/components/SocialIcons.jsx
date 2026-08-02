// Minimal brand mark SVGs (single-color, inherit currentColor).
const PATHS = {
  Instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  Facebook: <path d="M14 9h3l.5-3H14V4.5c0-.9.3-1.5 1.6-1.5H17V.3C16.6.2 15.5 0 14.3 0 11.8 0 10 1.5 10 4.3V6H7v3h3v9h4V9z" transform="translate(0 3)" />,
  YouTube: (
    <>
      <rect x="2" y="6" width="20" height="12" rx="3" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  // Cerceve + icine beyaz cizgiyle "in" yazmayi deniyordu; acik zeminde beyaz
  // beyaz uzerine dusunce ikon bos bir kareye donusuyordu. Dolgulu standart
  // glif hem her zeminde calisiyor hem kucuk boyutta daha okunakli.
  LinkedIn: (
    <path
      d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9h4v12H3V9zm6 0h3.8v1.65h.05c.53-.95 1.83-1.95 3.76-1.95C20.4 8.7 21 11.06 21 14.13V21h-4v-6.1c0-1.45-.03-3.32-2.02-3.32-2.02 0-2.33 1.58-2.33 3.21V21H9V9z"
      fill="currentColor"
      stroke="none"
    />
  ),
  // Elle cizilen hali kucuk boyutta "yen" isaretine benziyordu. Bu, markanin
  // resmi isareti (simple-icons, CC0-1.0). 0-24 kutusunu tamamen doldurdugu
  // icin digerleriyle ayni optik boyutta dursun diye biraz iceri aliniyor.
  Linktree: (
    <g transform="translate(12 12) scale(0.86) translate(-12 -12)">
      <path
        d="m13.73635 5.85251 4.00467-4.11665 2.3248 2.3808-4.20064 4.00466h5.9085v3.30473h-5.9365l4.22865 4.10766-2.3248 2.3338L12.0005 12.099l-5.74052 5.76852-2.3248-2.3248 4.22864-4.10766h-5.9375V8.12132h5.9085L3.93417 4.11666l2.3248-2.3808 4.00468 4.11665V0h3.4727zm-3.4727 10.30614h3.4727V24h-3.4727z"
        fill="currentColor"
        stroke="none"
      />
    </g>
  ),
};

// Footer koyu, İletişim sayfası açık zeminde. Tek bir renk seti ikisine birden
// yetmiyor: footer'ın beyaz şeffaflıkları kremin üstünde kayboluyor.
const VARIANTS = {
  onDark:
    "bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15 hover:bg-white/20 hover:text-white",
  onLight:
    "border border-slate-200 bg-white text-brand hover:border-accent hover:text-accent-600 dark:border-slate-800 dark:bg-primary-800 dark:text-white dark:hover:text-accent-300",
};

export default function SocialLinks({ socials, variant = "onDark", className = "" }) {
  return (
    <ul className={`flex flex-wrap items-center gap-2 ${className}`}>
      {socials.map((s) => (
        <li key={s.name}>
          <a
            href={s.href}
            target="_blank"
            rel="noreferrer"
            aria-label={s.name}
            title={s.name}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full transition ${VARIANTS[variant] || VARIANTS.onDark}`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              {PATHS[s.name] || PATHS.Linktree}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
