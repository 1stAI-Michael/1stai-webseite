#!/usr/bin/env node
/**
 * Exports a post as plain Markdown for review — one file per language.
 *
 *   node scripts/blog-export.mjs --slug <slug>
 *
 * Writes blog-drafts/<slug>/review.<lang>.md with the metadata, the body, the
 * FAQ and the sources in one readable stream. Intended for a line-by-line
 * review against contractual or confidentiality constraints, where a rendered
 * page gets in the way and posts.js is noisy to read.
 *
 * Works for drafts and published posts alike.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LANGS = ["de", "en"];

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

const args = parseArgs(process.argv.slice(2));
if (!args.slug || args.slug === true) {
  console.error("Usage: node scripts/blog-export.mjs --slug <slug>");
  process.exit(2);
}

const { posts, localizePost } = await import(path.join(ROOT, "src/content/blog/posts.js"));
const post = posts.find((p) => p.slug === args.slug);
if (!post) throw new Error(`No post "${args.slug}" in posts.js`);

const outDir = path.join(ROOT, "blog-drafts", post.slug);
fs.mkdirSync(outDir, { recursive: true });

for (const lang of LANGS) {
  const p = localizePost(post, lang);
  if (!p) {
    console.log(`  – ${lang}: no block, skipped`);
    continue;
  }

  const words = p.bodyMarkdown.trim().split(/\s+/).length;
  const lines = [
    `# Review-Export — ${p.title}`,
    "",
    `**Slug:** \`${post.slug}\`  `,
    `**Sprache:** ${lang}  `,
    `**Status:** ${post.draft ? "ENTWURF (nicht veröffentlicht)" : "VERÖFFENTLICHT"}  `,
    `**Datum:** ${post.date}${post.updated && post.updated !== post.date ? ` (geändert ${post.updated})` : ""}  `,
    `**URL nach Veröffentlichung:** https://1stai.eu/${lang}/blog/${post.slug}/  `,
    `**Umfang:** ca. ${words} Wörter, ${p.faq.length} FAQ, ${p.sources.length} Quellen`,
    "",
    "---",
    "",
    "## Metadaten",
    "",
    `**Titel (${p.title.length} Zeichen):** ${p.title}`,
    "",
    `**Excerpt / Meta-Description (${p.excerpt.length} Zeichen):** ${p.excerpt}`,
    "",
    `**Rubrik:** ${p.articleSection}`,
    "",
    `**Alt-Text Titelbild:** ${p.coverAlt}`,
    "",
    `**Keywords:** ${p.tags.join(", ")}`,
    "",
    "---",
    "",
    "## Fließtext",
    "",
    p.bodyMarkdown.trim(),
    "",
    "---",
    "",
    "## FAQ",
    "",
  ];

  p.faq.forEach((item, i) => {
    lines.push(`**${i + 1}. ${item.q}**`, "", item.a, "");
  });

  lines.push("---", "", "## Quellen", "");
  for (const s of p.sources) lines.push(`- [${s.title}](${s.url})`);
  lines.push("");

  const file = path.join(outDir, `review.${lang}.md`);
  fs.writeFileSync(file, lines.join("\n"), "utf8");
  console.log(`  ✓ ${path.relative(ROOT, file)}  (${words} Wörter)`);
}
