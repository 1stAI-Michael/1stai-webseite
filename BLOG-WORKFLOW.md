# Blog-Workflow — 1stai.eu

Von "hier ist ein Thema" bis "online in DE und EN". Sieben Schritte, drei davon
mit Freigabe durch Michael. Der Prozess ist auf Wiederholbarkeit gebaut:
Alles, was man sonst vergessen könnte, prüft `npm run blog:check`.

```
 Thema/Quellen  →  1. Entwurf DE   →  2. Bild-Prompts  →  3. Bilder rendern
                        ↓                                        ↓
                   4. EN-Fassung  ←──────────────────────  5. Social-Texte
                        ↓
                   6. Prüfen (blog:verify)  →  ⏸ FREIGABE  →  7. Deploy
```

## Verzeichnisse

| Pfad | Rolle | Im Deploy? |
|---|---|---|
| `src/content/blog/posts.js` | Inhalt beider Sprachen, Single Source of Truth | ja (kompiliert) |
| `blog-inbox/<slug>/` | Bild-Prompts + extern generierte Rohbilder | nein |
| `blog-drafts/<slug>/social/` | Social-Texte DE/EN je Kanal | nein |
| `public/blog/<slug>/<lang>/` | Fertige gebrandete Bilder, je Sprache | ja |
| `assets/fonts/` | Space Grotesk + Manrope (woff2), im Repo eingecheckt | nein |

`blog-inbox/` und `blog-drafts/` sind Arbeitsmaterial und werden bewusst **nicht**
hochgeladen — `scripts/deploy-webspace.sh` lädt nur `out/`.

## Schritt 1 — Entwurf DE

Eintrag am **Anfang** des `posts`-Arrays in `src/content/blog/posts.js`, zunächst
mit `draft: true`. Pflichtfelder pro Sprachblock: `title`, `excerpt`, `bodyMarkdown`.
Dazu `faq[]` (mind. 4) und `sources[]` (mind. 3, absolute URLs).

Regeln, die der Check erzwingt:

- `title` ≤ **52** Zeichen — das Layout-Template hängt " - 1stAI" an, zusammen
  müssen es unter 60 bleiben, sonst schneidet Google ab
- `excerpt` 110–175 Zeichen — das ist die Meta-Description
- `tags` 5–13 Keywords **pro Sprache** — sie landen in JSON-LD `keywords`,
  im Meta-Tag und in `llms.txt`. Echte Suchbegriffe, keine Wunschbegriffe
- `articleSection` pro Sprache — erscheint als Kicker im Bild, 2–3 Wörter
- Body beginnt bei **H2**; die H1 rendert die Seite aus `title`
- interne Links **mit** Sprachprefix und Trailing Slash: `/de/kontakt/`
- **Rechnernamen in Veröffentlichungen:** `GX-10`, `PC-30`, `PC-11`, `PC-10`.
  Die internen Bezeichner mit `TI-`-Präfix kommen nicht in den Text — nicht weil
  `PC-` sie unkenntlich macht (wer die Anlage kennt, liest die Zuordnung sofort),
  sondern weil der Blocker interne Hostnamen sperrt und ein Text ohne sie auch
  ohne Kontext lesbar bleibt. Kundensysteme werden **nie** benannt, auch nicht
  umbenannt.
- **Hardware-Modellnamen dürfen genannt werden** — `RTX 3090 Ti`, `Tesla V100`,
  `GB10`. Eine Produktbezeichnung ist keine Adresse: Ein Hostname löst im Netz
  auf, ein Kartenmodell nicht. Sie machen den Text glaubwürdiger und
  nachrechenbar (Speichergröße, Bandbreite) — also nutzen.
- keine internen Kennungen und keine Fremdnamen — der Check prüft Titel,
  Excerpt, Body, FAQ, Alt-Texte, Tags **und** die Social-Texte gegen
  `LEAK_PATTERNS` in `scripts/blog-check.mjs`: Ticket-IDs, Hostnamen, interne
  Pfade, Schwestermarke, Kundennamen, Kunden-Programmnamen. Neue Kunden dort
  ergänzen — das ist der einzige automatische Rückhalt

`slug` ist für beide Sprachen identisch, lowercase-kebab-case, und steckt in der
URL `/{de,en}/blog/<slug>/`. Bei englischsprachigen Slugs liest sich beides gut.

JSON-LD wird **generiert** (`src/lib/blogSchema.js`): BlogPosting + FAQPage +
BreadcrumbList, `wordCount` aus dem Text gezählt. Nie von Hand schreiben.

