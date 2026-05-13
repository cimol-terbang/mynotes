import { fail, redirect } from '@sveltejs/kit';
import { authService } from '$lib/server/auth.service.js';

export const actions = {
  default: async (event) => {
    const data = await event.request.formData();
    const username = data.get('username')?.toString().trim() ?? '';
    const password = data.get('password')?.toString() ?? '';

    if (!username || !password) {
      return fail(400, { error: 'Nama pengguna atau kata sandi salah.' });
    }

    const valid = await authService.verifyCredentials(username, password);
    if (!valid) {
      return fail(400, { error: 'Nama pengguna atau kata sandi salah.' });
    }

    await authService.createSession(event);
    throw redirect(302, '/admin');
  }
};
