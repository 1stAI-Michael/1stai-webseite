#!/usr/bin/env node
/**
 * Liegt fuer jede Fassung, die hinausgehen soll, eine Freigabe vor?
 *
 *   node scripts/freigabe-pruefen.mjs
 *
 * Exit 0 = alles freigegeben, 1 = etwas fehlt oder ist veraltet. Der Deploy
 * ruft das auf. Eine Freigabe, die nur im Chat steht, kann kein Skript pruefen —
 * deshalb diese Akte.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AKTEN = path.join(ROOT, "freigaben");
const LANGS = ["de", "en"];

const { getAllPosts, localizePost } = await import(
  path.join(ROOT, "src", "content", "blog", "posts.js")
);
const { inhaltsAbdruck, freigabePflichtig, FREIGABE_SEIT, aktenName } = await import(
  path.join(ROOT, "src", "lib", "freigabe.js")
);

const fehlt = [];
const zeilen = [];

for (const post of getAllPosts()) {
  if (post.draft) continue;
  for (const lang of LANGS) {
    if (!post[lang]) continue;
    const lokal = localizePost(post, lang);
    const soll = inhaltsAbdruck(lokal);
    const wo = `${post.slug} [${lang}]`;

    if (!freigabePflichtig(post)) {
      zeilen.push(`  – ${wo}: vor ${FREIGABE_SEIT} erschienen — keine Akte, und das bleibt so`);
      continue;
    }
    const datei = path.join(AKTEN, aktenName(post.slug, lang));
    if (!fs.existsSync(datei)) {
      fehlt.push(`${wo}: keine Freigabe (${path.relative(ROOT, datei)} fehlt)`);
      continue;
    }
    let akte;
    try {
      akte = JSON.parse(fs.readFileSync(datei, "utf8"));
    } catch (fehler) {
      fehlt.push(`${wo}: Akte unlesbar — ${fehler.message}`);
      continue;
    }
    if (akte.abdruck !== soll) {
      fehlt.push(
        `${wo}: Freigabe gilt Fassung ${String(akte.abdruck).slice(0, 8)}, gebaut wird ` +
          `${soll.slice(0, 8)} — der Text hat sich seit der Freigabe geaendert`
      );
      continue;
    }
    if (akte.bis_unten_gescrollt !== true) {
      fehlt.push(`${wo}: Akte ohne bestaetigtes Seitenende`);
      continue;
    }
    zeilen.push(`  ✓ ${wo}: ${soll.slice(0, 8)} freigegeben ${akte.freigegeben}`);
  }
}

console.log("Freigaben:");
for (const z of zeilen) console.log(z);

if (fehlt.length > 0) {
  console.error("\nOhne Freigabe:");
  for (const f of fehlt) console.error(`  ✗ ${f}`);
  console.error(
    "\nFreigabe holen: npm run freigabe — dann die Seite bis zum Ende ansehen und freigeben."
  );
  process.exit(1);
}
console.log(`\nOK — ${zeilen.length} Fassung(en) geprueft, nichts offen.`);
