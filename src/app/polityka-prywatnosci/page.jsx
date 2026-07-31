import Link from "next/link";
import { privacy } from "../../content/privacy";
import PrivacyContent from "../../components/PrivacyContent";
import LogoMark from "../../components/LogoMark";
import { siteConfig } from "../../lib/site";
import { absoluteUrl } from "../../lib/seo";

export const dynamic = "force-static";

export function generateMetadata() {
  const doc = privacy.pl;
  return {
    title: `${doc.title} — 1stAI`,
    description: doc.intro.slice(0, 160),
    alternates: { canonical: absoluteUrl("/polityka-prywatnosci/") },
    openGraph: {
      title: doc.title,
      description: doc.intro.slice(0, 160),
      url: absoluteUrl("/polityka-prywatnosci/"),
      locale: "pl_PL",
      type: "website",
    },
  };
}

export default function PolitykaPrywatnosci() {
  return (
    <>
      <header className="px-6 sm:px-10 py-6 flex items-center justify-between border-b border-ink-subtle">
        <Link href="/en/" className="flex items-center gap-3 font-heading font-bold text-xl text-ink">
          <LogoMark size={44} />
          <span>1stAI</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm">
          <a href={`mailto:${siteConfig.contact.email}`} className="text-ink-muted hover:text-primary font-medium">
            Kontakt
          </a>
          <Link href="/en/" className="text-ink-muted hover:text-primary font-mono uppercase tracking-wider text-xs">
            EN
          </Link>
          <Link href="/de/" className="text-ink-muted hover:text-primary font-mono uppercase tracking-wider text-xs">
            DE
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <PrivacyContent doc={privacy.pl} />
      </main>
      <footer className="px-6 sm:px-10 py-7 border-t border-ink-subtle text-sm text-ink-muted flex flex-wrap gap-4 justify-between items-start">
        <div className="font-mono text-[11px] leading-relaxed">
          {siteConfig.name} · {siteConfig.contact.address.street}, {siteConfig.contact.address.city}, {siteConfig.contact.address.country}
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-primary">{siteConfig.contact.email}</a>
        </div>
      </footer>
    </>
  );
}
