"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Erscheint NUR im Freigabe-Build (NEXT_PUBLIC_FREIGABE=1) und nie auf der
 * ausgelieferten Seite. Die Marke sitzt am tatsaechlichen Ende des Artikels,
 * die Leiste schwebt darueber.
 *
 * Aufgezeichnet wird, dass bis zum Ende gescrollt wurde — nicht, dass gelesen
 * wurde. Das steht auch in der Box: ein Nachweis, der mehr behauptet als er
 * misst, ist der Anfang vom nächsten Auditbefund.
 */
export default function FreigabeBox({ slug, lang, abdruck, titel }) {
  const [unten, setUnten] = useState(false);
  const [kommentar, setKommentar] = useState("");
  const [stand, setStand] = useState(null);
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

  async function freigeben() {
    setStand("sendet");
    try {
      const antwort = await fetch("/freigabe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          slug,
          lang,
          titel,
          abdruck,
          kommentar,
          bisUntenGesehen: unten,
          geoeffnet: geoeffnet.current,
          freigegeben: new Date().toISOString(),
          pfad: typeof location === "undefined" ? null : location.pathname,
        }),
      });
      const d = await antwort.json();
      setStand(antwort.ok ? { ok: true, ...d } : { ok: false, ...d });
    } catch (fehler) {
      setStand({ ok: false, grund: String(fehler) });
    }
  }

  const fertig = stand && stand.ok;

  return (
    <>
      <div ref={marke} aria-hidden="true" style={{ height: 1 }} />
      <div
        data-freigabe-box="true"
        className="fixed inset-x-0 bottom-0 z-50 border-t-2 border-primary bg-white/95 px-4 py-3 backdrop-blur"
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
          </div>

          {fertig ? (
            <p className="text-ink">
              Eingetragen: <code>{stand.akte}</code> — {stand.zeit}
            </p>
          ) : (
            <>
              <textarea
                value={kommentar}
                onChange={(e) => setKommentar(e.target.value)}
                rows={2}
                placeholder="Anmerkung (optional) — was geaendert werden soll, bevor es rausgeht"
                className="w-full rounded-lg border border-ink-subtle px-3 py-2"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!unten || stand === "sendet"}
                  onClick={freigeben}
                  className="rounded-lg bg-primary px-5 py-2 font-heading font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink-subtle disabled:text-ink-muted"
                >
                  {stand === "sendet" ? "…" : "Gesehen und freigegeben"}
                </button>
                <span className="text-xs text-ink-muted">
                  Festgehalten wird, dass die Seite bis zum Ende gescrollt wurde — nicht,
                  dass sie gelesen wurde. Die Akte haengt an dieser Fassung; aendert sich
                  ein Zeichen am Text, gilt sie nicht mehr.
                </span>
              </div>
              {stand && !stand.ok ? (
                <p className="text-primary-deep">Nicht eingetragen: {stand.grund}</p>
              ) : null}
            </>
          )}
        </div>
      </div>
    </>
  );
}
