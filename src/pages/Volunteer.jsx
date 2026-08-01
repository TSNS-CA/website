import { useState } from "react";
import { t } from "../i18n";
import { Section, Eyebrow, Button } from "../components/ui";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function VolunteerPage({ lang }) {
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <Section className="py-24">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-3xl">✅</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {lang === "tr" ? "Teşekkürler!" : "Thank you!"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {lang === "tr"
              ? "Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz."
              : "Your application was received. We'll be in touch soon."}
          </p>
          <div className="mt-6">
            <Button to="/" variant="secondary">{t(lang, "action.backHome")}</Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-20">
      <div className="mx-auto max-w-xl">
        <Eyebrow>{t(lang, "action.volunteer")}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {t(lang, "volunteer.title")}
        </h1>
        <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">{t(lang, "volunteer.intro")}</p>

        <form
          className="mt-8 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
        >
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {lang === "tr" ? "Ad Soyad *" : "Full name *"}
            </label>
            <input required type="text" className={inputCls} placeholder={lang === "tr" ? "Adınız" : "Your name"} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {lang === "tr" ? "E-posta *" : "Email *"}
              </label>
              <input required type="email" className={inputCls} placeholder="you@email.com" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {lang === "tr" ? "Telefon" : "Phone"}
              </label>
              <input type="tel" className={inputCls} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {lang === "tr" ? "İlgi alanlarınız / katkıda bulunabileceğiniz alanlar" : "Your interests / how you'd like to help"}
            </label>
            <textarea rows={4} className={inputCls} placeholder={lang === "tr" ? "Etkinlikler, sosyal medya, çeviri..." : "Events, social media, translation..."} />
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
            {lang === "tr" ? "Başvur" : "Apply"}
          </Button>
        </form>
      </div>
    </Section>
  );
}
