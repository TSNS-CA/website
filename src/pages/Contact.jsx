import React from "react";
import { t } from "../i18n";

export default function ContactPage({ lang }) {
  const socials = [
    { name: "Instagram", href: "https://instagram.com/turkishsocietyofns" },
    { name: "Facebook", href: "https://www.facebook.com/turkishsocietyns" },
    { name: "LinkedIn", href: "https://www.linkedin.com/company/turkish-society-of-nova-scotia" }
  ];

  const departments = [
    { dept: "General enquiries", email: "info@tsns.ca" },
    { dept: "Events", email: "events@tsns.ca" },
    { dept: "Sponsorships & Partnerships", email: "partners@tsns.ca" },
    { dept: "Community Relations", email: "community@tsns.ca" }
  ];

  return (
    <main className="container" style={{ padding: 24 }}>
      <h1 style={{ color: "var(--primary)", marginBottom: 12 }}>{t(lang, "contact")}</h1>

      <section style={{ display: "block", gap: 20, marginBottom: 18 }}>
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Social</h3>
          <ul style={{ listStyle: "none", paddingLeft: 0, margin: 0, display: "flex", gap: 12, flexWrap: "wrap" }}>
            {socials.map(s => (
              <li key={s.name}>
                <a href={s.href} target="_blank" rel="noreferrer" style={{ color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 style={{ marginTop: 0 }}>Emails</h3>
          <div style={{ overflowX: "auto", background: "white", borderRadius: 8, padding: 8, boxShadow: "0 6px 18px rgba(2,6,23,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Department</th>
                  <th style={{ textAlign: "left", padding: 8, borderBottom: "1px solid #eee" }}>Email</th>
                </tr>
              </thead>
              <tbody>
                {departments.map(d => (
                  <tr key={d.email}>
                    <td style={{ padding: 8, borderBottom: "1px solid #f4f4f4" }}>{d.dept}</td>
                    <td style={{ padding: 8, borderBottom: "1px solid #f4f4f4" }}>
                      <a href={`mailto:${d.email}`} style={{ color: "var(--primary)", textDecoration: "none" }}>{d.email}</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <p style={{ color: "var(--muted)", marginTop: 6 }}>
       We are stronger together!
      </p>
    </main>
  );
}
