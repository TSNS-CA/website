// Render the Resend templates locally with sample values so you can eyeball
// them in a browser before pasting the HTML into Resend.
//
//   node docs/email-templates/preview.mjs          # writes .preview.html files
//   node docs/email-templates/preview.mjs --serve  # ...and serves them on :4321
//   node docs/email-templates/preview.mjs --logo https://host/logo.png
//                                                  # writes .paste.html — the
//                                                  # real template with that
//                                                  # logo URL, {{vars}} intact,
//                                                  # ready to paste into Resend
//
// The logo points at https://tsns.ca/tsns.jpeg, which only resolves once the
// domain is pointed at the Worker. The preview swaps in the local file so you
// can see the real layout today.

import { readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, "..", "..");

const SAMPLES = {
  "volunteer-confirmation": {
    firstName: "Ayşe",
  },
  "membership-confirmation": {
    firstName: "Ayşe",
    amount: "$25.00",
    membershipExpiryDate: "August 2, 2027",
    membershipExpiryDateTr: "2 Ağustos 2027",
    renewalNoteTr:
      "Üyeliğiniz artık aktif ve 2 Ağustos 2027 tarihine kadar geçerli. Her yıl otomatik olarak yenilenecek; dilediğiniz zaman info@tsns.ca adresinden iptal edebilirsiniz.",
    renewalNoteEn:
      "Your membership is now active and valid until August 2, 2027. It renews automatically each year — you can cancel any time at info@tsns.ca.",
  },
  // Same template, the other case: a one-off gift.
  "membership-confirmation--donation": {
    _template: "membership-confirmation",
    firstName: "Mehmet",
    amount: "$50.00",
    membershipExpiryDate: "August 2, 2027",
    membershipExpiryDateTr: "2 Ağustos 2027",
    renewalNoteTr:
      "Bağışınız size 2 Ağustos 2027 tarihine kadar geçerli bir yıllık üyelik kazandırıyor. Bu üyelik otomatik olarak yenilenmez; süre dolduğunda dilerseniz tekrar üye olabilirsiniz.",
    renewalNoteEn:
      "Your donation also gives you a year of membership, valid until August 2, 2027. It does not renew automatically, so you are welcome to join again when it ends.",
  },
};

const DEFAULT_LOGO = "https://tsns.ca/tsns.jpeg";
const TEMPLATES = ["membership-confirmation", "volunteer-confirmation"];

// --logo <url>: emit paste-ready copies pointing at a logo that is actually
// reachable today (a Resend-hosted upload, or the .workers.dev URL before the
// domain moves). Variables are left as {{...}} — this is the file for Resend,
// not a preview.
const logoArg = process.argv.indexOf("--logo");
if (logoArg !== -1) {
  const url = process.argv[logoArg + 1];
  if (!url || url.startsWith("--")) {
    console.error("--logo needs a URL, e.g. --logo https://tsns-ca-website.workers.dev/tsns.jpeg");
    process.exit(1);
  }
  for (const name of TEMPLATES) {
    const src = readFileSync(join(here, `${name}.html`), "utf8");
    const out = join(here, `${name}.paste.html`);
    writeFileSync(out, src.replaceAll(DEFAULT_LOGO, url));
    console.log(`✓ ${out.replace(repo + "/", "")}  (logo → ${url})`);
  }
  console.log("\nBu dosyaların tamamını Resend → Templates → ilgili template → HTML olarak yapıştır.");
  process.exit(0);
}

const rendered = {};

for (const [name, vars] of Object.entries(SAMPLES)) {
  const source = vars._template || name;
  let html = readFileSync(join(here, `${source}.html`), "utf8");

  for (const [key, value] of Object.entries(vars)) {
    if (key.startsWith("_")) continue;
    html = html.replaceAll(`{{${key}}}`, value);
  }

  const missing = [...html.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  if (missing.length) console.warn(`! ${name}: unfilled ${[...new Set(missing)].join(", ")}`);

  // Local logo so the preview shows the real lockup before the domain moves.
  html = html.replaceAll("https://tsns.ca/tsns.jpeg", "/tsns.jpeg");

  rendered[name] = html;
  const out = join(here, `${name}.preview.html`);
  writeFileSync(out, html);
  console.log(`✓ ${out.replace(repo + "/", "")}`);
}

if (process.argv.includes("--serve")) {
  const index = `<!doctype html><meta charset="utf-8"><title>TSNS email previews</title>
<body style="font-family:system-ui;background:#F0EEE6;padding:40px;">
<h1 style="color:#16466A;">TSNS e-posta önizlemeleri</h1>
<ul style="font-size:18px;line-height:2;">
${Object.keys(rendered).map((n) => `<li><a href="/${n}" style="color:#B8172A;">${n}</a></li>`).join("\n")}
</ul></body>`;

  createServer((req, res) => {
    const path = decodeURIComponent(req.url.split("?")[0]).replace(/^\//, "");
    if (path === "tsns.jpeg") {
      res.writeHead(200, { "Content-Type": "image/jpeg" });
      return res.end(readFileSync(join(repo, "public", "tsns.jpeg")));
    }
    const key = path || null;
    if (key && rendered[key]) {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(rendered[key]);
    }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(index);
  }).listen(4321, () => console.log("\n→ http://localhost:4321"));
}
