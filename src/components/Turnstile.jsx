import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

// Cloudflare Turnstile — insan doğrulaması (functions/_lib/guard.js).
//
// VITE_TURNSTILE_SITE_KEY build sırasında girilmemişse bileşen hiçbir şey
// çizmez ve `turnstileEnabled` false olur; sunucuda TURNSTILE_SECRET_KEY de
// girilmemişse koruma tamamen kapalıdır. İkisi birlikte açılmalı: bkz.
// docs/SETUP.md §4.4.
//
// "Managed" mod: çoğu ziyaretçi hiçbir şey görmez ya da tek bir onay kutusu
// görür. Token tek kullanımlıktır ve ~5 dakikada dolar; her gönderimden sonra
// `ref.current.reset()` çağırın.

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;
const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const turnstileEnabled = !!SITE_KEY;

let scriptPromise = null;
function loadScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_URL;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(window.turnstile);
    s.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load Turnstile"));
    };
    document.head.appendChild(s);
  });
  return scriptPromise;
}

const Turnstile = forwardRef(function Turnstile({ lang = "tr", onToken, className = "" }, ref) {
  const boxRef = useRef(null);
  const widgetRef = useRef(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current?.("");
      if (widgetRef.current != null && window.turnstile) window.turnstile.reset(widgetRef.current);
    },
  }));

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let cancelled = false;
    loadScript()
      .then((ts) => {
        if (cancelled || !boxRef.current) return;
        // Site, dark mode'u <html class="dark"> ile yönetiyor; Turnstile'ın
        // "auto"su ise sistem tercihine bakar. Sitenin seçimini veriyoruz.
        const dark = document.documentElement.classList.contains("dark");
        widgetRef.current = ts.render(boxRef.current, {
          sitekey: SITE_KEY,
          language: lang === "en" ? "en" : "tr",
          theme: dark ? "dark" : "light",
          size: "flexible",
          callback: (token) => onTokenRef.current?.(token),
          "expired-callback": () => onTokenRef.current?.(""),
          "error-callback": () => onTokenRef.current?.(""),
        });
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
      if (widgetRef.current != null && window.turnstile) {
        try { window.turnstile.remove(widgetRef.current); } catch (e) {}
      }
      widgetRef.current = null;
    };
  }, [lang]);

  if (!SITE_KEY) return null;
  return <div ref={boxRef} className={className} />;
});

export default Turnstile;
