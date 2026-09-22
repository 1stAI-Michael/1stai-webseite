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

/** IPTC digital source type — the machine-readable half of Article 50. */
const AI_SOURCE_TYPE =
  "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia";

const AI_DISCLOSURE = {
  de: (name) => `KI-generierter Text. Geprüft und freigegeben von ${name}, der dafür einsteht.`,
  en: (name) => `AI-generated text. Reviewed and approved by ${name}, who is answerable for it.`,
};

function person(name) {
  return {
    "@type": "Person",
    name: name || siteConfig.contact.founder,
    url: siteConfig.url,
    jobTitle: "AI Consultant",
    sameAs: siteConfig.family.map((f) => f.url),
  };
}

/**
 * An AI writer is not a Person. Typing it as one in structured data would
 * assert exactly what Article 50 asks us to disclose, so it goes in as the
 * software it is — and the human co-author keeps the Person entry, because
 * a person is who can answer for a text.
 */
function author(post) {
  if (!post.aiGenerated) return person(post.author);
  const list = [
    {
      "@type": "SoftwareApplication",
      name: post.author,
      applicationCategory: "AI writing assistant",
      publisher: {
        "@type": "Organization",
        name: "Anthropic",
        url: "https://www.anthropic.com",
      },
    },
  ];
  if (post.coAuthor) list.push(person(post.coAuthor));
  return list;
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
    author: author(post),
    ...(post.aiGenerated
      ? {
          digitalSourceType: AI_SOURCE_TYPE,
          disambiguatingDescription: (AI_DISCLOSURE[lang] || AI_DISCLOSURE.en)(
            post.coAuthor || siteConfig.contact.founder
          ),
        }
      : {}),
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

  // digitalSourceType is IPTC, not schema.org — declare it in the context so
  // it resolves instead of being silently dropped by a strict consumer.
  const context = [
    "https://schema.org",
    {
      digitalSourceType: {
        "@id": "http://www.iptc.org/std/nar/2006-10-01/digitalSourceType",
        "@type": "@id",
      },
    },
  ];
  return JSON.stringify({ "@context": context, "@graph": graph });
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
