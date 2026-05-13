import { postService } from '$lib/server/post.service.js';
import { generateTagSlug } from '$lib/tags.js';

export async function load({ params }) {
  const tagSlug = params.tagSlug;
  const posts = await postService.getPostsByTag(tagSlug);

  // Derive display name from first matching tag in results
  const displayName = posts.length > 0
    ? posts[0].tags.find(t => generateTagSlug(t) === tagSlug) ?? tagSlug
    : tagSlug.replace(/-/g, ' ');

  return { posts, tagSlug, displayName };
}
