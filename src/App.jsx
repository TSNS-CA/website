import { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from "react-router-dom";
import { getInitialLang, setLang } from "./i18n";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";
import HomePage from "./pages/Home";
import AboutPage from "./pages/About";
import ContactPage from "./pages/Contact";
import DonatePage from "./pages/Donate";
import VolunteerPage from "./pages/Volunteer";
import ConfirmationPage from "./pages/ConfirmationPage";
import EventsPage from "./pages/Events";
import EventDetailPage from "./pages/EventDetail";
import NewcomersPage from "./pages/Newcomers";

// /events/:slug → /etkinlikler/:slug. Türkçe yol kanonik (canonical + JSON-LD
// tek URL'de kalsın diye İngilizce takma adlar kopya değil, yönlendirme).
function RedirectEvent() {
  const { slug } = useParams();
  return <Navigate to={`/etkinlikler/${slug}`} replace />;
}

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
    <div className="flex min-h-screen flex-col bg-cream dark:bg-primary-900">
      <ScrollToTop />
      <Header lang={lang} onChangeLang={changeLanguage} />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage lang={lang} />} />
          <Route path="/about" element={<AboutPage lang={lang} />} />
          <Route path="/contact" element={<ContactPage lang={lang} />} />
          {/* Aynı sayfa, iki giriş: /uye-ol yıllık üyelikte, /bagis tek seferlik
              bağışta açılır. key olmadan React aynı bileşeni yerinde tutar ve
              rota değişse de useState ilk değerinde kalırdı. */}
          <Route path="/bagis" element={<DonatePage key="bagis" lang={lang} defaultFrequency="one_time" />} />
          <Route path="/uye-ol" element={<DonatePage key="uye-ol" lang={lang} defaultFrequency="yearly" />} />
          <Route path="/gonullu" element={<VolunteerPage lang={lang} />} />
          <Route path="/etkinlikler" element={<EventsPage lang={lang} />} />
          <Route path="/etkinlikler/:slug" element={<EventDetailPage lang={lang} />} />
          <Route path="/yeni-gelenler" element={<NewcomersPage lang={lang} />} />
          {/* Legacy/aliases */}
          <Route path="/membership" element={<DonatePage key="uye-ol" lang={lang} defaultFrequency="yearly" />} />
          <Route path="/events" element={<Navigate to="/etkinlikler" replace />} />
          <Route path="/events/:slug" element={<RedirectEvent />} />
          <Route path="/newcomers" element={<Navigate to="/yeni-gelenler" replace />} />
          <Route path="/announcements-events" element={<Navigate to="/etkinlikler" replace />} />
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
