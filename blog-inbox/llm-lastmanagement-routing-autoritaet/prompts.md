# Bildquelle — LLM-Lastmanagement

**Kein KI-Bild und kein Screenshot.** Alle Abbildungen und das Titelbild sind
schematische Nachbildungen, gerendert mit `scripts/blog-figure.mjs`.

## Warum keine Screenshots

Für diesen Beitrag lagen fünf echte Screenshots der Lastmanagement-Oberfläche
vor. Sie sind **nicht verwendbar**, und zwar nicht wegen einer Ecke, die man
schwärzen könnte, sondern weil das Identifizierende der Tabelleninhalt ist:

- interne Domain in der Adresszeile (alle vier großen Bilder)
- Tenant-Spalte mit Projekt- und Kundenbezeichnungen
- Client-Prefixe mit Projektnamen
- Schema- und Tabellenname im Erklärtext
- interne Werkzeugnamen in den Live-Chips und der Aufrufer-Spalte
- elf Endpunktnamen und vier Hostnamen in jeder Zeile
- Seitenleiste mit der vollständigen Anwendungsstruktur
- konkrete Pool-Konfiguration in der Matrix

Bei der Prüfspur wären drei von acht Spalten über etwa fünfzig Zeilen zu
entfernen. Was bliebe, wären Uhrzeiten und das Wort „normal".

## Was stattdessen entsteht

```bash
node scripts/blog-figure.mjs --slug llm-lastmanagement-routing-autoritaet
```

Erzeugt je Sprache nach `public/blog/<slug>/screens/<lang>/`:

| Datei | Zeigt |
|---|---|
| `registry.png` | Endpunkt-Registry: acht Endpunkte auf vier ungleichen Maschinen |
| `matrix.png` | Fähigkeits-Matrix mit endpunktspezifischem Backend-Namen, Rang, konfigurierte gegen entdeckte Slots |
| `audit.png` | Prüfspur mit Routing-Grund |

Dazu das Titelbild-Quellmotiv nach `blog-inbox/<slug>/source-schema-<lang>.png`:
ein dunkles Routing-Schema, Inhalt bewusst in der unteren Bildhälfte, weil der
Format-Renderer oben die weiße Textfläche darüberlegt.

## Regeln für die Daten in den Abbildungen

Die Zeilen stehen als Datentabelle im Skript. Beim Ergänzen gilt:

- Endpunkte heißen `node-a-…`, `node-b-…`, `node-c-…`, `cloud-…`
- Profile heißen `production`, `chat-rag`, `batch-guest`, `ops`
- Modelle heißen `chat-35b`, `chat-27b`, `embed-m3`, `rerank-v2`
- Hardware wird als Klasse beschrieben („ARM, 128 GB unified"), nicht als Gerät
- keine Schema-, Tabellen- oder Werkzeugnamen

Jede Abbildung trägt unten sichtbar „Schematische Nachbildung mit neutralen
Namen" — damit sie nicht als Aufnahme missverstanden wird.

## Sprachspezifische Quellbilder

`blog-assets.mjs` erkennt Dateien mit der Endung `-de` bzw. `-en` und nimmt sie
für die jeweilige Sprache. Fotos ohne Sprachkennung werden weiter für beide
Sprachen verwendet.

## Entscheidung vom 31.07.2026: bereinigter Screenshot verworfen

Es lag zusätzlich eine von Michael bereinigte Fassung des Matrix-Screenshots vor
(`cleanScreenshot 2026-07-31 133124.jpg` in `Claude-Austausch`): Adresszeile
geleert, mehrere Seitenleisten-Einträge entfernt, Präfixe der Endpunktnamen
abgedeckt.

Geprüft und **nicht verwendet**. Drei Reste:

1. Der Schema- und Tabellenname stand unverändert in der Erklärzeile über der
   Tabelle — die auffälligste Stelle im Bild.
2. Ein Endpunktname im Rerank-Block war gar nicht maskiert; die Maskierung hatte
   dort aufgehört.
3. Die Teilmaskierung war rekonstruierbar: Wer einen vollständigen Namen liest,
   kennt das Schema und ergänzt die abgedeckten Präfixe.

Dazu blieben die konkrete Pool-Konfiguration in der Matrix und die Seitenleiste
mit den kaufmännischen Modulen sichtbar.

**Lehre für künftige Beiträge:** Bei Screenshots aus internen Oberflächen ist
Maskieren der falsche Ansatz, sobald das Identifizierende in Tabellenspalten
steht statt am Bildrand. Sichtbar geschwärzte Stellen lenken die Aufmerksamkeit
zusätzlich dorthin. Entweder umbenennen — Spalte überschreiben, nicht abdecken,
und in der Bildunterschrift offenlegen — oder gleich nachbauen. Für diesen
Beitrag war Nachbauen die ruhigere und besser lesbare Lösung.
