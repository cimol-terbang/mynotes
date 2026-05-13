import { json } from '@sveltejs/kit';
import { authService } from '$lib/server/auth.service.js';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp'
};

/** @type {import('./$types').RequestHandler} */
export async function POST({ request, cookies }) {
  // 6.2 — Validate authentication
  const sessionId = cookies.get('session_id');
  const valid = await authService.validateSession(sessionId);
  if (!valid) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 6.3 — Parse multipart/form-data
  const formData = await request.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return json({ error: 'File tidak ditemukan' }, { status: 400 });
  }

  // 6.4 — Validate MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return json({ error: 'Tipe file tidak didukung' }, { status: 400 });
  }

  // 6.5 — Validate file size
  const arrayBuffer = await file.arrayBuffer();
  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    return json({ error: 'Ukuran file melebihi batas maksimal 5MB' }, { status: 400 });
  }

  // 6.6 — Generate unique filename
  const ext = MIME_TO_EXT[file.type];
  const filename = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;

  // 6.7 — Store file to static/uploads/images/
  const uploadDir = path.join(process.cwd(), 'static', 'uploads', 'images');

  try {
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), Buffer.from(arrayBuffer));
  } catch (err) {
    // 6.9 — Error handling for filesystem failures
    console.error('Gagal menyimpan file:', err);
    return json({ error: 'Gagal menyimpan file' }, { status: 500 });
  }

  // 6.8 — Return success with URL
  return json({ url: `/uploads/images/${filename}` }, { status: 200 });
}
