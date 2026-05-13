// Feature: post-draft, Property 1: Status Round-Trip
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { postService } from '../src/lib/server/post.service.js';

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

// Feature: post-draft, Property 1: Status Round-Trip
describe('PostService — Property 1: Status Round-Trip', () => {
  it(
    'post yang dibuat dengan status valid harus mengembalikan status yang sama persis saat diambil kembali',
    async () => {
      // Validates: Requirements 1.1, 1.3, 1.4
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('draft', 'published'),
          fc.stringMatching(/^[a-z0-9][a-z0-9 ]{0,48}[a-z0-9]$/).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.constantFrom('essay', 'poetry', 'story'),
          async (status, title, content, category) => {
            // Buat post dengan status valid acak
            const created = await postService.createPost({ title, content, category, status });

            // Ambil kembali via getPostBySlug
            const retrieved = await postService.getPostBySlug(created.slug);

            // Verifikasi status yang dikembalikan sama persis
            expect(retrieved).not.toBeNull();
            expect(retrieved.status).toBe(status);

            // Bersihkan setelah setiap run agar slug tidak bentrok
            await mongoose.connection.collections['posts']?.deleteMany({});
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// Feature: post-draft, Property 2: Default Status adalah Draft
describe('PostService — Property 2: Default Status adalah Draft', () => {
  it(
    'post yang dibuat tanpa field status harus memiliki status === "draft"',
    async () => {
      // Validates: Requirements 1.2
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            title: fc.stringMatching(/^[a-z0-9][a-z0-9 ]{0,48}[a-z0-9]$/).filter(s => s.trim().length > 0),
            content: fc.string({ minLength: 1 }),
            category: fc.constantFrom('essay', 'poetry', 'story'),
          }),
          async ({ title, content, category }) => {
            // Buat post tanpa menyertakan field status
            const created = await postService.createPost({ title, content, category });

            // Verifikasi status default adalah 'draft'
            expect(created.status).toBe('draft');

            // Bersihkan agar slug tidak bentrok antar run
            await mongoose.connection.collections['posts']?.deleteMany({});
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// Feature: post-draft, Property 7: Publish-Unpublish Round-Trip
describe('PostService — Property 7: Publish-Unpublish Round-Trip', () => {
  it(
    'publish lalu unpublish harus menghasilkan status === "draft"; unpublish lalu publish harus menghasilkan status === "published"',
    async () => {
      // Validates: Requirements 3.5
      await fc.assert(
        fc.asyncProperty(
          fc.constantFrom('draft', 'published'),
          fc.stringMatching(/^[a-z0-9][a-z0-9 ]{0,48}[a-z0-9]$/).filter(s => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 200 }),
          fc.constantFrom('essay', 'poetry', 'story'),
          async (initialStatus, title, content, category) => {
            // Buat post dengan status awal acak
            const created = await postService.createPost({ title, content, category, status: initialStatus });
            const id = created._id.toString();

            if (initialStatus === 'draft') {
              // Skenario: draft → publish → unpublish → harus kembali ke draft
              const afterPublish = await postService.updatePost(id, { status: 'published' });
              expect(afterPublish.status).toBe('published');

              const afterUnpublish = await postService.updatePost(id, { status: 'draft' });
              expect(afterUnpublish.status).toBe('draft');
            } else {
              // Skenario: published → unpublish → publish → harus kembali ke published
              const afterUnpublish = await postService.updatePost(id, { status: 'draft' });
              expect(afterUnpublish.status).toBe('draft');

              const afterPublish = await postService.updatePost(id, { status: 'published' });
              expect(afterPublish.status).toBe('published');
            }

            // Bersihkan agar slug tidak bentrok antar run
            await mongoose.connection.collections['posts']?.deleteMany({});
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
