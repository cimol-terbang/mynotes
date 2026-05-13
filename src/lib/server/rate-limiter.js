import { RateLimiter } from 'sveltekit-rate-limiter/server';

export const commentRateLimiter = new RateLimiter({
  IP: [10, 'm'], // 10 requests per minute per IP
});
