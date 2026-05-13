// Feature: personal-writing-platform, Property 5: posts sorted newest first
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

const CATEGORIES = ['essay', 'poetry', 'story'];

function arbitraryPost() {
  return fc.record({
    _id: fc.string({ minLength: 1 }),
    title: fc.string({ minLength: 1 }),
    slug: fc.string({ minLength: 1 }),
    category: fc.constantFrom(...CATEGORIES),
    excerpt: fc.string(),
    createdAt: fc.date({ noInvalidDate: true }),
  });
}

function sortPostsByDate(posts) {
  return [...posts].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

describe('sortPostsByDate - Property 5: Posts Sorted Newest First', () => {
  it('daftar postingan selalu diurutkan dari terbaru ke terlama', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryPost(), { minLength: 2, maxLength: 100 }),
        (posts) => {
          const sorted = sortPostsByDate(posts);
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].createdAt.getTime()).toBeGreaterThanOrEqual(
              sorted[i + 1].createdAt.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