Für Suchmaschinen und Antwortmaschinen zusätzlich beachten:

- erster Absatz mit dem Primär-Keyword und einer konkreten Zahl — das ist die
  Zone, aus der LLMs zitieren
- direkt danach eine **Auf-einen-Blick-Liste** mit den Kernbefunden; sie wird
  bevorzugt als Snippet und von Antwortmaschinen übernommen
- jede H2 als Aussage formulieren, die ein Suchbegriff sein könnte —
  „Warum Token pro Sekunde als LLM-Benchmark versagt", nicht „Befund 1"
- FAQ-Fragen wörtlich so, wie jemand sie eintippt. Die zwei wichtigsten
  Kaufabsichts-Fragen nach oben
- `public/llms.txt` wird beim Build aus `posts.js` erzeugt
  (`scripts/generate-llms-txt.mjs`, läuft als `prebuild`) — nicht von Hand pflegen

## Schritt 2 — Bild-Prompts

`blog-inbox/<slug>/prompts.md` mit fünf Varianten anlegen, jede mit einer Zeile
"Warum". Vorlage und Brand-Don'ts: siehe die `prompts.md` des ersten Posts.

Harte Regeln für die Motive:

- **kein Text im Bild** — Titel, Logo und Domain setzt der Renderer
- mindestens 1920 px breit, 4:3 oder 16:9. Kleiner geht, wird dann aber leicht
  hochskaliert — 1448 px Breite kostet rund 10 % Schärfe im 1600er Format.
- Motiv nicht im oberen Drittel — das überdeckt im Landscape-Format die weiße
  Textfläche
- Brand-Don'ts aus dem Design-Guide: kein Gehirn, keine Chat-Bubble mit Funken,
  kein Neural-Mesh, keine Hexagon-Grids, keine Circuit-Texturen, kein Violett,
  keine Pastell-/Regenbogen-Gradienten

**⏸ Freigabe:** Michael generiert extern (ChatGPT/Gemini/Midjourney) und legt die
Datei(en) als `source-1.png`, `source-2.png` … in `blog-inbox/<slug>/` ab.

## Schritt 3 — Bilder rendern

```bash
npm run blog:assets -- --slug <slug>              # beide Sprachen, source-1
npm run blog:assets -- --slug <slug> --pick 3     # dritte Datei alphabetisch
npm run blog:assets -- --slug <slug> --lang en    # nur eine Sprache neu
npm run blog:assets -- --slug <slug> --formats og,linkedin
```

Erzeugt **je Sprache** in `public/blog/<slug>/<lang>/` — Titel und URL stehen im
Bild, deshalb kann DE und EN sich kein Bild teilen:

| Datei | Größe | Verwendung |
|---|---|---|
| `cover-1600x900.jpg` | 1600×900 | Artikel-Header + Karte in der Übersicht |
| `og-1200x627.png` | 1200×627 | OpenGraph, X summary_large_image, LinkedIn-Linkvorschau |
| `x-1600x900.png` | 1600×900 | X/Twitter als Bild im Post |
| `linkedin-1200x1200.png` | 1200×1200 | LinkedIn-Feed, quadratisch |
| `instagram-1080x1080.png` | 1080×1080 | Instagram-Feed |
| `instagram-story-1080x1920.png` | 1080×1920 | Story 9:16 |

Nur das Cover ist JPEG: Es wird von unseren eigenen Seiten geliefert, auf der
Übersicht einmal pro Karte (176 KB statt 919 KB). Die Social-Formate bleiben PNG —
dort liegt scharfe Typografie auf Weiß, wo JPEG sichtbar ringt. Der Check hat je
Datei ein Größenbudget, gestaffelt danach, wer sie ausliefert.

Der Renderer bettet Rohbild und Fonts als Data-URI ein — kein Netzzugriff, gleiche
Eingabe ergibt gleiche Ausgabe. Chrome wird über `CHROME_PATH` gefunden, sonst über
den Puppeteer-Cache. Nur PNG, niemals SVG: Social-Plattformen rendern kein SVG.

Layout: Landscape legt die Typografie auf eine weiße Fläche über dem Foto, quadratisch
und 9:16 stellen Foto oben und Textblock darunter. Unten immer eine Linie in `#F97316`.

## Schritt 4 — EN-Fassung

