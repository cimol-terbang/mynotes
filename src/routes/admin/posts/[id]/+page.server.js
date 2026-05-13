import { fail, redirect, error } from '@sveltejs/kit';
import { postService } from '$lib/server/post.service.js';

export async function load({ params }) {
  const posts = await postService.listPosts();
  const post = posts.find(p => p._id === params.id);
  if (!post) throw error(404, 'Postingan tidak ditemukan.');

  // Get full post with content and all existing tags in parallel
  const [fullPost, existingTags] = await Promise.all([
    postService.getPostBySlug(post.slug),
    postService.getAllTags(),
  ]);
  if (!fullPost) throw error(404, 'Postingan tidak ditemukan.');

  return {
    post: {
      ...fullPost,
      _id: fullPost._id.toString(),
      createdAt: fullPost.createdAt.toISOString(),
      updatedAt: fullPost.updatedAt?.toISOString(),
    },
    existingTags,
  };
}

/** Shared validation helper — returns error object or null */
function validatePostFields(title, content, category) {
  if (!title) return { error: 'Judul tidak boleh kosong.' };
  if (!content) return { error: 'Konten tidak boleh kosong.' };
  if (!['essay', 'poetry', 'story'].includes(category)) return { error: 'Kategori tidak valid.' };
  return null;
}

export const actions = {
  /** Update konten tanpa mengubah status (status dipreservasi). */
  update: async ({ request, params }) => {
    const data = await request.formData();
    const title = data.get('title')?.toString().trim() ?? '';
    const content = data.get('content')?.toString().trim() ?? '';
    const category = data.get('category')?.toString() ?? '';
    const tags = data.getAll('tags').map(t => t.toString().trim()).filter(Boolean);

    const validationError = validatePostFields(title, content, category);
    if (validationError) return fail(400, { ...validationError, title, content, category, tags });

    try {
      // status tidak disertakan agar nilai lama dipreservasi (Requirements 6.1, 6.2)
      const updated = await postService.updatePost(params.id, { title, content, category, tags });
      if (!updated) throw error(404, 'Postingan tidak ditemukan.');
      throw redirect(302, '/admin?success=updated');
    } catch (err) {
      if (err.status === 302 || err.status === 404) throw err;
      console.error('Failed to update post:', err);
      return fail(500, { error: 'Gagal menyimpan postingan. Silakan coba lagi.', title, content, category, tags });
    }
  },

  /** Simpan konten + set status ke 'draft'. Tetap di halaman yang sama. */
  saveDraft: async ({ request, params }) => {
    const data = await request.formData();
    const title = data.get('title')?.toString().trim() ?? '';
    const content = data.get('content')?.toString().trim() ?? '';
    const category = data.get('category')?.toString() ?? '';
    const tags = data.getAll('tags').map(t => t.toString().trim()).filter(Boolean);

    const validationError = validatePostFields(title, content, category);
    if (validationError) return fail(400, { ...validationError, title, content, category, tags });

    try {
      const updated = await postService.updatePost(params.id, { title, content, category, status: 'draft', tags });
      if (!updated) throw error(404, 'Postingan tidak ditemukan.');
      return { success: true };
    } catch (err) {
      if (err.status === 404) throw err;
      console.error('Failed to save draft:', err);
      return fail(500, { error: 'Gagal menyimpan draft. Silakan coba lagi.', title, content, category, tags });
    }
  },

  /** Simpan konten + set status ke 'published'. Redirect ke admin panel. */
  publish: async ({ request, params }) => {
    const data = await request.formData();
    const title = data.get('title')?.toString().trim() ?? '';
    const content = data.get('content')?.toString().trim() ?? '';
    const category = data.get('category')?.toString() ?? '';
    const tags = data.getAll('tags').map(t => t.toString().trim()).filter(Boolean);

    const validationError = validatePostFields(title, content, category);
    if (validationError) return fail(400, { ...validationError, title, content, category, tags });

    try {
      const updated = await postService.updatePost(params.id, { title, content, category, status: 'published', tags });
      if (!updated) throw error(404, 'Postingan tidak ditemukan.');
      throw redirect(302, '/admin?success=published');
    } catch (err) {
      if (err.status === 302 || err.status === 404) throw err;
      console.error('Failed to publish post:', err);
      return fail(500, { error: 'Gagal mempublikasikan postingan. Silakan coba lagi.', title, content, category, tags });
    }
  },

  /** Ubah status ke 'draft' tanpa menyentuh konten. Redirect ke halaman yang sama. */
  unpublish: async ({ params }) => {
    try {
      const updated = await postService.updatePost(params.id, { status: 'draft' });
      if (!updated) throw error(404, 'Postingan tidak ditemukan.');
      throw redirect(302, `/admin/posts/${params.id}`);
    } catch (err) {
      if (err.status === 302 || err.status === 404) throw err;
      console.error('Failed to unpublish post:', err);
      return fail(500, { error: 'Gagal mengubah status postingan. Silakan coba lagi.' });
    }
  },

  delete: async ({ params }) => {
    try {
      await postService.deletePost(params.id);
      throw redirect(302, '/admin?success=deleted');
    } catch (err) {
      if (err.status === 302) throw err;
      console.error('Failed to delete post:', err);
      return fail(500, { error: 'Gagal menghapus postingan.' });
    }
  }
};
