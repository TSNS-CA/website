import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ConfirmationPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("membershipData");
    if (!stored) {
      navigate("/");
      return;
    }
    setData(JSON.parse(stored));
  }, [navigate]);

  if (!data) return <div>Loading...</div>;

  return (
    <main style={{ padding: "60px 0", minHeight: "60vh" }}>
      <div className="container" style={{ textAlign: "center", maxWidth: "600px" }}>
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
        }}>
          <h1 style={{ color: "#16466A", marginBottom: "12px" }}>✓ Welcome!</h1>
          <p style={{ color: "#64748b", fontSize: "1.05rem", marginBottom: "24px" }}>
            Thank you for becoming a member of Turkish Society of Nova Scotia.
          </p>

          <div style={{
            background: "#f0f4f8",
            padding: "20px",
            borderRadius: "8px",
            textAlign: "left",
            marginBottom: "24px"
          }}>
            <p><strong>Name:</strong> {data.name}</p>
            <p><strong>Email:</strong> {data.email}</p>
            <p><strong>Phone:</strong> {data.phone}</p>
          </div>

          <p style={{ color: "#64748b", marginBottom: "24px" }}>
            A confirmation has been sent to <strong>{data.email}</strong>. 
            Check your inbox for membership details and account setup instructions.
          </p>

          <button
            onClick={() => navigate("/")}
            style={{
              background: "#16466A",
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: "600"
            }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </main>
  );
}
