// Vercel serverless adapter. Local dev uses the same handler via vite.config.js.
import { handleGenerate } from '../server/generate.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: { kind: 'bad_request', message: 'Use POST.' } });
  }
  const { status, body } = await handleGenerate(req.body, process.env);
  return res.status(status).json(body);
}
