import React, { useEffect, useState, useRef } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { getInitialLang, setLang, t, supported } from "./i18n";
import Membership from "./pages/Membership";
import ConfirmationPage from "./pages/ConfirmationPage";
import HomePage from "./pages/Home";
import ContactPage from "./pages/Contact";
import AboutPage from "./pages/About";

function AppContent() {
  const [lang, setLangState] = useState(getInitialLang());

  useEffect(() => {
    try {
      document.documentElement.lang = lang;
    } catch (e) {}
  }, [lang]);

  function changeLanguage(l) {
    setLangState(l);
    setLang(l);
  }

  // Dropdown state + refs for accessibility and outside-click handling
  const [aboutOpen, setAboutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const aboutRef = useRef(null);

  function toggleAbout(open) {
    setAboutOpen(typeof open === "boolean" ? open : prev => !prev);
  }

  useEffect(() => {
    function onDocClick(e) {
      if (!aboutRef.current) return;
      if (!aboutRef.current.contains(e.target)) setAboutOpen(false);
    }

    function onKey(e) {
      if (e.key === "Escape") setAboutOpen(false);
    }

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  function onAboutKey(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setAboutOpen(o => !o);
      setTimeout(() => {
        const first = aboutRef.current && aboutRef.current.querySelector(".dropdown-menu a");
        if (first) first.focus();
      }, 0);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAboutOpen(true);
      setTimeout(() => {
        const first = aboutRef.current && aboutRef.current.querySelector(".dropdown-menu a");
        if (first) first.focus();
      }, 0);
    }
  }

  return (
    <div className="app-root">
      <header className="site-header">
        <div className="container header-row">
          <div className="header-left">
            <img src="/tsns.jpeg" alt="Turkish Society of Nova Scotia Logo" className="society-icon" />
            <div className="org-name">{t(lang, "logo")}</div>
          </div>

          <div className="header-right">
            <nav className="nav">
              <Link to="/" style={{ color: "rgba(255,255,255,0.95)", textDecoration: "none", padding: "6px 10px", borderRadius: "6px", fontWeight: "600", flex: "0 0 auto" }}>
                {t(lang, "home")}
              </Link>

              <div
                className={"dropdown" + (aboutOpen ? " open" : "")}
                ref={aboutRef}
                onMouseEnter={() => setAboutOpen(true)}
                onMouseLeave={() => setAboutOpen(false)}
              >
                <button
                  className="drop-btn"
                  aria-haspopup="true"
                  aria-expanded={aboutOpen}
                  aria-controls="about-menu"
                  onClick={() => toggleAbout()}
                  onKeyDown={onAboutKey}
                >
                  {t(lang, "about")}
                </button>
                <div id="about-menu" role="menu" className="dropdown-menu" aria-hidden={!aboutOpen}>
                  <Link role="menuitem" to="/about" onClick={() => setAboutOpen(false)} style={{display: 'block', color: '#fff', padding: '8px 10px', borderRadius: '6px', textDecoration: 'none'}}>
                    {t(lang, "about")}
                  </Link>
                  <a role="menuitem" href="#">Newcomers</a>
                  <a role="menuitem" href="#">Sponsors</a>
                </div>
              </div>

              <Link to="/membership" style={{ color: "rgba(255,255,255,0.95)", textDecoration: "none", padding: "6px 10px", borderRadius: "6px", fontWeight: "600", flex: "0 0 auto" }}>
                {t(lang, "becomeAMember")}
              </Link>

              <a href="#" style={{ color: "rgba(255,255,255,0.95)", textDecoration: "none", padding: "6px 10px", borderRadius: "6px", fontWeight: "600", flex: "0 0 auto" }}>
                {t(lang, "events")}
              </a>
              <Link to="/contact" style={{ color: "rgba(255,255,255,0.95)", textDecoration: "none", padding: "6px 10px", borderRadius: "6px", fontWeight: "600", flex: "0 0 auto" }}>
                {t(lang, "contact")}
              </Link>
            </nav>

            <button
              className="hamburger"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Menu"
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1.5rem",
                cursor: "pointer"
              }}
            >
              ☰
            </button>

            <button className="btn ghost search-btn" aria-label="Search">🔍</button>

            <div className="lang-buttons">
              {supported.map(s => (
                <button
                  key={s}
                  onClick={() => changeLanguage(s)}
                  className={"btn" + (s === lang ? " primary" : " ghost")}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="mobile-menu" style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          zIndex: 998,
          display: "block"
        }} onClick={() => setMobileMenuOpen(false)}>
          <nav className="mobile-nav" style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "80%",
            maxWidth: "320px",
            height: "100vh",
            background: "var(--primary)",
            zIndex: 999,
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            boxShadow: "2px 0 12px rgba(0,0,0,0.3)",
            overflowY: "auto"
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                background: "transparent",
                border: "none",
                color: "white",
                fontSize: "1.5rem",
                cursor: "pointer",
                padding: "8px",
                marginBottom: "12px"
              }}
              aria-label="Close menu"
            >
              ✕
            </button>

            <button
              onClick={() => {
                alert("Search feature will be added soon.");
                setMobileMenuOpen(false);
              }}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.15)",
                color: "white",
                padding: "12px 10px",
                borderRadius: "8px",
                textAlign: "left",
                marginBottom: "12px",
                cursor: "pointer"
              }}
            >
              🔍 {t(lang, "search") || "Search"}
            </button>

            <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
              {supported.map(s => (
                <button
                  key={s}
                  onClick={() => { changeLanguage(s); setMobileMenuOpen(false); }}
                  className={"btn" + (s === lang ? " primary" : " ghost")}
                  style={{
                    flex: 1,
                    padding: "10px"
                  }}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ color: "white", textDecoration: "none", padding: "12px 8px", borderRadius: "6px", marginBottom: "8px", fontWeight: "600" }}>
              {t(lang, "home")}
            </Link>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", margin: "8px 0", paddingTop: "8px" }}>
              <button
                onClick={() => setAboutOpen(!aboutOpen)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "transparent",
                  border: "none",
                  color: "white",
                  padding: "12px 8px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1rem"
                }}
              >
                {t(lang, "about")} {aboutOpen ? "−" : "+"}
              </button>
              {aboutOpen && (
                <div style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <Link to="/about" onClick={() => { setMobileMenuOpen(false); setAboutOpen(false); }} style={{ color: "rgba(255,255,255,0.95)", textDecoration: "none", padding: "10px 8px", borderRadius: "6px" }}>{t(lang, "about")}</Link>
                  <a href="#" onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", padding: "10px 8px", borderRadius: "6px" }}>Newcomers</a>
                  <a href="#" onClick={() => setMobileMenuOpen(false)} style={{ color: "rgba(255,255,255,0.85)", textDecoration: "none", padding: "10px 8px", borderRadius: "6px" }}>Sponsors</a>
                </div>
              )}
            </div>

            <Link to="/membership" onClick={() => setMobileMenuOpen(false)} style={{ color: "white", textDecoration: "none", padding: "12px 8px", borderRadius: "6px", marginBottom: "8px", fontWeight: "600" }}>
              {t(lang, "becomeAMember")}
            </Link>

            <a href="#" onClick={() => setMobileMenuOpen(false)} style={{ color: "white", textDecoration: "none", padding: "12px 8px", borderRadius: "6px", marginBottom: "8px", fontWeight: "600" }}>
              {t(lang, "events")}
            </a>

            <Link to="/contact" onClick={() => setMobileMenuOpen(false)} style={{ color: "white", textDecoration: "none", padding: "12px 8px", borderRadius: "6px", marginBottom: "16px", fontWeight: "600" }}>
              {t(lang, "contact")}
            </Link>
          </nav>
        </div>
      )}

      <Routes>
        <Route path="/" element={<HomePage lang={lang} />} />
        <Route path="/about" element={<AboutPage lang={lang} />} />
        <Route path="/contact" element={<ContactPage lang={lang} />} />
        <Route path="/membership" element={<Membership />} />
        <Route path="/confirmation" element={<ConfirmationPage />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
