/**
 * Shared tag utilities — safe to import in both client and server code.
 */

/**
 * Converts a tag name to a URL-safe slug.
 * e.g. "Web Development" → "web-development"
 */
export function generateTagSlug(tagName) {
  return tagName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
