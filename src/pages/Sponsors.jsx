import { t } from "../i18n";
import { Section, SectionHeading, Button } from "../components/ui";
import SponsorShowcase from "../components/Sponsors";
import { SPONSOR_SEASON } from "../content/sponsors.js";
import { usePageMeta } from "../lib/usePageMeta";

// /sponsorlar — paylaşılabilir sponsor sayfası. Ana sayfadaki bölümle aynı
// vitrin; WhatsApp/Facebook önizlemesi sunucuda (functions/sponsorlar.js).
export default function SponsorsPage({ lang }) {
  const title = t(lang, "home.sponsors.title", { season: SPONSOR_SEASON });
  usePageMeta({
    title,
    description: t(lang, "sponsors.page.description"),
    canonical: "/sponsorlar",
  });
  return (
    <>
      <Section className="pb-10 pt-16 sm:pt-20">
        <SectionHeading
          lang={lang}
          center
          eyebrow={t(lang, "home.sponsors.eyebrow")}
          title={title}
          subtitle={t(lang, "sponsors.page.intro")}
        />
        <SponsorShowcase lang={lang} className="mt-12" />
      </Section>

      <Section className="pb-24 pt-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-card dark:border-slate-800 dark:bg-primary-800">
          <h2 className="font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {t(lang, "sponsors.page.ctaTitle")}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{t(lang, "sponsors.page.ctaBody")}</p>
          <div className="mt-6">
            <Button href="mailto:partners@tsns.ca" variant="secondary">partners@tsns.ca</Button>
          </div>
        </div>
      </Section>
    </>
  );
}
