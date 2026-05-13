import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitizes comment content to prevent XSS.
 * Strips all HTML tags and dangerous protocol strings.
 *
 * @param {string} content
 * @returns {string}
 */
export function sanitizeCommentContent(content) {
  const stripped = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return stripped.replace(/javascript:/gi, '').replace(/data:/gi, '');
}

/**
 * Normalizes author name — returns "Anonym" if empty or whitespace-only.
 *
 * @param {string} name
 * @returns {string}
 */
export function normalizeAuthorName(name) {
  const trimmed = name.trim();
  return trimmed.length === 0 ? 'Anonym' : trimmed;
}
