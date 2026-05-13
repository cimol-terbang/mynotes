import { fail, redirect } from '@sveltejs/kit';
import { postService } from '$lib/server/post.service.js';

function parseFormData(data) {
  const title = data.get('title')?.toString().trim() ?? '';
  const content = data.get('content')?.toString().trim() ?? '';
  const category = data.get('category')?.toString() ?? '';
  const tags = data.getAll('tags').map(t => t.toString().trim()).filter(Boolean);
  return { title, content, category, tags };
}

function validateFormData({ title, content, category }) {
  if (!title) return { error: 'Judul tidak boleh kosong.' };
  if (!content) return { error: 'Konten tidak boleh kosong.' };
  if (!['essay', 'poetry', 'story'].includes(category)) {
    return { error: 'Kategori tidak valid.' };
  }
  return null;
}

export const actions = {
  saveDraft: async ({ request }) => {
    const data = await request.formData();
    const { title, content, category, tags } = parseFormData(data);

    const validationError = validateFormData({ title, content, category });
    if (validationError) {
      return fail(400, { error: validationError.error, title, content, category, tags });
    }

    try {
      const post = await postService.createPost({ title, content, category, status: 'draft', tags });
      throw redirect(302, `/admin/posts/${post._id}`);
    } catch (err) {
      if (err.status === 302) throw err;
      console.error('Failed to save draft:', err);
      return fail(500, { error: 'Gagal menyimpan draft. Silakan coba lagi.', title, content, category, tags });
    }
  },

  publish: async ({ request }) => {
    const data = await request.formData();
    const { title, content, category, tags } = parseFormData(data);

    const validationError = validateFormData({ title, content, category });
    if (validationError) {
      return fail(400, { error: validationError.error, title, content, category, tags });
    }

    try {
      await postService.createPost({ title, content, category, status: 'published', tags });
      throw redirect(302, '/admin?success=published');
    } catch (err) {
      if (err.status === 302) throw err;
      console.error('Failed to publish post:', err);
      return fail(500, { error: 'Gagal mempublikasikan postingan. Silakan coba lagi.', title, content, category, tags });
    }
  }
};
