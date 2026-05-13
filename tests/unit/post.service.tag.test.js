import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { postService, generateTagSlug } from '../../src/lib/server/post.service.js';

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

// Helper to create a published post with tags
async function createPublishedPost(title, tags, updatedAtOffset = 0) {
  const post = await postService.createPost({
    title,
    content: `Content for ${title}`,
    category: 'essay',
    status: 'published',
    tags,
  });
  if (updatedAtOffset !== 0) {
    // Manually adjust updatedAt for ordering tests
    const { Post } = await import('../../src/lib/server/models/Post.js');
    const newDate = new Date(post.updatedAt.getTime() + updatedAtOffset);
    await Post.findByIdAndUpdate(post._id, { $set: { updatedAt: newDate } });
  }
  return post;
}

describe('PostService — tag normalization on createPost', () => {
  it('createPost without tags → tags === []', async () => {
    const post = await postService.createPost({
      title: 'No Tags Post',
      content: 'Some content',
      category: 'essay',
    });
    expect(post.tags).toEqual([]);
  });

  it('createPost with tags → tags are normalized (lowercase, trimmed)', async () => {
    const post = await postService.createPost({
      title: 'Normalized Tags Post',
      content: 'Some content',
      category: 'essay',
      tags: ['  Web Development  ', 'JavaScript', '  NODE.JS'],
    });
    expect(post.tags).toContain('web development');
    expect(post.tags).toContain('javascript');
    expect(post.tags).toContain('node.js');
    // Ensure no untrimmed/uppercase versions exist
    expect(post.tags).not.toContain('  Web Development  ');
    expect(post.tags).not.toContain('JavaScript');
  });

  it('createPost with duplicate tags → duplicates are removed', async () => {
    const post = await postService.createPost({
      title: 'Duplicate Tags Post',
      content: 'Some content',
      category: 'essay',
      tags: ['javascript', 'JavaScript', '  javascript  ', 'python'],
    });
    // After normalization all three 'javascript' variants become 'javascript'
    const jsTags = post.tags.filter(t => t === 'javascript');
    expect(jsTags).toHaveLength(1);
    expect(post.tags).toContain('python');
    expect(post.tags).toHaveLength(2);
  });
});

describe('PostService — tag normalization on updatePost', () => {
  it('updatePost with tags → tags are updated and normalized', async () => {
    const created = await postService.createPost({
      title: 'Update Tags Post',
      content: 'Some content',
      category: 'essay',
      tags: ['old-tag'],
    });

    const updated = await postService.updatePost(created._id.toString(), {
      tags: ['  New Tag  ', 'ANOTHER TAG'],
    });

    expect(updated.tags).toContain('new tag');
    expect(updated.tags).toContain('another tag');
    expect(updated.tags).not.toContain('old-tag');
  });

  it('updatePost without tags parameter → existing tags are preserved', async () => {
    const created = await postService.createPost({
      title: 'Preserve Tags Post',
      content: 'Some content',
      category: 'essay',
      tags: ['keep-me', 'also-keep'],
    });

    const updated = await postService.updatePost(created._id.toString(), {
      title: 'Updated Title Only',
    });

    expect(updated.tags).toContain('keep-me');
    expect(updated.tags).toContain('also-keep');
    expect(updated.tags).toHaveLength(2);
  });

  it('updatePost with empty tags array [] → tags are cleared to empty array', async () => {
    const created = await postService.createPost({
      title: 'Clear Tags Post',
      content: 'Some content',
      category: 'essay',
      tags: ['tag1', 'tag2'],
    });

    const updated = await postService.updatePost(created._id.toString(), {
      tags: [],
    });

    expect(updated.tags).toEqual([]);
  });
});

describe('PostService — getAllTags', () => {
  it('getAllTags with no posts → returns empty array', async () => {
    const tags = await postService.getAllTags();
    expect(tags).toEqual([]);
  });

  it('getAllTags with posts having tags → returns deduplicated, alphabetically sorted tags', async () => {
    await postService.createPost({
      title: 'Post A',
      content: 'Content A',
      category: 'essay',
      tags: ['zebra', 'apple', 'mango'],
    });

    const tags = await postService.getAllTags();
    expect(tags).toEqual(['apple', 'mango', 'zebra']);
  });

  it('getAllTags with duplicate tags across posts → returns each tag only once', async () => {
    await postService.createPost({
      title: 'Post B',
      content: 'Content B',
      category: 'essay',
      tags: ['javascript', 'css'],
    });
    await postService.createPost({
      title: 'Post C',
      content: 'Content C',
      category: 'essay',
      tags: ['javascript', 'html'],
    });

    const tags = await postService.getAllTags();
    const jsTags = tags.filter(t => t === 'javascript');
    expect(jsTags).toHaveLength(1);
    expect(tags).toContain('css');
    expect(tags).toContain('html');
    // Verify sorted
    const sorted = [...tags].sort();
    expect(tags).toEqual(sorted);
  });
});

describe('PostService — getPostsByTag', () => {
  it('getPostsByTag → returns only published posts with matching tag slug', async () => {
    await createPublishedPost('Published With Tag', ['web development']);
    await postService.createPost({
      title: 'Draft With Tag',
      content: 'Content',
      category: 'essay',
      status: 'draft',
      tags: ['web development'],
    });

    const slug = generateTagSlug('web development');
    const results = await postService.getPostsByTag(slug);

    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results.every(p => p.status === 'published')).toBe(true);
    expect(results.some(p => p.title === 'Published With Tag')).toBe(true);
  });

  it('getPostsByTag → does not return draft posts', async () => {
    await postService.createPost({
      title: 'Draft Only Post',
      content: 'Content',
      category: 'essay',
      status: 'draft',
      tags: ['draft-tag'],
    });

    const slug = generateTagSlug('draft-tag');
    const results = await postService.getPostsByTag(slug);

    expect(results).toHaveLength(0);
  });

  it('getPostsByTag → returns posts sorted by updatedAt descending', async () => {
    // Create posts with different updatedAt by using offsets
    const { Post } = await import('../../src/lib/server/models/Post.js');

    const post1 = await postService.createPost({
      title: 'Older Post',
      content: 'Content',
      category: 'essay',
      status: 'published',
      tags: ['sort-tag'],
    });
    // Small delay to ensure different timestamps
    await new Promise(r => setTimeout(r, 20));
    const post2 = await postService.createPost({
      title: 'Newer Post',
      content: 'Content',
      category: 'essay',
      status: 'published',
      tags: ['sort-tag'],
    });

    const slug = generateTagSlug('sort-tag');
    const results = await postService.getPostsByTag(slug);

    expect(results).toHaveLength(2);
    // Newer post should come first
    expect(results[0].title).toBe('Newer Post');
    expect(results[1].title).toBe('Older Post');
    // Verify descending order
    expect(new Date(results[0].updatedAt) >= new Date(results[1].updatedAt)).toBe(true);
  });

  it('getPostsByTag with non-existent slug → returns empty array', async () => {
    await createPublishedPost('Some Post', ['existing-tag']);

    const results = await postService.getPostsByTag('this-slug-does-not-exist');
    expect(results).toEqual([]);
  });
});
