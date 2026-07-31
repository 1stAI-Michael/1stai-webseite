// Privacy policy / Datenschutzerklärung / Polityka prywatności
// Scope: coming-soon website without analytics, tracking, contact forms or cookies.
// Update when adding any of: forms, analytics, embedded media, newsletter.
import { siteConfig } from "../lib/site";

const { contact, name } = siteConfig;
const adminBlock = (lang) => {
  const lines = [
    name,
    contact.founder,
    contact.address.street,
    contact.address.city,
    contact.address.country,
    `E-Mail: ${contact.email}`,
    `${lang === "de" ? "Telefon" : lang === "pl" ? "Telefon" : "Phone"}: ${contact.phone}`,
  ];
  return lines.join("\n");
};

export const privacy = {
  de: {
    slug: "datenschutz",
    title: "Datenschutzerklärung",
    intro:
      "Diese Datenschutzerklärung informiert über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten bei Besuch und Nutzung von 1stai.eu. Maßgeblich ist die Verordnung (EU) 2016/679 (DSGVO/RODO) sowie das polnische Datenschutzrecht.",
    sections: [
      {
        h: "1. Verantwortlicher (Administrator danych)",
        b: adminBlock("de"),
      },
      {
        h: "2. Erhobene Daten und Zwecke",
        b: "Bei einer Kontaktaufnahme per E-Mail oder Telefon verarbeiten wir die von Ihnen mitgeteilten Daten (Name, Kontaktangaben, Inhalt der Nachricht) zum Zweck der Beantwortung Ihrer Anfrage und einer eventuellen Geschäftsanbahnung.\n\nBeim Aufruf der Website verarbeitet unser Hosting-Anbieter automatisch Server-Logdaten (IP-Adresse, Datum, Uhrzeit, abgerufene Ressource, Referrer, User-Agent). Diese Daten werden ausschließlich zur Bereitstellung des Dienstes und zur Abwehr technischer Angriffe verarbeitet und nach kurzer Frist gelöscht.",
      },
      {
        h: "3. Rechtsgrundlage",
        b: "Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung/Erfüllung) für die Bearbeitung Ihrer Anfrage; Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem stabilen, sicheren Betrieb) für die Server-Logdaten.",
      },
      {
        h: "4. Cookies, Tracking, Analyse",
        b: "Diese Website setzt aktuell keine Cookies, kein Tracking, keine Reichweitenmessung und keine eingebetteten Inhalte Dritter ein. Es findet kein Profiling statt.",
      },
      {
        h: "5. Empfänger und Auftragsverarbeitung",
        b: "Hosting: Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland — auf Grundlage eines Auftragsverarbeitungsvertrags. Eine Datenübermittlung in Drittländer außerhalb des EWR findet nicht statt.",
      },
      {
        h: "6. Speicherdauer",
        b: "E-Mail-Korrespondenz wird so lange aufbewahrt, wie es für die Bearbeitung erforderlich ist, danach gemäß steuer- und handelsrechtlicher Pflichten. Server-Logs werden vom Hosting-Anbieter kurzfristig gelöscht.",
      },
      {
        h: "7. Ihre Rechte",
        b: "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Beschwerden können Sie bei der zuständigen Aufsichtsbehörde einlegen — in Polen: Prezes Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.",
      },
      {
        h: "8. Bereitstellung der Daten",
        b: "Die Bereitstellung Ihrer Kontaktdaten ist freiwillig, jedoch zur Beantwortung Ihrer Anfrage erforderlich.",
      },
      {
        h: "9. Änderungen",
        b: "Diese Datenschutzerklärung wird angepasst, sobald sich die tatsächliche Datenverarbeitung ändert (z. B. Einbindung von Analyse, Kontaktformular, Newsletter).",
      },
    ],
    updated: "Stand: Juni 2026",
  },
  en: {
    slug: "privacy",
    title: "Privacy Policy",
    intro:
      "This privacy policy describes how personal data is processed when you visit or use 1stai.eu. Processing is governed by Regulation (EU) 2016/679 (GDPR/RODO) and applicable Polish data protection law.",
    sections: [
      {
        h: "1. Controller (Administrator danych)",
        b: adminBlock("en"),
      },
      {
        h: "2. Data collected and purposes",
        b: "If you contact us by email or phone, we process the data you provide (name, contact details, content of your message) for the purpose of responding to your inquiry and any potential business engagement.\n\nWhen you visit the website, our hosting provider automatically processes server log data (IP address, date, time, requested resource, referrer, user agent). This data is used solely to operate the service and defend against technical attacks; it is deleted after a short period.",
      },
      {
        h: "3. Legal basis",
        b: "Art. 6(1)(b) GDPR (pre-contractual measures / contract performance) for handling your inquiry; Art. 6(1)(f) GDPR (legitimate interest in stable, secure operation) for server log data.",
      },
      {
        h: "4. Cookies, tracking, analytics",
        b: "This website does not currently use cookies, tracking, analytics, or embedded third-party content. No profiling takes place.",
      },
      {
        h: "5. Recipients and processors",
        b: "Hosting: Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Germany — under a data processing agreement. No transfer of personal data to third countries outside the EEA occurs.",
      },
      {
        h: "6. Retention",
        b: "Email correspondence is kept for as long as needed to handle the matter, then according to applicable tax and commercial retention obligations. Server logs are deleted by the hosting provider after a short period.",
      },
      {
        h: "7. Your rights",
        b: "You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20) and objection (Art. 21). You may lodge a complaint with the supervisory authority — in Poland: Prezes Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.",
      },
      {
        h: "8. Provision of data",
        b: "Providing your contact data is voluntary but necessary to receive a response to your inquiry.",
      },
      {
        h: "9. Changes",
        b: "This policy will be updated if actual data processing changes (e.g. introduction of analytics, contact forms or a newsletter).",
      },
    ],
    updated: "Last updated: June 2026",
  },
  pl: {
    slug: "polityka-prywatnosci",
    title: "Polityka prywatności",
    intro:
      "Niniejsza polityka prywatności opisuje, w jaki sposób przetwarzane są dane osobowe podczas odwiedzania i korzystania ze strony 1stai.eu. Przetwarzanie odbywa się zgodnie z Rozporządzeniem (UE) 2016/679 (RODO) oraz obowiązującymi przepisami polskiego prawa o ochronie danych.",
    sections: [
      {
        h: "1. Administrator danych",
        b: adminBlock("pl"),
      },
      {
        h: "2. Zbierane dane i cele",
        b: "W przypadku kontaktu drogą e-mailową lub telefoniczną przetwarzamy podane przez Państwa dane (imię i nazwisko, dane kontaktowe, treść wiadomości) w celu udzielenia odpowiedzi na zapytanie oraz ewentualnego nawiązania współpracy.\n\nPodczas wizyty na stronie nasz dostawca hostingu automatycznie przetwarza dane logów serwera (adres IP, data, godzina, żądany zasób, referrer, user-agent). Dane te służą wyłącznie do świadczenia usługi oraz obrony przed atakami technicznymi i są usuwane po krótkim okresie.",
      },
      {
        h: "3. Podstawa prawna",
        b: "Art. 6 ust. 1 lit. b RODO (działania przed zawarciem umowy / wykonanie umowy) — w odniesieniu do obsługi Państwa zapytania; art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes administratora w zakresie stabilnego i bezpiecznego działania serwisu) — w odniesieniu do logów serwera.",
      },
      {
        h: "4. Pliki cookies, śledzenie, analityka",
        b: "Strona obecnie nie wykorzystuje plików cookies, narzędzi śledzących, analityki ani osadzonych treści podmiotów trzecich. Nie dokonujemy profilowania.",
      },
      {
        h: "5. Odbiorcy i procesorzy",
        b: "Hosting: Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Niemcy — na podstawie umowy powierzenia przetwarzania danych. Dane nie są przekazywane do państw trzecich poza EOG.",
      },
      {
        h: "6. Okres przechowywania",
        b: "Korespondencja e-mailowa jest przechowywana przez okres niezbędny do obsługi sprawy, a następnie zgodnie z obowiązkami podatkowymi i handlowymi. Logi serwera są usuwane przez dostawcę hostingu po krótkim okresie.",
      },
      {
        h: "7. Państwa prawa",
        b: "Przysługuje Państwu prawo dostępu do danych (art. 15 RODO), sprostowania (art. 16), usunięcia (art. 17), ograniczenia przetwarzania (art. 18), przenoszenia danych (art. 20) oraz sprzeciwu (art. 21). Mogą Państwo wnieść skargę do organu nadzorczego — w Polsce: Prezes Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.",
      },
      {
        h: "8. Dobrowolność podania danych",
        b: "Podanie danych kontaktowych jest dobrowolne, jednak konieczne do udzielenia odpowiedzi na Państwa zapytanie.",
      },
      {
        h: "9. Zmiany",
        b: "Polityka będzie aktualizowana w przypadku zmiany faktycznego sposobu przetwarzania danych (np. wprowadzenie analityki, formularza kontaktowego lub newslettera).",
      },
    ],
    updated: "Stan: czerwiec 2026",
  },
};
