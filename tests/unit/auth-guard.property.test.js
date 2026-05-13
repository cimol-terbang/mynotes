// Feature: personal-writing-platform, Property 9: admin route protection
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Pure logic test: the regex used in hooks.server.js
const PROTECTED_ROUTES = /^\/admin(?!\/login)/;

describe('Admin Route Guard - Property 9: Admin Route Protection', () => {
  it('semua rute admin (kecuali /admin/login) cocok dengan pola proteksi', () => {
    const protectedRoutes = ['/admin', '/admin/', '/admin/posts/new', '/admin/posts/some-id'];
    fc.assert(
      fc.property(
        fc.constantFrom(...protectedRoutes),
        (route) => {
          expect(PROTECTED_ROUTES.test(route)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('/admin/login tidak cocok dengan pola proteksi', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('/admin/login', '/admin/login/'),
        (route) => {
          expect(PROTECTED_ROUTES.test(route)).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});
