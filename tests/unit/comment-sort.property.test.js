// Feature: personal-writing-platform, Property 6: comments sorted oldest first
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

function arbitraryComment() {
  return fc.record({
    _id: fc.string({ minLength: 1 }),
    postId: fc.string({ minLength: 1 }),
    authorName: fc.string({ minLength: 1 }),
    content: fc.string({ minLength: 1 }),
    createdAt: fc.date({ noInvalidDate: true }),
  });
}

function sortCommentsByDate(comments) {
  return [...comments].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

describe('sortCommentsByDate - Property 6: Comments Sorted Oldest First', () => {
  it('komentar selalu diurutkan dari terlama ke terbaru', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryComment(), { minLength: 2, maxLength: 200 }),
        (comments) => {
          const sorted = sortCommentsByDate(comments);
          for (let i = 0; i < sorted.length - 1; i++) {
            expect(sorted[i].createdAt.getTime()).toBeLessThanOrEqual(
              sorted[i + 1].createdAt.getTime()
            );
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
