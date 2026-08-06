#!/usr/bin/env node
/**
 * Renders schematic figures for a post as PNG — tables and diagrams defined as
 * data in this file, not screenshots.
 *
 *   node scripts/blog-figure.mjs --slug <slug> [--lang de] [--only matrix]
 *
 * Writes public/blog/<slug>/screens/<lang>/<name>.png
 *
 * Why this exists: for articles about internal systems, real screenshots carry
 * hostnames, tenant names, client identifiers and whole navigation trees. Those
 * cannot be redacted without destroying the information the figure is for. A
 * rebuilt figure shows the same structure with neutral names, is easier to read
 * at article width, and carries a visible "schematic" label so nobody mistakes
 * it for evidence.
 *
 * Uses the vendored brand fonts, so output is byte-stable and offline.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const WIDTH = 1600;

const BRAND = {
  primary: "#F97316",
  deep: "#C2410C",
  ink: "#141414",
  muted: "#666666",
  subtle: "#F4F5F0",
  line: "#E3E3DE",
  white: "#FFFFFF",
  ok: "#1A7F46",
  okBg: "#E8F5EE",
  down: "#B42318",
  downBg: "#FDEAEA",
};

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/home/vm_codex00/.cache/puppeteer/chrome/linux-145.0.7632.77/chrome-linux64/chrome",
  "/usr/bin/chromium",
  "/usr/bin/google-chrome",
];

function findChrome() {
  for (const c of CHROME_CANDIDATES) if (c && fs.existsSync(c)) return c;
  throw new Error("No Chrome found. Set CHROME_PATH.");
}

function fontFace(family, file) {
  const p = path.join(ROOT, "assets", "fonts", file);
  const b64 = fs.readFileSync(p).toString("base64");
  return `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${b64}) format('woff2');font-weight:100 900;font-display:block;}`;
}

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const k = argv[i].slice(2);
    const n = argv[i + 1];
    if (n && !n.startsWith("--")) {
      a[k] = n;
      i += 1;
    } else a[k] = true;
  }
  return a;
}

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Cell markup: "ok:text" / "down:text" / "mono:text" / "warn:text" / plain. */
function cell(v) {
  const s = String(v);
  const m = /^(ok|down|mono|warn|dim):([\s\S]*)$/.exec(s);
  if (!m) return esc(s);
  const [, kind, text] = m;
  if (kind === "ok") return `<span class="pill ok">${esc(text)}</span>`;
  if (kind === "down") return `<span class="pill down">${esc(text)}</span>`;
  if (kind === "warn") return `<span class="warn">${esc(text)}</span>`;
  if (kind === "dim") return `<span class="dim">${esc(text)}</span>`;
  return `<code>${esc(text)}</code>`;
}

