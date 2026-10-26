export const siteConfig = {
  name: "Michael Schiffer 1stAI",
  shortName: "1stAI",
  tagline: {
    en: "AI consulting for teams that ship.",
    de: "KI-Beratung für Teams, die liefern.",
  },
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://1stai.eu",
  defaultLocale: "en",
  locales: ["en", "de"],
  contact: {
    email: "schiffer@1stai.eu",
    phone: "+48 572 059 110",
    phoneRaw: "+48572059110",
    founder: "Michael Schiffer",
    address: {
      street: "ul. Sportowa 9",
      city: "55-311 Kostomłoty",
      country: "Polska",
    },
  },
  // Quelle: CEIDG-Ausdruck vom 18.10.2026 und VAT-5UE vom 21.10.2026
  // (US Środa Śląska). Pruefziffern von NIP und REGON nachgerechnet.
  legal: {
    form: "JDG (jednoosobowa działalność gospodarcza), eingetragen im CEIDG",
    formEn: "JDG (Polish sole proprietorship), registered with CEIDG",
    ceidgStatus: {
      de: "Tätigkeitsbeginn: 2. November 2026",
      en: "Start of activity: 2 November 2026",
    },
    nip: "9131646486",
    regon: "545934189",
    // Auf Michaels Ansage vom 26.10.2026 veroeffentlicht. VIES wies die Nummer
    // an diesem Tag noch zurueck (isValid: false, 17:18 UTC); die Eintragung
    // wirkt vermutlich ab 10.11.2026. Ab dann ist die Zeile auch von aussen
    // pruefbar — vorher nicht.
    vatUe: "PL9131646486",
    vatRegime: "Podatek liniowy 19 %",
  },
  family: [
    { name: "schifferm.de", url: "https://schifferm.de" },
  ],
};

export function getLocale(rawLang) {
  return siteConfig.locales.includes(rawLang) ? rawLang : siteConfig.defaultLocale;
}
