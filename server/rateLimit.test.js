import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from './rateLimit.js';

test('allows up to the limit, then blocks, then resets after the window', () => {
  let t = 0;
  const allow = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
  assert.equal(allow('a'), true);
  assert.equal(allow('a'), true);
  assert.equal(allow('a'), false);
  assert.equal(allow('b'), true); // other clients unaffected
  t = 1001;
  assert.equal(allow('a'), true);
});
