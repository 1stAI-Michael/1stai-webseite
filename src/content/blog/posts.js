/**
 * Blog post registry — single source of truth for /de/blog/ and /en/blog/.
 *
 * One object per post, with a `de` and an `en` block. Both languages share the
 * slug, the date and the images, so a post can never exist in one language only
 * and hreflang pairing is automatic.
 *
 * Required per language block: title, excerpt, bodyMarkdown.
 * Optional per language block: faq[], sources[], coverAlt, tags.
 *
 * JSON-LD is *generated* from these fields (see src/lib/blogSchema.js) — never
 * hand-write a jsonLd string, it drifts from the content.
 *
 * `draft: true` keeps a post out of the build entirely (no route, no sitemap,
 * no feed). Flip it to publish.
 *
 * Validate with: node scripts/blog-check.mjs
 */

export const posts = [
  // Newest first. Add new posts at the TOP of this array.
  {
    slug: "ollama-stallwatch-gpu-hang-erkennung",
    date: "2026-07-31",
    updated: "2026-07-31",
    author: "Michael Schiffer",
    de: {
      title: "Ollama-Hangs erkennen: GPU idle, CPU am Anschlag",
      articleSection: "Lokale LLMs",
      excerpt:
        "Ollama hängt, das Modell bleibt im VRAM, die GPU steht bei 0 % — und im Log steht nichts. Wie ein Monitoring-Stack die Erkennung von 300 auf 30 Sekunden bringt.",
      coverAlt:
        "Dashboard eines Ollama-Monitorings: VRAM bleibt belegt, während die GPU-Auslastung auf 0 Prozent fällt",
      tags: [
        "Ollama",
        "lokale LLM-Inferenz",
        "GPU-Monitoring",
        "Hang-Detection",
        "Watchdog",
        "OCR-Pipeline",
        "On-Premise-LLM",
        "systemd",
        "SQLite",
        "Observability",
        "deepseek-ocr",
      ],
      bodyMarkdown: `Lokal betriebene LLM-Inferenz mit Ollama hat einen Fehlermodus, der in keinem Log auftaucht: Das Modell liegt im VRAM, die GPU-Auslastung steht bei **0 %**, und der Hauptprozess verbrennt gleichzeitig einen ganzen CPU-Kern. Der Request kommt nie zurück. Der Client wartet, bis sein Timeout zuschlägt — typisch 180 bis 300 Sekunden.

Ich habe für diesen Fall ein Monitoring gebaut, das solche Hänger automatisch erkennt, in drei Klassen einteilt und über eine REST-API abfragbar macht. Der Code liegt öffentlich unter MIT: [1stAI-Michael/ollama-stallwatch](https://github.com/1stAI-Michael/ollama-stallwatch).

**Auf einen Blick:**

- **Der Hänger ist im Log unsichtbar.** \`docker logs\` zeigt den Request, dann \`loading cache slot\`, dann nichts. Erst der Abbruch erzeugt einen Eintrag — und der sagt nicht, was schiefging.
- **Erkennung von 300 s auf 30 s.** Statt auf den Wall-Clock-Timeout zu warten, fragt der Worker nach 30 Sekunden Stille die Live-GPU ab. Auslastung 0 % bei geladenem Modell heißt: abbrechen.
- **Der teuerste Hang dauerte im Schnitt 40 Minuten.** Mit erzwungenem Modell-Entladen sind daraus 17 Sekunden geworden.
- **Eine einzelne PDF verursachte 77 % aller Timeouts.** Sichtbar wurde das erst über die Korrelation von Seiten-ID und Thread-Zustand.

## Das Symptom: die GPU langweilt sich, die CPU rödelt

Der Aufbau: ein Server mit zwei Karten (RTX 3090 Ti und RTX 5060 Ti, zusammen 40 GB VRAM), Ollama 0.17.6 im Container, im Parallelbetrieb für eine Weboberfläche und eine OCR-Pipeline auf einem zweiten Host, die rund 10 000 Seiten am Tag durch ein Vision-Modell schiebt.

Nach einigen Wochen Produktion friert gelegentlich ein Request ein. Das Bild ist immer dasselbe:

| Messgröße | Wert im Hang |
|---|---|
| Modell im VRAM | weiter geladen, 9,3 GB |
| GPU-Auslastung | **0 %** auf beiden Karten |
| GPU-Leistungsaufnahme | Idle-Niveau, 32–35 W |
| Hauptprozess CPU | **96–110 %**, also ein Kern voll |
| Container-Log | nichts |

Genau das steht auch im Dashboard, Zeile für Zeile:

![Stall-Events mit Dauer, Klasse, GPU-Auslastung 0, belegtem VRAM und serve-CPU über 100 %](/blog/ollama-stallwatch-gpu-hang-erkennung/screens/stall-events.jpg)

Praktisch ist das verheerend: Ein Worker-Slot blockiert, die nachfolgenden Requests stauen sich, die Pipeline steht. Und weil im Log nichts erscheint, sucht man den Fehler zuerst an der falschen Stelle — bei der GPU, beim Modell, beim Prompt.

## Warum ein Timeout als Antwort nicht reicht

Der naheliegende Umgang mit einem hängenden Request ist ein Timeout. Der kostet aber genau die Zeit, die er lang ist. Bei 300 Sekunden Read-Timeout und einigen Dutzend Hängern am Tag ist das ein erheblicher Teil des Durchsatzes — und man erfährt trotzdem nicht, *was* passiert ist.

Der Unterschied zwischen einem Timeout und einer Diagnose ist die Nebenbedingung: Wenn ich weiß, dass die GPU bei geladenem Modell auf 0 % steht, brauche ich nicht 300 Sekunden zu warten. Dreißig genügen.

## Was gemessen wird

Vier Kollektoren, eine SQLite-Datei, ein Dashboard, eine REST-API. Bewusst schlicht:

- **\`nvidia-smi\` alle 10 Sekunden**, nur bei Änderung geschrieben (Delta-Logging)
- **Container-Log verfolgen** und die Request-Einträge parsen
- **\`/proc/<pid>/{stat,status}\`** für CPU-Prozent, Speicher und Thread-Zahl des Ollama-Prozesses
- **Hang-Erkennung** mit drei Konfidenzstufen

Zwei Entscheidungen waren wichtiger als sie klingen. **Der Container bleibt unangetastet** — der Zugriff läuft vom Host aus über die Container-PID auf \`/proc\` und \`gdb\`. Und **SQLite statt Prometheus und Grafana**: Eine 5-MB-Datei lässt sich kopieren, sichern und per \`rsync\` mitnehmen. Für einen Host mit einigen Tausend Ereignissen über 30 Tage ist der Betriebsaufwand einer Zeitreihendatenbank nicht gerechtfertigt.

Das Delta-Logging hat einen Nachteil, den man einplanen muss: Bei stabilen Werten kommt stundenlang nichts an, und die Diagramme werden löchrig. Der Prozess-Logger schreibt deshalb alle 60 Sekunden einen Herzschlag, der GPU-Logger bleibt delta-only, weil sich VRAM und Leistungsaufnahme ohnehin dauernd ändern.

## Drei Hang-Klassen statt einer Bedingung

Die erste Fassung hatte einen Detektor mit einer Bedingung. Das war zu starr — der Nutzer der API meldete Hänger, die er in \`nvtop\` sah und die im Dashboard nicht auftauchten. Nach mehreren Runden gegen echte Produktionsdaten wurden es drei orthogonale Klassen:

| Klasse | Bedingung | Bedeutung |
|---|---|---|
| **strict** | VRAM > 1 GiB, Auslastung ≤ 5 %, Leistung ≤ 50 W, Prozess-CPU ≥ 50 % — 30 s durchgehend | klassischer CPU-gebundener Hänger |
| **loose** | dieselbe Form, Leistung ≤ 75 W, in 80 % der letzten 30 s erfüllt | Grenzfälle, die kurz abtauchen |
| **ghost** | VRAM > 1 GiB, Auslastung ≤ 5 %, Request aktiv, Prozess-CPU < 50 % | Request angenommen, aber es passiert nichts — auch nicht auf der CPU |

Dazu eine zweite, unabhängige Dimension: Lief die GPU in den 60 Sekunden vor dem Hänger überhaupt? Über 10 % Spitzenauslastung heißt **Modus A** — der Decode lief und blieb dann stehen, ein Teil der Antwort existiert. Darunter heißt **Modus B**: Die GPU war nie aktiv, es gibt nichts zu retten.

Über 24 Stunden und 97 Ereignisse ergab das zwei klare Häufungen:

| Klasse | Modus | Anzahl | Ø Dauer | Deutung |
|---|---|---|---|---|
| strict | A | 34 | 235 s | CPU-Rückfall nach Decode-Beginn |
| strict | B | 34 | **2426 s** | Schleife im Vision-Preprocessing |
| ghost | A | 6 | 12 s | kurz, transient |
| ghost | B | 10 | 10 s | kurz, wahrscheinlich Modell-Ladevorgang |
| loose | — | 9 | 10 s | Grenzfälle |

Die zweite Zeile ist die teure: 34 Hänger mit im Schnitt **über 40 Minuten**.

![GPU-VRAM und GPU-Auslastung über 24 Stunden: der VRAM bleibt über lange Phasen belegt, während die Auslastung auf null fällt](/blog/ollama-stallwatch-gpu-hang-erkennung/screens/vram-vs-util.jpg)

Die Gegenprobe liefert der Prozess: Genau in diesen Fenstern steigt die CPU-Kurve des Hauptprozesses auf 100 bis 200 %, und der Speicherverbrauch klettert während der stillen Hänger von 1 auf über 24 GiB.

![CPU-Prozent und Speicherverbrauch des Ollama-Hauptprozesses über 24 Stunden](/blog/ollama-stallwatch-gpu-hang-erkennung/screens/serve-cpu.jpg)

## Ein Go-Binary ohne Symbole debuggen

Beim Öffnen eines Ereignisses wird ein Stack-Abzug geschrieben: Zustand und \`wchan\` jedes Threads aus \`/proc\`, der Kernel-Stack je Thread, dazu \`gdb -batch -ex 'thread apply all bt'\`.

Das Ollama-Binary ist gestrippt, die gdb-Adressen sind also nicht auflösbar. Trotzdem ist der Abzug diagnostisch — nicht über die Funktionsnamen, sondern über die **Verteilung der Thread-Zustände**:

\`\`\`
strict/A:  1 Thread im Zustand R   (ein Kern belegt)   → CPU-Rückfall im Decoder
strict/B:  2 Threads im Zustand R  (zwei Kerne belegt) → Preprocessing plus Worker
ghost/B:   0 Threads im Zustand R  (alle im futex)     → echtes Warten, Deadlock-Verdacht
\`\`\`

Ein Zählwert pro Klasse, und die drei Pathologien lassen sich auseinanderhalten. Ein Nebenbefund aus dem ersten Versuch: py-spy funktioniert hier nicht, weil Ollama in Go geschrieben ist und nicht in Python. Das Werkzeug muss man kennen, nicht annehmen.

## Die API, die den Unterschied macht

Die REST-Schnittstelle ist lesend, ohne Authentifizierung, JSON heraus. Der wichtigste Parameter ist unscheinbar:

\`\`\`bash
# Welcher Hänger lief, als mein Watchdog feuerte?
curl 'http://<monitor-host>:3002/api/stalls?at=2026-04-22T09:38:30Z'

# Läuft die GPU in diesem Moment überhaupt?
curl 'http://<monitor-host>:3002/api/gpu/live'
\`\`\`

Der Konsument hatte zuerst mit \`?since=<call_start>\` korreliert — und verfehlte damit jeden Hänger, der **vor** seinem Aufruf begonnen hatte und noch lief. Mit \`at=\` oder \`overlapping=START,END\` ist die Zuordnung eindeutig. Es ist der kleinste Teil der Schnittstelle und der, der am meisten gebracht hat.

Ebenso bewusst: Die Korrelation läuft als **Pull, nicht als Push**. Der Monitor-Host kennt seine Konsumenten nicht; wer etwas wissen will, fragt. Das macht die Zahl der Konsumenten beliebig, spart Konfiguration auf beiden Seiten und übersteht Netzwerkhänger, weil ein verpasster Abruf einfach wiederholt wird.

## Was die Daten im Betrieb verändert haben

Das Monitoring allein verbessert nichts. Der Wert entsteht erst dort, wo der Konsument darauf reagiert — vier Maßnahmen:

1. **Live-Abfrage mitten im Aufruf.** Nach 30 Sekunden Stille fragt der Worker die GPU ab. Beide Karten bei 0 % und Modell geladen heißt Hänger, sofort abbrechen. **Erkennung 30 s statt 300 s.**
2. **Selbstheilung durch kaltes Laden.** Beim Watchdog-Abbruch wird das Modell explizit entladen und beim nächsten Aufruf neu geladen. Aus durchschnittlich **2426 Sekunden** wurden 12 Sekunden Ladezeit plus 5 Sekunden für den nächsten Aufruf: **rund 17 Sekunden**.
3. **Teilrettung.** Bei Modus-A-Hängern existiert bereits Text. Erreicht er mindestens 80 % der Zeichenzahl einer Referenzverarbeitung, wird er als Erfolg gewertet. Auf diesem Weg kamen **97 Seiten** durch, die sonst verloren gewesen wären.
4. **Korrelation über die Fehlerursache.** Die Zuordnung von Seiten-ID zu Thread-Muster zeigte, dass eine **einzelne pathologische PDF** — 165 Seiten Jahresabschluss-Tabellen — **77 % aller Timeouts** verursachte. Diese Datei separat zu behandeln war der größte Einzelhebel.

Bilanz über 24 Stunden: 10 871 Seiten, 7421 direkt erfolgreich, 97 teilgerettet, 241 echte Timeouts. Das ergibt **97,8 %**. Ohne die Monitoring-Daten hätte dieselbe Pipeline nach meiner Einschätzung bei 75 bis 80 % gelegen — der Vergleichswert ist geschätzt, nicht gemessen.

## Grenzen

- **Ein Host, ein Modell, eine Arbeitslast.** Die Zahlen gelten für diesen Aufbau. Ob dieselben drei Klassen auf anderer Hardware oder mit anderen Modellen gleich trennscharf sind, ist offen.
- **Der Vergleichswert von 75 bis 80 % ist eine Schätzung** aus dem Verhalten vor der Umstellung, kein kontrollierter Gegenversuch.
- **Die Ursache bleibt unbenannt.** Das Monitoring erkennt und klassifiziert die Hänger, es erklärt sie nicht. Ohne Symbole im Binary bleibt es bei Mustern statt bei Stack-Traces.
- **Unterprozess-Aufrufe im heißen Pfad kosten.** Die Prüfung auf einen aktiven Request startet einen Unterprozess, rund 50 ms pro Aufruf. Bei 5 Sekunden Abstand sind das etwa 1 % CPU — für ein Monitoring akzeptabel, bei dichterem Takt wäre ein Tail-Follower richtig.
- **Version.** Gemessen mit Ollama 0.17.6. Neuere Fassungen können sich anders verhalten.

## Fazit

Der eigentliche Befund ist nicht der Hänger, sondern die Beobachtungslücke: Ein Zustand, den \`nvtop\` sofort zeigt und das Anwendungs-Log überhaupt nicht. Solange man nur auf Logs schaut, ist ein solcher Fehler unsichtbar — und ein Timeout ist dann die einzige verfügbare Antwort, obwohl sie die teuerste ist.

Zwei Kennzahlen aus \`nvidia-smi\` und eine aus \`/proc\`, dreißig Sekunden Beobachtungsfenster, und aus einem unerklärlichen Stillstand wird ein klassifiziertes Ereignis, auf das ein Worker reagieren kann.

Wer einen eigenen Ollama-Stack betreibt: Der Code liegt unter MIT auf GitHub, zwei systemd-Units pro Host, eine SQLite-Datei, ein Port. Issues und Muster aus anderen Aufbauten sind willkommen.`,
      faq: [
        {
          q: "Warum zeigt Ollama 0 % GPU-Auslastung, obwohl das Modell geladen ist?",
          a: "Weil der Prozess CPU-gebunden feststeckt, typischerweise im Preprocessing oder im Vision-Encoder. Das Modell bleibt im VRAM, die GPU wartet, und ein CPU-Kern läuft auf 100 %. Im Container-Log erscheint dabei nichts: Der Request wird protokolliert, dann das Laden des Cache-Slots, danach bis zum Abbruch nichts mehr.",
        },
        {
          q: "Wie erkenne ich einen hängenden Ollama-Request, ohne auf den Timeout zu warten?",
          a: "Über drei Messgrößen gleichzeitig: belegter VRAM über 1 GiB, GPU-Auslastung unter 5 % und Prozess-CPU über 50 %, jeweils 30 Sekunden durchgehend. Ist die Bedingung erfüllt, liegt ein Hänger vor. Ein Worker kann das mitten im Aufruf abfragen und nach 30 statt nach 300 Sekunden abbrechen.",
        },
        {
          q: "Was tut man gegen einen Ollama-Hang, wenn er erkannt ist?",
          a: "Das Modell explizit entladen und beim nächsten Aufruf kalt neu laden. In den gemessenen Fällen sank die Ausfallzeit dadurch von durchschnittlich 2426 Sekunden auf etwa 17 Sekunden — 12 Sekunden Ladezeit plus 5 Sekunden für den erneuten Aufruf. Ein Neustart des Containers ist nicht nötig.",
        },
        {
          q: "Lässt sich ein gestripptes Go-Binary sinnvoll debuggen?",
          a: "Nicht über Funktionsnamen — gdb liefert gegen ein gestripptes Binary nur Adressen. Aussagekräftig ist stattdessen die Verteilung der Thread-Zustände aus /proc: ein Thread rechenbereit deutet auf einen CPU-Rückfall im Decoder, zwei auf Preprocessing plus Worker, keiner auf echtes Warten. Diese Zählwerte trennten die drei beobachteten Hang-Klassen zuverlässig.",
        },
        {
          q: "Braucht ein LLM-Monitoring Prometheus und Grafana?",
          a: "Für einen einzelnen Host nicht zwingend. Für einige Tausend Ereignisse über 30 Tage genügt eine SQLite-Datei von wenigen Megabyte, die sich kopieren, sichern und per rsync mitnehmen lässt. Der Betriebsaufwand einer Zeitreihendatenbank lohnt sich erst, wenn mehrere Hosts zusammengeführt werden.",
        },
        {
          q: "Sollte ein Monitoring die Daten an die Konsumenten senden oder abfragbar bereitstellen?",
          a: "Abfragbar. Eine lesende HTTP-Schnittstelle mit Filtern kommt ohne Konsumentenliste aus, verkraftet beliebig viele Abnehmer ohne Konfigurationsänderung und übersteht Netzwerkstörungen, weil ein verpasster Abruf einfach wiederholt wird. Ein Webhook müsste all das selbst lösen.",
        },
      ],
      sources: [
        {
          title: "ollama-stallwatch — Quellcode auf GitHub (MIT)",
          url: "https://github.com/1stAI-Michael/ollama-stallwatch",
        },
        {
          title: "Ollama — Projektseite und Releases",
          url: "https://github.com/ollama/ollama",
        },
        {
          title: "nvidia-smi — Dokumentation der Abfrageoptionen",
          url: "https://developer.nvidia.com/system-management-interface",
        },
        {
          title: "proc(5) — Manpage zu /proc/<pid>/stat und /proc/<tid>/stack",
          url: "https://man7.org/linux/man-pages/man5/proc.5.html",
        },
        {
          title: "DeepSeek-OCR — Modellkarte",
          url: "https://huggingface.co/deepseek-ai/DeepSeek-OCR",
        },
      ],
    },
    en: {
      title: "Detecting Ollama hangs: GPU idle, CPU maxed out",
      articleSection: "Local LLMs",
      excerpt:
        "Ollama stalls, the model stays in VRAM, the GPU sits at 0 % — and the log says nothing. How a monitoring stack cuts detection from 300 seconds to 30.",
      coverAlt:
        "Dashboard of an Ollama monitoring stack: VRAM stays allocated while GPU utilisation drops to zero percent",
      tags: [
        "Ollama",
        "local LLM inference",
        "GPU monitoring",
        "hang detection",
        "watchdog",
        "OCR pipeline",
        "on-premise LLM",
        "systemd",
        "SQLite",
        "observability",
        "deepseek-ocr",
      ],
      bodyMarkdown: `Locally hosted LLM inference with Ollama has a failure mode that appears in no log: the model sits in VRAM, GPU utilisation reads **0 %**, and the main process burns a full CPU core at the same time. The request never returns. The client waits until its timeout fires — typically 180 to 300 seconds.

I built monitoring for exactly this case: it detects such stalls automatically, sorts them into three classes and makes them queryable over a REST API. The code is public under MIT: [1stAI-Michael/ollama-stallwatch](https://github.com/1stAI-Michael/ollama-stallwatch).

**At a glance:**

- **The stall is invisible in the log.** \`docker logs\` shows the request, then \`loading cache slot\`, then nothing. Only the abort produces an entry — and it does not say what went wrong.
- **Detection from 300 s down to 30 s.** Instead of waiting for the wall-clock timeout, the worker queries the live GPU after 30 seconds of silence. Utilisation at 0 % with a loaded model means: abort now.
- **The most expensive stall class averaged 40 minutes.** Forcing a model unload turned that into 17 seconds.
- **A single PDF caused 77 % of all timeouts.** That only became visible by correlating page IDs with thread states.

## The symptom: the GPU is bored, the CPU is thrashing

The setup: one server with two cards (RTX 3090 Ti and RTX 5060 Ti, 40 GB VRAM combined), Ollama 0.17.6 in a container, serving both a web front end and an OCR pipeline on a second host that pushes around 10,000 pages a day through a vision model.

After a few weeks in production, a request occasionally freezes. The picture is always the same:

| Metric | Value during the stall |
|---|---|
| Model in VRAM | still loaded, 9.3 GB |
| GPU utilisation | **0 %** on both cards |
| GPU power draw | idle level, 32–35 W |
| Main process CPU | **96–110 %**, one full core |
| Container log | nothing |

The dashboard shows exactly that, row by row:

![Stall events with duration, class, GPU utilisation of zero, allocated VRAM and serve CPU above 100 %](/blog/ollama-stallwatch-gpu-hang-erkennung/screens/stall-events.jpg)

In practice this is destructive: one worker slot blocks, following requests queue up, the pipeline stops. And because nothing shows up in the log, you start looking in the wrong place — at the GPU, the model, the prompt.

## Why a timeout is not an answer

The obvious way to handle a hanging request is a timeout. But it costs exactly as much time as it is long. At a 300-second read timeout and a few dozen stalls a day, that is a serious share of throughput — and you still do not learn *what* happened.

The difference between a timeout and a diagnosis is the side condition: if I know the GPU sits at 0 % while the model is loaded, I do not need to wait 300 seconds. Thirty will do.

## What gets measured

Four collectors, one SQLite file, a dashboard, a REST API. Deliberately plain:

- **\`nvidia-smi\` every 10 seconds**, written only on change (delta logging)
- **follow the container log** and parse the request entries
- **\`/proc/<pid>/{stat,status}\`** for CPU percentage, memory and thread count of the Ollama process
- **stall detection** with three confidence levels

Two decisions mattered more than they sound. **The container stays untouched** — access happens from the host via the container PID into \`/proc\` and \`gdb\`. And **SQLite instead of Prometheus and Grafana**: a 5 MB file can be copied, backed up and moved with \`rsync\`. For one host with a few thousand events over 30 days, the operational cost of a time-series database is not justified.

Delta logging has a downside you have to plan for: while values are stable, nothing arrives for hours and the charts get holes. The process logger therefore writes a heartbeat every 60 seconds; the GPU logger stays delta-only, because VRAM and power draw change constantly anyway.

## Three stall classes instead of one condition

The first version had one detector with one condition. That was too rigid — the user of the API reported stalls visible in \`nvtop\` that never appeared in the dashboard. After several rounds against real production data it became three orthogonal classes:

| Class | Condition | Meaning |
|---|---|---|
| **strict** | VRAM > 1 GiB, utilisation ≤ 5 %, power ≤ 50 W, process CPU ≥ 50 % — for 30 s straight | classic CPU-bound stall |
| **loose** | same shape, power ≤ 75 W, satisfied for 80 % of the last 30 s | boundary cases that dip briefly |
| **ghost** | VRAM > 1 GiB, utilisation ≤ 5 %, request active, process CPU < 50 % | request accepted but nothing happens — not even on the CPU |

Plus a second, independent dimension: was the GPU active at all in the 60 seconds before the stall? Above 10 % peak utilisation means **mode A** — decoding ran and then stopped, so part of the answer exists. Below that means **mode B**: the GPU was never active, there is nothing to salvage.

Across 24 hours and 97 events, two clear clusters emerged:

| Class | Mode | Count | Avg duration | Reading |
|---|---|---|---|---|
| strict | A | 34 | 235 s | CPU fallback after decoding began |
| strict | B | 34 | **2426 s** | loop in vision preprocessing |
| ghost | A | 6 | 12 s | short, transient |
| ghost | B | 10 | 10 s | short, probably model loading |
| loose | — | 9 | 10 s | boundary cases |

The second row is the expensive one: 34 stalls averaging **more than 40 minutes**.

![GPU VRAM and GPU utilisation over 24 hours: VRAM stays allocated for long stretches while utilisation falls to zero](/blog/ollama-stallwatch-gpu-hang-erkennung/screens/vram-vs-util.jpg)

The counter-check comes from the process: in exactly those windows the main process CPU curve climbs to 100–200 %, and memory use rises from 1 to over 24 GiB during the silent stalls.

![CPU percentage and memory use of the Ollama main process over 24 hours](/blog/ollama-stallwatch-gpu-hang-erkennung/screens/serve-cpu.jpg)

## Debugging a Go binary without symbols

When an event opens, a stack dump is written: state and \`wchan\` of every thread from \`/proc\`, the kernel stack per thread, plus \`gdb -batch -ex 'thread apply all bt'\`.

The Ollama binary is stripped, so the gdb addresses cannot be resolved. The dump is still diagnostic — not through function names, but through the **distribution of thread states**:

\`\`\`
strict/A:  1 thread in state R   (one core busy)   → CPU fallback in the decoder
strict/B:  2 threads in state R  (two cores busy)  → preprocessing plus worker
ghost/B:   0 threads in state R  (all in futex)    → genuine wait, deadlock suspected
\`\`\`

One count per class, and the three pathologies separate. A side finding from the first attempt: py-spy does not work here, because Ollama is written in Go, not Python. Know your tool rather than assuming it.

## The API detail that made the difference

The REST interface is read-only, unauthenticated, JSON out. Its most important parameter is unremarkable:

\`\`\`bash
# Which stall was running when my watchdog fired?
curl 'http://<monitor-host>:3002/api/stalls?at=2026-04-22T09:38:30Z'

# Is the GPU doing anything at all right now?
curl 'http://<monitor-host>:3002/api/gpu/live'
\`\`\`

The consumer first correlated with \`?since=<call_start>\` — and thereby missed every stall that had begun **before** its own call and was still running. With \`at=\` or \`overlapping=START,END\` the mapping is unambiguous. It is the smallest part of the interface and the one that helped most.

Equally deliberate: correlation works as **pull, not push**. The monitor host does not know its consumers; whoever wants something asks. That makes the number of consumers arbitrary, saves configuration on both sides and survives network trouble, because a missed poll is simply repeated.

## What the data changed in operation

Monitoring on its own improves nothing. The value appears where the consumer acts on it — four measures:

1. **Live query mid-call.** After 30 seconds of silence the worker queries the GPU. Both cards at 0 % with a loaded model means stall, abort immediately. **Detection in 30 s instead of 300 s.**
2. **Self-healing via cold load.** On watchdog abort the model is explicitly unloaded and reloaded on the next call. An average of **2426 seconds** became 12 seconds of load time plus 5 seconds for the next call: **around 17 seconds.**
3. **Partial recovery.** Mode A stalls already produced text. If it reaches at least 80 % of the character count of a reference run, it counts as a success. That route saved **97 pages** which would otherwise have been lost.
4. **Correlation on the cause.** Mapping page IDs to thread patterns showed that a **single pathological PDF** — 165 pages of annual-accounts tables — caused **77 % of all timeouts**. Handling that file separately was the largest single lever.

The 24-hour balance: 10,871 pages, 7,421 successful outright, 97 partially recovered, 241 genuine timeouts. That is **97.8 %**. Without the monitoring data the same pipeline would, in my estimation, have landed at 75 to 80 % — that comparison figure is an estimate, not a measurement.

## Limitations

- **One host, one model, one workload.** The numbers hold for this setup. Whether the same three classes separate as cleanly on other hardware or with other models is open.
- **The 75–80 % comparison is an estimate** from behaviour before the change, not a controlled counter-experiment.
- **The root cause remains unnamed.** The monitoring detects and classifies stalls; it does not explain them. Without symbols in the binary it stays at patterns rather than stack traces.
- **Subprocess calls in the hot path cost.** Checking for an active request spawns a subprocess, roughly 50 ms per call. At a 5-second interval that is about 1 % CPU — acceptable for monitoring, but a tail follower would be the right choice at a tighter cadence.
- **Version.** Measured with Ollama 0.17.6. Newer releases may behave differently.

## Conclusion

The real finding is not the stall but the observability gap: a state that \`nvtop\` shows instantly and the application log not at all. As long as you only watch logs, such a fault is invisible — and a timeout is then the only available answer, even though it is the most expensive one.

Two metrics from \`nvidia-smi\` and one from \`/proc\`, a thirty-second observation window, and an inexplicable standstill becomes a classified event a worker can act on.

If you run your own Ollama stack: the code is MIT-licensed on GitHub, two systemd units per host, one SQLite file, one port. Issues and patterns from other setups are welcome.`,
      faq: [
        {
          q: "Why does Ollama show 0 % GPU utilisation while the model is loaded?",
          a: "Because the process is stuck CPU-bound, typically in preprocessing or the vision encoder. The model stays in VRAM, the GPU waits, and one CPU core runs at 100 %. Nothing appears in the container log: the request is recorded, then the cache slot load, then nothing until the abort.",
        },
        {
          q: "How do I detect a hanging Ollama request without waiting for the timeout?",
          a: "Through three metrics at once: allocated VRAM above 1 GiB, GPU utilisation below 5 % and process CPU above 50 %, each sustained for 30 seconds. If the condition holds, it is a stall. A worker can query this mid-call and abort after 30 seconds instead of 300.",
        },
        {
          q: "What fixes an Ollama hang once it is detected?",
          a: "Unload the model explicitly and cold-load it on the next call. In the measured cases that cut downtime from an average of 2426 seconds to about 17 seconds — 12 seconds of load time plus 5 seconds for the retry. Restarting the container is not necessary.",
        },
        {
          q: "Can a stripped Go binary be debugged usefully?",
          a: "Not via function names — gdb against a stripped binary yields only addresses. What is informative instead is the distribution of thread states from /proc: one runnable thread points to a CPU fallback in the decoder, two to preprocessing plus worker, none to a genuine wait. Those counts separated the three observed stall classes reliably.",
        },
        {
          q: "Does LLM monitoring need Prometheus and Grafana?",
          a: "For a single host, not necessarily. A few thousand events over 30 days fit in a SQLite file of a few megabytes that can be copied, backed up and moved with rsync. The operational cost of a time-series database pays off once several hosts are aggregated.",
        },
        {
          q: "Should monitoring push data to consumers or expose it for querying?",
          a: "Expose it. A read-only HTTP interface with filters needs no consumer list, handles any number of clients without configuration changes, and survives network trouble because a missed poll is simply repeated. A webhook would have to solve all of that itself.",
        },
      ],
      sources: [
        {
          title: "ollama-stallwatch — source code on GitHub (MIT)",
          url: "https://github.com/1stAI-Michael/ollama-stallwatch",
        },
        {
          title: "Ollama — project page and releases",
          url: "https://github.com/ollama/ollama",
        },
        {
          title: "nvidia-smi — documentation of the query options",
          url: "https://developer.nvidia.com/system-management-interface",
        },
        {
          title: "proc(5) — manpage for /proc/<pid>/stat and /proc/<tid>/stack",
          url: "https://man7.org/linux/man-pages/man5/proc.5.html",
        },
        {
          title: "DeepSeek-OCR — model card",
          url: "https://huggingface.co/deepseek-ai/DeepSeek-OCR",
        },
      ],
    },
  },
  {
    slug: "local-llm-cobol-documentation-moe-benchmark",
    date: "2026-07-29",
    updated: "2026-07-30",
    author: "Michael Schiffer",
    de: {
      title: "Lokale LLMs für COBOL-Dokumentation im Benchmark",
      articleSection: "Lokale LLMs",
      excerpt:
        "Vier offene MoE-Modelle auf einem NVIDIA DGX Spark gegen elf produktive COBOL-Programme. Keines schlägt die Baseline — und der Prompt erzeugt Halluzinationen mit.",
      coverAlt:
        "Lokale LLMs im Vergleich: vier Mixture-of-Experts-Modelle dokumentieren COBOL-Bestandscode on-premises auf einem NVIDIA DGX Spark",
      tags: [
        "Lokale LLMs",
        "On-Premise-LLM",
        "COBOL-Dokumentation",
        "Legacy-Modernisierung",
        "NVIDIA DGX Spark",
        "GB10",
        "Mixture of Experts",
        "LLM-Benchmark",
        "LLM-Halluzinationen",
        "Prompt Engineering",
        "llama.cpp",
        "Datensouveränität",
        "KI-Souveränität",
        "Mittelstand",
      ],
      bodyMarkdown: `Ein **lokales LLM** kann COBOL-Bestandscode in brauchbare Wartungsdokumentation überführen — vollständig on-premises, ohne dass Quellcode das Haus verlässt. Welches Modell man dafür nimmt, entscheidet über Durchsatz und Fehlerdichte. Vier quantisierte Mixture-of-Experts-Modelle der 30-Milliarden-Klasse, elf produktive COBOL-Programme, ein NVIDIA DGX Spark mit 273 GB/s Speicherbandbreite: In 32 fachlich bewerteten Einheiten steht **kein einziges Urteil "besser"** gegen die eingesetzte Baseline qwen3.6-35B-A3B.

Der praktisch wertvollste Befund betrifft aber nicht die Modelle, sondern den Prompt. Nemotron-3-Nano gibt ein *Beispiel* aus der Aufgabenstellung in 10 von 12 Berichten als echten Befund des jeweiligen Programms aus.

**Auf einen Blick:**

- **Token pro Sekunde ist als LLM-Benchmark unbrauchbar.** North-Mini-Code verbrannte 58,8 % seiner Token in einem nicht abschaltbaren Denk-Kanal und erschien dadurch als schnellstes im Feld.
- **Ein Teil der Halluzinationen kommt aus dem Prompt.** Ein illustrierendes Beispiel in der Aufgabenstellung wanderte als echter Befund in die Ergebnisse.
- **Der Betriebsmodus entscheidet.** Nemotron-3-Nano war im Einzelstrom 20 % schneller als die Baseline und bei acht parallelen Anfragen 17 % langsamer.
- **Die Herkunft der Gewichte ist das falsche Kriterium.** Alle fünf großen europäischen Open-Weight-Modelle sind dicht — und dichte Modelle der 40- bis 70-B-Klasse liefern auf dieser Hardware einstellige tok/s.

Anlass war eine simple Frage: Kann ein anderes offenes Modell das eingesetzte ablösen? Die Antwort ist nein — interessant ist, was auf dem Weg dorthin sichtbar wurde. Für jeden, der im Mittelstand ein On-Premise-LLM auf einer bandbreitenbegrenzten Maschine betreibt, sind die drei Befunde übertragbar; der Gegenstand COBOL macht sie nur besonders gut messbar.

## Testaufbau: DGX Spark, llama.cpp und elf COBOL-Programme

Getestet wurde auf einem NVIDIA DGX Spark mit GB10-Superchip (Grace-Blackwell), 128 GB Unified Memory und **273 GB/s** Speicherbandbreite. Diese Zahl bestimmt die Modellauswahl: Bei 273 GB/s limitiert nicht die Rechenleistung, sondern die pro Token aus dem Speicher zu lesende Gewichtsmenge. Mixture-of-Experts mit etwa 3 Milliarden *aktiven* Parametern ist die passende Klasse — dichte Modelle vergleichbarer Gesamtgröße verhungern an der Bandbreite. Das ist der eigentliche Grund, warum MoE-Modelle für lokale Rollouts auf dieser Hardwareklasse interessant sind und nicht die Parameterzahl auf dem Papier.

Alle vier Modelle liefen auf **demselben** llama.cpp-Build, in derselben Quantisierungsklasse (Q4_K_M), mit identischen Parametern (\`temperature = 0.2\`), gegen dieselben Programme. Der gleiche Build war Auswahlkriterium, nicht Zufall: Ein Kandidat, dessen Architektur-Kennung der Build nicht kennt, hätte eine zweite Build-Linie erfordert.

| | qwen3.6-35B-A3B **(Baseline)** | GLM-4.7-Flash | North-Mini-Code-1.0 | Nemotron-3-Nano-30B-A3B |
|---|---|---|---|---|
| Herkunft | Alibaba / Qwen | Z.ai / Zhipu | Cohere Labs | NVIDIA |
| Lizenz | Apache 2.0 | MIT | Apache 2.0 + AUP | NVIDIA Open Model License |
| Parameter total / aktiv | 35 B / 3 B | 30 B / 3 B | 30 B / 3 B | 30 B / 3,5 B |
| Experten gesamt / aktiv | 256 / 8 (+1) | 64 / 4 | 128 / 8 | 128 / 6 (+1) |
| Dateigröße (Q4_K_M) | 22,3 GB | 18,3 GB | 19,2 GB | 24,6 GB |
| SWE-bench Verified (Hersteller) | 73,4 | 59,2 | n. a. | 38,8 |

Nicht im Feld, aber erwähnenswert: **Laguna-XS-2.1** (poolside) ist mit 33 B / 3 B und SWE-bench Verified 70,9 % auf dem Papier der stärkste verfügbare Kandidat für diese Aufgabe. Er ließ sich nicht testen, weil die llama.cpp-Unterstützung zum Testzeitpunkt nicht im Hauptzweig war, sondern in einem offenen Upstream-PR. Zu beachten ist dort die Lizenz OpenMDW-1.1. Ein erneuter Versuch lohnt, sobald der PR gemergt ist. Ebenfalls nicht im Feld, obwohl es der ursprünglich favorisierte Kandidat war: **Soofi S** vom SOOFI-Konsortium — ein deutsches Souveränitätsprojekt mit Fraunhofer IAIS, DFKI und TU Darmstadt, koordiniert vom KI Bundesverband. Der Download ist freigabepflichtig (\`gated: manual\`), das Lizenzfeld der Modellkarte trägt \`closed-beta\`. Eine Zugriffsanfrage vom 27. Juli 2026 war zum Redaktionsschluss noch nicht beschieden, deshalb fehlt das Modell hier. Zur Einordnung gehört, dass das keine geschlossene Lizenz ist, sondern eine Beta-Phase: Die Modellkarte kündigt die endgültige Fassung ausdrücklich "openly under a permissive license, without gated access" an.

Aufschlussreich ist die Architektur. Mit 31,6 B gesamt bei rund 3,2 B aktiven Parametern und einem hybriden Mamba-2/Transformer-Stapel mit 128 gerouteten plus 2 geteilten Experten ist Soofi S **kein Zwilling der Baseline**, sondern einer von Nemotron-3-Nano — also des Modells, das in diesem Test qualitativ am schwächsten abschnitt. Was das für Soofi heißt, ist offen: Die Architektur bestimmt Ausgabedisziplin und Halluzinationsneigung nicht. Sie ist aber ein Grund, das Modell zu messen, statt Ergebnisse zu erwarten.

Die Aufgabe ist das, was in der Literatur als Retro-Dokumentation läuft: strukturierte Wartungsdokumentation zu einem vorgelegten COBOL-Programm — fachlicher Zweck, Datenfluss, Ablauflogik je Section, CALL-Graph, Änderungsrisiken. Echter Produktionscode aus einem Legacy-ERP-System, rund 2 000 bis 43 000 Token Eingabelänge, keine synthetischen Beispiele. Ein längeres Programm überschritt die Kontextlänge der Testkonfiguration und endete bei allen Modellen mit einem Fehler — dieser Ausfall ist der Konfiguration zuzurechnen, nicht den Modellen, und bleibt außen vor.

Eine Eigenschaft des Korpus macht die Auswertung überhaupt erst objektiv: Das System verwendet keinen der klassischen Mainframe-Bausteine — der Datenbankzugriff läuft über eine anwendungseigene Zugriffsschicht, nicht über eingebettetes SQL. Es enthält **kein CICS, kein DB2 und kein einziges \`EXEC SQL\`-Statement**. Jede Nennung dieser Technologien in einer Modellausgabe ist damit nachweisbar erfunden. Der Korpus wirkt als natürliche Kontrollbedingung — man braucht keinen Halluzinations-Benchmark, wenn der Gegenstand selbst einer ist.

Bewertet wurde **gegen den Quelltext**, nicht Modell gegen Modell, aufgeteilt auf drei unabhängige Prüfinstanzen. Die Baseline lief in jedem Durchgang mit, um den Maßstab zu kalibrieren.

## Warum Token pro Sekunde als LLM-Benchmark versagt

| Modell | Wall-Zeit | Ausgabe-Token | Token/s | **Nutztext/s** | relativ |
|---|---|---|---|---|---|
| **qwen3.6** | 727,2 s | 45 739 | 62,9 | **199,3 B/s** | **100 %** |
| Nemotron-3-Nano | 850,8 s | 56 179 | **66,0** | 162,4 B/s | 81 % |
| GLM-4.7-Flash | 823,2 s | 36 145 | 43,9 | 127,8 B/s | 64 % |
| North-Mini-Code | 1 495,9 s | 80 321 | 53,7 | 75,6 B/s | 38 % |

Die Rangfolge kehrt sich um, je nachdem was man zählt. Nach \`tok/s\` ist Nemotron-3-Nano das schnellste Modell des Feldes. Nach *nutzbarem Text* liegt es 19 % hinter der Baseline.

Dahinter stehen zwei unabhängige Mechanismen:

**Ein nicht abschaltbarer Denk-Kanal.** North-Mini-Code ist ein Reasoning-Modell und ignoriert \`enable_thinking: false\` — sein Chat-Template kennt den Parameter nicht. Über elf Programme fallen **58,8 % aller erzeugten Token** (47 229 von 80 321) in ein separates Feld, das nie beim Anwender ankommt. Bei zwei Programmen sind es 100 %: Das Token-Budget ist erschöpft, bevor die erste Zeile Antwort entsteht. Die Herstellerdokumentation sieht keinen Abschalter vor und empfiehlt im Gegenteil, die Denk-Inhalte weiterzureichen — das Modell ist für einen Agenten-Kontext gebaut, in dem dieser Kanal verwertet wird. Eine hier naheliegende Alternativerklärung, ein für Deutsch ineffizienter Tokenizer, wurde geprüft und widerlegt: North-Mini-Code kodiert Deutsch mit 3,57 Byte je Token sogar minimal dichter als die Baseline mit 3,28.

**Degeneration, die die Statistik verbessert.** Nemotron-3-Nano läuft bei einem Programm in eine Wiederholungsschleife: vier Zeilen, je etwa 154-mal, bis zum Token-Limit, Abbruch mitten im Wort. Das erzeugt 33 770 Byte, die als "Nutztext" in die Tabelle eingehen und den Kandidaten dort *begünstigen*. Rechnet man diesen Lauf heraus, fällt er von 81 % auf 87 % relativ zur Baseline — die Zahl wird besser, weil der Nenner ehrlicher wird.

Brauchbar als Vergleichsmaß ist deshalb nur **nutzbarer Text pro Sekunde**, und auch der nur zusammen mit einer Qualitätsprüfung.

## Wie der Prompt selbst LLM-Halluzinationen erzeugt

Der System-Prompt enthielt im Kapitel "Risiken bei Änderungen" ein illustrierendes Beispiel — frei erfundene Symbolnamen und ein \`EXEC SQL READ\`, als Muster dafür, wie ein Risikohinweis aussehen soll. Keines dieser Symbole existiert in irgendeinem der zwölf Programme.

| Modell | Dateien | Beispiel-Symbole aus dem Prompt | erfundenes Copybook |
|---|---|---|---|
| **qwen3.6** | 13 | **0** | **0** |
| GLM-4.7-Flash | 12 | 0 | 1 |
| North-Mini-Code | 12 | 0 | 1 |
| **Nemotron-3-Nano** | 12 | **10** | **5** |

In zehn von zwölf Berichten steht bei Nemotron-3-Nano ein wortgleicher, frei erfundener Risiko-Absatz über nicht existierende Programmteile — als *erster* Punkt des Kapitels, das ein Wartungsentwickler zuerst liest.

Der zweite Fall ist noch präziser rückverfolgbar. Der Prompt fordert "mindestens 5 Punkte wenn das Programm > 1000 LOC". Für ein Programm von 187 Zeilen behauptet das Modell wörtlich, es umfasse "> 1.000 Anweisungen". **Es erfindet die Prämisse, um die Bedingung der Anweisung zu erfüllen.**

Dazu kommt ein struktureller Mitverursacher: Der Prompt benennt Mainframe-Technologien (\`EXEC CICS\`, \`EXEC SQL\`, FDs) als *Kategorien* des Datenfluss-Kapitels. Für ein Zielsystem, das keine davon einsetzt, verlangt eine korrekte Antwort das **Melden von Abwesenheit**. Genau daran scheitern die Kandidaten: Sie füllen das Formular.

Der Befund "erfundenes CICS" ist damit nur teilweise ein Modellfehler. Er ist ebenso ein Prompt-Artefakt — eines, das schwächere Modelle sichtbar macht und robustere nicht. Dass die Baseline das Beispiel in 13 von 13 Dateien nicht übernimmt, zeigt: Robustheit gegen solche Prompts ist möglich, aber nicht selbstverständlich.

Die Fähigkeit, **Abwesenheit zu berichten statt ein Raster zu füllen**, war in dieser Untersuchung das trennschärfste Einzelmerkmal zwischen Baseline und Kandidaten. Sie taucht in keinem Standard-Benchmark auf.

## Einzelstrom gegen Parallelbetrieb: der Betriebsmodus entscheidet

Aggregierter Durchsatz in tok/s bei 1, 2, 5 und 8 gleichzeitigen Anfragen:

| Modell | C=1 | C=2 | C=5 | **C=8** |
|---|---|---|---|---|
| **qwen3.6** | 60,7 | 68,5 | 112,8 | **180,9** |
| Nemotron-3-Nano | **72,8** | 93,9 | 132,4 | 149,4 |
| GLM-4.7-Flash | 48,9 | 61,7 | 116,8 | 168,1 |

Nemotron-3-Nano ist im Einzelstrom das schnellste Modell des Feldes — 20 % vor der Baseline. Bei acht parallelen Strömen liegt es 17 % zurück. Der Betriebsmodus des Zielsystems ist genau dieser Achtfach-Parallelbetrieb.

Das ist der praktisch folgenreichste Befund der ganzen Untersuchung: **Hätte ich sequenziell gemessen, wäre das Ergebnis das gegenteilige gewesen.** Der öffentlich verfügbare Blog-Benchmark zu diesem Modell misst sequenziell und weist es als sehr schnell aus. Meine Einzelstrom-Messung von 72,8 tok/s ist damit gut vereinbar — der Punkt ist nicht, dass die publizierte Zahl falsch wäre, sondern dass sie im falschen Betriebsmodus erhoben wurde.

Dieselbe Vorsicht gilt für beworbene Speichervorteile. Der für Nemotron-3-Nano genannte KV-Cache von 1,7 GB bei 1 M Kontext gilt nur mit Q4_0-quantisiertem KV; unquantisiert liegt er bei rund 96 GB.

## Modellauswahl für lokale LLMs: die billigsten Tests zuerst

Aus der Untersuchung fällt eine Prüfreihenfolge ab, die mit den billigsten Tests beginnt. In dieser Reihenfolge angewendet, hätte sie zwei der drei Kandidaten in Minuten statt in Tagen aussortiert:

1. **Architektur-Kennung aus dem GGUF-Header** per HTTP-Range-Request lesen — 4 KB statt 20 GB Download, Sekunden statt Stunden. Läuft das Modell überhaupt auf dem vorhandenen Build? Dabei eine Einschränkung beachten: Der Header sagt, *womit die Laufzeitumgebung das Modell ausführt*, nicht zwingend, *was der Hersteller gebaut hat*. GLM-4.7-Flash deklariert im GGUF eine fremde Architektur, weil die Konvertierung auf eine bereits unterstützte Implementierung abbildet.
2. **Gating vorab prüfen.** Ein Feld in der Modell-API genügt. Steht dort \`gated: manual\`, entscheidet nicht der Zeitplan des Projekts, sondern der des Anbieters — Freigabe beantragen und Wartezeit einplanen. Bei Soofi S war das der Grund, warum der favorisierte Kandidat nie in die Messreihe kam.
3. **Reasoning-Abschaltung am Antwortfeld nachweisen** — nicht am Parameternamen. Ein Parameter, den das Chat-Template nicht kennt, wird stillschweigend ignoriert.
4. **Beispiel-Leck-Test.** Ein \`grep\` über die Ausgaben nach den Symbolnamen aus dem eigenen Prompt. Dauert eine Minute und ist der aussagekräftigste Einzeltest dieser Studie.
5. **Erst dann** die vollständige Suite mit Qualitätsprüfung — im Ziel-Betriebsmodus, mit mehreren Läufen.

## Lizenzfallen bei offenen Modellen

Wer "offen" im Vertrieb verwendet, prüft besser zweimal — und zwar **modell- und versionsspezifisch**, denn innerhalb einer Familie unterscheiden sich die Lizenzen.

**Devstral-2-123B** steht unter einer modifizierten MIT-Lizenz, die die Nutzung ausschließt, wenn der weltweite konsolidierte Monatsumsatz des Unternehmens 20 Millionen USD übersteigt. Für Banken und Versicherungen ist das Modell damit faktisch nicht frei — während *Devstral Small 2* mit 24 B unter Apache 2.0 steht. Gleiche Familie, gegenteilige Lage.

**Mistral-Medium-3.5** führt ebenfalls eine "Modified MIT License … with exceptions for companies with large revenue". Die konkrete Umsatzgrenze ist auf der Modellkarte allerdings **nicht** belegt; wer sie in einem Angebot nennt, zitiert Sekundärquellen.

Die **Tencent Hunyuan Community License** nimmt EU, Vereinigtes Königreich und Südkorea wörtlich aus dem Geltungsbereich. Das betrifft diese Lizenz, nicht automatisch jedes Hunyuan-Modell — nach Sekundärquellen erschien eine spätere Generation unter Apache 2.0 ohne solche Einschränkung.

Für einen On-Premise-Rollout im Mittelstand ist deshalb nicht "EU-Modell" das tragfähige Argument, sondern **Apache-2.0-Gewichte**: keine Umsatzschwelle, keine Gebietsklausel, vollständig im eigenen Haus betreibbar. Genau darunter steht die Baseline dieses Tests.

## KI-Souveränität: "EU-Modell" ist das falsche Kriterium

Die Souveränitätsdebatte fragt meist nach der Herkunft der Gewichte. Für einen Rollout auf bandbreitenbegrenzter Hardware ist das die falsche Frage.

Ich habe die fünf meistgenannten europäischen Open-Weight-Modelle nachgesehen: Teuken-7B (openGPT-X), EuroLLM-22B (utter-project), ALIA-40b (BSC), Apertus-70B (swiss-ai) und Pharia-1-7B (Aleph Alpha). Alle fünf sind **dicht** — keines ist ein Mixture-of-Experts-Modell, ihre \`config.json\` enthält kein einziges Experten-Feld (geprüft am 30.07.2026).

Was das auf dieser Maschine bedeutet, ist eine Division. In Q4-Quantisierung sind rund 0,6 Byte je Parameter zu lesen; bei 273 GB/s ergibt das folgende theoretische Obergrenzen:

| Modell | Gewichte in Q4 | Obergrenze | Einordnung |
|---|---|---|---|
| Teuken-7B, Pharia-1-7B | ~4 GB | ~65 tok/s | läuft gut, aber nicht in der 30-B-Fähigkeitsklasse |
| EuroLLM-22B | ~13 GB | ~21 tok/s | grenzwertig |
| ALIA-40b | ~24 GB | ~11 tok/s | zu langsam für Achtfach-Parallelbetrieb |
| Apertus-70B | ~42 GB | ~7 tok/s | praktisch unbrauchbar |
| MoE mit 3 B aktiv | ~2 GB | ~140 tok/s | die Baseline dieses Tests |

Das sind Obergrenzen, nicht Messwerte — real liegt man deutlich darunter: Die Baseline erreicht gemessen 63 statt der theoretischen 140 tok/s. Die Größenordnungen halten aber, und unabhängige Benchmarks auf dieser Plattform berichten für dichte Modelle der 70-B-Klasse einstellige Werte.

Die verbreitete Formel "Europa baut nur dichte Modelle" trifft die Faktenlage also — aber nicht die Pointe. Die kleinen europäischen Modelle laufen auf dieser Maschine ausgezeichnet; sie spielen nur nicht in der Fähigkeitsklasse um 30 B. Und genau dort existiert mit Soofi S inzwischen ein europäisches MoE-Modell mit rund 3,2 B aktiven Parametern, technisch gebaut für exakt diese Hardware — nur eben noch nicht herunterladbar.

Die Lizenzlage ist ebenfalls nicht einheitlich: EuroLLM, ALIA und Apertus stehen unter Apache 2.0, Teuken in einer Apache-2.0-Variante für kommerzielle Nutzung neben einer Research-Variante mit eigener Lizenz, Pharia unter einer eigenen Lizenz. Die neueste Apertus-Version v1.5 ist ihrerseits zugriffsbeschränkt.

Für die Praxis heißt das: Über Datenhoheit entscheidet nicht die Herkunft, sondern **Apache-2.0-Gewichte plus eine Architektur, die auf die vorhandene Bandbreite passt**. Beides zusammen ergibt Betrieb vollständig im eigenen Haus. Eines allein nicht.

## Was diese Ergebnisse nicht hergeben

Der Redlichkeit halber, weil die Befunde sonst mehr tragen sollen als sie können:

- **Ein Durchlauf je Modell** bei \`temperature = 0.2\`. Bei Aussagen zu Programmabdeckung und Degenerationsschleifen ist ein Zufallsanteil nicht ausgeschlossen. Die Lasttests wurden wiederholt, die Programmläufe nicht.
- **Bewertung durch ein Sprachmodell**, gegen den Quelltext, mit stichprobenartiger Nachprüfung — aber ohne vollständige Validierung durch einen menschlichen COBOL-Experten. Es ist nicht auszuschließen, dass die Prüfinstanz Fehler derselben Art macht wie die geprüften Modelle.
- **Keine Inter-Rater-Reliabilität.** Die drei Prüfinstanzen bearbeiteten disjunkte Teilmengen; es gibt kein Maß für die Übereinstimmung der Bewertenden. Halluzinationszahlen sind deshalb *innerhalb* einer Zeile vergleichbar, nicht zwischen den Zeilen.
- **Ein Prompt, eine Domäne, ein Bestandssystem.** Die Ergebnisse gelten für diese Aufgabe. Code *erzeugen* statt beschreiben wurde nicht geprüft.
- **Quantisierungseffekte nicht isoliert.** Alle Modelle liefen in Q4_K_M. Ob einzelne Kandidaten unter Quantisierung überproportional verlieren, ist offen.

## Fazit: erst den Prompt prüfen, dann das Modell

Die naheliegende Lesart wäre: drei Kandidaten durchgefallen, Baseline bleibt, nichts zu tun. Die nützlichere Lesart ist eine andere. Von den Maßnahmen, die aus dieser Untersuchung folgen, ist die einzige mit unmittelbarem Nutzen **prompt-seitig** — das fiktive Beispiel entfernen oder unmissverständlich als fiktiv markieren, die Zieltechnologie benennen, das Melden von Abwesenheit ausdrücklich verlangen. Diese Änderung wirkt unabhängig davon, welches Modell darunter läuft.

Wer einen Modellwechsel prüft, sollte deshalb zuerst prüfen, wieviel des beobachteten Qualitätsproblems überhaupt vom Modell kommt. In diesem Fall war ein erheblicher Teil der Halluzinationen als Ausfüllen eines vorgegebenen Rasters rekonstruierbar — die Modelle melden nicht, was sie finden, sondern was das Formular vorsieht.

Und noch eine Beobachtung, die nicht zu den Modellen gehört: Bei der Erstellung des zugrundeliegenden Berichts wurden alle externen Angaben neu gegen die Primärquelle geprüft, statt aus internen Notizen übernommen zu werden. Dabei mussten **fünf** zuvor als gesichert geführte Angaben korrigiert werden. Plausible, assertiv formulierte, unbelegte Aussagen sind kein Alleinstellungsmerkmal von Sprachmodellen.`,
      faq: [
        {
          q: "Kann ein lokales LLM COBOL-Code dokumentieren?",
          a: "Ja. Ein quantisiertes Modell der 30-Milliarden-Klasse erzeugte auf einem einzelnen NVIDIA DGX Spark aus elf produktiven COBOL-Programmen strukturierte Wartungsdokumentation — Zweck, Datenfluss, Ablauflogik je Section, CALL-Graph und Änderungsrisiken, bei Eingabelängen bis 390 000 Zeichen. Die Ausgaben sind nicht fehlerfrei: Auch das beste Modell erfindet Inhalte, dokumentiert aber im Unterschied zu den geprüften Alternativen Unsicherheit und meldet die Abwesenheit von Technologien statt sie zu erfinden. Als Zuarbeit für Wartungsentwickler ist das tragfähig, als unbeaufsichtigte Dokumentationsquelle nicht.",
        },
        {
          q: "Welche Hardware braucht ein lokales LLM im Mittelstand?",
          a: "Für Modelle der 30-Milliarden-Klasse in Q4-Quantisierung reicht eine Maschine mit rund 128 GB schnellem Speicher; im Test war das ein NVIDIA DGX Spark mit GB10-Superchip und 273 GB/s Speicherbandbreite. Entscheidend ist nicht die Rechenleistung, sondern die Bandbreite: Sie begrenzt, wieviel Modellgewicht pro Token gelesen werden kann. Daraus folgt die Modellklasse — Mixture-of-Experts mit wenigen aktiven Parametern statt dichter Modelle gleicher Gesamtgröße.",
        },
        {
          q: "Sind europäische LLMs für den On-Premise-Betrieb geeignet?",
          a: "Das hängt an der Architektur, nicht an der Herkunft. Die fünf meistgenannten europäischen Open-Weight-Modelle — Teuken-7B, EuroLLM-22B, ALIA-40b, Apertus-70B und Pharia-1-7B — sind alle dicht, keines ist ein Mixture-of-Experts-Modell. Auf einer Maschine mit 273 GB/s Speicherbandbreite laufen die 7-B-Modelle ausgezeichnet, die 40- bis 70-B-Modelle dagegen mit einstelligen bis grenzwertigen Token-Raten. In der Fähigkeitsklasse um 30 B gibt es mit Soofi S inzwischen ein europäisches MoE-Modell, das technisch passt, aber noch freigabepflichtig ist. Entscheidend für Datenhoheit sind Apache-2.0-Gewichte plus eine Architektur, die zur vorhandenen Bandbreite passt.",
        },
        {
          q: "Warum ist Token pro Sekunde kein gutes Maß für LLM-Durchsatz?",
          a: "Weil Token, die den Anwender nie erreichen, mitgezählt werden. Ein Reasoning-Modell mit nicht abschaltbarem Denk-Kanal erzeugte 58,8 % seiner Token in einem separaten Feld und erschien so als schnellstes Modell des Feldes, obwohl es nach nutzbarem Text das langsamste war. Auch eine Degenerationsschleife verbessert die tok/s-Bilanz. Brauchbar ist nur nutzbarer Text pro Sekunde, zusammen mit einer Qualitätsprüfung.",
        },
        {
          q: "Wie erkenne ich prompt-induzierte Halluzinationen?",
          a: "Mit einem grep über alle Modellausgaben nach den Symbolnamen, die im eigenen Prompt als Beispiel vorkommen. Tauchen sie in den Ergebnissen auf, gibt das Modell Ihr Beispiel als Befund aus. In dieser Untersuchung traf das auf 10 von 12 Berichten von Nemotron-3-Nano zu, während die Baseline das Beispiel in keiner einzigen Datei übernahm.",
        },
        {
          q: "Kann ein MoE-Modell mit gleich vielen aktiven Parametern die gleiche Leistung liefern?",
          a: "Nein, das ließ sich nicht bestätigen. Vier Modelle mit rund 3 Milliarden aktiven Parametern lagen bei nutzbarem Text pro Sekunde um Faktor 2,6 auseinander. Die Zahl der aktiven Parameter sagt etwas über die Speicherbandbreiten-Last pro Token, aber nichts über Ausgabedisziplin, Reasoning-Overhead oder Degenerationsneigung.",
        },
        {
          q: "Welche Rolle spielt die Speicherbandbreite bei lokaler LLM-Inferenz?",
          a: "Auf bandbreitenbegrenzter Hardware — im Test 273 GB/s — bestimmt nicht die Rechenleistung den Durchsatz, sondern die pro Token aus dem Speicher zu lesende Gewichtsmenge. Daraus folgt die Modellklasse: Mixture-of-Experts mit wenigen aktiven Parametern statt dichter Modelle vergleichbarer Gesamtgröße.",
        },
        {
          q: "Wie prüfe ich vor dem Download, ob ein Modell auf meinem Stack läuft?",
          a: "Über einen HTTP-Range-Request auf die ersten 4 KB der GGUF-Datei. Dort stehen Magic, Version und als erster Schlüssel die Architektur-Kennung; die vergleicht man gegen die Architekturliste der eigenen Laufzeitumgebung. 4 KB statt 20 GB. Einschränkung: Der Header sagt, womit das Modell ausgeführt wird, nicht zwingend, was der Hersteller gebaut hat.",
        },
        {
          q: "Worauf muss ich bei Lizenzen offener Modelle achten?",
          a: "Auf modell- und versionsspezifische Prüfung. Zwei prominente Modelle stehen unter einer modifizierten MIT-Lizenz mit Umsatzdeckel von 20 Millionen USD pro Monat, was sie für Banken und Versicherungen faktisch ausschließt. Eine weitere Community-Lizenz nimmt die EU wörtlich aus. Und ein formal offenes Modell kann faktisch geschlossen sein — manuelles Gating und Lizenzfeld closed-beta.",
        },
      ],
      sources: [
        {
          title: "Qwen3.6-35B-A3B — Modellkarte (Hugging Face)",
          url: "https://huggingface.co/Qwen/Qwen3.6-35B-A3B",
        },
        {
          title: "GLM-4.7-Flash — Modellkarte (Hugging Face)",
          url: "https://huggingface.co/zai-org/GLM-4.7-Flash",
        },
        {
          title: "North-Mini-Code-1.0 — Modellkarte (Cohere Labs)",
          url: "https://huggingface.co/CohereLabs/North-Mini-Code-1.0",
        },
        {
          title: "NVIDIA-Nemotron-3-Nano-30B-A3B — Modellkarte",
          url: "https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16",
        },
        {
          title: "StorageReview: NVIDIA DGX Spark Review (273 GB/s Speicherbandbreite)",
          url: "https://www.storagereview.com/review/nvidia-dgx-spark-review-the-ai-appliance-bringing-datacenter-capabilities-to-desktops",
        },
        {
          title: "Unabhängiger Durchsatz-Benchmark Nemotron 3 Nano auf DGX Spark",
          url: "https://medium.com/@kocyigityasar/nvidia-dgx-spark-nemotron-3-nano-30b-1m-context-window-benchmark-57b4d0809991",
        },
        {
          title: "vLLM Issue #43906 — MXFP8 MoE fällt auf SM_121 auf MARLIN zurück",
          url: "https://github.com/vllm-project/vllm/issues/43906",
        },
        {
          title: "Apertus-70B-Instruct (swiss-ai) — Modellkarte, Apache 2.0, dense",
          url: "https://huggingface.co/swiss-ai/Apertus-70B-Instruct-2509",
        },
        {
          title: "ALIA-40b (Barcelona Supercomputing Center) — Modellkarte",
          url: "https://huggingface.co/BSC-LT/ALIA-40b",
        },
        {
          title: "EuroLLM-22B-Instruct (utter-project) — Modellkarte",
          url: "https://huggingface.co/utter-project/EuroLLM-22B-Instruct-2512",
        },
        {
          title: "Teuken-7B-instruct-commercial (openGPT-X) — Modellkarte",
          url: "https://huggingface.co/openGPT-X/Teuken-7B-instruct-commercial-v0.4",
        },
        {
          title: "Soofi-S-Base (SOOFI-Konsortium) — Modellkarte, gated: manual",
          url: "https://huggingface.co/Soofi-Project/Soofi-S-Base",
        },
        {
          title: "Laguna-XS-2.1 (poolside) — Modellkarte, SWE-bench Verified 70,9 %",
          url: "https://huggingface.co/poolside/Laguna-XS-2.1",
        },
        {
          title: "Devstral 2 — Lizenztext mit Umsatzgrenze",
          url: "https://mistral.ai/news/devstral-2-vibe-cli/",
        },
        {
          title: "Tencent Hunyuan Community License (Ausschluss EU/UK/Südkorea)",
          url: "https://github.com/Tencent-Hunyuan/Hunyuan-MT/blob/main/License.txt",
        },
      ],
    },
    en: {
      title: "Local LLMs for COBOL documentation: a benchmark",
      articleSection: "Local LLMs",
      excerpt:
        "Four open MoE models on an NVIDIA DGX Spark against eleven production COBOL programs. None beats the baseline — and the prompt produces hallucinations of its own.",
      coverAlt:
        "Local LLMs compared: four Mixture-of-Experts models documenting legacy COBOL code on-premises on an NVIDIA DGX Spark",
      tags: [
        "Local LLMs",
        "On-premise LLM",
        "COBOL documentation",
        "Legacy modernisation",
        "NVIDIA DGX Spark",
        "GB10",
        "Mixture of Experts",
        "LLM benchmark",
        "LLM hallucination",
        "Prompt engineering",
        "llama.cpp",
        "Data sovereignty",
        "AI sovereignty",
      ],
      bodyMarkdown: `A **local LLM** can turn legacy COBOL code into usable maintenance documentation — fully on-premises, without source code ever leaving the building. Which model you pick decides throughput and error density. Four quantised Mixture-of-Experts models in the 30-billion class, eleven production COBOL programs, one NVIDIA DGX Spark with 273 GB/s of memory bandwidth: across 32 assessed units, **not a single verdict of "better"** against the incumbent baseline, qwen3.6-35B-A3B.

The most useful finding, though, is not about the models. It is about the prompt — Nemotron-3-Nano reports an *example* from the task description as a genuine finding about the program under review, in 10 out of 12 reports.

**At a glance:**

- **Tokens per second is useless as an LLM benchmark.** North-Mini-Code spent 58.8 % of its tokens in a thinking channel it could not switch off, which made it look like the fastest in the field.
- **Part of the hallucination comes from the prompt.** An illustrative example in the task description travelled into the results as a genuine finding.
- **The operating mode decides.** Nemotron-3-Nano was 20 % faster than the baseline single-stream and 17 % slower at eight concurrent requests.
- **Where the weights come from is the wrong criterion.** All five major European open-weight models are dense — and dense models in the 40–70B class deliver single-digit tok/s on this hardware.

The question was simple: can another open model replace the one in production? The answer is no. What became visible on the way there is the interesting part. For anyone running an on-premise LLM on bandwidth-bound hardware, the three findings transfer; COBOL as subject matter just makes them unusually measurable.

## Test setup: DGX Spark, llama.cpp and eleven COBOL programs

Testing ran on an NVIDIA DGX Spark with a GB10 superchip (Grace Blackwell), 128 GB of unified memory and **273 GB/s** of memory bandwidth. That number dictates the model class: at 273 GB/s, throughput is not bounded by compute but by the weight volume that must be read from memory per token. Mixture-of-Experts with roughly 3 billion *active* parameters is the right class — dense models of comparable total size starve on bandwidth. That, rather than headline parameter count, is why MoE models are interesting for local rollouts on this hardware class.

All four models ran on the **same** llama.cpp build, in the same quantisation class (Q4_K_M), with identical parameters (\`temperature = 0.2\`), against the same programs. The shared build was a selection criterion, not a coincidence: a candidate whose architecture identifier the build does not recognise would have required a second build line.

| | qwen3.6-35B-A3B **(baseline)** | GLM-4.7-Flash | North-Mini-Code-1.0 | Nemotron-3-Nano-30B-A3B |
|---|---|---|---|---|
| Origin | Alibaba / Qwen | Z.ai / Zhipu | Cohere Labs | NVIDIA |
| Licence | Apache 2.0 | MIT | Apache 2.0 + AUP | NVIDIA Open Model License |
| Parameters total / active | 35 B / 3 B | 30 B / 3 B | 30 B / 3 B | 30 B / 3.5 B |
| Experts total / active | 256 / 8 (+1) | 64 / 4 | 128 / 8 | 128 / 6 (+1) |
| File size (Q4_K_M) | 22.3 GB | 18.3 GB | 19.2 GB | 24.6 GB |
| SWE-bench Verified (vendor) | 73.4 | 59.2 | n/a | 38.8 |

Not in the field but worth naming: **Laguna-XS-2.1** (poolside) is on paper the strongest available candidate for this task at 33 B / 3 B and SWE-bench Verified 70.9 %. It could not be tested because llama.cpp support was not in the main branch at the time but in an open upstream PR. Note its OpenMDW-1.1 licence. Worth revisiting once that PR lands. Also absent from the field although it was the originally preferred candidate: **Soofi S** by the SOOFI consortium — a German sovereignty project involving Fraunhofer IAIS, DFKI and TU Darmstadt, coordinated by the KI Bundesverband. Downloads require approval (\`gated: manual\`) and the model card's license field reads \`closed-beta\`. An access request filed on 27 July 2026 was still undecided at the time of writing, which is why the model is missing here. For fairness: this is not a closed licence but a beta phase — the model card explicitly announces the final release "openly under a permissive license, without gated access".

The architecture is the instructive part. At 31.6 B total and roughly 3.2 B active parameters, with a hybrid Mamba-2/Transformer stack of 128 routed plus 2 shared experts, Soofi S is **not** a twin of the baseline but of Nemotron-3-Nano — the model that scored worst on quality in this test. What that implies for Soofi is open: architecture does not determine output discipline or the tendency to hallucinate. It is a reason to measure the model rather than to expect a result.

The task is what the literature calls retro-documentation: structured maintenance documentation for a given COBOL program — business purpose, data flow, control flow per section, call graph, change risks. Real production code from a legacy ERP system, roughly 2,000 to 43,000 tokens of input, no synthetic examples. One longer program exceeded the context length of the test configuration and failed on every model — that failure belongs to the configuration, not to the models, and is left out of the evaluation.

One property of the corpus is what makes the evaluation objective at all. The system uses none of the classic mainframe building blocks — database access runs through an application-owned access layer, not through embedded SQL. It contains **no CICS, no DB2 and not a single \`EXEC SQL\` statement**. Any mention of those technologies in a model output is therefore demonstrably invented. The corpus acts as a natural control condition — you do not need a hallucination benchmark when the subject matter is one.

Assessment was made **against the source code**, not model against model, split across three independent reviewers. The baseline was re-assessed in every round to calibrate the scale.

## Why tokens per second fails as an LLM benchmark

| Model | Wall time | Output tokens | Tokens/s | **Useful bytes/s** | relative |
|---|---|---|---|---|---|
| **qwen3.6** | 727.2 s | 45,739 | 62.9 | **199.3 B/s** | **100 %** |
| Nemotron-3-Nano | 850.8 s | 56,179 | **66.0** | 162.4 B/s | 81 % |
| GLM-4.7-Flash | 823.2 s | 36,145 | 43.9 | 127.8 B/s | 64 % |
| North-Mini-Code | 1,495.9 s | 80,321 | 53.7 | 75.6 B/s | 38 % |

The ranking inverts depending on what you count. By \`tok/s\`, Nemotron-3-Nano is the fastest model in the field. By *usable text*, it sits 19 % behind the baseline.

Two independent mechanisms produce that gap:

**A thinking channel that cannot be switched off.** North-Mini-Code is a reasoning model and ignores \`enable_thinking: false\` — its chat template does not know the parameter. Across eleven programs, **58.8 % of all generated tokens** (47,229 of 80,321) land in a separate field that never reaches the user. For two programs it is 100 %: the token budget is exhausted before the first line of the answer exists. The vendor documentation provides no off switch and in fact recommends passing the thinking content on — the model is built for an agentic context that consumes that channel. The obvious alternative explanation, a tokeniser that is inefficient for German, was tested and ruled out: North-Mini-Code encodes German at 3.57 bytes per token, marginally denser than the baseline at 3.28.

**Degeneration that improves the statistics.** On one program, Nemotron-3-Nano falls into a repetition loop: four lines, roughly 154 times each, up to the token limit, cut off mid-word. That produces 33,770 bytes which enter the table as "usable text" and *flatter* the candidate. Remove that run and it moves from 81 % to 87 % relative to the baseline — the number improves because the denominator becomes honest.

The only workable comparison metric is therefore **usable text per second**, and even that only alongside a quality review.

## How the prompt itself produces LLM hallucinations

Under "change risks", the system prompt contained an illustrative example — invented symbol names and an \`EXEC SQL READ\`, as a pattern for what a risk note should look like. None of those symbols exists in any of the twelve programs.

| Model | Files | Example symbols from the prompt | Invented copybook |
|---|---|---|---|
| **qwen3.6** | 13 | **0** | **0** |
| GLM-4.7-Flash | 12 | 0 | 1 |
| North-Mini-Code | 12 | 0 | 1 |
| **Nemotron-3-Nano** | 12 | **10** | **5** |

In ten of twelve reports, Nemotron-3-Nano carries a verbatim, entirely invented risk paragraph about program parts that do not exist — as the *first* item in the chapter a maintenance developer reads first.

The second case is even more precisely traceable. The prompt asks for "at least 5 items if the program is > 1000 LOC". For a program of 187 lines, the model states verbatim that it comprises "> 1,000 statements". **It invents the premise in order to satisfy the condition of the instruction.**

There is a structural contributor as well. The prompt names mainframe technologies (\`EXEC CICS\`, \`EXEC SQL\`, FDs) as *categories* of the data flow chapter. For a target system that uses none of them, a correct answer requires **reporting absence**. That is exactly where the candidates fail: they fill in the form.

So "invented CICS" is only partly a model defect. It is equally a prompt artefact — one that exposes weaker models and not more robust ones. That the baseline declines to adopt the example in 13 of 13 files shows robustness against such prompts is achievable, but not a given.

The ability to **report absence rather than fill a grid** was the single most discriminating property between baseline and candidates in this study. It appears in no standard benchmark.

## Single-stream versus concurrency: the operating mode decides

Aggregate throughput in tok/s at 1, 2, 5 and 8 concurrent requests:

| Model | C=1 | C=2 | C=5 | **C=8** |
|---|---|---|---|---|
| **qwen3.6** | 60.7 | 68.5 | 112.8 | **180.9** |
| Nemotron-3-Nano | **72.8** | 93.9 | 132.4 | 149.4 |
| GLM-4.7-Flash | 48.9 | 61.7 | 116.8 | 168.1 |

Single-stream, Nemotron-3-Nano is the fastest model in the field — 20 % ahead of the baseline. At eight concurrent streams it is 17 % behind. The target system's operating mode is precisely that eightfold concurrency.

This is the most consequential finding of the whole exercise: **had I measured sequentially, the result would have been the opposite.** The publicly available blog benchmark for this model measures sequentially and reports it as very fast. My single-stream measurement of 72.8 tok/s is entirely consistent with it — the point is not that the published figure is wrong, but that it was taken in the wrong operating mode.

The same caution applies to advertised memory advantages. The 1.7 GB KV cache quoted for Nemotron-3-Nano at 1M context holds only with Q4_0-quantised KV; unquantised it is around 96 GB.

## Selecting a model for a local LLM: cheapest tests first

The study yields an evaluation order that starts with the cheapest tests. Applied in this order, it would have eliminated two of the three candidates in minutes rather than days:

1. **Read the architecture identifier from the GGUF header** via an HTTP range request — 4 KB instead of a 20 GB download, seconds instead of hours. Does the model run on the existing build at all? One caveat: the header tells you *what the runtime executes the model as*, not necessarily *what the vendor built*. GLM-4.7-Flash declares a foreign architecture in its GGUF because conversion maps it onto an already-supported implementation.
2. **Check gating up front.** One field in the model API is enough. If it says \`gated: manual\`, the vendor's timeline governs rather than the project's — file the request and plan for the wait. With Soofi S that is why the preferred candidate never entered the measurement series.
3. **Verify reasoning shutdown on the response field** — not on the parameter name. A parameter the chat template does not know is silently ignored.
4. **Run the example-leak test.** A \`grep\` across the outputs for the symbol names in your own prompt. It takes a minute and was the single most informative test in this study.
5. **Only then** the full suite with quality review — in the target operating mode, with repeated runs.

## Licence traps in open-weight models

Anyone using "open" in a sales conversation should check twice — and check **per model and per version**, because licences differ inside a single family.

**Devstral-2-123B** ships under a modified MIT licence that withdraws the rights if the company's global consolidated monthly revenue exceeds USD 20 million. For banks and insurers that makes the model effectively unavailable — while *Devstral Small 2* at 24 B is Apache 2.0. Same family, opposite situation.

**Mistral-Medium-3.5** also carries a "Modified MIT License … with exceptions for companies with large revenue". The specific revenue threshold, however, is **not** documented on the model card; quoting it in a proposal means quoting secondary sources.

The **Tencent Hunyuan Community License** excludes the EU, the United Kingdom and South Korea from its scope verbatim. That applies to this licence, not automatically to every Hunyuan model — secondary sources report a later generation released under Apache 2.0 without such a restriction.

For an on-premise rollout, then, the durable argument is not "EU model" but **Apache-2.0 weights**: no revenue threshold, no territorial clause, fully operable in-house. Which is exactly what this test's baseline is licensed under.

## AI sovereignty: "EU model" is the wrong criterion

The sovereignty debate usually asks where the weights come from. For a rollout on bandwidth-bound hardware, that is the wrong question.

I checked the five most frequently cited European open-weight models: Teuken-7B (openGPT-X), EuroLLM-22B (utter-project), ALIA-40b (BSC), Apertus-70B (swiss-ai) and Pharia-1-7B (Aleph Alpha). All five are **dense** — none is a Mixture-of-Experts model, and their \`config.json\` contains no expert field at all (checked 30 July 2026).

What that means on this machine is a division. At Q4 quantisation roughly 0.6 bytes per parameter must be read; at 273 GB/s that yields these theoretical ceilings:

| Model | Weights at Q4 | Ceiling | Assessment |
|---|---|---|---|
| Teuken-7B, Pharia-1-7B | ~4 GB | ~65 tok/s | runs well, but not in the 30B capability class |
| EuroLLM-22B | ~13 GB | ~21 tok/s | marginal |
| ALIA-40b | ~24 GB | ~11 tok/s | too slow for eightfold concurrency |
| Apertus-70B | ~42 GB | ~7 tok/s | effectively unusable |
| MoE with 3B active | ~2 GB | ~140 tok/s | this test's baseline |

These are ceilings, not measurements — reality lands well below: the baseline measures 63 rather than the theoretical 140 tok/s. The orders of magnitude hold, though, and independent benchmarks on this platform report single-digit figures for dense models in the 70B class.

So the common line "Europe only builds dense models" matches the facts — but misses the point. The small European models run very well on this machine; they simply are not in the 30B capability class. And in exactly that class, Soofi S is now a European MoE model with roughly 3.2B active parameters, built for precisely this hardware — just not downloadable yet.

The licensing picture is not uniform either: EuroLLM, ALIA and Apertus are Apache 2.0; Teuken comes in an Apache-2.0 variant for commercial use alongside a research variant under its own licence; Pharia has its own licence. And the newest Apertus release, v1.5, is itself access-restricted.

For practical purposes: data sovereignty is not decided by origin but by **Apache-2.0 weights plus an architecture that fits the bandwidth you have**. Together those give you operation entirely in-house. Either one alone does not.

## What these results do not support

For the sake of honesty, because otherwise the findings will be asked to carry more than they can:

- **One run per model** at \`temperature = 0.2\`. For statements about program coverage and degeneration loops, a random component cannot be excluded. The load tests were repeated; the program runs were not.
- **Assessment by a language model**, against the source code, with spot re-checks — but without full validation by a human COBOL expert. It cannot be excluded that the reviewer makes errors of the same kind as the models under review.
- **No inter-rater reliability.** The three reviewers worked on disjoint subsets; there is no measure of agreement between them. Hallucination counts are therefore comparable *within* a row, not across rows.
- **One prompt, one domain, one legacy system.** The results hold for this task. *Producing* code rather than describing it was not tested.
- **Quantisation effects not isolated.** All models ran in Q4_K_M. Whether individual candidates lose disproportionately under quantisation is open.

## Conclusion: check the prompt before the model

The obvious reading is: three candidates failed, the baseline stays, nothing to do. The more useful reading is different. Of the actions that follow from this study, the only one with immediate value is **on the prompt side** — remove the fictional example or mark it unmistakably as fictional, name the target technology, explicitly require that absence be reported. That change works regardless of which model runs underneath.

So anyone evaluating a model switch should first establish how much of the observed quality problem actually comes from the model. Here, a substantial share of the hallucinations was reconstructable as filling in a supplied grid — the models do not report what they find, they report what the form expects.

One more observation that is not about the models. While preparing the underlying report, every external claim was re-verified against the primary source instead of being carried over from internal notes. That process corrected **five** claims previously treated as settled. Plausible, assertively phrased, unsupported statements are not a distinguishing feature of language models.`,
      faq: [
        {
          q: "Can a local LLM document COBOL code?",
          a: "Yes. A quantised 30-billion-class model running on a single NVIDIA DGX Spark produced structured maintenance documentation for eleven production COBOL programs — purpose, data flow, control flow per section, call graph and change risks, at input lengths up to 390,000 characters. The output is not error-free: even the best model invents content, but unlike the alternatives tested it flags uncertainty and reports the absence of a technology instead of inventing it. As input for maintenance developers that is workable; as an unsupervised source of documentation it is not.",
        },
        {
          q: "What hardware does a local LLM need?",
          a: "For 30-billion-class models at Q4 quantisation, a machine with around 128 GB of fast memory is enough; in this test that was an NVIDIA DGX Spark with a GB10 superchip and 273 GB/s of memory bandwidth. Compute is not the constraint — bandwidth is, because it limits how much model weight can be read per token. That dictates the model class: Mixture-of-Experts with few active parameters rather than dense models of the same total size.",
        },
        {
          q: "Are European LLMs suitable for on-premise deployment?",
          a: "That depends on the architecture, not on the origin. The five most frequently cited European open-weight models — Teuken-7B, EuroLLM-22B, ALIA-40b, Apertus-70B and Pharia-1-7B — are all dense; none is a Mixture-of-Experts model. On a machine with 273 GB/s of memory bandwidth the 7B models run very well, while the 40–70B models deliver single-digit to marginal token rates. In the 30B capability class, Soofi S is now a European MoE model that fits technically but still requires approval to download. What decides data sovereignty is Apache-2.0 weights plus an architecture that fits the bandwidth you have.",
        },
        {
          q: "Why are tokens per second a poor measure of LLM throughput?",
          a: "Because tokens that never reach the user are counted. A reasoning model whose thinking channel could not be switched off produced 58.8 % of its tokens in a separate field, which made it look like the fastest model in the field while being the slowest by usable text. A degeneration loop also improves the tok/s figure. Only usable text per second is workable, and only alongside a quality review.",
        },
        {
          q: "How do I detect prompt-induced hallucinations?",
          a: "Run a grep across all model outputs for the symbol names that appear as examples in your own prompt. If they show up in the results, the model is reporting your example as a finding. In this study that applied to 10 of 12 reports from Nemotron-3-Nano, while the baseline adopted the example in not a single file.",
        },
        {
          q: "Do MoE models with the same active parameter count deliver the same performance?",
          a: "No — that could not be confirmed. Four models with roughly 3 billion active parameters differed by a factor of 2.6 in usable text per second. Active parameter count tells you something about memory-bandwidth load per token, but nothing about output discipline, reasoning overhead or the tendency to degenerate.",
        },
        {
          q: "How much does memory bandwidth matter for local LLM inference?",
          a: "On bandwidth-bound hardware — 273 GB/s in this test — throughput is not determined by compute but by the weight volume read from memory per token. That dictates the model class: Mixture-of-Experts with few active parameters rather than dense models of comparable total size.",
        },
        {
          q: "How can I check whether a model runs on my stack before downloading it?",
          a: "With an HTTP range request for the first 4 KB of the GGUF file. That contains the magic bytes, the version and, as the first key, the architecture identifier, which you compare against your runtime's architecture list. 4 KB instead of 20 GB. Caveat: the header states what the model is executed as, not necessarily what the vendor built.",
        },
        {
          q: "What should I watch for in open model licences?",
          a: "Verify per model and per version. Two prominent models sit under a modified MIT licence with a revenue cap of USD 20 million per month, which effectively rules them out for banks and insurers. Another community licence excludes the EU verbatim. And a nominally open model can be effectively closed — manual gating and a license field reading closed-beta.",
        },
      ],
      sources: [
        {
          title: "Qwen3.6-35B-A3B — model card (Hugging Face)",
          url: "https://huggingface.co/Qwen/Qwen3.6-35B-A3B",
        },
        {
          title: "GLM-4.7-Flash — model card (Hugging Face)",
          url: "https://huggingface.co/zai-org/GLM-4.7-Flash",
        },
        {
          title: "North-Mini-Code-1.0 — model card (Cohere Labs)",
          url: "https://huggingface.co/CohereLabs/North-Mini-Code-1.0",
        },
        {
          title: "NVIDIA-Nemotron-3-Nano-30B-A3B — model card",
          url: "https://huggingface.co/nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B-BF16",
        },
        {
          title: "StorageReview: NVIDIA DGX Spark review (273 GB/s memory bandwidth)",
          url: "https://www.storagereview.com/review/nvidia-dgx-spark-review-the-ai-appliance-bringing-datacenter-capabilities-to-desktops",
        },
        {
          title: "Independent throughput benchmark: Nemotron 3 Nano on DGX Spark",
          url: "https://medium.com/@kocyigityasar/nvidia-dgx-spark-nemotron-3-nano-30b-1m-context-window-benchmark-57b4d0809991",
        },
        {
          title: "vLLM issue #43906 — MXFP8 MoE falls back to MARLIN on SM_121",
          url: "https://github.com/vllm-project/vllm/issues/43906",
        },
        {
          title: "Apertus-70B-Instruct (swiss-ai) — model card, Apache 2.0, dense",
          url: "https://huggingface.co/swiss-ai/Apertus-70B-Instruct-2509",
        },
        {
          title: "ALIA-40b (Barcelona Supercomputing Center) — model card",
          url: "https://huggingface.co/BSC-LT/ALIA-40b",
        },
        {
          title: "EuroLLM-22B-Instruct (utter-project) — model card",
          url: "https://huggingface.co/utter-project/EuroLLM-22B-Instruct-2512",
        },
        {
          title: "Teuken-7B-instruct-commercial (openGPT-X) — model card",
          url: "https://huggingface.co/openGPT-X/Teuken-7B-instruct-commercial-v0.4",
        },
        {
          title: "Soofi-S-Base (SOOFI consortium) — model card, gated: manual",
          url: "https://huggingface.co/Soofi-Project/Soofi-S-Base",
        },
        {
          title: "Laguna-XS-2.1 (poolside) — model card, SWE-bench Verified 70.9 %",
          url: "https://huggingface.co/poolside/Laguna-XS-2.1",
        },
        {
          title: "Devstral 2 — licence text with revenue cap",
          url: "https://mistral.ai/news/devstral-2-vibe-cli/",
        },
        {
          title: "Tencent Hunyuan Community License (excludes EU/UK/South Korea)",
          url: "https://github.com/Tencent-Hunyuan/Hunyuan-MT/blob/main/License.txt",
        },
      ],
    },
  },
];

