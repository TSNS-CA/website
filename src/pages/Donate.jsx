import { useState } from "react";
import { t } from "../i18n";
import { Section, Eyebrow, Button } from "../components/ui";
import DonationCheckout from "../components/DonationCheckout";

const PRESETS = [10, 25, 50, 100];
const MIN_AMOUNT = 10;

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-primary-700 dark:text-white";

export default function DonatePage({ lang }) {
  const tr = lang === "tr";
  const [frequency, setFrequency] = useState("yearly"); // 'yearly' | 'one_time'
  const [preset, setPreset] = useState(25);
  const [custom, setCustom] = useState("");
  const [donor, setDonor] = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState(null); // { amountCents } when applied
  const [couponMsg, setCouponMsg] = useState(null); // { ok, text }
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(null);

  const locked = !!coupon;

  const amountCents = coupon ? coupon.amountCents : (custom ? Math.round(parseFloat(custom) * 100) : preset * 100);
  const amountLabel =
    "$" + (amountCents / 100).toFixed(2) + (frequency === "yearly" ? (tr ? "/yıl" : "/yr") : "");

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
      if (data.valid) {
        setCoupon(data);
        setFrequency("yearly");
        setCouponMsg({ ok: true, text: tr ? "Öğrenci indirimi uygulandı: Yıllık üyelik $5." : "Student discount applied: Yearly $5." });
      } else {
        setCouponMsg({ ok: false, text: tr ? "Geçersiz kod." : "Invalid code." });
      }
    } catch (e) {
      setCouponMsg({ ok: false, text: tr ? "Kupon doğrulanamadı." : "Could not verify code." });
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
    setCouponMsg(null);
  }

  function validate() {
    const e = {};
    if (!donor.name.trim()) e.name = tr ? "Ad gerekli" : "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor.email)) e.email = tr ? "Geçerli e-posta gerekli" : "Valid email required";
    if (!coupon && custom && parseFloat(custom) < MIN_AMOUNT) e.amount = tr ? `En az $${MIN_AMOUNT}` : `Minimum $${MIN_AMOUNT}`;
    return e;
  }

  function onSubmit(ev) {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setCheckout(true);
  }

  if (done) {
    return (
      <Section className="py-24">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card dark:border-slate-800 dark:bg-primary-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-3xl">💚</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {tr ? "Çok teşekkürler!" : "Thank you so much!"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {tr
              ? `${done.name}, bağışınız alındı. Nova Scotia Türk Derneği olarak Türk mirasını ve kültürünü Nova Scotia genelinde yaşatıyor; insanları bir araya getiriyoruz. Desteğiniz için minnettarız.`
              : `${done.name}, your gift was received. As the Nova Scotia Türk Derneği, we sustain Turkish heritage and culture across Nova Scotia, bringing people together. Thank you.`}
          </p>
          {done.receiptUrl && (
            <p className="mt-3 text-sm">
              <a className="font-semibold text-brand hover:underline" href={done.receiptUrl} target="_blank" rel="noreferrer">
                {tr ? "Makbuzu gör" : "View receipt"}
              </a>
            </p>
          )}
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">{tr ? "Üyelik bilgileri e-posta ile gönderildi." : "Membership details have been emailed."}</p>
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
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{tr ? "Sıklık" : "Frequency"}</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "yearly", label: tr ? "Yıllık Üyelik" : "Yearly Membership", sub: tr ? "Her yıl yenilenir" : "Renews yearly" },
                { id: "one_time", label: tr ? "Tek Seferlik" : "One-time", sub: tr ? "1 yıl üyelik, yenilenmez" : "1 year, no renewal" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => chooseFrequency(f.id)}
                  className={
                    "rounded-xl border p-3 text-center transition " +
                    (frequency === f.id
                      ? "border-accent bg-accent/10 ring-1 ring-accent"
                      : "border-slate-300 hover:border-accent dark:border-slate-700")
                  }
                >
                  <span className="block text-sm font-bold text-slate-900 dark:text-white">{f.label}</span>
                  <span className="block text-[11px] text-slate-600 dark:text-slate-300">{f.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
              {tr ? `Tutar (CAD)${frequency === "yearly" ? " · yıllık" : ""}` : `Amount (CAD)${frequency === "yearly" ? " · yearly" : ""}`}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={locked}
                  onClick={() => { setPreset(p); setCustom(""); }}
                  className={
                    "rounded-lg border py-2 text-sm font-semibold transition disabled:opacity-60 " +
                    (!custom && preset === p
                      ? "border-accent bg-accent/10 text-brand-red ring-1 ring-accent"
                      : "border-slate-300 text-slate-700 hover:border-accent dark:border-slate-700 dark:text-slate-200")
                  }
                >
                  ${p}
                </button>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">$</span>
              <input
                type="number"
                min={MIN_AMOUNT}
                step="1"
                disabled={locked}
                value={locked ? "" : custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder={tr ? `Özel tutar (min $${MIN_AMOUNT})` : `Custom amount (min $${MIN_AMOUNT})`}
                className={inputCls}
              />
            </div>
            {errors.amount && <p className="mt-1 text-xs font-semibold text-brand-red">{errors.amount}</p>}
          </div>

          {/* Donor info */}
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{tr ? "Ad Soyad *" : "Full name *"}</label>
              <input value={donor.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder={tr ? "Adınız" : "Your name"} />
              {errors.name && <p className="mt-1 text-xs font-semibold text-brand-red">{errors.name}</p>}
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{tr ? "E-posta *" : "Email *"}</label>
                <input value={donor.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="you@email.com" />
                {errors.email && <p className="mt-1 text-xs font-semibold text-brand-red">{errors.email}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">{tr ? "Telefon" : "Phone"}</label>
                <input value={donor.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} placeholder="+1 (555) 000-0000" />
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{tr ? "Üyelik bilgileriniz bu e-postaya gönderilecek." : "Membership details will be sent to this email."}</p>
          </div>

          {/* Student coupon — yearly membership only */}
          {frequency === "yearly" && (
          <div className="rounded-xl border border-slate-200 bg-cream-200/60 p-4 dark:border-slate-700 dark:bg-primary-700/40">
            {coupon ? (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-primary dark:text-white">
                  🎓 {couponMsg?.text}
                </p>
                <button type="button" onClick={removeCoupon} className="text-xs font-semibold text-slate-600 hover:text-accent-600 dark:text-slate-300 dark:hover:text-accent-300">
                  {tr ? "Kaldır" : "Remove"}
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  🎓 {tr ? "Öğrenci misiniz? Yıllık $5 ile üye olun" : "Student? Join yearly for $5"}
                </p>
                <div className="mt-2 flex gap-2">
                  <input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={tr ? "İndirim kodu" : "Discount code"}
                    className={inputCls}
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={applyCoupon} className="whitespace-nowrap">
                    {tr ? "Uygula" : "Apply"}
                  </Button>
                </div>
                {couponMsg && !couponMsg.ok && <p className="mt-1 text-xs font-semibold text-brand-red">{couponMsg.text}</p>}
              </>
            )}
          </div>
          )}

          <button type="submit" className="w-full rounded-full bg-accent px-6 py-3 font-bold text-white transition hover:bg-accent-600">
            {tr ? "Devam Et" : "Continue"} · {amountLabel}
          </button>
          <p className="text-center text-xs text-slate-600 dark:text-slate-400">🔒 {tr ? "Ödeme Square ile güvenle işlenir." : "Secure payment by Square."}</p>
        </form>
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
            setDone({ ...donor, receiptUrl: data.receiptUrl });
            setCheckout(false);
            window.scrollTo({ top: 0 });
          }}
        />
      )}
    </Section>
  );
}
