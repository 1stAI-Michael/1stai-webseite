// Privacy policy / Datenschutzerklärung / Polityka prywatności
// Scope: coming-soon website without analytics, tracking, contact forms or cookies.
// Update when adding any of: forms, analytics, embedded media, newsletter.
import { siteConfig } from "../lib/site";

const { contact, name, legal } = siteConfig;
// NIP und REGON gehoeren in den Verantwortlichen-Block: Sie identifizieren den
// Verantwortlichen eindeutig, und ohne sie ist er fuer eine Aufsichtsbehoerde
// nur ueber den Namen auffindbar. Ergaenzt am 26.10.2026, nachdem die
// CEIDG-Eintragung vorlag (fA-1652).
const adminBlock = (lang) => {
  const lines = [
    name,
    contact.founder,
    contact.address.street,
    contact.address.city,
    contact.address.country,
    `NIP: ${legal.nip}`,
    `REGON: ${legal.regon}`,
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
        b: "Bei einer Kontaktaufnahme per E-Mail oder Telefon verarbeiten wir die von Ihnen mitgeteilten Daten (Name, Kontaktangaben, Inhalt der Nachricht) zum Zweck der Beantwortung Ihrer Anfrage und einer eventuellen Geschäftsanbahnung.\n\nBeim Aufruf der Website verarbeitet unser Hosting-Anbieter automatisch Server-Logdaten (IP-Adresse, Datum, Uhrzeit, abgerufene Ressource, Referrer, User-Agent). Diese Daten werden ausschließlich zur Bereitstellung des Dienstes und zur Abwehr technischer Angriffe verarbeitet und nach sieben Tagen gelöscht.",
      },
      {
        h: "3. Recorder und HRV-Atemübung (Demo-Werkzeuge)",
        b:
          "Unter /Recorder/ und /atemuebung/ stehen zwei interaktive Werkzeuge bereit.\n\nDer Recorder ist ein Demonstrationswerkzeug für Vorführungen in Praxen und nicht für den allgemeinen oder produktiven Gebrauch bestimmt. Es sind ausschließlich erfundene Testangaben einzugeben; echte Patientendaten gehören nicht hinein. Aufnahmen und die optionalen Felder (Kennung, Geburtsdatum, Thema) werden im Browser des Geräts gespeichert und verlassen es nicht von selbst. Eine Übertragung an einen Server ist technisch nur möglich, wenn Server-Adresse, Geräte-Kennung und ein gültiges Zugangs-Token eingerichtet sind — ab Werk ist keine dieser drei Angaben gesetzt, und ohne sie findet keine Übertragung statt.\n\nWird der Recorder im Auftrag einer Praxis mit einem von dieser bereitgestellten Server betrieben, ist die Praxis Verantwortliche und 1stAI Auftragsverarbeiter; die Einzelheiten regelt dann ein Vertrag nach Art. 28 DSGVO. Ohne eine solche Einrichtung verarbeitet 1stAI über dieses Werkzeug keine personenbezogenen Daten.\n\nDie HRV-Atemübung läuft vollständig im Browser und überträgt keine Daten an einen Server.",
      },
      {
        h: "4. Rechtsgrundlage",
        b: "Art. 6 Abs. 1 lit. b DSGVO (Vertragsanbahnung/Erfüllung) für die Bearbeitung Ihrer Anfrage; Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem stabilen, sicheren Betrieb) für die Server-Logdaten.",
      },
      {
        h: "5. Cookies, Tracking, Analyse",
        b: "Diese Website setzt aktuell keine Cookies, kein Tracking, keine Reichweitenmessung und keine eingebetteten Inhalte Dritter ein. Es findet kein Profiling statt.",
      },
      {
        h: "6. Empfänger und Auftragsverarbeitung",
        b: "Hosting: Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Deutschland — auf Grundlage eines Auftragsverarbeitungsvertrags. Eine Datenübermittlung in Drittländer außerhalb des EWR findet nicht statt.",
      },
      {
        h: "7. Speicherdauer",
        b: "E-Mail-Korrespondenz wird so lange aufbewahrt, wie es für die Bearbeitung erforderlich ist, danach gemäß steuer- und handelsrechtlicher Pflichten.\n\nServer-Logdaten (Weblogs) werden nach sieben Tagen gelöscht. Diese Frist ist beim Hosting-Anbieter ausdrücklich eingestellt; ohne eine solche Einstellung würden Weblogs dort nach Angabe des Anbieters gar nicht gelöscht.\n\nIn Postfächern werden die Ordner Spam und Papierkorb nach 14 Tagen geleert. Für Mailserver-Protokolle und verschlüsselte Sicherungen nennt der Hosting-Anbieter sieben beziehungsweise vierzehn Tage; diese Fristen liegen bei ihm und sind von uns nicht einstellbar.",
      },
      {
        h: "8. Ihre Rechte",
        b: "Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch (Art. 21). Beschwerden können Sie bei der zuständigen Aufsichtsbehörde einlegen — in Polen: Prezes Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.",
      },
      {
        h: "9. Bereitstellung der Daten",
        b: "Die Bereitstellung Ihrer Kontaktdaten ist freiwillig, jedoch zur Beantwortung Ihrer Anfrage erforderlich.",
      },
      {
        h: "10. Änderungen",
        b: "Diese Datenschutzerklärung wird angepasst, sobald sich die tatsächliche Datenverarbeitung ändert (z. B. Einbindung von Analyse, Kontaktformular, Newsletter).",
      },
    ],
    updated: "Stand: Oktober 2026",
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
        b: "If you contact us by email or phone, we process the data you provide (name, contact details, content of your message) for the purpose of responding to your inquiry and any potential business engagement.\n\nWhen you visit the website, our hosting provider automatically processes server log data (IP address, date, time, requested resource, referrer, user agent). This data is used solely to operate the service and defend against technical attacks; it is deleted after seven days.",
      },
      {
        h: "3. Recorder and HRV breathing exercise (demo tools)",
        b:
          "Two interactive tools are available at /Recorder/ and /atemuebung/.\n\nThe Recorder is a demonstration tool for presentations in medical practices and is not intended for general or productive use. Only invented test entries should be used; real patient data does not belong in it. Recordings and the optional fields (identifier, date of birth, topic) are stored in the browser on the device and do not leave it by themselves. Transmission to a server is technically possible only if a server address, a device identifier and a valid access token have been configured — none of these three is set by default, and without them no transmission takes place.\n\nWhere the Recorder is operated on behalf of a practice using a server provided by that practice, the practice is the controller and 1stAI acts as processor; the details are then governed by a contract under Art. 28 GDPR. Without such a setup, 1stAI does not process any personal data through this tool.\n\nThe HRV breathing exercise runs entirely in the browser and transmits no data to any server.",
      },
      {
        h: "4. Legal basis",
        b: "Art. 6(1)(b) GDPR (pre-contractual measures / contract performance) for handling your inquiry; Art. 6(1)(f) GDPR (legitimate interest in stable, secure operation) for server log data.",
      },
      {
        h: "5. Cookies, tracking, analytics",
        b: "This website does not currently use cookies, tracking, analytics, or embedded third-party content. No profiling takes place.",
      },
      {
        h: "6. Recipients and processors",
        b: "Hosting: Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Germany — under a data processing agreement. No transfer of personal data to third countries outside the EEA occurs.",
      },
      {
        h: "7. Retention",
        b: "Email correspondence is kept for as long as needed to handle the matter, then according to applicable tax and commercial retention obligations.\n\nServer log data (web logs) is deleted after seven days. This period is explicitly configured at the hosting provider; without such a setting, the provider states that web logs would not be deleted at all.\n\nIn mailboxes, the Spam and Trash folders are emptied after 14 days. For mail server logs and encrypted backups the hosting provider states seven and fourteen days respectively; those periods sit with the provider and cannot be configured by us.",
      },
      {
        h: "8. Your rights",
        b: "You have the right of access (Art. 15 GDPR), rectification (Art. 16), erasure (Art. 17), restriction (Art. 18), data portability (Art. 20) and objection (Art. 21). You may lodge a complaint with the supervisory authority — in Poland: Prezes Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.",
      },
      {
        h: "9. Provision of data",
        b: "Providing your contact data is voluntary but necessary to receive a response to your inquiry.",
      },
      {
        h: "10. Changes",
        b: "This policy will be updated if actual data processing changes (e.g. introduction of analytics, contact forms or a newsletter).",
      },
    ],
    updated: "Last updated: October 2026",
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
        b: "W przypadku kontaktu drogą e-mailową lub telefoniczną przetwarzamy podane przez Państwa dane (imię i nazwisko, dane kontaktowe, treść wiadomości) w celu udzielenia odpowiedzi na zapytanie oraz ewentualnego nawiązania współpracy.\n\nPodczas wizyty na stronie nasz dostawca hostingu automatycznie przetwarza dane logów serwera (adres IP, data, godzina, żądany zasób, referrer, user-agent). Dane te służą wyłącznie do świadczenia usługi oraz obrony przed atakami technicznymi i są usuwane po siedmiu dniach.",
      },
      {
        h: "3. Recorder i ćwiczenie oddechowe HRV (narzędzia demonstracyjne)",
        b:
          "Pod adresami /Recorder/ oraz /atemuebung/ dostępne są dwa narzędzia interaktywne.\n\nRecorder jest narzędziem demonstracyjnym przeznaczonym do prezentacji w gabinetach i nie służy do użytku ogólnego ani produkcyjnego. Należy wprowadzać wyłącznie fikcyjne dane testowe; rzeczywiste dane pacjentów nie powinny być w nim wprowadzane. Nagrania oraz pola opcjonalne (identyfikator, data urodzenia, temat) są zapisywane w przeglądarce na urządzeniu i same z niego nie wychodzą. Przesłanie na serwer jest technicznie możliwe wyłącznie wtedy, gdy skonfigurowano adres serwera, identyfikator urządzenia oraz ważny token dostępu — żadna z tych trzech wartości nie jest ustawiona domyślnie, a bez nich transmisja nie następuje.\n\nJeżeli Recorder jest używany na zlecenie gabinetu, na serwerze udostępnionym przez ten gabinet, administratorem danych jest gabinet, a 1stAI działa jako podmiot przetwarzający; szczegóły reguluje wówczas umowa z art. 28 RODO. Bez takiej konfiguracji 1stAI nie przetwarza za pomocą tego narzędzia żadnych danych osobowych.\n\nĆwiczenie oddechowe HRV działa w całości w przeglądarce i nie przesyła danych na serwer.",
      },
      {
        h: "4. Podstawa prawna",
        b: "Art. 6 ust. 1 lit. b RODO (działania przed zawarciem umowy / wykonanie umowy) — w odniesieniu do obsługi Państwa zapytania; art. 6 ust. 1 lit. f RODO (prawnie uzasadniony interes administratora w zakresie stabilnego i bezpiecznego działania serwisu) — w odniesieniu do logów serwera.",
      },
      {
        h: "5. Pliki cookies, śledzenie, analityka",
        b: "Strona obecnie nie wykorzystuje plików cookies, narzędzi śledzących, analityki ani osadzonych treści podmiotów trzecich. Nie dokonujemy profilowania.",
      },
      {
        h: "6. Odbiorcy i procesorzy",
        b: "Hosting: Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Niemcy — na podstawie umowy powierzenia przetwarzania danych. Dane nie są przekazywane do państw trzecich poza EOG.",
      },
      {
        h: "7. Okres przechowywania",
        b: "Korespondencja e-mailowa jest przechowywana przez okres niezbędny do obsługi sprawy, a następnie zgodnie z obowiązkami podatkowymi i handlowymi.\n\nLogi serwera WWW są usuwane po siedmiu dniach. Okres ten został wyraźnie ustawiony u dostawcy hostingu; bez takiego ustawienia — według informacji dostawcy — logi nie byłyby usuwane w ogóle.\n\nW skrzynkach pocztowych foldery Spam i Kosz są opróżniane po 14 dniach. Dla logów serwera pocztowego i zaszyfrowanych kopii zapasowych dostawca hostingu podaje odpowiednio siedem i czternaście dni; okresy te leżą po jego stronie i nie są przez nas konfigurowalne.",
      },
      {
        h: "8. Państwa prawa",
        b: "Przysługuje Państwu prawo dostępu do danych (art. 15 RODO), sprostowania (art. 16), usunięcia (art. 17), ograniczenia przetwarzania (art. 18), przenoszenia danych (art. 20) oraz sprzeciwu (art. 21). Mogą Państwo wnieść skargę do organu nadzorczego — w Polsce: Prezes Urzędu Ochrony Danych Osobowych (PUODO), ul. Stawki 2, 00-193 Warszawa.",
      },
      {
        h: "9. Dobrowolność podania danych",
        b: "Podanie danych kontaktowych jest dobrowolne, jednak konieczne do udzielenia odpowiedzi na Państwa zapytanie.",
      },
      {
        h: "10. Zmiany",
        b: "Polityka będzie aktualizowana w przypadku zmiany faktycznego sposobu przetwarzania danych (np. wprowadzenie analityki, formularza kontaktowego lub newslettera).",
      },
    ],
    updated: "Stan: październik 2026",
  },
};
