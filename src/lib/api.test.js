import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requestModelText } from './api.js';

const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => body });

test('returns text on success', async () => {
  assert.equal(await requestModelText({ notes: 'x', count: 5 }, reply(200, { text: 'hi' })), 'hi');
});

test('maps server error kinds to AppError', async () => {
  const f = reply(429, { error: { kind: 'rate_limit', message: 'slow down' } });
  await assert.rejects(requestModelText({ notes: 'x', count: 5 }, f), { kind: 'rate_limit', message: 'slow down' });
});

test('non-JSON error body becomes an upstream error', async () => {
  const f = async () => ({ ok: false, status: 502, json: async () => { throw new Error('html'); } });
  await assert.rejects(requestModelText({ notes: 'x', count: 5 }, f), { kind: 'upstream' });
});

test('success body without text is invalid_output', async () => {
  await assert.rejects(requestModelText({ notes: 'x', count: 5 }, reply(200, {})), { kind: 'invalid_output' });
});

test('fetch failure becomes a network error', async () => {
  const f = async () => { throw new TypeError('Failed to fetch'); };
  await assert.rejects(requestModelText({ notes: 'x', count: 5 }, f), { kind: 'network' });
});

test('caller abort rethrows AbortError (not shown as an error)', async () => {
  const controller = new AbortController();
  const f = (_url, { signal }) =>
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(Object.assign(new Error('x'), { name: 'AbortError' }))));
  const promise = requestModelText({ notes: 'x', count: 5, signal: controller.signal }, f);
  controller.abort();
  await assert.rejects(promise, { name: 'AbortError' });
});
