import Link from "next/link";
import WerkzeugFooter from "../components/WerkzeugFooter";

/**
 * Eigene 404-Seite (Michael-Entscheid 02.11.2026).
 *
 * Vorher lieferte der Webspace eine nackte Server-Seite aus — 295 Byte, kein
 * Name, kein Rechtslink, kein Weg zurueck. Gemessen am 02.11.2026 an einer
 * erfundenen Adresse: HTTP 404, "<h1>Not Found</h1>", sonst nichts.
 *
 * Die Seite liegt wie /Recorder/ als Top-Level-Route NEBEN dem `[lang]`-Segment
 * und bekommt dessen Layout nicht — deshalb hier derselbe WerkzeugFooter wie
 * dort (Nachaudit F01, gleiche Ursache).
 *
 * Damit Apache sie ueberhaupt zeigt, braucht es `ErrorDocument 404 /404.html`
 * in der `.htaccess` im Projektwurzelverzeichnis; der Deploy laedt sie mit hoch
 * (scripts/deploy-webspace.sh, Zeile ~116). Ohne diese Zeile wird die Datei
 * gebaut, hochgeladen — und nie ausgeliefert.
 *
 * Zweisprachig ohne Spracherkennung: Welche Sprache der Besucher wollte, weiss
 * die Seite nicht; die Adresse, die ihn hergefuehrt hat, gibt es ja nicht.
 * Lieber beide Saetze als eine geratene Sprache.
 */
export default function NotFound() {
  return (
    <>
      <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col justify-center px-6 py-20">
        <p className="font-mono text-sm text-ink-muted">404</p>

        <h1 className="mt-3 font-heading text-3xl font-bold text-ink sm:text-4xl">
          Diese Seite gibt es nicht
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-muted">
          Die Adresse führt ins Leere — vertippt, veraltet oder von uns verschoben.
        </p>

        {/* Eigenes lang-Attribut: Das Dokument steht auf "de" (Haupttext),
            dieser Block ist englisch. Ohne die Auszeichnung liest ein
            Vorleseprogramm ihn mit deutscher Aussprache — derselbe Fehler, der
            am 23.09.2026 fuer die ganze Seite behoben wurde, nur eine Ebene
            tiefer. */}
        <div lang="en">
          <h2 className="mt-8 font-heading text-xl font-semibold text-ink">
            This page does not exist
          </h2>
          <p className="mt-2 text-base leading-relaxed text-ink-muted">
            The address leads nowhere — mistyped, outdated, or moved.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/de/"
            className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Zur Startseite
          </Link>
          <Link
            href="/en/"
            className="rounded-full border border-ink-subtle px-5 py-2 text-sm font-semibold text-ink transition hover:border-ink-muted"
          >
            English home
          </Link>
          <Link
            href="/de/blog/"
            className="rounded-full border border-ink-subtle px-5 py-2 text-sm font-semibold text-ink transition hover:border-ink-muted"
          >
            Blog
          </Link>
          <Link
            href="/de/kontakt/"
            className="rounded-full border border-ink-subtle px-5 py-2 text-sm font-semibold text-ink transition hover:border-ink-muted"
          >
            Kontakt / Contact
          </Link>
        </div>
      </main>

      <WerkzeugFooter lang="de" />
    </>
  );
}
