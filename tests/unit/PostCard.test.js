import { describe, it, expect } from 'vitest';
import { generateTagSlug } from '../../src/lib/server/post.service.js';

// ---------------------------------------------------------------------------
// Helper mirroring the conditional guard in PostCard.svelte:
//   {#if post.tags && post.tags.length > 0}
// ---------------------------------------------------------------------------

function shouldShowTags(post) {
  return !!(post.tags && post.tags.length > 0);
}

// ---------------------------------------------------------------------------

describe('PostCard — tag link generation (generateTagSlug)', () => {
  it('generates correct href for simple tag', () => {
    // 'web development' → '/tag/web-development'
    expect('/tag/' + generateTagSlug('web development')).toBe('/tag/web-development');
  });

  it('generates correct href for single word tag', () => {
    // 'javascript' → '/tag/javascript'
    expect('/tag/' + generateTagSlug('javascript')).toBe('/tag/javascript');
  });

  it('generates correct href for tag with special chars', () => {
    // 'node.js' → '/tag/nodejs'
    expect('/tag/' + generateTagSlug('node.js')).toBe('/tag/nodejs');
  });

  it('generates correct href for uppercase tag', () => {
    // 'TypeScript' → '/tag/typescript'
    expect('/tag/' + generateTagSlug('TypeScript')).toBe('/tag/typescript');
  });
});

// ---------------------------------------------------------------------------

describe('PostCard — tag display conditional logic', () => {
  it('should show tags when post.tags has items', () => {
    const post = { tags: ['svelte', 'javascript'] };
    expect(shouldShowTags(post)).toBe(true);
  });

  it('should not show tags when post.tags is empty array', () => {
    const post = { tags: [] };
    expect(shouldShowTags(post)).toBe(false);
  });

  it('should not show tags when post.tags is undefined', () => {
    const post = {};
    expect(shouldShowTags(post)).toBe(false);
  });

  it('should not show tags when post.tags is null', () => {
    const post = { tags: null };
    expect(shouldShowTags(post)).toBe(false);
  });
});
