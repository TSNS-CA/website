import React, { useState } from "react";

export default function PaymentModal({ amount, onClose, onConfirm, loading }) {
  const [selectedMethod, setSelectedMethod] = useState("card");
  const [processing, setProcessing] = useState(false);

  async function handlePay() {
    setProcessing(true);
    // Mock payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    onConfirm();
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

        <div style={{ marginBottom: "24px" }}>
          <p style={{ fontWeight: "600", color: "#0f172a", marginBottom: "12px" }}>
            Select Payment Method
          </p>

          {[
            { id: "card", label: "💳 Credit/Debit Card", icon: "💳" },
            { id: "apple", label: "🍎 Apple Pay", icon: "🍎" },
            { id: "google", label: "🔵 Google Pay", icon: "🔵" }
          ].map(method => (
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              style={{
                padding: "12px 16px",
                border: selectedMethod === method.id ? "2px solid #16466A" : "1px solid #cbd5e1",
                borderRadius: "8px",
                marginBottom: "10px",
                cursor: "pointer",
                background: selectedMethod === method.id ? "#f0f4f8" : "white",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                transition: "all 120ms"
              }}
            >
              <input
                type="radio"
                name="payment-method"
                checked={selectedMethod === method.id}
                onChange={() => setSelectedMethod(method.id)}
                style={{ cursor: "pointer" }}
              />
              <label style={{ flex: 1, cursor: "pointer", fontWeight: "500" }}>
                {method.label}
              </label>
            </div>
          ))}
        </div>

        {selectedMethod === "card" && (
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem", color: "#64748b" }}>
            <p style={{ margin: "0 0 8px 0" }}>💡 Test Card: 4242 4242 4242 4242</p>
            <p style={{ margin: "0 0 8px 0" }}>Exp: 12/26 | CVC: 123</p>
          </div>
        )}

        {selectedMethod === "apple" && (
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem", color: "#64748b" }}>
            <p style={{ margin: 0 }}>🍎 Apple Pay will open on a real device or Safari.</p>
          </div>
        )}

        {selectedMethod === "google" && (
          <div style={{ background: "#f8fafc", padding: "16px", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem", color: "#64748b" }}>
            <p style={{ margin: 0 }}>🔵 Google Pay will open on Chrome or Android devices.</p>
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
              cursor: "pointer",
              fontWeight: "600",
              color: "#0f172a"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={processing}
            style={{
              flex: 1,
              padding: "12px 16px",
              background: processing ? "#cbd5e1" : "#16466A",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: processing ? "not-allowed" : "pointer",
              fontWeight: "600",
              fontSize: "1rem"
            }}
          >
            {processing ? "Processing..." : "Pay Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
