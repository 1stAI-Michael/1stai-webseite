# 1stai-webseite

Next.js 15 App Router · static export · DE/EN i18n · deploys to Hetzner Webhosting (`1stai.eu`).

## Quick start

```bash
cd /srv/Container/1stai-webseite
npm install
npm run dev                   # http://localhost:3000 → redirects to /en/
npm run build                 # static export → out/
sh ./scripts/deploy-webspace.sh
```

## Routes (Phase 1)

| Route | Purpose |
|---|---|
| `/` | Redirect → `/en/` |
| `/en/`, `/de/` | Homepage (hero + sneak-peek of upcoming sections) |
| `/en/blog/`, `/de/blog/` | Blog index |
| `/en/blog/<slug>/`, `/de/blog/<slug>/` | Blog post (bilingual, shared slug) |
| `/en/feed.xml`, `/de/feed.xml` | RSS feed per language |
| `/en/kontakt/` (alias: `/en/contact/`), `/de/kontakt/` | Contact |
| `/en/impressum/` (alias: `/en/imprint/`), `/de/impressum/` | Imprint (JDG in Gründung Q3/Q4 2026) |
| `/Recorder/`, `/Settings/` | Mobile recorder PWA with local queue and API upload |
| `/atemuebung/` | HRV breathing exercise with sweep mode |

## Blog

Bilingual, one post object with `de` and `en` blocks sharing the slug. See
**`BLOG-WORKFLOW.md`** for the full seven-step process (draft → images → social →
verify → deploy).

```bash
npm run blog:assets -- --slug <slug>   # render all 6 branded image formats
npm run blog:check                     # validate content, images, social copy
npm run blog:verify                    # build + validate the exported HTML
```

- `src/content/blog/posts.js` — content, single source of truth for both languages
- `src/lib/markdown.js` — MD→HTML (tables, code, quotes, links); escapes all input
- `src/lib/blogSchema.js` — JSON-LD is generated, never hand-written
- `blog-inbox/<slug>/` — image prompts + externally generated source images
- `blog-drafts/<slug>/social/` — LinkedIn / X / Instagram copy, DE + EN
- `assets/fonts/` — Space Grotesk + Manrope vendored so renders work offline

## Brand source of truth

- `src/lib/site.js` — name, address, legal, family links
- `src/lib/i18n.js` — DE/EN copy
- `src/components/LogoMark.jsx` — inline SVG of the Layered Wedge
- `public/assets/` — SVG variants (mark, mono, white, wordmark, favicon)
- `public/favicon.svg` — favicon (copy of `1stai-favicon.svg`)

## Deploy / Env

`scripts/deploy-webspace.sh` reads from `/srv/Container/.env`:

- `HETZNER_SFTP_HOST` — `blom.your-vhost.de`
- `HETZNER_SFTP_PORT` — `22`
- `HETZNER_SFTP_USER_1STAI`
- `HETZNER_SFTP_PASS`
- `HETZNER_SFTP_REMOTE_DIR_1STAI` (optional, default `/`)
- `NEXT_PUBLIC_SITE_URL` (optional, default `https://1stai.eu`)

## TODO (Phase 2+)

See `/srv/Container/.claude/` task list — tracked in the headless Claude session.
Outstanding work:

- Migrate Leistungen (`lokale-llms`, `lokale-ki-dokumentation`, `telefonagenten`)
- Migrate 8 blog posts from the-implementers into the bilingual `posts.js` structure
  (blog infrastructure itself is done — see `BLOG-WORKFLOW.md`)
- Migrate FAQ (`content/faq.js`)
- Replace TI-logo images with 1stAI mark
- Full EN translations of all blog posts and leistungen
