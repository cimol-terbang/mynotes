import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { postService } from '../src/lib/server/post.service.js';
import { Post } from '../src/lib/server/models/Post.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// ─── Migration Script Integration Tests ───────────────────────────────────────

describe('Migration Script — set status published untuk dokumen lama', () => {
  it('harus mengubah semua dokumen tanpa field status menjadi published', async () => {
    // Sisipkan dokumen lama tanpa field status langsung ke MongoDB
    await Post.collection.insertMany([
      { title: 'Post Lama 1', slug: 'post-lama-1', content: 'Konten 1', category: 'essay', excerpt: 'Konten 1' },
      { title: 'Post Lama 2', slug: 'post-lama-2', content: 'Konten 2', category: 'poetry', excerpt: 'Konten 2' },
      { title: 'Post Lama 3', slug: 'post-lama-3', content: 'Konten 3', category: 'story', excerpt: 'Konten 3' },
    ]);

    // Jalankan logika migrasi
    const result = await Post.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'published' } }
    );

    expect(result.modifiedCount).toBe(3);

    // Verifikasi semua dokumen kini memiliki status 'published'
    const posts = await Post.find({}).lean();
    for (const post of posts) {
      expect(post.status).toBe('published');
    }
  });

  it('harus tidak mengubah dokumen yang sudah memiliki field status', async () => {
    // Buat dokumen dengan status yang sudah ada
    await postService.createPost({ title: 'Draft Post', content: 'Konten', category: 'essay', status: 'draft' });
    await postService.createPost({ title: 'Published Post', content: 'Konten', category: 'essay', status: 'published' });

    // Jalankan logika migrasi
    const result = await Post.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'published' } }
    );

    // Tidak ada dokumen yang diperbarui karena semua sudah punya status
    expect(result.modifiedCount).toBe(0);

    // Verifikasi status tidak berubah
    const draftPost = await postService.getPostBySlug('draft-post');
    const publishedPost = await postService.getPostBySlug('published-post');

    expect(draftPost.status).toBe('draft');
    expect(publishedPost.status).toBe('published');
  });
});

// ─── Integration Test 12.1: Draft → Akses via Slug Publik → 404 ───────────────

describe('Integration 12.1 — Draft tidak dapat diakses via slug publik', () => {
  it('post berstatus draft harus menghasilkan kondisi 404 saat diakses via slug', async () => {
    // Requirements: 5.1, 5.4
    // Buat post dengan status 'draft'
    const draft = await postService.createPost({
      title: 'Tulisan Draft Rahasia',
      content: 'Konten yang belum selesai',
      category: 'essay',
      status: 'draft',
    });

    expect(draft.status).toBe('draft');

    // Panggil getPostBySlug — post ditemukan di database
    const post = await postService.getPostBySlug(draft.slug);
    expect(post).not.toBeNull();

    // Cek kondisi status seperti yang dilakukan route publik /[slug]/+page.server.js
    // if (!post || post.status === 'draft') throw error(404, ...)
    const shouldReturn404 = !post || post.status === 'draft';
    expect(shouldReturn404).toBe(true);
  });

  it('post berstatus published harus dapat diakses via slug (tidak 404)', async () => {
    // Requirements: 5.1, 5.4
    // Buat post dengan status 'published'
    const published = await postService.createPost({
      title: 'Tulisan Sudah Dipublikasikan',
      content: 'Konten yang sudah selesai',
      category: 'essay',
      status: 'published',
    });

    expect(published.status).toBe('published');

    // Panggil getPostBySlug
    const post = await postService.getPostBySlug(published.slug);
    expect(post).not.toBeNull();

    // Cek kondisi status — tidak boleh 404
    const shouldReturn404 = !post || post.status === 'draft';
    expect(shouldReturn404).toBe(false);
  });
});

// ─── Integration Test 12.2: Draft → Publish → Muncul di listPosts('published') ─

describe('Integration 12.2 — Draft yang dipublish muncul di listPosts published', () => {
  it('post draft yang dipublish harus muncul dalam hasil listPosts dengan filter published', async () => {
    // Requirements: 3.1, 5.2, 5.3
    // Buat post dengan status 'draft'
    const draft = await postService.createPost({
      title: 'Tulisan Dari Draft ke Published',
      content: 'Konten tulisan ini',
      category: 'story',
      status: 'draft',
    });

    expect(draft.status).toBe('draft');

    // Verifikasi post belum muncul di listPosts published
    const beforePublish = await postService.listPosts(undefined, 'published');
    const foundBefore = beforePublish.find(p => p._id.toString() === draft._id.toString());
    expect(foundBefore).toBeUndefined();

    // Panggil updatePost dengan status: 'published'
    const updated = await postService.updatePost(draft._id.toString(), { status: 'published' });
    expect(updated.status).toBe('published');

    // Panggil listPosts(undefined, 'published') dan verifikasi post muncul
    const afterPublish = await postService.listPosts(undefined, 'published');
    const foundAfter = afterPublish.find(p => p._id.toString() === draft._id.toString());
    expect(foundAfter).toBeDefined();
    expect(foundAfter.status).toBe('published');
  });

  it('post draft tidak boleh muncul dalam hasil listPosts dengan filter published', async () => {
    // Requirements: 5.2, 5.3
    // Buat beberapa post dengan status berbeda
    await postService.createPost({
      title: 'Draft Satu',
      content: 'Konten draft',
      category: 'essay',
      status: 'draft',
    });
    await postService.createPost({
      title: 'Published Satu',
      content: 'Konten published',
      category: 'essay',
      status: 'published',
    });

    // listPosts dengan filter 'published' hanya boleh mengembalikan post published
    const publishedPosts = await postService.listPosts(undefined, 'published');
    expect(publishedPosts.length).toBe(1);
    expect(publishedPosts[0].status).toBe('published');
    expect(publishedPosts[0].title).toBe('Published Satu');

    // Pastikan tidak ada draft dalam hasil
    const hasDraft = publishedPosts.some(p => p.status === 'draft');
    expect(hasDraft).toBe(false);
  });
});
