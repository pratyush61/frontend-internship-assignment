import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { handleGenerate } from './server/generate.js';

const MAX_BODY_BYTES = 64 * 1024;

/** Serves POST /api/generate in `vite dev` with the same handler Vercel runs in production. */
function localApi(env) {
  return {
    name: 'local-api',
    configureServer(server) {
      server.middlewares.use('/api/generate', (req, res) => {
        const send = (status, body) => {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(body));
        };
        if (req.method !== 'POST') return send(405, { error: { kind: 'bad_request', message: 'Use POST.' } });

        let raw = '';
        req.on('data', (chunk) => {
          raw += chunk;
          if (raw.length > MAX_BODY_BYTES) req.destroy();
        });
        req.on('end', async () => {
          let body;
          try {
            body = JSON.parse(raw);
          } catch {
            return send(400, { error: { kind: 'bad_request', message: 'Invalid JSON body.' } });
          }
          const result = await handleGenerate(body, env);
          send(result.status, result.body);
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // '' prefix: server-only vars, never exposed to the client bundle
  return { plugins: [react(), localApi(env)] };
});
