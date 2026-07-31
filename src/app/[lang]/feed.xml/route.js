import { siteConfig, getLocale } from "../../../lib/site";
import { getPostsForLang } from "../../../content/blog/posts";
import { t } from "../../../lib/i18n";

export const dynamic = "force-static";

export function generateStaticParams() {
  return siteConfig.locales.map((lang) => ({ lang }));
}

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET(_request, { params }) {
  const resolved = await params;
  const lang = getLocale(resolved?.lang);
  const tr = t(lang);
  const posts = getPostsForLang(lang);
  const self = `${siteConfig.url}/${lang}/feed.xml`;

  const items = posts
    .map((post) => {
      const url = `${siteConfig.url}/${lang}/blog/${post.slug}/`;
      return [
        "    <item>",
        `      <title>${xmlEscape(post.title)}</title>`,
        `      <link>${xmlEscape(url)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(url)}</guid>`,
        `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
        `      <description>${xmlEscape(post.excerpt)}</description>`,
        `      <dc:creator>${xmlEscape(post.author)}</dc:creator>`,
        "    </item>",
      ].join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    "  <channel>",
    `    <title>${xmlEscape(tr.blog.feedTitle)}</title>`,
    `    <link>${siteConfig.url}/${lang}/blog/</link>`,
    `    <description>${xmlEscape(tr.blog.lead)}</description>`,
    `    <language>${lang === "de" ? "de-DE" : "en-US"}</language>`,
    `    <atom:link href="${self}" rel="self" type="application/rss+xml" />`,
    items,
    "  </channel>",
    "</rss>",
    "",
  ].join("\n");

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
