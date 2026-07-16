import React, { useState } from "react";

export default function MembershipForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    amount: "25"
  });
  const [errors, setErrors] = useState({});

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  function validate() {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Valid email required";
    if (!formData.phone.trim()) newErrors.phone = "Phone is required";
    if (!formData.amount || parseFloat(formData.amount) < 1) newErrors.amount = "Amount must be at least $1";
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    await onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: "500px", margin: "0 auto" }}>
      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#0f172a" }}>
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: errors.name ? "2px solid #E30A17" : "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "1rem",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
          placeholder="Your full name"
        />
        {errors.name && <p style={{ color: "#E30A17", fontSize: "0.9rem", marginTop: "4px" }}>{errors.name}</p>}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#0f172a" }}>
          Email *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: errors.email ? "2px solid #E30A17" : "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "1rem",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
          placeholder="your.email@example.com"
        />
        {errors.email && <p style={{ color: "#E30A17", fontSize: "0.9rem", marginTop: "4px" }}>{errors.email}</p>}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#0f172a" }}>
          Phone *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          disabled={loading}
          style={{
            width: "100%",
            padding: "10px 12px",
            border: errors.phone ? "2px solid #E30A17" : "1px solid #cbd5e1",
            borderRadius: "6px",
            fontSize: "1rem",
            fontFamily: "inherit",
            boxSizing: "border-box"
          }}
          placeholder="+1 (555) 000-0000"
        />
        {errors.phone && <p style={{ color: "#E30A17", fontSize: "0.9rem", marginTop: "4px" }}>{errors.phone}</p>}
      </div>

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", fontWeight: "600", marginBottom: "6px", color: "#0f172a" }}>
          Membership Amount (CAD) * (minimum $1)
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "1.2rem", fontWeight: "600" }}>$</span>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            disabled={loading}
            min="1"
            step="0.01"
            style={{
              flex: 1,
              padding: "10px 12px",
              border: errors.amount ? "2px solid #E30A17" : "1px solid #cbd5e1",
              borderRadius: "6px",
              fontSize: "1rem",
              fontFamily: "inherit",
              boxSizing: "border-box"
            }}
            placeholder="25.00"
          />
        </div>
        {errors.amount && <p style={{ color: "#E30A17", fontSize: "0.9rem", marginTop: "4px" }}>{errors.amount}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%",
          padding: "12px 16px",
          background: loading ? "#cbd5e1" : "#16466A",
          color: "white",
          border: "none",
          borderRadius: "6px",
          fontSize: "1rem",
          fontWeight: "600",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "background 120ms"
        }}
        onMouseOver={e => !loading && (e.target.style.background = "#0f3a52")}
        onMouseOut={e => !loading && (e.target.style.background = "#16466A")}
      >
        {loading ? "Processing..." : `Become a Member (${formData.amount ? `$${parseFloat(formData.amount).toFixed(2)}` : "$0.00"}) →`}
      </button>

      <p style={{ fontSize: "0.9rem", color: "#64748b", marginTop: "16px", textAlign: "center" }}>
        Your information is secure. *Required fields.
      </p>
    </form>
  );
}
