#!/usr/bin/env node
/**
 * Pre-flight check for the blog. Run before every build and before every deploy.
 *
 *   node scripts/blog-check.mjs               # all published posts
 *   node scripts/blog-check.mjs --slug <slug> # one post
 *   node scripts/blog-check.mjs --built       # additionally verify out/ after a build
 *
 * Exit code 0 = clean, 1 = errors found. Warnings never fail the run.
 *
 * This is the part of the workflow that makes it repeatable: everything a human
 * would otherwise have to remember to look at is asserted here.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LANGS = ["de", "en"];

const errors = [];
const warnings = [];

const fail = (where, message) => errors.push(`${where}: ${message}`);
const warn = (where, message) => warnings.push(`${where}: ${message}`);

// The root layout's title template appends this to every <title>, so it eats
// into the ~60 characters Google renders. The budget below is for the raw title.
const TITLE_SUFFIX = " - 1stAI";

const LIMITS = {
  titleMax: 60 - TITLE_SUFFIX.length,
  excerptMin: 110,
  excerptMax: 175,
  faqMin: 4,
  sourcesMin: 3,
  linkedin: 3000,
  x: 280,
  instagram: 2200,
};

// maxKb reflects how the file is delivered, not how it looks:
//   cover — served from our own pages, once per card on the index
//   og    — fetched by crawlers and link unfurlers on every share
//   rest  — uploaded to the platform by hand, never served by us
const EXPECTED_IMAGES = [
  ["cover-1600x900.jpg", 1600, 900, 300],
  ["og-1200x627.png", 1200, 627, 800],
  ["x-1600x900.png", 1600, 900, 5120],
  ["linkedin-1200x1200.png", 1200, 1200, 5120],
  ["instagram-1080x1080.png", 1080, 1080, 5120],
  ["instagram-story-1080x1920.png", 1080, 1920, 5120],
];

const SOCIAL_FILES = ["linkedin", "x", "instagram"];

/** Reads width/height straight out of the PNG IHDR chunk — no image library. */
function pngSize(buffer) {
  if (buffer.toString("latin1", 1, 4) !== "PNG") return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

/**
 * Reads width/height from the first JPEG SOF marker. Walks the segment chain
 * rather than scanning for bytes, so it cannot trip over payload data.
 */
function jpegSize(buffer) {
  if (buffer.readUInt16BE(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) return null;
    const marker = buffer[offset + 1];
    // SOF0..SOF15, excluding DHT (c4), JPG (c8) and DAC (cc).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  return null;
}

function imageSize(file) {
  const buffer = fs.readFileSync(file);
  return path.extname(file).toLowerCase() === ".jpg" ? jpegSize(buffer) : pngSize(buffer);
}

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

function checkImages(slug, lang) {
  const dir = path.join(ROOT, "public", "blog", slug, lang);
  const where = `${slug} images [${lang}]`;
  if (!fs.existsSync(dir)) {
    fail(
      where,
      `public/blog/${slug}/${lang}/ missing — run: node scripts/blog-assets.mjs --slug ${slug}`
    );
    return;
  }
  for (const [file, width, height, maxKb] of EXPECTED_IMAGES) {
    const full = path.join(dir, file);
    if (!fs.existsSync(full)) {
      fail(where, `${file} missing`);
      continue;
    }
    const size = imageSize(full);
    if (!size) {
      fail(where, `${file} is not a readable PNG/JPEG (social platforms do not render SVG)`);
      continue;
    }
    if (size.width !== width || size.height !== height) {
      fail(where, `${file} is ${size.width}x${size.height}, expected ${width}x${height}`);
    }
    const kb = fs.statSync(full).size / 1024;
    if (kb > maxKb) {
      warn(where, `${file} is ${Math.round(kb)} KB, budget ${maxKb} KB — re-compress`);
    }
  }
}

function checkSocialText(slug) {
  const dir = path.join(ROOT, "blog-drafts", slug, "social");
  const where = `${slug} social`;
  if (!fs.existsSync(dir)) {
    warn(where, `blog-drafts/${slug}/social/ missing — no social copy drafted yet`);
    return;
  }
  for (const channel of SOCIAL_FILES) {
    for (const lang of LANGS) {
      const file = path.join(dir, `${channel}.${lang}.txt`);
      if (!fs.existsSync(file)) {
        warn(where, `${channel}.${lang}.txt missing`);
        continue;
      }
      const text = fs.readFileSync(file, "utf8").trim();
      if (!text) {
        fail(where, `${channel}.${lang}.txt is empty`);
        continue;
      }
      // X counts an URL as 23 characters regardless of its real length.
      const counted =
        channel === "x" ? text.replace(/https?:\/\/\S+/g, "x".repeat(23)).length : text.length;
      if (counted > LIMITS[channel]) {
        fail(where, `${channel}.${lang}.txt is ${counted} chars, limit ${LIMITS[channel]}`);
      }
      // Instagram captions cannot carry clickable links — "link in bio" instead,
      // so only the channels where a URL actually works are checked.
      if (channel !== "instagram" && !/1stai\.eu|\/blog\//.test(text)) {
        warn(where, `${channel}.${lang}.txt contains no link to the article`);
      }

      checkLeaks(`${where} ${channel}.${lang}.txt`, text);
    }
  }
}

function checkLanguageBlock(slug, lang, post) {
  const where = `${slug} [${lang}]`;

  if (!post.title) fail(where, "title missing");
  else if (post.title.length > LIMITS.titleMax) {
    fail(
      where,
      `title is ${post.title.length} chars, max ${LIMITS.titleMax} ` +
        `(+${TITLE_SUFFIX.length} for "${TITLE_SUFFIX.trim()}" = 60 rendered)`
    );
  }

  if (!post.excerpt) {
    fail(where, "excerpt missing");
  } else if (post.excerpt.length < LIMITS.excerptMin || post.excerpt.length > LIMITS.excerptMax) {
    warn(
      where,
      `excerpt is ${post.excerpt.length} chars — aim for ${LIMITS.excerptMin}–${LIMITS.excerptMax} (meta description)`
    );
  }

  // Tags are the keyword set and live per language — they carry into JSON-LD
  // `keywords`, the meta keywords and llms.txt.
  if (post.tags.length < 5) warn(where, `${post.tags.length} tags — aim for 5–13 keywords`);

  const body = post.bodyMarkdown || "";
  if (!body.trim()) {
    fail(where, "bodyMarkdown missing");
    return;
  }
  if (/^#\s/m.test(body.trimStart().split("\n")[0] || "")) {
    fail(where, "body starts with an H1 — the H1 is rendered from `title`, start at H2");
  }
  if (!/^##\s/m.test(body)) warn(where, "body has no H2 headings");

  if (post.faq.length < LIMITS.faqMin) {
    warn(where, `${post.faq.length} FAQ items — aim for at least ${LIMITS.faqMin} (FAQPage schema)`);
  }
  for (const item of post.faq) {
    if (!item.q || !item.a) fail(where, "FAQ item with empty q or a");
  }

  if (post.sources.length < LIMITS.sourcesMin) {
    warn(where, `${post.sources.length} sources — aim for at least ${LIMITS.sourcesMin}`);
  }
  for (const source of post.sources) {
    if (!source.url || !/^https?:\/\//.test(source.url || "")) {
      fail(where, `source "${source.title || "?"}" has no absolute URL`);
    }
  }

  // Internal links must carry the language prefix, or they 404 in the export.
  const internal = [...body.matchAll(/\]\((\/[^)]*)\)/g)].map((m) => m[1]);
  for (const href of internal) {
    if (/^\/(de|en)\//.test(href)) continue;
    if (/^\/(Recorder|Settings|atemuebung|assets|blog)\//.test(href)) continue;
    fail(where, `internal link "${href}" lacks a /de/ or /en/ prefix`);
  }
  for (const href of internal) {
    if (!href.endsWith("/") && !href.includes("#") && !/\.\w+$/.test(href)) {
      warn(where, `internal link "${href}" has no trailing slash (trailingSlash: true)`);
    }
  }

  // Everything reader-visible goes through the confidentiality guard, not just
  // the body — a client name in a FAQ answer or an alt text ships just as far.
  checkLeaks(
    where,
    [
      post.title,
      post.excerpt,
      post.coverAlt,
      post.tags.join(" "),
      body,
      post.faq.map((f) => `${f.q} ${f.a}`).join(" "),
      post.sources.map((s) => s.title).join(" "),
    ].join("\n")
  );
}

/**
 * 1stAI publishes under its own name only: no sister company, no client names,
 * no internal identifiers. Extend LEAK_PATTERNS when a new client or system
 * enters the picture — this is the only automatic backstop.
 */
const LEAK_PATTERNS = [
  [/\bfA-\d+\b/, "internal ticket id"],
  [/\bgx10-\d+\b/i, "internal hostname"],
  [/~\/gx10-test\b/, "internal path"],
  [/\bThe Implementers\b/i, "sister company name"],
  [/\bimplementers\.de\b/i, "sister company domain"],
  [/\bschraml\b/i, "client name"],
  [/\bzander\b/i, "client name"],
  [/\bmolling\b/i, "client name"],
  [/\bC3[A-Z0-9]{4,}\b/, "customer program name"],
];

function checkLeaks(where, text) {
  for (const [pattern, label] of LEAK_PATTERNS) {
    const hit = text.match(pattern);
    if (hit) fail(where, `contains ${label}: "${hit[0]}"`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const { posts, getAllPosts, localizePost } = await import(
    path.join(ROOT, "src/content/blog/posts.js")
  );

  const drafts = posts.filter((p) => p.draft);
  const published = getAllPosts().filter((p) => (args.slug && args.slug !== true ? p.slug === args.slug : true));

  if (args.slug && args.slug !== true && published.length === 0) {
    console.error(`✗ No published post with slug "${args.slug}".`);
    process.exit(1);
  }

  if (published.length === 0) {
    fail("posts.js", "no published posts — the static export needs at least one");
  }

  const seen = new Set();
  for (const post of published) {
    const where = post.slug;

    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug)) {
      fail(where, "slug must be lowercase kebab-case");
    }
    if (seen.has(post.slug)) fail(where, "duplicate slug");
    seen.add(post.slug);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(post.date || "")) {
      fail(where, `date "${post.date}" is not YYYY-MM-DD`);
    }
    if (post.updated && new Date(post.updated) < new Date(post.date)) {
      fail(where, "updated is before date");
    }
    for (const lang of LANGS) {
      const localized = localizePost(post, lang);
      if (!localized) {
        fail(where, `no "${lang}" block — both languages are required before publishing`);
        continue;
      }
      checkLanguageBlock(post.slug, lang, localized);
      checkImages(post.slug, lang);
    }

    checkSocialText(post.slug);
  }

  if (args.built) {
    const outDir = path.join(ROOT, "out");
    if (!fs.existsSync(outDir)) {
      fail("out/", "no build output — run npm run build first");
    } else {
      for (const post of published) {
        for (const lang of LANGS) {
          const page = path.join(outDir, lang, "blog", post.slug, "index.html");
          if (!fs.existsSync(page)) {
            fail("out/", `${lang}/blog/${post.slug}/index.html missing`);
            continue;
          }
          const html = fs.readFileSync(page, "utf8");
          const checks = [
            [/<link rel="canonical"/, "canonical link"],
            [/property="og:image"/, "og:image"],
            [/og-1200x627\.png/, "og:image pointing at the PNG"],
            [/property="og:type" content="article"/, "og:type=article"],
            [/name="twitter:card" content="summary_large_image"/, "twitter:card"],
            // Next emits hrefLang in camelCase; HTML attribute names are
            // case-insensitive, so crawlers read it fine — match either.
            [/hreflang="de"/i, "hreflang de"],
            [/hreflang="en"/i, "hreflang en"],
            [/"@type":"BlogPosting"/, "BlogPosting JSON-LD"],
            [/"@type":"FAQPage"/, "FAQPage JSON-LD"],
          ];
          for (const [pattern, label] of checks) {
            if (!pattern.test(html)) fail("out/", `${lang}/blog/${post.slug}/ is missing ${label}`);
          }
        }
      }
      const sitemap = path.join(outDir, "sitemap.xml");
      if (!fs.existsSync(sitemap)) fail("out/", "sitemap.xml missing");
      else {
        const xml = fs.readFileSync(sitemap, "utf8");
        for (const post of published) {
          for (const lang of LANGS) {
            if (!xml.includes(`/${lang}/blog/${post.slug}/`)) {
              fail("out/", `sitemap.xml is missing /${lang}/blog/${post.slug}/`);
            }
          }
        }
      }
      if (!fs.existsSync(path.join(outDir, "robots.txt"))) fail("out/", "robots.txt missing");
      const llms = path.join(outDir, "llms.txt");
      if (!fs.existsSync(llms)) {
        fail("out/", "llms.txt missing — prebuild did not run (use npm run build)");
      } else {
        const text = fs.readFileSync(llms, "utf8");
        for (const post of published) {
          if (!text.includes(post.slug)) fail("out/", `llms.txt is missing ${post.slug}`);
        }
      }
      for (const lang of LANGS) {
        if (!fs.existsSync(path.join(outDir, lang, "feed.xml"))) {
          warn("out/", `${lang}/feed.xml missing`);
        }
      }
    }
  }

  console.log(`Checked ${published.length} published post(s)${drafts.length ? `, ${drafts.length} draft(s) skipped` : ""}.`);
  for (const warning of warnings) console.log(`  ! ${warning}`);
  for (const error of errors) console.log(`  ✗ ${error}`);

  if (errors.length > 0) {
    console.log(`\n${errors.length} error(s), ${warnings.length} warning(s) — not ready to deploy.`);
    process.exit(1);
  }
  console.log(`\nOK — ${warnings.length} warning(s), no errors.`);
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
