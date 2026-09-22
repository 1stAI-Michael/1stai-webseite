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

function eintragen(res, roh) {
  let d;
  try {
    d = JSON.parse(roh);
  } catch (fehler) {
    return antwort(res, 400, { grund: `kein gueltiges JSON: ${fehler.message}` });
  }
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
  const akte = {
    slug: d.slug,
    lang: d.lang,
    titel: d.titel || null,
    abdruck: d.abdruck,
    freigegeben_von: "Michael",
    geoeffnet: d.geoeffnet || null,
    freigegeben: d.freigegeben,
    bis_unten_gescrollt: true,
    kommentar: d.kommentar || "",
    pfad: d.pfad || null,
    hinweis:
      "Festgehalten ist, dass die Seite bis zum Ende gescrollt und freigegeben wurde — nicht, dass sie gelesen wurde. Der Abdruck bindet die Akte an diese Fassung.",
  };
  fs.writeFileSync(path.join(AKTEN, name), `${JSON.stringify(akte, null, 2)}\n`, "utf8");

  console.log(`\n✓ Freigabe ${d.slug} [${d.lang}] Fassung ${d.abdruck.slice(0, 8)} — ${d.freigegeben}`);
  if (d.kommentar) console.log(`  Anmerkung: ${d.kommentar}`);
  return antwort(res, 200, { akte: `freigaben/${name}`, zeit: d.freigegeben });
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
