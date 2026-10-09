import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileNameFor, studySetToMarkdown } from './exportMarkdown.js';

const set = {
  title: 'Photosynthesis',
  flashcards: [{ id: 'c1', front: 'What is chlorophyll?', back: 'A pigment.' }],
  quiz: [{ id: 'q1', question: 'Where?', options: ['Chloroplast', 'Nucleus'], answerIndex: 0, explanation: 'It holds chlorophyll.' }],
};

test('renders flashcards, quiz, correct answer and explanation', () => {
  const md = studySetToMarkdown(set);
  assert.match(md, /^# Photosynthesis/);
  assert.match(md, /\*\*Q:\*\* What is chlorophyll\?/);
  assert.match(md, /- \[x\] Chloroplast/);
  assert.match(md, /- \[ \] Nucleus/);
  assert.match(md, /> It holds chlorophyll\./);
});

test('omits empty sections', () => {
  const md = studySetToMarkdown({ ...set, quiz: [] });
  assert.ok(!md.includes('## Quiz'));
});

test('builds safe file names', () => {
  assert.equal(fileNameFor('The French Revolution!'), 'the-french-revolution.md');
  assert.equal(fileNameFor('???'), 'study-set.md');
});
