import { postService } from '$lib/server/post.service.js';

async function fetchRandomQuote() {
  try {
    const res = await fetch('https://dummyjson.com/quotes/random');
    if (!res.ok) throw new Error('API error');
    const json = await res.json();
    return {
      text: json.quote,
      author: json.author,
    };
  } catch {
    return {
      text: 'The unexamined life is not worth living.',
      author: 'Socrates',
    };
  }
}

export async function load({ url }) {
  const category = url.searchParams.get('category') || undefined;
  const validCategories = ['essay', 'poetry', 'story'];
  const activeCategory = validCategories.includes(category) ? category : null;

  const [postsResult, quoteResult] = await Promise.allSettled([
    postService.listPosts(activeCategory ?? undefined, 'published'),
    fetchRandomQuote(),
  ]);

  const posts = postsResult.status === 'fulfilled' ? postsResult.value : [];
  const postError = postsResult.status === 'rejected'
    ? 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.'
    : null;

  if (postsResult.status === 'rejected') {
    console.error('Failed to load posts:', postsResult.reason);
  }

  return {
    posts,
    activeCategory,
    error: postError,
    quote: quoteResult.status === 'fulfilled' ? quoteResult.value : null,
  };
}
