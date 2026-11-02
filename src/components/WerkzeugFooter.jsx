import Footer from "./Footer";

/**
 * Rechtszeile fuer die Werkzeug-Ansichten (/Recorder/, /Settings/, /atemuebung/).
 *
 * Diese drei Routen liegen als Top-Level-Routen NEBEN dem `[lang]`-Segment und
 * bekommen deshalb das Layout aus `src/app/[lang]/layout.jsx` nicht — und damit
 * auch nicht den Footer. Bis zum Nachaudit vom 02.11.2026 (F01) standen sie
 * dadurch ohne Impressum, ohne Datenschutzlink und ohne Anschrift online.
 *
 * Bewusst der ECHTE Footer, kein nachgebauter: Anschrift, NIP und REGON stehen
 * damit weiter nur in `src/lib/site.js`. Ein zweiter Rechtstext waere eine
 * zweite Wahrheit, die beim naechsten Umzug stillschweigend veraltet.
 *
 * Der Rahmen hier setzt die Trennlinie sichtbar: der Footer bringt
 * `border-ink-subtle` (#F4F5F0) mit, und das verschwindet auf dem weissen
 * Hintergrund der Werkzeug-Seiten.
 */
export default function WerkzeugFooter({ lang = "de" }) {
  return (
    <div className="mt-8 border-t border-slate-200 bg-white">
      <Footer lang={lang} />
    </div>
  );
}
