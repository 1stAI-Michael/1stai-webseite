#!/usr/bin/env node
/**
 * Renders all branded image formats for a blog post.
 *
 *   node scripts/blog-assets.mjs --slug <slug> [--pick 2] [--lang de] [--formats og,linkedin]
 *
 * Reads a source image from  blog-inbox/<slug>/
 * Writes branded images to   public/blog/<slug>/<lang>/
 *
 * Without --lang every language of the post is rendered. Each set carries the
 * title and the URL in its own language, so /de/ and /en/ never share a file.
 *
 * The source image is embedded as a data URI, the brand fonts are loaded from
 * assets/fonts/ — so a render is fully offline and byte-stable. No network, no
 * Google Fonts at render time.
 *
 * Formats (see FORMATS below):
 *   cover     1600x900   website hero + blog index card
 *   og        1200x627   OpenGraph / X summary_large_image / LinkedIn link preview
 *   linkedin  1200x1200  LinkedIn square feed post
 *   x         1600x900   X/Twitter in-feed image
 *   instagram 1080x1080  Instagram feed
 *   story     1080x1920  Instagram / LinkedIn story, 9:16
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LANGS = ["de", "en"];

const BRAND = {
  primary: "#F97316",
  primaryDeep: "#C2410C",
  ink: "#141414",
  inkMuted: "#666666",
  inkSubtle: "#F4F5F0",
  white: "#FFFFFF",
  domain: "1stai.eu",
  wordmark: "1stAI",
};

// Layered Wedge — six nodes in three layers. Kept inline so the renderer has
// no dependency on the public/ asset tree.
function logoSvg(color = BRAND.primary, scale = 1) {
  const nodes = [
    [70, 14],
    [55, 40],
    [85, 40],
    [42, 66],
    [70, 66],
    [98, 66],
  ];
  const links = [
    [70, 14, 55, 40],
    [70, 14, 85, 40],
    [55, 40, 42, 66],
    [55, 40, 70, 66],
    [85, 40, 70, 66],
    [85, 40, 98, 66],
  ];
  const w = 140 * scale;
  const h = 80 * scale;
  return `<svg width="${w}" height="${h}" viewBox="0 0 140 80" xmlns="http://www.w3.org/2000/svg">
    ${links
      .map(
        ([x1, y1, x2, y2]) =>
          `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="1.2" opacity="0.6"/>`
      )
      .join("")}
    ${nodes.map(([cx, cy]) => `<circle cx="${cx}" cy="${cy}" r="5" fill="${color}"/>`).join("")}
  </svg>`;
}

const FORMATS = {
  // The cover is the only format served from our own pages — and on the index it
  // loads once per card, so it goes out as JPEG. The social formats stay PNG:
  // they are mostly crisp type on flat white, where JPEG rings visibly.
  cover: {
    width: 1600,
    height: 900,
    layout: "landscape",
    titleSize: 54,
    file: "cover-1600x900.jpg",
    type: "jpeg",
    quality: 90,
  },
  og: { width: 1200, height: 627, layout: "landscape", titleSize: 44, file: "og-1200x627.png" },
  x: { width: 1600, height: 900, layout: "landscape", titleSize: 54, file: "x-1600x900.png" },
  linkedin: { width: 1200, height: 1200, layout: "square", titleSize: 58, file: "linkedin-1200x1200.png" },
  instagram: { width: 1080, height: 1080, layout: "square", titleSize: 54, file: "instagram-1080x1080.png" },
  story: { width: 1080, height: 1920, layout: "story", titleSize: 62, file: "instagram-story-1080x1920.png" },
};

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/home/vm_codex00/.cache/puppeteer/chrome/linux-145.0.7632.77/chrome-linux64/chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
];

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  const base = path.join(process.env.HOME || "/root", ".cache/puppeteer/chrome");
  if (fs.existsSync(base)) {
    for (const dir of fs.readdirSync(base)) {
      const guess = path.join(base, dir, "chrome-linux64", "chrome");
      if (fs.existsSync(guess)) return guess;
    }
  }
  throw new Error(
    "No Chrome/Chromium binary found. Set CHROME_PATH=/path/to/chrome and retry."
  );
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
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

const MIME = { ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

/**
 * Language-specific source, if present: a file ending in `-<lang>.<ext>` is used
 * for that language only. Needed for rendered schematics, which carry text and
 * therefore differ per language; photos stay shared.
 */
