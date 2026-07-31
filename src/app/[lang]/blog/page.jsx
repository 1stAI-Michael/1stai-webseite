import Link from "next/link";
import { getLocale, siteConfig } from "../../../lib/site";
import { buildMetadata } from "../../../lib/seo";
import { buildBlogIndexJsonLd } from "../../../lib/blogSchema";
import { getPostsForLang } from "../../../content/blog/posts";
import { readingMinutes } from "../../../lib/markdown";
import { t } from "../../../lib/i18n";

export const dynamicParams = false;

export function generateStaticParams() {
  return siteConfig.locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const lang = getLocale(resolved?.lang);
  const tr = t(lang);
  return buildMetadata({
    title: tr.blog.title,
    description: tr.blog.lead,
    path: `/${lang}/blog/`,
    lang,
  });
}

export default async function BlogIndexPage({ params }) {
  const resolved = await params;
  const lang = getLocale(resolved?.lang);
  const tr = t(lang);
  const posts = getPostsForLang(lang);
  const dateFormat = new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="mx-auto max-w-4xl px-6 sm:px-10 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: buildBlogIndexJsonLd(lang, posts) }}
      />

      <p className="font-body text-xs font-semibold uppercase tracking-[0.08em] text-primary">
        {tr.blog.eyebrow}
      </p>
      <h1 className="mt-3 font-heading text-4xl sm:text-5xl font-bold tracking-[-0.025em] text-ink">
        {tr.blog.title}
      </h1>
      <p className="mt-4 max-w-2xl font-body text-ink-muted">{tr.blog.lead}</p>

      {posts.length === 0 ? (
        <p className="mt-12 rounded-2xl border border-ink-subtle bg-ink-subtle/40 px-6 py-10 text-center font-body text-ink-muted">
          {tr.blog.empty}
        </p>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/${lang}/blog/${post.slug}/`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink-subtle bg-white transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10"
              >
                <img
                  src={post.coverImage}
                  alt={post.coverAlt}
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/9] w-full object-cover"
                />
                <div className="flex flex-1 flex-col p-6">
                  <p className="font-body text-xs font-medium uppercase tracking-[0.08em] text-ink-muted">
                    <time dateTime={post.date}>{dateFormat.format(new Date(post.date))}</time>
                    <span aria-hidden="true"> · </span>
                    {readingMinutes(post.bodyMarkdown)} {tr.blog.readingTimeUnit}
                  </p>
                  <h2 className="mt-3 font-heading text-xl font-semibold leading-snug text-ink group-hover:text-primary">
                    {post.title}
                  </h2>
                  <p className="mt-3 flex-1 font-body text-sm text-ink-muted">{post.excerpt}</p>
                  <span className="mt-5 font-body text-sm font-semibold text-primary">
                    {tr.blog.readMore} &rarr;
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
