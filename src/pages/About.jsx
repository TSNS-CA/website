import React from "react";
import { t } from "../i18n";

export default function AboutPage({ lang }) {
  return (
    <main className="container" style={{ padding: "28px 16px" }}>
      <h1 style={{ color: "var(--primary)", marginBottom: 12 }}>{t(lang, "about")}</h1>
      <section style={{ background: "white", padding: 18, borderRadius: 8, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" }}>
        <p style={{ margin: 0, color: "var(--text)", lineHeight: 1.6 }}>
          The Turkish Society of Nova Scotia (TSNS)
          is a dedicated organization committed to introduce the
           Turkish community and culture in NS and broader Atlantic Canada
            while bringing people of Turkish heritage together since 2007.
            <br></br><br></br>
            Turkish community and our TSNS members contributes to the diversity 
            of our region and plays a pivotal role in fostering cultural development,
             supporting Turkish Businesses while highlighting the shared history of Turkiye and Canada .
            We are known for our community building activities, bridging our cultures,
             supporting new comers and international students with initiatives 
             that inspire, educate, and connect our broader community.
            <br></br><br></br>
            TSNS represents a dynamic community of business owners, 
            professionals and students in Atlantic Canada, driven by the mission to
             empower individuals and create opportunities, while supporting our
              regional community 🇹🇷 🇨🇦
        </p>
      </section>
    </main>
  );
}
