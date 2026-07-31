import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { siteConfig, getLocale } from "../../lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return siteConfig.locales.map((lang) => ({ lang }));
}

export default async function LocaleLayout({ children, params }) {
  const resolved = await params;
  const lang = getLocale(resolved?.lang);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    email: `mailto:${siteConfig.contact.email}`,
    founder: { "@type": "Person", name: siteConfig.contact.founder },
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address.street,
      addressLocality: siteConfig.contact.address.city,
      addressCountry: "PL",
    },
    sameAs: siteConfig.family.map((f) => f.url),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <Header lang={lang} />
      <main className="flex-1">{children}</main>
      <Footer lang={lang} />
    </>
  );
}
