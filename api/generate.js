// Vercel serverless adapter. Local dev uses the same handler via vite.config.js.
import { handleGenerate } from '../server/generate.js';
import { createRateLimiter } from '../server/rateLimit.js';

const allow = createRateLimiter({ limit: 10, windowMs: 60_000 });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { kind: 'bad_request', message: 'Use POST.' } });
  }
  const ip = String(req.headers['x-forwarded-for'] ?? 'unknown').split(',')[0].trim();
  if (!allow(ip)) {
    return res.status(429).json({ error: { kind: 'rate_limit', message: 'Too many requests. Wait a minute and try again.' } });
  }
  const { status, body } = await handleGenerate(req.body, process.env);
  return res.status(status).json(body);
}