Redaktionelle Übersetzung, keine wortwörtliche: Zahlen und Tabellen identisch,
Formulierungen dürfen sich unterscheiden. Der `en`-Block ist **Pflicht** — der Check
schlägt fehl, wenn eine Sprache fehlt, damit hreflang nie ins Leere zeigt.

## Schritt 5 — Social-Texte

`blog-drafts/<slug>/social/<kanal>.<lang>.txt`, sechs Dateien:
`linkedin.de`, `linkedin.en`, `x.de`, `x.en`, `instagram.de`, `instagram.en`.

Grenzen, die der Check erzwingt:

| Kanal | Limit | Hinweis |
|---|---|---|
| LinkedIn | 3 000 | Erste ~210 Zeichen sind vor dem "mehr anzeigen" sichtbar — Hook dort |
| X | 280 | URLs zählen als 23 Zeichen, das rechnet der Check ein |
| Instagram | 2 200 | Kein klickbarer Link möglich → "Link in Bio" |

LinkedIn und X brauchen den vollen Artikel-Link, Instagram nicht.

Zum Ansehen, wie das auf den Kanälen ankommt:

```bash
npm run blog:preview -- --slug <slug>     # → blog-drafts/<slug>/preview.html
```

Die Datei ist selbstenthaltend (Bilder als Data-URI) und zeigt je Sprache die
Link-Unfurl-Karte aus den OG-Tags, den LinkedIn-Post mit Faltmarke bei ~210
Zeichen, X mit Zeichenzähler (URL = 23) und Instagram inklusive Story. Sie liegt
bewusst in `blog-drafts/` und damit außerhalb des Deploys.

Lokal ansehen — zwei Server, weil `out/` und `blog-drafts/` getrennt bleiben:

```bash
(cd out && python3 -m http.server 4180 --bind 0.0.0.0) &          # die Webseite
(cd blog-drafts && python3 -m http.server 4181 --bind 0.0.0.0) &  # die Vorschau
# beenden: pkill -f "http.server 418"
```

## Schritt 6 — Prüfen

```bash
npm run blog:check      # Inhalt, Bilder, Social-Texte
npm run blog:verify     # Build + zusätzlich das Ergebnis in out/
```

`blog:verify` prüft je Sprache und Post im gebauten HTML: canonical, og:image auf
die PNG, `og:type=article`, twitter:card, hreflang DE+EN, BlogPosting- und
FAQPage-JSON-LD, Eintrag in `sitemap.xml`, `llms.txt` mit dem Slug, `robots.txt`
und `feed.xml` vorhanden.

`blog:verify` ruft bewusst `npm run build` und nicht `next build` — sonst läuft
der `prebuild` nicht und `llms.txt` fehlt.

Fehler blockieren (Exit 1), Warnungen nicht. `draft: true` schließt einen Post
komplett aus — keine Route, kein Sitemap-Eintrag, kein Feed.

**⏸ Freigabe:** Titel, Excerpt, Bilder und Social-Texte gehen an Michael. Erst
danach `draft` entfernen.

## Schritt 7 — Deploy

```bash
npm run blog:verify && sh ./scripts/deploy-webspace.sh
```

Der Deploy lädt `out/` per SFTP nach Hetzner. Zugangsdaten stehen in
`/srv/Container/.env` (`HETZNER_SFTP_USER_1STAI`, `HETZNER_SFTP_PASS`) — die Datei
ist root-only, der Deploy braucht deshalb entsprechende Rechte.

Nach dem Deploy einmal gegenprüfen:

```bash
curl -sI https://1stai.eu/de/blog/<slug>/ | head -1
curl -s https://1stai.eu/sitemap.xml | grep <slug>
```

Für die Linkvorschau lohnt der LinkedIn Post Inspector — LinkedIn cacht OG-Daten
aggressiv, ein nachträglich korrigiertes Bild braucht dort einen manuellen Refresh.

## Was der Prozess bewusst nicht macht

- **Keine automatische Bildgenerierung.** Es ist kein Bildgenerator angebunden;
  der Ablauf setzt auf extern erzeugte Bilder im Inbox-Ordner. Soll das automatisch
  laufen, braucht es einen API-Key in `.env` oder ComfyUI auf dem GPU-Knoten —
  dann wird Schritt 3 um einen Generierungsschritt erweitert, der Rest bleibt.
- **Kein automatisches Posten.** Die Social-Texte werden erzeugt, nicht veröffentlicht.
- **Keine Recherche im Skript.** Quellen kommen aus dem Quelldokument oder aus
  einer Recherche im Chat und landen als `sources[]` im Post.
