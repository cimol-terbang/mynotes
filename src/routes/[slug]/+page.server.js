import { error } from '@sveltejs/kit';
import { fail } from '@sveltejs/kit';
import { postService } from '$lib/server/post.service.js';
import { commentService } from '$lib/server/comment.service.js';
import { sanitizeCommentContent, normalizeAuthorName } from '$lib/utils/sanitize.js';
import { commentRateLimiter } from '$lib/server/rate-limiter.js';

export async function load({ params }) {
  try {
    const [post, comments] = await Promise.all([
      postService.getPostBySlug(params.slug),
      postService.getPostBySlug(params.slug).then(p =>
        p ? commentService.getCommentsByPostId(p._id.toString()) : []
      )
    ]);

    if (!post || post.status === 'draft') {
      throw error(404, 'Tulisan tidak ditemukan.');
    }

    return {
      post: {
        ...post,
        _id: post._id.toString(),
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt?.toISOString(),
      },
      comments: comments.map(c => ({
        ...c,
        _id: c._id.toString(),
        postId: c.postId.toString(),
        createdAt: c.createdAt.toISOString(),
      }))
    };
  } catch (err) {
    if (err.status === 404) throw err;
    console.error('Failed to load post:', err);
    throw error(503, 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.');
  }
}

export const actions = {
  comment: async (event) => {
    // Rate limiting
    const limited = await commentRateLimiter.isLimited(event);
    if (limited) {
      return fail(429, { error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' });
    }

    const data = await event.request.formData();
    const authorName = normalizeAuthorName(data.get('authorName')?.toString() ?? '');
    const rawContent = data.get('content')?.toString() ?? '';

    if (!rawContent.trim()) {
      return fail(400, { error: 'Komentar tidak boleh kosong.' });
    }

    const content = sanitizeCommentContent(rawContent);

    try {
      const post = await postService.getPostBySlug(event.params.slug);
      if (!post) throw error(404, 'Tulisan tidak ditemukan.');

      const comment = await commentService.addComment({
        postId: post._id.toString(),
        authorName,
        content
      });

      return {
        success: true,
        comment: {
          _id: comment._id.toString(),
          authorName: comment.authorName,
          content: comment.content,
          createdAt: comment.createdAt.toISOString(),
        }
      };
    } catch (err) {
      if (err.status) throw err;
      console.error('Failed to add comment:', err);
      return fail(500, { error: 'Gagal mengirim komentar. Silakan coba lagi.' });
    }
  }
};
