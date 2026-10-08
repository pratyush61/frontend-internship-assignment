import { requestModelText } from './api.js';
import { isModelOutputError } from './errors.js';
import { parseStudySet } from './parseStudySet.js';

const MAX_OUTPUT_ATTEMPTS = 2;

/**
 * Fetches and parses a study set. If the model's output is unusable
 * (malformed JSON, wrong shape, nothing valid) we ask once more, since
 * model output is non-deterministic. Network, timeout and rate-limit errors
 * are NOT retried automatically: the user decides.
 */
export async function generateStudySet({ notes, count, signal }, requestText = requestModelText) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_OUTPUT_ATTEMPTS; attempt++) {
    const text = await requestText({ notes, count, signal });
    try {
      return parseStudySet(text);
    } catch (err) {
      if (!isModelOutputError(err)) throw err;
      lastError = err;
    }
  }
  throw lastError;
}
