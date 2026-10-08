import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateStudySet } from './studyService.js';
import { AppError } from './errors.js';

const goodText = JSON.stringify({ flashcards: [{ front: 'a', back: 'b' }] });
const input = { notes: 'topic', count: 5 };

test('retries once when the first output is malformed', async () => {
  const replies = ['{"broken":', goodText];
  let calls = 0;
  const result = await generateStudySet(input, async () => replies[calls++]);
  assert.equal(calls, 2);
  assert.equal(result.studySet.flashcards.length, 1);
});

test('gives up after two bad outputs with a clear error', async () => {
  let calls = 0;
  await assert.rejects(generateStudySet(input, async () => (calls++, '{}')), { kind: 'empty' });
  assert.equal(calls, 2);
});

test('does not auto-retry network/rate-limit errors', async () => {
  let calls = 0;
  const failing = async () => {
    calls++;
    throw new AppError('rate_limit');
  };
  await assert.rejects(generateStudySet(input, failing), { kind: 'rate_limit' });
  assert.equal(calls, 1);
});
