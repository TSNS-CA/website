import { useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { t } from "../i18n";
import { Section, Eyebrow, Button } from "../components/ui";
import Turnstile, { turnstileEnabled } from "../components/Turnstile";
import { usePageMeta } from "../lib/usePageMeta";
import { getSurvey, cleanRatings, COMMENT_MAX, FEEDBACK_CATEGORIES } from "../content/feedback.js";

// /geri-bildirim/:slug — anonim etkinlik anketi. E-postadaki yıldız linkleri
// (?yemek=4 gibi) o puanı seçili getirir; ziyaretçi kalanları doldurup gönderir.

const cardCls =
  "rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-primary-800 sm:p-7";

function StarRow({ lang, catKey, value, onChange }) {
  const [hover, setHover] = useState(0);
  const cat = FEEDBACK_CATEGORIES[catKey];
  const label = cat.label[lang];
  const shown = hover || value || 0;
  return (
    <div className="flex flex-col gap-1 border-b border-slate-100 py-3.5 last:border-b-0 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
      <p id={`fb-${catKey}`} className="font-medium text-slate-800 dark:text-slate-100">{label}</p>
      <div role="radiogroup" aria-labelledby={`fb-${catKey}`} className="flex gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={t(lang, "feedback.rateAria", { label, n })}
            onClick={() => onChange(catKey, value === n ? undefined : n)}
            onMouseEnter={() => setHover(n)}
            className={`h-11 w-10 rounded text-[28px] leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-primary-200 ${
              n <= shown ? "text-gold-dark dark:text-gold" : "text-slate-300 dark:text-slate-600"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FeedbackPage({ lang }) {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const survey = getSurvey(slug);

  const [ratings, setRatings] = useState(() =>
    survey ? cleanRatings(survey, Object.fromEntries(params.entries())) : {}
  );
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef(null);

  usePageMeta({
    title: survey ? `${t(lang, "feedback.title")} — ${survey.event.title[lang]}` : t(lang, "feedback.eyebrow"),
    description: t(lang, "feedback.intro"),
  });

  function setRating(key, n) {
    setRatings((r) => {
      const next = { ...r };
      if (n) next[key] = n;
      else delete next[key];
      return next;
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (Object.keys(ratings).length === 0 && !comment.trim()) {
      setError(t(lang, "feedback.empty"));
      return;
    }
    if (turnstileEnabled && !turnstileToken) {
      setError(t(lang, "turnstile.wait"));
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: slug, ratings, comment, lang, turnstileToken: turnstileToken || undefined }),
      });
      turnstileRef.current?.reset();
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || t(lang, "feedback.error"));
      setStatus("done");
      window.scrollTo({ top: 0 });
    } catch (err) {
      setStatus("error");
      setError(err.message);
    }
  }

  if (!survey || !survey.open) {
    return (
      <Section className="py-24">
        <div className={`mx-auto max-w-xl text-center ${cardCls}`}>
          <p className="text-slate-700 dark:text-slate-200">{t(lang, survey ? "feedback.closed" : "feedback.notFound")}</p>
          <div className="mt-6">
            <Button to="/etkinlikler" variant="secondary">{t(lang, "action.upcomingEvents")}</Button>
          </div>
        </div>
      </Section>
    );
  }

  if (status === "done") {
    return (
      <Section className="py-24">
        <div className={`mx-auto max-w-xl text-center ${cardCls}`}>
          <h1 className="mt-4 font-display text-2xl font-extrabold text-slate-900 dark:text-white">{t(lang, "feedback.thanksTitle")}</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">{t(lang, "feedback.thanksBody")}</p>
          <div className="mt-6">
            <Button to="/etkinlikler" variant="secondary">{t(lang, "action.upcomingEvents")}</Button>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <Section className="py-16 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-5">
          {survey.event.poster?.src && (
            <img
              src={survey.event.poster.src}
              alt=""
              className="hidden w-24 shrink-0 rounded-md border border-slate-200 dark:border-slate-700 sm:block"
            />
          )}
          <div>
            <Eyebrow lang={lang}>{t(lang, "feedback.eyebrow")}</Eyebrow>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              {t(lang, "feedback.title")}
            </h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">{survey.event.title[lang]}</p>
          </div>
        </div>
        <p className="mt-6 leading-relaxed text-slate-700 dark:text-slate-300">{t(lang, "feedback.intro")}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t(lang, "feedback.anon")}</p>

        <form onSubmit={onSubmit} className={`mt-8 ${cardCls}`}>
          <div>
            {survey.categories.map((key) => (
              <StarRow key={key} lang={lang} catKey={key} value={ratings[key]} onChange={setRating} />
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{t(lang, "feedback.scale")}</p>

          <label htmlFor="fb-comment" className="mt-8 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t(lang, "feedback.comment")}
          </label>
          <textarea
            id="fb-comment"
            rows={4}
            maxLength={COMMENT_MAX}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t(lang, "feedback.commentPlaceholder")}
            className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-primary-700 dark:text-white"
          />

          <Turnstile ref={turnstileRef} lang={lang} onToken={setTurnstileToken} className="mt-6" />

          {error && <div className="surface-red mt-4 rounded-lg border border-accent/30 p-3 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={status === "sending"}
            className="mt-6 w-full rounded-md bg-accent px-8 py-3 font-semibold text-white transition hover:bg-accent-600 disabled:opacity-60 sm:w-auto"
          >
            {status === "sending" ? t(lang, "feedback.sending") : t(lang, "feedback.submit")}
          </button>
        </form>
      </div>
    </Section>
  );
}
