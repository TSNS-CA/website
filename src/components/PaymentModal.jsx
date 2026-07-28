import React, { useEffect, useRef, useState } from "react";

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

export default function PaymentModal({ amount, buyer, onClose, onConfirm }) {
  const cardRef = useRef(null);
  const cardContainerRef = useRef(null);
  const applePayRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [applePayReady, setApplePayReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let cardInstance = null;
    let applePayInstance = null;

    async function init() {
      if (!APP_ID || !LOCATION_ID) {
        setInitError("Payments are not configured. Please contact us.");
        return;
      }
      try {
        const Square = await loadSquareSdk();
        if (cancelled) return;
        const payments = Square.payments(APP_ID, LOCATION_ID);

        cardInstance = await payments.card();
        if (cancelled) return;
        await cardInstance.attach(cardContainerRef.current);
        if (cancelled) {
          try { await cardInstance.destroy(); } catch {}
          return;
        }
        cardRef.current = cardInstance;
        setSdkReady(true);

        try {
          const req = payments.paymentRequest({
            countryCode: "CA",
            currencyCode: "CAD",
            total: { amount: parseFloat(amount).toFixed(2), label: "TSNS Membership" },
          });
          applePayInstance = await payments.applePay(req);
          if (cancelled) {
            try { await applePayInstance.destroy(); } catch {}
            return;
          }
          applePayRef.current = applePayInstance;
          setApplePayReady(true);
        } catch {
          // Apple Pay is not available on this browser/device — silently skip.
        }
      } catch (err) {
        console.error("Square SDK init failed", err);
        if (!cancelled) setInitError("Could not load the card form. Please refresh.");
      }
    }

    init();

    return () => {
      cancelled = true;
      const card = cardRef.current;
      const applePay = applePayRef.current;
      cardRef.current = null;
      applePayRef.current = null;
      if (card) card.destroy().catch(() => {});
      if (applePay) applePay.destroy().catch(() => {});
    };
  }, []);

  async function chargeWithToken(sourceId) {
    const amountCents = Math.round(parseFloat(amount) * 100);
    const res = await fetch("/api/create-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId, amountCents, currency: "CAD", buyer }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) {
      throw new Error(data.error || "Your card could not be charged.");
    }
    return data;
  }

  async function handleCardPay() {
    if (!cardRef.current || processing) return;
    setPayError(null);
    setProcessing(true);
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK") {
        setPayError(result.errors?.[0]?.message || "Please check your card details.");
        setProcessing(false);
        return;
      }
      const data = await chargeWithToken(result.token);
      onConfirm(data);
    } catch (err) {
      console.error("Card payment failed", err);
      setPayError(err.message || "Something went wrong. Please try again.");
      setProcessing(false);
    }
  }

  async function handleApplePay() {
    if (!applePayRef.current || processing) return;
    setPayError(null);
    setProcessing(true);
    try {
      const result = await applePayRef.current.tokenize();
      if (result.status !== "OK") {
        // "CANCEL" means the user dismissed the Apple sheet — no error message needed.
        if (result.status !== "CANCEL") {
          setPayError(result.errors?.[0]?.message || "Apple Pay could not be completed.");
        }
        setProcessing(false);
        return;
      }
      const data = await chargeWithToken(result.token);
      onConfirm(data);
    } catch (err) {
      console.error("Apple Pay failed", err);
      setPayError(err.message || "Something went wrong. Please try again.");
      setProcessing(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(0,0,0,0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 999
    }}>
      <style>{`
        .tsns-apple-pay-btn {
          -webkit-appearance: -apple-pay-button;
          -apple-pay-button-type: buy;
          -apple-pay-button-style: black;
          display: block;
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 8px;
          padding: 0;
          margin: 0;
        }
        .tsns-apple-pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }
      `}</style>
      <div style={{
        background: "white",
        borderRadius: "12px",
        padding: "32px",
        maxWidth: "480px",
        width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)"
      }}>
        <h2 style={{ color: "#16466A", marginTop: 0, marginBottom: "24px" }}>
          Pay C${parseFloat(amount).toFixed(2)}
        </h2>

        {applePayReady && (
          <div style={{ marginBottom: "20px" }}>
            <button
              type="button"
              onClick={handleApplePay}
              disabled={processing}
              className="tsns-apple-pay-btn"
              aria-label="Pay with Apple Pay"
            />
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              margin: "16px 0 4px",
              color: "#94a3b8",
              fontSize: "0.85rem"
            }}>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
              <span>or pay with card</span>
              <div style={{ flex: 1, height: "1px", background: "#e2e8f0" }} />
            </div>
          </div>
        )}

        <div style={{ marginBottom: "16px" }}>
          <p style={{ fontWeight: "600", color: "#0f172a", marginBottom: "12px" }}>
            Card details
          </p>
          <div
            ref={cardContainerRef}
            style={{
              minHeight: "56px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "10px 12px",
              background: sdkReady ? "white" : "#f8fafc"
            }}
          />
          {!sdkReady && !initError && (
            <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "8px" }}>
              Loading secure card form…
            </p>
          )}
          {initError && (
            <p style={{ color: "#E30A17", fontSize: "0.9rem", marginTop: "8px" }}>{initError}</p>
          )}
        </div>

        {SQUARE_ENV !== "production" && (
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.85rem", color: "#64748b" }}>
            <p style={{ margin: "0 0 4px 0" }}>Sandbox test card: 4111 1111 1111 1111</p>
            <p style={{ margin: 0 }}>Any future expiry, any 3-digit CVV, postal 12345</p>
          </div>
        )}

        {payError && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", padding: "10px 12px", borderRadius: "8px", marginBottom: "16px", color: "#991b1b", fontSize: "0.9rem" }}>
            {payError}
          </div>
        )}

        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            disabled={processing}
            style={{
              flex: 1,
              padding: "12px 16px",
              border: "1px solid #cbd5e1",
              background: "white",
              borderRadius: "6px",
              cursor: processing ? "not-allowed" : "pointer",
              fontWeight: "600",
              color: "#0f172a"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleCardPay}
            disabled={processing || !sdkReady}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: processing || !sdkReady ? "#cbd5e1" : "#16466A",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: processing || !sdkReady ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "1rem"
            }}
          >
            {processing ? "Processing…" : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
