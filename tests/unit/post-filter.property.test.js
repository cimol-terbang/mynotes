// Feature: personal-writing-platform, Property 4: category filter consistency
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

function filterPostsByCategory(posts, category) {
  return posts.filter(p => p.category === category);
}

describe('filterPostsByCategory - Property 4: Category Filter Consistency', () => {
  it('filter kategori hanya mengembalikan postingan dengan kategori yang diminta', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryPost(), { minLength: 0, maxLength: 100 }),
        fc.constantFrom(...CATEGORIES),
        (posts, category) => {
          const filtered = filterPostsByCategory(posts, category);
          expect(filtered.every(p => p.category === category)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
