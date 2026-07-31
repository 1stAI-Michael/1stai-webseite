import { getLocale, siteConfig } from "../../../lib/site";
import { t } from "../../../lib/i18n";
import { buildMetadata } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  return buildMetadata({
    lang,
    path: `/${lang}/impressum/`,
    title: lang === "de" ? "Impressum" : "Imprint",
    description:
      lang === "de"
        ? "Diensteanbieter, Rechtsform und Kontakt für 1stai.eu."
        : "Service provider, legal form and contact for 1stai.eu.",
  });
}

export default async function ImprintPage({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  const tr = t(lang).imprint;
  const { contact, legal, name } = siteConfig;

  return (
    <article className="legal-content max-w-3xl mx-auto px-6 sm:px-10 py-16">
      <h1>{tr.title}</h1>

      <h2>{tr.providerHeading}</h2>
      <p>
        <strong>{name}</strong>
        <br />
        Founder: {contact.founder}
        <br />
        {contact.address.street}
        <br />
        {contact.address.city}
        <br />
        {contact.address.country}
      </p>

      <h2>{tr.legalHeading}</h2>
      <p>
        {lang === "de" ? legal.form : legal.formEn}
        <br />
        {legal.ceidgStatus[lang]}
      </p>

      <h2>{tr.taxHeading}</h2>
      <p>
        NIP: {legal.nip}
        <br />
        REGON: {legal.regon}
        <br />
        {legal.vatRegime}
      </p>

      <h2>{tr.contactHeading}</h2>
      <p>
        E-Mail: <a href={`mailto:${contact.email}`}>{contact.email}</a>
        <br />
        {lang === "de" ? "Telefon" : "Phone"}: <a href={`tel:${contact.phoneRaw}`}>{contact.phone}</a>
      </p>

      <h2>{tr.responsibleHeading}</h2>
      <p>
        {contact.founder}, {contact.address.street}, {contact.address.city}, {contact.address.country}
      </p>

      <h2>{tr.disclaimerHeading}</h2>
      <p>{tr.disclaimer}</p>
    </article>
  );
}
