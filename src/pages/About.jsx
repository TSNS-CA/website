import { t } from "../i18n";
import { Section, Eyebrow } from "../components/ui";

export default function AboutPage({ lang }) {
  return (
    <Section className="py-20">
      <div className="max-w-3xl">
        <Eyebrow lang={lang}>{t(lang, "nav.about")}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {t(lang, "about.title")}
        </h1>
        <div className="mt-8 space-y-5 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
          <p>{t(lang, "about.p1")}</p>
          <p>{t(lang, "about.p2")}</p>
          <p>{t(lang, "about.p3")}</p>
        </div>
      </div>
    </Section>
  );
}
