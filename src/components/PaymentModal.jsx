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
  const [sdkReady, setSdkReady] = useState(false);
  const [initError, setInitError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let cardInstance = null;

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
      } catch (err) {
        console.error("Square SDK init failed", err);
        if (!cancelled) setInitError("Could not load the card form. Please refresh.");
      }
    }

    init();

    return () => {
      cancelled = true;
      const inst = cardRef.current;
      cardRef.current = null;
      if (inst) {
        inst.destroy().catch(() => {});
      }
    };
  }, []);

  async function handlePay() {
    if (!cardRef.current || processing) return;
    setPayError(null);
    setProcessing(true);
    try {
      const result = await cardRef.current.tokenize();
      if (result.status !== "OK") {
        const msg = result.errors?.[0]?.message || "Please check your card details.";
        setPayError(msg);
        setProcessing(false);
        return;
      }

      const amountCents = Math.round(parseFloat(amount) * 100);
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: result.token,
          amountCents,
          currency: "CAD",
          buyer,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setPayError(data.error || "Your card could not be charged.");
        setProcessing(false);
        return;
      }
      onConfirm(data);
    } catch (err) {
      console.error("Payment failed", err);
      setPayError("Something went wrong. Please try again.");
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
            onClick={handlePay}
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