function pickSourceForLang(inboxDir, lang) {
  if (!fs.existsSync(inboxDir)) return null;
  const hit = fs
    .readdirSync(inboxDir)
    .filter((f) => MIME[path.extname(f).toLowerCase()])
    .filter((f) => new RegExp(`-${lang}\\.[a-z]+$`, "i").test(f))
    .sort()[0];
  return hit ? path.join(inboxDir, hit) : null;
}

function pickSource(inboxDir, pick) {
  if (!fs.existsSync(inboxDir)) {
    throw new Error(
      `Inbox missing: ${path.relative(ROOT, inboxDir)}\n` +
        `Create it and drop the generated image(s) in as source-1.png, source-2.png, …`
    );
  }
  const files = fs
    .readdirSync(inboxDir)
    .filter((f) => MIME[path.extname(f).toLowerCase()])
    .sort();
  if (files.length === 0) {
    throw new Error(`No image files in ${path.relative(ROOT, inboxDir)} (png/jpg/webp expected).`);
  }
  const index = pick ? Number(pick) - 1 : 0;
  if (!files[index]) {
    throw new Error(
      `--pick ${pick} out of range. Available: ${files.map((f, i) => `${i + 1}=${f}`).join(", ")}`
    );
  }
  return path.join(inboxDir, files[index]);
}

function dataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext];
  if (!mime) throw new Error(`Unsupported image type: ${ext}`);
  return `data:${mime};base64,${fs.readFileSync(filePath).toString("base64")}`;
}

function fontFace(family, file) {
  const fontPath = path.join(ROOT, "assets", "fonts", file);
  if (!fs.existsSync(fontPath)) {
    throw new Error(
      `Missing brand font: assets/fonts/${file}\n` +
        `Fonts are vendored so renders are reproducible offline. See BLOG-WORKFLOW.md.`
    );
  }
  const base64 = fs.readFileSync(fontPath).toString("base64");
  return `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${base64}) format('woff2');font-weight:100 900;font-display:block;}`;
}

