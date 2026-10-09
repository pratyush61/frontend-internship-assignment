import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shuffleArray } from './shuffle.js';

test('shuffleArray returns a permutation and leaves the input untouched', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffleArray(input, () => 0.3);
  assert.deepEqual([...out].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual(input, [1, 2, 3, 4, 5]);
});
