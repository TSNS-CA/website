import { useState } from "react";
import { Link } from "react-router-dom";
import { t, upper } from "../i18n";
import { socials, departments } from "../content";
import { Container, Button } from "./ui";
import SocialLinks from "./SocialIcons";

function Newsletter({ lang }) {
  const tr = lang === "tr";
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const name = form.elements.name.value;
    const email = form.elements.email.value;
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || (tr ? "Bir hata oluştu." : "Something went wrong."));
      setDone(true);
    } catch (err) {
      setError(err.message);
    }
  }

  if (done) {
    return (
      <p className="rounded-xl bg-white/10 p-4 text-sm font-medium text-white">
        ✓ {t(lang, "newsletter.thanks")}
      </p>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          required
          name="name"
          type="text"
          placeholder={t(lang, "newsletter.name")}
          aria-label={t(lang, "newsletter.name")}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-300 focus:border-gold focus:outline-none"
        />
        <input
          required
          name="email"
          type="email"
          placeholder={t(lang, "newsletter.email")}
          aria-label={t(lang, "newsletter.email")}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-slate-300 focus:border-gold focus:outline-none"
        />
      </div>
      <label className="flex items-start gap-2 text-xs text-slate-300">
        <input required type="checkbox" className="mt-0.5 accent-gold" />
        {t(lang, "newsletter.consent")}
      </label>
      {error && <p className="text-xs font-semibold text-red-300">{error}</p>}
      <Button type="submit" variant="solidWhite" size="sm">
        {t(lang, "action.subscribe")}
      </Button>
    </form>
  );
}

export default function Footer({ lang }) {
  // Halifax'ta yılbaşı, UTC'de çoktan yeni yıl olduğu için 31 Aralık akşamı
  // altbilgi bir sonraki yılı gösteriyordu.
  const year = new Date().toLocaleDateString("en-CA", { timeZone: "America/Halifax", year: "numeric" });
  return (
    <footer className="border-t-4 border-accent bg-primary-900 text-slate-200">
      <Container className="py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* About */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5">
              <img src="/tsns.jpeg" alt="" className="h-10 w-10 rounded-lg border-2 border-gold bg-white p-1 object-contain" />
              <span className="text-base font-extrabold text-white">{t(lang, "brand.full")}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-slate-300">{t(lang, "footer.about")}</p>
            <p className="mt-4 text-xs text-slate-400">{t(lang, "footer.madeWith")}</p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white">
              {upper(lang, t(lang, "footer.quickLinks"))}
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link to="/" className="text-slate-300 hover:text-white">{t(lang, "nav.home")}</Link></li>
              <li><Link to="/about" className="text-slate-300 hover:text-white">{t(lang, "nav.about")}</Link></li>
              <li><Link to="/bagis" className="text-slate-300 hover:text-white">{t(lang, "action.donate")}</Link></li>
              <li><Link to="/gonullu" className="text-slate-300 hover:text-white">{t(lang, "action.volunteer")}</Link></li>
              <li><Link to="/contact" className="text-slate-300 hover:text-white">{t(lang, "nav.contact")}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white">{upper(lang, t(lang, "footer.contact"))}</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {departments.map((d) => (
                <li key={d.email}>
                  <a href={`mailto:${d.email}`} className="text-slate-300 hover:text-white">{d.email}</a>
                </li>
              ))}
            </ul>
            <h3 className="mt-6 text-sm font-bold tracking-wider text-white">{upper(lang, t(lang, "footer.follow"))}</h3>
            <div className="mt-3">
              <SocialLinks socials={socials} />
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-sm font-bold tracking-wider text-white">{upper(lang, t(lang, "newsletter.title"))}</h3>
            <p className="mt-4 text-sm text-slate-300">{t(lang, "newsletter.body")}</p>
            <div className="mt-4">
              <Newsletter lang={lang} />
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-400">
          {t(lang, "footer.rights", { year })}
        </div>
      </Container>
    </footer>
  );
}
