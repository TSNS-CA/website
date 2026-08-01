import { t } from "../i18n";
import { Section, Eyebrow, Button, Card } from "../components/ui";

const tiers = (lang) => [
  {
    name: { tr: "Aylık", en: "Monthly" },
    amount: "$5 CAD",
    per: { tr: "/ay", en: "/month" },
    desc: {
      tr: "Her ay otomatik yenilenir. Topluluğumuza sürekli destek olun.",
      en: "Auto-renews every month. Sustained support for our community.",
    },
    highlight: true,
  },
  {
    name: { tr: "Yıllık", en: "Yearly" },
    amount: "$50 CAD",
    per: { tr: "/yıl", en: "/year" },
    desc: {
      tr: "Yıllık ödeme ile daha avantajlı — yıl boyunca destek olun.",
      en: "Better value yearly — support us all year round.",
    },
    highlight: false,
  },
  {
    name: { tr: "Tek Seferlik", en: "One-time" },
    amount: { tr: "İstediğiniz", en: "Your choice" },
    per: "",
    desc: {
      tr: "Tek seferlik bir bağış ile kültürümüzü yaşatmamıza katkıda bulunun.",
      en: "Make a one-time gift to help sustain our culture.",
    },
    highlight: false,
  },
];

export default function DonatePage({ lang }) {
  return (
    <Section className="py-20">
      <div className="mx-auto max-w-3xl text-center">
        <Eyebrow>{t(lang, "action.donate")}</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {t(lang, "donate.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-300">
          {t(lang, "donate.intro")}
        </p>
      </div>

      <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
        {tiers(lang).map((tier) => (
          <Card
            key={tier.name[lang]}
            className={tier.highlight ? "ring-2 ring-accent" : ""}
          >
            {tier.highlight && (
              <span className="inline-block rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                {lang === "tr" ? "Önerilen" : "Recommended"}
              </span>
            )}
            <h3 className="mt-3 text-lg font-bold text-slate-900 dark:text-white">{tier.name[lang]}</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-display text-3xl font-black text-primary dark:text-white">{tier.amount}</span>
              {tier.per && <span className="text-sm font-medium text-slate-500">{tier.per[lang]}</span>}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{tier.desc[lang]}</p>
          </Card>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl rounded-2xl bg-slate-50 p-6 text-center dark:bg-slate-900">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {lang === "tr"
            ? "🔒 Güvenli ödeme (Square + Apple Pay) yakında bağlanıyor."
            : "🔒 Secure payment (Square + Apple Pay) is being connected soon."}
        </p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {lang === "tr"
            ? "Şimdilik bize info@tsns.ca adresine e-posta atarak destek olabilirsiniz."
            : "In the meantime, you can support us by emailing info@tsns.ca."}
        </p>
        <div className="mt-4">
          <Button href="mailto:info@tsns.ca" variant="secondary" size="sm">
            info@tsns.ca
          </Button>
        </div>
      </div>
    </Section>
  );
}
