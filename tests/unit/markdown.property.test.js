// Feature: personal-writing-platform, Property 8: markdown render idempotent
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { renderMarkdown } from '../../src/lib/utils/markdown.js';

describe('renderMarkdown - Property 8: Markdown Render Idempotent', () => {
  it('render Markdown menghasilkan output yang sama jika dipanggil dua kali', () => {
    fc.assert(
      fc.property(
        fc.string(),
        (markdownInput) => {
          const firstRender = renderMarkdown(markdownInput);
          const secondRender = renderMarkdown(markdownInput);
          expect(firstRender).toBe(secondRender);
        }
      ),
      { numRuns: 100 }
    );
  });
});
