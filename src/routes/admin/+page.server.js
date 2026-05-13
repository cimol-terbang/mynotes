import { postService } from '$lib/server/post.service.js';

export async function load() {
  try {
    const posts = await postService.listPosts();
    return { posts };
  } catch (err) {
    console.error('Failed to load posts for admin:', err);
    return { posts: [], error: 'Gagal memuat daftar postingan.' };
  }
}
