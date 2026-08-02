import { Link } from "react-router-dom";
import { upper } from "../i18n";

export function Container({ className = "", children }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function Section({ id, className = "", children }) {
  return (
    <section id={id} className={className}>
      <Container>{children}</Container>
    </section>
  );
}

// `lang` şart: büyütme dile göre yapılıyor (bkz. i18n/upper).
export function Eyebrow({ lang = "tr", children, className = "" }) {
  return (
    <span
      className={`inline-block text-xs font-bold tracking-[0.18em] text-brand-red ${className}`}
    >
      {typeof children === "string" ? upper(lang, children) : children}
    </span>
  );
}

export function SectionHeading({ lang = "tr", eyebrow, title, subtitle, center = false, light = false, className = "" }) {
  return (
    <div className={`${center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"} ${className}`}>
      {eyebrow && <Eyebrow lang={lang}>{eyebrow}</Eyebrow>}
      {title && (
        <h2
          className={`mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl ${
            light ? "text-white" : "text-slate-900 dark:text-white"
          }`}
        >
          {title}
        </h2>
      )}
      {subtitle && (
        <p className={`mt-4 text-base leading-relaxed ${light ? "text-slate-200" : "text-slate-600 dark:text-slate-300"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

const variants = {
  primary: "bg-accent text-white shadow-sm hover:bg-accent-600",
  secondary: "bg-primary text-white shadow-sm hover:bg-primary-600",
  outline:
    "border border-slate-300 text-slate-800 hover:border-accent hover:text-accent-600 dark:border-slate-600 dark:text-slate-100 dark:hover:border-accent dark:hover:text-accent-300",
  ghostWhite: "bg-white/10 text-white ring-1 ring-inset ring-white/25 hover:bg-white/20",
  solidWhite: "bg-white text-primary hover:bg-slate-100",
};

const sizes = {
  sm: "px-4 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

export function Button({ to, href, variant = "primary", size = "md", className = "", children, ...rest }) {
  const cls = `inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-none ${variants[variant]} ${sizes[size]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}

export function Card({ className = "", children }) {
  // Tailwind resolves conflicting utilities by their order in the stylesheet, not
  // by their order in the class string — so a caller passing `bg-primary` used to
  // lose to this component's own `bg-white` and render white-on-white. Only apply
  // the default surface when the caller hasn't supplied one.
  const hasSurface = /(^|\s)(bg-|surface-)/.test(className);
  const surface = hasSurface ? "" : "bg-white dark:bg-primary-800";
  return (
    <div
      className={`rounded-2xl border border-slate-200 p-6 shadow-card transition hover:shadow-lg dark:border-slate-800 ${surface} ${className}`}
    >
      {children}
    </div>
  );
}
