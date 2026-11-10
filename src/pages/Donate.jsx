import { useState } from "react";
import { Link } from "react-router-dom";
import { t, upper } from "../i18n";
import { Section, Eyebrow, Button } from "../components/ui";
import DonationCheckout from "../components/DonationCheckout";

// Sunucudaki MIN_AMOUNT_CENTS ile aynı tutulmalı (functions/api/create-payment.js,
// create-subscription.js) — formdaki kontrol tek başına yetmez.
const PRESETS = [10, 25, 50, 100];
const MIN_AMOUNT = 10;

const inputCls =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-600 dark:bg-primary-700 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-primary-200 dark:focus:ring-primary-200";

const labelCls = "mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200";
const errCls = "mt-1.5 text-xs font-semibold text-brand-red";

// Bölüm başlığı: küçük, harf aralıklı, numara ya da ikon yok.
function SectionLabel({ lang, id, children }) {
  return (
    <p id={id} className="text-xs font-semibold tracking-[0.14em] text-slate-500 dark:text-slate-400">
      {upper(lang, children)}
    </p>
  );
}

const PHOTO = { src: "/photos/23-nisan-2022/12.jpg", album: "/fotograflar/23-nisan-2022", w: 1600, h: 1200 };

// Fotoğraf ve metin ayrı: mobilde fotoğraf formun üstünde, metin altında;
// masaüstünde ikisi de sol sütunda alt alta.
function StoryPhoto({ lang, className = "", eager = false }) {
  return (
    <figure className={className}>
      <Link to={PHOTO.album} className="block overflow-hidden rounded-lg">
        <img
          src={PHOTO.src}
          width={PHOTO.w}
          height={PHOTO.h}
          alt={t(lang, "donate.photo.alt")}
          loading={eager ? "eager" : "lazy"}
          className="aspect-[4/3] w-full object-cover transition duration-500 hover:scale-[1.02]"
        />
      </Link>
      <figcaption className="mt-2 text-xs text-slate-500 dark:text-slate-400">{t(lang, "donate.photo.caption")}</figcaption>
    </figure>
  );
}

