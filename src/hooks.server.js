import { redirect } from '@sveltejs/kit';
import { authService } from '$lib/server/auth.service.js';
import { building } from '$app/environment';

const PROTECTED_ROUTES = /^\/admin(?!\/login)/;

export async function handle({ event, resolve }) {
  if (building) return resolve(event);

  // Auth guard for admin routes (except /admin/login)
  if (PROTECTED_ROUTES.test(event.url.pathname)) {
    const sessionId = event.cookies.get('session_id');
    const valid = await authService.validateSession(sessionId);
    if (!valid) {
      throw redirect(302, '/admin/login');
    }
  }

  return resolve(event);
}
