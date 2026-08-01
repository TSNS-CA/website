import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { getInitialLang, setLang } from "./i18n";
import Header from "./components/Header";
import Footer from "./components/Footer";
import HomePage from "./pages/Home";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import DonatePage from "./pages/Donate";
import VolunteerPage from "./pages/Volunteer";
import ConfirmationPage from "./pages/ConfirmationPage";

function Layout() {
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

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-slate-950">
      <Header lang={lang} onChangeLang={changeLanguage} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage lang={lang} />} />
          <Route path="/about" element={<AboutPage lang={lang} />} />
          <Route path="/contact" element={<ContactPage lang={lang} />} />
          <Route path="/bagis" element={<DonatePage lang={lang} />} />
          <Route path="/gonullu" element={<VolunteerPage lang={lang} />} />
          {/* Legacy/aliases */}
          <Route path="/membership" element={<DonatePage lang={lang} />} />
          <Route path="/confirmation" element={<ConfirmationPage />} />
          <Route path="*" element={<HomePage lang={lang} />} />
        </Routes>
      </main>
      <Footer lang={lang} />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}
