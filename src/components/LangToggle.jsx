export default function LangToggle({ lang, onChange, className = "" }) {
  return (
    <div
      className={`inline-flex items-center rounded-full border border-slate-300 p-0.5 text-xs font-bold dark:border-slate-700 ${className}`}
      role="group"
      aria-label="Dil / Language"
    >
      {["tr", "en"].map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => onChange(l)}
          aria-pressed={lang === l}
          className={
            "rounded-full px-2.5 py-1 transition " +
            (lang === l
              ? "bg-primary text-white"
              : "text-slate-600 hover:text-primary dark:text-slate-300")
          }
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
