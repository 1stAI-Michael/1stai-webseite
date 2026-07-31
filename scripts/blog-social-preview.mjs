#!/usr/bin/env node
/**
 * Builds a self-contained HTML preview of how a post looks on each channel.
 *
 *   node scripts/blog-social-preview.mjs --slug <slug>
 *
 * Reads the post, the rendered images and the social copy, and writes
 * blog-drafts/<slug>/preview.html — images inlined as scaled-down data URIs, so
 * the file can be opened or sent anywhere without the repo.
 *
 * Shows per language:
 *   - the link-unfurl card (what LinkedIn/X build from the OG tags)
 *   - LinkedIn feed post with the "…see more" fold marked
 *   - X post with the character count (URLs counted as 23)
 *   - Instagram feed post
 *
 * Deliberately written to blog-drafts/ and never to public/ — this is working
 * material and must not end up in the deploy.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LANGS = ["de", "en"];
const PREVIEW_WIDTH = 620;

// Fold after which LinkedIn collapses the post behind "…see more". Approximate
// and layout-dependent — treat as a guide, not a guarantee.
const LINKEDIN_FOLD = 210;
const LIMITS = { linkedin: 3000, x: 280, instagram: 2200 };

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      args[key] = next;
      i += 1;
    } else {
      args[key] = true;
    }
  }
  return args;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Scaled JPEG data URI — keeps the preview file small; judge sharpness on the originals. */