function table(fig) {
  const head = fig.columns.map((c) => `<th>${esc(c)}</th>`).join("");
  const rows = fig.rows
    .map((r) => `<tr>${r.map((c) => `<td>${cell(c)}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table>`;
}

const LABEL = {
  de: { schematic: "Schematische Nachbildung mit neutralen Namen — 1stai.eu" },
  en: { schematic: "Schematic reproduction with neutral names — 1stai.eu" },
};

/**
 * Figures per slug. Names are deliberately neutral: node-a/b/c instead of real
 * hostnames, profiles instead of tenant names, generic model labels.
 */
const FIGURES = {
  "llm-lastmanagement-routing-autoritaet": [
    {
      name: "registry",
      title: { de: "Endpunkt-Registry", en: "Endpoint registry" },
      note: {
        de: "Ein Verbund aus ungleicher Hardware. Jede Zeile ist ein Endpunkt, nicht eine Maschine — eine Maschine fährt mehrere.",
        en: "A cluster of unequal hardware. Each row is an endpoint, not a machine — one machine runs several.",
      },
      columns: {
        de: ["Endpunkt", "Status", "Engine", "Hardware", "max. parallel", "max. Modelle"],
        en: ["Endpoint", "Status", "Engine", "Hardware", "max concurrent", "max models"],
      },
      rows: {
        de: [
          ["mono:node-a-chat-long", "ok:gesund", "llama.cpp", "Node A — ARM, 128 GB unified", "3", "1"],
          ["mono:node-a-chat-short", "ok:gesund", "llama.cpp", "Node A — ARM, 128 GB unified", "6", "1"],
          ["mono:node-a-embed", "ok:gesund", "llama.cpp", "Node A — ARM, 128 GB unified", "4", "1"],
          ["mono:node-a-rerank", "ok:gesund", "llama.cpp", "Node A — ARM, 128 GB unified", "4", "1"],
          ["mono:node-b-chat", "ok:gesund", "Ollama", "Node B — 2 GPUs, 40 GB", "2", "2"],
          ["mono:node-c-chat", "down:ausgefallen", "Ollama", "Node C — 1 GPU, 32 GB", "1", "2"],
          ["mono:node-c-embed", "down:ausgefallen", "TEI", "Node C — 1 GPU, 12 GB", "2", "1"],
          ["mono:node-b-embed-cpu", "ok:gesund", "TEI", "Node B — nur CPU", "2", "1"],
          ["mono:cloud-chat", "dim:deaktiviert", "gehostet", "externer Anbieter, Überlauf", "12", "—"],
        ],
        en: [
          ["mono:node-a-chat-long", "ok:healthy", "llama.cpp", "Node A — ARM, 128 GB unified", "3", "1"],
          ["mono:node-a-chat-short", "ok:healthy", "llama.cpp", "Node A — ARM, 128 GB unified", "6", "1"],
          ["mono:node-a-embed", "ok:healthy", "llama.cpp", "Node A — ARM, 128 GB unified", "4", "1"],
          ["mono:node-a-rerank", "ok:healthy", "llama.cpp", "Node A — ARM, 128 GB unified", "4", "1"],
          ["mono:node-b-chat", "ok:healthy", "Ollama", "Node B — 2 GPUs, 40 GB", "2", "2"],
          ["mono:node-c-chat", "down:down", "Ollama", "Node C — 1 GPU, 32 GB", "1", "2"],
          ["mono:node-c-embed", "down:down", "TEI", "Node C — 1 GPU, 12 GB", "2", "1"],
          ["mono:node-b-embed-cpu", "ok:healthy", "TEI", "Node B — CPU only", "2", "1"],
          ["mono:cloud-chat", "dim:disabled", "hosted", "external provider, overflow", "12", "—"],
        ],
      },
    },
    {
      name: "matrix",
      title: { de: "Fähigkeits-Matrix", en: "Capability matrix" },
      note: {
        de: "Eine Zeile je Endpunkt und Modell. Der Backend-Name ist der String, den genau dieser Endpunkt versteht — hier stirbt der Modell-Tag-Zufall. Wirksame Slots = min(konfiguriert, entdeckt); die markierten Zeilen zeigen, wo der konfigurierte Wert Fiktion war.",
        en: "One row per endpoint and model. The backend name is the string this particular endpoint understands — this is where the model-tag coincidence dies. Effective slots = min(configured, detected); the marked rows show where the configured value was fiction.",
      },
      columns: {
        de: ["Modell", "Endpunkt", "Backend-Name", "Rang", "Slots konf.", "entdeckt", "max. Kontext"],
        en: ["Model", "Endpoint", "Backend name", "Rank", "Slots conf.", "detected", "max context"],
      },
      rows: {
        de: [
          ["chat-35b", "mono:node-a-chat-long", "mono:chat-35b", "10", "3", "3", "196 608"],
          ["chat-35b", "mono:node-a-chat-short", "mono:chat-35b", "20", "6", "6", "65 536"],
          ["chat-35b", "mono:node-b-chat", "mono:chat-35b-q4_K_M", "30", "2", "2", "131 072"],
          ["chat-27b", "mono:node-b-chat", "mono:vendor/chat-27b:latest", "10", "2", "2", "131 072"],
          ["chat-27b", "mono:node-c-chat", "mono:vendor/chat-27b:latest", "20", "1", "1", "131 072"],
          ["embed-m3", "mono:node-c-embed", "mono:embed-m3", "10", "warn:4", "warn:1", "8 192"],
          ["embed-m3", "mono:node-a-embed", "mono:embed-m3", "20", "4", "4", "8 192"],
          ["rerank-v2", "mono:node-a-rerank", "mono:rerank-v2", "10", "warn:4", "warn:1", "8 192"],
        ],
        en: [
          ["chat-35b", "mono:node-a-chat-long", "mono:chat-35b", "10", "3", "3", "196,608"],
          ["chat-35b", "mono:node-a-chat-short", "mono:chat-35b", "20", "6", "6", "65,536"],
          ["chat-35b", "mono:node-b-chat", "mono:chat-35b-q4_K_M", "30", "2", "2", "131,072"],
          ["chat-27b", "mono:node-b-chat", "mono:vendor/chat-27b:latest", "10", "2", "2", "131,072"],
          ["chat-27b", "mono:node-c-chat", "mono:vendor/chat-27b:latest", "20", "1", "1", "131,072"],
          ["embed-m3", "mono:node-c-embed", "mono:embed-m3", "10", "warn:4", "warn:1", "8,192"],
          ["embed-m3", "mono:node-a-embed", "mono:embed-m3", "20", "4", "4", "8,192"],
          ["rerank-v2", "mono:node-a-rerank", "mono:rerank-v2", "10", "warn:4", "warn:1", "8,192"],
        ],
      },
    },
    {
      name: "audit",
      title: { de: "Prüfspur mit Routing-Grund", en: "Audit trail with routing reason" },
      note: {
        de: "Sechs Felder je Reservierung. Die Spalte Grund ist die, mit der jede Diagnose anfängt: eine Verteilungsanomalie wird damit erklärbar statt erratbar.",
        en: "Six fields per reservation. The reason column is where every diagnosis starts: it makes a distribution anomaly explainable rather than a guess.",
      },
      columns: {
        de: ["Zeit", "Profil", "Aufrufer", "Modell", "Endpunkt", "Grund", "Dauer"],
        en: ["Time", "Profile", "Caller", "Model", "Endpoint", "Reason", "Duration"],
      },
      rows: {
        de: [
          ["14:18:07", "chat-rag", "mono:retrieval:embed_many", "embed-m3", "mono:node-a-embed", "mono:rank10", "0,1 s"],
          ["14:18:06", "production", "mono:doc-classify", "chat-27b", "mono:node-b-chat", "mono:rank10", "15,5 s"],
          ["14:18:02", "batch-guest", "mono:gateway:chat", "chat-35b", "mono:node-a-chat-short", "mono:rank20_overflow", "1,5 s"],
          ["14:17:58", "batch-guest", "mono:gateway:chat", "chat-35b", "mono:node-b-chat", "mono:rank30_overflow", "2,1 s"],
          ["14:17:55", "production", "mono:report:summary", "chat-35b", "mono:node-a-chat-long", "mono:rank10_preempted", "8,4 s"],
          ["14:17:51", "ops", "mono:health:probe", "chat-27b", "mono:node-b-chat", "mono:rank20_pref", "0,3 s"],
        ],
        en: [
          ["14:18:07", "chat-rag", "mono:retrieval:embed_many", "embed-m3", "mono:node-a-embed", "mono:rank10", "0.1 s"],
          ["14:18:06", "production", "mono:doc-classify", "chat-27b", "mono:node-b-chat", "mono:rank10", "15.5 s"],
          ["14:18:02", "batch-guest", "mono:gateway:chat", "chat-35b", "mono:node-a-chat-short", "mono:rank20_overflow", "1.5 s"],
          ["14:17:58", "batch-guest", "mono:gateway:chat", "chat-35b", "mono:node-b-chat", "mono:rank30_overflow", "2.1 s"],
          ["14:17:55", "production", "mono:report:summary", "chat-35b", "mono:node-a-chat-long", "mono:rank10_preempted", "8.4 s"],
          ["14:17:51", "ops", "mono:health:probe", "chat-27b", "mono:node-b-chat", "mono:rank20_pref", "0.3 s"],
        ],
      },
    },
  ],
};

function buildHtml(fig, lang, fonts) {
  const localized = {
    ...fig,
    title: fig.title[lang] || fig.title.de,
    note: fig.note ? fig.note[lang] || fig.note.de : "",
    columns: fig.columns[lang] || fig.columns.de,
    rows: fig.rows[lang] || fig.rows.de,
  };
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box}
body{width:${WIDTH}px;background:${BRAND.white};font-family:'Manrope',system-ui,sans-serif;color:${BRAND.ink};-webkit-font-smoothing:antialiased}
.wrap{padding:40px 44px 30px;border-bottom:8px solid ${BRAND.primary}}
h2{font-family:'Space Grotesk',sans-serif;font-size:30px;font-weight:700;letter-spacing:-.02em}
.note{margin-top:10px;font-size:17px;line-height:1.5;color:${BRAND.muted};max-width:105ch}
table{width:100%;border-collapse:collapse;margin-top:26px;font-size:17px}
th{font-family:'Space Grotesk',sans-serif;font-weight:600;text-align:left;padding:0 14px 9px 0;border-bottom:2px solid ${BRAND.ink};white-space:nowrap}
td{padding:10px 14px 10px 0;border-bottom:1px solid ${BRAND.line};vertical-align:middle}
tr:last-child td{border-bottom:none}
code{font-family:ui-monospace,'DejaVu Sans Mono',monospace;font-size:15px;background:${BRAND.subtle};padding:2px 7px;border-radius:5px;white-space:nowrap}
.pill{display:inline-block;font-size:14px;font-weight:600;padding:3px 11px;border-radius:99px;white-space:nowrap}
.pill.ok{background:${BRAND.okBg};color:${BRAND.ok}}
.pill.down{background:${BRAND.downBg};color:${BRAND.down}}
.warn{font-weight:700;color:${BRAND.deep}}
.dim{color:#9a9a95}
.foot{padding:14px 44px 18px;font-size:14px;color:${BRAND.muted};display:flex;justify-content:space-between;align-items:center}
.mark{display:flex;gap:9px;align-items:center;font-family:'Space Grotesk',sans-serif;font-weight:700;color:${BRAND.ink};font-size:15px}
</style></head><body>
<div class="wrap">
  <h2>${esc(localized.title)}</h2>
  ${localized.note ? `<p class="note">${esc(localized.note)}</p>` : ""}
  ${table(localized)}
</div>
<div class="foot">
  <span>${esc((LABEL[lang] || LABEL.de).schematic)}</span>
  <span class="mark">${logo()}1stAI</span>
</div>
</body></html>`;
}

function logo() {
  const nodes = [[70, 14], [55, 40], [85, 40], [42, 66], [70, 66], [98, 66]];
  const links = [[70, 14, 55, 40], [70, 14, 85, 40], [55, 40, 42, 66], [55, 40, 70, 66], [85, 40, 70, 66], [85, 40, 98, 66]];
  return `<svg width="34" height="20" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
    ${links.map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${BRAND.primary}" stroke-width="2" opacity=".6"/>`).join("")}
    ${nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${BRAND.primary}"/>`).join("")}
  </svg>`;
}

/**
 * Cover source: a dark routing schematic. Written to blog-inbox/ rather than
 * public/, because it is the *input* to blog-assets.mjs, which puts the white
 * text panel over the upper part — so the diagram lives in the lower half.
 */
function coverHtml(lang, fonts) {
  const t =
    lang === "en"
      ? { caption: "One decision point. Candidates filtered by capability, not scored.", req: "request", dec: "routing authority", matrix: "capability matrix" }
      : { caption: "Eine Entscheidungsstelle. Kandidaten nach Fähigkeit gefiltert, nicht bewertet.", req: "Anfrage", dec: "Routing-Autorität", matrix: "Fähigkeits-Matrix" };
  const nodes =
    lang === "en"
      ? [["node-a", "ARM · 128 GB", "3 + 6 slots", true], ["node-b", "2 GPUs · 40 GB", "2 slots", true], ["node-c", "1 GPU · 32 GB", "down", false], ["cloud", "overflow", "disabled", false]]
      : [["node-a", "ARM · 128 GB", "3 + 6 Slots", true], ["node-b", "2 GPUs · 40 GB", "2 Slots", true], ["node-c", "1 GPU · 32 GB", "ausgefallen", false], ["cloud", "Überlauf", "deaktiviert", false]];
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
${fonts}
*{margin:0;padding:0;box-sizing:border-box}
body{width:2560px;height:1440px;background:${BRAND.ink};font-family:'Manrope',system-ui,sans-serif;color:#fff;
  display:flex;flex-direction:column;justify-content:flex-end;padding:0 140px 96px}
.cap{font-size:34px;color:#a8a8a2;margin-bottom:44px}
.flow{display:flex;align-items:center;gap:52px}
.box{border:3px solid #3a3a35;border-radius:20px;padding:26px 34px;min-width:330px}
.box .t{font-family:'Space Grotesk',sans-serif;font-weight:700;font-size:34px}
.box .s{font-size:26px;color:#8f8f89;margin-top:8px}
.dec{border-color:${BRAND.primary};background:rgba(249,115,22,.10)}
.dec .t{color:${BRAND.primary}}
.arrow{font-size:46px;color:${BRAND.primary};opacity:.8}
.grid{display:flex;flex-direction:column;gap:18px}
.grid .box{min-width:420px;padding:18px 28px}
.grid .box.off{opacity:.42}
.grid .box .t{font-size:28px}
.grid .box .s{font-size:22px;margin-top:4px}
</style></head><body>
  <div class="cap">${esc(t.caption)}</div>
  <div class="flow">
    <div class="box"><div class="t">${esc(t.req)}</div><div class="s">${esc(t.matrix)}</div></div>
    <div class="arrow">&rarr;</div>
    <div class="box dec"><div class="t">${esc(t.dec)}</div><div class="s">min(konf., entdeckt)</div></div>
    <div class="arrow">&rarr;</div>
    <div class="grid">
      ${nodes.map(([n, hw, slots, up]) => `<div class="box${up ? "" : " off"}"><div class="t">${esc(n)}</div><div class="s">${esc(hw)} · ${esc(slots)}</div></div>`).join("")}
    </div>
  </div>
</body></html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  if (!slug || slug === true) {
    console.error("Usage: node scripts/blog-figure.mjs --slug <slug> [--lang de] [--only name]");
    process.exit(2);
  }
  const figures = FIGURES[slug];
  if (!figures) throw new Error(`No figures defined for "${slug}" — add them in ${path.basename(__filename)}`);

  const langs = args.lang && args.lang !== true ? [args.lang] : ["de", "en"];
  const wanted = args.only && args.only !== true ? String(args.only).split(",") : null;

  const fonts = [
    fontFace("Space Grotesk", "SpaceGrotesk-latin-ext.woff2"),
    fontFace("Manrope", "Manrope-latin-ext.woff2"),
  ].join("\n");

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });

  try {
    for (const lang of langs) {
      const outDir = path.join(ROOT, "public", "blog", slug, "screens", lang);
      fs.mkdirSync(outDir, { recursive: true });
      console.log(`\n${lang}:`);
      if (!wanted || wanted.includes("cover")) {
        const inbox = path.join(ROOT, "blog-inbox", slug);
        fs.mkdirSync(inbox, { recursive: true });
        const page = await browser.newPage();
        await page.setViewport({ width: 2560, height: 1440, deviceScaleFactor: 1 });
        await page.setContent(coverHtml(lang, fonts), { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const file = path.join(inbox, `source-schema-${lang}.png`);
        await page.screenshot({ path: file, type: "png" });
        await page.close();
        console.log(`  ✓ blog-inbox/${slug}/source-schema-${lang}.png  ${Math.round(fs.statSync(file).size / 1024)} KB`);
      }

      for (const fig of figures) {
        if (wanted && !wanted.includes(fig.name)) continue;
        const page = await browser.newPage();
        await page.setViewport({ width: WIDTH, height: 400, deviceScaleFactor: 1 });
        await page.setContent(buildHtml(fig, lang, fonts), { waitUntil: "load" });
        await page.evaluate(() => document.fonts.ready);
        const file = path.join(outDir, `${fig.name}.png`);
        await page.screenshot({ path: file, type: "png", fullPage: true });
        await page.close();
        const kb = Math.round(fs.statSync(file).size / 1024);
        console.log(`  ✓ screens/${lang}/${fig.name}.png  ${kb} KB`);
      }
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
