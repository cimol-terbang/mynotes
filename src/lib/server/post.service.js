import slugify from 'slugify';
import { connectDb } from './db.js';
import { Post } from './models/Post.js';
import { generateTagSlug } from '$lib/tags.js';
export { generateTagSlug } from '$lib/tags.js';

function generateExcerpt(content) {
  return content.slice(0, 150);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

class PostService {
  async listPosts(category, status) {
    await connectDb();
    const filter = category ? { category } : {};
    if (status) filter.status = status;
    const posts = await Post.find(filter)
      .select('title slug category excerpt tags status createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    return posts.map(p => ({ ...p, _id: p._id.toString() }));
  }

  async getPostBySlug(slug) {
    await connectDb();
    const post = await Post.findOne({ slug }).lean();
    return post ?? null;
  }

  async createPost({ title, content, category, status = 'draft', tags = [] }) {
    await connectDb();
    const slug = await this.generateUniqueSlug(title);
    const excerpt = generateExcerpt(content);
    const normalizedTags = [...new Set(tags.map(t => t.trim().toLowerCase()))];
    const post = await Post.create({ title, slug, content, category, excerpt, status, tags: normalizedTags });
    return post.toObject();
  }

  async updatePost(id, { title, content, category, status, tags }) {
    await connectDb();
    const update = { updatedAt: new Date() };
    if (title !== undefined) update.title = title;
    if (content !== undefined) {
      update.content = content;
      update.excerpt = generateExcerpt(content);
    }
    if (category !== undefined) update.category = category;
    if (status !== undefined) update.status = status;
    if (tags !== undefined) {
      update.tags = [...new Set(tags.map(t => t.trim().toLowerCase()))];
    }

    const post = await Post.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    return post ?? null;
  }

  async getAllTags() {
    await connectDb();
    const result = await Post.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $sort: { _id: 1 } },
    ]);
    return result.map(r => r._id);
  }

  async getPostsByTag(tagSlug) {
    await connectDb();
    const posts = await Post.find({ status: 'published', tags: { $exists: true, $ne: [] } })
      .select('title slug category excerpt tags status createdAt updatedAt')
      .sort({ updatedAt: -1 })
      .lean();
    return posts
      .filter(p => p.tags.some(tag => generateTagSlug(tag) === tagSlug))
      .map(p => ({ ...p, _id: p._id.toString() }));
  }

  async deletePost(id) {
    await connectDb();
    const { Comment } = await import('./models/Comment.js');
    const result = await Post.findByIdAndDelete(id);
    if (!result) return false;
    await Comment.deleteMany({ postId: result._id });
    return true;
  }

  async generateUniqueSlug(title) {
    await connectDb();
    const baseSlug = slugify(title, { lower: true, strict: true, trim: true });

    const existing = await Post.findOne({ slug: baseSlug }).lean();
    if (!existing) return baseSlug;

    const pattern = '^' + escapeRegex(baseSlug) + '(-\\d+)?$';
    const conflicting = await Post.find({ slug: { $regex: pattern } })
      .select('slug')
      .lean();

    const existingSlugs = new Set(conflicting.map(p => p.slug));
    let counter = 1;
    let candidate = baseSlug + '-' + counter;
    while (existingSlugs.has(candidate)) {
      counter++;
      candidate = baseSlug + '-' + counter;
    }
    return candidate;
  }
}

export const postService = new PostService();
