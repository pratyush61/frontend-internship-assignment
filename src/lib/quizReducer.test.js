import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createQuizState, quizReducer } from './quizReducer.js';

const questions = [1, 2, 3].map((n) => ({ id: `q-${n}`, question: `Q${n}`, options: ['a', 'b'], answerIndex: 0, explanation: '' }));
const run = (state, ...actions) => actions.reduce(quizReducer, state);

test('answers are locked once chosen', () => {
  const s = run(createQuizState(questions), { type: 'select', optionIndex: 1 }, { type: 'select', optionIndex: 0 });
  assert.equal(s.selected, 1);
  assert.equal(s.answers.length, 1);
  assert.equal(s.answers[0].correct, false);
});

test('cannot advance before answering', () => {
  const s = createQuizState(questions);
  assert.equal(quizReducer(s, { type: 'next' }), s);
});

test('finishes, records history, and retests only wrong answers', () => {
  let s = createQuizState(questions);
  s = run(s, { type: 'select', optionIndex: 0 }, { type: 'next' }); // q1 right
  s = run(s, { type: 'select', optionIndex: 1 }, { type: 'next' }); // q2 wrong
  s = run(s, { type: 'select', optionIndex: 1 }, { type: 'next' }); // q3 wrong
  assert.equal(s.phase, 'finished');
  assert.deepEqual(s.history, [{ round: 1, correct: 1, total: 3 }]);

  s = quizReducer(s, { type: 'retest-wrong' });
  assert.equal(s.phase, 'question');
  assert.equal(s.round, 2);
  assert.deepEqual(s.queue.map((q) => q.id), ['q-2', 'q-3']);

  s = run(s, { type: 'select', optionIndex: 0 }, { type: 'next' }, { type: 'select', optionIndex: 0 }, { type: 'next' });
  assert.deepEqual(s.history.at(-1), { round: 2, correct: 2, total: 2 });
  assert.equal(quizReducer(s, { type: 'retest-wrong' }), s); // nothing wrong: no-op
});

test('restart resets everything', () => {
  const s = run(createQuizState(questions), { type: 'select', optionIndex: 0 }, { type: 'restart', questions });
  assert.equal(s.index, 0);
  assert.equal(s.answers.length, 0);
  assert.equal(s.round, 1);
});
