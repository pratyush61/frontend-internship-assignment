import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDraft, loadSession, saveDraft, saveSession } from './storage.js';

beforeEach(() => {
  const data = new Map();
  globalThis.localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
});

test('draft round-trips and sanitises the count', () => {
  saveDraft({ notes: 'my notes', count: 12 });
  assert.deepEqual(loadDraft(), { notes: 'my notes', count: 12 });
  saveDraft({ notes: 'x', count: 999 });
  assert.equal(loadDraft().count, 8);
});

test('loadDraft ignores missing or corrupt data', () => {
  assert.equal(loadDraft(), null);
  localStorage.setItem('recall:draft:v1', '{not json');
  assert.equal(loadDraft(), null);
  localStorage.setItem('recall:draft:v1', JSON.stringify({ notes: 42 }));
  assert.equal(loadDraft(), null);
});

test('loadSession re-validates saved data', () => {
  saveSession({ studySet: { title: 'T', flashcards: [{ front: 'a', back: 'b' }], quiz: [] }, notes: 'n', count: 5 });
  assert.equal(loadSession().studySet.flashcards.length, 1);
  localStorage.setItem('recall:last-session:v1', JSON.stringify({ studySet: { flashcards: 'bad' } }));
  assert.equal(loadSession(), null);
});
