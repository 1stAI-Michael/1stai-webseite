import { getLocale } from "../../../lib/site";
import { buildMetadata } from "../../../lib/seo";
import { privacy } from "../../../content/privacy";
import PrivacyContent from "../../../components/PrivacyContent";

export async function generateMetadata({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  const doc = privacy[lang] || privacy.en;
  return buildMetadata({
    lang,
    path: `/${lang}/${lang === "de" ? "datenschutz" : "privacy"}/`,
    title: doc.title,
    description: doc.intro.slice(0, 160),
  });
}

export default async function PrivacyPage({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  const doc = privacy[lang] || privacy.en;
  return <PrivacyContent doc={doc} />;
}
