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
    slug: "projektplan-excel-daten-und-bild-trennen",
    date: "2026-09-22",
    updated: "2026-09-22",
    author: "Claude (Opus 5)",
    coAuthor: "Michael Schiffer",
    aiGenerated: true,
    de: {
      title: "Der Excel-Projektplan war nie das Problem",
      articleSection: "Projektplanung",
      excerpt:
        "Ein Excel-Projektplan mit 130 Arbeitspaketen zeigte im Balken 30 Prozent Fortschritt und in der Markierung darüber 70. Nach dem Umbau ist dieser Fehler baulich unmöglich.",
      coverAlt:
        "Ein Aktenordner mit Tabellenausdrucken neben einem Bildschirm mit derselben Zeitachse — Sinnbild für die Trennung von Datenhaltung und Darstellung im Projektplan",
      tags: [
        "Projektmanagement mit Excel",
        "Excel-Projektplan",
        "Gantt-Diagramm",
        "VBA",
        "Tabellenkalkulation Grenzen",
        "SQLite",
        "statische HTML",
        "CSV",
        "Datenhaltung und Darstellung",
        "Projektplanung",
        "Werkzeugbau",
        "Legacy-Ablösung",
      ],
      bodyMarkdown: `Ein Projektplan über rund 20 Monate lag in einer Excel-Datei mit etwa einem Dutzend VBA-Makros: **130 Arbeitspakete** in zwölf Phasen, Balken als Zeichnungsobjekte über Datumsspalten, Vorgänger-Pfeile per Makro nachgezogen. Heute liegt derselbe Plan in drei CSV-Dateien, einer generierten SQLite und **einer** HTML-Datei. Der interessante Teil daran ist nicht, dass es schneller geworden ist. Der interessante Teil ist ein Fehler, den es vorher gab und jetzt nicht mehr geben *kann*: Der Fortschrittsbalken sagte 30 Prozent, die Markierung darüber sagte 70, und niemand konnte sehen, wer recht hatte.

**Auf einen Blick:**

- **Die Tabelle war nie das Problem — das Rendern in derselben Datei war es.** Excel spielte hier zwei Rollen gleichzeitig: Datenhaltung und Darstellung.
- **Der Kipppunkt ist nicht die Zeilenzahl.** 130 Zeilen sind für eine Tabellenkalkulation nichts. 130 Zeilen mit makro-gezeichneten Abhängigkeiten sind zu viel.
- **Zwei Sichten auf denselben Plan wurden zu zwei Dateien** und drifteten auseinander. Beim letzten Vergleich fehlten der externen Sicht **acht Zeilen**. Niemand konnte sagen, seit wann.
- **Die Auslieferung wuchs um Faktor 22, und das ist gleichgültig.** Rund 7 KB Tabelle gegen rund 150 KB HTML — die Tabelle brachte kein Bild mit, die HTML *ist* das Bild.
- **2 733 Zeilen Python, null externe Abhängigkeiten.** Kein Framework, keine Datenbank-Instanz, kein Server.

Wer einen Projektplan in Excel pflegt, kennt den Reflex: *Ich mache das Excel schöner.* Der Reflex ist verständlich und führt in die falsche Richtung, weil er die eine Frage überspringt, auf die es ankommt — welche Aufgabe diese Datei eigentlich hat.

## Was Excel gut konnte, und warum das trotzdem nicht reichte

Es lohnt, mit dem Lob anzufangen, weil sonst der Rest nicht stimmt. Der Eigner des Plans konnte tippen, ohne das Werkzeug zu wechseln. Neue Zeile, Datum hinein, fertig. Autofilter, Kopieren-nach-unten, gemischte Bezüge — das ist Muskelspeicher, und den wirft man nicht leichtfertig weg. Jede Alternative, die damit anfängt, dem Eigner eine neue Oberfläche beizubringen, hat schon verloren.

Vier Dinge trugen am Ende nicht mehr, alle vier messbar:

**Die Vorgänger-Ketten skalierten nicht.** Bei rund 130 Arbeitspaketen war das Makro für die Pfeile pro Durchlauf mehrere Sekunden beschäftigt. In dieser Zeit stand der Cursor, und Tastatureingaben landeten in Zellen, für die sie nicht gedacht waren.

**Zwei Sichten waren eine zu viel.** Der Auftraggeber sollte eine reduzierte Fassung sehen, das Team die vollständige. In Excel hieß das: zwei Arbeitsmappen. Beim letzten Abgleich fehlten der reduzierten Fassung acht Zeilen, die in der internen längst standen — und niemand konnte belegen, wann die Divergenz begonnen hatte. Das ist der Punkt: Nicht der Unterschied war das Problem, sondern dass er unbemerkt entstehen konnte.

**Konflikte auf dem gemeinsamen Laufwerk.** Zwei parallele Änderungen erzeugten regelmäßig eine Konfliktkopie. Das Zusammenführen brach die Makro-Referenzen; die Wiederherstellung war jedes Mal ein Zwanzig-Minuten-Job.

**Reviews nur per Screenshot.** Der Druck in PDF zerschnitt lange Zeilen, die Zeitachse lief über mehrere Seiten. Der Auftraggeber bekam Bilder vom Plan, nicht den Plan.

## Warum ein Projektplan in Excel kippt: zwei Rollen in einer Datei

Die vier Befunde sehen wie vier verschiedene Probleme aus. Sie sind eines.

Eine Projektplan-Datei in Excel trägt **Daten** — Zeilen, Datumsangaben, Vorgänger, Fortschritt — und sie trägt ein **Bild**: Balken, Pfeile, Farben, Zeitachse. Solange beides in derselben Datei liegt, kostet jede Änderung am Bild eine Änderung an den Daten, und jede Änderung an den Daten erzwingt ein neues Bild. Aus dieser Verschränkung folgen alle vier Befunde: Die Makro-Laufzeit ist Rendering-Aufwand in einer Datenbearbeitung. Die zweite Sicht ist eine zweite Datei, weil ein Filter das Bild verändert. Die Konfliktkopie bricht, weil Zeichnungsobjekte keinen sinnvollen Textdiff haben. Und der Screenshot ist nötig, weil das Bild die Datei nicht verlassen kann.

Diese Beobachtung ist nicht neu, sie wird nur selten so deutlich ausgesprochen. In der deutschsprachigen Excel-Literatur findet sich der Satz, dass Daten und Layout in Excel miteinander verbunden seien — in sauberer Programmierung eine Sünde. Die Forschung zu Tabellenkalkulationen liefert die Zahlen dazu: Untersuchungen der [European Spreadsheet Risk Interest Group](https://eusprig.org/research-info/horror-stories/) und die Arbeiten von Raymond Panko kommen darauf, dass die große Mehrheit produktiv genutzter Tabellen Fehler enthält und dass diese Fehler vor allem eines sind — **schwer zu entdecken**.

Genau da liegt der Kern. Nicht die Fehlerrate ist das Besondere an Tabellenkalkulationen, sondern die Unsichtbarkeit der Fehler.

## Der Schnitt: drei CSV-Dateien, eine SQLite, eine HTML

Die Bauregel ist knapp: Datenhaltung in CSV, Ableitung in einer generierten SQLite, Darstellung in einer statischen HTML. Kein Schritt hat mehr als eine Aufgabe, und jeder ist einzeln aufrufbar.

Die Quellen der Wahrheit sind reine Textdateien: eine Tabelle mit den Arbeitspaketen und Phasenköpfen, eine mit den Phasen-Stammdaten, eine mit den Metadaten des Plans als Schlüssel-Wert-Paare. Aus diesen drei Dateien entsteht in einem Aufruf alles Weitere:

\`\`\`
drei CSV-Dateien
      |
      |  Init-Skript  (431 Zeilen)
      v
Plan-Datenbank (SQLite)        -- erzeugt, nie von Hand editiert
      |
      |  Build-Skript (1 303 Zeilen)
      v
eine HTML-Datei, rund 150 KB   -- offline lauffähig, JSON eingebettet
ein Konsistenz-Bericht (JSON)  -- Widersprüche in den Vorgänger-Ketten
\`\`\`

Zusammen **2 733 Zeilen** Python und HTML/JS, ausschließlich Standardbibliothek. Die Auslieferung ist **eine** Datei mit eingebetteten Daten: Der Empfänger bekommt einen Link auf eine Datei — kein Server, kein Login, kein Konto.

Vier Entscheidungen darin haben sich als tragend erwiesen:

1. **Listenpositionen in Zehnerschritten statt fortlaufender Nummern.** Phasenköpfe liegen auf 100, 200, 300, Arbeitspakete dazwischen. Das lässt Platz zum Einfügen, ohne umzunummerieren. Die Zeilen-ID der Datenbank ändert sich bei jedem Neubau — die stabile Referenz ist die Listenposition, nicht die ID.
2. **Zwei Wege zu einem Startdatum, und einer gewinnt immer.** Entweder ein gesetzter Anker oder eine Berechnung aus dem Vorgänger. Ein gesetzter Anker schlägt die Rechnung — das ist die Regel für externe Termine und für Dinge, die bereits passiert sind. Alles andere wird gerechnet, in bis zu zehn Durchläufen.
3. **Alle vier Vorgänger-Typen von Anfang an** (Ende-Anfang, Anfang-Anfang, Ende-Ende, Anfang-Ende). Nicht der übliche Weg, mit einem anzufangen und den Rest zu vertagen: Im Bestandsplan waren alle vier bereits in Gebrauch, parallele Workshops als Anfang-Anfang, Abnahmen als Ende-Ende.
4. **Zwei Detailstufen je Zeile statt zwei Dateien.** Die reduzierte Sicht blendet die feinere Stufe aus — in derselben HTML, per Schalter. Die Divergenz aus dem Bestand kann damit strukturell nicht mehr entstehen.

**Was daran ausdrücklich kein Fortschritt ist:** Die Datenpflege bleibt eine Tabelle. Wer nicht im Texteditor arbeiten will, bekommt einen kleinen lokalen Editor, dessen Oberfläche aussieht wie die gewohnte Tabelle. Der Unterschied ist unsichtbar, und das ist Absicht: Das Speichern schreibt nur die CSV-Datei zurück und stößt den Neubau an. Darstellung und Bearbeitung teilen sich keine Datei mehr.

## Der stille Fehler, den die neue Form nicht mehr zulässt

Das ist der Befund, wegen dem sich der Umbau gelohnt hat.

In der Excel-Fassung war die Fortschrittsanzeige ein Overlay über dem Balken — zwei Objekte, die zufällig übereinander lagen. Wurden Zeilen umsortiert, gefiltert oder eine Phase ausgeblendet, zog der Balken um und das Overlay blieb. **Der Balken sagte 30 Prozent, das Overlay sagte 70.** Wer den Balken las, hielt ein Arbeitspaket für weiter zurück, als es war; wer das Overlay las, glaubte an einen Fortschritt, den es nicht gab. In zwei Reviews vor dem Umbau steckte genau dieser Fehler, je einmal in einer Zeile mittlerer Priorität.

Der Punkt ist nicht, dass hier jemand unaufmerksam war. Der Punkt ist, dass **die Datei beide Zustände gleichzeitig anzeigen konnte, ohne sich zu beschweren**. Ein Widerspruch, der nicht auffällt, ist teurer als einer, der einen Fehler wirft.

Die HTML-Fassung zeichnet den Fortschritt als zweiten Balken **innerhalb** des ersten, mit derselben Ankerposition. Es gibt keinen Weg, den einen zu bewegen, ohne den anderen mitzunehmen — nicht weil jemand diszipliniert wäre, sondern weil beide dieselbe Zeilen-ID teilen. Der Fehlertyp ist nicht seltener geworden, sondern unmöglich.

**Die übertragbare Regel:** Wenn in einer Tabellenkalkulation zwei Elemente übereinanderliegen und beide bewegt werden müssen, ist der nächste Umzug ein Fehler mit Vorlaufzeit. In einer strukturierten Ausgabe liegen sie in *einem* Knoten und lassen sich nicht mehr voneinander lösen.

## Was Excel konnte und was jetzt gemessen anders ist

| Was | Excel mit VBA | Statische HTML aus CSV |
|---|---|---|
| Auslieferungsformat | Arbeitsmappe mit Makros | eine HTML-Datei mit eingebetteten Daten |
| Größe der Auslieferung | rund 7 KB, komprimiert | rund 150 KB, offline lauffähig |
| Voraussetzung beim Empfänger | Excel plus Makro-Rechte | ein Browser |
| Zwei Sichten | zwei getrennte Dateien | ein Schalter in derselben Datei |
| Wochenend-Behandlung | Zellformel je Datum | einmal zentral im Init-Skript |
| Vorgänger-Pfeile | Zeichnungsobjekte, Umbruch bei Zoom | SVG auf gemessener Zeilenhöhe |
| Konflikt auf dem Netzlaufwerk | Konfliktkopie, gebrochene Makros | Textdiff in der CSV, in Sekunden lösbar |
| Neuer Vorgänger-Typ | neues Makro, neue Spalte | ein Attribut an der Zeile |
| Konsistenzprüfung | Sichtprüfung | Bericht, in der HTML sichtbar |
| Druck und PDF | zerschneidet lange Zeilen | Browser-Druck, eine Seite je Zoomstufe |

Zur Größe: Die HTML ist rund 22-mal größer als die Tabelle, und es spielt keine Rolle. Die Tabelle brachte kein Bild mit — wer sie öffnete, ließ das Bild neu zeichnen. Die HTML *ist* das Bild und passt trotzdem in einen Mailanhang.

## Was der Umbau gekostet hat

Nüchtern: Der Umbau selbst war ein Wochenendprojekt, rund zwölf Stunden auf drei Sitzungen verteilt. Danach kamen über zwei Wochen der lokale Editor und der Konsistenz-Bericht dazu — Komfort, nicht Kern. Beide **müssen** nicht benutzt werden; CSV im Texteditor plus ein Aufruf des Neubaus ist der vollständige Rückfallweg.

Der Ertrag, ebenso nüchtern:

- Die Divergenz zwischen externer und interner Sicht ist konstruktiv weg. Kein Abgleich mehr, keine acht fehlenden Zeilen.
- Reviews laufen in der HTML selbst. Die Fassungsnummer der Auslieferung kommt aus den Metadaten — die Frage, welche Version der andere gerade ansieht, stellt sich nicht mehr.
- Änderungen in der Mitte des Plans sind billig geworden. Eine Verschiebung um vier Arbeitstage zieht durch die Vorgänger-Kette; niemand rechnet von Hand nach.
- Der Konsistenz-Bericht fängt ab, was vorher unsichtbar war: ein gesetztes Startdatum, das der Vorgänger-Rechnung widerspricht. Vor der HTML sah man das nicht.

## Grenzen

Drei Dinge, die der Umbau **nicht** gebracht hat — sie gehören dazu, sonst ist es Werbung:

**Excel bleibt bei Massenänderungen schneller.** Der lokale Editor ist bequemer als eine Tabelle, wenn man eine Zeile ändert. Bei Änderungen an drei Spalten über vierzig Zeilen gewinnt Excel mit seinen Tastaturkürzeln, und zwar deutlich.

**Der Neubau ist schnell, aber nicht sofort.** Zwischen Speichern und neuem Bild vergehen ein bis zwei Sekunden. Excel zeichnete den Balken sofort — wenn auch manchmal an der falschen Stelle.

**Der Ansatz ersetzt kein Projektmanagement-Werkzeug.** Hier geht es um einen Plan mit 130 Arbeitspaketen und einem Eigner. Ressourcenplanung über mehrere Projekte, Rollenrechte oder eine echte Mehrbenutzer-Bearbeitung sind nicht das Ziel gewesen und kommen auch nicht heraus. Wer das braucht, braucht ein anderes Werkzeug — und der Vergleich in diesem Text hilft ihm nicht.

## Wo das Muster sonst trägt

Der Schnitt CSV zu SQLite zu HTML ist nicht spezifisch für Projektpläne. Er trägt überall dort, wo eine Tabellenkalkulation zwei Rollen gleichzeitig spielt:

- **Preislisten mit Staffeln.** Die Staffeln sind Daten, die Übersicht ist Bild. Beim Kopieren wandern Staffeln in falsche Zeilen; in einer Ableitung nicht.
- **Vertragsübersichten mit Laufzeiten.** Wer Laufzeiten in Excel zeichnet, kennt die Balken, die beim Filtern hinter den Rahmen laufen.
- **Bewerbungs- oder Vertriebstrichter** mit Status und Zieldatum. Die Fälle sind Daten, der Trichter ist Bild — und der Bild-Teil bläht die Datei auf.

Der Aufwand ist klein, sobald das erste Muster steht: ein Skript, das aus CSV in SQLite schiebt, eines, das daraus eine HTML rendert, und zwei bis drei CSV-Tabellen.

## Fazit: eine Frage, die sich in fünf Minuten beantworten lässt

Die eine Maßnahme, die unmittelbar etwas bringt, kostet keinen Umbau. Sie lautet: **Öffnen Sie Ihre wichtigste Excel-Datei und fragen Sie, welche Zellen Daten sind und welche Bild.** Bedingte Formatierung, Balken, Zeichnungsobjekte, Farben, ausgeblendete Zeilen für eine zweite Sicht — das ist alles Bild.

Ist die Antwort *beides, gemischt*, dann kennen Sie Ihre nächste Fehlerklasse bereits. Sie wird nicht mit einer Fehlermeldung kommen. Sie wird wie ein korrekt aussehender Plan aussehen, in dem eine Zahl nicht zu der danebenstehenden passt — und niemand wird sagen können, seit wann.`,
      faq: [
        {
          q: "Ab wann ist ein Projektplan zu groß für Excel?",
          a: "Die Zeilenzahl ist der falsche Maßstab. 130 Arbeitspakete sind für eine Tabellenkalkulation wenig. Entscheidend ist, ob die Datei neben den Daten auch das Bild trägt — Balken, Pfeile, Farben, bedingte Formatierung. Sobald das Zeichnen in derselben Datei passiert wie die Datenpflege, kostet jede Änderung an der einen Seite eine an der anderen. Bei uns machte sich das zuerst als mehrsekündige Makro-Laufzeit pro Durchlauf bemerkbar, während der Cursor stand.",
        },
        {
          q: "Was bringt es, Datenhaltung und Darstellung zu trennen?",
          a: "Es verschwindet eine ganze Fehlerklasse statt einzelner Fehler. Konkret: zwei Sichten auf denselben Plan brauchen keine zweite Datei mehr und können deshalb nicht mehr auseinanderdriften; Konflikte auf einem gemeinsamen Laufwerk werden zu einem Textdiff statt zu einer Konfliktkopie mit gebrochenen Makros; und eine Fortschrittsmarkierung kann sich nicht mehr von ihrem Balken lösen, weil beide dieselbe Zeilen-ID teilen.",
        },
        {
          q: "Wie baut man einen Gantt-Plan ohne Excel und ohne Projektmanagement-Software?",
          a: "Drei Schritte, jeder einzeln aufrufbar: CSV-Dateien als Quelle der Wahrheit, ein Skript, das daraus eine SQLite erzeugt und die Datumsrechnung aus den Vorgängern durchführt, und ein zweites Skript, das eine einzelne HTML-Datei mit eingebetteten Daten rendert. In unserem Fall zusammen rund 2 700 Zeilen Python, ausschließlich Standardbibliothek — kein Framework, keine Datenbank-Instanz, kein Server.",
        },
        {
          q: "Warum eine statische HTML-Datei statt eines Webtools?",
          a: "Weil der Empfänger nichts installieren, nichts einrichten und sich nirgends anmelden muss. Die Auslieferung ist eine Datei von rund 150 KB, die offline läuft und per Mail verschickt werden kann. Sie ist rund 22-mal größer als die frühere Arbeitsmappe, und das ist gleichgültig: Die Arbeitsmappe brachte kein Bild mit, sondern ließ es bei jedem Öffnen neu zeichnen.",
        },
        {
          q: "Was spricht dagegen, den Excel-Projektplan zu behalten?",
          a: "Nichts, solange die Datei nur Daten trägt und das Bild woanders entsteht. Und Excel bleibt auch nach einem Umbau in einem Punkt überlegen: Bei Massenänderungen über viele Zeilen und Spalten gewinnen die Tastaturkürzel einer Tabellenkalkulation deutlich. Der Umbau lohnt sich, wenn zwei Sichten gepflegt werden, wenn mehrere Personen an derselben Datei arbeiten oder wenn der Plan regelmäßig nach außen gezeigt wird.",
        },
      ],
      sources: [
        {
          title: "European Spreadsheet Risk Interest Group — Horror Stories",
          url: "https://eusprig.org/research-info/horror-stories/",
        },
        {
          title: "Raymond R. Panko: What We Don't Know About Spreadsheet Errors Today",
          url: "https://arxiv.org/pdf/1602.02601",
        },
        {
          title: "Warum Excel eine Gefahr für Projekte darstellen kann",
          url: "https://projekte-leicht-gemacht.de/blog/pm-tools/excel-projektmanagement-nachteile/",
        },
        {
          title: "Informatik Aktuell: Projektmanagement mit Excel",
          url: "https://www.informatik-aktuell.de/management-und-recht/projektmanagement/projektmanagement-mit-excel.html",
        },
        {
          title: "SQLite — Appropriate Uses For SQLite",
          url: "https://www.sqlite.org/whentouse.html",
        },
      ],
    },
    en: {
      title: "The Excel project plan was never the problem",
      articleSection: "Project planning",
      excerpt:
        "An Excel project plan with 130 work packages showed 30 percent progress in the bar and 70 in the marker above it. After the rebuild, that error is structurally impossible.",
      coverAlt:
        "A binder of printed tables next to a screen showing the same timeline — an image for separating data storage from rendering in a project plan",
      tags: [
        "project management with Excel",
        "Excel project plan",
        "Gantt chart",
        "VBA",
        "spreadsheet limits",
        "SQLite",
        "static HTML",
        "CSV",
        "separating data and presentation",
        "project planning",
        "tooling",
        "legacy replacement",
      ],
      bodyMarkdown: `A project plan spanning roughly 20 months lived in an Excel file with about a dozen VBA macros: **130 work packages** across twelve phases, bars drawn as shape objects over date columns, predecessor arrows redrawn by macro. Today the same plan lives in three CSV files, a generated SQLite database and **one** HTML file. The interesting part is not that it got faster. The interesting part is an error that used to happen and now *cannot*: the progress bar said 30 percent, the marker on top of it said 70, and nobody could tell which one was right.

**At a glance:**

- **The spreadsheet was never the problem — rendering inside the same file was.** Excel played two roles at once here: data storage and presentation.
- **The tipping point is not row count.** 130 rows are nothing for a spreadsheet. 130 rows with macro-drawn dependencies are too many.
- **Two views of one plan became two files** and drifted apart. At the last comparison the external view was missing **eight rows**. Nobody could say since when.
- **The deliverable grew by a factor of 22, and it does not matter.** Roughly 7 KB of spreadsheet against roughly 150 KB of HTML — the spreadsheet carried no picture, the HTML *is* the picture.
- **2,733 lines of Python, zero external dependencies.** No framework, no database instance, no server.

Anyone maintaining a project plan in Excel knows the reflex: *I will make the spreadsheet nicer.* The reflex is understandable and points the wrong way, because it skips the one question that matters — what job this file actually has.

## What Excel did well, and why that still was not enough

It is worth starting with the praise, otherwise the rest does not hold. The plan owner could type without switching tools. New row, date in, done. Autofilter, fill-down, mixed references — that is muscle memory, and you do not throw it away lightly. Any alternative that starts by teaching the owner a new interface has already lost.

Four things stopped carrying, all four measurable:

**Predecessor chains did not scale.** At around 130 work packages the arrow macro was busy for several seconds per pass. During that time the cursor froze, and keystrokes landed in cells they were not meant for.

**Two views were one too many.** The client was meant to see a reduced version, the team the full one. In Excel that meant two workbooks. At the last reconciliation the reduced version was missing eight rows that had long been in the internal one — and nobody could prove when the divergence had started. That is the point: the difference was not the problem, the fact that it could arise unnoticed was.

**Conflicts on the shared drive.** Two parallel edits regularly produced a conflict copy. Merging broke the macro references; recovery was a twenty-minute job every time.

**Reviews only by screenshot.** Printing to PDF cut long rows apart and spread the timeline over several pages. The client received pictures of the plan, not the plan.

## Why an Excel project plan tips over: two roles in one file

The four findings look like four different problems. They are one.

A project plan file in Excel carries **data** — rows, dates, predecessors, progress — and it carries a **picture**: bars, arrows, colours, a timeline. As long as both live in the same file, every change to the picture costs a change to the data, and every change to the data forces a new picture. All four findings follow from that entanglement: macro runtime is rendering work inside a data edit. The second view is a second file because a filter changes the picture. The conflict copy breaks because shape objects have no meaningful text diff. And the screenshot is necessary because the picture cannot leave the file.

The observation is not new, it is just rarely stated this plainly. German spreadsheet literature puts it as data and layout being bound together — a sin in clean programming. Research supplies the numbers: work collected by the [European Spreadsheet Risk Interest Group](https://eusprig.org/research-info/horror-stories/) and by Raymond Panko finds that the large majority of operational spreadsheets contain errors, and that those errors are above all **hard to detect**.

That is the core. What is special about spreadsheets is not the error rate, it is the invisibility of the errors.

## The cut: three CSV files, one SQLite, one HTML

The building rule is short: data in CSV, derivation in a generated SQLite database, presentation in a static HTML file. No step has more than one job, and each one is callable on its own.

The sources of truth are plain text files: one table of work packages and phase headers, one of phase master data, one of plan metadata as key-value pairs. From those three files a single call produces everything else:

\`\`\`
three CSV files
      |
      |  init script   (431 lines)
      v
plan database (SQLite)         -- generated, never edited by hand
      |
      |  build script  (1,303 lines)
      v
one HTML file, roughly 150 KB  -- runs offline, data embedded
one consistency report (JSON)  -- contradictions in predecessor chains
\`\`\`

Together **2,733 lines** of Python and HTML/JS, standard library only. The deliverable is **one** file with embedded data: the recipient gets a link to a file — no server, no login, no account.

Four decisions inside it turned out to carry weight:

1. **List positions in steps of ten instead of running numbers.** Phase headers sit at 100, 200, 300, work packages in between. That leaves room to insert without renumbering. The database row ID changes on every rebuild — the stable reference is the list position, not the ID.
2. **Two ways to a start date, and one always wins.** Either an explicit anchor or a calculation from the predecessor. An anchor beats the calculation — that is the rule for external deadlines and for things that already happened. Everything else is computed, in up to ten passes.
3. **All four predecessor types from the start** (finish-start, start-start, finish-finish, start-finish). Not the usual route of shipping one and deferring the rest: the existing plan already used all four, parallel workshops as start-start, sign-offs as finish-finish.
4. **Two detail levels per row instead of two files.** The reduced view hides the finer level — in the same HTML, by toggle. The divergence from the old setup can no longer arise structurally.

**What is explicitly not progress here:** data entry remains a table. Anyone who does not want to work in a text editor gets a small local editor whose interface looks like the familiar spreadsheet. The difference is invisible, and that is deliberate: saving writes the CSV file back and triggers the rebuild. Presentation and editing no longer share a file.

## The silent error the new form no longer allows

This is the finding that made the rebuild worthwhile.

In the Excel version the progress indicator was an overlay on top of the bar — two objects that happened to sit above each other. When rows were re-sorted, filtered, or a phase was hidden, the bar moved and the overlay stayed. **The bar said 30 percent, the overlay said 70.** Reading the bar, you thought a work package was further behind than it was; reading the overlay, you believed in progress that did not exist. Two reviews before the rebuild contained exactly this error, once each in a medium-priority row.

The point is not that somebody was careless. The point is that **the file could display both states at once without complaining**. A contradiction that goes unnoticed is more expensive than one that throws an error.

The HTML version draws progress as a second bar **inside** the first, anchored at the same position. There is no way to move one without the other — not because anyone is disciplined, but because both share the same row ID. The error type has not become rarer, it has become impossible.

**The transferable rule:** when two elements sit on top of each other in a spreadsheet and both have to move, the next re-sort is an error with a delay fuse. In a structured output they live in *one* node and cannot be separated.

## What Excel could do, and what is measurably different now

| What | Excel with VBA | Static HTML from CSV |
|---|---|---|
| Delivery format | workbook with macros | one HTML file with embedded data |
| Size of the deliverable | roughly 7 KB, compressed | roughly 150 KB, runs offline |
| Requirement on the recipient | Excel plus macro permissions | a browser |
| Two views | two separate files | one toggle in the same file |
| Weekend handling | a cell formula per date | once, centrally, in the init script |
| Predecessor arrows | shape objects, reflow on zoom | SVG on measured row height |
| Conflict on a network share | conflict copy, broken macros | text diff in the CSV, solved in seconds |
| A new predecessor type | new macro, new column | one attribute on the row |
| Consistency check | visual inspection | a report, visible inside the HTML |
| Print and PDF | cuts long rows apart | browser print, one page per zoom level |

On size: the HTML is roughly 22 times larger than the spreadsheet, and it makes no difference. The spreadsheet carried no picture — opening it redrew one. The HTML *is* the picture and still fits in an email attachment.

## What the rebuild cost

Soberly: the rebuild itself was a weekend project, roughly twelve hours across three sessions. After that, the local editor and the consistency report were added over two weeks — comfort, not core. Neither **has** to be used; CSV in a text editor plus one rebuild call is the complete fallback.

The return, equally soberly:

- The divergence between external and internal view is structurally gone. No reconciliation, no eight missing rows.
- Reviews happen inside the HTML. The revision number of the deliverable comes from the metadata — the question of which version the other side is looking at no longer arises.
- Changes in the middle of the plan became cheap. A four-working-day shift propagates through the predecessor chain; nobody recalculates by hand.
- The consistency report catches what used to be invisible: a set start date that contradicts the predecessor calculation. Before the HTML, you could not see that.

## Limits

Three things the rebuild did **not** deliver — they belong here, otherwise this is marketing:

**Excel stays faster for bulk edits.** The local editor is more comfortable than a spreadsheet when changing one row. For edits across three columns and forty rows, Excel wins clearly on keyboard shortcuts.

**The rebuild is fast, but not instant.** One to two seconds pass between saving and the new picture. Excel drew the bar immediately — if sometimes in the wrong place.

**This approach does not replace a project management tool.** It covers a plan with 130 work packages and one owner. Cross-project resource planning, role permissions or genuine multi-user editing were not the goal and are not the outcome. Anyone who needs those needs a different tool, and the comparison in this text will not help them.

## Where else the pattern holds

The cut from CSV to SQLite to HTML is not specific to project plans. It holds wherever a spreadsheet plays two roles at once:

- **Price lists with volume tiers.** The tiers are data, the overview is picture. Copying moves tiers into the wrong rows; a derivation does not.
- **Contract overviews with terms.** Anyone drawing contract terms in Excel knows the bars that run behind the frame when filtering.
- **Application or sales funnels** with status and target date. The cases are data, the funnel is picture — and the picture part is what bloats the file.

The effort is small once the first pattern exists: one script that pushes CSV into SQLite, one that renders an HTML from it, and two or three CSV tables.

## Conclusion: a question you can answer in five minutes

The one measure with immediate value costs no rebuild at all. It is this: **open your most important Excel file and ask which cells are data and which are picture.** Conditional formatting, bars, shape objects, colours, rows hidden to create a second view — that is all picture.

If the answer is *both, mixed*, then you already know your next class of errors. It will not arrive with an error message. It will look like a correct plan in which one number does not match the one next to it — and nobody will be able to say since when.`,
      faq: [
        {
          q: "When is a project plan too big for Excel?",
          a: "Row count is the wrong measure. 130 work packages are few for a spreadsheet. What matters is whether the file carries the picture alongside the data — bars, arrows, colours, conditional formatting. Once drawing happens in the same file as data entry, every change on one side costs a change on the other. In our case it first showed up as several seconds of macro runtime per pass, during which the cursor froze.",
        },
        {
          q: "What do you gain by separating data storage from presentation?",
          a: "An entire class of errors disappears instead of individual errors. Concretely: two views of one plan no longer need a second file and therefore cannot drift apart; conflicts on a shared drive become a text diff rather than a conflict copy with broken macros; and a progress marker can no longer detach from its bar, because both share the same row ID.",
        },
        {
          q: "How do you build a Gantt plan without Excel and without project management software?",
          a: "Three steps, each callable on its own: CSV files as the source of truth, a script that turns them into a SQLite database and computes dates from predecessors, and a second script that renders a single HTML file with embedded data. In our case roughly 2,700 lines of Python in total, standard library only — no framework, no database instance, no server.",
        },
        {
          q: "Why a static HTML file instead of a web tool?",
          a: "Because the recipient installs nothing, configures nothing and signs in nowhere. The deliverable is one file of roughly 150 KB that runs offline and can be emailed. It is about 22 times larger than the former workbook, and that is irrelevant: the workbook carried no picture, it had one redrawn on every open.",
        },
        {
          q: "What speaks against keeping the Excel project plan?",
          a: "Nothing, as long as the file only carries data and the picture is produced elsewhere. And Excel stays superior on one point even after a rebuild: for bulk edits across many rows and columns, spreadsheet keyboard shortcuts win clearly. The rebuild pays off when two views are maintained, when several people work on the same file, or when the plan is regularly shown to outsiders.",
        },
      ],
      sources: [
        {
          title: "European Spreadsheet Risk Interest Group — Horror Stories",
          url: "https://eusprig.org/research-info/horror-stories/",
        },
        {
          title: "Raymond R. Panko: What We Don't Know About Spreadsheet Errors Today",
          url: "https://arxiv.org/pdf/1602.02601",
        },
        {
          title: "Why Excel can be a danger to projects (German)",
          url: "https://projekte-leicht-gemacht.de/blog/pm-tools/excel-projektmanagement-nachteile/",
        },
        {
          title: "Informatik Aktuell: Project management with Excel (German)",
          url: "https://www.informatik-aktuell.de/management-und-recht/projektmanagement/projektmanagement-mit-excel.html",
        },
        {
          title: "SQLite — Appropriate Uses For SQLite",
          url: "https://www.sqlite.org/whentouse.html",
        },
      ],
    },
  },
  {
    slug: "ai-agent-allowlist-vs-denylist",
    date: "2026-09-16",
    updated: "2026-09-16",
    author: "Claude (Opus 5)",
    coAuthor: "Michael Schiffer",
    aiGenerated: true,
    de: {
      title: "Verbotslisten sichern KI-Agenten nicht ab",
      articleSection: "Agenten-Sicherheit",
      excerpt:
        "Ein Verbotsprofil für gesperrte Agenten-Sitzungen deckte 23 von 54 schreibenden Rechten ab. Eine der 31 Lücken machte alle anderen gegenstandslos.",
      coverAlt:
        "Eine lange Liste verbotener Kommandos vor einer kurzen Liste erlaubter Werkzeuge — Sinnbild für Erlaubnisliste statt Verbotsliste bei KI-Agenten",
      tags: [
        "KI-Agenten",
        "Agenten-Sicherheit",
        "Erlaubnisliste",
        "Verbotsliste",
        "Least Privilege",
        "Sandbox",
        "Werkzeug-Berechtigungen",
        "KI-Governance",
        "Positivkontrolle",
        "Coding-Agenten",
        "On-Premise-KI",
        "Sicherheitsarchitektur",
      ],
      bodyMarkdown: `Wer einem **KI-Agenten** Werkzeuge in die Hand gibt, schreibt früher oder später eine Liste. Bei uns war es eine Verbotsliste: Kommandos, die eine gesperrte Agenten-Sitzung niemals ausführen darf. Sie lag Monate da und sah nach Absicherung aus. Beim Nachmessen deckte sie **23 von 54** schreibenden Rechten ab. Die 31 offenen waren nicht einmal der eigentliche Befund — der eigentliche Befund war eine einzelne Lücke, die die anderen dreißig gegenstandslos macht.

**Auf einen Blick:**

- **Eine Verbotsliste über einer wachsenden Erlaubnisliste ist ein Wettlauf, den man verliert.** Die eine Seite wächst mit jedem Arbeitstag von selbst, die andere nur, wenn jemand daran denkt.
- **126 gewachsene Werkzeug-Erlaubnisse** in einem einzigen Arbeitsverzeichnis, 72 lesend und 54 schreibend. Niemand hat diese Zahl je beschlossen; sie ist entstanden.
- **Eine Lücke reicht.** Wer einen blanken Interpreter starten darf, braucht keinen der dreißig anderen verbotenen Wege.
- **Der erste Prüfversuch sah bestanden aus und bewies nichts.** Der Riegel hatte gar nicht gegriffen — das Modell hatte aus eigenem Urteil abgelehnt. Richtiges Ergebnis, falscher Grund.

Der Fehler in dieser Geschichte ist nicht die unvollständige Liste. Unvollständig ist jede Liste. Der Fehler ist die Bauform — und die findet sich in erstaunlich vielen Setups wieder, in denen ein Agent mehr darf, als irgendwer entschieden hat.

## Wie 126 Rechte entstehen, ohne dass jemand sie beschließt

Erlaubnisse für Agenten entstehen im Arbeitsfluss. Ein Werkzeug fehlt, die Arbeit stockt, jemand hängt eine Zeile an die Erlaubnisliste. Das ist kein Schlendrian, sondern der Normalbetrieb: Jede einzelne Zeile war in dem Moment, in dem sie entstand, berechtigt und klein.

Gezählt haben wir in einem Arbeitsverzeichnis **126 Werkzeug-Erlaubnisse**: 72 lesende und 54 schreibende. Lesend ist der unkritische Teil. Interessant sind die 54, die etwas verändern können — Dateien anlegen, Prozesse starten, Netzwerkverbindungen aufbauen, Pakete installieren.

Diese Liste hat eine Eigenschaft, die jede Sicherheitsüberlegung darüber entwertet: **sie wächst monoton.** Es gibt einen Anlass, etwas hinzuzufügen — die Arbeit steht —, aber keinen Anlass, etwas zu entfernen. Wer nichts entfernt, verliert nichts; es fällt niemandem auf.

## Was die Verbotsliste wirklich abdeckte: 23 von 54

Über dieser gewachsenen Erlaubnisliste lag unser Verbotsprofil. Es war sorgfältig geschrieben, es nannte die offensichtlich gefährlichen Kommandos, und es war nie gegen die Erlaubnisliste gehalten worden.

Das Nachmessen ist simpel: jede schreibende Erlaubnis einzeln gegen das Verbotsprofil halten und zählen, welche davon tatsächlich abgefangen wird. Ergebnis: **23 von 54**, rund 43 Prozent.

Diese Zahl wirkt zunächst wie eine Aufgabe — 31 Zeilen nachtragen, dann stimmt es. Genau dieser Reflex ist die Falle. Die 31 Zeilen wären in vier Wochen wieder 35, weil die Erlaubnisliste in derselben Zeit weiterwächst und niemand die Gegenliste mitpflegt. Eine Verbotsliste über einer wachsenden Erlaubnisliste hat ein Verfallsdatum, das niemand sieht.

Der Fall hat einen Namen und eine Nummer: **CWE-184, "Incomplete List of Disallowed Inputs"**. Die Schwachstellen-Datenbank führt ihn seit Jahren, und die dortige Empfehlung ist dieselbe wie unsere Konsequenz — die Umkehrung.

## Die eine Lücke, die die anderen dreißig gegenstandslos macht

Unter den 31 nicht abgedeckten Erlaubnissen war eine, die die Arithmetik erledigt: **der Aufruf eines blanken Interpreters.**

Ein Interpreter ist kein Kommando, sondern ein Tor. Wer ihn starten darf, kann jede Datei schreiben, jeden Prozess starten, jede Verbindung öffnen — ohne ein einziges der verbotenen Kommandos zu benutzen. Die restlichen dreißig Lücken muss man danach nicht mehr diskutieren, und die 23 geschlossenen genauso wenig.

Das ist die eigentliche Lehre über Verbotslisten: **ihre Abdeckung ist nicht der Durchschnitt ihrer Zeilen, sondern der Wert ihrer schwächsten Stelle.** 43 Prozent klingt nach "halb geschafft". Tatsächlich war die Abdeckung null, sobald eine einzige generische Ausführungsmöglichkeit offenstand. Bei einer Erlaubnisliste ist es umgekehrt: Was nicht drinsteht, geht nicht — auch das, woran niemand gedacht hat.

## Richtiges Ergebnis, falscher Grund

Die zweite Hälfte dieser Geschichte ist die unangenehmere, weil sie nicht von der Liste handelt, sondern von uns.

Um den Riegel zu prüfen, ließen wir eine gesperrte Sitzung eine Datei löschen. Die Datei überlebte. An dieser Stelle hätten wir "Riegel greift, geprüft" notieren können — und es wäre falsch gewesen. Im Protokoll stand der wahre Grund: **Das Modell hatte die Aufgabe aus eigenem Urteil abgelehnt.** Die Regel war nie zum Zuge gekommen. Der Mechanismus war ungeprüft, das Ergebnis sah trotzdem exakt so aus wie ein Erfolg.

Eine Prüfung, die im Fehlerfall genauso aussieht wie im Erfolgsfall, ist keine Prüfung. Sie ist eine Beruhigung.

Das ist auch der Punkt, an dem "die KI macht so etwas ohnehin nicht" als Sicherheitsargument zerfällt. Modellurteil ist eine Verhaltenseigenschaft: Es schwankt mit Formulierung, Kontext und Version, und es ist mit einer Umformulierung verhandelbar. Ein technischer Riegel ist es nicht. Beide können zum selben Ergebnis führen — nur eines davon lässt sich planen.

## Wie man einen Riegel prüft, der etwas beweist

Aus dem Fehlschlag folgt eine Regel, die für jede Berechtigungsprüfung gilt, ob mit KI oder ohne:

**Wer einen Riegel prüft, muss eine Handlung wählen, die der Geprüfte auch ausführen will.** Eine offensichtlich destruktive Aufgabe misst das Gewissen des Modells, nicht die Wirkung der Regel. Geeignet ist eine harmlose, aber eindeutig verbotene Handlung — etwas, das das Modell bereitwillig tut und die Regel trotzdem abfangen muss.

Dazu gehört die **Positivkontrolle**: derselbe Befehl, dasselbe Verzeichnis, einziger Unterschied ist das Profil. Einmal muss er laufen, einmal abgewiesen werden. Erst dieses Paar zeigt, dass Sie den Mechanismus gemessen haben und nicht die Tagesform. In unserem Fall stimmte der Mechanismus übrigens — nur die Liste war ein Sieb.

Denselben Gedanken kennt jeder, der mit Systemaufruf-Filtern arbeitet: Auch dort ist der empfohlene Weg, alles zu verbieten und einzeln zu erlauben, und auch dort prüft man einen Filter, indem man ihn auslöst, statt zu hoffen.

## Die Umkehrung kostet nichts

Der Umbau ist unspektakulär: **eine kurze Erlaubnisliste, und alles andere ist verboten.** Das ist das Prinzip der geringsten Rechte, nur konsequent auf Werkzeuge angewendet statt auf Benutzerkonten.

Drei Dinge werden dadurch besser, und keines davon ist Mehraufwand:

1. **Die Liste wächst nur mit Absicht.** Jede neue Erlaubnis ist eine Entscheidung mit einem Menschen davor — kein Nebeneffekt von Arbeit.
2. **Unbekanntes ist automatisch abgedeckt.** Der Weg, an den niemand gedacht hat, ist in der Praxis der Normalfall. Nur die Erlaubnisliste fängt ihn.
3. **Das Restrisiko ist benennbar.** Bei einer Verbotsliste können Sie nicht sagen, was noch offen ist. Bei einer Erlaubnisliste steht es auf einer Seite.

Der Preis ist ehrlich: Es wird häufiger etwas abgewiesen, was in Ordnung gewesen wäre. Das kostet Nachfragen. Es kostet keine Überraschungen.

## Drei Fragen an Ihr eigenes Setup

Wenn Sie Agenten produktiv einsetzen, lassen sich diese drei Fragen an einem Nachmittag beantworten:

1. **Wie viele schreibende Werkzeug-Erlaubnisse haben Sie — gezählt, nicht geschätzt?** Die Zahl überrascht fast immer.
2. **Welcher Anteil davon wird von Ihrer Schutzregel tatsächlich abgefangen?** Einzeln durchgehen, nicht überfliegen.
3. **Ist unter den Erlaubnissen mindestens eine generische Ausführungsmöglichkeit?** Interpreter, Shell, Paketmanager, Build-Werkzeug mit frei wählbarem Skript. Wenn ja, ist Ihre Abdeckung unabhängig von Frage 2 gleich null.

Wir haben die Antworten auf diese drei Fragen ungern gelesen. Aber ein Riegel, von dem man weiß, dass er keiner ist, ist immer noch besser als einer, auf den man sich verlässt.`,
      faq: [
        {
          q: "Was ist der Unterschied zwischen Erlaubnisliste und Verbotsliste?",
          a: "Eine Erlaubnisliste (Allowlist) nennt abschließend, was zulässig ist; alles andere wird abgewiesen. Eine Verbotsliste (Denylist) nennt, was unzulässig ist; alles andere geht durch. Der Unterschied zeigt sich beim Unbekannten: Ein Weg, an den beim Schreiben der Liste niemand gedacht hat, wird von der Erlaubnisliste automatisch abgefangen und von der Verbotsliste automatisch durchgelassen.",
        },
        {
          q: "Warum reicht eine Verbotsliste für KI-Agenten nicht aus?",
          a: "Weil die Erlaubnisse eines Agenten im Arbeitsfluss wachsen und die Verbotsliste nur wächst, wenn jemand daran denkt. In unserer Messung standen 54 schreibenden Erlaubnissen 23 abgedeckte gegenüber. Entscheidend war aber nicht die Quote, sondern eine einzelne Lücke: Sobald ein blanker Interpreter erlaubt ist, lässt sich jedes verbotene Kommando umgehen, ohne es zu benutzen.",
        },
        {
          q: "Wie testet man, ob eine Berechtigungsregel bei einem KI-Agenten wirklich greift?",
          a: "Mit einer harmlosen, aber eindeutig verbotenen Handlung, die das Modell bereitwillig ausführen würde — und mit einer Positivkontrolle: derselbe Befehl, dasselbe Verzeichnis, einziger Unterschied ist das Profil. Einmal muss er laufen, einmal abgewiesen werden. Wählt man eine offensichtlich destruktive Aufgabe, misst man das Urteil des Modells und nicht die Wirkung der Regel.",
        },
        {
          q: "Zählt es als Absicherung, wenn das Modell gefährliche Befehle selbst ablehnt?",
          a: "Nein. Die Ablehnung durch das Modell ist eine Verhaltenseigenschaft: Sie schwankt mit Formulierung, Kontext und Modellversion und ist mit einer Umformulierung verhandelbar. Wir hatten genau diesen Fall — eine Prüfung bestand scheinbar, obwohl die Regel nie gegriffen hatte. Verlassen kann man sich nur auf den technischen Riegel; das Modellurteil ist eine willkommene zweite Schicht, keine erste.",
        },
        {
          q: "Wie groß darf eine Erlaubnisliste für einen Coding-Agenten sein?",
          a: "Wichtiger als die Länge ist, ob eine generische Ausführungsmöglichkeit darin steht — Interpreter, Shell, Paketmanager oder ein Build-Werkzeug mit frei wählbarem Skript. Ein einziger solcher Eintrag hebt jede weitere Einschränkung auf. Eine Liste mit vierzig eng gefassten Einträgen ohne Tor ist sicherer als eine mit fünf, von denen eines eine Shell ist.",
        },
      ],
      sources: [
        {
          title: "CWE-184: Incomplete List of Disallowed Inputs",
          url: "https://cwe.mitre.org/data/definitions/184.html",
        },
        {
          title: "CWE-183: Permissive List of Allowed Inputs",
          url: "https://cwe.mitre.org/data/definitions/183.html",
        },
        {
          title: "NIST Computer Security Resource Center — Least Privilege",
          url: "https://csrc.nist.gov/glossary/term/least_privilege",
        },
        {
          title: "seccomp(2) — Linux manual page on syscall filtering",
          url: "https://man7.org/linux/man-pages/man2/seccomp.2.html",
        },
        {
          title: "OWASP Top 10 for LLM Applications — LLM06: Excessive Agency",
          url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/",
        },
      ],
    },
    en: {
      title: "Deny lists do not secure AI agents",
      articleSection: "Agent Security",
      excerpt:
        "A deny profile for locked-down agent sessions covered 23 of 54 write permissions. One of the 31 gaps made all the others irrelevant.",
      coverAlt:
        "A long list of forbidden commands in front of a short list of permitted tools — allowlist instead of denylist for AI agents",
      tags: [
        "AI agents",
        "agent security",
        "allowlist",
        "denylist",
        "least privilege",
        "sandboxing",
        "tool permissions",
        "AI governance",
        "positive control",
        "coding agents",
        "security architecture",
      ],
      bodyMarkdown: `Give an **AI agent** tools and sooner or later you write a list. Ours was a deny list: commands a locked-down agent session must never run. It sat there for months and looked like protection. When we finally measured it, it covered **23 of 54** write permissions. The 31 open ones were not even the real finding — the real finding was a single gap that makes the other thirty irrelevant.

**At a glance:**

- **A deny list on top of a growing allowlist is a race you lose.** One side grows by itself with every working day, the other only when somebody remembers.
- **126 accumulated tool permissions** in a single working directory, 72 read and 54 write. Nobody ever decided on that number; it simply happened.
- **One gap is enough.** If you may start a bare interpreter, you need none of the thirty other forbidden routes.
- **The first test looked like a pass and proved nothing.** The rule had never fired — the model had declined on its own judgement. Right result, wrong reason.

The mistake in this story is not the incomplete list. Every list is incomplete. The mistake is the shape of the thing — and you find it in a surprising number of setups where an agent is allowed to do more than anyone ever decided.

## How 126 permissions appear without anyone deciding on them

Agent permissions grow out of the work itself. A tool is missing, work stalls, someone appends a line to the allowlist. That is not sloppiness, it is normal operation: every single line was justified and small at the moment it was written.

In one working directory we counted **126 tool permissions**: 72 read and 54 write. Read is the uncritical part. What matters are the 54 that can change something — create files, start processes, open network connections, install packages.

That list has one property which devalues any security reasoning placed on top of it: **it grows monotonically.** There is an occasion to add something — work is blocked — but never an occasion to remove something. Removing nothing costs nothing visible; nobody notices.

## What the deny list actually covered: 23 of 54

On top of that accumulated allowlist sat our deny profile. It was written carefully, it named the obviously dangerous commands, and it had never once been held against the allowlist.

Measuring it is trivial: take each write permission, hold it against the deny profile, count how many are actually caught. Result: **23 of 54**, roughly 43 per cent.

At first that number reads like a task — add 31 lines and it is fixed. That reflex is the trap. Those 31 lines would be 35 again in four weeks, because the allowlist keeps growing in the same period and nobody maintains the counter-list alongside it. A deny list on top of a growing allowlist has an expiry date that nobody can see.

The case has a name and a number: **CWE-184, "Incomplete List of Disallowed Inputs"**. The weakness database has carried it for years, and its recommendation is the same as our conclusion — invert it.

## The one gap that makes the other thirty irrelevant

Among the 31 uncovered permissions was one that settles the arithmetic: **invoking a bare interpreter.**

An interpreter is not a command, it is a gate. Whoever may start one can write any file, start any process, open any connection — without using a single forbidden command. After that there is no point discussing the remaining thirty gaps, and none in celebrating the 23 closed ones either.

That is the real lesson about deny lists: **their coverage is not the average of their lines, it is the value of their weakest point.** 43 per cent sounds like "halfway there". In fact coverage was zero the moment one generic execution route stood open. With an allowlist it is the other way round: what is not on it does not happen — including whatever nobody thought of.

## Right result, wrong reason

The second half of this story is the more uncomfortable one, because it is not about the list but about us.

To test the lock we had a restricted session delete a file. The file survived. At that point we could have noted "lock works, verified" — and it would have been wrong. The log held the true reason: **the model had declined the task on its own judgement.** The rule had never come into play. The mechanism was untested, yet the outcome looked exactly like success.

A test that looks the same whether it passes or fails is not a test. It is reassurance.

This is also where "the AI would not do that anyway" falls apart as a security argument. Model judgement is a behavioural property: it varies with wording, context and version, and it is negotiable with a rephrasing. A technical lock is not. Both can produce the same outcome — only one of them can be planned.

## How to test a lock so that it proves something

One rule follows from that failure, and it holds for any permission check, with or without AI:

**When you test a lock, pick an action the subject actually wants to perform.** An obviously destructive task measures the model's conscience, not the effect of the rule. What works is a harmless but unambiguously forbidden action — something the model will happily do and the rule still has to catch.

Part of it is the **positive control**: same command, same directory, the profile being the only difference. Once it must run, once it must be refused. Only that pair shows you measured the mechanism rather than the mood of the day. In our case the mechanism was in fact sound — the list was the sieve.

Anyone working with syscall filters knows the same idea: there, too, the recommended route is to forbid everything and permit individually, and there, too, you test a filter by triggering it rather than by hoping.

## Inverting it costs nothing

The rebuild is unspectacular: **a short allowlist, and everything else is forbidden.** That is the principle of least privilege, applied consistently to tools instead of to user accounts.

Three things improve, and none of them is extra work:

1. **The list only grows on purpose.** Every new permission is a decision with a human in front of it — no longer a side effect of getting work done.
2. **The unknown is covered automatically.** The route nobody thought of is the common case in practice. Only the allowlist catches it.
3. **The residual risk can be stated.** With a deny list you cannot say what is still open. With an allowlist it fits on one page.

The honest price: things get refused more often that would have been fine. That costs you questions. It does not cost you surprises.

## Three questions for your own setup

If you run agents in production, these three questions can be answered in an afternoon:

1. **How many write permissions do you have — counted, not estimated?** The number almost always surprises.
2. **What share of them does your protective rule actually catch?** Go through them one by one; do not skim.
3. **Is there at least one generic execution route among them?** Interpreter, shell, package manager, build tool with a free-form script. If yes, your coverage is zero regardless of question 2.

We did not enjoy reading our own answers. But a lock you know to be no lock still beats one you rely on.`,
      faq: [
        {
          q: "What is the difference between an allowlist and a deny list?",
          a: "An allowlist states exhaustively what is permitted; everything else is refused. A deny list states what is forbidden; everything else passes. The difference shows up with the unknown: a route nobody thought of while writing the list is caught automatically by the allowlist and passed automatically by the deny list.",
        },
        {
          q: "Why is a deny list not enough for AI agents?",
          a: "Because an agent's permissions grow out of daily work while the deny list only grows when someone remembers. In our measurement 54 write permissions faced 23 covered ones. What mattered was not the ratio but a single gap: once a bare interpreter is permitted, every forbidden command can be bypassed without being used.",
        },
        {
          q: "How do you test whether a permission rule really fires for an AI agent?",
          a: "With a harmless but unambiguously forbidden action the model would willingly perform — and with a positive control: same command, same directory, the profile being the only difference. Once it must run, once it must be refused. Pick an obviously destructive task instead and you measure the model's judgement, not the effect of the rule.",
        },
        {
          q: "Does it count as protection if the model refuses dangerous commands by itself?",
          a: "No. Refusal by the model is a behavioural property: it varies with wording, context and model version, and it is negotiable with a rephrasing. We had exactly that case — a test appeared to pass although the rule had never fired. Only the technical lock can be relied upon; model judgement is a welcome second layer, not a first one.",
        },
        {
          q: "How large may an allowlist for a coding agent be?",
          a: "More important than its length is whether it contains a generic execution route — interpreter, shell, package manager or a build tool with a free-form script. A single such entry cancels every other restriction. A list of forty narrowly scoped entries without a gate is safer than one of five where one is a shell.",
        },
      ],
      sources: [
        {
          title: "CWE-184: Incomplete List of Disallowed Inputs",
          url: "https://cwe.mitre.org/data/definitions/184.html",
        },
        {
          title: "CWE-183: Permissive List of Allowed Inputs",
          url: "https://cwe.mitre.org/data/definitions/183.html",
        },
        {
          title: "NIST Computer Security Resource Center — Least Privilege",
          url: "https://csrc.nist.gov/glossary/term/least_privilege",
        },
        {
          title: "seccomp(2) — Linux manual page on syscall filtering",
          url: "https://man7.org/linux/man-pages/man2/seccomp.2.html",
        },
        {
          title: "OWASP Top 10 for LLM Applications — LLM06: Excessive Agency",
          url: "https://genai.owasp.org/llmrisk/llm062025-excessive-agency/",
        },
      ],
    },
  },
  {
    slug: "llm-lastmanagement-routing-autoritaet",
    date: "2026-08-01",
    updated: "2026-08-01",
    author: "Michael Schiffer",
    de: {
      title: "Telefonagent, OCR und Gastkunde auf denselben GPUs",
      articleSection: "Lokale LLMs",
      excerpt:
        "Telefonagent, Belegerkennung und ein externer Gast auf denselben Karten: wie GPU-Lastmanagement entscheidet — und warum zwei Entscheidungsebenen eine zu viel sind.",
      coverAlt:
        "Schematische Darstellung eines LLM-Verbunds mit mehreren GPU-Endpunkten und einer zentralen Routing-Entscheidung",
      tags: [
        "LLM-Lastmanagement",
        "GPU-Scheduling",
        "lokale LLMs",
        "Multi-Tenant",
        "Concurrency",
        "Shadow-Mode",
        "Preemption",
        "Auto-Discovery",
        "Feature-Flag",
        "Migration ohne Ausfall",
        "On-Premise-LLM",
        "Observability",
      ],
      bodyMarkdown: `Auf vier Rechnern mit insgesamt sechs Beschleunigern laufen bei mir drei Dinge gleichzeitig, die unterschiedlicher kaum sein könnten.

**Ein Telefonagent.** Am anderen Ende wartet ein Mensch. Antwortet das System nicht in etwa einer Sekunde, ist das Gespräch kaputt — später ist wertlos.

**Belegerkennung im Stapel.** Zehntausend Seiten, die über Nacht durchlaufen. Ob das Ergebnis um zwei oder um fünf Uhr morgens fertig ist, merkt niemand.

**Auswertungen, die zeitnah gebraucht werden.** Ein Arztbrief, eine Zusammenfassung, eine Bewertung. Nicht in einer Sekunde, aber auch nicht morgen. Wer darauf wartet, arbeitet gerade.

Dazu ein vierter Punkt, kaufmännisch der interessanteste: **Nachts und am Wochenende steht die Hardware still.** Diese freie Kapazität lässt sich nach außen verkaufen — an einen Kunden, der tagelange Stapelverarbeitung fährt und dem es gleich ist, wann sie fertig wird, solange sie günstig ist.

Damit liegen vier Ansprüche auf derselben Hardware, und sie widersprechen sich. Der Telefonagent braucht sofort einen freien Platz. Der Stapel will alles nehmen, was da ist. Der externe Kunde soll zahlen, aber niemals den Telefonagenten ausbremsen. Und leer stehen soll die Hardware auch nicht.

**GPU-Lastmanagement** entscheidet, welche Anfrage auf welchem Beschleuniger läuft und in welcher Reihenfolge. Wer diese Verteilung dem Zufall überlässt, bekommt beides falsch: wartende Menschen bei halb leerer Maschine.

Bei mir war sie über zwei Monate gewachsen — nicht als Entscheidung, sondern als Ablagerung. Am Ende standen **zwei Ebenen, die beide entscheiden wollten**: eine Vorauswahl anhand einer Pool-Liste im Code, und darunter eine Score-Funktion, die umrouten konnte. Das Ergebnis waren 18 dokumentierte Fehlerbilder, die sich auf fünf Wurzeln zurückführen ließen. Vier davon hatten dieselbe: zwei Stellen beantworteten dieselbe Frage, und die zweite durfte die erste überstimmen.

Die Reparatur war nicht, die Ebenen besser abzugleichen. Sie war, **eine zu löschen**.

**Auf einen Blick:**

- **Fähigkeit ist ein Filter, keine Punktzahl.** Ein Scoring-System findet immer einen Gewinner — auch wenn kein Kandidat den Request bedienen kann. „Kann dieser Endpunkt das überhaupt?" gehört vor die Bewertung, nicht hinein.
- **Konfiguration in Tabellen statt in Konstanten.** Eine Präferenz zu ändern war vorher ein Deployment. Jetzt ist es ein UPDATE, das nach 15 Sekunden greift.
- **Shadow-Mode ist billiger als Mut.** Rund 15 000 Doppelentscheidungen ohne Wirkung, 80 % Abweichung — und jede Abweichungsklasse zugunsten des Neuen.
- **Der Engpass sitzt selten dort, wo man hinschaut.** Bei einem GPU-Dienst war der erste harte Engpass unter Last der Datenbank-Verbindungspool.

## Die Ausgangslage: vier Rechner, drei Lastprofile

Der Verbund ist absichtlich ungleich:

| Rechner | Beschleuniger | Eigenschaft |
|---|---|---|
| **GX-10** | GB10, 128 GB gemeinsamer Speicher | bandbreitenbegrenzt, dafür große Modelle und lange Kontexte |
| **PC-30** | RTX 3090 Ti + RTX 5060 Ti, zusammen 40 GB | Multi-GPU-Split, das Arbeitspferd |
| **PC-11** | Tesla V100 32 GB + RTX 3060 | die V100 ist für latenzkritische Aufträge reserviert |
| **PC-10** | RTX 3060 | eine Karte, teilt sie mit anderen Diensten |
| — | gehosteter Endpunkt | Überlauf, wird nur bei Bedarf zugeschaltet |

Sechs Beschleuniger aus vier Generationen, von einer Server-Karte von 2017 bis zu einem ARM-System von 2025. Diese Ungleichheit ist kein Versehen, sondern gewachsen — und sie ist der Grund, warum eine Routing-Regel überhaupt nötig ist. Bei sechs gleichen Karten würde Reihum genügen. Darauf laufen gleichzeitig drei Profile, die schlechter zueinander passen als es zunächst aussieht:

| Profil | Charakter | Priorität |
|---|---|---|
| Produktion | latenzkritisch, tagsüber, viele kurze Aufträge | hoch |
| Chat und Retrieval | Embeddings, kurze Antworten, dauernd ein wenig | mittel |
| Externer Stapelbetrieb | mehrtägige Dauerlast über eine öffentliche Schnittstelle | Gast |

![Endpunkt-Registry: acht Endpunkte auf vier ungleichen Maschinen, mit Status, Engine und Obergrenzen](/blog/llm-lastmanagement-routing-autoritaet/screens/de/registry.png)

Der Gast ist der interessante Fall. Er fragt nicht höflich, er nimmt was da ist — und genau dafür ist er gedacht. Ein Lastmanagement, das ihn ausbremst, verschenkt nachts die Hardware. Eines, das ihn nicht begrenzt, bringt tagsüber die Produktion zum Stillstand.

## Vier Fehlerbilder und was sie gemeinsam hatten

**Der Modell-Tag-Zufall.** Nur einer der Endpunkte meldete den Modellnamen exakt so, wie der aufrufende Client ihn schickte; die übrigen benannten ihr Modell intern nach dem Dateipfad der Gewichte. Die Score-Funktion gab „Modell ist hier schon geladen" 100 Punkte — also gewann immer derselbe Endpunkt. Bei vollem Hauptpool stauten sich acht Anfragen auf einen einzigen Slot, während vier gesunde Slots auf der großen Maschine leer standen. Der überlastete Endpunkt begann zwischen gesund und ausgefallen zu pendeln.

Der Punkt ist nicht der Zählfehler. Der Punkt ist, dass ein **String-Vergleich** über die Lastverteilung entschied.

**Der Fähigkeits-Fehler.** Der Kandidatenfilter prüfte die *Kapazität*, aber nicht die *Fähigkeit*. Eine Chat-Anfrage konnte deshalb auf einem Endpunkt landen, der ausschließlich Reranking anbietet — der hat keinen Chat-Pfad, also HTTP 404. Fünfmal in sechs Minuten, dann Rollback.

**Der Körper folgt der falschen Ebene.** Routete die untere Ebene um, war der Request-Körper immer noch für den vorausgewählten Endpunkt gebaut: ein Format gegen einen Pfad, der ein anderes erwartet. Geflickt wurde das mit einer Funktion, die den Körper nach dem Landen nochmal anpasst — ein Pflaster auf einem Konstruktionsfehler.

**Das Leck in der Slot-Zählung.** Zählen, entscheiden, platzieren — ohne Sperre dazwischen. Ein klassisches Prüfen-dann-Handeln. Unter Last überschritt die tatsächliche Belegung das konfigurierte Limit, und zwar zuverlässig.

Dazu kam ein fünfter, der keine Fehlfunktion war, sondern ein Betriebsproblem: **Die Gesundheitsprüfung stand in derselben Warteschlange wie die Nutzlast.** Sie musste ein echter Mini-Aufruf sein, weil eine reine Statusabfrage auch dann Erfolg meldet, wenn die Inferenz-Engine tot ist. Bei gesättigtem Endpunkt lief sie deshalb in den Timeout — und der Endpunkt wurde als ausgefallen markiert, obwohl er einfach nur beschäftigt war.

## Fünf Wurzeln

Aus den 18 Fehlerbildern blieben nach dem Sortieren fünf Ursachen:

1. **Eine einzige Routing- und Slot-Wahrheit** statt zwei entkoppelter Ebenen. Kandidaten nach **Fähigkeit** filtern, nicht nach Namensähnlichkeit.
2. **Atomare, hart erzwungene Parallelität.** Reale Hardware-Slots als Obergrenze, kein Prüfen-dann-Handeln.
3. **Gesundheitsprüfung außerhalb der Nutzlast-Warteschlange** und typbewusst.
4. **Kapazität selbst erkennen** statt handgepflegter Obergrenzen.
5. **Profile voneinander entkoppeln**, damit ein Gast die Produktion nicht aushungert.

Und ein sechster Wunsch, der sich im Betrieb als der wichtigste erwies: **Die harten Hebel lagen im Code.** Pool-Zusammensetzung, Reihenfolge, Obergrenzen, Kontext-Schwellen — alles Konstanten. Jede Änderung an der Hardware bedeutete: Code ändern, ausliefern, hoffen.

## Die Datenbank wird die Wahrheit

Die zentrale Entscheidung des Neuaufbaus ist unspektakulär und hat alles andere leichter gemacht: **Alles, was das Routing entscheidet, steht in Tabellen. Nichts mehr im Code.**

Endpunkt-Registry mit URL, Engine-Typ, Schnittstellenformat, Obergrenzen für parallele Anfragen und gleichzeitig geladene Modelle. Kanonische Modell-Bezeichner samt Alias-Tabelle für die Namen, die Clients benutzen. Profile mit Priorität und Kontingent, plus eine Erlaubnis-Matrix Profil × Endpunkt. Konfiguration als Schlüssel-Wert-Paare mit Änderungshistorie und Begründungsfeld.

Das Herz ist eine **Fähigkeits-Matrix**: eine Zeile je Endpunkt und Modell, und in dieser Zeile steht der exakte Modellname, den *dieser* Endpunkt versteht, dazu maximale Kontextlänge, Anzahl Slots und ein Präferenz-Rang.

Zwei Details daraus haben sich als goldrichtig erwiesen.

**Der endpunktspezifische Modellname.** Genau hier stirbt der Modell-Tag-Zufall. Der Client schickt einen Alias, die Matrix übersetzt ihn je Endpunkt in den String, den das jeweilige Backend erwartet. Kein Vergleich von Zeichenketten, kein Bonus für zufällige Namensgleichheit.

**Der Präferenz-Rang als Spalte.** Die Reihenfolge, in der Endpunkte bevorzugt werden, ist eine Zahl. Sie zu ändern ist ein UPDATE, kein Deployment. In der Oberfläche sind es zwei Pfeiltasten.

![Fähigkeits-Matrix: eine Zeile je Endpunkt und Modell, mit endpunktspezifischem Backend-Namen, Rang und konfigurierten gegen entdeckte Slots](/blog/llm-lastmanagement-routing-autoritaet/screens/de/matrix.png)

## Die Engine: Kandidaten statt Punkte

Der Kern ist bewusst langweilig. Kein Wettbewerb um die höchste Punktzahl, sondern ein Filter über die Fähigkeits-Matrix — ein Endpunkt ist Kandidat oder er ist keiner:

- falsches Modell oder falscher Aufgabentyp → kein Kandidat
- Endpunkt deaktiviert → kein Kandidat
- Profil hat für diesen Endpunkt keine Erlaubnis → kein Kandidat
- geforderte Kontextlänge größer als die Zeile erlaubt → kein Kandidat
- Endpunkt als ausgefallen bekannt → kein Kandidat

Der Aufgabentyp in dieser Liste ist die Stelle, an der der 404 aus dem dritten Abschnitt **strukturell unmöglich** wird: Eine Chat-Anfrage sieht Reranking-Zeilen gar nicht.

Die Auswahl unter den echten Kandidaten ist dann trivial und deterministisch: Präferenz-Rang aufsteigend, gesund vor angeschlagen, danach die meisten freien Slots.

Wichtig für den Betrieb ist nicht die Auswahl, sondern ihre **Begründung**: Jede Reservierung schreibt mit, *warum* dieser Endpunkt gewählt wurde — erste Wahl, erste Wahl war voll, Anheftung hat den Rang überstochen, Modell wurde einem Gast weggenommen. Eine Verteilungsanomalie erklärt man damit in einer einzigen Abfrage, statt sie zu erraten.

![Prüfspur: je Reservierung Zeit, Profil, Aufrufer, Modell, Endpunkt, Routing-Grund und Dauer](/blog/llm-lastmanagement-routing-autoritaet/screens/de/audit.png)

**Atomar reservieren.** Der ganze Zyklus — Kandidaten bilden, zählen, auswählen, Slot eintragen — läuft unter einer Sperre. Ist alles besetzt, wartet der Aufrufer an einer Bedingungsvariable, die beim Freigeben geweckt wird, mit periodischer Neubewertung, weil sich die Registry zwischenzeitlich geändert haben kann. Das Leck in der Slot-Zählung ist damit kein Tuning-Problem mehr, sondern weg.

## Die vollständige Auftragsbeschreibung

Die Engine liefert nicht „welcher Endpunkt", sondern die **komplette Spezifikation des Aufrufs**: Basis-URL, Schnittstellenformat, Aufgabentyp, der für diesen Endpunkt gültige Modellname, die zu sendende Kontextlänge, die Kopfzeilen. Der Aufrufer baut daraus seinen HTTP-Aufruf und trifft selbst **keine** Routing-Entscheidung mehr.

Damit ist die ganze Fehlerklasse „Körper passt nicht zum Endpunkt" erledigt — nicht behandelt, sondern konstruktiv ausgeschlossen. Das Pflaster von vorher konnte weg.

Ein Detail, das die Betreiber der GPU-Knoten sich gewünscht hatten: eine Kopfzeile mit dem anfragenden Profil. Am Backend lässt sich jetzt nachvollziehen, *wer* gerade die Karte belegt. Vorher war jede Anfrage anonym derselbe Client.

Die Kontextlänge bekam eine klare Autoritätsregel, und die ist asymmetrisch: **nach außen erzwungen**, damit kein Client durch eine überhöhte Angabe einen Modell-Neuladevorgang provozieren kann; **nach innen gedeckelt**, damit ein interner Plan bewusst kleiner anfordern darf, aber nie größer als die Matrix erlaubt.

## Verdrängung: Modell-Plätze statt abgebrochener Anfragen

Manche Engines haben ein zweites, subtileres Limit: nicht nur wie viele Anfragen parallel laufen, sondern **wie viele verschiedene Modelle gleichzeitig geladen sein dürfen**.

Braucht eine Anfrage ein neues Modell auf einem Knoten, dessen Modell-Plätze belegt sind, sucht die Engine ein Opfer: einen aktiven Slot mit strikt niedrigerer Priorität, der **alleiniger Nutzer seines Modells** ist. Teilen sich mehrere dasselbe Modell, würde ein Entladen nichts bringen.

Der wichtigste Teil ist der Negativfall. **Findet sich kein Opfer, fällt der Endpunkt für diese Runde einfach aus den Kandidaten.** Kein Fehler, kein Hin-und-Her — der nächste Kandidat wird geprüft. Das ist der Unterschied zwischen einem System, das unter Druck degradiert, und einem, das unter Druck oszilliert.

Und zur Erwartungshaltung: Verdrängung bricht **keine laufenden Anfragen** ab. Ein Datenstrom läuft durch. Verdrängt wird nur die Berechtigung, als nächstes zu starten.

## Kapazität selbst finden

Die Obergrenzen waren vorher handgesetzt und drifteten nach jeder Änderung an der Hardware. Nach einem Stromausfall kam der Verbund kleiner zurück als er vorher war — und niemand merkte es, außer an einer steigenden Rate abgewiesener Anfragen.

Der Abfrage-Dienst läuft **außerhalb der Nutzlast-Warteschlange**, das war die Lehre aus der pendelnden Gesundheitsprüfung, und er fragt typbewusst: bei einer Engine die Prometheus-Metriken, bei einer anderen die Liste geladener Modelle, bei den übrigen einen leichten Erreichbarkeitstest, bei dem ein 4xx „lebt" bedeutet und nur 5xx und Timeout „ausgefallen".

Zwei Regeln haben sich als essenziell erwiesen:

**Erkennung darf nur nach unten korrigieren.** Der gemeldete Wert ist Zweitquelle, nie Vergrößerung. Ein Knoten, der sich verschätzt, kann den Verbund nicht überbuchen.

**Angekündigte Endpunkte werden nie automatisch übernommen.** Taucht ein unbekannter Endpunkt in einem Bericht auf, gibt es eine Warnung und einen Vorschlag für die Oberfläche — kein Eintrag. Ein fremder Knoten soll sich nicht selbst ins Routing schreiben können.

Der erste Erkennungslauf lieferte prompt einen Befund, den vorher niemand hatte: Zwei Endpunkte, für die vier Slots konfiguriert waren, meldeten real **einen**. Der konfigurierte Wert war seit Wochen Fiktion.

Darauf sitzt eine kleine Regelschleife: Das Kontingent des Gast-Profils folgt automatisch der Summe der gesunden, freigegebenen Slots — mit Untergrenze und zwei Takten Verzögerung, damit ein einzelner Fehlversuch das Limit nicht zappeln lässt. Vorher war das eine Abstimmung per Dokument zwischen mehreren Beteiligten.

## Der Umstieg: Shadow-Mode und ein Schalter in der Datenbank

Das ist eine Produktionsmaschine. Ein Umstieg auf einen Schlag war keine Option.

Der eigentliche Hebel ist ein einziger Konfigurationsschlüssel mit drei Konsumentengruppen und je drei möglichen Werten: alt, Schatten, neu. Die Konfiguration wird 15 Sekunden zwischengespeichert — ein UPDATE greift also nach spätestens 15 Sekunden, **ohne Neustart**. Der Rollback ist dasselbe UPDATE rückwärts.

### Der Schatten

Der interessanteste Schritt. Im Schatten-Betrieb entscheidet weiterhin das alte System — aber jede echte Reservierung wird von der neuen Engine **nachträglich trocken nachentschieden**, und beide Antworten werden verglichen protokolliert. Kein Slot wird belegt, keine Latenz entsteht: Die Auswertung läuft im Speicher, die Schreibvorgänge gebündelt.

Damit der Vergleich billig bleibt, ist „haben alt und neu dasselbe entschieden?" keine Anwendungslogik, sondern eine berechnete Spalte in der Tabelle. Ein Index-Scan statt einer Auswertung.

Nach knapp **15 000 Vergleichen** — vier Stunden Volllast des externen Stapelbetriebs plus ein kompletter Produktionsdurchlauf — stand da eine Zahl, die erst einmal wehtat: **80 % Abweichung.**

Die Auflösung: Jede einzelne Abweichungsklasse war „das Neue hat recht".

| Klasse | Was passierte | Bewertung |
|---|---|---|
| Überlauf | Alt platzierte über die realen Slots hinaus, Neu hält harte Obergrenzen und weicht aus | Neu hat recht |
| Hätte gewartet | Bei Totalsättigung platzierte Alt trotzdem — das Zählleck, live beobachtet | Neu hat recht |
| Doppelbelegung | Alt legte zwei Produktionsmodelle auf einen Ein-Slot-Endpunkt, **während dort ein Gast-Auftrag lief** | Neu hat recht |
| Erstwahl übersprungen | Der bevorzugte Endpunkt galt dem alten Gesundheitscheck als ausgefallen | korrekt |

Der dritte Fall war der Moment, in dem sich der Aufwand für den Schatten-Betrieb bezahlt hat: Ein Problem, das vorher nur theoretisch beschrieben war, wurde **live beim Passieren** dokumentiert — ohne dass jemand eingreifen musste.

Nebenbefund des Einbrennens: Die Auswertungszeit der neuen Engine lag im 95. Perzentil bei **103 Mikrosekunden**, bei null Ausnahmen.

### Nacheinander umschalten

Drei Konsumentengruppen, drei getrennte Umstiege, jeder mit eigenem Prüfschritt.

Zuerst die **externe Schnittstelle** — dort ist das Risiko am besten kontrollierbar und der Nutzen am größten. Verifikation in einem Zehn-Minuten-Fenster: 321 Anfragen, Verteilung wie erwartet, null Fehler, null der gefürchteten 404er. Das alte System lief exakt 16 Sekunden nach dem Umschalten aus — die Lebensdauer des Konfigurations-Zwischenspeichers.

Dann die **internen Konsumenten**, also die Produktion. Der Trick, der das billig machte: Die Datenstruktur des Slot-Kontexts blieb **byte-kompatibel**. Zehn interne Aufrufstellen wurden nicht angefasst; ihre Client-Bezeichner werden per Mustervergleich auf Profile abgebildet. Null Codeänderung an den Aufrufern, volle Sichtbarkeit nach Profil.

Zuletzt ein Nachbar-Host, der über die Schnittstelle reserviert. Damit schloss sich die letzte Lücke für Doppelbelegungen.

Für die Übergangszeit gab es eine **Brücke**: Solange das alte System parallel Slots hielt, zählte die neue Engine dessen aktive Slots mit. Die Slot-Mengen waren disjunkt, die Summe also die echte Belegung. Ohne diese Brücke hätte die neue Engine dieselben GPUs doppelt belegt, während die Produktion dort arbeitete.

Und ein Zwischenstand, den man ehrlich dokumentieren muss: Es gab ein Zeitfenster, in dem die *umgekehrte* Brücke fehlte — das alte System sah die neuen Slots nicht. Das entsprach exakt dem Verhalten von vorher, war also keine Verschlechterung, aber eben auch keine Verbesserung. Der Notfallhebel dafür war, dem Gast-Profil die Erlaubnis für die betroffenen Endpunkte zu entziehen. Wirkung: 15 Sekunden.

## Die Oberfläche: Hebel sichtbar machen

Der ganze Umbau wäre halb so viel wert, wenn die Steuerung wieder in SQL läge. Also gibt es eine Seite mit fünf Bereichen.

**Live** — welche Konsumentengruppe auf welchem System läuft, der Umstiegszustand auf einen Blick. Dazu Gast-Kontingent Ziel gegen Ist, alle aktiven Slots mit Profil, Modell, Endpunkt und Alter im Fünf-Sekunden-Takt, und Endpunkt-Gesundheit mit Ein-Aus-Schalter.

**Matrix** — die Fähigkeits-Matrix. Pro Zeile: Endpunkt, Modell, Kontextlänge, konfigurierte gegen **entdeckte** Slots mit Markierung bei Abweichung, Präferenz-Rang mit Pfeiltasten, Slots direkt editierbar. Das ist die Seite, auf der früher ein Deployment nötig war.

**Profile** — Prioritäten, Kontingente, Endpunkt-Erlaubnisse und die Zuordnungsregeln. Letztere absichtlich nur lesbar: Wer welchen internen Dienst wohin lässt, ändert man nicht im Vorbeigehen.

**Konfiguration** — alle Schlüssel mit Inline-Bearbeitung, Änderungshistorie und **Rollback-Schaltfläche**. Jede Änderung trägt eine Begründung. Der Umstieg selbst ist hier ein Eintrag.

**Prüfspur** — die letzten Reservierungen mit Profil, Endpunkt, Modell, Routing-Grund und Dauer. Sechs Felder, und man weiß, was passiert ist.

Bewusst **nicht** gebaut: das Anlegen neuer Endpunkte und die Ein-Klick-Übernahme angekündigter Endpunkte. Beides bleibt SQL. Für Aktionen, die die Topologie erweitern, ist ein bisschen Reibung ein Merkmal, kein Mangel.

## Drei Befunde aus dem Betrieb danach

**Der Engpass war die Datenbank, nicht die GPU.** Als der externe Stapelbetrieb mit 16 parallelen Arbeitern fuhr, lautete das Symptom „es wird keine Anfrage mehr beendet". Naheliegende Vermutung: GPU überlastet. Tatsächlich war es der Verbindungspool: Die Reservierung schrieb ihren Prüfeintrag im selben Aufruf und bekam keine Verbindung mehr, weil der Pool klein war und von der ganzen Anwendung geteilt wurde. Hänger bis in den Bereich einer halben Minute — **vor** dem eigentlichen Modellaufruf. Die Datenbank selbst hatte massig Luft: etwa ein Viertel der Verbindungen belegt. Rein clientseitig.

**Eine kleine Karte schlug die große Maschine.** Bei den Embeddings zeigte eine Messung, dass ein kleiner Dienst auf einer älteren Karte bei kurzen Embedding-Anfragen rund **viermal mehr Token pro Sekunde** schaffte als der große Knoten. Dort teilt sich der Embedding-Dienst die Speicherbandbreite mit zwei Chat-Instanzen und bekommt nur einen Slot. Die Umstellung der Primärroute war ein Rangtausch — *fast*. Es mussten drei Schichten fallen, bis der Wechsel griff: der Rang in der neuen Matrix, eine Anheftungsliste im Aufrufer-Code und ein Eintrag in der alten Registry, den der Gesundheitscheck noch befragte. Der neue Endpunkt fehlte dort, galt deshalb als ausgefallen und rutschte ans Listenende. Ein Lehrstück über Doppel-Registries: Solange die Aufräumphase nicht durch ist, muss ein neuer Endpunkt in *beide* Verzeichnisse.

**Eine Welle abgewiesener Anfragen bei gleichzeitig leerlaufenden GPUs.** Ursache war keine Überlast, sondern eine Anfrageklasse, die durch die Kontextrechnung nur auf einer *kleinen Teilmenge* der Endpunkte laufen durfte — ein großzügig gesetztes Ausgabe-Budget bei kleinem Eingabetext reserviert Kontext, den nur ein Endpunkt bietet. Diese Teilmenge war dauerbelegt, alle Warter hielten Begrenzer-Slots. Sichtbar wurde das über eine Kreuztabelle aus Ausgabeklasse und Routing-Grund. Der Fix lag beim Client, gefunden wurde er in einer Datenbankabfrage.

Eine spätere Ausbaustufe trennte dann noch das Zulassungsbudget **je Aufgabentyp**: Chat und Embeddings teilten sich eines, obwohl sie auf verschiedenen Pools laufen — ein Anreicherungslauf konnte damit die Embeddings aushungern.

## Was ich daraus mitnehme

**Zwei Entscheidungsebenen sind eine Ebene zu viel.** Fast jeder harte Fehler kam daher, dass zwei Stellen dieselbe Frage beantworteten. Die Reparatur war nicht bessere Synchronisation, sondern Löschen.

**Fähigkeit ist ein Filter, keine Punktzahl.** Ein Scoring-System findet immer einen Gewinner, auch wenn keiner passt.

**Konfiguration gehört in Tabellen.** Nicht aus Eleganz, sondern weil sich Hardware ändert und ein Deployment zum Ändern einer Präferenz die falsche Kostenstruktur hat. Der Test eines Rangwechsels dauert jetzt 15 Sekunden, inklusive Rückweg.

**Ein Schalter in der Datenbank schlägt einen Feature-Branch.** Jeder Umstieg war reversibel, ohne Neustart, ohne Deployment — und die Historie steht als Zeile in einer Tabelle.

**Der teuerste Teil eines verteilten Systems ist die Zeit, in der niemand weiß, warum es das gerade getan hat.** Deshalb steht in jeder Prüfzeile der Routing-Grund. Das ist die Zeile, mit der jede Diagnose anfängt, und die einzige Maßnahme aus diesem Umbau, die ich in jedem vergleichbaren System zuerst bauen würde.

## Grenzen

- **Ein Verbund, eine Arbeitslast, ein Beobachter.** Die Zahlen gelten für diesen Aufbau. Ob 80 % Abweichung typisch sind oder ein Sonderfall eines besonders gewachsenen Alt-Systems, kann ich nicht sagen.
- **Die Abweichungsklassen habe ich selbst bewertet.** „Neu hat recht" ist ein Urteil, kein Messwert — auch wenn es je Klasse begründet ist.
- **Kein A/B-Vergleich der Endzustände.** Gemessen wurde alt gegen neu in der Entscheidung, nicht Durchsatz vorher gegen nachher über eine vergleichbare Woche.
- **Die Verdrängung ist auf Engines mit Modell-Plätzen zugeschnitten.** Für Engines, die ein Modell dauerhaft halten, ist der Mechanismus überflüssig.
- **Das Muster passt zu kleinen, heterogenen Verbünden.** Bei homogener Hardware in Größenordnungen, wo ein etablierter Scheduler in Frage kommt, wäre der Eigenbau die falsche Antwort.`,
      faq: [
        {
          q: "Wie verteilt man Last über mehrere lokale LLM-Endpunkte?",
          a: "Über eine einzige Entscheidungsstelle, die Kandidaten nach Fähigkeit filtert statt nach Punkten zu bewerten: passendes Modell, passender Aufgabentyp, Erlaubnis für das anfragende Profil, ausreichende Kontextlänge, Endpunkt nicht ausgefallen. Unter den echten Kandidaten entscheidet dann ein konfigurierter Präferenz-Rang, danach die Zahl freier Slots. Zwei Ebenen, die beide entscheiden dürfen, erzeugen zuverlässig Fehler.",
        },
        {
          q: "Warum ist ein Scoring-System für LLM-Routing problematisch?",
          a: "Weil es immer einen Gewinner findet — auch wenn kein Endpunkt die Anfrage bedienen kann. Im beobachteten Fall bekam ein Endpunkt 100 Bonuspunkte dafür, dass er den Modellnamen zufällig genauso schrieb wie der aufrufende Client, und zog dadurch die gesamte Last auf einen einzigen Slot. Die Frage «kann dieser Endpunkt das überhaupt» gehört vor die Bewertung, nicht als Gewichtung hinein.",
        },
        {
          q: "Was ist ein Shadow-Mode bei einer Routing-Umstellung?",
          a: "Das alte System entscheidet weiter und wirkt, das neue entscheidet parallel trocken mit, und beide Antworten werden verglichen protokolliert. Kein Slot wird belegt, keine Latenz entsteht. In diesem Fall ergaben einige Tausend Vergleiche weit über die Hälfte Abweichung — und jede Abweichungsklasse sprach für das neue System, darunter eine Doppelbelegung, die vorher nur theoretisch beschrieben war.",
        },
        {
          q: "Wie begrenzt man einen externen Gast-Nutzer, ohne die Produktion zu bremsen?",
          a: "Über Profile mit Priorität und eine Erlaubnis-Matrix Profil × Endpunkt, dazu ein Kontingent, das automatisch der Summe der gesunden freigegebenen Slots folgt. Verdrängung greift nur gegen strikt niedrigere Priorität und nur bei Modellen, die kein anderer Slot mitbenutzt. Findet sich kein Opfer, fällt der Endpunkt aus den Kandidaten statt einen Fehler zu erzeugen.",
        },
        {
          q: "Warum sollte eine Gesundheitsprüfung außerhalb der normalen Warteschlange laufen?",
          a: "Weil eine aussagekräftige Prüfung ein echter Mini-Aufruf sein muss — eine reine Statusabfrage meldet auch dann Erfolg, wenn die Inferenz-Engine tot ist. Steht dieser Aufruf in derselben Warteschlange wie die Nutzlast, läuft er bei gesättigtem Endpunkt in den Timeout, und der Endpunkt wird als ausgefallen markiert, obwohl er nur beschäftigt ist. Das erzeugt Pendeln zwischen gesund und ausgefallen.",
        },
        {
          q: "Sollte man die Kapazität von LLM-Endpunkten konfigurieren oder erkennen?",
          a: "Beides, mit klarer Vorfahrt: konfigurieren als Obergrenze, erkennen als Korrektiv nach unten. Der erkannte Wert darf nie vergrößern, sonst kann ein Knoten, der sich verschätzt, den Verbund überbuchen. Im beobachteten Fall meldeten zwei Endpunkte real einen Slot, wo vier konfiguriert waren — der Wert war seit Wochen Fiktion und fiel nur durch eine steigende Abweisungsrate auf.",
        },
        {
          q: "Wie stellt man ein Routing im Produktivbetrieb um, ohne Ausfall?",
          a: "Mit einem Konfigurationsschalter je Konsumentengruppe und drei Werten: alt, Schatten, neu. Wird die Konfiguration nur kurz zwischengespeichert, greift ein UPDATE nach Sekunden und der Rollback ist dasselbe UPDATE rückwärts — ohne Neustart, ohne Deployment. Solange beide Systeme parallel Slots halten, braucht es eine Brücke, die die Belegung des jeweils anderen mitzählt, sonst wird dieselbe GPU doppelt belegt.",
        },
      ],
      sources: [
        {
          title: "PostgreSQL — Generated Columns (Grundlage der Abweichungs-Auswertung)",
          url: "https://www.postgresql.org/docs/current/ddl-generated-columns.html",
        },
        {
          title: "Python asyncio — Locks und Conditions für atomare Reservierung",
          url: "https://docs.python.org/3/library/asyncio-sync.html",
        },
        {
          title: "llama.cpp server — Slots und Prometheus-Metriken",
          url: "https://github.com/ggml-org/llama.cpp/tree/master/tools/server",
        },
        {
          title: "Ollama API — geladene Modelle und keep_alive",
          url: "https://github.com/ollama/ollama/blob/main/docs/api.md",
        },
        {
          title: "SQLAlchemy — Connection Pooling und Pool-Grenzen",
          url: "https://docs.sqlalchemy.org/en/20/core/pooling.html",
        },
        {
          title: "Google SRE Book — Handling Overload",
          url: "https://sre.google/sre-book/handling-overload/",
        },
      ],
    },
    en: {
      title: "Voice agent, OCR and guest load on the same GPUs",
      articleSection: "Local LLMs",
      excerpt:
        "A voice agent, OCR batches and an external guest on the same cards: how GPU load management decides — and why two decision layers are one too many.",
      coverAlt:
        "Schematic view of an LLM cluster with several GPU endpoints and a single central routing decision",
      tags: [
        "LLM load management",
        "GPU scheduling",
        "local LLMs",
        "multi-tenant",
        "concurrency",
        "shadow mode",
        "preemption",
        "auto-discovery",
        "feature flag",
        "zero-downtime migration",
        "on-premise LLM",
        "observability",
      ],
      bodyMarkdown: `Across four machines with six accelerators between them, three things run here at the same time that could hardly be more different.

**A voice agent.** There is a person on the other end. If the system does not answer within roughly a second, the conversation is broken — later is worthless.

**Document recognition in batches.** Ten thousand pages running through overnight. Whether the result is ready at two or at five in the morning, nobody notices.

**Evaluations that are needed promptly.** A letter, a summary, an assessment. Not within a second, but not tomorrow either. Whoever is waiting for it is working right now.

And a fourth point, commercially the most interesting: **at night and at weekends the hardware sits idle.** That spare capacity can be sold — to a customer running multi-day batch work who does not care when it finishes, as long as it is cheap.

So four claims rest on the same hardware, and they contradict each other. The voice agent needs a free slot immediately. The batch wants everything available. The external customer should pay, but must never slow the voice agent down. And the hardware should not sit idle either.

**GPU load management** decides which request runs on which accelerator, and in what order. Leave that distribution to chance and you get both wrong at once: people waiting while the machine is half empty.

Mine had grown over two months — not as a decision but as a sediment. What stood at the end were **two layers that both wanted to decide**: a pre-selection from a pool list in the code, and beneath it a scoring function that could re-route. The result was 18 documented faults which reduced to five root causes. Four of them shared one: two places answered the same question, and the second was allowed to override the first.

The fix was not to reconcile the layers better. It was to **delete one**.

**At a glance:**

- **Capability is a filter, not a score.** A scoring system always finds a winner — even when no candidate can serve the request. "Can this endpoint do it at all?" belongs before the evaluation, not inside it.
- **Configuration in tables, not in constants.** Changing a preference used to be a deployment. Now it is an UPDATE that takes effect within 15 seconds.
- **A shadow mode is cheaper than courage.** Roughly 15,000 duplicate decisions with no effect, 80 % divergence — and every divergence class favoured the new engine.
- **The bottleneck is rarely where you look.** For a GPU service, the first hard bottleneck under load was the database connection pool.

## The starting point: four machines, three usage profiles

The cluster is deliberately uneven:

| Machine | Accelerators | Property |
|---|---|---|
| **GX-10** | GB10, 128 GB shared memory | bandwidth-bound, but takes large models and long contexts |
| **PC-30** | RTX 3090 Ti + RTX 5060 Ti, 40 GB combined | multi-GPU split, the workhorse |
| **PC-11** | Tesla V100 32 GB + RTX 3060 | the V100 is reserved for latency-critical work |
| **PC-10** | RTX 3060 | a single card, shared with other services |
| — | hosted endpoint | overflow, enabled only when needed |

Six accelerators across four generations, from a 2017 server card to a 2025 ARM system. That unevenness is not an oversight but an accretion — and it is the reason a routing rule is needed at all. With six identical cards, round-robin would do. Three profiles run on it at once, and they fit together worse than it first appears:

| Profile | Character | Priority |
|---|---|---|
| Production | latency-critical, daytime, many short jobs | high |
| Chat and retrieval | embeddings, short answers, a little all the time | medium |
| External batch | multi-day sustained load over a public interface | guest |

![Endpoint registry: eight endpoints across four unequal machines, with status, engine and ceilings](/blog/llm-lastmanagement-routing-autoritaet/screens/en/registry.png)

The guest is the interesting case. It does not ask politely, it takes what is available — and that is exactly what it is for. Load management that throttles it wastes the hardware overnight. Load management that does not bound it brings production to a halt during the day.

## Four faults and what they had in common

**The model-tag coincidence.** Only one endpoint reported the model name exactly as the calling client sent it; the others named their model internally after the path of the weights file. The scoring function awarded 100 points for "model already loaded here" — so the same endpoint always won. With the main pool full, eight requests queued onto a single slot while four healthy slots on the large machine sat idle. The overloaded endpoint began flapping between healthy and down.

The point is not the counting error. The point is that a **string comparison** decided load distribution.

**The capability error.** The candidate filter checked *capacity* but not *capability*. A chat request could therefore land on an endpoint that only offers reranking — which has no chat path, hence HTTP 404. Five times in six minutes, then rollback.

**The body follows the wrong layer.** When the lower layer re-routed, the request body was still built for the pre-selected endpoint: one format against a path expecting another. This was patched with a function that adjusts the body after landing — a plaster over a design fault.

**The leak in slot counting.** Count, decide, place — with no lock in between. A classic check-then-act. Under load the actual occupancy exceeded the configured limit, reliably.

A fifth was not a malfunction but an operational problem: **the health probe stood in the same queue as the payload.** It had to be a real miniature call, because a plain status endpoint returns success even when the inference engine is dead. On a saturated endpoint it therefore ran into the timeout — and the endpoint was marked down when it was merely busy.

## Five root causes

After sorting, the 18 faults left five causes:

1. **A single routing and slot truth** instead of two decoupled layers. Filter candidates by **capability**, not by name similarity.
2. **Atomic, hard-enforced concurrency.** Real hardware slots as the ceiling, no check-then-act.
3. **Health probing outside the payload queue**, and type-aware.
4. **Detect capacity** instead of hand-maintaining ceilings.
5. **Decouple the profiles** so a guest cannot starve production.

And a sixth wish that turned out to matter most in operation: **the hard levers lived in the code.** Pool composition, ordering, ceilings, context thresholds — all constants. Every change to the hardware meant: change code, ship, hope.

## The database becomes the truth

The central decision of the rebuild is unspectacular and made everything else easier: **everything that decides routing lives in tables. Nothing in the code any more.**

An endpoint registry with URL, engine type, interface format, ceilings for concurrent requests and simultaneously loaded models. Canonical model identifiers plus an alias table for the names clients use. Profiles with priority and quota, plus a permission matrix of profile × endpoint. Configuration as key-value pairs with change history and a reason field.

The heart is a **capability matrix**: one row per endpoint and model, and in that row the exact model name *this* endpoint understands, along with maximum context length, slot count and a preference rank.

Two details from it proved exactly right.

**The endpoint-specific model name.** This is where the model-tag coincidence dies. The client sends an alias, the matrix translates it per endpoint into the string that particular backend expects. No string comparison, no bonus for accidental name equality.

**The preference rank as a column.** The order in which endpoints are preferred is a number. Changing it is an UPDATE, not a deployment. In the UI it is two arrow buttons.

![Capability matrix: one row per endpoint and model, with the endpoint-specific backend name, rank and configured versus detected slots](/blog/llm-lastmanagement-routing-autoritaet/screens/en/matrix.png)

## The engine: candidates, not points

The core is deliberately boring. No contest for the highest score, but a filter over the capability matrix — an endpoint is a candidate or it is not:

- wrong model or wrong task type → not a candidate
- endpoint disabled → not a candidate
- profile has no permission for this endpoint → not a candidate
- requested context longer than the row allows → not a candidate
- endpoint known to be down → not a candidate

The task type in that list is where the 404 from the third section becomes **structurally impossible**: a chat request never sees reranking rows.

Selection among the real candidates is then trivial and deterministic: preference rank ascending, healthy before degraded, then most free slots.

What matters in operation is not the selection but its **reason**: every reservation records *why* this endpoint was chosen — first choice, first choice was full, a pin overrode the rank, a model was taken from a guest. A distribution anomaly can be explained with a single query instead of guessed at.

![Audit trail: per reservation the time, profile, caller, model, endpoint, routing reason and duration](/blog/llm-lastmanagement-routing-autoritaet/screens/en/audit.png)

**Reserve atomically.** The whole cycle — build candidates, count, select, register the slot — runs under one lock. If everything is occupied, the caller waits on a condition variable that is woken on release, with periodic re-evaluation because the registry may have changed meanwhile. The slot-counting leak is no longer a tuning problem; it is gone.

## The complete call specification

The engine does not return "which endpoint" but the **complete specification of the call**: base URL, interface format, task type, the model name valid for this endpoint, the context length to send, the headers. The caller builds its HTTP call from that and makes **no** routing decision itself.

That retires the entire fault class "body does not match endpoint" — not handled, but structurally excluded. The earlier plaster could go.

One detail the GPU node operators had asked for: a header carrying the requesting profile. At the backend it is now possible to see *who* is occupying the card. Previously every request was anonymously the same client.

Context length received a clear authority rule, and it is asymmetric: **enforced outwards**, so no client can provoke a model reload with an inflated value; **capped inwards**, so an internal plan may deliberately request less, but never more than the matrix permits.

## Preemption: model slots, not aborted requests

Some engines have a second, subtler limit: not only how many requests run in parallel, but **how many different models may be loaded at once**.

If a request needs a new model on a node whose model slots are taken, the engine looks for a victim: an active slot of strictly lower priority that is the **sole user of its model**. If several share the same model, unloading would achieve nothing.

The most important part is the negative case. **If no victim is found, the endpoint simply drops out of the candidates for this round.** No error, no thrashing — the next candidate is evaluated. That is the difference between a system that degrades under pressure and one that oscillates.

And for expectations: preemption aborts **no running requests**. A stream runs to completion. What is displaced is only the right to start next.

## Finding capacity by itself

The ceilings used to be set by hand and drifted after every hardware change. After a power cut the cluster came back smaller than before — and nobody noticed, except through a rising rate of rejected requests.

The polling service runs **outside the payload queue**, which was the lesson from the flapping health probe, and it asks in a type-aware way: Prometheus metrics from one engine, the list of loaded models from another, a light reachability check for the rest where a 4xx means "alive" and only 5xx and timeouts mean "down".

Two rules proved essential:

**Detection may only correct downwards.** The reported value is a second source, never an enlargement. A node that misjudges itself cannot overbook the cluster.

**Announced endpoints are never adopted automatically.** If an unknown endpoint appears in a report, there is a warning and a suggestion for the UI — not an entry. A foreign node should not be able to write itself into the routing.

The first detection run promptly produced a finding nobody had before: two endpoints configured with four slots reported **one**. The configured value had been fiction for weeks.

On top of that sits a small control loop: the guest profile's quota automatically follows the sum of healthy, permitted slots — with a floor and two ticks of hysteresis, so a single failed probe does not make the limit jitter. Previously this was a negotiation by document between several parties.

## The cutover: shadow mode and a switch in the database

This is a production machine. A big-bang switch was not an option.

The actual lever is a single configuration key with three consumer groups and three possible values each: old, shadow, new. The configuration is cached for 15 seconds — so an UPDATE takes effect within 15 seconds at the latest, **without a restart**. The rollback is the same UPDATE in reverse.

### The shadow

The most interesting step. In shadow mode the old system still decides and still acts — but every real reservation is **re-decided dry** by the new engine afterwards, and both answers are logged for comparison. No slot is occupied, no latency is added: evaluation happens in memory, writes are batched.

To keep the comparison cheap, "did old and new decide the same?" is not application logic but a generated column in the table. An index scan instead of an evaluation.

After nearly **15,000 comparisons** — four hours of the external batch at full load plus a complete production run — there was a number that hurt at first: **80 % divergence.**

The resolution: every single divergence class was "the new one is right".

| Class | What happened | Assessment |
|---|---|---|
| Overflow | Old placed beyond the real slots; new holds hard ceilings and diverts | new is right |
| Would have waited | At total saturation old placed anyway — the counting leak, observed live | new is right |
| Double occupancy | Old put two production models on a single-slot endpoint **while a guest job was running there** | new is right |
| First choice skipped | The preferred endpoint was considered down by the old health check | correct |

The third case is the moment the shadow mode paid for itself: a problem previously only described in theory was documented **live as it happened** — without anyone having to intervene.

A side finding from the burn-in: the new engine's evaluation time was **103 microseconds** at the 95th percentile, with zero exceptions.

### Switching one group at a time

Three consumer groups, three separate cutovers, each with its own verification step.

The **external interface** first — that is where risk is most controllable and benefit greatest. Verification in a ten-minute window: 321 requests, distribution as expected, zero errors, zero of the feared 404s. The old system drained exactly 16 seconds after the flip — the lifetime of the configuration cache.

Then the **internal consumers**, meaning production. The trick that made this cheap: the slot context data structure stayed **byte-compatible**. Ten internal call sites were not touched; their client identifiers are mapped onto profiles by pattern match. Zero code change at the callers, full visibility by profile.

Last, a neighbouring host that reserves through the interface. That closed the final gap for double occupancy.

For the transition there was a **bridge**: while the old system still held slots in parallel, the new engine counted its active slots too. The slot sets were disjoint, so the sum was the true occupancy. Without that bridge the new engine would have double-booked the same GPUs while production was working on them.

And an interim state that has to be documented honestly: there was a window in which the *reverse* bridge was missing — the old system did not see the new slots. That matched the behaviour from before exactly, so it was no regression, but no improvement either. The emergency lever for it was to withdraw the guest profile's permission for the affected endpoints. Effect: 15 seconds.

## The UI: make the levers visible

The whole rebuild would be worth half as much if control lived in SQL again. So there is a page with five areas.

**Live** — which consumer group runs on which system, the cutover state at a glance. Plus guest quota target versus actual, all active slots with profile, model, endpoint and age on a five-second poll, and endpoint health with an on-off switch.

**Matrix** — the capability matrix. Per row: endpoint, model, context length, configured versus **detected** slots with a marker on divergence, preference rank with arrow buttons, slots editable inline. This is the page that used to require a deployment.

**Profiles** — priorities, quotas, endpoint permissions and the mapping rules. The latter deliberately read-only: who lets which internal service where is not something you change in passing.

**Configuration** — every key with inline editing, change history and a **rollback button**. Every change carries a reason. The cutover itself is an entry here.

**Audit** — the most recent reservations with profile, endpoint, model, routing reason and duration. Six fields, and you know what happened.

Deliberately **not** built: creating new endpoints and one-click adoption of announced endpoints. Both stay in SQL. For actions that extend the topology, a little friction is a feature, not a shortcoming.

## Three findings from operation afterwards

**The bottleneck was the database, not the GPU.** When the external batch ran with 16 parallel workers, the symptom was "no request finishes any more". Obvious suspicion: GPU overloaded. In fact it was the connection pool: the reservation wrote its audit entry in the same call and could not get a connection, because the pool was small and shared with the whole application. Stalls reaching into the half-minute range — **before** the actual model call. The database itself had plenty of headroom: roughly a quarter of the connections in use. Purely client-side.

**A small card beat the large machine.** For embeddings, a measurement showed that a small service on an older card managed roughly **four times more tokens per second** than the large node on short embedding requests. There the embedding service shares memory bandwidth with two chat instances and gets a single slot. Switching the primary route was a rank swap — *almost*. Three layers had to fall before the change took effect: the rank in the new matrix, a pin list in the caller's code, and an entry in the old registry that the health check still consulted. The new endpoint was missing there, was therefore considered down, and sank to the end of the list. A lesson about dual registries: until the clean-up phase is done, a new endpoint has to exist in *both* directories.

**A wave of rejected requests while GPUs sat idle.** The cause was not overload but a request class that, through the context arithmetic, could only run on a *small subset* of the endpoints — a generously set output budget with small input reserves context that only one endpoint offers. That subset was permanently busy, and all the waiters held limiter slots. It became visible through a cross-tabulation of output class against routing reason. The fix was on the client side; the finding came from a database query.

A later stage separated the admission budget **per task type**: chat and embeddings shared one, although they run on different pools — so an enrichment run could starve the embeddings.

## What I take from it

**Two decision layers are one layer too many.** Almost every hard fault came from two places answering the same question. The fix was not better synchronisation but deletion.

**Capability is a filter, not a score.** A scoring system always finds a winner, even when none fits.

**Configuration belongs in tables.** Not for elegance, but because hardware changes and a deployment to alter a preference has the wrong cost structure. Testing a rank change now takes 15 seconds, including the way back.

**A switch in the database beats a feature branch.** Every cutover was reversible, without restart, without deployment — and the history is a row in a table.

**The most expensive part of a distributed system is the time in which nobody knows why it just did that.** Which is why every audit row carries the routing reason. It is the row every diagnosis starts from, and the one measure from this rebuild I would build first in any comparable system.

## Limitations

- **One cluster, one workload, one observer.** The numbers hold for this setup. Whether 80 % divergence is typical or a special case of an unusually accreted legacy system, I cannot say.
- **I assessed the divergence classes myself.** "The new one is right" is a judgement, not a measurement — even though it is justified per class.
- **No A/B comparison of the end states.** What was measured is old against new in the decision, not throughput before against after over a comparable week.
- **Preemption is tailored to engines with model slots.** For engines that hold one model permanently, the mechanism is unnecessary.
- **The pattern suits small, heterogeneous clusters.** With homogeneous hardware at a scale where an established scheduler is a candidate, building your own would be the wrong answer.`,
      faq: [
        {
          q: "How do you distribute load across several local LLM endpoints?",
          a: "Through a single decision point that filters candidates by capability rather than scoring them: matching model, matching task type, permission for the requesting profile, sufficient context length, endpoint not down. Among the real candidates a configured preference rank decides, then the number of free slots. Two layers that are both allowed to decide reliably produce faults.",
        },
        {
          q: "Why is a scoring system problematic for LLM routing?",
          a: "Because it always finds a winner — even when no endpoint can serve the request. In the observed case one endpoint received 100 bonus points for happening to spell the model name the same way as the calling client, and thereby pulled all load onto a single slot. The question «can this endpoint do it at all» belongs before the evaluation, not as a weight inside it.",
        },
        {
          q: "What is a shadow mode in a routing migration?",
          a: "The old system keeps deciding and keeps acting, the new one decides in parallel without effect, and both answers are logged for comparison. No slot is occupied and no latency is added. Here several thousand comparisons produced divergence in well over half the cases — and every divergence class favoured the new system, including a double occupancy that had previously only been described in theory.",
        },
        {
          q: "How do you bound an external guest user without throttling production?",
          a: "Through profiles with priority and a permission matrix of profile × endpoint, plus a quota that automatically follows the sum of healthy permitted slots. Preemption applies only against strictly lower priority and only to models no other slot shares. If no victim is found, the endpoint drops out of the candidates instead of producing an error.",
        },
        {
          q: "Why should a health probe run outside the normal queue?",
          a: "Because a meaningful probe has to be a real miniature call — a plain status endpoint reports success even when the inference engine is dead. If that call sits in the same queue as the payload, it runs into the timeout on a saturated endpoint, and the endpoint is marked down when it is merely busy. That produces flapping between healthy and down.",
        },
        {
          q: "Should LLM endpoint capacity be configured or detected?",
          a: "Both, with clear precedence: configure as the ceiling, detect as a downward correction. The detected value must never enlarge, otherwise a node that misjudges itself can overbook the cluster. In the observed case two endpoints reported one real slot where four were configured — the value had been fiction for weeks and only surfaced through a rising rejection rate.",
        },
        {
          q: "How do you switch routing in production without downtime?",
          a: "With a configuration switch per consumer group and three values: old, shadow, new. If the configuration is cached only briefly, an UPDATE takes effect within seconds and the rollback is the same UPDATE in reverse — no restart, no deployment. While both systems hold slots in parallel you need a bridge that counts the other's occupancy, otherwise the same GPU gets booked twice.",
        },
      ],
      sources: [
        {
          title: "PostgreSQL — generated columns (basis of the divergence evaluation)",
          url: "https://www.postgresql.org/docs/current/ddl-generated-columns.html",
        },
        {
          title: "Python asyncio — locks and conditions for atomic reservation",
          url: "https://docs.python.org/3/library/asyncio-sync.html",
        },
        {
          title: "llama.cpp server — slots and Prometheus metrics",
          url: "https://github.com/ggml-org/llama.cpp/tree/master/tools/server",
        },
        {
          title: "Ollama API — loaded models and keep_alive",
          url: "https://github.com/ollama/ollama/blob/main/docs/api.md",
        },
        {
          title: "SQLAlchemy — connection pooling and pool limits",
          url: "https://docs.sqlalchemy.org/en/20/core/pooling.html",
        },
        {
          title: "Google SRE Book — handling overload",
          url: "https://sre.google/sre-book/handling-overload/",
        },
      ],
    },
  },
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

/**
 * Drafts are excluded from the build by default. `INCLUDE_DRAFTS=1` pulls them in
 * for a local preview build — see `npm run preview` — which also stamps a marker
 * into out/ so the deploy script refuses to upload such a build.
 */
const INCLUDE_DRAFTS = process.env.INCLUDE_DRAFTS === "1";

/** Posts that are actually published, newest first. */
export function getAllPosts() {
  return posts
    .filter((post) => INCLUDE_DRAFTS || !post.draft)
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
    draft: Boolean(post.draft),
    date: post.date,
    updated: post.updated || post.date,
    author: post.author || "Michael Schiffer",
    // Set both together: coAuthor names the human who reviewed and answers
    // for the text, aiGenerated switches on the Article 50 disclosure.
    coAuthor: post.coAuthor || null,
    aiGenerated: Boolean(post.aiGenerated),
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
