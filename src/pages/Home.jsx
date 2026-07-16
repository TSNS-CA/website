import React from "react";
import { t } from "../i18n";

export default function HomePage({ lang }) {
  return (
    <>
      <main className="hero" style={{
        backgroundImage: "url('/bogaz.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed"
      }}>
        <div style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.4)"
        }}></div>
        <div className="container hero-inner" style={{ position: "relative", zIndex: 1 }}>
          <h2 className="hero-title" style={{ color: "white" }}>{t(lang, "welcome")}</h2>
        </div>
      </main>

      <footer className="site-footer">
        <div className="container">{t(lang, "copyright", { year: new Date().getFullYear() })}</div>
      </footer>
    </>
  );
}
