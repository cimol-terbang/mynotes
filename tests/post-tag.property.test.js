// Feature: post-tag, Property 1–9
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { postService, generateTagSlug } from '../src/lib/server/post.service.js';

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

// ─── Pure function helpers (mirrors TagInput.svelte logic) ───────────────────

/**
 * Filter autocomplete suggestions: tags that include query as substring (case-insensitive).
 * Mirrors the logic in TagInput.svelte's `suggestions` reactive declaration.
 */
function filterAutocomplete(query, existingTags) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return existingTags.filter(t => t.toLowerCase().includes(q));
}

/**
 * Add a tag to a list (normalize + deduplicate).
 * Mirrors TagInput.svelte's addTag logic.
 */
function addTag(tags, raw) {
  const normalized = raw.trim().toLowerCase();
  if (!normalized || tags.includes(normalized)) return tags;
  return [...tags, normalized];
}

/**
 * Remove a tag from a list.
 * Mirrors TagInput.svelte's removeTag logic.
 */
function removeTag(tags, tag) {
  return tags.filter(t => t !== tag);
}

// ─── DB test helpers ─────────────────────────────────────────────────────────

const titleArb = fc
  .stringMatching(/^[a-z0-9][a-z0-9 ]{0,48}[a-z0-9]$/)
  .filter(s => s.trim().length > 0);

const categoryArb = fc.constantFrom('essay', 'poetry', 'story');

// ─── Property 1: Tag Normalization Round-Trip ─────────────────────────────────

