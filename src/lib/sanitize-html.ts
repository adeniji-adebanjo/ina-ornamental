// Sanitizer for rendering untrusted WordPress post HTML on the public site.
//
// Allow-list based and backed by a real HTML parser (htmlparser2 via
// sanitize-html), so malformed markup like `<img src=x/onerror=…>` or an
// unquoted / entity-encoded `javascript:` href can't slip through the way
// they could with the previous regex filter.
import sanitize from "sanitize-html";

const OPTIONS: sanitize.IOptions = {
  allowedTags: [
    ...sanitize.defaults.allowedTags,
    "img",
    "figure",
    "figcaption",
    "picture",
    "source",
    "video",
    "audio",
    "del",
    "ins",
    "sup",
    "sub",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel", "title"],
    img: ["src", "srcset", "sizes", "alt", "title", "width", "height", "loading"],
    source: ["src", "srcset", "type", "media", "sizes"],
    video: ["src", "poster", "controls", "width", "height", "preload"],
    audio: ["src", "controls", "preload"],
    "*": ["class", "id", "style", "align"],
    td: ["colspan", "rowspan"],
    th: ["colspan", "rowspan", "scope"],
    ol: ["start", "type", "reversed"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // data: URIs only on images (inline base64 thumbnails WordPress emits).
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: true,
  // Only harmless presentational styles survive.
  allowedStyles: {
    "*": {
      "text-align": [/^(left|right|center|justify)$/],
      color: [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i],
      "font-weight": [/^(normal|bold|\d{3})$/],
      "font-style": [/^(normal|italic)$/],
      width: [/^\d+(px|%)$/],
      height: [/^\d+(px|%)$/],
    },
  },
  // Removed together with their contents, not just unwrapped.
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "template", "svg", "math"],
  transformTags: {
    // Links that open a new tab can't reach back into our page.
    a: (tagName, attribs) => ({
      tagName,
      attribs:
        attribs.target === "_blank"
          ? { ...attribs, rel: "noopener noreferrer" }
          : attribs,
    }),
  },
};

export function sanitizeHtml(input: string): string {
  if (!input) return "";
  return sanitize(input, OPTIONS);
}
