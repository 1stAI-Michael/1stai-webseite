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
  legal: {
    form: "JDG (jednoosobowa działalność gospodarcza) — in Gründung",
    formEn: "JDG (Polish sole proprietorship) — registration in progress",
    ceidgStatus: {
      de: "CEIDG-Registrierung in Vorbereitung, geplant Q3/Q4 2026",
      en: "CEIDG registration in preparation, scheduled for Q3/Q4 2026",
    },
    nip: "pending CEIDG",
    regon: "pending CEIDG",
    vatRegime: "Podatek liniowy 19 %, VAT-UE (po rejestracji CEIDG)",
  },
  family: [
    { name: "schifferm.de", url: "https://schifferm.de" },
  ],
};

export function getLocale(rawLang) {
  return siteConfig.locales.includes(rawLang) ? rawLang : siteConfig.defaultLocale;
}