/** Posts that are actually published, newest first. */
export function getAllPosts() {
  return posts
    .filter((post) => !post.draft)
    .slice()
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
}

export function getPostBySlug(slug) {
  return getAllPosts().find((post) => post.slug === slug) || null;
}

/**
 * Flattens a post into a single language for rendering.
 * Returns null when the requested language block is missing.
 */
export function localizePost(post, lang) {
  if (!post) return null;
  const block = post[lang];
  if (!block) return null;
  return {
    slug: post.slug,
    lang,
    date: post.date,
    updated: post.updated || post.date,
    author: post.author || "Michael Schiffer",
    // Localizable: articleSection is rendered as the kicker inside the images,
    // and tags are the keyword set — both differ per language.
    articleSection: block.articleSection || post.articleSection || "AI Engineering",
    tags: block.tags || post.tags || [],
    // Images carry the title and the URL in the given language, so every
    // language gets its own rendered set under public/blog/<slug>/<lang>/.
    coverImage: post.coverImage || `/blog/${post.slug}/${lang}/cover-1600x900.jpg`,
    ogImage: post.ogImage || `/blog/${post.slug}/${lang}/og-1200x627.png`,
    coverAlt: block.coverAlt || block.title,
    title: block.title,
    excerpt: block.excerpt,
    bodyMarkdown: block.bodyMarkdown,
    faq: block.faq || [],
    sources: block.sources || [],
  };
}

/** All published posts localized to `lang`, newest first. */
export function getPostsForLang(lang) {
  return getAllPosts()
    .map((post) => localizePost(post, lang))
    .filter(Boolean);
}

export function getLocalizedPost(slug, lang) {
  return localizePost(getPostBySlug(slug), lang);
}
