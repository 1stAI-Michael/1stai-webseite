# Bildquelle — Ollama-Hangs erkennen

Für diesen Beitrag wurde **kein Motiv generiert.** Die Abbildungen und das Cover
stammen aus echten Screenshots des Monitoring-Dashboards. Das ist der Regelfall
für Beiträge über eigene Werkzeuge: Ein echter Screenshot belegt, ein generiertes
Motiv illustriert nur.

## Quelldateien

Fünf Dashboard-Screenshots vom 22.04.2026 in `Claude-Austausch`:
`ollama-stallwatch_blogpost-Screenshot 2026-04-22 {152910,152944,152956,153010,153018}.jpg`

Verwendet wurden `153010` (24-Stunden-Ansicht, hohe Auflösung je Panel) und
`153018` (Gesamtansicht mit CPU-Panel).

## Wichtig: Kopfzeile abschneiden

Die Dashboard-Kopfzeile enthält den internen Hostnamen (`Ollama Monitor — <host>`)
und darunter interne API-Pfade. Beim Zuschneiden muss sie weg — deshalb beginnen
alle Ausschnitte unterhalb von `top: 200`.

## Ausschnitte

Erzeugt nach `public/blog/ollama-stallwatch-gpu-hang-erkennung/screens/`:

| Datei | Quelle | Ausschnitt | Zeigt |
|---|---|---|---|
| `stall-events.jpg` | 153010 | `top:200 height:330` | Ereignistabelle mit Dauer, Klasse, GPU 0, VRAM, serve-CPU |
| `vram-vs-util.jpg` | 153010 | `top:548 height:1015` | VRAM belegt gegen Auslastung null |
| `serve-cpu.jpg` | 153018 | `top:1085 height:265` | CPU-Prozent und Speicher des Hauptprozesses |

```bash
node -e '
const sharp=require("sharp");
sharp("<quelle>.jpg").extract({left:8,top:200,width:3806,height:330})
  .jpeg({quality:88}).toFile("screens/stall-events.jpg");
'
```

## Cover

Das Quellbild `source-1-dashboard.png` ist komponiert, nicht fotografiert:
`vram-vs-util.jpg` auf 2320 px Breite skaliert und auf eine 2560×1440-Fläche in
`#141414` gesetzt, 40 px vom unteren Rand. Grund für die Position: Der Renderer
legt im Landscape-Format oben eine weiße Textfläche über das Bild — der Chart
sitzt bewusst darunter und bleibt sichtbar.

## Bei einer Wiederholung beachten

Wenn der Titel sich ändert, Bilder neu rendern (`npm run blog:assets`). Die
Ausschnitte in `screens/` bleiben davon unberührt, sie tragen keinen Text von uns.
