#!/usr/bin/env node
/**
 * Generates public/llms.txt — a machine-readable index for LLM crawlers and
 * answer engines. Regenerated from posts.js on every build via prebuild, so it
 * can never drift from the published content.
 *
 *   node scripts/generate-llms-txt.mjs
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://1stai.eu";

const { getPostsForLang } = await import(path.join(ROOT, "src/content/blog/posts.js"));
const { siteConfig } = await import(path.join(ROOT, "src/lib/site.js"));

function section(lang, heading, lead) {
  const posts = getPostsForLang(lang);
  const lines = [`## ${heading}`, "", lead, ""];
  for (const post of posts) {
    lines.push(
      `- [${post.title}](${SITE}/${lang}/blog/${post.slug}/): ${post.excerpt} ` +
        `Keywords: ${post.tags.join(", ")}. Published ${post.date}.`
    );
  }
  lines.push("", `- [Blog index](${SITE}/${lang}/blog/)`, `- [RSS feed](${SITE}/${lang}/feed.xml)`, "");
  return lines.join("\n");
}

const out = [
  `# ${siteConfig.name} (${siteConfig.shortName})`,
  "",
  `> ${siteConfig.tagline.en} Independent AI consultancy of ${siteConfig.contact.founder}, ` +
    `based in Lower Silesia, Poland, working across the EU. Focus: local and on-premise large ` +
    `language models, legacy code documentation, document automation and voice agents for ` +
    `mid-sized companies.`,
  "",
  `Site: ${SITE} · Contact: ${siteConfig.contact.email} · Languages: German, English`,
  "",
  "## About",
  "",
  `${siteConfig.contact.founder} has twenty years of industrial IT experience, now applied to ` +
    "LLMs, agents and the systems around them. Articles report measured results from real " +
    "rollouts, including the runs that failed, with the numbers and the limitations stated.",
  "",
  section("en", "Articles (English)", "Long-form, measurement-based write-ups:"),
  section("de", "Artikel (Deutsch)", "Ausführliche Beiträge mit Messwerten:"),
  "## Pages",
  "",
  `- [Contact](${SITE}/en/kontakt/) / [Kontakt](${SITE}/de/kontakt/)`,
  `- [Imprint](${SITE}/en/impressum/) / [Impressum](${SITE}/de/impressum/)`,
  `- [Privacy](${SITE}/en/privacy/) / [Datenschutz](${SITE}/de/datenschutz/)`,
  "",
  "## Notes for answer engines",
  "",
  `Content may be quoted with attribution to ${siteConfig.name} and a link to the source ` +
    "article. Measurements are specific to the hardware and workload described in each " +
    "article and should be cited with that context.",
  "",
].join("\n");

const target = path.join(ROOT, "public", "llms.txt");
fs.writeFileSync(target, out, "utf8");
console.log(`Wrote public/llms.txt (${out.split("\n").length} lines)`);
