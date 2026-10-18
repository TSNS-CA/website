import { t, upper } from "../i18n";
import { Section, Eyebrow, Button, Card } from "../components/ui";
import { guide, partnerships, supportOrgs, linkGroups, verifyList, lastReviewed, sourceYear } from "../content/newcomers.js";
import { usePageMeta } from "../lib/usePageMeta";

const EXT = { target: "_blank", rel: "noopener noreferrer" };

function LinkList({ links, lang, title }) {
  if (!links?.length) return null;
  return (
    <div className="mt-5 rounded-xl bg-cream-200/70 p-4 dark:bg-primary-900/60">
      {title && (
        <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">{upper(lang, title)}</div>
      )}
      <ul className="mt-2 space-y-1.5 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            <a href={l.href} {...EXT} className="font-semibold text-brand-red hover:underline">
              {l.label[lang]} ↗
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VerifyBadge({ lang, note }) {
  return (
    <div className="mt-4 flex items-start gap-2 rounded-lg border border-gold/60 bg-gold/15 px-3 py-2 text-xs text-slate-800 dark:border-gold/40 dark:bg-gold/10 dark:text-slate-100">
      <span aria-hidden="true">⚠️</span>
      <span>
        <span className="font-bold">{t(lang, "newcomers.verifyBadge")}:</span> {note[lang]}
      </span>
    </div>
  );
}

function GuideSection({ section, lang }) {
  return (
    <section id={section.id} className="scroll-mt-28 border-t border-slate-200 pt-10 first:border-t-0 first:pt-0 dark:border-slate-800">
      <h3 className="flex items-start gap-3 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
        <span className="text-2xl leading-none" aria-hidden="true">
          {section.icon}
        </span>
        <span>{section.title[lang]}</span>
      </h3>
      <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
        {section.body[lang].map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <LinkList links={section.links} lang={lang} title={t(lang, "newcomers.sectionLinks")} />
      {section.verify && <VerifyBadge lang={lang} note={section.verify} />}
    </section>
  );
}

function IsansCard({ lang }) {
  const p = partnerships.isans;
  return (
    <Card id={p.id} className="scroll-mt-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow lang={lang}>{p.name}</Eyebrow>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{p.title[lang]}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">{p.fullName[lang]}</p>
        </div>
        <Button href={p.ctaHref} {...EXT} variant="secondary" size="sm">
          {p.ctaLabel[lang]} ↗
        </Button>
      </div>
      <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {p.intro[lang].map((x, i) => (
          <p key={i}>{x}</p>
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">{upper(lang, p.eligibilityTitle[lang])}</div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
            {p.eligibility[lang].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">{upper(lang, p.stepsTitle[lang])}</div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
            {p.steps[lang].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ol>
          <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400">{p.stepsNote[lang]}</p>
        </div>
      </div>
      <div className="mt-6">
        <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">{upper(lang, p.servicesTitle[lang])}</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {p.services.map((s) => (
            <div key={s.title.en} className="rounded-xl bg-cream-200/70 p-4 dark:bg-primary-900/60">
              <div className="text-xl" aria-hidden="true">{s.icon}</div>
              <div className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{s.title[lang]}</div>
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{s.body[lang]}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">{p.footnote[lang]}</p>
    </Card>
  );
}

function DrivingCard({ lang }) {
  const p = partnerships.driving;
  return (
    <Card id={p.id} className="scroll-mt-28">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Eyebrow lang={lang}>{p.subtitle[lang]}</Eyebrow>
          <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">{p.title[lang]} 🚘</h3>
        </div>
        <Button href={p.href} {...EXT} variant="outline" size="sm">
          {t(lang, "newcomers.visitSite")} ↗
        </Button>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-[1fr_260px]">
        <div>
          <div className="text-sm font-bold text-slate-900 dark:text-white">{p.packageTitle[lang]}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{p.packageFor[lang]}</div>
          <div className="mt-3 text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">
            {upper(lang, t(lang, "newcomers.packageIncludes"))}
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
            {p.items[lang].map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-200">{p.pitch[lang]}</p>
        </div>
        <div className="surface-red flex flex-col justify-between rounded-xl p-5">
          <div>
            <div className="text-3xl font-black">{p.price[lang]}</div>
            <div className="mt-2 text-[11px] font-bold tracking-[0.14em]">{upper(lang, t(lang, "newcomers.memberDiscount"))}</div>
            <p className="mt-1 text-xs leading-relaxed">{p.discount[lang]}</p>
          </div>
          <Button href={p.ctaMail} variant="primary" size="sm" className="mt-4">
            {t(lang, "newcomers.getCode")}
          </Button>
        </div>
      </div>
      <VerifyBadge lang={lang} note={p.verify} />
    </Card>
  );
}

export default function NewcomersPage({ lang }) {
  usePageMeta({
    title: t(lang, "newcomers.title"),
    description: t(lang, "newcomers.intro"),
    canonical: "/yeni-gelenler",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `${t(lang, "newcomers.title")} — ${guide.title[lang]}`,
      description: t(lang, "newcomers.intro"),
      url: "https://tsns.ca/yeni-gelenler",
      inLanguage: lang,
      dateModified: lastReviewed,
      publisher: { "@type": "Organization", name: "Turkish Society of Nova Scotia", url: "https://tsns.ca" },
    },
  });

  const toc = [
    { id: "rehber", label: t(lang, "newcomers.guide"), children: guide.sections.map((s) => ({ id: s.id, label: s.title[lang] })) },
    { id: "ortakliklar", label: t(lang, "newcomers.partnerships") },
    { id: "destek", label: t(lang, "newcomers.support") },
    { id: "baglantilar", label: t(lang, "newcomers.links") },
  ];

  return (
    <>
      {/* Başlık */}
      <Section className="pt-20">
        <div className="max-w-3xl">
          <Eyebrow lang={lang}>{t(lang, "nav.newcomers")}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {guide.title[lang]}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600 dark:text-slate-300">{t(lang, "newcomers.intro")}</p>
          <p className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-primary-800 dark:text-slate-300">
            🗓️ {t(lang, "newcomers.lastReviewed", { date: lastReviewed, year: sourceYear })}
          </p>
        </div>

        {/* Mobil içindekiler: yatay chip satırı */}
        <nav aria-label={t(lang, "newcomers.onThisPage")} className="mt-8 -mx-4 overflow-x-auto px-4 lg:hidden">
          <ul className="flex gap-2 whitespace-nowrap pb-2">
            {toc.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="inline-block rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-accent hover:text-accent-600 dark:border-slate-600 dark:text-slate-200"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </Section>

      <Section className="py-12 lg:py-16">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[240px_1fr]">
          {/* Masaüstü içindekiler */}
          <aside className="hidden lg:block">
            <nav aria-label={t(lang, "newcomers.onThisPage")} className="sticky top-24">
              <div className="text-[11px] font-bold tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {upper(lang, t(lang, "newcomers.onThisPage"))}
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {toc.map((item) => (
                  <li key={item.id}>
                    <a href={`#${item.id}`} className="block rounded-md px-2 py-1 font-semibold text-slate-800 hover:bg-cream-200 dark:text-slate-100 dark:hover:bg-primary-800">
                      {item.label}
                    </a>
                    {item.children && (
                      <ul className="ml-2 mt-1 space-y-0.5 border-l border-slate-200 pl-3 dark:border-slate-700">
                        {item.children.map((c) => (
                          <li key={c.id}>
                            <a href={`#${c.id}`} className="block rounded-md px-2 py-1 text-xs text-slate-600 hover:text-accent-600 dark:text-slate-300 dark:hover:text-accent-300">
                              {c.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </aside>

          <div className="min-w-0 space-y-20">
            {/* A. Rehber */}
            <div id="rehber" className="scroll-mt-28">
              <h2 className="text-sm font-bold tracking-wider text-brand-red">{upper(lang, t(lang, "newcomers.guide"))}</h2>
              <div className="mt-4 space-y-4 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                {guide.intro[lang].map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
              <div className="mt-10 space-y-10">
                {guide.sections.map((s) => (
                  <GuideSection key={s.id} section={s} lang={lang} />
                ))}
              </div>
            </div>

            {/* B. Ortaklıklar */}
            <div id="ortakliklar" className="scroll-mt-28">
              <h2 className="text-sm font-bold tracking-wider text-brand-red">{upper(lang, t(lang, "newcomers.partnerships"))} 🤝</h2>
              <div className="mt-5 space-y-6">
                <IsansCard lang={lang} />
                <DrivingCard lang={lang} />
              </div>
            </div>

            {/* C. Destek kuruluşları */}
            <div id="destek" className="scroll-mt-28">
              <h2 className="text-sm font-bold tracking-wider text-brand-red">{upper(lang, t(lang, "newcomers.support"))}</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                {supportOrgs.map((o) => (
                  <a
                    key={o.href}
                    href={o.href}
                    {...EXT}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-primary-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-bold text-slate-900 group-hover:text-accent-600 dark:text-white dark:group-hover:text-accent-300">{o.name}</div>
                      <span className="surface-red flex-none rounded-full px-2 py-0.5 text-[10px] font-black tracking-wider">{o.region}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{o.blurb[lang]}</p>
                  </a>
                ))}
              </div>
            </div>

            {/* D/E. Bağlantılar */}
            <div id="baglantilar" className="scroll-mt-28">
              <h2 className="text-sm font-bold tracking-wider text-brand-red">{upper(lang, t(lang, "newcomers.links"))}</h2>
              <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-3">
                {linkGroups.map((g) => (
                  <Card key={g.id}>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">{g.title[lang]}</h3>
                    <ul className="mt-3 space-y-2 text-sm">
                      {g.links.map((l) => (
                        <li key={l.href}>
                          <a href={l.href} {...EXT} className="text-slate-700 hover:text-accent-600 dark:text-slate-200 dark:hover:text-accent-300">
                            {l.label[lang]} ↗
                          </a>
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))}
              </div>
            </div>

            {/* Teyit listesi */}
            <div className="rounded-2xl border border-gold/50 bg-gold/10 p-6 dark:border-gold/30 dark:bg-gold/5">
              <h2 className="text-sm font-bold tracking-wider text-slate-900 dark:text-white">{upper(lang, t(lang, "newcomers.verifyTitle"))}</h2>
              <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{t(lang, "newcomers.verifyIntro")}</p>
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-200">
                {verifyList[lang].map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-slate-700 dark:text-slate-200">
                {t(lang, "newcomers.suggest")}{" "}
                <a href="mailto:info@tsns.ca" className="font-semibold text-brand-red hover:underline">
                  info@tsns.ca
                </a>
              </p>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
