// Feature: insert-picture, Property 8 & 9: upload endpoint tests
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Mocks must be declared before imports (vi.mock is hoisted by Vitest)
vi.mock('$lib/server/auth.service.js', () => ({
  authService: {
    validateSession: vi.fn()
  }
}));

vi.mock('fs/promises', () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    writeFile: vi.fn().mockResolvedValue(undefined)
  }
}));

import { POST } from '../../src/routes/api/images/upload/+server.js';
import { authService } from '$lib/server/auth.service.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Creates a mock SvelteKit event object with request and cookies.
 */
function createMockEvent({ sessionId = null, file = null } = {}) {
  const formData = new FormData();
  if (file) formData.append('file', file);

  return {
    request: {
      formData: () => Promise.resolve(formData)
    },
    cookies: {
      get: (name) => (name === 'session_id' ? sessionId : null)
    }
  };
}

/**
 * Creates a mock File object.
 * @param {string} content - Text content (ignored when sizeBytes is set)
 * @param {string} mimeType - MIME type for the file
 * @param {number|null} sizeBytes - If set, creates a buffer of exactly this size
 */
function createMockFile(content, mimeType, sizeBytes = null) {
  const buffer = sizeBytes
    ? new Uint8Array(sizeBytes).fill(1)
    : new TextEncoder().encode(content);

  return new File([buffer], 'test-image.jpg', { type: mimeType });
}

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe('Upload Endpoint — Unit Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 8.1 — HTTP 401 for unauthenticated request
  describe('8.1 — request without valid session → HTTP 401', () => {
    it('returns 401 when validateSession returns false', async () => {
      authService.validateSession.mockResolvedValue(false);

      const event = createMockEvent({ sessionId: 'invalid-session' });
      const response = await POST(event);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toEqual({ error: 'Unauthorized' });
    });

    it('returns 401 when no session cookie is present', async () => {
      authService.validateSession.mockResolvedValue(false);

      const event = createMockEvent({ sessionId: null });
      const response = await POST(event);

      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });
  });

  // 8.2 — HTTP 400 for invalid MIME type
  describe('8.2 — file with invalid MIME type → HTTP 400', () => {
    it('returns 400 with correct error message for text/plain MIME type', async () => {
      authService.validateSession.mockResolvedValue(true);

      const file = createMockFile('hello', 'text/plain');
      const event = createMockEvent({ sessionId: 'valid-session', file });
      const response = await POST(event);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: 'Tipe file tidak didukung' });
    });

    it('returns 400 for application/pdf MIME type', async () => {
      authService.validateSession.mockResolvedValue(true);

      const file = createMockFile('pdf content', 'application/pdf');
      const event = createMockEvent({ sessionId: 'valid-session', file });
      const response = await POST(event);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'Tipe file tidak didukung');
    });

    it('returns 400 for image/svg+xml MIME type (not in allowed list)', async () => {
      authService.validateSession.mockResolvedValue(true);

      const file = createMockFile('<svg/>', 'image/svg+xml');
      const event = createMockEvent({ sessionId: 'valid-session', file });
      const response = await POST(event);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'Tipe file tidak didukung');
    });
  });

  // 8.3 — HTTP 400 for file >5MB
  describe('8.3 — file with size >5MB → HTTP 400', () => {
    it('returns 400 when file is exactly 1 byte over 5MB', async () => {
      authService.validateSession.mockResolvedValue(true);

      const overSizeBytes = 5 * 1024 * 1024 + 1;
      const file = createMockFile('', 'image/jpeg', overSizeBytes);
      const event = createMockEvent({ sessionId: 'valid-session', file });
      const response = await POST(event);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toEqual({ error: 'Ukuran file melebihi batas maksimal 5MB' });
    });

    it('returns 400 when file is 10MB', async () => {
      authService.validateSession.mockResolvedValue(true);

      const file = createMockFile('', 'image/png', 10 * 1024 * 1024);
      const event = createMockEvent({ sessionId: 'valid-session', file });
      const response = await POST(event);

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'Ukuran file melebihi batas maksimal 5MB');
    });
  });

  // 8.4 — HTTP 200 with unique URL for valid file
  describe('8.4 — valid file → HTTP 200 with unique URL', () => {
    it('returns 200 with a url field for a valid JPEG file', async () => {
      authService.validateSession.mockResolvedValue(true);

      const file = createMockFile('image data', 'image/jpeg');
      const event = createMockEvent({ sessionId: 'valid-session', file });
      const response = await POST(event);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('url');
      expect(body.url).toMatch(/^\/uploads\/images\/.+\.(jpg|png|gif|webp)$/);
    });

    it('url matches the pattern /uploads/images/TIMESTAMP-RANDOM.EXT', async () => {
      authService.validateSession.mockResolvedValue(true);

      const file = createMockFile('image data', 'image/png');
      const event = createMockEvent({ sessionId: 'valid-session', file });
      const response = await POST(event);

      expect(response.status).toBe(200);
      const body = await response.json();
      // Pattern: /uploads/images/<digits>-<8 hex chars>.<ext>
      expect(body.url).toMatch(/^\/uploads\/images\/\d+-[0-9a-f]{8}\.(jpg|png|gif|webp)$/);
    });

    it('two separate uploads produce different URLs (uniqueness)', async () => {
      authService.validateSession.mockResolvedValue(true);

      const file1 = createMockFile('image data 1', 'image/jpeg');
      const event1 = createMockEvent({ sessionId: 'valid-session', file: file1 });
      const response1 = await POST(event1);
      const body1 = await response1.json();

      const file2 = createMockFile('image data 2', 'image/jpeg');
      const event2 = createMockEvent({ sessionId: 'valid-session', file: file2 });
      const response2 = await POST(event2);
      const body2 = await response2.json();

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
      expect(body1.url).not.toBe(body2.url);
    });

    it('returns correct extension for each allowed MIME type', async () => {
      authService.validateSession.mockResolvedValue(true);

      const mimeToExt = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp'
      };

      for (const [mimeType, ext] of Object.entries(mimeToExt)) {
        const file = createMockFile('data', mimeType);
        const event = createMockEvent({ sessionId: 'valid-session', file });
        const response = await POST(event);

        expect(response.status).toBe(200);
        const body = await response.json();
        expect(body.url).toMatch(new RegExp(`\\.${ext}$`));
      }
    });
  });
});