// Feature: post-tag, Property 1: Tag Normalization Round-Trip
describe('PostService — Property 1: Tag Normalization Round-Trip', () => {
  it(
    'post yang dibuat/diperbarui dengan tags apapun harus mengembalikan tags dalam bentuk lowercase+trimmed, dan jumlah tag tidak melebihi input setelah deduplikasi',
    async () => {
      // Validates: Requirements 1.3, 1.4, 2.7
      await fc.assert(
        fc.asyncProperty(
          titleArb,
          fc.string({ minLength: 1, maxLength: 200 }),
          categoryArb,
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(t => t.trim().length > 0), { minLength: 0, maxLength: 10 }),
          async (title, content, category, tags) => {
            // Bersihkan di awal agar tidak ada sisa data dari iterasi sebelumnya
            await mongoose.connection.collections['posts']?.deleteMany({});

            const created = await postService.createPost({ title, content, category, tags });

            // Ambil kembali dari DB
            const retrieved = await postService.getPostBySlug(created.slug);

            expect(retrieved).not.toBeNull();
            expect(Array.isArray(retrieved.tags)).toBe(true);

            // Setiap tag harus lowercase dan trimmed
            for (const tag of retrieved.tags) {
              expect(tag).toBe(tag.toLowerCase());
              expect(tag).toBe(tag.trim());
            }

            // Jumlah tag tidak boleh melebihi jumlah input setelah deduplikasi
            const dedupedInput = [...new Set(tags.map(t => t.trim().toLowerCase()))].filter(Boolean);
            expect(retrieved.tags.length).toBeLessThanOrEqual(dedupedInput.length);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 2: Tag Slug Generation Correctness ─────────────────────────────

// Feature: post-tag, Property 2: Tag Slug Generation Correctness
describe('generateTagSlug — Property 2: Tag Slug Generation Correctness', () => {
  it(
    'generateTagSlug harus menghasilkan string yang hanya mengandung [a-z0-9-], dan spasi dalam input harus menjadi tanda hubung dalam output',
    () => {
      // Validates: Requirements 1.5
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (tagName) => {
            const slug = generateTagSlug(tagName);

            // Slug hanya boleh mengandung [a-z0-9-]
            expect(slug).toMatch(/^[a-z0-9-]*$/);

            // Setiap spasi dalam input (setelah trim) harus menjadi '-' dalam output
            const trimmed = tagName.trim();
            const spacesInInput = (trimmed.match(/ /g) || []).length;
            if (spacesInInput > 0) {
              // Output harus mengandung setidaknya satu '-' jika ada spasi
              expect(slug).toContain('-');
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 3: Tag Autocomplete Filtering ──────────────────────────────────

// Feature: post-tag, Property 3: Tag Autocomplete Filtering
describe('filterAutocomplete — Property 3: Tag Autocomplete Filtering', () => {
  it(
    'hasil filter autocomplete harus hanya mengandung tag yang mengandung query sebagai substring (case-insensitive)',
    () => {
      // Validates: Requirements 2.2
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 0, maxLength: 20 }),
          (query, existingTags) => {
            const results = filterAutocomplete(query, existingTags);

            // Setiap hasil harus mengandung query sebagai substring (case-insensitive)
            for (const tag of results) {
              expect(tag.toLowerCase()).toContain(query.trim().toLowerCase());
            }

            // Tidak ada hasil yang tidak mengandung query
            const nonMatching = existingTags.filter(
              t => !t.toLowerCase().includes(query.trim().toLowerCase())
            );
            for (const tag of nonMatching) {
              expect(results).not.toContain(tag);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 4: Tag Addition is Idempotent ──────────────────────────────────

// Feature: post-tag, Property 4: Tag Addition is Idempotent
describe('addTag — Property 4: Tag Addition is Idempotent', () => {
  it(
    'menambahkan tag yang sudah ada dalam daftar harus menghasilkan daftar yang identik',
    () => {
      // Validates: Requirements 2.5
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          (rawTags) => {
            // Buat daftar tag yang sudah dinormalisasi
            const normalizedTags = [...new Set(rawTags.map(t => t.trim().toLowerCase()))].filter(Boolean);
            if (normalizedTags.length === 0) return;

            // Pilih tag yang sudah ada dalam daftar
            const existingTag = normalizedTags[0];

            // Tambahkan tag yang sudah ada
            const result = addTag(normalizedTags, existingTag);

            // Daftar harus identik — panjang dan isi tidak berubah
            expect(result.length).toBe(normalizedTags.length);
            expect(result).toEqual(normalizedTags);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 5: Tag Removal Correctness ─────────────────────────────────────

// Feature: post-tag, Property 5: Tag Removal Correctness
describe('removeTag — Property 5: Tag Removal Correctness', () => {
  it(
    'menghapus sebuah tag harus menghasilkan daftar yang tidak mengandung tag tersebut, dan semua tag lain tetap ada',
    () => {
      // Validates: Requirements 2.6
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }), { minLength: 1, maxLength: 10 }),
          (rawTags) => {
            // Buat daftar tag yang sudah dinormalisasi dan unik
            const normalizedTags = [...new Set(rawTags.map(t => t.trim().toLowerCase()))].filter(Boolean);
            if (normalizedTags.length === 0) return;

            // Pilih tag yang akan dihapus
            const tagToRemove = normalizedTags[0];
            const otherTags = normalizedTags.slice(1);

            const result = removeTag(normalizedTags, tagToRemove);

            // Tag yang dihapus tidak boleh ada dalam hasil
            expect(result).not.toContain(tagToRemove);

            // Semua tag lain harus tetap ada
            for (const tag of otherTags) {
              expect(result).toContain(tag);
            }

            // Panjang hasil harus berkurang 1
            expect(result.length).toBe(normalizedTags.length - 1);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 6: getAllTags Returns Deduplicated Sorted List ──────────────────

// Feature: post-tag, Property 6: getAllTags Returns Deduplicated Sorted List
describe('PostService — Property 6: getAllTags Returns Deduplicated Sorted List', () => {
  it(
    'getAllTags harus mengembalikan daftar tag yang tidak ada duplikat dan diurutkan secara alfabetis ascending',
    async () => {
      // Validates: Requirements 3.1, 3.2
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              title: titleArb,
              content: fc.string({ minLength: 1, maxLength: 100 }),
              category: categoryArb,
              // Use alphanumeric-only tags to avoid locale vs MongoDB sort discrepancies
              tags: fc.array(fc.stringMatching(/^[a-z0-9]{1,15}$/), { minLength: 0, maxLength: 5 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (posts) => {
            // Bersihkan di awal agar tidak ada sisa data dari iterasi sebelumnya
            await mongoose.connection.collections['posts']?.deleteMany({});

            // Buat semua posts
            for (const post of posts) {
              await postService.createPost(post);
            }

            const allTags = await postService.getAllTags();

            // Tidak ada duplikat
            const uniqueTags = new Set(allTags);
            expect(allTags.length).toBe(uniqueTags.size);

            // Diurutkan secara alfabetis ascending
            for (let i = 0; i + 1 < allTags.length; i++) {
              expect(allTags[i].localeCompare(allTags[i + 1])).toBeLessThanOrEqual(0);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 7: Tag Filter Returns Only Matching Published Posts ─────────────

// Feature: post-tag, Property 7: Tag Filter Returns Only Matching Published Posts
describe('PostService — Property 7: Tag Filter Returns Only Matching Published Posts', () => {
  it(
    'getPostsByTag harus mengembalikan hanya postingan published yang memiliki minimal satu tag dengan slug yang cocok',
    async () => {
      // Validates: Requirements 6.1, 6.2, 6.7
      await fc.assert(
        fc.asyncProperty(
          // Tag yang akan difilter (harus valid untuk slug generation)
          fc.stringMatching(/^[a-z][a-z0-9 ]{0,18}[a-z0-9]$/).filter(s => s.trim().length > 1),
          // Array posts dengan berbagai tags dan status
          fc.array(
            fc.record({
              title: titleArb,
              content: fc.string({ minLength: 1, maxLength: 100 }),
              category: categoryArb,
              status: fc.constantFrom('draft', 'published'),
              tags: fc.array(fc.stringMatching(/^[a-z][a-z0-9 ]{0,13}[a-z0-9]$/), { minLength: 0, maxLength: 3 }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (targetTag, posts) => {
            // Bersihkan di awal agar tidak ada sisa data dari iterasi sebelumnya
            await mongoose.connection.collections['posts']?.deleteMany({});

            const targetSlug = generateTagSlug(targetTag);

            // Buat semua posts, beberapa dengan target tag
            for (let i = 0; i < posts.length; i++) {
              const post = posts[i];
              // Tambahkan target tag ke beberapa posts (indeks genap)
              const tagsWithTarget = i % 2 === 0
                ? [...post.tags, targetTag]
                : post.tags;
              await postService.createPost({ ...post, tags: tagsWithTarget });
            }

            const results = await postService.getPostsByTag(targetSlug);

            // Semua hasil harus berstatus 'published'
            for (const post of results) {
              expect(post.status).toBe('published');
            }

            // Semua hasil harus memiliki minimal satu tag yang slug-nya cocok
            for (const post of results) {
              const hasMatchingTag = post.tags.some(tag => generateTagSlug(tag) === targetSlug);
              expect(hasMatchingTag).toBe(true);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 8: Tag Filter Results are Sorted by updatedAt Descending ────────

// Feature: post-tag, Property 8: Tag Filter Results are Sorted by updatedAt Descending
describe('PostService — Property 8: Tag Filter Results are Sorted by updatedAt Descending', () => {
  it(
    'hasil getPostsByTag harus diurutkan berdasarkan updatedAt descending — setiap pasangan berurutan harus memiliki updatedAt[i] >= updatedAt[i+1]',
    async () => {
      // Validates: Requirements 6.3
      await fc.assert(
        fc.asyncProperty(
          // Tag yang akan difilter
          fc.stringMatching(/^[a-z][a-z0-9 ]{0,18}[a-z0-9]$/).filter(s => s.trim().length > 1),
          // Minimal 2 posts agar bisa verifikasi ordering
          fc.array(
            fc.record({
              title: titleArb,
              content: fc.string({ minLength: 1, maxLength: 100 }),
              category: categoryArb,
            }),
            { minLength: 2, maxLength: 5 }
          ),
          async (targetTag, posts) => {
            // Bersihkan di awal agar tidak ada sisa data dari iterasi sebelumnya
            await mongoose.connection.collections['posts']?.deleteMany({});

            const targetSlug = generateTagSlug(targetTag);

            // Buat semua posts dengan target tag dan status published
            for (const post of posts) {
              await postService.createPost({
                ...post,
                status: 'published',
                tags: [targetTag],
              });
            }

            const results = await postService.getPostsByTag(targetSlug);

            // Verifikasi ordering: updatedAt[i] >= updatedAt[i+1]
            for (let i = 0; i + 1 < results.length; i++) {
              const dateI = new Date(results[i].updatedAt).getTime();
              const dateNext = new Date(results[i + 1].updatedAt).getTime();
              expect(dateI).toBeGreaterThanOrEqual(dateNext);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ─── Property 9: Tag Isolation on Delete ─────────────────────────────────────

// Feature: post-tag, Property 9: Tag Isolation on Delete
describe('PostService — Property 9: Tag Isolation on Delete', () => {
  it(
    'menghapus satu post tidak boleh mengubah tags post lain, dan getAllTags tidak boleh mengembalikan tag yang hanya digunakan post yang dihapus',
    async () => {
      // Validates: Requirements 7.2, 7.3
      await fc.assert(
        fc.asyncProperty(
          // Shared tag antara dua posts
          fc.stringMatching(/^[a-z][a-z0-9 ]{0,18}[a-z0-9]$/).filter(s => s.trim().length > 1),
          // Tag eksklusif untuk post yang akan dihapus
          fc.stringMatching(/^[a-z][a-z0-9 ]{0,18}[a-z0-9]$/).filter(s => s.trim().length > 1),
          // Data untuk dua posts
          fc.record({
            title1: titleArb,
            title2: titleArb,
            content: fc.string({ minLength: 1, maxLength: 100 }),
            category: categoryArb,
          }),
          async (sharedTag, exclusiveTag, { title1, title2, content, category }) => {
            // Bersihkan di awal agar tidak ada sisa data dari iterasi sebelumnya
            await mongoose.connection.collections['posts']?.deleteMany({});

            // Pastikan sharedTag dan exclusiveTag berbeda setelah normalisasi
            const normalizedShared = sharedTag.trim().toLowerCase();
            const normalizedExclusive = exclusiveTag.trim().toLowerCase();
            if (normalizedShared === normalizedExclusive) return;

            // Buat post 1 (akan dihapus) dengan shared tag + exclusive tag
            const post1 = await postService.createPost({
              title: title1,
              content,
              category,
              tags: [sharedTag, exclusiveTag],
            });

            // Buat post 2 (tidak dihapus) dengan shared tag saja
            const post2 = await postService.createPost({
              title: title2,
              content,
              category,
              tags: [sharedTag],
            });

            // Simpan tags post 2 sebelum delete
            const post2TagsBefore = [...post2.tags];

            // Hapus post 1
            await postService.deletePost(post1._id.toString());

            // Verifikasi 1: tags post 2 tidak berubah
            const post2After = await postService.getPostBySlug(post2.slug);
            expect(post2After).not.toBeNull();
            expect(post2After.tags).toEqual(post2TagsBefore);

            // Verifikasi 2: getAllTags tidak mengembalikan exclusive tag (hanya digunakan post 1)
            const allTags = await postService.getAllTags();
            expect(allTags).not.toContain(normalizedExclusive);

            // Verifikasi 3: getAllTags masih mengembalikan shared tag (masih digunakan post 2)
            expect(allTags).toContain(normalizedShared);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
