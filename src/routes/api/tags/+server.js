import { json } from '@sveltejs/kit';
import { postService } from '$lib/server/post.service.js';

export async function GET() {
  const tags = await postService.getAllTags();
  return json(tags);
}
