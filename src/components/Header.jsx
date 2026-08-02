import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { t } from "../i18n";
import { Button } from "./ui";
import LangToggle from "./LangToggle";
import ThemeToggle from "./ThemeToggle";

export default function Header({ lang, onChangeLang }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const navItems = [
    { to: "/", label: t(lang, "nav.home") },
    { to: "/about", label: t(lang, "nav.about") },
    { to: "/contact", label: t(lang, "nav.contact") },
  ];

  const linkBase =
    "relative rounded-md px-3 py-2 text-sm font-semibold transition";
  const linkActive =
    "text-brand after:absolute after:inset-x-3 after:-bottom-1 after:h-[3px] after:rounded-full after:bg-accent";
  const linkIdle =
    "text-slate-700 hover:text-accent-600 dark:text-slate-200 dark:hover:text-accent-300";

  return (
    <header className="sticky top-0 z-50 border-b-2 border-accent/70 bg-cream/90 backdrop-blur dark:border-accent/60 dark:bg-primary-900/90">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-1.5 px-4 sm:gap-3 sm:px-6 lg:px-8">
        {/* Marka. Telefonda iki satira sarilir, `sm`den itibaren tek satir.
            320px'de satirda marka yazisina 160px kaliyor — logo, kalp butonu ve
            hamburger geri kalanini aliyor — ve tek satirda 13px'ten buyugu
            sigmiyor. Iki satira izin verince punto 15px'e cikabiliyor ve
            dernek adi hala tam okunuyor. leading-none ile iki satir 30px, 64px
            yuksekligindeki basligi zorlamiyor. */}
        <Link to="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2.5" onClick={() => setOpen(false)}>
          <img
            src="/tsns.jpeg"
            alt="Nova Scotia Türk Derneği logo"
            className="h-9 w-9 flex-none rounded-lg border-2 border-gold bg-white p-1 object-contain sm:h-11 sm:w-11"
          />
          <span className="min-w-0 overflow-hidden text-ellipsis text-[15px] font-extrabold leading-[1.15] tracking-tight text-primary xs:text-base sm:whitespace-nowrap sm:text-lg sm:leading-none lg:text-xl dark:text-white">
            {t(lang, "brand.full")}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) => `${linkBase} ${isActive ? linkActive : linkIdle}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LangToggle lang={lang} onChange={onChangeLang} />
          </div>
          <ThemeToggle className="hidden sm:inline-flex" />
          <Button to="/gonullu" variant="outline" size="sm" className="hidden lg:inline-flex">
            {t(lang, "action.volunteer")}
          </Button>
          {/* Donate: full pill from `sm` up, heart-only circle on phones so the
              one-line brand name always has room. */}
          <Button to="/bagis" variant="primary" size="sm" className="hidden whitespace-nowrap sm:inline-flex">
            {t(lang, "action.donate")}
          </Button>
          <Link
            to="/bagis"
            aria-label={t(lang, "action.donate")}
            title={t(lang, "action.donate")}
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent text-white transition hover:bg-accent-600 sm:hidden"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
              <path d="M12 21s-7.5-4.7-9.6-9A5.4 5.4 0 0 1 12 6.1 5.4 5.4 0 0 1 21.6 12c-2.1 4.3-9.6 9-9.6 9z" />
            </svg>
          </Link>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü"
            aria-expanded={open}
            className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-full border border-slate-300 text-slate-700 sm:ml-1 md:hidden dark:border-slate-700 dark:text-slate-200"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden">
          <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-primary-900">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg border-l-4 px-3 py-3 text-base font-semibold ${
                    isActive
                      ? "border-accent bg-accent/10 text-brand-red"
                      : "border-transparent text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-primary-800"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="flex items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2">
                <LangToggle lang={lang} onChange={onChangeLang} />
                <ThemeToggle />
              </div>
              <div className="flex items-center gap-2">
                <Button to="/gonullu" variant="outline" size="sm" onClick={() => setOpen(false)}>
                  {t(lang, "action.volunteer")}
                </Button>
                <Button to="/bagis" variant="primary" size="sm" onClick={() => setOpen(false)}>
                  {t(lang, "action.donate")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
