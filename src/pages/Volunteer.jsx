import { useState } from "react";
import { t } from "../i18n";
import { Section, Eyebrow, Button } from "../components/ui";

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-primary-700 dark:text-white";

export default function VolunteerPage({ lang }) {
  const tr = lang === "tr";
  const [form, setForm] = useState({ name: "", email: "", phone: "", interests: "" });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [serverError, setServerError] = useState("");

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const er = {};
    if (!form.name.trim()) er.name = tr ? "Ad gerekli" : "Name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) er.email = tr ? "Geçerli e-posta gerekli" : "Valid email required";
    setErrors(er);
    if (Object.keys(er).length) return;

    setStatus("sending");
    setServerError("");
    try {
      const res = await fetch("/api/volunteer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || (tr ? "Bir hata oluştu." : "Something went wrong."));
      setStatus("done");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setStatus("error");
      setServerError(err.message);
    }
  }

  if (status === "done") {
    return (
      <Section className="py-24">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-card dark:border-slate-800 dark:bg-primary-800">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-3xl">✅</div>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900 dark:text-white">
            {tr ? "Teşekkürler!" : "Thank you!"}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {tr ? "Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz." : "Your application was received. We'll be in touch soon."}
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

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {tr ? "Ad Soyad *" : "Full name *"}
            </label>
            <input required type="text" value={form.name} onChange={(e) => setField("name", e.target.value)} className={inputCls} placeholder={tr ? "Adınız" : "Your name"} />
            {errors.name && <p className="mt-1 text-xs text-accent">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {tr ? "E-posta *" : "Email *"}
              </label>
              <input required type="email" value={form.email} onChange={(e) => setField("email", e.target.value)} className={inputCls} placeholder="you@email.com" />
              {errors.email && <p className="mt-1 text-xs text-accent">{errors.email}</p>}
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                {tr ? "Telefon" : "Phone"}
              </label>
              <input type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} placeholder="+1 (555) 000-0000" />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {tr ? "İlgi alanlarınız / katkıda bulunabileceğiniz alanlar" : "Your interests / how you'd like to help"}
            </label>
            <textarea rows={4} value={form.interests} onChange={(e) => setField("interests", e.target.value)} className={inputCls} placeholder={tr ? "Etkinlikler, sosyal medya, çeviri..." : "Events, social media, translation..."} />
          </div>

          {status === "error" && (
            <div className="rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent">{serverError}</div>
          )}

          <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto" >
            {status === "sending" ? (tr ? "Gönderiliyor…" : "Sending…") : tr ? "Başvur" : "Apply"}
          </Button>
        </form>
      </div>
    </Section>
  );
}