/** Soft line balancing so a two-line title does not leave one word alone. */
function balanceTitle(title, maxPerLine) {
  const words = title.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxPerLine && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHtml({ format, title, kicker, url, imageUri, fonts }) {
  const { width, height, layout, titleSize } = format;
  const pad = Math.round(width * 0.045);
  const maxPerLine = layout === "landscape" ? 34 : 24;
  const titleLines = balanceTitle(title, maxPerLine);

  // Landscape: image fills the frame, text sits on a white band at the top.
  // Square/story: image on top, text block underneath — reads better in a feed.
  const imageBlock =
    layout === "landscape"
      ? `<div class="photo photo-fill"><img src="${imageUri}" alt=""></div>`
      : `<div class="photo photo-inset"><img src="${imageUri}" alt=""></div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  ${fonts}
  *{margin:0;padding:0;box-sizing:border-box;}
  html,body{width:${width}px;height:${height}px;}
  body{
    background:${BRAND.white};
    font-family:'Manrope',system-ui,sans-serif;
    -webkit-font-smoothing:antialiased;
  }
  .frame{
    position:relative;width:${width}px;height:${height}px;
    display:flex;flex-direction:column;
    background:${BRAND.white};
    border-bottom:${Math.round(height * 0.012)}px solid ${BRAND.primary};
    overflow:hidden;
  }
  .photo{position:relative;overflow:hidden;background:${BRAND.inkSubtle};}
  .photo img{width:100%;height:100%;object-fit:cover;display:block;}
  .photo-fill{position:absolute;inset:0;}
  .photo-inset{flex:0 0 ${layout === "story" ? "46%" : "52%"};}
  .content{
    position:relative;z-index:2;
    padding:${pad}px ${pad}px ${Math.round(pad * 0.85)}px;
    display:flex;flex-direction:column;gap:${Math.round(pad * 0.5)}px;
    ${
      layout === "landscape"
        ? // All copy sits on an opaque white panel that fades into the photo
          // below it — text contrast is then independent of the image.
          `background:linear-gradient(180deg,${BRAND.white} 0%,${BRAND.white} 84%,rgba(255,255,255,0) 100%);
           padding-bottom:${Math.round(pad * 1.6)}px;`
        : "flex:1;justify-content:center;"
    }
  }
  .brandrow{display:flex;align-items:center;gap:${Math.round(pad * 0.32)}px;}
  .brandrow svg{display:block;}
  .wordmark{
    font-family:'Space Grotesk',system-ui,sans-serif;font-weight:700;
    font-size:${Math.round(titleSize * 0.58)}px;color:${BRAND.ink};letter-spacing:-0.02em;
  }
  .kicker{
    font-weight:600;font-size:${Math.round(titleSize * 0.34)}px;
    text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.primary};
  }
  h1{
    font-family:'Space Grotesk',system-ui,sans-serif;font-weight:700;
    font-size:${titleSize}px;line-height:1.08;letter-spacing:-0.025em;
    color:${BRAND.ink};max-width:${layout === "landscape" ? "88%" : "100%"};
  }
  .link{
    margin-top:auto;font-weight:600;font-size:${Math.round(titleSize * 0.36)}px;
    color:${BRAND.inkMuted};
  }
  .link b{color:${BRAND.primary};font-weight:700;}
</style></head>
<body>
  <div class="frame">
    ${layout === "landscape" ? imageBlock : ""}
    ${layout !== "landscape" ? imageBlock : ""}
    <div class="content">
      <div class="brandrow">${logoSvg(BRAND.primary, titleSize / 90)}<span class="wordmark">${BRAND.wordmark}</span></div>
      ${kicker ? `<div class="kicker">${escapeHtml(kicker)}</div>` : ""}
      <h1>${titleLines.map(escapeHtml).join("<br>")}</h1>
      <div class="link"><b>${BRAND.domain}</b>${url ? escapeHtml(url) : ""}</div>
    </div>
  </div>
</body></html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  if (!slug || slug === true) {
    console.error("Usage: node scripts/blog-assets.mjs --slug <slug> [--pick N] [--lang de|en] [--formats a,b]");
    process.exit(2);
  }

  // Deliberately not getLocalizedPost(): that one hides drafts, and a draft is
  // exactly what needs images rendered for review.
  const { posts, localizePost } = await import(path.join(ROOT, "src/content/blog/posts.js"));
  const entry = posts.find((p) => p.slug === slug);

  const langs = args.lang && args.lang !== true ? [args.lang] : LANGS;
  const localized = [];
  for (const lang of langs) {
    const post = entry ? localizePost(entry, lang) : null;
    if (!post) {
      throw new Error(
        `No post "${slug}" with a "${lang}" block in src/content/blog/posts.js (draft: true also hides it).`
      );
    }
    localized.push(post);
  }

  const inboxDir = path.join(ROOT, "blog-inbox", slug);
  const sharedSource = pickSource(inboxDir, args.pick === true ? undefined : args.pick);

  const fonts = [
    fontFace("Space Grotesk", "SpaceGrotesk-latin-ext.woff2"),
    fontFace("Manrope", "Manrope-latin-ext.woff2"),
  ].join("\n");

  const requested =
    args.formats && args.formats !== true
      ? String(args.formats)
          .split(",")
          .map((f) => f.trim())
      : Object.keys(FORMATS);

  for (const name of requested) {
    if (!FORMATS[name]) {
      throw new Error(`Unknown format "${name}". Known: ${Object.keys(FORMATS).join(", ")}`);
    }
  }

  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });

  try {
    for (const post of localized) {
      const { lang } = post;
      const sourceFile = pickSourceForLang(inboxDir, lang) || sharedSource;
      const imageUri = dataUri(sourceFile);
      console.log(`\nsource (${lang}): ${path.relative(ROOT, sourceFile)}`);
      const outDir = path.join(ROOT, "public", "blog", slug, lang);
      fs.mkdirSync(outDir, { recursive: true });
      console.log(`${lang}: ${post.title}`);

      for (const name of requested) {
        const format = FORMATS[name];
        const page = await browser.newPage();
        // deviceScaleFactor 1 — the CSS canvas already has the target pixel size,
        // so scaling would produce oversized files, not sharper text.
        await page.setViewport({ width: format.width, height: format.height, deviceScaleFactor: 1 });
        await page.setContent(
          buildHtml({
            format,
            title: post.title,
            kicker: post.articleSection,
            // Deliberately the blog index, not the full slug — a 40-character
            // slug is unreadable in an image and nobody retypes it.
            url: `/${lang}/blog/`,
            imageUri,
            fonts,
          }),
          { waitUntil: "load" }
        );
        await page.evaluate(() => document.fonts.ready);
        const outFile = path.join(outDir, format.file);
        await page.screenshot({
          path: outFile,
          type: format.type || "png",
          ...(format.quality ? { quality: format.quality } : {}),
        });
        await page.close();
        const kb = Math.round(fs.statSync(outFile).size / 1024);
        console.log(`  ✓ ${lang}/${format.file}  ${format.width}x${format.height}  ${kb} KB`);
      }
    }
  } finally {
    await browser.close();
  }

  console.log(`\nWritten to public/blog/${slug}/{${langs.join(",")}}/ — verify with: node scripts/blog-check.mjs`);
}

main().catch((error) => {
  console.error(`\n✗ ${error.message}`);
  process.exit(1);
});
