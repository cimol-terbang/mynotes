import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { postService } from '../../src/lib/server/post.service.js';

// Override connectDb to use in-memory DB
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  // Patch connectDb to be a no-op since we're already connected
  const dbModule = await import('../../src/lib/server/db.js');
  // connectDb checks `connected` flag; set it by connecting directly
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

describe('PostService', () => {
  it('createPost creates a post with auto-generated slug', async () => {
    const post = await postService.createPost({
      title: 'Test Post',
      content: 'Hello world',
      category: 'essay'
    });
    expect(post.title).toBe('Test Post');
    expect(post.slug).toBe('test-post');
    expect(post.excerpt).toBe('Hello world');
  });

  it('listPosts returns posts sorted by createdAt descending', async () => {
    await postService.createPost({ title: 'First', content: 'A', category: 'essay' });
    await new Promise(r => setTimeout(r, 10));
    await postService.createPost({ title: 'Second', content: 'B', category: 'poetry' });

    const posts = await postService.listPosts();
    expect(posts[0].title).toBe('Second');
    expect(posts[1].title).toBe('First');
  });

  it('listPosts filters by category', async () => {
    await postService.createPost({ title: 'Essay Post', content: 'A', category: 'essay' });
    await postService.createPost({ title: 'Poetry Post', content: 'B', category: 'poetry' });

    const essays = await postService.listPosts('essay');
    expect(essays).toHaveLength(1);
    expect(essays[0].category).toBe('essay');
  });

  it('getPostBySlug returns the correct post', async () => {
    await postService.createPost({ title: 'My Post', content: 'Content', category: 'story' });
    const post = await postService.getPostBySlug('my-post');
    expect(post).not.toBeNull();
    expect(post.title).toBe('My Post');
  });

  it('getPostBySlug returns null for non-existent slug', async () => {
    const post = await postService.getPostBySlug('does-not-exist');
    expect(post).toBeNull();
  });

  it('updatePost updates the post fields', async () => {
    const created = await postService.createPost({ title: 'Old Title', content: 'Old', category: 'essay' });
    const updated = await postService.updatePost(created._id.toString(), { title: 'New Title' });
    expect(updated.title).toBe('New Title');
  });

  it('deletePost removes the post and its comments', async () => {
    const post = await postService.createPost({ title: 'To Delete', content: 'X', category: 'essay' });
    const { commentService } = await import('../../src/lib/server/comment.service.js');
    await commentService.addComment({ postId: post._id.toString(), authorName: 'Test', content: 'A comment' });

    const deleted = await postService.deletePost(post._id.toString());
    expect(deleted).toBe(true);

    const comments = await commentService.getCommentsByPostId(post._id.toString());
    expect(comments).toHaveLength(0);
  });

  it('generateUniqueSlug appends suffix on collision', async () => {
    await postService.createPost({ title: 'Duplicate', content: 'A', category: 'essay' });
    const slug = await postService.generateUniqueSlug('Duplicate');
    expect(slug).toBe('duplicate-1');
  });
});
