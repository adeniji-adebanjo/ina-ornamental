import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml } from "@/lib/sanitize-html";

describe("sanitizeHtml", () => {
  test("removes <script> elements and their contents", () => {
    assert.equal(sanitizeHtml("<p>Hi</p><script>alert(1)</script>"), "<p>Hi</p>");
  });

  test("removes iframe/object/embed/style", () => {
    const out = sanitizeHtml(
      `<iframe src="//evil"></iframe><object data="x"></object><embed src="y"><style>b{}</style><h2>ok</h2>`,
    );
    assert.ok(!/<(iframe|object|embed|style)/i.test(out));
    assert.ok(out.includes("<h2>ok</h2>"));
  });

  test("strips inline event handlers (quoted and bare)", () => {
    assert.ok(!/onerror/i.test(sanitizeHtml(`<img src="x.jpg" onerror="alert(1)">`)));
    assert.equal(sanitizeHtml(`<p onclick=alert(1)>t</p>`), "<p>t</p>");
  });

  test("strips handlers with no whitespace before them (regex bypass)", () => {
    const out = sanitizeHtml(`<img src=x/onerror=alert(1)>`);
    assert.ok(!/\sonerror\s*=/i.test(out), out);
  });

  test("drops javascript:/vbscript: URIs, quoted, unquoted or entity-encoded", () => {
    for (const html of [
      `<a href="javascript:alert(1)">x</a>`,
      `<a href='vbscript:x'>x</a>`,
      `<a href=javascript:alert(1)>x</a>`,
      `<a href="jav&#x61;script:alert(1)">x</a>`,
    ]) {
      const out = sanitizeHtml(html);
      assert.ok(!/script:/i.test(out), `${html} → ${out}`);
    }
  });

  test("preserves safe links, images and formatting", () => {
    const out = sanitizeHtml(
      `<a href="https://ok.com">safe</a> <img src="/wp-content/x.jpg" alt="fish"><strong>bold</strong>`,
    );
    assert.ok(out.includes(`<a href="https://ok.com">safe</a>`));
    assert.ok(out.includes(`<img src="/wp-content/x.jpg" alt="fish" />`));
    assert.ok(out.includes("<strong>bold</strong>"));
  });

  test("allows data: URIs only for images", () => {
    assert.ok(sanitizeHtml(`<img src="data:image/png;base64,AAA">`).includes("data:image/png"));
    assert.ok(!sanitizeHtml(`<a href="data:text/html,hello">x</a>`).includes("data:"));
  });

  test("adds rel=noopener to target=_blank links", () => {
    assert.ok(
      sanitizeHtml(`<a href="https://x.com" target="_blank">x</a>`).includes(
        `rel="noopener noreferrer"`,
      ),
    );
  });

  test("empty input", () => {
    assert.equal(sanitizeHtml(""), "");
  });
});
