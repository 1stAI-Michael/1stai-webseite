import Link from "next/link";
import { getLocale, siteConfig } from "../../lib/site";
import { t } from "../../lib/i18n";
import { buildMetadata } from "../../lib/seo";
import LogoMark from "../../components/LogoMark";

export async function generateMetadata({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  return buildMetadata({ lang, path: `/${lang}/` });
}

export default async function HomePage({ params }) {
  const { lang: raw } = await params;
  const lang = getLocale(raw);
  const tr = t(lang);

  return (
    <div className="relative overflow-hidden">
      <section className="px-6 sm:px-10 py-20 sm:py-28 max-w-4xl mx-auto relative z-10">
        <div
          className="inline-flex items-center gap-2 bg-ink-subtle px-3.5 py-1.5 rounded-full text-[13px] text-ink-muted font-medium mb-8"
        >
          <span
            className="w-2 h-2 rounded-full bg-primary"
            style={{ animation: "pulse-dot 2.4s ease-in-out infinite" }}
          />
          {tr.home.badgePrefix} {tr.home.badgePeriod}
        </div>

        <h1 className="font-heading font-bold text-ink leading-[1.02] tracking-tight mb-7"
            style={{ fontSize: "clamp(40px, 7vw, 72px)" }}>
          {tr.home.heroPre}<br />
          <span className="text-primary">{tr.home.heroHighlight}</span>
        </h1>

        <p className="text-ink-muted max-w-[640px] mb-10"
           style={{ fontSize: "clamp(17px, 2vw, 22px)" }}>
          {tr.home.sub}
        </p>

        <div className="flex flex-wrap gap-4">
          <a
            href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent("Project inquiry")}`}
            className="inline-flex items-center gap-2.5 bg-primary text-white px-8 py-4 rounded-[10px] font-heading font-semibold hover:bg-primary-deep transition-all hover:-translate-y-px"
          >
            {tr.home.ctaPrimary} →
          </a>
          <a
            href="https://schifferm.de"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-[10px] font-heading font-semibold border-[1.5px] border-ink-subtle hover:border-ink transition-colors"
          >
            {tr.home.ctaSecondary}
          </a>
        </div>
      </section>

      <div className="absolute pointer-events-none opacity-[0.06] -right-32 -bottom-28 z-0">
        <LogoMark size={560} />
      </div>

      <section className="px-6 sm:px-10 py-16 border-t border-ink-subtle bg-ink-subtle/40">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading font-semibold text-2xl text-ink mb-2">{tr.home.sectionsTitle}</h2>
          <p className="text-ink-muted mb-8 max-w-2xl">{tr.home.sectionsLead}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {tr.home.sections.map((s) => {
              const inner = (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-heading font-semibold text-ink">{s.title}</span>
                    {s.href ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-body text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-deep">
                        {tr.home.badgeLive}
                      </span>
                    ) : null}
                  </div>
                  <div className="text-sm text-ink-muted">{s.body}</div>
                  {s.href ? (
                    <div className="mt-3 text-sm font-semibold text-primary">{s.cta} &rarr;</div>
                  ) : null}
                </>
              );
              // Sections with an href are live and become links; the rest are
              // still placeholders for the launch.
              return s.href ? (
                <Link
                  key={s.title}
                  href={`/${lang}${s.href}`}
                  className="block bg-white rounded-xl p-5 border border-ink-subtle transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
                >
                  {inner}
                </Link>
              ) : (
                <div key={s.title} className="bg-white rounded-xl p-5 border border-ink-subtle">
                  {inner}
                </div>
              );
            })}
          </div>
          <div className="mt-8">
            <Link
              href={`/${lang}/kontakt/`}
              className="text-primary font-medium hover:text-primary-deep"
            >
              {tr.nav.contact} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
