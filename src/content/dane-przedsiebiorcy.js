// Dane przedsiębiorcy — die polnische Pflichtseite (fA-1652, Michael 26.10.2026).
//
// Warum eigene Seite und nicht nur eine Übersetzung des Impressums: Der Anbieter
// sitzt in Polen. Es gab bisher eine polnische Datenschutzerklärung, aber keine
// polnischen Anbieterangaben — das war die auffällige Lücke.
//
// ⚠️ Die rechtliche Einordnung (ustawa o świadczeniu usług drogą elektroniczną,
// art. 5) ist NICHT geprüft. Diese Seite nennt dieselben Angaben wie das deutsche
// und englische Impressum auf Polnisch; ob der polnische Pflichtkatalog damit
// vollständig erfüllt ist, gehört an einen Anwalt und nicht an diese Datei.
import { siteConfig } from "../lib/site";

const { contact, name, legal } = siteConfig;

export const danePrzedsiebiorcy = {
  title: "Dane przedsiębiorcy",
  updated: "Stan: październik 2026",
  intro:
    "Informacje o przedsiębiorcy świadczącym usługi drogą elektroniczną za pośrednictwem " +
    "serwisu 1stai.eu. Te same dane znajdują się w niemieckiej i angielskiej wersji " +
    "strony informacyjnej.",
  sections: [
    {
      h: "1. Przedsiębiorca",
      b: [
        name,
        contact.founder,
        contact.address.street,
        contact.address.city,
        contact.address.country,
      ].join("\n"),
    },
    {
      h: "2. Forma prawna i rejestracja",
      b:
        "JDG (jednoosobowa działalność gospodarcza), wpisana do CEIDG.\n" +
        "Rozpoczęcie działalności: 2 listopada 2026 r.",
    },
    {
      h: "3. Identyfikatory i podatki",
      b: [
        `NIP: ${legal.nip}`,
        `REGON: ${legal.regon}`,
        `VAT UE: ${legal.vatUe}`,
      ].join("\n"),
    },
    {
      h: "4. Kontakt",
      b: `E-mail: ${contact.email}\nTelefon: ${contact.phone}`,
    },
    {
      h: "5. Ochrona danych osobowych",
      b:
        "Informacje o przetwarzaniu danych osobowych znajdują się w Polityce prywatności " +
        "pod adresem /polityka-prywatnosci/.",
    },
  ],
};
