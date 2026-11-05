import { t, upper } from "../i18n";
import { getSponsorsByTier } from "../content/sponsors.js";

// Sponsor vitrini (ana sayfa, #sponsorlar). Veri src/content/sponsors.js'te.

// Logo her zaman kendi zemininde (varsayılan beyaz) durur: sponsor logoları
// açık zemine göre tasarlanıyor, dark mode'da lacivert üstünde kaybolurlar.
function SponsorLogo({ sponsor, className = "" }) {
  if (!sponsor.logo) {
    return (
      <span className="text-center font-display text-lg font-extrabold text-slate-800">
        {sponsor.name}
      </span>
    );
  }
  return (
    <img
      src={sponsor.logo}
      alt={sponsor.org ? `${sponsor.name} — ${sponsor.org}` : sponsor.name}
      loading="lazy"
      className={`max-h-full max-w-full object-contain ${className}`}
    />
  );
}

function LogoPlate({ sponsor, className = "" }) {
  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-xl ring-1 ring-slate-200 dark:ring-white/10 ${className}`}
      style={{ background: sponsor.logoBg || "#ffffff" }}
    >
      <SponsorLogo sponsor={sponsor} />
    </div>
  );
}

const TIER_DOT = { gold: "bg-gold", silver: "bg-slate-400", bronze: "bg-[#b0703c]" };

function TierLabel({ lang, tier, plural = false, className = "" }) {
  const key = `home.sponsors.tier.${tier}${plural ? ".plural" : ""}`;
  return (
    <p className={`flex items-center justify-center gap-2 text-xs font-bold tracking-[0.18em] text-slate-500 dark:text-slate-400 ${className}`}>
      <span className={`h-2 w-2 rounded-full ${TIER_DOT[tier]}`} aria-hidden="true" />
      {upper(lang, t(lang, key))}
    </p>
  );
}

function GoldSponsor({ sponsor, lang }) {
  const Plate = sponsor.url ? "a" : "div";
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-primary-800">
      <div className="h-1.5 w-full bg-gold" />
      <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:items-center">
        <Plate
          {...(sponsor.url ? { href: sponsor.url, target: "_blank", rel: "noopener noreferrer" } : {})}
          className="block"
        >
          <LogoPlate sponsor={sponsor} className="aspect-[3/2] p-3" />
        </Plate>
        <div>
          <TierLabel lang={lang} tier="gold" className="md:justify-start" />
          <h3 className="mt-3 text-center font-display text-2xl font-extrabold text-slate-900 md:text-left dark:text-white">
            {sponsor.name}
            {sponsor.org && (
              <span className="block text-base font-semibold text-slate-500 dark:text-slate-300">{sponsor.org}</span>
            )}
          </h3>
          {sponsor.about && (
            <>
              <p className="mt-5 text-xs font-bold tracking-[0.18em] text-brand-red">
                {upper(lang, t(lang, "home.sponsors.about"))}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{sponsor.about[lang]}</p>
            </>
          )}
          {sponsor.url && (
            <a
              href={sponsor.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand mt-5 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
            >
              {t(lang, "home.sponsors.visit")}
              <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function PlainSponsor({ sponsor, className = "" }) {
  const plate = <LogoPlate sponsor={sponsor} className={className} />;
  if (!sponsor.url) return plate;
  return (
    <a href={sponsor.url} target="_blank" rel="noopener noreferrer" className="block transition hover:-translate-y-0.5">
      {plate}
    </a>
  );
}

export default function SponsorShowcase({ lang, className = "" }) {
  const gold = getSponsorsByTier("gold");
  const silver = getSponsorsByTier("silver");
  const bronze = getSponsorsByTier("bronze");
  return (
    <div className={`mx-auto max-w-4xl space-y-12 ${className}`}>
      {gold.map((s) => (
        <GoldSponsor key={s.slug} sponsor={s} lang={lang} />
      ))}

      {silver.length > 0 && (
        <div>
          <TierLabel lang={lang} tier="silver" plural={silver.length > 1} />
          <div className="mx-auto mt-4 grid max-w-md gap-4">
            {silver.map((s) => (
              <PlainSponsor key={s.slug} sponsor={s} className="h-36 p-6 sm:h-40" />
            ))}
          </div>
        </div>
      )}

      {bronze.length > 0 && (
        <div>
          <TierLabel lang={lang} tier="bronze" plural={bronze.length > 1} />
          {/* Izgara değil, ortalanmış flex: son satır eksik kalınca (7 sponsor gibi)
              yarım satır sola yaslanmasın. Genişlikler gap-4 (1rem) düşülerek. */}
          <div className="mt-4 flex flex-wrap justify-center gap-4">
            {bronze.map((s) => (
              <div key={s.slug} className="w-[calc(50%-0.5rem)] sm:w-[calc((100%-2rem)/3)]">
                <PlainSponsor sponsor={s} className="aspect-[3/2] p-3" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
