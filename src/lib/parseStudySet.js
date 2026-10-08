import { AppError } from './errors.js';

const MAX_TEXT = 800;
const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

const isPlainObject = (v) => typeof v === 'object' && v !== null && !Array.isArray(v);
const cleanText = (v) => (typeof v === 'string' ? v.trim().slice(0, MAX_TEXT) : '');

/**
 * Pulls a JSON value out of model text. Models sometimes wrap JSON in code
 * fences or add a sentence before/after it, even when told not to.
 */
export function extractJson(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) throw new AppError('invalid_output', 'Empty response from model.');

  const unfenced = trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(unfenced);
  } catch {
    const start = unfenced.indexOf('{');
    const end = unfenced.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(unfenced.slice(start, end + 1));
      } catch {
        /* fall through */
      }
    }
    throw new AppError('invalid_output', 'Response was not valid JSON.');
  }
}

function normalizeFlashcards(raw) {
  const seen = new Set();
  const cards = [];
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!isPlainObject(item)) continue;
    const front = cleanText(item.front);
    const back = cleanText(item.back);
    if (!front || !back || seen.has(front.toLowerCase())) continue;
    seen.add(front.toLowerCase());
    cards.push({ id: `card-${cards.length + 1}`, front, back });
  }
  return cards;
}

function normalizeQuiz(raw) {
  const questions = [];
  for (const item of Array.isArray(raw) ? raw : []) {
    if (!isPlainObject(item) || !Array.isArray(item.options)) continue;
    const question = cleanText(item.question);
    const options = item.options.map(cleanText);
    const answerIndex = Number(item.answerIndex);

    const optionsOk =
      options.length >= MIN_OPTIONS &&
      options.length <= MAX_OPTIONS &&
      options.every(Boolean) &&
      new Set(options.map((o) => o.toLowerCase())).size === options.length;
    const answerOk = Number.isInteger(answerIndex) && answerIndex >= 0 && answerIndex < options.length;

    if (!question || !optionsOk || !answerOk) continue;
    questions.push({
      id: `q-${questions.length + 1}`,
      question,
      options,
      answerIndex,
      explanation: cleanText(item.explanation),
    });
  }
  return questions;
}

const countItems = (v) => (Array.isArray(v) ? v.length : 0);

/**
 * Validates and cleans an already-parsed object. Invalid individual items are
 * dropped (and counted) rather than failing the whole response, so one bad
 * card does not cost the user the other eleven.
 */
export function normalizeStudySet(raw) {
  if (!isPlainObject(raw)) throw new AppError('invalid_output', 'Response had the wrong shape.');

  const flashcards = normalizeFlashcards(raw.flashcards);
  const quiz = normalizeQuiz(raw.quiz);
  if (flashcards.length === 0 && quiz.length === 0) throw new AppError('empty');

  const dropped = countItems(raw.flashcards) + countItems(raw.quiz) - flashcards.length - quiz.length;
  return {
    studySet: { title: cleanText(raw.title) || 'Study set', flashcards, quiz },
    dropped: Math.max(dropped, 0),
  };
}

/** Raw model text -> trusted study set. Throws AppError('invalid_output' | 'empty'). */
export const parseStudySet = (text) => normalizeStudySet(extractJson(text));
