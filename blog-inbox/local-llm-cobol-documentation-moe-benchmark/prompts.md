# Bild-Prompts — MoE-Modellvergleich: Der Prompt halluziniert mit

Fünf Varianten zur Auswahl. Generiere die gewünschte(n) extern, lege die Datei als
`source-1.png` (bzw. `source-2.png` …) in **dieses** Verzeichnis und starte:

```bash
node scripts/blog-assets.mjs --slug local-llm-cobol-documentation-moe-benchmark --pick 1
```

**Zielformat der Rohbilder:** mindestens 1920 px breit, Seitenverhältnis 4:3 oder 16:9.
Kein Text im Bild — Titel, Logo und Domain setzt der Renderer.
Bildmitte und untere Hälfte bleiben sichtbar, das obere Drittel wird im Landscape-Format
von der weißen Textfläche überdeckt. Motiv also **nicht** oben platzieren.

**Brand-Don'ts aus dem Design-Guide** (gelten für alle Prompts):
kein Gehirn, keine Chat-Bubble mit Funken, kein Neural-Mesh, keine Hexagon-Grids,
keine Circuit-Texturen, keine Pastell- oder Regenbogen-Gradienten, kein Violett.
Farbklima: warmes Orange (#F97316) gegen tiefes Anthrazit (#141414), sonst neutral.

---

## Variante 1 — Rechenzentrum, ein Gerät

> Photorealistic close-up of a single small desktop AI compute appliance on a matte
> steel workbench in a dim server room, warm orange status LED reflecting on the
> brushed metal, deep charcoal background, shallow depth of field, cool blue ambient
> light from the left, industrial and unglamorous, no text, no logos, 16:9

Warum: Trifft die Hardware-Ebene des Artikels (bandbreitenlimitierter Einzelknoten),
ohne KI-Klischees.

## Variante 2 — Mainframe-Erbe

> Photorealistic detail of a stack of decades-old printed program listings in a
> fluorescent-lit archive, fan-fold paper with faded monospace print, one page pulled
> slightly forward, dust in the air, warm tungsten highlight against cold grey shelving,
> documentary photography, no readable text, 16:9

Warum: COBOL-Bestandscode als Gegenstand. Sehr eigenständiges Motiv, wenig gesehen.

## Variante 3 — Das ausgefüllte Formular (Leitmotiv)

> Photorealistic overhead shot of a paper form on a dark desk where every field has
> been filled in with confident handwriting, but the entries are visibly generic and
> repetitive, warm desk lamp from the upper right, deep shadows, muted orange accent
> on a single pen, editorial still life, no readable text, 4:3

Warum: Bildliche Umsetzung des Leitbefunds — "die Modelle füllen das Formular".
Meine Empfehlung.

## Variante 4 — Messung statt Behauptung

> Photorealistic macro of an analogue laboratory gauge with its needle pinned at the
> maximum, mounted on scuffed dark equipment, warm orange backlight bleeding around
> the bezel, cold steel surroundings, industrial measurement aesthetic, film grain,
> no text, 16:9

Warum: Passt zum Befund "tok/s ist das falsche Maß" — ein Instrument, das etwas
misst, das nicht die Frage beantwortet.

## Variante 5 — Parallelbetrieb

> Photorealistic wide shot of eight identical conveyor lanes in a dim industrial hall
> seen from a low angle, seven lanes moving in sync and one lagging behind, warm orange
> work lighting, charcoal concrete, long exposure motion blur on the belts, no text, 16:9

Warum: Der Nebenläufigkeits-Befund (im Einzelstrom vorn, unter Last zurück) als Bild.
