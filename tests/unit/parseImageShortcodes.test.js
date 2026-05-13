import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { parseImageShortcodes, renderMarkdown } from '../../src/lib/utils/markdown.js';

// ---------------------------------------------------------------------------
// 2.1 Unit tests — specific cases
// ---------------------------------------------------------------------------

describe('parseImageShortcodes — unit tests', () => {
  // Minimal shortcode: only URL, no parameters
  it('minimal shortcode produces <img> with src and empty alt', () => {
    const result = parseImageShortcodes('{{image:https://example.com/img.jpg}}');
    expect(result).toContain('<img');
    expect(result).toContain('src="https://example.com/img.jpg"');
    expect(result).toContain('alt=""');
  });

  // All parameters present
  it('shortcode with all parameters produces <figure> with all attributes', () => {
    const result = parseImageShortcodes(
      '{{image:https://example.com/img.jpg|alt=A cat|caption=A cute cat|size=medium}}'
    );
    expect(result).toContain('<figure>');
    expect(result).toContain('src="https://example.com/img.jpg"');
    expect(result).toContain('alt="A cat"');
    expect(result).toContain('class="img-medium"');
    expect(result).toContain('<figcaption>A cute cat</figcaption>');
    expect(result).toContain('</figure>');
  });

  // Dangerous URL: javascript: protocol
  it('javascript: URL produces <img> without src attribute', () => {
    const result = parseImageShortcodes('{{image:javascript:alert(1)|alt=xss}}');
    expect(result).not.toContain('src=');
    expect(result).toContain('<img');
    expect(result).toContain('alt="xss"');
  });

  // Dangerous URL: data: protocol
  it('data: URL produces <img> without src attribute', () => {
    const result = parseImageShortcodes('{{image:data:text/html,<h1>xss</h1>}}');
    expect(result).not.toContain('src=');
  });

  // Unknown parameters are ignored
  it('unknown parameters are ignored and image is still rendered', () => {
    const result = parseImageShortcodes(
      '{{image:https://example.com/img.jpg|foo=bar|baz=qux|alt=test}}'
    );
    expect(result).toContain('<img');
    expect(result).toContain('src="https://example.com/img.jpg"');
    expect(result).toContain('alt="test"');
    expect(result).not.toContain('foo=');
    expect(result).not.toContain('baz=');
  });

  // HTML characters in alt are escaped
  it('HTML characters in alt are escaped', () => {
    const result = parseImageShortcodes(
      '{{image:https://example.com/img.jpg|alt=<script>"xss"</script>}}'
    );
    expect(result).toContain('&lt;script&gt;');
    expect(result).toContain('&quot;xss&quot;');
    expect(result).toContain('&lt;/script&gt;');
    expect(result).not.toContain('<script>');
  });

  // HTML characters in caption are escaped
  it('HTML characters in caption are escaped', () => {
    const result = parseImageShortcodes(
      '{{image:https://example.com/img.jpg|caption=<b>"bold"</b>}}'
    );
    expect(result).toContain('&lt;b&gt;');
    expect(result).toContain('&quot;bold&quot;');
    expect(result).not.toContain('<b>');
  });

  // Relative path URL is allowed
  it('relative path starting with / is allowed', () => {
    const result = parseImageShortcodes('{{image:/uploads/images/photo.jpg|alt=photo}}');
    expect(result).toContain('src="/uploads/images/photo.jpg"');
  });

  // http:// URL is allowed
  it('http:// URL is allowed', () => {
    const result = parseImageShortcodes('{{image:http://example.com/img.jpg}}');
    expect(result).toContain('src="http://example.com/img.jpg"');
  });

  // Invalid size value is ignored (no class added)
  it('invalid size value is ignored', () => {
    const result = parseImageShortcodes(
      '{{image:https://example.com/img.jpg|size=huge}}'
    );
    expect(result).not.toContain('class=');
  });

  // Content without shortcode is unchanged
  it('content without shortcode is returned unchanged', () => {
    const input = '# Hello\n\nThis is a paragraph.';
    expect(parseImageShortcodes(input)).toBe(input);
  });

  // Multiple shortcodes in one string
  it('multiple shortcodes in one string are all replaced', () => {
    const result = parseImageShortcodes(
      '{{image:https://a.com/1.jpg|alt=one}} and {{image:https://b.com/2.jpg|alt=two}}'
    );
    expect(result).toContain('src="https://a.com/1.jpg"');
    expect(result).toContain('alt="one"');
    expect(result).toContain('src="https://b.com/2.jpg"');
    expect(result).toContain('alt="two"');
  });
});

