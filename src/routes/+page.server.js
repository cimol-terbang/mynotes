import { postService } from '$lib/server/post.service.js';

export async function load({ url }) {
  const category = url.searchParams.get('category') || undefined;
  const validCategories = ['essay', 'poetry', 'story'];
  const activeCategory = validCategories.includes(category) ? category : null;

  try {
    const posts = await postService.listPosts(activeCategory ?? undefined, 'published');
    return { posts, activeCategory, error: null };
  } catch (err) {
    console.error('Failed to load posts:', err);
    return {
      posts: [],
      activeCategory,
      error: 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.',
    };
  }
}
