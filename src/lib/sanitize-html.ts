// Minimal, dependency-free HTML sanitizer for rendering untrusted WordPress
// post HTML on the public site.
//
// INTERIM MITIGATION: the npm registry is currently unavailable to add a proper
// parser-based sanitizer (DOMPurify / sanitize-html). This strips the common
// stored-XSS vectors — script/style/iframe/object/embed elements, inline event
// handlers, and dangerous URI schemes — but it is regex-based and NOT a full
// HTML parser, so it should be replaced by DOMPurify + a nonce-based CSP.

// Elements removed together with their contents.
const DANGEROUS_ELEMENTS =
  /<\s*(script|style|iframe|object|embed|form|noscript|template|svg|math)\b[\s\S]*?(<\s*\/\s*\1\s*>|$)/gi;
// Void/standalone elements that have no closing tag.
const VOID_DANGEROUS = /<\s*(link|meta|base)\b[^>]*>/gi;

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  let html = input;

  html = html.replace(DANGEROUS_ELEMENTS, "");
  html = html.replace(VOID_DANGEROUS, "");

  // Inline event handlers: onclick=, onerror=, onload=, … (quoted or bare).
  html = html.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "");
  html = html.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "");

  // Dangerous URI schemes in href/src/xlink:href (allow data: only for images).
  html = html.replace(
    /\s(href|src|xlink:href)\s*=\s*("|')\s*(?:javascript:|vbscript:|data:(?!image\/))[^"']*\2/gi,
    ' $1="#"',
  );

  // Inline styles carrying script-y payloads (legacy IE expression / js url).
  html = html.replace(
    /\sstyle\s*=\s*("|')[^"']*(?:expression\(|javascript:)[^"']*\1/gi,
    "",
  );

  return html;
}