// ---------------------------------------------------------------------------
// Arbitraries (generators) shared across property tests
// ---------------------------------------------------------------------------

/** Valid URL: https://, http://, or relative path starting with / */
const validUrlArb = fc.oneof(
  fc.webUrl({ validSchemes: ['https', 'http'] }),
  fc
    .string({ minLength: 1, maxLength: 50 })
    .map((s) => '/' + s.replace(/[{}|]/g, '_').trim())
    .filter((s) => s.length > 1) // ensure it's more than just "/"
);

/** Alt text: printable ASCII, no shortcode-breaking characters and no HTML special chars */
const safeTextArb = fc
  .string({ minLength: 0, maxLength: 80 })
  .map((s) => s.replace(/[{}|<>"&]/g, '_'));

/** Caption text: same constraints as alt, no HTML special chars */
const captionArb = fc
  .string({ minLength: 1, maxLength: 80 })
  .map((s) => s.replace(/[{}|<>"&]/g, '_'));

/** Valid size values */
const sizeArb = fc.constantFrom('small', 'medium', 'large', 'full');

/** Invalid URL: does not start with https://, http://, or / */
const invalidUrlArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter(
    (s) =>
      !s.startsWith('https://') &&
      !s.startsWith('http://') &&
      !s.startsWith('/') &&
      s.length > 0
  )
  .map((s) => s.replace(/[{}|]/g, '_'));

/** String containing at least one HTML special character */
const htmlSpecialArb = fc
  .tuple(
    fc.string({ minLength: 0, maxLength: 20 }).map((s) => s.replace(/[{}|]/g, '_')),
    fc.constantFrom('<', '>', '"'),
    fc.string({ minLength: 0, maxLength: 20 }).map((s) => s.replace(/[{}|]/g, '_'))
  )
  .map(([pre, special, post]) => pre + special + post);

// ---------------------------------------------------------------------------
// 2.2 Property 1: Basic shortcode produces <img> with correct src and alt
// ---------------------------------------------------------------------------

describe('Property 1: basic shortcode produces <img> with correct src and alt', () => {
  // Feature: insert-picture, Property 1: shortcode dasar menghasilkan <img> dengan src dan alt yang benar
  it('for any valid URL and alt text, produces <img> with matching src and alt', () => {
    fc.assert(
      fc.property(validUrlArb, safeTextArb, (url, alt) => {
        const shortcode = `{{image:${url}|alt=${alt}}}`;
        const result = parseImageShortcodes(shortcode);
        const trimmedUrl = url.trim();

        // Must contain an <img> element
        expect(result).toContain('<img');

        // src must match the trimmed URL (implementation trims the URL)
        expect(result).toContain(`src="${trimmedUrl}"`);

        // alt must match (safeTextArb has no HTML chars so no escaping needed)
        expect(result).toContain(`alt="${alt}"`);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 2.3 Property 2: Shortcode with caption produces <figure>/<figcaption>
// ---------------------------------------------------------------------------

describe('Property 2: shortcode with caption produces <figure>/<figcaption>', () => {
  // Feature: insert-picture, Property 2: shortcode dengan caption menghasilkan <figure>/<figcaption>
  it('for any valid URL and caption, produces <figure> wrapping <img> with <figcaption>', () => {
    fc.assert(
      fc.property(validUrlArb, captionArb, (url, caption) => {
        const shortcode = `{{image:${url}|caption=${caption}}}`;
        const result = parseImageShortcodes(shortcode);

        expect(result).toContain('<figure>');
        expect(result).toContain('</figure>');
        expect(result).toContain('<figcaption>');
        expect(result).toContain('</figcaption>');
        expect(result).toContain('<img');
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 2.4 Property 3: size parameter produces correct CSS class
// ---------------------------------------------------------------------------

describe('Property 3: size parameter produces correct CSS class', () => {
  // Feature: insert-picture, Property 3: parameter size menghasilkan class CSS yang sesuai
  it('for any valid URL and size from {small,medium,large,full}, produces img with class img-SIZE', () => {
    fc.assert(
      fc.property(validUrlArb, sizeArb, (url, size) => {
        const shortcode = `{{image:${url}|size=${size}}}`;
        const result = parseImageShortcodes(shortcode);

        expect(result).toContain('<img');
        expect(result).toContain(`class="img-${size}"`);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 2.5 Property 4: combination of all parameters produces complete output
// ---------------------------------------------------------------------------

describe('Property 4: combination of all parameters produces complete output', () => {
  // Feature: insert-picture, Property 4: kombinasi semua parameter menghasilkan output lengkap
  it('for any valid URL, alt, caption, and size, produces HTML with all attributes and elements', () => {
    fc.assert(
      fc.property(validUrlArb, safeTextArb, captionArb, sizeArb, (url, alt, caption, size) => {
        const shortcode = `{{image:${url}|alt=${alt}|caption=${caption}|size=${size}}}`;
        const result = parseImageShortcodes(shortcode);
        const trimmedUrl = url.trim();

        // Must have figure structure (because caption is present)
        expect(result).toContain('<figure>');
        expect(result).toContain('</figure>');
        expect(result).toContain('<figcaption>');

        // Must have img with all attributes
        expect(result).toContain('<img');
        expect(result).toContain(`src="${trimmedUrl}"`);
        expect(result).toContain(`alt="${alt}"`);
        expect(result).toContain(`class="img-${size}"`);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 2.6 Property 5: HTML characters in alt/caption are escaped correctly
// ---------------------------------------------------------------------------

describe('Property 5: HTML characters in alt/caption are escaped correctly', () => {
  // Feature: insert-picture, Property 5: karakter HTML dalam alt/caption di-escape dengan benar
  it('strings with <, >, or " in alt are escaped as HTML entities', () => {
    fc.assert(
      fc.property(htmlSpecialArb, (altWithHtml) => {
        const shortcode = `{{image:https://example.com/img.jpg|alt=${altWithHtml}}}`;
        const result = parseImageShortcodes(shortcode);

        // The raw < > " characters must not appear unescaped inside the alt attribute
        // We check by verifying the escaped forms are present when the original chars are present
        if (altWithHtml.includes('<')) {
          expect(result).toContain('&lt;');
        }
        if (altWithHtml.includes('>')) {
          expect(result).toContain('&gt;');
        }
        if (altWithHtml.includes('"')) {
          expect(result).toContain('&quot;');
        }
      }),
      { numRuns: 100 }
    );
  });

  it('strings with <, >, or " in caption are escaped as HTML entities', () => {
    fc.assert(
      fc.property(htmlSpecialArb, (captionWithHtml) => {
        const shortcode = `{{image:https://example.com/img.jpg|caption=${captionWithHtml}}}`;
        const result = parseImageShortcodes(shortcode);

        if (captionWithHtml.includes('<')) {
          expect(result).toContain('&lt;');
        }
        if (captionWithHtml.includes('>')) {
          expect(result).toContain('&gt;');
        }
        if (captionWithHtml.includes('"')) {
          expect(result).toContain('&quot;');
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 2.7 Property 6: disallowed URL protocol produces <img> without src
// ---------------------------------------------------------------------------

describe('Property 6: disallowed URL protocol produces <img> without src', () => {
  // Feature: insert-picture, Property 6: URL dengan protokol tidak diizinkan menghasilkan <img> tanpa src
  it('for any URL not starting with https://, http://, or /, produces <img> without src attribute', () => {
    fc.assert(
      fc.property(invalidUrlArb, (url) => {
        const shortcode = `{{image:${url}}}`;
        const result = parseImageShortcodes(shortcode);

        expect(result).toContain('<img');
        expect(result).not.toContain('src=');
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// 2.8 Property 7: renderMarkdown() is deterministic for the same input
// ---------------------------------------------------------------------------

describe('Property 7: renderMarkdown() is deterministic for the same input', () => {
  // Feature: insert-picture, Property 7: renderMarkdown() bersifat deterministik untuk input yang sama
  it('calling renderMarkdown() twice with the same content always produces identical output', () => {
    const contentArb = fc.oneof(
      // Plain markdown without shortcodes
      fc.string({ minLength: 0, maxLength: 200 }),
      // Content with image shortcodes
      fc.tuple(validUrlArb, safeTextArb, captionArb, sizeArb).map(
        ([url, alt, caption, size]) =>
          `Some text\n\n{{image:${url}|alt=${alt}|caption=${caption}|size=${size}}}\n\nMore text`
      ),
      // Content with invalid URL shortcode
      invalidUrlArb.map((url) => `{{image:${url}|alt=test}}`)
    );

    fc.assert(
      fc.property(contentArb, (content) => {
        const first = renderMarkdown(content);
        const second = renderMarkdown(content);
        expect(first).toBe(second);
      }),
      { numRuns: 100 }
    );
  });
});
