import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, siteConfig } from "../../../../lib/site";
import { buildArticleMetadata } from "../../../../lib/seo";
import { buildBlogPostingJsonLd } from "../../../../lib/blogSchema";
import { getAllPosts, getLocalizedPost, getPostsForLang } from "../../../../content/blog/posts";
import { markdownToHtml, readingMinutes } from "../../../../lib/markdown";
import { t } from "../../../../lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  const params = [];
  for (const lang of siteConfig.locales) {
    for (const post of getAllPosts()) {
      if (post[lang]) params.push({ lang, slug: post.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const lang = getLocale(resolved?.lang);
  const post = getLocalizedPost(resolved?.slug, lang);
  if (!post) return {};
  return buildArticleMetadata(post);
}

// Body prose styling. Kept in one place so every post renders identically.
const PROSE = [
  "mt-10 font-body text-[17px] leading-relaxed text-ink/90",
  "[&>*+*]:mt-5",
  "[&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-12 [&_h2]:mb-0 [&_h2]:scroll-mt-24",
  "[&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_h3]:mt-9",
  "[&_h4]:font-heading [&_h4]:text-[17px] [&_h4]:font-semibold [&_h4]:text-ink [&_h4]:mt-7",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-primary-deep",
  "[&_strong]:font-semibold [&_strong]:text-ink",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mt-2",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-5 [&_blockquote]:text-ink-muted [&_blockquote]:italic",
  "[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:bg-ink-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded",
  "[&_pre]:bg-ink [&_pre]:text-ink-subtle [&_pre]:rounded-xl [&_pre]:p-5 [&_pre]:overflow-x-auto",
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit",
  "[&_table]:w-full [&_table]:border-collapse [&_table]:text-sm",
  "[&_th]:border-b-2 [&_th]:border-ink-subtle [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-heading [&_th]:font-semibold",
  "[&_td]:border-b [&_td]:border-ink-subtle [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top",
  "[&_hr]:border-ink-subtle [&_hr]:my-10",
  "[&_figure]:my-8",
  "[&_figure_img]:w-full [&_figure_img]:rounded-xl [&_figure_img]:border [&_figure_img]:border-ink-subtle",
  "[&_figcaption]:mt-2 [&_figcaption]:text-sm [&_figcaption]:text-ink-muted",
].join(" ");

export default async function BlogPostPage({ params }) {
  const resolved = await params;
  const lang = getLocale(resolved?.lang);
  const post = getLocalizedPost(resolved?.slug, lang);
  if (!post) return notFound();

  const tr = t(lang);
  const bodyHtml = markdownToHtml(post.bodyMarkdown, lang);
  const dateFormat = new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const ordered = getPostsForLang(lang);
  const index = ordered.findIndex((item) => item.slug === post.slug);
  const newer = index > 0 ? ordered[index - 1] : null;
  const older = index >= 0 && index < ordered.length - 1 ? ordered[index + 1] : null;

  return (
    <article className="mx-auto max-w-3xl px-6 sm:px-10 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildBlogPostingJsonLd(post) }}
      />

      {post.draft ? (
        <p className="mb-6 rounded-lg border-2 border-primary bg-primary/10 px-4 py-3 font-body text-sm font-semibold text-primary-deep">
          Entwurf — nur in einer lokalen Vorschau sichtbar, nicht veröffentlicht.
        </p>
      ) : null}

      <nav className="font-body text-sm text-ink-muted">
        <Link href={`/${lang}/blog/`} className="font-medium text-primary hover:text-primary-deep">
          &larr; {tr.blog.title}
        </Link>
      </nav>

      <header className="mt-6">
        <p className="font-body text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
          <time dateTime={post.date}>{dateFormat.format(new Date(post.date))}</time>
          <span aria-hidden="true"> · </span>
          {readingMinutes(post.bodyMarkdown)} {tr.blog.readingTimeUnit}
          <span aria-hidden="true"> · </span>
          {post.author}
        </p>
        <h1 className="mt-4 font-heading text-3xl sm:text-4xl font-bold leading-tight tracking-[-0.025em] text-ink">
          {post.title}
        </h1>
        <p className="mt-4 font-body text-lg text-ink-muted">{post.excerpt}</p>
      </header>

      <img
        src={post.coverImage}
        alt={post.coverAlt}
        width={1600}
        height={900}
        className="mt-8 w-full rounded-2xl border border-ink-subtle"
      />

      <div className={PROSE} dangerouslySetInnerHTML={{ __html: bodyHtml }} />

      {post.sources.length > 0 ? (
        <section className="mt-14 border-t border-ink-subtle pt-8">
          <h2 className="font-heading text-xl font-semibold text-ink">{tr.blog.sources}</h2>
          <ul className="mt-4 space-y-2 font-body text-sm">
            {post.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary-deep"
                >
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {post.faq.length > 0 ? (
        <section className="mt-14 border-t border-ink-subtle pt-8">
          <h2 className="font-heading text-xl font-semibold text-ink">{tr.blog.faq}</h2>
          <dl className="mt-6 space-y-6">
            {post.faq.map((item) => (
              <div key={item.q}>
                <dt className="font-heading font-semibold text-ink">{item.q}</dt>
                <dd className="mt-2 font-body text-ink-muted">{item.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}

      <section className="mt-14 rounded-2xl bg-ink-subtle px-6 py-8 sm:px-8">
        <h2 className="font-heading text-xl font-semibold text-ink">{tr.blog.ctaTitle}</h2>
        <p className="mt-2 font-body text-ink-muted">{tr.blog.ctaBody}</p>
        <Link
          href={`/${lang}/kontakt/`}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 font-heading font-semibold text-white transition hover:bg-primary-deep"
        >
          {tr.blog.ctaButton}
        </Link>
      </section>

      {newer || older ? (
        <nav className="mt-12 flex flex-col gap-3 border-t border-ink-subtle pt-8 sm:flex-row sm:justify-between">
          {older ? (
            <Link
              href={`/${lang}/blog/${older.slug}/`}
              className="font-body text-sm font-medium text-ink-muted hover:text-primary"
            >
              &larr; {older.title}
            </Link>
          ) : (
            <span />
          )}
          {newer ? (
            <Link
              href={`/${lang}/blog/${newer.slug}/`}
              className="font-body text-sm font-medium text-ink-muted hover:text-primary sm:text-right"
            >
              {newer.title} &rarr;
            </Link>
          ) : null}
        </nav>
      ) : null}
    </article>
  );
}
