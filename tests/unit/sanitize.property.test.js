// Feature: personal-writing-platform, Property 7: XSS sanitization on comments
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { sanitizeCommentContent } from '../../src/lib/utils/sanitize.js';

describe('sanitizeCommentContent - Property 7: XSS Sanitization', () => {
  it('input yang mengandung skrip berbahaya selalu disanitasi', () => {
    fc.assert(
      fc.property(
        fc.string().map(s => `<script>${s}</script>${s}<img onerror="${s}">`),
        (maliciousInput) => {
          const sanitized = sanitizeCommentContent(maliciousInput);
          expect(sanitized).not.toMatch(/<script/i);
          expect(sanitized).not.toMatch(/onerror/i);
          expect(sanitized).not.toMatch(/javascript:/i);
        }
      ),
      { numRuns: 100 }
    );
  });
});