function StoryText({ lang, className = "" }) {
  return (
    <div className={className}>
      <p className="text-[15px] leading-relaxed text-slate-700 dark:text-slate-300">{t(lang, "donate.story")}</p>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {t(lang, "donate.questions")}{" "}
        <a href="mailto:info@tsns.ca" className="text-brand font-medium underline underline-offset-2">info@tsns.ca</a>
      </p>
    </div>
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
      <Section className="py-20 sm:py-28">
        <div className="mx-auto max-w-lg text-center">
          <Eyebrow lang={lang}>{t(lang, uyelik ? "action.becomeMember" : "action.donate")}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{t(lang, "donate.done.title")}</h1>
          <p className="mt-5 text-lg text-slate-800 dark:text-slate-100">
            {t(lang, done.uyelik ? "donate.done.member" : "donate.done.gift", { name: done.name })}
          </p>
          <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{t(lang, "donate.done.body")}</p>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t(lang, "donate.done.emailed", { email: done.email })}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {done.receiptUrl && (
              <Button href={done.receiptUrl} variant="outline" target="_blank" rel="noreferrer">
                {t(lang, "donate.done.receipt")}
              </Button>
            )}
            <Button to="/" variant="secondary">{t(lang, "action.backHome")}</Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-12 sm:py-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
        <div>
          <Eyebrow lang={lang}>{t(lang, uyelik ? "action.becomeMember" : "action.donate")}</Eyebrow>
          <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            {t(lang, uyelik ? "membership.title" : "donate.title")}
          </h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            {t(lang, uyelik ? "membership.intro" : "donate.intro")}
          </p>
          {/* Mobilde fotoğraf burada, formun üstünde; masaüstünde sol sütunda metinle birlikte. */}
          <StoryPhoto lang={lang} eager className="mt-8 max-w-xl lg:mt-10" />
          <StoryText lang={lang} className="mt-6 hidden max-w-xl lg:block" />
        </div>

        <form
          onSubmit={onSubmit}
          noValidate
          className="rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-primary-800 lg:mt-2 lg:self-start"
        >
          <div className="space-y-7 p-5 sm:p-7">
            <div role="radiogroup" aria-labelledby="donate-type-label">
              <SectionLabel lang={lang} id="donate-type-label">{t(lang, "donate.label.type")}</SectionLabel>
              <div className="mt-3 grid grid-cols-2 rounded-md bg-slate-100 p-1 dark:bg-primary-900/60">
                {[
                  { id: "yearly", label: t(lang, "donate.freq.yearly") },
                  { id: "one_time", label: t(lang, "donate.freq.oneTime") },
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
                        "rounded px-3 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
                        (on
                          ? "bg-white text-slate-900 shadow-sm dark:bg-primary-700 dark:text-white"
                          : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white")
                      }
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {t(lang, uyelik ? "donate.summary.yearly" : "donate.summary.oneTime")}
              </p>
            </div>

            <div>
              <SectionLabel lang={lang}>{t(lang, "donate.label.amount")}</SectionLabel>
              {/* With a student coupon the price is fixed, so there is nothing
                  left to choose. Show the price instead; "Kaldır" brings the
                  picker back. */}
              {locked ? (
                <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-primary px-3 py-2.5 dark:border-primary-200">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{t(lang, "donate.student.locked")} · {amountLabel}</span>
                  <button type="button" onClick={removeCoupon} className="text-sm text-slate-500 underline underline-offset-2 hover:text-slate-800 dark:text-slate-300">
                    {t(lang, "donate.student.remove")}
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {PRESETS.map((p) => {
                      const on = !custom && preset === p;
                      return (
                        <button
                          key={p}
                          type="button"
                          aria-pressed={on}
                          onClick={() => { setPreset(p); setCustom(""); }}
                          className={
                            "rounded-md border py-2.5 text-[15px] font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 " +
                            (on
                              ? "border-primary bg-primary text-white dark:border-primary-200 dark:bg-primary-200 dark:text-primary-900"
                              : "border-slate-300 text-slate-800 hover:border-slate-400 dark:border-slate-600 dark:text-slate-100 dark:hover:border-slate-400")
                          }
                        >
                          ${p}
                        </button>
                      );
                    })}
                  </div>
                  <label htmlFor="donate-custom" className="sr-only">{t(lang, "donate.amount.custom")}</label>
                  <div className="relative mt-2">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[15px] text-slate-500 dark:text-slate-400">$</span>
                    <input
                      id="donate-custom"
                      type="number"
                      inputMode="decimal"
                      min={MIN_AMOUNT}
                      step="1"
                      value={custom}
                      onChange={(e) => setCustom(e.target.value)}
                      placeholder={`${t(lang, "donate.amount.custom")} (min $${MIN_AMOUNT})`}
                      className={`${inputCls} pl-6 ${custom ? "border-primary dark:border-primary-200" : ""}`}
                    />
                  </div>
                </>
              )}
              {errors.amount && <p className={errCls}>{errors.amount}</p>}

              {uyelik && !locked && (
                <div className="mt-3">
                  {!couponOpen ? (
                    <button
                      type="button"
                      onClick={() => setCouponOpen(true)}
                      className="text-sm text-slate-600 underline underline-offset-2 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                    >
                      {t(lang, "donate.student.toggle")}
                    </button>
                  ) : (
                    <div>
                      <label htmlFor="donate-coupon" className={labelCls}>{t(lang, "donate.student.toggle")}</label>
                      <div className="flex gap-2">
                        <input
                          id="donate-coupon"
                          value={couponInput}
                          onChange={(e) => setCouponInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                          placeholder={t(lang, "donate.student.code")}
                          className={inputCls}
                        />
                        <button
                          type="button"
                          onClick={applyCoupon}
                          className="whitespace-nowrap rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-800 hover:border-slate-400 dark:border-slate-600 dark:text-slate-100"
                        >
                          {t(lang, "donate.student.apply")}
                        </button>
                      </div>
                      {couponMsg && !couponMsg.ok && <p className={errCls}>{couponMsg.text}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <SectionLabel lang={lang}>{t(lang, "donate.label.details")}</SectionLabel>
              <div className="mt-3 space-y-4">
                <div>
                  <label htmlFor="donate-name" className={labelCls}>{t(lang, "donate.field.name")}</label>
                  <input
                    id="donate-name"
                    autoComplete="name"
                    value={donor.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={inputCls}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className={errCls}>{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="donate-email" className={labelCls}>{t(lang, "donate.field.email")}</label>
                  <input
                    id="donate-email"
                    type="email"
                    autoComplete="email"
                    value={donor.email}
                    onChange={(e) => setField("email", e.target.value)}
                    className={inputCls}
                    aria-invalid={!!errors.email}
                    aria-describedby="donate-email-hint"
                  />
                  {errors.email ? (
                    <p className={errCls}>{errors.email}</p>
                  ) : (
                    <p id="donate-email-hint" className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t(lang, "donate.field.emailHint")}</p>
                  )}
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
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-5 dark:border-slate-700 sm:p-7">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t(lang, "donate.total")}</span>
              <span className="font-display text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {amountText}{" "}
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">CAD{uyelik ? t(lang, "donate.perYear") : ""}</span>
              </span>
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-md bg-accent px-6 py-3.5 text-base font-semibold text-white transition hover:bg-accent-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-primary-800"
            >
              {t(lang, "donate.continue")}
            </button>
            <p className="mt-4 flex gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 1.5a4 4 0 0 0-4 4V8H5a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2h-1V5.5a4 4 0 0 0-4-4Zm2.5 6.5V5.5a2.5 2.5 0 0 0-5 0V8h5Z" clipRule="evenodd" />
              </svg>
              {t(lang, "donate.trust")}
            </p>
          </div>
        </form>

        <StoryText lang={lang} className="lg:hidden" />
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
