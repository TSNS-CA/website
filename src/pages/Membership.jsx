import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import MembershipForm from "../components/MembershipForm";
import PaymentModal from "../components/PaymentModal";

export default function Membership() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [formData, setFormData] = useState(null);

  async function handleSubmit(data) {
    setFormData(data);
    setShowPayment(true);
  }

  async function handlePaymentConfirm() {
    setLoading(true);
    try {
      // Store membership data and navigate to confirmation
      sessionStorage.setItem("membershipData", JSON.stringify(formData));
      navigate("/confirmation");
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "40px 0" }}>
      <div className="container">
        <h1 style={{ textAlign: "center", color: "#16466A", marginBottom: "40px" }}>
          Become a Member
        </h1>
        <MembershipForm onSubmit={handleSubmit} loading={loading} />
      </div>

      {showPayment && formData && (
        <PaymentModal
          amount={formData.amount}
          onClose={() => setShowPayment(false)}
          onConfirm={handlePaymentConfirm}
          loading={loading}
        />
      )}
    </main>
  );
}
