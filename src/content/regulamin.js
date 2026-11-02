// Regulamin świadczenia usług drogą elektroniczną (uswude art. 8).
//
// ⚠️ NICHT ANWALTLICH GEPRÜFT. Michael-Entscheid 31.10.2026: bauen und sofort
// veröffentlichen. Ich hatte davon abgeraten — ein Rechtstext unter seinem
// Namen, den niemand mit Fachkenntnis gelesen hat. Er hat nach dem Hinweis
// entschieden; das ist festgehalten, nicht verschwiegen.
//
// Eine Adresse für Medien- und IT-Recht ist bisher NICHT benannt. Ich hatte
// hier zunächst den Steuerberater genannt — das war falsch (Michael-Korrektur
// 31.10.2026). Wer diesen Text prüfen lassen will, fragt Michael, an wen.
//
// Der Text folgt eng dem Entwurf des externen Auditors vom 28.10.2026
// (/mnt/austausch/1stAI_audit_01/, Abschnitt "Kurzer Regulamin-Entwurf"). Ich
// habe Platzhalter durch die echten Firmendaten ersetzt und sonst NICHTS
// hinzuerfunden — insbesondere keine Haftungsbeschränkungen, die ich nicht
// beurteilen kann. Was im Entwurf nicht stand, steht auch hier nicht.
//
// Der Auditor nennt eine Grenze, die hier wiederholt gehört: Würde der Recorder
// als echtes Medizinprodukt oder klinisches Dokumentationssystem vermarktet,
// reicht dieser kurze Regulamin NICHT. Dann wären Medizinprodukterecht,
// Produktklassifizierung und die Gesundheitsdaten-Architektur eigens zu prüfen.
import { siteConfig } from "../lib/site";

const { contact, name, legal } = siteConfig;

// Die Rechtsform-Zeile muss je Sprache stehen: bis zum Nachaudit vom 02.11.2026
// (F11) trug EIN gemeinsamer Block das deutsche "JDG, eingetragen im CEIDG" auch
// in den polnischen und den englischen Text. Im polnischen Regulamin ist der
// gesetzlich uebliche Wortlaut "jednoosobowa dzialalnosc gospodarcza wpisana do
// CEIDG" — eine deutsche Abkuerzung steht dort wie ein Fremdkoerper.
const rechtsform = {
  de: "JDG (jednoosobowa działalność gospodarcza), eingetragen im CEIDG",
  pl: "jednoosobowa działalność gospodarcza wpisana do CEIDG",
  en: "sole proprietorship (jednoosobowa działalność gospodarcza) registered with CEIDG",
};

const anbieterIn = (lang) =>
  [
    name,
    contact.address.street,
    `${contact.address.city}, ${contact.address.country}`,
    "",
    rechtsform[lang],
    `NIP: ${legal.nip}`,
    `REGON: ${legal.regon}`,
    "",
    `E-Mail: ${contact.email}`,
  ].join("\n");

