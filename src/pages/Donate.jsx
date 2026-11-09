import { useState } from "react";
import { t } from "../i18n";
import { Section, Eyebrow, Button } from "../components/ui";
import DonationCheckout from "../components/DonationCheckout";

// Sunucudaki MIN_AMOUNT_CENTS ile aynı tutulmalı (functions/api/create-payment.js,
// create-subscription.js) — formdaki kontrol tek başına yetmez.
const PRESETS = [10, 25, 50, 100];
const MIN_AMOUNT = 10;

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-slate-600 dark:bg-primary-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-primary-200 dark:focus:ring-primary-200/20";

const labelCls = "mb-1.5 block text-sm font-semibold text-slate-700 dark:text-slate-200";
const errCls = "mt-1.5 text-xs font-semibold text-brand-red";

function StepTitle({ n, children }) {
  return (
    <h2 className="flex items-center gap-3 text-base font-bold text-slate-900 dark:text-white">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white dark:bg-primary-200 dark:text-primary-900">
        {n}
      </span>
      {children}
    </h2>
  );
}

function Check() {
  return (
    <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
    </svg>
  );
}

// Aynı form iki kapıdan giriliyor: /uye-ol yıllık üyeliği, /bagis tek seferlik
// bağışı seçili açar. Sayfanın başlığı da seçili sıklığı takip eder, yani
// formdaki seçimi değiştiren biri başlığın da değiştiğini görür.
export default function DonatePage({ lang, defaultFrequency = "yearly" }) {
  const [frequency, setFrequency] = useState(defaultFrequency); // 'yearly' | 'one_time'
  const [preset, setPreset] = useState(25);
  const [custom, setCustom] = useState("");
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { amountCents } when applied
  const [couponMsg, setCouponMsg] = useState(null); // { ok, text }
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(null);

  const locked = !!coupon;
  const uyelik = frequency === "yearly";

  const amountCents = coupon ? coupon.amountCents : (custom ? Math.round(parseFloat(custom) * 100) : preset * 100);
  // Alt sınırın altındaki bir özel tutar özette gösterilmez: "$5.00/yıl" öğrenci
  // fiyatı geçerliymiş gibi okunuyordu.
  const validAmount = Number.isFinite(amountCents) && (locked || amountCents >= MIN_AMOUNT * 100);
  const amountText = validAmount ? "$" + (amountCents / 100).toFixed(2) : "—";
  const amountLabel = amountText + (uyelik ? t(lang, "donate.perYear") : "");

  function setField(k, v) {
    setDonor((d) => ({ ...d, [k]: v }));
  }

  function chooseFrequency(f) {
    if (f === frequency) return;
    // The student discount only exists for yearly membership, so switching to a
    // one-off gift drops it rather than blocking the switch.
    if (f === "one_time" && coupon) removeCoupon();
    setFrequency(f);
  }

  async function applyCoupon() {
    setCouponMsg(null);
    if (!couponInput.trim()) return;
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 429) {
        setCouponMsg({ ok: false, text: t(lang, "donate.student.tooMany") });
        return;
      }
      if (data.valid) {
        setCoupon(data);
        setFrequency("yearly");
        setCouponMsg({ ok: true, text: t(lang, "donate.student.applied") });
      } else {
        setCouponMsg({ ok: false, text: t(lang, "donate.student.invalid") });
      }
    } catch (e) {
      setCouponMsg({ ok: false, text: t(lang, "donate.student.error") });
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMsg(null);
  }

  function validate() {
    const e = {};
    if (!donor.name.trim()) e.name = t(lang, "donate.err.name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email)) e.email = t(lang, "donate.err.email");
    if (!coupon && custom && !(parseFloat(custom) >= MIN_AMOUNT)) e.amount = t(lang, "donate.err.amountMin", { min: MIN_AMOUNT });
    return e;
  }

  function onSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    const first = ["amount", "name", "email"].find((k) => e[k]);
    if (first) {
      const el = document.getElementById({ amount: "donate-custom", name: "donate-name", email: "donate-email" }[first]);
      el?.focus({ preventScroll: true });
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setCheckout(true);
  }

  if (done) {
    return (
      <Section className="py-20 sm:py-24">
        <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white text-center shadow-card dark:border-slate-800 dark:bg-primary-800">
          <div className="h-1.5 w-full bg-accent" />
          <div className="p-8 sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
              <svg viewBox="0 0 24 24" className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="mt-5 font-display text-3xl font-extrabold text-slate-900 dark:text-white">{t(lang, "donate.done.title")}</h1>
            <p className="mt-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
              {t(lang, done.uyelik ? "donate.done.member" : "donate.done.gift", { name: done.name })}
            </p>
            <p className="mt-2 text-slate-600 dark:text-slate-300">{t(lang, "donate.done.body")}</p>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t(lang, "donate.done.emailed", { email: done.email })}</p>
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {done.receiptUrl && (
                <Button href={done.receiptUrl} variant="outline" target="_blank" rel="noreferrer">
                  {t(lang, "donate.done.receipt")}
                </Button>
              )}
              <Button to="/" variant="secondary">{t(lang, "action.backHome")}</Button>
            </div>
          </div>
        </div>
      </Section>
    );
  }

  const stats = ["since", "members", "events"];
  const benefits = [
    t(lang, "donate.benefit.membership"),
    t(lang, "home.why.statDetail"),
    t(lang, "home.why.stat"),
    t(lang, "donate.benefit.cancel"),
  ];

  return (
    <Section className="py-12 sm:py-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-14">
        {/* Intro — on mobile it is the page header; on desktop it is the left column */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Eyebrow lang={lang}>{t(lang, uyelik ? "action.becomeMember" : "action.donate")}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {t(lang, uyelik ? "membership.title" : "donate.title")}
          </h1>
          <p className="mt-4 max-w-lg text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {t(lang, uyelik ? "membership.intro" : "donate.intro")}
          </p>

          <div className="mt-8 hidden lg:block">
            <SidePanel lang={lang} stats={stats} benefits={benefits} />
          </div>
        </div>

        {/* Form card */}
        <form
          onSubmit={onSubmit}
          noValidate
          className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-card dark:border-slate-800 dark:bg-primary-800"
        >
          <div className="h-1.5 w-full bg-accent" />
          <div className="space-y-8 p-6 sm:p-8">
            {/* 1. Type */}
            <fieldset>
              <legend className="contents">
                <StepTitle n={1}>{t(lang, "donate.step.type")}</StepTitle>
              </legend>
              <div role="radiogroup" className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { id: "yearly", icon: "🔁", label: t(lang, "donate.freq.yearly"), sub: t(lang, "donate.freq.yearlySub") },
                  { id: "one_time", icon: "💝", label: t(lang, "donate.freq.oneTime"), sub: t(lang, "donate.freq.oneTimeSub") },
                ].map((f) => {
                  const on = frequency === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => chooseFrequency(f.id)}
                      className={
                        "relative rounded-2xl border-2 p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
                        (on
                          ? "border-primary bg-primary/5 dark:border-primary-200 dark:bg-primary-200/10"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-500")
                      }
                    >
                      <span className="text-xl" aria-hidden="true">{f.icon}</span>
                      <span className="mt-2 block text-sm font-bold text-slate-900 dark:text-white">{f.label}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-slate-500 dark:text-slate-400">{f.sub}</span>
                      <span
                        className={
                          "absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full border-2 " +
                          (on ? "border-primary bg-primary dark:border-primary-200 dark:bg-primary-200" : "border-slate-300 dark:border-slate-600")
                        }
                        aria-hidden="true"
                      >
                        {on && <span className="h-1.5 w-1.5 rounded-full bg-white dark:bg-primary-900" />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            {/* 2. Amount */}
            <fieldset>
              <legend className="contents">
                <StepTitle n={2}>{t(lang, "donate.step.amount")}</StepTitle>
              </legend>
              {/* With a student coupon the price is fixed, so there is nothing
                  left to choose. Show the price instead; "Kaldır" on the coupon
                  brings the picker back. */}
              {locked ? (
                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-primary bg-primary/5 px-4 py-3.5 dark:border-primary-200 dark:bg-primary-200/10">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">🎓 {t(lang, "donate.student.locked")} · {amountLabel}</span>
                  <button type="button" onClick={removeCoupon} className="text-xs font-semibold text-slate-500 underline-offset-2 hover:underline dark:text-slate-300">
                    {t(lang, "donate.student.remove")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
                    {PRESETS.map((p) => {
                      const on = !custom && preset === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={on}
                          onClick={() => { setPreset(p); setCustom(""); }}
                          className={
                            "rounded-xl border-2 py-3 text-base font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
                            (on
                              ? "border-primary bg-primary text-white dark:border-primary-200 dark:bg-primary-200 dark:text-primary-900"
                              : "border-slate-200 text-slate-800 hover:border-slate-300 dark:border-slate-700 dark:text-slate-100 dark:hover:border-slate-500")
                          }
                        >
                          ${p}
                        </button>
                      );
                    })}
                  </div>
                  <label htmlFor="donate-custom" className="sr-only">{t(lang, "donate.amount.custom")}</label>
                  <div className="relative mt-3">
                    <span className="pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-sm font-semibold text-slate-500 dark:text-slate-400">$</span>
                    <input
                      id="donate-custom"
                      type="number"
                      inputMode="decimal"
                      min={MIN_AMOUNT}
                      step="1"
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      placeholder={`${t(lang, "donate.amount.custom")} (min $${MIN_AMOUNT})`}
                      className={`${inputCls} pl-7 pr-14 ${custom ? "border-primary dark:border-primary-200" : ""}`}
                    />
                    <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-semibold text-slate-400">CAD</span>
                  </div>
                </>
              )}
              {errors.amount && <p className={errCls}>{errors.amount}</p>}

              {/* Student coupon — yearly membership only, tucked away until asked for */}
              {uyelik && !locked && (
                <div className="mt-4">
                  {!couponOpen ? (
                    <button
                      type="button"
                      onClick={() => setCouponOpen(true)}
                      className="text-brand text-sm font-semibold underline-offset-2 hover:underline"
                    >
                      🎓 {t(lang, "donate.student.toggle")}
                    </button>
                  ) : (
                    <div className="rounded-2xl bg-cream-50 p-4 dark:bg-primary-700/40">
                      <label htmlFor="donate-coupon" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        🎓 {t(lang, "donate.student.toggle")}
                      </label>
                      <div className="mt-2 flex gap-2">
                        <input
                          id="donate-coupon"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                          placeholder={t(lang, "donate.student.code")}
                          className={inputCls}
                        />
                        <Button type="button" variant="secondary" size="sm" onClick={applyCoupon} className="whitespace-nowrap px-5">
                          {t(lang, "donate.student.apply")}
                        </Button>
                      </div>
                      {couponMsg && !couponMsg.ok && <p className={errCls}>{couponMsg.text}</p>}
                    </div>
                  )}
                </div>
              )}
            </fieldset>

            {/* 3. Details */}
            <fieldset>
              <legend className="contents">
                <StepTitle n={3}>{t(lang, "donate.step.details")}</StepTitle>
              </legend>
              <div className="mt-4 space-y-4">
                <div>
                  <label htmlFor="donate-name" className={labelCls}>{t(lang, "donate.field.name")}</label>
                  <input
                    id="donate-name"
                    autoComplete="name"
                    value={donor.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={inputCls}
                    placeholder={t(lang, "donate.field.namePh")}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="donate-email" className={labelCls}>{t(lang, "donate.field.email")}</label>
                    <input
                      id="donate-email"
                      type="email"
                      autoComplete="email"
                      value={donor.email}
                      onChange={(e) => setField("email", e.target.value)}
                      className={inputCls}
                      placeholder="you@email.com"
                      aria-invalid={!!errors.email}
                    />
                    {errors.email && <p className={errCls}>{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="donate-phone" className={labelCls}>
                      {t(lang, "donate.field.phone")}{" "}
                      <span className="font-normal text-slate-400">({t(lang, "donate.optional")})</span>
                    </label>
                    <input
                      id="donate-phone"
                      type="tel"
                      autoComplete="tel"
                      value={donor.phone}
                      onChange={(e) => setField("phone", e.target.value)}
                      className={inputCls}
                      placeholder="+1 (902) 000-0000"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t(lang, "donate.field.emailHint")}</p>
              </div>
            </fieldset>
          </div>

          {/* Summary + submit */}
          <div className="border-t border-slate-200 bg-cream-50 p-6 dark:border-slate-700 dark:bg-primary-900/40 sm:p-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{t(lang, "donate.summary.label")}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t(lang, uyelik ? "donate.summary.yearly" : "donate.summary.oneTime")}
                </p>
              </div>
              <p className="whitespace-nowrap font-display text-3xl font-extrabold text-slate-900 dark:text-white">
                {amountText}
                <span className="ml-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                  CAD{uyelik ? t(lang, "donate.perYear") : ""}
                </span>
              </p>
            </div>
            <button
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-4 text-base font-bold text-white shadow-sm transition hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2"
            >
              {t(lang, "donate.continue")}
              <span aria-hidden="true">→</span>
            </button>
            <ul className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-1.5">🔒 {t(lang, "donate.trust.secure")}</li>
              <li className="flex items-center gap-1.5">💳 {t(lang, "donate.trust.card")}</li>
              <li className="flex items-center gap-1.5">✉️ {t(lang, "donate.trust.receipt")}</li>
            </ul>
          </div>
        </form>

        {/* Mobile: the "why give" panel comes after the form, not before it */}
        <div className="lg:hidden">
          <SidePanel lang={lang} stats={stats} benefits={benefits} />
        </div>
      </div>

      {checkout && (
        <DonationCheckout
          lang={lang}
          frequency={frequency}
          amountCents={amountCents}
          amountLabel={amountLabel}
          couponCode={coupon ? couponInput.trim() : undefined}
          buyer={donor}
          onClose={() => setCheckout(false)}
          onSuccess={(data) => {
            try {
              sessionStorage.setItem("membershipData", JSON.stringify({ ...donor, frequency, amountCents, coupon: !!coupon, payment: data }));
            } catch (e) {}
            setDone({ ...donor, receiptUrl: data.receiptUrl, uyelik });
            setCheckout(false);
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </Section>
  );
}

function SidePanel({ lang, stats, benefits }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-primary p-6 text-white sm:p-8">
        <h2 className="font-display text-xl font-extrabold">{t(lang, "donate.side.title")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-200">{t(lang, "donate.side.body")}</p>
        <dl className="mt-6 grid grid-cols-3 gap-3 border-t border-white/15 pt-6">
          {stats.map((k) => (
            <div key={k}>
              <dt className="sr-only">{t(lang, `home.stats.${k}.label`)}</dt>
              <dd className="font-display text-2xl font-black text-gold sm:text-3xl">{t(lang, `home.stats.${k}.value`)}</dd>
              <dd className="mt-0.5 text-xs text-slate-300">{t(lang, `home.stats.${k}.label`)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-primary-800 sm:p-8">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t(lang, "donate.side.includes")}</h3>
        <ul className="mt-4 space-y-3">
          {benefits.map((b) => (
            <li key={b} className="flex gap-3 text-sm text-slate-700 dark:text-slate-200">
              <Check />
              {b}
            </li>
          ))}
        </ul>
        <p className="mt-6 border-t border-slate-100 pt-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          {t(lang, "donate.help")}{" "}
          <a href="mailto:info@tsns.ca" className="text-brand font-semibold hover:underline">info@tsns.ca</a>
        </p>
      </div>
    </div>
  );
}
