import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

marked.setOptions({ gfm: true, breaks: false });

/** Valid size values for the size parameter */
const VALID_SIZES = new Set(['small', 'medium', 'large', 'full']);

/** Allowed URL protocols / prefixes */
const ALLOWED_URL_PREFIXES = ['https://', 'http://', '/'];

/**
 * Escapes HTML special characters in a string so it is safe to embed
 * inside an HTML attribute value.
 *
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Returns true when the URL is allowed (https://, http://, or a relative
 * path starting with /).
 *
 * @param {string} url
 * @returns {boolean}
 */
function isAllowedUrl(url) {
  return ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
}

/**
 * Parses image shortcodes of the form
 *   {{image:URL|alt=ALT|caption=CAPTION|size=SIZE}}
 * and replaces them with the appropriate HTML (<img> or <figure>).
 *
 * Rules:
 * - URL validation: only https://, http://, or paths starting with / are
 *   allowed. Other URLs produce an <img> without a src attribute.
 * - Recognised parameters: alt, caption, size (small|medium|large|full).
 *   Unknown parameters are silently ignored.
 * - alt and caption values are HTML-escaped before being placed in attributes.
 *
 * @param {string} content - Raw Markdown content
 * @returns {string} - Content with shortcodes replaced by HTML
 */
export function parseImageShortcodes(content) {
  // Regex: group 1 = URL, group 2 = optional parameter string (including leading |)
  const SHORTCODE_RE = /\{\{image:([^|}]+)(\|[^}]*)?\}\}/g;

  return content.replace(SHORTCODE_RE, (_match, rawUrl, rawParams) => {
    const url = rawUrl.trim();

    // Parse optional parameters
    let alt = '';
    let caption = '';
    let size = '';

    if (rawParams) {
      // rawParams starts with '|', so split on '|' and skip the first empty element
      const paramParts = rawParams.split('|').filter(Boolean);
      for (const part of paramParts) {
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1) continue; // no '=' → not a valid key=value pair, ignore
        const key = part.slice(0, eqIdx).trim();
        const value = part.slice(eqIdx + 1); // keep everything after first '='
        if (key === 'alt') {
          alt = value;
        } else if (key === 'caption') {
          caption = value;
        } else if (key === 'size') {
          if (VALID_SIZES.has(value.trim())) {
            size = value.trim();
          }
          // invalid size value → silently ignored
        }
        // unknown keys are silently ignored
      }
    }

    // Build <img> element
    const escapedAlt = escapeHtml(alt);
    const classAttr = size ? ` class="img-${size}"` : '';
    const srcAttr = isAllowedUrl(url) ? ` src="${url}"` : '';
    const imgTag = `<img${srcAttr} alt="${escapedAlt}"${classAttr}>`;

    // Wrap in <figure> when caption is present
    if (caption) {
      const escapedCaption = escapeHtml(caption);
      return `<figure>${imgTag}<figcaption>${escapedCaption}</figcaption></figure>`;
    }

    return imgTag;
  });
}

/**
 * Converts Markdown (including image shortcodes) to sanitized HTML.
 * Idempotent: same input always produces same output.
 *
 * Pipeline:
 *   content → parseImageShortcodes → marked.parse → sanitizeHtml → safeHtml
 *
 * @param {string} content
 * @returns {string}
 */
export function renderMarkdown(content) {
  const expanded = parseImageShortcodes(content);
  const rawHtml = marked.parse(expanded, { async: false });
  return sanitizeHtml(rawHtml, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat([
      'img', 'figure', 'figcaption', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    ]),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt', 'class', 'title'],
      '*': ['class'],
    },
  });
}
