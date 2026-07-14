// DARKNOTE vs3 — Standalone entry point
// Run: npm install  then  npm start
// Open http://localhost:<PORT>/whatsapp/pair to link your number.
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { whatsappStatus, getWhatsAppInfo, requestPairingCode, startWhatsAppBot } from "./whatsapp/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_BASE = path.join(__dirname, "whatsapp", "assets");

// Multer — saves uploaded profile pic / audio into the right engine folder.
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const engine = (file.fieldname.match(/engine(\d)/) ?? [])[1];
    cb(null, path.join(ASSETS_BASE, `engine${engine}`));
  },
  filename(_req, file, cb) {
    const isAudio = file.mimetype.startsWith("audio/");
    cb(null, isAudio ? "audio.mp3" : "profile.jpg");
  },
});
const upload = multer({ storage });

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ── HTML helpers ─────────────────────────────────────────────
function page(body, autoRefresh) {
  return `<!DOCTYPE html><html><head>
    ${autoRefresh ? `<meta http-equiv="refresh" content="${autoRefresh}">` : ""}
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>DARKNOTE vs3</title>
    <style>
      *{box-sizing:border-box}
      body{background:#0a0a0a;color:#e0e0e0;font-family:'Segoe UI',sans-serif;margin:0;padding:1.5rem;min-height:100vh}
      h1{color:#b388ff;font-size:1.6rem;margin:0 0 0.25rem}
      .sub{color:#888;font-size:0.85rem;margin-bottom:2rem}
      .card{background:#141414;border:1px solid #2a2a2a;border-radius:10px;padding:1.25rem;margin-bottom:1.25rem}
      .card h2{color:#b388ff;margin:0 0 0.75rem;font-size:1rem;text-transform:uppercase;letter-spacing:.08em}
      input[type=text],input[type=file]{width:100%;padding:0.6rem 0.75rem;background:#1e1e1e;border:1px solid #333;border-radius:6px;color:#e0e0e0;font-size:0.95rem;margin-bottom:0.5rem}
      button{background:#7c4dff;color:#fff;border:none;border-radius:6px;padding:0.6rem 1.25rem;font-size:0.95rem;cursor:pointer;margin-top:0.25rem}
      button:hover{background:#9c6eff}
      .code{font-size:2.4rem;letter-spacing:.35rem;font-weight:bold;color:#b388ff;text-align:center;padding:1rem 0}
      .ok{color:#69f0ae}.err{color:#ff5252}
      .row{display:flex;gap:1rem;flex-wrap:wrap}
      .col{flex:1;min-width:220px}
      label{font-size:0.8rem;color:#888;display:block;margin-bottom:0.3rem}
    </style>
  </head><body>
    <h1>🌑 DARKNOTE <span style="font-size:.9rem;color:#7c4dff">vs3</span></h1>
    <div class="sub">WhatsApp Multi-Engine Bot</div>
    ${body}
  </body></html>`;
}

function uploadSection() {
  const engines = [
    { n: 1, prefix: ".", label: "Engine 1 — BigBro.js" },
    { n: 2, prefix: "!", label: "Engine 2 — BigBro2.js" },
    { n: 3, prefix: "#", label: "Engine 3 — BigBro3.js" },
  ];
  return engines.map(({ n, prefix, label }) => `
    <div class="card">
      <h2>${label} &nbsp;<span style="color:#555;font-weight:400">prefix: ${prefix}</span></h2>
      <form method="POST" action="/whatsapp/upload/engine${n}" enctype="multipart/form-data">
        <div class="row">
          <div class="col">
            <label>Profile image (JPG/PNG) — sent with ${prefix}menu</label>
            <input type="file" name="engine${n}_image" accept="image/*" />
          </div>
          <div class="col">
            <label>Audio clip (MP3) — played after menu (optional)</label>
            <input type="file" name="engine${n}_audio" accept="audio/*" />
          </div>
        </div>
        <button type="submit">Upload to Engine ${n}</button>
      </form>
    </div>`).join("");
}

// ── Routes ────────────────────────────────────────────────────
app.get("/whatsapp/status", (_req, res) => {
  res.json(getWhatsAppInfo());
});

app.get("/whatsapp/pair", (_req, res) => {
  if (whatsappStatus.connected) {
    res.send(page(`
      <div class="card">
        <h2>Status</h2>
        <p class="ok">✅ Bot is connected to WhatsApp</p>
        <p style="color:#888">Check <a href="/whatsapp/status" style="color:#b388ff">/whatsapp/status</a> for engine info.</p>
      </div>
      ${uploadSection()}
    `));
    return;
  }

  if (whatsappStatus.pairingCode) {
    res.send(page(`
      <div class="card">
        <h2>Enter this code in WhatsApp</h2>
        <p style="color:#aaa">WhatsApp → Settings → Linked Devices → Link a Device<br>→ <b>Link with phone number instead</b></p>
        <div class="code">${whatsappStatus.pairingCode}</div>
        <p style="color:#666;font-size:.85rem">Page refreshes every 20 s. If the code expires, request a new one below.</p>
        <form method="POST" action="/whatsapp/pair">
          <input type="text" name="phone" placeholder="Country code + number, e.g. 255712345678" required />
          <button type="submit">Request a new code</button>
        </form>
      </div>
      ${uploadSection()}
    `, 20));
    return;
  }

  res.send(page(`
    <div class="card">
      <h2>Link your number</h2>
      <p style="color:#aaa">Enter your number with country code, digits only.<br>
      Example: <b>255712345678</b> (Tanzania) &nbsp;|&nbsp; <b>15551234567</b> (US)</p>
      <form method="POST" action="/whatsapp/pair">
        <input type="text" name="phone" placeholder="e.g. 255712345678" required />
        <button type="submit">Get pairing code</button>
      </form>
      ${whatsappStatus.pairingError ? `<p class="err" style="margin-top:.75rem">⚠️ ${whatsappStatus.pairingError}</p>` : ""}
    </div>
    ${uploadSection()}
  `));
});

app.post("/whatsapp/pair", async (req, res) => {
  const phone = typeof req.body?.phone === "string" ? req.body.phone : "";
  try { await requestPairingCode(phone); } catch { /* error stored in whatsappStatus */ }
  res.redirect("/whatsapp/pair");
});

// Upload routes for each engine
for (const n of [1, 2, 3]) {
  app.post(
    `/whatsapp/upload/engine${n}`,
    upload.fields([
      { name: `engine${n}_image`, maxCount: 1 },
      { name: `engine${n}_audio`, maxCount: 1 },
    ]),
    (_req, res) => res.redirect("/whatsapp/pair"),
  );
}

// ── Start ─────────────────────────────────────────────────────
const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`\n🌑 DARKNOTE vs3 running on port ${port}`);
  console.log(`   Open: http://localhost:${port}/whatsapp/pair\n`);
  startWhatsAppBot().catch((err) => console.error("WhatsApp bot error:", err));
});
                    
