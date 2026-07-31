import Link from "next/link";
import LogoMark from "./LogoMark";
import { t } from "../lib/i18n";

export default function Header({ lang = "en" }) {
  const tr = t(lang);
  const other = lang === "en" ? "de" : "en";
  return (
    <header className="px-6 sm:px-10 py-5 flex flex-wrap items-center justify-between gap-4 border-b border-ink-subtle">
      <Link href={`/${lang}/`} className="flex items-center gap-3 font-heading font-bold text-xl text-ink">
        <LogoMark size={44} />
        <span>1stAI</span>
      </Link>
      <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
        <Link href={`/${lang}/blog/`} className="text-ink-muted hover:text-primary font-medium">
          {tr.nav.blog}
        </Link>
        <Link href="/Recorder/" className="text-ink-muted hover:text-primary font-medium">
          {tr.nav.recorder}
        </Link>
        <Link href="/atemuebung/" className="text-ink-muted hover:text-primary font-medium">
          {tr.nav.hrv}
        </Link>
        <Link href={`/${lang}/kontakt/`} className="text-ink-muted hover:text-primary font-medium">
          {tr.nav.contact}
        </Link>
        <Link href={`/${lang}/impressum/`} className="text-ink-muted hover:text-primary font-medium">
          {tr.nav.imprint}
        </Link>
        <Link
          href={`/${other}/`}
          className="text-ink-muted hover:text-primary font-mono uppercase tracking-wider text-xs"
        >
          {other}
        </Link>
      </nav>
    </header>
  );
}
