import { redirect } from '@sveltejs/kit';
import { authService } from '$lib/server/auth.service.js';

export const actions = {
  default: async (event) => {
    await authService.destroySession(event);
    throw redirect(302, '/admin/login');
  }
};
