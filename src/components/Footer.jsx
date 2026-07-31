import Link from "next/link";
import { siteConfig } from "../lib/site";
import { t } from "../lib/i18n";

export default function Footer({ lang = "en" }) {
  const tr = t(lang);
  const { address, founder, email } = siteConfig.contact;
  return (
    <footer className="px-6 sm:px-10 py-7 border-t border-ink-subtle text-sm text-ink-muted flex flex-wrap gap-4 justify-between items-start">
      <div className="font-mono text-[11px] leading-relaxed">
        {siteConfig.name} · {address.street}, {address.city}, {address.country}
        <br />
        {tr.footer.legal} · NIP: {siteConfig.legal.nip}
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <a href={`mailto:${email}`} className="hover:text-primary">{email}</a>
        <Link href={`/${lang}/kontakt/`} className="hover:text-primary">{tr.footer.links.contact}</Link>
        <Link href={`/${lang}/impressum/`} className="hover:text-primary">{tr.footer.links.imprint}</Link>
        <Link href={`/${lang}/${lang === "de" ? "datenschutz" : "privacy"}/`} className="hover:text-primary">{tr.footer.links.privacy}</Link>
        <a href="/polityka-prywatnosci/" className="hover:text-primary" hrefLang="pl">{tr.footer.links.privacyPl}</a>
        {siteConfig.family.map((f) => (
          <a key={f.url} href={f.url} target="_blank" rel="noopener" className="hover:text-primary">
            {f.name}
          </a>
        ))}
      </div>
    </footer>
  );
}
