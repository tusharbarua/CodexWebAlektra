const allowedTags = new Set([
  "p",
  "br",
  "h2",
  "h3",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "img",
  "figure",
  "figcaption"
]);

const selfClosingTags = new Set(["br", "img"]);

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function isSafeUrl(value: string, image = false) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("/")) {
    if (!image) return true;
    return /^\/(?:uploads|brand|brochure-assets|videos)\/.+\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i.test(trimmed);
  }
  try {
    const url = new URL(trimmed);
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (!image) return true;
    return /\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i.test(url.pathname);
  } catch {
    return false;
  }
}

function sanitizeAttributes(tag: string, rawAttributes: string) {
  const attributes: string[] = [];
  const attrPattern = /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  for (const match of rawAttributes.matchAll(attrPattern)) {
    const name = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    if (!name || name.startsWith("on") || name === "style" || name === "class") continue;

    if (tag === "a" && name === "href" && isSafeUrl(value)) {
      attributes.push(`href="${escapeAttribute(value)}"`);
      const external = /^https?:\/\//i.test(value);
      if (external) attributes.push('target="_blank"', 'rel="noreferrer noopener"');
      else attributes.push('rel="noreferrer"');
      continue;
    }

    if (tag === "a" && name === "title") {
      attributes.push(`title="${escapeAttribute(value)}"`);
      continue;
    }

    if (tag === "img" && name === "src" && isSafeUrl(value, true)) {
      attributes.push(`src="${escapeAttribute(value)}"`);
      attributes.push('loading="lazy"', 'decoding="async"');
      continue;
    }

    if (tag === "img" && ["alt", "title"].includes(name)) {
      attributes.push(`${name}="${escapeAttribute(value)}"`);
    }
  }

  if (tag === "img" && !attributes.some((attribute) => attribute.startsWith("alt="))) {
    attributes.push('alt=""');
  }
  return attributes.length ? ` ${Array.from(new Set(attributes)).join(" ")}` : "";
}

export function looksLikeHtml(value?: string | null) {
  return /<\/?(?:p|br|h2|h3|strong|b|em|i|u|ul|ol|li|blockquote|a|img|figure|figcaption)\b/i.test(String(value ?? ""));
}

export function sanitizeRichHtml(value?: string | null) {
  const raw = String(value ?? "");
  if (!raw.trim()) return "";
  return raw
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!doctype[\s\S]*?>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<\/?([a-zA-Z0-9]+)([^>]*)>/g, (full, tagName: string, attrs: string) => {
      const tag = tagName.toLowerCase();
      if (!allowedTags.has(tag)) return "";
      if (full.startsWith("</")) return selfClosingTags.has(tag) ? "" : `</${tag}>`;
      return `<${tag}${sanitizeAttributes(tag, attrs)}${selfClosingTags.has(tag) ? "" : ""}>`;
    })
    .replace(/\s+<\/(p|h2|h3|li|blockquote|figcaption)>/g, "</$1>")
    .trim();
}

export function plainTextToHtml(value?: string | null) {
  const blocks = String(value ?? "").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  return blocks.map((block) => {
    const rows = block.split(/\r?\n/).map((row) => row.trim()).filter(Boolean);
    if (rows.every((row) => row.startsWith("- "))) {
      return `<ul>${rows.map((row) => `<li>${escapeHtml(row.slice(2))}</li>`).join("")}</ul>`;
    }
    if (rows.every((row) => /^\d+\.\s/.test(row))) {
      return `<ol>${rows.map((row) => `<li>${escapeHtml(row.replace(/^\d+\.\s/, ""))}</li>`).join("")}</ol>`;
    }
    if (block.startsWith("### ")) return `<h3>${escapeHtml(block.slice(4))}</h3>`;
    if (block.startsWith("## ")) return `<h2>${escapeHtml(block.slice(3))}</h2>`;
    return `<p>${escapeHtml(block).replace(/\r?\n/g, "<br>")}</p>`;
  }).join("");
}

