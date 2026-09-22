/**
 * Freigabe — der Nachweis, dass ein Mensch die Seite gesehen hat, bevor sie
 * hinausging. Der Auditor hat am 22.09.2026 angemerkt, dass sich genau das von
 * aussen nicht belegen laesst; eine Zusage im Chat ist kein Nachweis.
 *
 * Der Abdruck geht ueber den INHALT, nicht ueber die gerenderte Seite. Das ist
 * der Punkt, an dem es sonst kippt: Der Freigabe-Build traegt eine Box, die der
 * Produktions-Build nicht hat, ein Abdruck ueber das HTML waere danach wertlos.
 * Gebunden wird an das, was freigegeben wurde.
 */

import crypto from "node:crypto";

/**
 * Beitraege von vor diesem Tag brauchen keine Akte. Nicht aus Bequemlichkeit:
 * Eine heute geschriebene Akte ueber eine Ansicht von gestern waere erfunden,
 * und ein erfundener Nachweis ist schlechter als ein fehlender. Dieselbe
 * Entscheidung wie beim Altbestand der KI-Kennzeichnung (Michael, 22.09.2026).
 */
export const FREIGABE_SEIT = "2026-09-23";

export function freigabePflichtig(post) {
  return String(post?.date || "") >= FREIGABE_SEIT;
}

/**
 * Feste Feldreihenfolge, damit derselbe Inhalt denselben Abdruck ergibt und
 * eine geaenderte Reihenfolge im Quelltext ihn nicht verschiebt.
 */
function kanonisch(post) {
  return JSON.stringify([
    post.slug,
    post.lang,
    post.date,
    post.updated,
    post.author,
    post.coAuthor,
    Boolean(post.aiGenerated),
    Boolean(post.coverAiGenerated),
    post.articleSection,
    post.title,
    post.excerpt,
    post.coverAlt,
    post.bodyMarkdown,
    post.tags || [],
    (post.faq || []).map((f) => [f.q, f.a]),
    (post.sources || []).map((s) => [s.title, s.url]),
  ]);
}

export function inhaltsAbdruck(post) {
  return crypto.createHash("sha256").update(kanonisch(post)).digest("hex");
}

export function aktenName(slug, lang) {
  return `${slug}.${lang}.json`;
}