async function thumb(file) {
  if (!fs.existsSync(file)) return null;
  const buf = await sharp(file).resize({ width: PREVIEW_WIDTH }).jpeg({ quality: 82 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function readCopy(slug, channel, lang) {
  const file = path.join(ROOT, "blog-drafts", slug, "social", `${channel}.${lang}.txt`);
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : null;
}

/** X counts every URL as 23 characters regardless of real length. */
function countX(text) {
  return text.replace(/https?:\/\/\S+/g, "x".repeat(23)).length;
}

function linkify(text) {
  return escapeHtml(text).replace(
    /(https?:\/\/\S+)/g,
    '<span class="url">$1</span>'
  );
}

/** Renders the copy with the LinkedIn fold marked in place. */
function withFold(text) {
  if (text.length <= LINKEDIN_FOLD) return linkify(text);
  const cut = text.lastIndexOf(" ", LINKEDIN_FOLD);
  const at = cut > 0 ? cut : LINKEDIN_FOLD;
  return (
    linkify(text.slice(0, at)) +
    '<span class="fold">… mehr anzeigen ▾</span>' +
    `<span class="folded">${linkify(text.slice(at))}</span>`
  );
}

function counter(label, count, limit) {
  const pct = Math.round((count / limit) * 100);
  const state = count > limit ? "bad" : pct > 90 ? "warn" : "ok";
  return `<span class="count ${state}">${label}: ${count} / ${limit}</span>`;
}

function card(title, body) {
  return `<section class="card"><h3>${escapeHtml(title)}</h3>${body}</section>`;
}

async function buildLang(slug, lang, post, imgDir) {
  const [og, li, x, ig, story] = await Promise.all([
    thumb(path.join(imgDir, "og-1200x627.png")),
    thumb(path.join(imgDir, "linkedin-1200x1200.png")),
    thumb(path.join(imgDir, "x-1600x900.png")),
    thumb(path.join(imgDir, "instagram-1080x1080.png")),
    thumb(path.join(imgDir, "instagram-story-1080x1920.png")),
  ]);

  const url = `1stai.eu/${lang}/blog/${slug}/`;
  const blocks = [];

  // What a shared link looks like before anyone reads the post.
  blocks.push(
    card(
      "Link-Vorschau (LinkedIn, X, Facebook, Slack)",
      `<div class="unfurl">
        ${og ? `<img src="${og}" alt="">` : '<p class="missing">og-1200x627.png fehlt</p>'}
        <div class="unfurl-meta">
          <div class="domain">${escapeHtml(url.split("/")[0])}</div>
          <div class="unfurl-title">${escapeHtml(post.title)}</div>
          <div class="unfurl-desc">${escapeHtml(post.excerpt)}</div>
        </div>
      </div>
      <p class="note">Gebaut aus den OG-Tags. LinkedIn cacht das aggressiv — nach einer Bildänderung braucht es dort einen manuellen Refresh im Post Inspector.</p>`
    )
  );

  const channels = [
    { key: "linkedin", label: "LinkedIn — Feed-Post", img: li, fold: true },
    { key: "x", label: "X / Twitter", img: x, fold: false },
    { key: "instagram", label: "Instagram — Feed", img: ig, fold: false },
  ];

  for (const ch of channels) {
    const copy = readCopy(slug, ch.key, lang);
    if (!copy) {
      blocks.push(card(ch.label, `<p class="missing">${ch.key}.${lang}.txt fehlt</p>`));
      continue;
    }
    const count = ch.key === "x" ? countX(copy) : copy.length;
    const extra =
      ch.key === "x" && count !== copy.length
        ? `<span class="note-inline">roh ${copy.length}, URL zählt als 23</span>`
        : "";
    blocks.push(
      card(
        ch.label,
        `<div class="post">
           <div class="author"><span class="avatar">1</span><div><b>Michael Schiffer</b><br><small>1stAI · AI consulting for teams that ship</small></div></div>
           <div class="copy">${ch.fold ? withFold(copy) : linkify(copy)}</div>
           ${ch.img ? `<img class="attach" src="${ch.img}" alt="">` : '<p class="missing">Bild fehlt</p>'}
         </div>
         <div class="meta">${counter("Zeichen", count, LIMITS[ch.key])}${extra}</div>`
      )
    );
  }

  if (story) {
    blocks.push(
      card(
        "Story 9:16 (Instagram / LinkedIn)",
        `<img class="story" src="${story}" alt="">
         <p class="note">Kein eigener Text — die Caption des Feed-Posts wird mitverwendet.</p>`
      )
    );
  }

  return `<div class="lang" id="${lang}">
    <h2>${lang.toUpperCase()} — ${escapeHtml(post.title)}</h2>
    <p class="sub">${escapeHtml(url)}</p>
    <div class="grid">${blocks.join("")}</div>
  </div>`;
}

const CSS = `
:root{--primary:#F97316;--deep:#C2410C;--ink:#141414;--muted:#666;--subtle:#F4F5F0;--line:#e5e5e2;}
*{box-sizing:border-box;margin:0;padding:0}
body{font:16px/1.55 -apple-system,'Segoe UI',Roboto,sans-serif;color:var(--ink);background:#fafaf8;padding:32px 20px 64px}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:26px;font-weight:700;letter-spacing:-.02em}
.lede{color:var(--muted);margin:8px 0 28px;max-width:70ch}
.lang{margin-top:40px;border-top:3px solid var(--primary);padding-top:20px}
.lang h2{font-size:20px;font-weight:700}
.sub{color:var(--muted);font-size:14px;margin-bottom:20px}
.grid{display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(340px,1fr))}
.card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px;min-width:0}
.card h3{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--primary);margin-bottom:14px}
.card img{width:100%;height:auto;display:block;border-radius:8px}
.unfurl{border:1px solid var(--line);border-radius:10px;overflow:hidden}
.unfurl img{border-radius:0}
.unfurl-meta{padding:12px 14px;background:var(--subtle)}
.domain{font-size:12px;color:var(--muted);text-transform:lowercase}
.unfurl-title{font-weight:700;margin:3px 0}
.unfurl-desc{font-size:14px;color:var(--muted)}
.post{border:1px solid var(--line);border-radius:10px;padding:14px}
.author{display:flex;gap:10px;align-items:center;margin-bottom:12px}
.avatar{width:40px;height:40px;border-radius:50%;background:var(--primary);color:#fff;display:grid;place-items:center;font-weight:700;flex:0 0 auto}
.author small{color:var(--muted);font-size:12px}
.copy{white-space:pre-wrap;font-size:15px;margin-bottom:12px;overflow-wrap:anywhere}
.url{color:#0a66c2;text-decoration:underline}
.fold{color:var(--muted);font-weight:600;display:block;margin:6px 0}
.folded{color:#8a8a86}
.attach{margin-top:4px}
.story{max-width:290px;margin:0 auto}
.meta{margin-top:12px;display:flex;gap:12px;align-items:center;flex-wrap:wrap}
.count{font:13px/1 ui-monospace,monospace;padding:5px 10px;border-radius:99px}
.count.ok{background:#e8f5ee;color:#1a7f46}
.count.warn{background:#fff4e5;color:var(--deep)}
.count.bad{background:#fdeaea;color:#b42318}
.note,.note-inline{font-size:13px;color:var(--muted)}
.note{margin-top:10px}
.missing{color:#b42318;font-size:14px;font-weight:600}
@media (prefers-color-scheme:dark){
  body{background:#131312;color:#f2f2ef}
  .card,.post,.unfurl{background:#1c1c1a;border-color:#333330}
  .unfurl-meta{background:#232320}
  .count.ok{background:#12301f;color:#5fd39a}
  .count.warn{background:#3a2410;color:#fbbf87}
  .count.bad{background:#3a1615;color:#ff9b95}
  .folded{color:#8a8a86}
}
`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  if (!slug || slug === true) {
    console.error("Usage: node scripts/blog-social-preview.mjs --slug <slug>");
    process.exit(2);
  }

  const { getLocalizedPost } = await import(path.join(ROOT, "src/content/blog/posts.js"));

  const sections = [];
  for (const lang of LANGS) {
    const post = getLocalizedPost(slug, lang);
    if (!post) {
      console.warn(`! no "${lang}" block for ${slug} — skipped`);
      continue;
    }
    sections.push(await buildLang(slug, lang, post, path.join(ROOT, "public", "blog", slug, lang)));
  }
  if (sections.length === 0) throw new Error(`No published post "${slug}".`);

  const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Social-Vorschau — ${escapeHtml(slug)}</title><style>${CSS}</style></head>
<body><div class="wrap">
<h1>Social-Vorschau</h1>
<p class="lede">Wie der Beitrag <code>${escapeHtml(slug)}</code> auf den einzelnen Kanälen ankommt. Bilder sind für diese Datei verkleinert — Schärfe auf den Originalen in <code>public/blog/${escapeHtml(slug)}/&lt;lang&gt;/</code> beurteilen. Die LinkedIn-Faltmarke ist eine Näherung.</p>
${sections.join("")}
</div></body></html>`;

  const outFile = path.join(ROOT, "blog-drafts", slug, "preview.html");
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, html, "utf8");
  console.log(
    `Wrote ${path.relative(ROOT, outFile)} (${Math.round(html.length / 1024)} KB, ${sections.length} language(s))`
  );
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
