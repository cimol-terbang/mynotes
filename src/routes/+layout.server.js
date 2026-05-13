import { authService } from '$lib/server/auth.service.js';

export async function load({ cookies }) {
  const sessionId = cookies.get('session_id');
  const isAdmin = await authService.validateSession(sessionId);
  return { isAdmin };
}
