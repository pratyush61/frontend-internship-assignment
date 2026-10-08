import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractJson, parseStudySet } from './parseStudySet.js';

const good = {
  title: 'Photosynthesis',
  flashcards: [{ front: 'What is chlorophyll?', back: 'The pigment that absorbs light.' }],
  quiz: [{ question: 'Where does it occur?', options: ['Chloroplast', 'Nucleus'], answerIndex: 0, explanation: 'Chloroplasts hold chlorophyll.' }],
};

test('parses clean JSON', () => {
  const { studySet, dropped } = parseStudySet(JSON.stringify(good));
  assert.equal(studySet.title, 'Photosynthesis');
  assert.equal(studySet.flashcards.length, 1);
  assert.equal(studySet.quiz[0].id, 'q-1');
  assert.equal(dropped, 0);
});

test('strips markdown code fences', () => {
  assert.deepEqual(extractJson('```json\n{"a":1}\n```'), { a: 1 });
});

test('finds JSON surrounded by chatter', () => {
  assert.deepEqual(extractJson('Sure! Here you go:\n{"a":1}\nHope that helps.'), { a: 1 });
});

test('malformed or truncated JSON throws invalid_output', () => {
  for (const bad of ['{"title": "x", "flashcards": [', 'not json at all', '', '   ']) {
    assert.throws(() => parseStudySet(bad), { kind: 'invalid_output' });
  }
});

test('wrong top-level shape throws invalid_output', () => {
  for (const bad of ['[]', '"hello"', '42', 'null']) {
    assert.throws(() => parseStudySet(bad), { kind: 'invalid_output' });
  }
});

test('valid JSON with nothing usable throws empty', () => {
  assert.throws(() => parseStudySet('{}'), { kind: 'empty' });
  assert.throws(() => parseStudySet('{"flashcards":[],"quiz":[]}'), { kind: 'empty' });
  assert.throws(() => parseStudySet('{"flashcards":"oops","quiz":null}'), { kind: 'empty' });
});

test('drops invalid items but keeps valid ones, and counts the drops', () => {
  const messy = {
    flashcards: [{ front: 'ok', back: 'fine' }, { front: '', back: 'no front' }, 'string', { front: 'ok', back: 'duplicate' }],
    quiz: [
      { question: 'q1', options: ['a', 'b'], answerIndex: 5 },
      { question: 'q2', options: ['a', 'a'], answerIndex: 0 },
      { question: 'q3', options: ['a', ''], answerIndex: 0 },
      { question: 'q4', options: ['a', 'b', 'c'], answerIndex: '2' },
      { question: 'q5', options: 'nope', answerIndex: 0 },
    ],
  };
  const { studySet, dropped } = parseStudySet(JSON.stringify(messy));
  assert.equal(studySet.flashcards.length, 1);
  assert.equal(studySet.quiz.length, 1);
  assert.equal(studySet.quiz[0].answerIndex, 2);
  assert.equal(dropped, 7);
});

test('falls back to a default title and trims/limits text', () => {
  const { studySet } = parseStudySet(JSON.stringify({ flashcards: [{ front: '  hi  ', back: 'x'.repeat(5000) }] }));
  assert.equal(studySet.title, 'Study set');
  assert.equal(studySet.flashcards[0].front, 'hi');
  assert.equal(studySet.flashcards[0].back.length, 800);
});
