import slugify from 'slugify';

/**
 * Converts a title to a URL-safe slug.
 */
export function generateSlug(title) {
  return slugify(title, { lower: true, strict: true, trim: true });
}

/**
 * Generates a unique slug from a title, checking against an array of existing slugs.
 * Appends numeric suffix (-1, -2, ...) if there's a collision.
 * Pure function — does not access the database.
 *
 * @param {string} title
 * @param {string[]} existingSlugs
 * @returns {string}
 */
export function generateUniqueSlug(title, existingSlugs) {
  const baseSlug = generateSlug(title);
  const slugSet = new Set(existingSlugs);

  if (!slugSet.has(baseSlug)) return baseSlug;

  let counter = 1;
  let candidate = `${baseSlug}-${counter}`;
  while (slugSet.has(candidate)) {
    counter++;
    candidate = `${baseSlug}-${counter}`;
  }
  return candidate;
}
