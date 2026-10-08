import { AppError } from './errors.js';

const REQUEST_TIMEOUT_MS = 40_000;

/**
 * POSTs to our own backend and returns the model's raw text.
 * `signal` cancels the request (used to drop superseded requests).
 * Throws AppError for everything except caller-initiated aborts, which
 * propagate as the original AbortError so the caller can ignore them.
 */
export async function requestModelText({ notes, count, signal }, fetchImpl = fetch) {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => timeout.abort();
  signal?.addEventListener('abort', onCallerAbort);

  try {
    const res = await fetchImpl('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, count }),
      signal: timeout.signal,
    });

    let data = null;
    try {
      data = await res.json();
    } catch {
      /* non-JSON body handled below */
    }

    if (!res.ok) {
      const err = data?.error;
      throw new AppError(err?.kind || 'upstream', err?.message);
    }
    if (typeof data?.text !== 'string') throw new AppError('invalid_output');
    return data.text;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err?.name === 'AbortError') {
      if (signal?.aborted) throw err; // caller cancelled: not an error to show
      throw new AppError('timeout');
    }
    throw new AppError('network');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
}
