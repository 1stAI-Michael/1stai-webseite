import { siteConfig } from "../lib/site";
import { getPostsForLang } from "../content/blog/posts";

export const dynamic = "force-static";

export default function sitemap() {
  const now = new Date();
  const privacyByLang = { de: "datenschutz", en: "privacy" };
  const entries = [];
  for (const lang of siteConfig.locales) {
    for (const p of ["", "kontakt", "impressum", privacyByLang[lang]]) {
      entries.push({
        url: `${siteConfig.url}/${lang}${p ? `/${p}` : ""}/`,
        lastModified: now,
        changeFrequency: "monthly",
        priority: p ? 0.7 : 1.0,
      });
    }
    entries.push({
      url: `${siteConfig.url}/${lang}/blog/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    });
    for (const post of getPostsForLang(lang)) {
      entries.push({
        url: `${siteConfig.url}/${lang}/blog/${post.slug}/`,
        lastModified: new Date(post.updated || post.date),
        changeFrequency: "monthly",
        priority: 0.8,
      });
    }
  }
  entries.push({
    url: `${siteConfig.url}/atemuebung/`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.7,
  });
  entries.push({
    url: `${siteConfig.url}/polityka-prywatnosci/`,
    lastModified: now,
    changeFrequency: "monthly",
    priority: 0.5,
  });
  return entries;
}
