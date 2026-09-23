#!/usr/bin/env node
/**
 * Vorschau mit Freigabe-Annahme.
 *
 *   npm run freigabe        baut mit Box und startet diesen Server
 *
 * Liefert out/ aus und nimmt POST /freigabe entgegen. Die Akte landet unter
 * freigaben/<slug>.<lang>.json — ein Verweis in das private Repo, damit der
 * Nachweis einen Verlauf hat und nicht auf einer Platte liegt.
 *
 * Kein Netz nach draussen, kein Dienst, keine Zugangsdaten: ein Server, der
 * laeuft, solange jemand hinsieht.
 */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "out");
const AKTEN = path.join(ROOT, "freigaben");
const NOTIZEN = path.join(AKTEN, "notizen");
const PORT = Number(process.env.PORT || 4180);

const TYPEN = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function antwort(res, code, daten) {
  const koerper = JSON.stringify(daten);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8" });
  res.end(koerper);
}

/**
 * Anmerkungen gehen sofort auf die Platte, nicht erst mit der Freigabe. Wer
 * eine Stunde liest und dann den Browser schliesst, hat trotzdem gearbeitet —
 * und wenn er nicht freigibt, ist gerade DAS der wertvolle Teil.
 */
function notieren(res, d) {
  for (const feld of ["slug", "lang", "abdruck", "text"]) {
    if (!d[feld]) return antwort(res, 400, { grund: `Feld fehlt: ${feld}` });
  }
  fs.mkdirSync(NOTIZEN, { recursive: true });
  const notiz = {
    zeit: d.zeit || new Date().toISOString(),
    angekommen: new Date().toISOString(),
    abschnitt: d.abschnitt || null,
    text: String(d.text).slice(0, 4000),
    abdruck: d.abdruck,
  };
  fs.appendFileSync(
    path.join(NOTIZEN, `${d.slug}.${d.lang}.jsonl`),
    `${JSON.stringify(notiz)}\n`,
    "utf8"
  );
  console.log(`  · Anmerkung [${d.slug}/${d.lang}] ${notiz.abschnitt || "Anfang"}: ${notiz.text}`);
  return antwort(res, 200, { notiz });
}

/** Alle Anmerkungen zu DIESER Fassung. Aeltere bleiben in der Datei stehen. */
function notizenZurFassung(slug, lang, abdruck) {
  const datei = path.join(NOTIZEN, `${slug}.${lang}.jsonl`);
  if (!fs.existsSync(datei)) return [];
  return fs
    .readFileSync(datei, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((z) => {
      try {
        return JSON.parse(z);
      } catch {
        return null;
      }
    })
    .filter((n) => n && n.abdruck === abdruck);
}

function eintragen(res, roh) {
  let d;
  try {
    d = JSON.parse(roh);
  } catch (fehler) {
    return antwort(res, 400, { grund: `kein gueltiges JSON: ${fehler.message}` });
  }
  if (d.art === "notiz") return notieren(res, d);

  for (const feld of ["slug", "lang", "abdruck", "freigegeben"]) {
    if (!d[feld]) return antwort(res, 400, { grund: `Feld fehlt: ${feld}` });
  }
  // Eine Freigabe ohne gesehenes Ende ist keine. Der Knopf ist im Browser
  // gesperrt; hier steht der Riegel noch einmal, weil ein gesperrter Knopf
  // kein Riegel ist.
  if (d.bisUntenGesehen !== true) {
    return antwort(res, 400, { grund: "bis zum Ende gescrollt wurde nicht bestaetigt" });
  }

  fs.mkdirSync(AKTEN, { recursive: true });
  const name = `${d.slug}.${d.lang}.json`;
  const datei = path.join(AKTEN, name);
  const notizen = notizenZurFassung(d.slug, d.lang, d.abdruck);
  if (d.abschliessend) {
    notizen.push({
      zeit: d.freigegeben,
      angekommen: new Date().toISOString(),
      abschnitt: "bei der Freigabe",
      text: String(d.abschliessend).slice(0, 4000),
      abdruck: d.abdruck,
    });
  }

  // Eine fruehere Freigabe wird nicht ueberschrieben, sondern ruecken in den
  // Verlauf. Sonst loescht die zweite Ansicht den Nachweis der ersten.
  let verlauf = [];
  if (fs.existsSync(datei)) {
    try {
      const alt = JSON.parse(fs.readFileSync(datei, "utf8"));
      verlauf = [...(alt.verlauf || []), { ...alt, verlauf: undefined }];
    } catch {
      verlauf = [];
    }
  }

  const akte = {
    slug: d.slug,
    lang: d.lang,
    titel: d.titel || null,
    abdruck: d.abdruck,
    freigegeben_von: "Michael",
    geoeffnet: d.geoeffnet || null,
    freigegeben: d.freigegeben,
    bis_unten_gescrollt: true,
    notizen,
    pfad: d.pfad || null,
    hinweis:
      "Gemessen sind: Ende der Seite sichtbar, Zeitpunkte, und die Anmerkungen mit der Stelle, an der sie entstanden. Dass der Text gelesen wurde, misst das nicht — die Anmerkungen zeigen es, das Scrollen allein nicht.",
    ...(verlauf.length > 0 ? { verlauf } : {}),
  };
  fs.writeFileSync(datei, `${JSON.stringify(akte, null, 2)}\n`, "utf8");

  console.log(`\n✓ Freigabe ${d.slug} [${d.lang}] Fassung ${d.abdruck.slice(0, 8)} — ${d.freigegeben}`);
  console.log(`  ${notizen.length} Anmerkung(en) in der Akte`);
  return antwort(res, 200, { akte: `freigaben/${name}`, zeit: d.freigegeben, notizen: notizen.length });
}

function ausliefern(res, urlPfad) {
  let ziel = path.join(OUT, decodeURIComponent(urlPfad.split("?")[0]));
  if (!path.resolve(ziel).startsWith(OUT)) {
    res.writeHead(403).end("nope");
    return;
  }
  if (fs.existsSync(ziel) && fs.statSync(ziel).isDirectory()) ziel = path.join(ziel, "index.html");
  if (!fs.existsSync(ziel) && fs.existsSync(`${ziel}.html`)) ziel = `${ziel}.html`;
  if (!fs.existsSync(ziel)) {
    const vierhundertvier = path.join(OUT, "404.html");
    if (fs.existsSync(vierhundertvier)) {
      res.writeHead(404, { "content-type": TYPEN[".html"] });
      res.end(fs.readFileSync(vierhundertvier));
      return;
    }
    res.writeHead(404).end("not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPEN[path.extname(ziel)] || "application/octet-stream" });
  res.end(fs.readFileSync(ziel));
}

if (!fs.existsSync(OUT)) {
  console.error("out/ fehlt — erst bauen (npm run freigabe baut selbst).");
  process.exit(1);
}

http
  .createServer((req, res) => {
    if (req.method === "POST" && req.url.split("?")[0] === "/freigabe") {
      let roh = "";
      req.on("data", (stueck) => {
        roh += stueck;
        if (roh.length > 64_000) req.destroy();
      });
      req.on("end", () => eintragen(res, roh));
      return;
    }
    if (req.method !== "GET") {
      res.writeHead(405).end("nur GET und POST /freigabe");
      return;
    }
    ausliefern(res, req.url);
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Freigabe-Vorschau auf http://0.0.0.0:${PORT}/`);
    console.log("Akten:", path.relative(ROOT, AKTEN) + "/");
    console.log("Beenden mit Strg-C. Dieser Build enthaelt die Box und darf NICHT hochgeladen werden.");
  });
