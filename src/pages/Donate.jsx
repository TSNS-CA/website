import { useState } from "react";
import { t } from "../i18n";
import { Section, Eyebrow, Button } from "../components/ui";
import DonationCheckout from "../components/DonationCheckout";

const PRESETS_ONE_TIME = [10, 25, 50, 100];
const RECURRING = { monthly: 5, yearly: 50 }; // CAD

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-primary-700 dark:text-white";

export default function DonatePage({ lang }) {
  const [frequency, setFrequency] = useState("monthly"); // recurring-first
  const [customAmount, setCustomAmount] = useState("");
  const [onePreset, setOnePreset] = useState(25);
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(null);

  const tr = lang === "tr";
  const freqOpts = [
    { id: "monthly", label: tr ? "Aylık" : "Monthly", sub: "$5 CAD / " + (tr ? "ay" : "mo") },
    { id: "yearly", label: tr ? "Yıllık" : "Yearly", sub: "$50 CAD / " + (tr ? "yıl" : "yr") },
    { id: "one_time", label: tr ? "Tek Seferlik" : "One-time", sub: tr ? "Tek bağış" : "Single gift" },
  ];

  const amountCents =
    frequency === "monthly" ? 500 : frequency === "yearly" ? 5000 : Math.round(parseFloat(amount()) || 0) * 100;

  function amount() {
    if (frequency === "one_time") return customAmount ? parseFloat(customAmount) : onePreset;
    return RECURRING[frequency];
  }
  const amountLabel =
    "$" +
    (amountCents / 100).toFixed(2) +
    (frequency === "monthly" ? (tr ? "/ay" : "/mo") : frequency === "yearly" ? (tr ? "/yıl" : "/yr") : "");

  function setField(k, v) {
    setDonor((d) => ({ ...d, [k]: v }));
  }

  function validate() {
    const e = {};
    if (!donor.name.trim()) e.name = tr ? "Ad gerekli" : "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email)) e.email = tr ? "Geçerli e-posta gerekli" : "Valid email required";
    return e;
  }

  function onSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    if (frequency === "one_time" && amountCents < 100) {
      setErrors({ amount: tr ? "En az $1.00" : "Minimum $1.00" });
      return;
    }
    setCheckout(true);
  }

  if (done) {
    return (
      <Section className="py-24">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card dark:border-slate-800 dark:bg-primary-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-3xl">💚</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {tr ? "Çok teşekkürler!" : "Thank you so much!"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {tr
              ? `${done.name}, bağışınız alındı. Türk kültürünü Nova Scotia'da yaşatmamıza destek olduğunuz için minnettarız.`
              : `${done.name}, your gift was received. Thank you for helping keep Turkish culture alive in Nova Scotia.`}
          </p>
          {done.receiptUrl && (
            <p className="mt-3 text-sm">
              <a className="text-accent hover:underline" href={done.receiptUrl} target="_blank" rel="noreferrer">
                {tr ? "Maküzeyi gör" : "View receipt"}
              </a>
            </p>
          )}
          <div className="mt-6">
            <Button to="/" variant="secondary">{t(lang, "action.backHome")}</Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-16">
      <div className="mx-auto max-w-xl">
        <div className="text-center">
          <Eyebrow>{t(lang, "action.donate")}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            {t(lang, "donate.title")}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-slate-600 dark:text-slate-300">{t(lang, "donate.intro")}</p>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          {/* Frequency */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              {tr ? "Sıklık" : "Frequency"}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {freqOpts.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFrequency(f.id)}
                  className={
                    "rounded-xl border p-3 text-center transition " +
                    (frequency === f.id
                      ? "border-accent bg-accent/5 ring-1 ring-accent"
                      : "border-slate-300 hover:border-primary dark:border-slate-700")
                  }
                >
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{f.label}</span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-300">{f.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              {tr ? "Tutar (CAD)" : "Amount (CAD)"}
            </label>
            {frequency === "one_time" ? (
              <>
                <div className="grid grid-cols-4 gap-2">
                  {PRESETS_ONE_TIME.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setOnePreset(p); setCustomAmount(""); }}
                      className={
                        "rounded-lg border py-2 text-sm font-semibold transition " +
                        (!customAmount && onePreset === p
                          ? "border-accent bg-accent/5 text-accent ring-1 ring-accent"
                          : "border-slate-300 text-slate-700 hover:border-primary dark:border-slate-700 dark:text-slate-200")
                      }
                    >
                      ${p}
                    </button>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-500">$</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder={tr ? "Özel tutar" : "Custom amount"}
                    className={inputCls}
                  />
                </div>
                {errors.amount && <p className="mt-1 text-xs text-accent">{errors.amount}</p>}
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-cream-200 p-4 text-sm text-slate-700 dark:border-slate-700 dark:bg-primary-700 dark:text-slate-200">
                {tr
                  ? `Plan: ${frequency === "monthly" ? "Aylık" : "Yıllık"} $${RECURRING[frequency]} CAD${
                      frequency === "monthly" ? " / ay" : " / yıl"
                    } — her dönem otomatik çekilir.`
                  : `Plan: ${frequency === "monthly" ? "Monthly" : "Yearly"} $${RECURRING[frequency]} CAD${
                      frequency === "monthly" ? " / month" : " / year"
                    } — charged automatically each cycle.`}
              </div>
            )}
          </div>

          {/* Donor info */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {tr ? "Ad Soyad *" : "Full name *"}</label>
              <input value={donor.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder={tr ? "Adınız" : "Your name"} />
              {errors.name && <p className="mt-1 text-xs text-accent">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {tr ? "E-posta *" : "Email *"}</label>
                <input value={donor.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="you@email.com" />
                {errors.email && <p className="mt-1 text-xs text-accent">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {tr ? "Telefon" : "Phone"}
                </label>
                <input value={donor.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-accent px-6 py-3 font-bold text-white transition hover:bg-accent-600"
          >
            {tr ? "Bağış Yap" : "Donate"} · {amountLabel}
          </button>
          <p className="text-center text-xs text-slate-400">
            🔒 {tr ? "Ödeme Square ile güvenle işlenir." : "Secure payment by Square."}
          </p>
        </form>
      </div>

      {checkout && (
        <DonationCheckout
          lang={lang}
          frequency={frequency}
          amountCents={amountCents}
          amountLabel={amountLabel}
          buyer={donor}
          onClose={() => setCheckout(false)}
          onSuccess={(data) => {
            try {
              sessionStorage.setItem(
                "membershipData",
                JSON.stringify({ ...donor, frequency, amountCents, payment: data })
              );
            } catch (e) {}
            setDone({ ...donor, receiptUrl: data.receiptUrl });
            setCheckout(false);
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </Section>
  );
}
