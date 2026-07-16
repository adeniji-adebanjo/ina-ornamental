import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { sanitizeHtml } from "@/lib/sanitize-html";

describe("sanitizeHtml", () => {
  test("removes <script> elements and their contents", () => {
    assert.equal(sanitizeHtml("<p>Hi</p><script>alert(1)</script>"), "<p>Hi</p>");
  });

  test("removes iframe/object/embed/style", () => {
    assert.equal(
      sanitizeHtml(`<iframe src="//evil"></iframe><h2>ok</h2>`),
      "<h2>ok</h2>",
    );
    assert.ok(!/<(object|embed|style)/i.test(sanitizeHtml(
      `<object data="x"></object><embed src="y"><style>b{}</style><p>t</p>`,
    )));
  });

  test("strips inline event handlers (quoted and bare)", () => {
    assert.equal(sanitizeHtml(`<img src=x onerror="alert(1)">`), "<img src=x>");
    assert.equal(sanitizeHtml(`<p onclick=alert(1)>t</p>`), "<p>t</p>");
  });

  test("neutralizes javascript:/vbscript: URIs", () => {
    assert.equal(sanitizeHtml(`<a href="javascript:alert(1)">x</a>`), `<a href="#">x</a>`);
    assert.equal(sanitizeHtml(`<a href='vbscript:x'>y</a>`), `<a href="#">y</a>`);
  });

  test("preserves safe links, images and formatting", () => {
    const safe = `<a href="https://ok.com">safe</a> <img src="/wp-content/x.jpg"><strong>bold</strong>`;
    assert.equal(sanitizeHtml(safe), safe);
  });

  test("allows data: URIs only for images", () => {
    assert.ok(sanitizeHtml(`<img src="data:image/png;base64,AAA">`).includes("data:image/png"));
    assert.equal(sanitizeHtml(`<a href="data:text/html,hello">x</a>`), `<a href="#">x</a>`);
  });

  test("neutralizes a script embedded inside an attribute value (stays safe)", () => {
    const out = sanitizeHtml(`<a href="data:text/html,<script>alert(1)</script>">x</a>`);
    assert.ok(!/<script/i.test(out), "no script tag survives");
    assert.ok(!/data:text\/html/i.test(out) || /href="#"/.test(out));
  });

  test("empty input", () => {
    assert.equal(sanitizeHtml(""), "");
  });
});
