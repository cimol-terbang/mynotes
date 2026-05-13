// Feature: personal-writing-platform, Property 1: slug uniqueness after generation
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { generateUniqueSlug } from '../../src/lib/utils/slug.js';

describe('generateUniqueSlug - Property 1: Slug Uniqueness', () => {
  it('slug yang dihasilkan tidak pernah bertabrakan dengan slug yang sudah ada', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 1 }),
        (existingSlugs, newTitle) => {
          const slug = generateUniqueSlug(newTitle, existingSlugs);
          expect(existingSlugs).not.toContain(slug);
        }
      ),
      { numRuns: 100 }
    );
  });
});
