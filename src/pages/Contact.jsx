import { t } from "../i18n";
import { Section, Eyebrow } from "../components/ui";
import { socials, departments } from "../content";

export default function ContactPage({ lang }) {
  return (
    <Section className="py-20">
      <div className="max-w-3xl">
        <Eyebrow>{t(lang, "nav.contact")}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {t(lang, "contact.title")}
        </h1>

        {/* Socials */}
        <div className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {t(lang, "contact.social")}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {socials.map((s) => (
              <li key={s.name}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand hover:border-accent hover:text-accent-600 dark:border-slate-800 dark:bg-primary-800 dark:text-white dark:hover:text-accent-300"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Emails */}
        <div className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            {t(lang, "contact.emails")}
          </h2>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <tbody>
                {departments.map((d, i) => (
                  <tr
                    key={d.email}
                    className={i % 2 ? "bg-cream-200 dark:bg-primary-800/50" : "bg-white dark:bg-primary-800"}
                  >
                    <td className="px-5 py-3 font-semibold text-slate-800 dark:text-slate-100">{d[lang]}</td>
                    <td className="px-5 py-3">
                      <a href={`mailto:${d.email}`} className="font-medium text-brand hover:underline">
                        {d.email}
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-10 text-lg font-medium text-primary dark:text-white">{t(lang, "contact.tagline")}</p>
      </div>
    </Section>
  );
}
