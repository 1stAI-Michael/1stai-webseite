"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Erscheint NUR im Freigabe-Build (NEXT_PUBLIC_FREIGABE=1) und nie auf der
 * ausgelieferten Seite. Die Marke sitzt am tatsaechlichen Ende des Artikels,
 * die Leiste schwebt darueber.
 *
 * Zwei getrennte Handlungen, mit Absicht:
 *
 *   Anmerkung    jederzeit, auch mitten im Text. Geht sofort raus und traegt
 *                den Abschnitt mit, in dem sie entstanden ist. Das ist der
 *                inhaltliche Beleg — er laesst sich nicht nachtraeglich
 *                herstellen, indem man ans Ende springt.
 *   Freigabe     erst, wenn das Ende sichtbar war. Nimmt die Anmerkungen mit.
 *
 * Aufgezeichnet wird, was gemessen werden kann: dass bis zum Ende gescrollt
 * wurde, wann, und welche Anmerkungen dabei entstanden sind. Nicht, dass
 * gelesen wurde — ein Nachweis, der mehr behauptet als er misst, ist der
 * naechste Auditbefund.
 */
export default function FreigabeBox({ slug, lang, abdruck, titel }) {
  const [unten, setUnten] = useState(false);
  const [entwurf, setEntwurf] = useState("");
  const [notizen, setNotizen] = useState([]);
  const [stand, setStand] = useState(null);
  const [fehler, setFehler] = useState(null);
  const marke = useRef(null);
  const geoeffnet = useRef(null);

  if (geoeffnet.current === null) geoeffnet.current = new Date().toISOString();

  useEffect(() => {
    const el = marke.current;
    if (!el) return undefined;
    const beobachter = new IntersectionObserver(
      (eintraege) => {
        if (eintraege.some((e) => e.isIntersecting)) setUnten(true);
      },
      { threshold: 1 }
    );
    beobachter.observe(el);
    return () => beobachter.disconnect();
  }, []);

  /** Die letzte Ueberschrift oberhalb der Bildschirmmitte — dort steht der Leser. */
  function abschnitt() {
    if (typeof document === "undefined") return null;
    const mitte = window.innerHeight / 2;
    let letzte = null;
    for (const h of document.querySelectorAll("article h2, article h1")) {
      if (h.getBoundingClientRect().top <= mitte) letzte = h.textContent.trim();
    }
    return letzte;
  }

  async function senden(nutzlast) {
    const antwort = await fetch("/freigabe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, lang, titel, abdruck, ...nutzlast }),
    });
    const daten = await antwort.json();
    if (!antwort.ok) throw new Error(daten.grund || `HTTP ${antwort.status}`);
    return daten;
  }

  async function notieren() {
    const text = entwurf.trim();
    if (!text) return;
    setFehler(null);
    try {
      const d = await senden({
        art: "notiz",
        text,
        abschnitt: abschnitt(),
        zeit: new Date().toISOString(),
      });
      setNotizen((bisher) => [...bisher, d.notiz]);
      setEntwurf("");
    } catch (f) {
      setFehler(String(f.message || f));
    }
  }

  async function freigeben() {
    setFehler(null);
    setStand("sendet");
    try {
      const d = await senden({
        art: "freigabe",
        abschliessend: entwurf.trim(),
        bisUntenGesehen: unten,
        geoeffnet: geoeffnet.current,
        freigegeben: new Date().toISOString(),
        pfad: typeof location === "undefined" ? null : location.pathname,
      });
      setStand(d);
    } catch (f) {
      setStand(null);
      setFehler(String(f.message || f));
    }
  }

  const fertig = stand && stand.akte;

  return (
    <>
      <div ref={marke} aria-hidden="true" style={{ height: 1 }} />
      <div
        data-freigabe-box="true"
        className="fixed inset-x-0 bottom-0 z-50 max-h-[60vh] overflow-y-auto border-t-2 border-primary bg-white/95 px-4 py-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-2 font-body text-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <strong className="font-heading text-ink">Freigabe</strong>
            <span className="text-ink-muted">
              {slug} · {lang} · Fassung {abdruck.slice(0, 8)}
            </span>
            <span className={unten ? "text-primary" : "text-ink-muted"}>
              {unten ? "bis zum Ende gescrollt" : "noch nicht bis zum Ende gescrollt"}
            </span>
            <span className="text-ink-muted">
              {notizen.length} Anmerkung{notizen.length === 1 ? "" : "en"}
            </span>
          </div>

          {notizen.length > 0 ? (
            <ol className="max-h-32 overflow-y-auto rounded-lg bg-ink-subtle px-3 py-2 text-xs text-ink-muted">
              {notizen.map((n, i) => (
                <li key={`${n.zeit}-${i}`} className="py-0.5">
                  <span className="text-ink">{n.abschnitt || "Anfang"}</span> ·{" "}
                  {n.zeit.slice(11, 19)} — {n.text}
                </li>
              ))}
            </ol>
          ) : null}

          {fertig ? (
            <p className="text-ink">
              Eingetragen: <code>{stand.akte}</code> — {stand.zeit}, {stand.notizen} Anmerkung
              {stand.notizen === 1 ? "" : "en"} mitgespeichert.
            </p>
          ) : (
            <>
              <textarea
                value={entwurf}
                onChange={(e) => setEntwurf(e.target.value)}
                rows={2}
                placeholder="Anmerkung zu dieser Stelle — jederzeit, auch mitten im Text"
                className="w-full rounded-lg border border-ink-subtle px-3 py-2"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!entwurf.trim()}
                  onClick={notieren}
                  className="rounded-lg border border-primary px-4 py-2 font-heading font-semibold text-primary disabled:cursor-not-allowed disabled:border-ink-subtle disabled:text-ink-muted"
                >
                  Anmerkung festhalten
                </button>
                <button
                  type="button"
                  disabled={!unten || stand === "sendet"}
                  onClick={freigeben}
                  className="rounded-lg bg-primary px-5 py-2 font-heading font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink-subtle disabled:text-ink-muted"
                >
                  {stand === "sendet" ? "…" : "Gesehen und freigegeben"}
                </button>
                <span className="text-xs text-ink-muted">
                  Anmerkungen gehen sofort in die Akte, auch ohne Freigabe. Die Freigabe haengt
                  an dieser Fassung; aendert sich ein Zeichen am Text, gilt sie nicht mehr.
                </span>
              </div>
              {fehler ? <p className="text-primary-deep">Nicht eingetragen: {fehler}</p> : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
