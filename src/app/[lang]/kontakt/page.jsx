import { getLocale, siteConfig } from "../../../lib/site";
import { t } from "../../../lib/i18n";
import { buildMetadata } from "../../../lib/seo";

export async function generateMetadata({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  return buildMetadata({
    lang,
    path: `/${lang}/kontakt/`,
    title: lang === "de" ? "Kontakt" : "Contact",
    description:
      lang === "de"
        ? "E-Mail-Kontakt zu Michael Schiffer 1stAI."
        : "Email contact for Michael Schiffer 1stAI.",
  });
}

export default async function ContactPage({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  const tr = t(lang).contact;
  const { contact, family } = siteConfig;

  return (
    <article className="max-w-3xl mx-auto px-6 sm:px-10 py-16">
      <h1 className="font-heading font-bold text-4xl text-ink mb-4">{tr.title}</h1>
      <p className="text-ink-muted text-lg mb-10 max-w-xl">{tr.lead}</p>

      <div className="grid sm:grid-cols-3 gap-6">
        <section className="bg-ink-subtle/60 rounded-xl p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted mb-2">
            {tr.emailLabel}
          </div>
          <a
            href={`mailto:${contact.email}`}
            className="font-heading text-xl text-primary hover:text-primary-deep break-all"
          >
            {contact.email}
          </a>
        </section>

        <section className="bg-ink-subtle/60 rounded-xl p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted mb-2">
            {lang === "de" ? "Telefon" : "Phone"}
          </div>
          <a
            href={`tel:${contact.phoneRaw}`}
            className="font-heading text-xl text-primary hover:text-primary-deep"
          >
            {contact.phone}
          </a>
        </section>

        <section className="bg-ink-subtle/60 rounded-xl p-6">
          <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted mb-2">
            {tr.addressLabel}
          </div>
          <address className="not-italic text-ink leading-relaxed text-sm">
            {contact.founder}
            <br />
            {contact.address.street}
            <br />
            {contact.address.city}
            <br />
            {contact.address.country}
          </address>
        </section>
      </div>

      <section className="mt-10">
        <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-muted mb-3">
          {tr.familyLabel}
        </div>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {family.map((f) => (
            <li key={f.url}>
              <a
                href={f.url}
                target="_blank"
                rel="noopener"
                className="text-ink hover:text-primary underline underline-offset-4"
              >
                {f.name}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
