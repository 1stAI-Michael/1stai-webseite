import { siteConfig } from "./site";

export function absoluteUrl(path = "/") {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildMetadata({ title, description, path = "/", lang = "en", ogImage = "/og-default.png" }) {
  // The root layout owns a title template that appends " - 1stAI". Adding the
  // brand here too produced "Kontakt — 1stAI - 1stAI" and pushed titles past
  // the ~60 characters Google renders. So: bare title for <title>, branded
  // title only for og:/twitter:, where no template applies.
  const pageTitle = title || `${siteConfig.shortName} — ${siteConfig.tagline[lang]}`;
  const fullTitle = title ? `${title} — ${siteConfig.shortName}` : pageTitle;
  const desc = description || siteConfig.tagline[lang];
  const url = absoluteUrl(path);
  return {
    title: pageTitle,
    description: desc,
    metadataBase: new URL(siteConfig.url),
    alternates: {
      canonical: url,
      languages: {
        en: absoluteUrl(path.replace(/^\/(en|de)/, "/en")),
        de: absoluteUrl(path.replace(/^\/(en|de)/, "/de")),
      },
    },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: siteConfig.shortName,
      locale: lang === "de" ? "de_DE" : "en_US",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 627 }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
    },
  };
}

/**
 * Metadata for a single blog post. Same hreflang/canonical logic as
 * buildMetadata(), plus og:type=article and the article-specific fields
 * LinkedIn and X read.
 */
export function buildArticleMetadata(post) {
  const { lang, slug } = post;
  const path = `/${lang}/blog/${slug}/`;
  const url = absoluteUrl(path);
  const ogImage = absoluteUrl(post.ogImage);
  // See buildMetadata(): <title> stays bare, the template adds the brand.
  const title = `${post.title} — ${siteConfig.shortName}`;

  return {
    title: post.title,
    description: post.excerpt,
    metadataBase: new URL(siteConfig.url),
    authors: [{ name: post.author }],
    keywords: post.tags.length > 0 ? post.tags : undefined,
    alternates: {
      canonical: url,
      languages: {
        en: absoluteUrl(`/en/blog/${slug}/`),
        de: absoluteUrl(`/de/blog/${slug}/`),
      },
    },
    openGraph: {
      title,
      description: post.excerpt,
      url,
      siteName: siteConfig.shortName,
      locale: lang === "de" ? "de_DE" : "en_US",
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author],
      tags: post.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 627,
          alt: post.coverAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: post.excerpt,
      images: [ogImage],
    },
  };
}
