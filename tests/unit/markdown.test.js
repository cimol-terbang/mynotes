import { describe, it, expect } from 'vitest';
import { renderMarkdown } from '../../src/lib/utils/markdown.js';

describe('renderMarkdown', () => {
  it('renders a heading', () => {
    expect(renderMarkdown('# Hello World')).toContain('<h1>Hello World</h1>');
  });

  it('renders a paragraph', () => {
    expect(renderMarkdown('This is a paragraph.')).toContain('<p>This is a paragraph.</p>');
  });

  it('renders bold text', () => {
    expect(renderMarkdown('**bold**')).toContain('<strong>bold</strong>');
  });

  it('renders italic text', () => {
    expect(renderMarkdown('*italic*')).toContain('<em>italic</em>');
  });

  it('renders an unordered list', () => {
    const result = renderMarkdown('- item one\n- item two');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>item one</li>');
    expect(result).toContain('<li>item two</li>');
  });

  it('renders a blockquote', () => {
    const result = renderMarkdown('> a quote');
    expect(result).toContain('<blockquote>');
    expect(result).toContain('a quote');
  });

  it('renders inline code', () => {
    expect(renderMarkdown('`code`')).toContain('<code>code</code>');
  });

  it('renders a fenced code block', () => {
    const result = renderMarkdown('```\nconst x = 1;\n```');
    expect(result).toContain('<code>');
    expect(result).toContain('const x = 1;');
  });

  it('strips <script> tags (XSS prevention)', () => {
    const result = renderMarkdown('<script>alert("xss")</script>');
    expect(result).not.toContain('<script>');
  });

  it('strips onerror attributes (XSS prevention)', () => {
    expect(renderMarkdown('<img src="x" onerror="alert(1)">')).not.toMatch(/onerror/i);
  });

  it('returns a string for empty input', () => {
    expect(typeof renderMarkdown('')).toBe('string');
  });

  it('is idempotent', () => {
    const input = '# Title\n\nSome **bold** text.\n\n- item 1\n- item 2';
    expect(renderMarkdown(input)).toBe(renderMarkdown(input));
  });
});
