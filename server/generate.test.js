import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleGenerate } from './generate.js';

const env = { GEMINI_API_KEY: 'test-key' };
const upstream = (status, body) => async () => ({ ok: status < 400, status, json: async () => body });

test('refuses to run without an API key', async () => {
  const r = await handleGenerate({ notes: 'abc', count: 5 }, {});
  assert.equal(r.status, 500);
  assert.equal(r.body.error.kind, 'config');
});

test('validates input', async () => {
  assert.equal((await handleGenerate({ notes: ' ', count: 5 }, env)).status, 400);
  assert.equal((await handleGenerate({ notes: 'x'.repeat(9000), count: 5 }, env)).status, 400);
  assert.equal((await handleGenerate({ notes: 'abc', count: 999 }, env)).status, 400);
  assert.equal((await handleGenerate(undefined, env)).status, 400);
});

test('returns model text and sends the key only in a header', async () => {
  let seen;
  const fetchImpl = async (url, init) => {
    seen = { url, init };
    return { ok: true, status: 200, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"a"' }, { text: ':1}' }] } }] }) };
  };
  const r = await handleGenerate({ notes: 'abc', count: 5 }, env, fetchImpl);
  assert.deepEqual(r, { status: 200, body: { text: '{"a":1}' } });
  assert.ok(!seen.url.includes('test-key'));
  assert.equal(seen.init.headers['x-goog-api-key'], 'test-key');
});

test('maps upstream failures without leaking details', async () => {
  assert.equal((await handleGenerate({ notes: 'abc', count: 5 }, env, upstream(429, {}))).body.error.kind, 'rate_limit');
  assert.equal((await handleGenerate({ notes: 'abc', count: 5 }, env, upstream(500, {}))).body.error.kind, 'upstream');
});

test('maps timeouts and network failure', async () => {
  const timeout = async () => { throw Object.assign(new Error('t'), { name: 'TimeoutError' }); };
  const down = async () => { throw new TypeError('fetch failed'); };
  assert.equal((await handleGenerate({ notes: 'abc', count: 5 }, env, timeout)).body.error.kind, 'timeout');
  assert.equal((await handleGenerate({ notes: 'abc', count: 5 }, env, down)).body.error.kind, 'upstream');
});

test('handles blocked prompts and empty candidates', async () => {
  const blocked = upstream(200, { promptFeedback: { blockReason: 'SAFETY' } });
  assert.equal((await handleGenerate({ notes: 'abc', count: 5 }, env, blocked)).body.error.kind, 'blocked');
  const r = await handleGenerate({ notes: 'abc', count: 5 }, env, upstream(200, { candidates: [] }));
  assert.deepEqual(r.body, { text: '' });
});
