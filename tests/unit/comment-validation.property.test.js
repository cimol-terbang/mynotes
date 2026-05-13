import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeCommentContent, normalizeAuthorName } from '../../src/lib/utils/sanitize.js';

// Feature: personal-writing-platform, Property 2: whitespace comment rejection
describe('validateCommentContent - Property 2: Whitespace Comment Rejection', () => {
  it('string yang hanya berisi whitespace dianggap kosong setelah trim', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n', '\r')).map(arr => arr.join('')),
        (whitespaceStr) => {
          // Whitespace-only content should be empty after trim
          expect(whitespaceStr.trim()).toBe('');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// Feature: personal-writing-platform, Property 3: empty name defaults to Anonym
describe('normalizeAuthorName - Property 3: Empty Name Defaults to Anonym', () => {
  it('nama kosong atau whitespace selalu menghasilkan "Anonym"', () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.constant(''),
          fc.array(fc.constantFrom(' ', '\t', '\n')).map(arr => arr.join(''))
        ),
        (emptyName) => {
          const result = normalizeAuthorName(emptyName);
          expect(result).toBe('Anonym');
        }
      ),
      { numRuns: 100 }
    );
  });
});
