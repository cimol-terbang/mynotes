import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { commentService } from '../../src/lib/server/comment.service.js';
import { postService } from '../../src/lib/server/post.service.js';

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

describe('CommentService', () => {
  it('addComment creates a comment with default Anonym name', async () => {
    const post = await postService.createPost({ title: 'Post', content: 'X', category: 'essay' });
    const comment = await commentService.addComment({
      postId: post._id.toString(),
      authorName: '',
      content: 'Hello!'
    });
    expect(comment.authorName).toBe('Anonym');
    expect(comment.content).toBe('Hello!');
  });

  it('addComment preserves provided author name', async () => {
    const post = await postService.createPost({ title: 'Post2', content: 'Y', category: 'poetry' });
    const comment = await commentService.addComment({
      postId: post._id.toString(),
      authorName: 'Alice',
      content: 'Nice post!'
    });
    expect(comment.authorName).toBe('Alice');
  });

  it('getCommentsByPostId returns comments sorted oldest first', async () => {
    const post = await postService.createPost({ title: 'Post3', content: 'Z', category: 'story' });
    await commentService.addComment({ postId: post._id.toString(), authorName: 'A', content: 'First' });
    await new Promise(r => setTimeout(r, 10));
    await commentService.addComment({ postId: post._id.toString(), authorName: 'B', content: 'Second' });

    const comments = await commentService.getCommentsByPostId(post._id.toString());
    expect(comments[0].content).toBe('First');
    expect(comments[1].content).toBe('Second');
  });

  it('getCommentsByPostId returns empty array for post with no comments', async () => {
    const post = await postService.createPost({ title: 'Post4', content: 'W', category: 'essay' });
    const comments = await commentService.getCommentsByPostId(post._id.toString());
    expect(comments).toHaveLength(0);
  });
});
