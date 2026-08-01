import { t } from "../i18n";
import { stories, events, sponsors } from "../content";
import { Container, Section, SectionHeading, Eyebrow, Button, Card } from "../components/ui";

function Hero({ lang }) {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Background image + overlay */}
      <div className="absolute inset-0 -z-10">
        <img src="/bogaz.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary-900/80 via-primary-900/65 to-slate-950/85" />
      </div>

      <Container className="flex min-h-[78vh] flex-col items-start justify-center py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white ring-1 ring-inset ring-white/25 backdrop-blur">
            🇹🇷 {t(lang, "home.hero.eyebrow")}
          </span>
          <h1 className="mt-5 whitespace-pre-line font-display text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t(lang, "home.hero.title")}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-200">
            {t(lang, "home.hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button to="/bagis" variant="primary" size="lg">
              {t(lang, "action.donate")} →
            </Button>
            <Button to="/gonullu" variant="ghostWhite" size="lg">
              {t(lang, "action.volunteer")}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function Promise({ lang }) {
  return (
    <div className="bg-accent">
      <Container className="py-4 text-center">
        <p className="text-sm font-semibold text-white sm:text-base">{t(lang, "home.promise")}</p>
      </Container>
    </div>
  );
}

function WhySupport({ lang }) {
  return (
    <Section className="py-20">
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
        <div>
          <Eyebrow>{t(lang, "home.why.eyebrow")}</Eyebrow>
          <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t(lang, "home.why.title")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            {t(lang, "home.why.body")}
          </p>
          <div className="mt-6">
            <Button to="/about" variant="secondary">
              {t(lang, "action.learnMore")}
            </Button>
          </div>
        </div>
        <Card className="bg-primary text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-2xl">🤝</div>
            <div>
              <p className="text-lg font-bold">{t(lang, "home.why.stat")}</p>
              <p className="text-sm text-slate-200">{t(lang, "home.why.statDetail")}</p>
            </div>
          </div>
        </Card>
      </div>
    </Section>
  );
}

function Stats({ lang }) {
  const items = [{ key: "since" }, { key: "members" }, { key: "events" }, { key: "region" }];
  return (
    <Section className="bg-slate-50 py-16 dark:bg-slate-900">
      <div className="grid grid-cols-2 gap-6 text-center lg:grid-cols-4">
        {items.map((it) => (
          <div key={it.key}>
            <div className="font-display text-4xl font-black text-accent sm:text-5xl">
              {t(lang, `home.stats.${it.key}.value`)}
            </div>
            <div className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-300">
              {t(lang, `home.stats.${it.key}.label`)}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Stories({ lang }) {
  return (
    <Section className="py-20">
      <SectionHeading
        center
        eyebrow={t(lang, "home.stories.eyebrow")}
        title={t(lang, "home.stories.title")}
        subtitle={t(lang, "home.stories.subtitle")}
      />
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {stories.map((s) => (
          <Card key={s.name}>
            <div className="text-3xl leading-none text-accent">“</div>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{s.quote[lang]}</p>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {s.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">{s.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{s.role[lang]}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function Events({ lang }) {
  return (
    <Section className="bg-slate-50 py-20 dark:bg-slate-900">
      <SectionHeading
        eyebrow={t(lang, "home.events.eyebrow")}
        title={t(lang, "home.events.title")}
        subtitle={t(lang, "home.events.subtitle")}
      />
      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
        {events.map((e, i) => (
          <Card key={i} className="flex gap-4">
            <div className="flex w-14 flex-none flex-col items-center justify-center rounded-xl bg-accent/10 text-accent">
              <span className="text-lg font-black leading-none">{e.date[lang].split(" ")[0]}</span>
              <span className="text-[10px] font-bold uppercase">
                {e.date[lang].split(" ").slice(1).join(" ")}
              </span>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{e.title[lang]}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{e.desc[lang]}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

function Sponsors({ lang }) {
  return (
    <Section className="py-20">
      <SectionHeading
        center
        eyebrow={t(lang, "home.sponsors.eyebrow")}
        title={t(lang, "home.sponsors.title")}
        subtitle={t(lang, "home.sponsors.subtitle")}
      />
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        {sponsors.map((name) => (
          <div
            key={name}
            className="rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            {name}
          </div>
        ))}
      </div>
    </Section>
  );
}

function CTA({ lang }) {
  return (
    <Section className="pb-24">
      <div className="overflow-hidden rounded-3xl bg-primary px-8 py-12 text-center sm:px-16 sm:py-16">
        <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {t(lang, "home.cta.title")}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-200">{t(lang, "home.cta.body")}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button to="/bagis" variant="primary" size="lg">{t(lang, "action.donate")}</Button>
          <Button to="/gonullu" variant="solidWhite" size="lg">{t(lang, "action.volunteer")}</Button>
        </div>
      </div>
    </Section>
  );
}

export default function HomePage({ lang }) {
  return (
    <>
      <Hero lang={lang} />
      <Promise lang={lang} />
      <WhySupport lang={lang} />
      <Stats lang={lang} />
      <Stories lang={lang} />
      <Events lang={lang} />
      <Sponsors lang={lang} />
      <CTA lang={lang} />
    </>
  );
}
