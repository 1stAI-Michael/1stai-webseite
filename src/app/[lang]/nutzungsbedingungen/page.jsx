import { regulamin } from "../../../content/regulamin";
import PrivacyContent from "../../../components/PrivacyContent";
import { buildMetadata } from "../../../lib/seo";
import { getLocale } from "../../../lib/site";

export const dynamic = "force-static";

// Drei Fassungen, je Sprache eine. Massgeblich ist die polnische unter
// /regulamin/ — sie erfuellt die Pflicht aus uswude art. 8. DE und EN stehen
// daneben, weil die Leser dieser Seite ueberwiegend nicht polnisch lesen; die
// englische sagt das in ihrer Einleitung ausdruecklich.
// Erster Anlauf lieferte /en/nutzungsbedingungen/ mit lang="en" und deutschem
// Text aus. Eine Seite, die ihre Sprache falsch angibt, ist schlechter als eine,
// die es nicht gibt — Vorleseprogramme und Suchmaschinen glauben dem Attribut.
export async function generateMetadata({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  const doc = regulamin[lang] || regulamin.de;
  return buildMetadata({
    title: doc.title,
    description: doc.intro.slice(0, 160),
    path: `/${lang}/nutzungsbedingungen/`,
  });
}

export default async function Nutzungsbedingungen({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  return <PrivacyContent doc={regulamin[lang] || regulamin.de} />;
}
