import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppError } from '../lib/errors.js';
import { clearSession, saveSession } from '../lib/storage.js';
import { generateStudySet } from '../lib/studyService.js';

const initialState = (saved) => ({
  status: saved ? 'success' : 'idle', // idle | loading | success | error
  studySet: saved?.studySet ?? null, // survives loading/error so a failed regenerate never destroys a good result
  version: 0, // bumps on every new result so the study UI remounts with fresh state
  dropped: 0,
  error: null,
});

function reducer(state, action) {
  switch (action.type) {
    case 'start':
      return { ...state, status: 'loading', error: null };
    case 'success':
      return { status: 'success', studySet: action.studySet, version: state.version + 1, dropped: action.dropped, error: null };
    case 'cancel':
      return { ...state, status: state.studySet ? 'success' : 'idle', error: null };
    case 'reset':
      return { ...initialState(null), version: state.version + 1 };
    case 'failure':
      return { ...state, status: 'error', error: action.error };
    default:
      return state;
  }
}

/**
 * Owns the generate lifecycle. Only the most recent request may update state:
 * starting a new one aborts the previous fetch, and a request id check
 * discards any response that still slips through (the stale-response rule).
 */
export function useStudySet(savedSession) {
  const [state, dispatch] = useReducer(reducer, savedSession, initialState);
  const latest = useRef({ id: 0, controller: null, lastInput: null });

  const generate = useCallback(async (input) => {
    const current = latest.current;
    current.controller?.abort();
    const controller = new AbortController();
    const id = ++current.id;
    current.controller = controller;
    current.lastInput = input;
    dispatch({ type: 'start' });

    try {
      const { studySet, dropped } = await generateStudySet({ ...input, signal: controller.signal });
      if (id !== current.id) return;
      dispatch({ type: 'success', studySet, dropped });
      saveSession({ studySet, notes: input.notes, count: input.count });
    } catch (err) {
      if (id !== current.id || err?.name === 'AbortError') return;
      dispatch({ type: 'failure', error: err instanceof AppError ? err : new AppError('upstream') });
    }
  }, []);

  const retry = useCallback(() => {
    if (latest.current.lastInput) generate(latest.current.lastInput);
  }, [generate]);

  const cancel = useCallback(() => {
    latest.current.controller?.abort(); // generate() swallows the resulting AbortError
    dispatch({ type: 'cancel' });
  }, []);

  const reset = useCallback(() => {
    latest.current.controller?.abort();
    clearSession();
    dispatch({ type: 'reset' });
  }, []);

  useEffect(() => () => latest.current.controller?.abort(), []);

  return { ...state, generate, retry, cancel, reset };
}
