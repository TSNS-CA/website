import { useEffect, useRef, useState } from "react";

const APP_ID = import.meta.env.VITE_SQUARE_APPLICATION_ID;
const LOCATION_ID = import.meta.env.VITE_SQUARE_LOCATION_ID;
const SQUARE_ENV = import.meta.env.VITE_SQUARE_ENV || "sandbox";
const SDK_URL =
  SQUARE_ENV === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

function loadSquareSdk() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.Square) return Promise.resolve(window.Square);
  const existing = document.querySelector(`script[data-square-sdk="1"]`);
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(window.Square));
      existing.addEventListener("error", () => reject(new Error("Failed to load Square SDK")));
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.dataset.squareSdk = "1";
    script.onload = () => resolve(window.Square);
    script.onerror = () => reject(new Error("Failed to load Square SDK"));
    document.head.appendChild(script);
  });
}

export default function DonationCheckout({
  frequency, // 'one_time' | 'monthly' | 'yearly'
  amountCents, // integer (one-time only; recurring uses plan)
  amountLabel, // e.g. "$25.00" or "$5.00/ay"
  buyer, // { name, email, phone }
  onClose,
  onSuccess,
  lang = "tr",
}) {
  const cardRef = useRef(null);
  const cardBoxRef = useRef(null);
  const appleBtnRef = useRef(null);
  const appleInstRef = useRef(null);
  const processingRef = useRef(false);

  const [sdkReady, setSdkReady] = useState(false);
  const [appleReady, setAppleReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let card;
    let applePay;

    async function init() {
      if (!APP_ID || !LOCATION_ID) {
        setInitError(lang === "tr" ? "Ödeme yapılandırılmamış." : "Payments are not configured.");
        return;
      }
      try {
        const Square = await loadSquareSdk();
        if (cancelled) return;
        const payments = Square.payments(APP_ID, LOCATION_ID);

        card = await payments.card();
        if (cancelled) return;
        await card.attach(cardBoxRef.current);
        if (cancelled) {
          try { await card.destroy(); } catch (e) {}
          return;
        }
        cardRef.current = card;

        // Apple Pay (optional — only shows on supported browsers/devices)
        try {
          const req = payments.paymentRequest({
            countryCode: "CA",
            currencyCode: "CAD",
            total: {
              label: "TSNS Donation",
              amount: (amountCents / 100).toFixed(2),
              pending: false,
            },
          });
          applePay = await payments.applePay(req);
          if (!cancelled && appleBtnRef.current) {
            await applePay.attach(appleBtnRef.current);
            appleInstRef.current = applePay;
            appleBtnRef.current.addEventListener("click", onApplePayClick);
            if (!cancelled) setAppleReady(true);
          }
        } catch (e) {
          // Apple Pay not supported in this browser — silently skip.
        }

        if (!cancelled) setSdkReady(true);
      } catch (err) {
        console.error("Square SDK init failed", err);
        if (!cancelled) setInitError(lang === "tr" ? "Kart formu yüklenemedi." : "Could not load the card form.");
      }
    }

    async function onApplePayClick(e) {
      e.preventDefault();
      if (processingRef.current || !appleInstRef.current) return;
      await runTokenize(() => appleInstRef.current.tokenize());
    }

    init();
    return () => {
      cancelled = true;
      if (appleBtnRef.current) appleBtnRef.current.removeEventListener("click", onApplePayClick);
      if (card) card.destroy().catch(() => {});
      if (applePay && applePay.destroy) applePay.destroy().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function charge(sourceId) {
    const isOneTime = frequency === "one_time";
    const url = isOneTime ? "/api/create-payment" : "/api/create-subscription";
    const body = isOneTime
      ? { sourceId, amountCents, currency: "CAD", buyer }
      : { sourceId, frequency, buyer };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || (lang === "tr" ? "Kartınızdan çekilemedi." : "Your card could not be charged."));
    return data;
  }

  async function runTokenize(tokenizeFn) {
    setPayError(null);
    setProcessing(true);
    processingRef.current = true;
    try {
      const result = await tokenizeFn();
      if (result.status !== "OK") {
        setPayError(result.errors?.[0]?.message || (lang === "tr" ? "Kart bilgilerini kontrol edin." : "Please check your card details."));
        setProcessing(false);
        processingRef.current = false;
        return;
      }
      const data = await charge(result.token);
      onSuccess(data);
    } catch (err) {
      console.error("Payment failed", err);
      setPayError(err.message || (lang === "tr" ? "Bir hata oluştu." : "Something went wrong."));
      setProcessing(false);
      processingRef.current = false;
    }
  }

  const isRecurring = frequency === "monthly" || frequency === "yearly";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-primary-800 dark:text-slate-100 sm:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-primary dark:text-white">
              {lang === "tr" ? "Bağış" : "Donate"} · {amountLabel}
            </h2>
            {isRecurring && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                {frequency === "monthly"
                  ? lang === "tr" ? "Her ay otomatik yenilenir." : "Auto-renews every month."
                  : lang === "tr" ? "Her yıl otomatik yenilenir." : "Auto-renews every year."}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            aria-label={lang === "tr" ? "Kapat" : "Close"}
            className="rounded-full p-1 text-slate-400 hover:text-slate-700 disabled:opacity-50 dark:hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" /></svg>
          </button>
        </div>

        {/* Apple Pay */}
        {appleReady && (
          <div className="mb-3">
            <div
              ref={appleBtnRef}
              className="apple-pay-button"
              style={{ height: 48, width: "100%" }}
              role="button"
              aria-label="Apple Pay"
              lang="en"
            />
            <div className="my-3 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
              {lang === "tr" ? "veya" : "or"}
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-600" />
            </div>
          </div>
        )}

        {/* Card */}
        <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          {lang === "tr" ? "Kart bilgileri" : "Card details"}
        </p>
        <div
          ref={cardBoxRef}
          className="min-h-[56px] rounded-lg border border-slate-300 bg-white p-3 dark:border-slate-600 dark:bg-primary-700"
          style={{ background: sdkReady ? undefined : "#f8fafc" }}
        />
        {!sdkReady && !initError && (
          <p className="mt-2 text-xs text-slate-500">{lang === "tr" ? "Güvenli kart formu yükleniyor…" : "Loading secure card form…"}</p>
        )}
        {initError && <p className="mt-2 text-xs text-accent">{initError}</p>}

        {SQUARE_ENV !== "production" && (
          <div className="mt-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-primary-700">
            <p className="font-semibold">{lang === "tr" ? "Sandbox test kartı" : "Sandbox test card"}</p>
            <p>4111 1111 1111 1111 · {lang === "tr" ? "ileriki son kullanma, herhangi CVV" : "any future expiry, any CVV"}</p>
          </div>
        )}

        {payError && (
          <div className="mt-3 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent-700 dark:text-accent-300">
            {payError}
          </div>
        )}

        <button
          onClick={() => runTokenize(() => cardRef.current && cardRef.current.tokenize())}
          disabled={processing || !sdkReady}
          className="mt-4 w-full rounded-full bg-accent px-6 py-3 font-semibold text-white transition hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {processing
            ? lang === "tr" ? "İşleniyor…" : "Processing…"
            : lang === "tr" ? "Bağış Yap" : "Donate"}
        </button>

        <p className="mt-3 text-center text-xs text-slate-400">
          🔒 {lang === "tr" ? "Ödeme Square altyapısı ile güvenle işlenir." : "Payments processed securely by Square."}
        </p>
      </div>
    </div>
  );
}
