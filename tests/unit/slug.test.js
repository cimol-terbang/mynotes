import { describe, it, expect } from 'vitest';
import { generateSlug, generateUniqueSlug } from '../../src/lib/utils/slug.js';

describe('generateSlug', () => {
  it('converts title to lowercase slug', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(generateSlug('Hello, World!')).toBe('hello-world');
  });

  it('handles Indonesian characters', () => {
    const result = generateSlug('Apa yang aku pikirkan');
    expect(result).toBe('apa-yang-aku-pikirkan');
  });

  it('trims whitespace', () => {
    expect(generateSlug('  hello world  ')).toBe('hello-world');
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });
});

describe('generateUniqueSlug', () => {
  it('returns base slug when no collision', () => {
    expect(generateUniqueSlug('Hello World', [])).toBe('hello-world');
  });

  it('appends -1 on first collision', () => {
    expect(generateUniqueSlug('Hello World', ['hello-world'])).toBe('hello-world-1');
  });

  it('appends -2 when -1 also exists', () => {
    expect(generateUniqueSlug('Hello World', ['hello-world', 'hello-world-1'])).toBe('hello-world-2');
  });

  it('finds next available suffix', () => {
    const existing = ['hello-world', 'hello-world-1', 'hello-world-2', 'hello-world-3'];
    expect(generateUniqueSlug('Hello World', existing)).toBe('hello-world-4');
  });

  it('does not collide with existing slugs', () => {
    const existing = ['hello-world'];
    const result = generateUniqueSlug('Hello World', existing);
    expect(existing).not.toContain(result);
  });
});
