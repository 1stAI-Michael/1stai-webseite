/**
 * JSON-LD generation for blog posts — derived from the post data, never
 * hand-written. Emits a @graph with BlogPosting, optional FAQPage and
 * BreadcrumbList.
 */

import { siteConfig } from "./site";
import { absoluteUrl } from "./seo";
import { countWords } from "./markdown";

const LOCALE = { de: "de-DE", en: "en-US" };

const BLOG_NAME = {
  de: "1stAI Blog",
  en: "1stAI Blog",
};

const BREADCRUMB_HOME = { de: "Start", en: "Home" };
const BREADCRUMB_BLOG = { de: "Blog", en: "Blog" };

/** ISO 8601 with the Polish office offset, so dates are unambiguous. */
function isoDate(date) {
  if (!date) return undefined;
  if (/T/.test(date)) return date;
  return `${date}T09:00:00+02:00`;
}

function author() {
  return {
    "@type": "Person",
    name: siteConfig.contact.founder,
    url: siteConfig.url,
    jobTitle: "AI Consultant",
    sameAs: siteConfig.family.map((f) => f.url),
  };
}

function publisher() {
  return {
    "@type": "Organization",
    name: siteConfig.name,
    alternateName: siteConfig.shortName,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/assets/1stai-mark.svg"),
    },
  };
}

export function buildBlogPostingJsonLd(post) {
  const { lang, slug } = post;
  const url = absoluteUrl(`/${lang}/blog/${slug}/`);
  const graph = [];

  graph.push({
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    inLanguage: LOCALE[lang] || LOCALE.en,
    datePublished: isoDate(post.date),
    dateModified: isoDate(post.updated),
    wordCount: countWords(post.bodyMarkdown),
    articleSection: post.articleSection,
    author: author(),
    publisher: publisher(),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    image: {
      "@type": "ImageObject",
      url: absoluteUrl(post.ogImage),
      width: 1200,
      height: 627,
    },
    isPartOf: {
      "@type": "Blog",
      "@id": absoluteUrl(`/${lang}/blog/`),
      name: BLOG_NAME[lang] || BLOG_NAME.en,
    },
    keywords: post.tags,
    citation: post.sources.map((s) => s.url).filter(Boolean),
  });

  if (post.faq.length > 0) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: post.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    });
  }

  graph.push({
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: BREADCRUMB_HOME[lang] || BREADCRUMB_HOME.en,
        item: absoluteUrl(`/${lang}/`),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: BREADCRUMB_BLOG[lang] || BREADCRUMB_BLOG.en,
        item: absoluteUrl(`/${lang}/blog/`),
      },
      { "@type": "ListItem", position: 3, name: post.title, item: url },
    ],
  });

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

export function buildBlogIndexJsonLd(lang, postsForLang) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": absoluteUrl(`/${lang}/blog/`),
    name: BLOG_NAME[lang] || BLOG_NAME.en,
    inLanguage: LOCALE[lang] || LOCALE.en,
    publisher: publisher(),
    blogPost: postsForLang.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      datePublished: isoDate(post.date),
      url: absoluteUrl(`/${lang}/blog/${post.slug}/`),
    })),
  });
}
