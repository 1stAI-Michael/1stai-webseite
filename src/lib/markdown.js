/**
 * Minimal, dependency-free Markdown → HTML renderer for blog bodies.
 *
 * Supports what the 1stAI blog actually uses:
 *   headings h2–h4, paragraphs, hard breaks, ordered + unordered lists,
 *   GFM tables, blockquotes, fenced code blocks, thematic breaks,
 *   inline: `code`, **bold**, *italic*, [label](url), bare URLs.
 *
 * Deliberately NOT a full CommonMark implementation. It escapes all input,
 * so post bodies are plain text — never inject raw HTML through here.
 */

const EXTERNAL_NOTE = {
  de: "externer Link",
  en: "external link",
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isInternal(href) {
  return href.startsWith("/") || href.startsWith("#");
}

/**
 * Both `href` and `label` arrive already HTML-escaped — inline() escapes the
 * whole string before it extracts links. Escaping again here would turn
 * `?a=1&b=2` into `&amp;amp;`.
 */
function renderLink(href, label, lang) {
  if (isInternal(href)) {
    return `<a href="${href}">${label}</a>`;
  }
  const note = EXTERNAL_NOTE[lang] || EXTERNAL_NOTE.en;
  return (
    `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>` +
    ` <span class="text-ink-muted text-sm">(${note})</span>`
  );
}

/**
 * Inline formatting. Code spans are extracted first so that markup inside
 * them stays literal, then re-inserted at the end.
 */
function inline(raw, lang) {
  const codeSpans = [];
  let text = String(raw).replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return `@@CODE${codeSpans.length - 1}@@`;
  });

  text = escapeHtml(text);

  // Markdown links first — parked as tokens so the bare-URL pass below
  // cannot re-linkify the href it just produced.
  const links = [];
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
    links.push(renderLink(href, label, lang));
    return `@@LINK${links.length - 1}@@`;
  });

  text = text.replace(/(^|[\s(])(https?:\/\/[^\s<)]+)/g, (_, lead, url) => {
    const trimmed = url.replace(/[.,;:]+$/, "");
    const tail = url.slice(trimmed.length);
    links.push(renderLink(trimmed, trimmed, lang));
    return `${lead}@@LINK${links.length - 1}@@${tail}`;
  });

  text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");

  text = text.replace(/@@LINK(\d+)@@/g, (_, i) => links[Number(i)]);
  text = text.replace(
    /@@CODE(\d+)@@/g,
    (_, i) => `<code>${escapeHtml(codeSpans[Number(i)])}</code>`
  );

  return text;
}

function splitTableRow(line) {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

const TABLE_DIVIDER = /^\s*\|?[\s:-]*-[\s|:-]*\|?\s*$/;

export function markdownToHtml(markdown, lang = "de") {
  if (!markdown) return "";

  const lines = String(markdown).replace(/\r\n/g, "\n").split("\n");
  const out = [];

  let paragraph = [];
  let listType = null; // "ul" | "ol" | null
  let quote = [];

  const flushParagraph = () => {
    if (!paragraph.length) return;
    out.push(`<p>${inline(paragraph.join(" "), lang)}</p>`);
    paragraph = [];
  };

  const closeList = () => {
    if (!listType) return;
    out.push(`</${listType}>`);
    listType = null;
  };

  const flushQuote = () => {
    if (!quote.length) return;
    out.push(`<blockquote>${markdownToHtml(quote.join("\n"), lang)}</blockquote>`);
    quote = [];
  };

  const flushAll = () => {
    flushParagraph();
    closeList();
    flushQuote();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushAll();
      continue;
    }

    // Fenced code block — consume until the closing fence.
    if (line.startsWith("```")) {
      flushAll();
      const language = line.slice(3).trim();
      const body = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        body.push(lines[i]);
        i += 1;
      }
      const cls = language ? ` class="language-${escapeHtml(language)}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(body.join("\n"))}</code></pre>`);
      continue;
    }

    // GFM table — header row followed by a divider row.
    if (line.includes("|") && i + 1 < lines.length && TABLE_DIVIDER.test(lines[i + 1])) {
      flushAll();
      const header = splitTableRow(line);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim()) {
        rows.push(splitTableRow(lines[i].trim()));
        i += 1;
      }
      i -= 1;
      const head = header.map((c) => `<th>${inline(c, lang)}</th>`).join("");
      const body = rows
        .map((cells) => `<tr>${cells.map((c) => `<td>${inline(c, lang)}</td>`).join("")}</tr>`)
        .join("");
      out.push(
        `<div class="overflow-x-auto"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`
      );
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line)) {
      flushAll();
      out.push("<hr />");
      continue;
    }

    if (line.startsWith("> ")) {
      flushParagraph();
      closeList();
      quote.push(line.slice(2));
      continue;
    }
    if (line === ">") {
      quote.push("");
      continue;
    }

    // Standalone image line → figure with the alt text as caption.
    // Inline images inside a paragraph are deliberately not supported.
    const figure = /^!\[([^\]]*)\]\(([^)\s]+)\)$/.exec(line);
    if (figure) {
      flushAll();
      const alt = escapeHtml(figure[1]);
      const src = escapeHtml(figure[2]);
      out.push(
        `<figure><img src="${src}" alt="${alt}" loading="lazy" decoding="async" />` +
          (figure[1] ? `<figcaption>${inline(figure[1], lang)}</figcaption>` : "") +
          "</figure>"
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      // h1 is reserved for the post title rendered by the page itself.
      const level = Math.min(Math.max(heading[1].length, 2), 4);
      out.push(`<h${level}>${inline(heading[2], lang)}</h${level}>`);
      continue;
    }

    const ordered = /^(\d+)[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      flushQuote();
      if (listType !== "ol") {
        closeList();
        out.push("<ol>");
        listType = "ol";
      }
      out.push(`<li>${inline(ordered[2], lang)}</li>`);
      continue;
    }

    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      flushQuote();
      if (listType !== "ul") {
        closeList();
        out.push("<ul>");
        listType = "ul";
      }
      out.push(`<li>${inline(bullet[1], lang)}</li>`);
      continue;
    }

    flushQuote();
    closeList();
    paragraph.push(rawLine.endsWith("  ") ? `${line}<br />` : line);
  }

  flushAll();
  return out.join("");
}

/** Word count of the rendered prose — feeds JSON-LD `wordCount`. */
export function countWords(markdown) {
  if (!markdown) return 0;
  const plain = String(markdown)
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_|`-]/g, " ");
  const matches = plain.match(/\p{L}[\p{L}\p{N}'’-]*/gu);
  return matches ? matches.length : 0;
}

/** Reading time in minutes, 200 wpm, floored at 1. */
export function readingMinutes(markdown) {
  return Math.max(1, Math.round(countWords(markdown) / 200));
}