// ---------------------------------------------------------------------------
// Property Tests
// ---------------------------------------------------------------------------

describe('Upload Endpoint — Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.validateSession.mockResolvedValue(true);
  });

  // 8.5 — Property 8: every valid file upload produces a unique URL
  describe('Property 8: every valid file upload produces a unique URL', () => {
    // Feature: insert-picture, Property 8: setiap upload file valid menghasilkan URL unik
    it('for any valid file, each upload produces a unique URL', async () => {
      const validMimeArb = fc.constantFrom('image/jpeg', 'image/png', 'image/gif', 'image/webp');
      // Size between 1 byte and 5MB
      const validSizeArb = fc.integer({ min: 1, max: 5 * 1024 * 1024 });

      const urls = new Set();

      await fc.assert(
        fc.asyncProperty(validMimeArb, validSizeArb, async (mimeType, size) => {
          const file = createMockFile('', mimeType, size);
          const event = createMockEvent({ sessionId: 'valid-session', file });

          const response = await POST(event);
          expect(response.status).toBe(200);

          const body = await response.json();
          expect(body).toHaveProperty('url');
          expect(body.url).toMatch(/^\/uploads\/images\/.+/);

          // Each URL must be unique
          expect(urls.has(body.url)).toBe(false);
          urls.add(body.url);
        }),
        { numRuns: 100 }
      );
    });
  });

  // 8.6 — Property 9: invalid MIME type always returns HTTP 400
  describe('Property 9: invalid MIME type always returns HTTP 400', () => {
    // Feature: insert-picture, Property 9: tipe MIME tidak valid selalu menghasilkan HTTP 400
    it('for any invalid MIME type, always returns HTTP 400', async () => {
      const invalidMimeArb = fc
        .string({ minLength: 1, maxLength: 50 })
        .filter(
          (s) => !['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(s)
        );

      await fc.assert(
        fc.asyncProperty(invalidMimeArb, async (mimeType) => {
          const file = createMockFile('test content', mimeType);
          const event = createMockEvent({ sessionId: 'valid-session', file });

          const response = await POST(event);
          expect(response.status).toBe(400);

          const body = await response.json();
          expect(body).toHaveProperty('error');
        }),
        { numRuns: 100 }
      );
    });
  });
});