export const regulamin = {
  de: {
    title: "Bedingungen für elektronische Dienstleistungen",
    updated: "Stand: 2. November 2026 (Fassung 2) · Gültig ab: 2. November 2026",
    intro:
      "Dieser Regulamin regelt die Nutzung der elektronischen Dienste, die über 1stai.eu " +
      "bereitgestellt werden (Regulamin świadczenia usług drogą elektroniczną).",
    sections: [
      { h: "1. Anbieter", b: anbieterIn("de") },
      {
        h: "2. Gegenstand",
        b:
          "1stAI stellt über 1stai.eu insbesondere folgende elektronische Dienste bereit:\n\n" +
          "a) Zugriff auf Informationen und Blogbeiträge,\n" +
          "b) Nutzung der HRV-Atemübung,\n" +
          "c) Nutzung des webbasierten Recorders,\n" +
          "d) elektronische Kontaktmöglichkeiten.\n\n" +
          "Entgeltliche Beratungs- und Projektleistungen von 1stAI werden auf Grundlage " +
          "gesonderter Vereinbarungen erbracht und sind nicht allein Gegenstand dieses Regulamin.",
      },
      {
        h: "3. Technische Voraussetzungen",
        b:
          "Zur Nutzung der Website sind ein aktueller Webbrowser und eine Internetverbindung " +
          "erforderlich. Für einzelne Funktionen kann JavaScript erforderlich sein.\n\n" +
          "Für den Recorder ist zusätzlich ein Gerät mit Audioaufnahmefunktion sowie eine " +
          "entsprechende Browserberechtigung erforderlich. Der Recorder kann Daten lokal im " +
          "Speicher des Endgeräts ablegen, um Aufnahmen und offene Uploads bereitzuhalten.",
      },
      {
        h: "4. Beginn und Beendigung",
        b:
          "Die unentgeltliche elektronische Dienstleistung beginnt, wenn der Nutzer die " +
          "betreffende Website oder Funktion aufruft beziehungsweise verwendet.\n\n" +
          "Die Nutzung kann jederzeit durch Verlassen der Website beziehungsweise Beenden der " +
          "jeweiligen Funktion beendet werden.\n\n" +
          "Bei lokal gespeicherten Recorder-Daten kann für die vollständige Entfernung " +
          "zusätzlich das Löschen der betreffenden lokalen Daten erforderlich sein.",
      },
      {
        h: "5. Nutzungsregeln",
        b:
          "Nutzer dürfen über die Dienste keine rechtswidrigen Inhalte übermitteln oder die " +
          "technische Sicherheit der Dienste beeinträchtigen.\n\n" +
          "Der Recorder ist ein Demonstrationswerkzeug für Vorführungen; es sind ausschließlich " +
          "erfundene Testangaben einzugeben.\n\n" +
          "Der Nutzer darf personenbezogene Daten Dritter, insbesondere Patienten- oder " +
          "Gesundheitsdaten, nur verarbeiten, wenn hierfür eine ausreichende Rechtsgrundlage " +
          "besteht und die für die konkrete Nutzung erforderlichen datenschutzrechtlichen " +
          "Voraussetzungen erfüllt sind.\n\n" +
          "Ein Nutzer, der Audioaufnahmen Dritter erstellt, ist selbst dafür verantwortlich, die " +
          "für die Aufnahme erforderlichen Informations-, Einwilligungs- oder sonstigen " +
          "gesetzlichen Voraussetzungen zu erfüllen, soweit diese Verantwortung nicht aufgrund " +
          "einer gesonderten Vereinbarung bei 1stAI liegt.",
      },
      {
        h: "6. Verfügbarkeit",
        b:
          "1stAI bemüht sich um einen sicheren und störungsarmen Betrieb. Eine ununterbrochene " +
          "Verfügbarkeit unentgeltlicher Websitefunktionen wird nicht garantiert, soweit " +
          "gesetzlich zulässig.",
      },
      {
        h: "7. Datenschutz",
        b:
          "Informationen über die Verarbeitung personenbezogener Daten enthält die " +
          "Datenschutzerklärung unter /de/datenschutz/ beziehungsweise /polityka-prywatnosci/.\n\n" +
          "Für eine Auftragsverarbeitung personenbezogener Daten im Rahmen von B2B-Diensten " +
          "werden erforderlichenfalls gesonderte Vereinbarungen nach Art. 28 DSGVO geschlossen.",
      },
      {
        h: "8. Beschwerden",
        b:
          `Beschwerden über elektronisch erbrachte Dienste können an ${contact.email} gerichtet ` +
          "werden.\n\nDie Beschwerde sollte nach Möglichkeit den betroffenen Dienst, eine " +
          "Beschreibung des Problems sowie die für die Bearbeitung erforderlichen Kontaktdaten " +
          "enthalten.\n\nSie erhalten eine Eingangsbestätigung an dieselbe Adresse. Die Antwort auf die Beschwerde erfolgt innerhalb von 14 Tagen nach Eingang in Textform (E-Mail oder auf Wunsch auf Papier). Gegenüber Verbrauchern ist diese Frist gesetzlich vorgegeben (Art. 7a des polnischen Verbraucherrechtsgesetzes); bleibt die Antwort aus, gilt die Beschwerde als anerkannt. Dieselbe Frist halte ich auch gegenüber Unternehmen ein.\n\nWird die Beschwerde zurückgewiesen, nennt die Antwort den Grund. Verbraucher können sich danach an den örtlich zuständigen Verbraucherbeauftragten (rzecznik konsumentów) oder an die EU-Plattform zur Online-Streitbeilegung wenden.",
      },
      {
        h: "9. Anwendbares Recht",
        b:
          "Soweit gesetzlich zulässig, gilt polnisches Recht.\n\n" +
          "Zwingende gesetzliche Rechte von Verbrauchern, insbesondere aufgrund des Rechts ihres " +
          "gewöhnlichen Aufenthaltsstaats, bleiben unberührt.",
      },
    ],
  },
  pl: {
    title: "Regulamin świadczenia usług drogą elektroniczną",
    updated: "Stan: 2 listopada 2026 (wersja 2) · Obowiązuje od: 2 listopada 2026",
    intro:
      "Niniejszy regulamin określa zasady korzystania z usług świadczonych drogą elektroniczną " +
      "za pośrednictwem serwisu 1stai.eu.",
    sections: [
      { h: "1. Usługodawca", b: anbieterIn("pl") },
      {
        h: "2. Przedmiot",
        b:
          "1stAI udostępnia za pośrednictwem 1stai.eu w szczególności następujące usługi " +
          "świadczone drogą elektroniczną:\n\n" +
          "a) dostęp do informacji i wpisów na blogu,\n" +
          "b) korzystanie z ćwiczenia oddechowego HRV,\n" +
          "c) korzystanie z internetowego narzędzia Recorder,\n" +
          "d) elektroniczne formy kontaktu.\n\n" +
          "Odpłatne usługi doradcze i projektowe 1stAI świadczone są na podstawie odrębnych " +
          "umów i nie są objęte wyłącznie niniejszym regulaminem.",
      },
      {
        h: "3. Wymagania techniczne",
        b:
          "Do korzystania z serwisu niezbędna jest aktualna przeglądarka internetowa oraz " +
          "połączenie z internetem. Niektóre funkcje mogą wymagać obsługi JavaScript.\n\n" +
          "Do korzystania z narzędzia Recorder niezbędne jest ponadto urządzenie z funkcją " +
          "nagrywania dźwięku oraz odpowiednie uprawnienie przeglądarki. Recorder może zapisywać " +
          "dane lokalnie w pamięci urządzenia, aby przechowywać nagrania i oczekujące przesyłki.",
      },
      {
        h: "4. Rozpoczęcie i zakończenie",
        b:
          "Nieodpłatna usługa świadczona drogą elektroniczną rozpoczyna się z chwilą wywołania " +
          "lub użycia danej strony albo funkcji przez użytkownika.\n\n" +
          "Korzystanie można zakończyć w każdej chwili, opuszczając serwis lub kończąc daną " +
          "funkcję.\n\n" +
          "W przypadku danych Recordera zapisanych lokalnie całkowite ich usunięcie może " +
          "wymagać dodatkowo skasowania tych danych lokalnych.",
      },
      {
        h: "5. Zasady korzystania",
        b:
          "Użytkownikom nie wolno przesyłać za pośrednictwem usług treści bezprawnych ani " +
          "naruszać bezpieczeństwa technicznego usług.\n\n" +
          "Recorder jest narzędziem demonstracyjnym przeznaczonym do prezentacji; należy " +
          "wprowadzać wyłącznie fikcyjne dane testowe.\n\n" +
          "Użytkownik może przetwarzać dane osobowe osób trzecich, w szczególności dane " +
          "pacjentów lub dane dotyczące zdrowia, wyłącznie wtedy, gdy istnieje ku temu " +
          "wystarczająca podstawa prawna i spełnione są wymagane w danym przypadku warunki " +
          "ochrony danych osobowych.\n\n" +
          "Użytkownik, który sporządza nagrania audio osób trzecich, sam odpowiada za spełnienie " +
          "wymaganych obowiązków informacyjnych, uzyskanie zgód lub innych przesłanek ustawowych, " +
          "o ile odpowiedzialność ta nie spoczywa na 1stAI na podstawie odrębnej umowy.",
      },
      {
        h: "6. Dostępność",
        b:
          "1stAI dokłada starań o bezpieczne i niezakłócone działanie usług. Nieprzerwana " +
          "dostępność nieodpłatnych funkcji serwisu nie jest gwarantowana w zakresie dozwolonym " +
          "przez prawo.",
      },
      {
        h: "7. Ochrona danych osobowych",
        b:
          "Informacje o przetwarzaniu danych osobowych zawiera Polityka prywatności pod adresem " +
          "/polityka-prywatnosci/.\n\n" +
          "W przypadku powierzenia przetwarzania danych osobowych w ramach usług B2B zawierane " +
          "są w razie potrzeby odrębne umowy zgodnie z art. 28 RODO.",
      },
      {
        h: "8. Reklamacje",
        b:
          `Reklamacje dotyczące usług świadczonych drogą elektroniczną można kierować na adres ${contact.email}.` +
          "\n\nReklamacja powinna w miarę możliwości zawierać wskazanie usługi, opis problemu " +
          "oraz dane kontaktowe niezbędne do jej rozpatrzenia.\n\n" +
          "Potwierdzenie wpływu wysyłane jest na ten sam adres. Odpowiedź na reklamację udzielana jest w terminie 14 dni od dnia jej otrzymania, na trwałym nośniku (wiadomość e-mail, a na życzenie na papierze). Wobec konsumentów termin ten wynika z art. 7a ustawy o prawach konsumenta; brak odpowiedzi w tym terminie oznacza uznanie reklamacji. Ten sam termin stosowany jest także wobec przedsiębiorców.\n\nW razie nieuwzględnienia reklamacji odpowiedź zawiera uzasadnienie. Konsument może następnie zwrócić się do miejscowo właściwego rzecznika konsumentów lub skorzystać z unijnej platformy ODR.",
      },
      {
        h: "9. Prawo właściwe",
        b:
          "W zakresie dozwolonym przez prawo stosuje się prawo polskie.\n\n" +
          "Bezwzględnie obowiązujące prawa konsumentów, w szczególności wynikające z prawa " +
          "państwa ich zwykłego pobytu, pozostają nienaruszone.",
      },
    ],
  },
  en: {
    title: "Terms for electronically supplied services",
    updated: "As of: 2 November 2026 (version 2) · Effective from: 2 November 2026",
    intro:
      "These terms govern the use of the electronically supplied services provided through " +
      "1stai.eu (Regulamin świadczenia usług drogą elektroniczną). The Polish version at " +
      "/regulamin/ is the one that fulfils the statutory requirement.",
    sections: [
      { h: "1. Provider", b: anbieterIn("en") },
      {
        h: "2. Subject matter",
        b:
          "Through 1stai.eu, 1stAI provides in particular the following electronically supplied " +
          "services:\n\n" +
          "a) access to information and blog articles,\n" +
          "b) use of the HRV breathing exercise,\n" +
          "c) use of the web-based Recorder,\n" +
          "d) electronic means of contact.\n\n" +
          "Paid consulting and project services by 1stAI are provided on the basis of separate " +
          "agreements and are not governed by these terms alone.",
      },
      {
        h: "3. Technical requirements",
        b:
          "Using the website requires a current web browser and an internet connection. " +
          "Individual functions may require JavaScript.\n\n" +
          "The Recorder additionally requires a device with audio recording capability and the " +
          "corresponding browser permission. The Recorder may store data locally in the device's " +
          "storage in order to hold recordings and pending uploads.",
      },
      {
        h: "4. Start and end",
        b:
          "The free electronically supplied service begins when the user opens or uses the " +
          "relevant page or function.\n\n" +
          "Use can be ended at any time by leaving the website or closing the function " +
          "concerned.\n\n" +
          "For Recorder data stored locally, complete removal may additionally require deleting " +
          "that local data.",
      },
      {
        h: "5. Rules of use",
        b:
          "Users may not transmit unlawful content through the services or impair their " +
          "technical security.\n\n" +
          "The Recorder is a demonstration tool for presentations; only invented test entries " +
          "should be used.\n\n" +
          "Users may process personal data of third parties, in particular patient or health " +
          "data, only where there is a sufficient legal basis and the data protection " +
          "requirements applicable to that specific use are met.\n\n" +
          "A user who makes audio recordings of third parties is responsible for meeting the " +
          "information, consent or other statutory requirements for that recording, unless that " +
          "responsibility rests with 1stAI under a separate agreement.",
      },
      {
        h: "6. Availability",
        b:
          "1stAI endeavours to operate the services securely and with minimal disruption. " +
          "Uninterrupted availability of free website functions is not guaranteed, to the extent " +
          "permitted by law.",
      },
      {
        h: "7. Data protection",
        b:
          "Information on the processing of personal data is set out in the privacy policy at " +
          "/en/privacy/ or /polityka-prywatnosci/.\n\n" +
          "Where personal data is processed on behalf of a client as part of B2B services, " +
          "separate agreements under Art. 28 GDPR are concluded where required.",
      },
      {
        h: "8. Complaints",
        b:
          `Complaints about electronically supplied services can be sent to ${contact.email}.` +
          "\n\nWhere possible, a complaint should state the service concerned, describe the " +
          "problem and include the contact details needed to process it.\n\n" +
          "Receipt is confirmed to the same address. A complaint is answered within 14 days of receipt on a durable medium (by e-mail, or on paper on request). For consumers this period is laid down by law (Art. 7a of the Polish Consumer Rights Act); if no answer is given within it, the complaint counts as accepted. The same period is applied to business customers.\n\nIf a complaint is rejected, the answer states the reason. Consumers may then turn to the locally competent consumer ombudsman (rzecznik konsumentów) or use the EU online dispute resolution platform.",
      },
      {
        h: "9. Applicable law",
        b:
          "To the extent permitted by law, Polish law applies.\n\n" +
          "Mandatory statutory consumer rights, in particular those arising from the law of the " +
          "consumer's country of habitual residence, remain unaffected.",
      },
    ],
  },
};
