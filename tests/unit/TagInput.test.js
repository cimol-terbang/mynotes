import { describe, it, expect } from 'vitest';

// Pure logic functions mirroring what TagInput.svelte implements

function normalizeTag(raw) {
  return raw.trim().toLowerCase();
}

function addTag(tags, raw) {
  const normalized = normalizeTag(raw);
  if (normalized && !tags.includes(normalized)) {
    return [...tags, normalized];
  }
  return tags;
}

function removeTag(tags, tag) {
  return tags.filter(t => t !== tag);
}

function filterAutocomplete(existingTags, currentTags, inputValue) {
  const trimmed = inputValue.trim();
  if (trimmed.length === 0) return [];
  return existingTags.filter(
    t =>
      t.toLowerCase().includes(trimmed.toLowerCase()) &&
      !currentTags.includes(t)
  );
}

// ---------------------------------------------------------------------------

describe('TagInput logic — normalizeTag', () => {
  it('trims whitespace from tag', () => {
    expect(normalizeTag('  hello  ')).toBe('hello');
  });

  it('converts tag to lowercase', () => {
    expect(normalizeTag('JavaScript')).toBe('javascript');
  });

  it('handles mixed case and whitespace', () => {
    expect(normalizeTag('  SvelteKit  ')).toBe('sveltekit');
  });
});

// ---------------------------------------------------------------------------

describe('TagInput logic — addTag', () => {
  it('adds a new tag to empty list', () => {
    expect(addTag([], 'svelte')).toEqual(['svelte']);
  });

  it('normalizes tag before adding', () => {
    expect(addTag([], '  TypeScript  ')).toEqual(['typescript']);
  });

  it('does not add duplicate tag (exact match)', () => {
    const tags = ['svelte'];
    expect(addTag(tags, 'svelte')).toEqual(['svelte']);
  });

  it('does not add duplicate tag (case-insensitive)', () => {
    const tags = ['svelte'];
    expect(addTag(tags, 'Svelte')).toEqual(['svelte']);
  });

  it('does not add empty string', () => {
    expect(addTag([], '')).toEqual([]);
  });

  it('does not add whitespace-only string', () => {
    expect(addTag([], '   ')).toEqual([]);
  });
});

// ---------------------------------------------------------------------------

describe('TagInput logic — removeTag', () => {
  it('removes the specified tag from list', () => {
    expect(removeTag(['svelte', 'typescript', 'css'], 'typescript')).toEqual(['svelte', 'css']);
  });

  it('does not modify other tags', () => {
    const result = removeTag(['a', 'b', 'c'], 'b');
    expect(result).toContain('a');
    expect(result).toContain('c');
  });

  it('handles removing from single-item list', () => {
    expect(removeTag(['svelte'], 'svelte')).toEqual([]);
  });

  it('returns same list if tag not found', () => {
    const tags = ['svelte', 'typescript'];
    expect(removeTag(tags, 'css')).toEqual(['svelte', 'typescript']);
  });
});

// ---------------------------------------------------------------------------

describe('TagInput logic — filterAutocomplete (suggestions)', () => {
  const existingTags = ['svelte', 'sveltekit', 'typescript', 'javascript', 'css'];

  it('returns tags containing query as substring (case-insensitive)', () => {
    const result = filterAutocomplete(existingTags, [], 'svelte');
    expect(result).toContain('svelte');
    expect(result).toContain('sveltekit');
  });

  it('excludes already-added tags from suggestions', () => {
    const result = filterAutocomplete(existingTags, ['svelte'], 'svelte');
    expect(result).not.toContain('svelte');
    expect(result).toContain('sveltekit');
  });

  it('returns empty array for empty query', () => {
    expect(filterAutocomplete(existingTags, [], '')).toEqual([]);
  });

  it('returns empty array when no tags match', () => {
    expect(filterAutocomplete(existingTags, [], 'rust')).toEqual([]);
  });

  it('is case-insensitive', () => {
    const result = filterAutocomplete(existingTags, [], 'JAVA');
    expect(result).toContain('javascript');
  });
});
