import { describe, it, expect } from 'vitest';
import { sanitizeCommentContent, normalizeAuthorName } from '../../src/lib/utils/sanitize.js';

describe('sanitizeCommentContent', () => {
  it('strips <script> tags', () => {
    expect(sanitizeCommentContent('<script>alert(1)</script>')).not.toContain('<script>');
  });

  it('strips onerror attributes', () => {
    expect(sanitizeCommentContent('<img onerror="alert(1)">')).not.toMatch(/onerror/i);
  });

  it('removes javascript: protocol', () => {
    expect(sanitizeCommentContent('javascript:alert(1)')).not.toContain('javascript:');
  });

  it('removes data: protocol', () => {
    expect(sanitizeCommentContent('data:text/html,<h1>test</h1>')).not.toContain('data:');
  });

  it('preserves plain text', () => {
    expect(sanitizeCommentContent('Hello, world!')).toBe('Hello, world!');
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeCommentContent('')).toBe('');
  });
});

describe('normalizeAuthorName', () => {
  it('returns "Anonym" for empty string', () => {
    expect(normalizeAuthorName('')).toBe('Anonym');
  });

  it('returns "Anonym" for whitespace-only string', () => {
    expect(normalizeAuthorName('   ')).toBe('Anonym');
  });

  it('returns "Anonym" for tab-only string', () => {
    expect(normalizeAuthorName('\t\n')).toBe('Anonym');
  });

  it('returns trimmed name for valid input', () => {
    expect(normalizeAuthorName('  Alice  ')).toBe('Alice');
  });

  it('preserves name with internal spaces', () => {
    expect(normalizeAuthorName('John Doe')).toBe('John Doe');
  });
});
