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
  LinkedIn: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 10v7M7 7.5v.01M11 17v-4a2 2 0 0 1 4 0v4M11 17v-7" stroke="white" fill="none" strokeWidth="1.6" />
    </>
  ),
  Linktree: (
    <>
      <path d="M12 3l2.5 2.5h-1.5v3l4-4 2.5 2.5h-3v3h-3v3h-3v-3h-3v-3h-3l2.5-2.5 4 4v-3H9.5L12 3z" />
      <path d="M9 19h6v2H9z" />
    </>
  ),
};

export default function SocialLinks({ socials, className = "" }) {
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15 transition hover:bg-white/20 hover:text-white"
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
