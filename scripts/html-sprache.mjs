#!/usr/bin/env node
/**
 * `<html lang>` je Seite richtigstellen, nach dem Export.
 *
 * Warum ein Nachlauf und keine Korrektur im Layout: Das `<html>`-Element darf in
 * Next.js nur im Wurzel-Layout stehen, und das Wurzel-Layout kennt das
 * `[lang]`-Segment nicht — es liegt darueber. Die sauberen Auswege waeren mehrere
 * Wurzel-Layouts ueber Routen-Gruppen (ein Umbau der gesamten Routenstruktur) oder
 * ein Setzen im Browser. Letzteres ist ausdruecklich KEINE Loesung: Es repariert,
 * was der Mensch in den Entwicklerwerkzeugen sieht, und laesst genau das falsch,
 * was ausgeliefert wird — also das, was Suchmaschinen und Vorleseprogramme lesen.
 * Eine Korrektur, die im Browser gruen aussieht und im Artefakt falsch bleibt,
 * waere schlimmer als der Fehler.
 *
 * Fehlerverhalten ist Absicht: Taucht eine HTML-Datei auf, deren oberste Ebene hier
 * nicht steht, bricht der Lauf ab. Der Fehler, den dieses Skript behebt, ist
 * entstanden, weil eine Vorgabe still fuer alles galt. Eine neue Route soll deshalb
 * NICHT still eine Sprache erben, sondern hier eingetragen werden muessen.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const AUS = "out";

// oberste Ebene -> Sprache. Gemessen am Inhalt der gebauten Seiten, nicht geraten.
const SPRACHE = {
  de: "de",
  en: "en",
  "polityka-prywatnosci": "pl", // RODO-Text, polnische Anschrift
  atemuebung: "de", // HRV-Atemuebung, traegt selbst og:locale=de_DE
  Recorder: "de",
  Settings: "de",
  404: "en", // Next-Standardseite, englischer Text
  "404.html": "en", // dieselbe Seite noch einmal als Datei, nicht als Verzeichnis
  "_not-found": "en",
  "index.html": "en", // Weiterleitung auf /en/ — traegt gar kein lang-Attribut
};

function htmlDateien(wurzel) {
  const raus = [];
  for (const e of readdirSync(wurzel)) {
    const p = join(wurzel, e);
    if (statSync(p).isDirectory()) raus.push(...htmlDateien(p));
    else if (e.endsWith(".html")) raus.push(p);
  }
  return raus;
}

const dateien = htmlDateien(AUS);

// Erst pruefen, dann schreiben. Ein Lauf, der die Haelfte aendert und dann
// abbricht, hinterlaesst einen Bau, der teils richtig und teils falsch ist —
// und der sieht von aussen aus wie ein gelungener. (Selbst hineingelaufen,
// 23.09.2026: `404.html` fehlte in der Tabelle, acht Dateien waren schon
// geschrieben.)
const plan = [];
const unbekannt = new Set();
for (const datei of dateien) {
  const rel = relative(AUS, datei);
  const oben = rel.includes(sep) ? rel.split(sep)[0] : rel;
  const soll = SPRACHE[oben];
  if (!soll) unbekannt.add(oben);
  else plan.push([datei, soll]);
}

if (unbekannt.size) {
  console.error(
    `html-sprache: unbekannte oberste Ebene: ${[...unbekannt].join(", ")}\n` +
      `  Bitte in SPRACHE eintragen. Absichtlich ein Fehler und keine Vorgabe —\n` +
      `  eine stille Vorgabe ist genau der Fehler, den dieses Skript behebt.\n` +
      `  Es wurde NICHTS geschrieben.`
  );
  process.exit(1);
}

const zaehler = {};
let geaendert = 0;
for (const [datei, soll] of plan) {
  const text = readFileSync(datei, "utf8");
  const neu = text.replace(/<html lang="[^"]*"/g, `<html lang="${soll}"`);
  zaehler[soll] = (zaehler[soll] || 0) + 1;
  if (neu !== text) {
    writeFileSync(datei, neu);
    geaendert += 1;
  }
}

const verteilung = Object.entries(zaehler)
  .sort()
  .map(([k, v]) => `${k}=${v}`)
  .join(" · ");
console.log(
  `html-sprache: ${dateien.length} Seiten geprueft, ${geaendert} geaendert (${verteilung})`
);
