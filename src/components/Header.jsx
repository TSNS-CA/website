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
    "rounded-md px-3 py-2 text-sm font-semibold transition";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <img
            src="/tsns.jpeg"
            alt="Türkiye Derneği — Nova Scotia logo"
            className="h-10 w-10 rounded-lg border-2 border-gold object-cover"
          />
          <span className="flex flex-col leading-tight">
            <span className="text-sm font-extrabold text-primary dark:text-white">
              {t(lang, "brand.name")}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Nova Scotia
            </span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `${linkBase} ${
                  isActive
                    ? "text-accent"
                    : "text-slate-700 hover:text-primary dark:text-slate-200 dark:hover:text-white"
                }`
              }
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
          <ThemeToggle />
          <Button to="/gonullu" variant="outline" size="sm" className="hidden lg:inline-flex">
            {t(lang, "action.volunteer")}
          </Button>
          <Button to="/bagis" variant="primary" size="sm">
            {t(lang, "action.donate")}
          </Button>

          {/* Hamburger */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label="Menü"
            aria-expanded={open}
            className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 text-slate-700 md:hidden dark:border-slate-700 dark:text-slate-200"
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
          <div className="space-y-1 border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block rounded-lg px-3 py-3 text-base font-semibold ${
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="flex items-center justify-between gap-3 pt-3">
              <LangToggle lang={lang} onChange={onChangeLang} />
              <Button to="/gonullu" variant="outline" size="sm" onClick={() => setOpen(false)}>
                {t(lang, "action.volunteer")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
