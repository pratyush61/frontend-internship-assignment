import { normalizeStudySet } from './parseStudySet.js';

const KEY = 'recall:last-session:v1';
const DRAFT_KEY = 'recall:draft:v1';
const VALID_COUNTS = [5, 8, 12];

export function saveDraft(draft) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

/** Restores what the user was typing, so a reload doesn't lose their notes. */
export function loadDraft() {
  try {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (typeof draft?.notes !== 'string') return null;
    return { notes: draft.notes, count: VALID_COUNTS.includes(draft.count) ? draft.count : 8 };
  } catch {
    return null;
  }
}

export function saveSession(session) {
  try {
    localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    /* storage full or disabled: persistence is a convenience, ignore */
  }
}

/** Loads the last session. Data is re-validated because localStorage is user-editable. */
export function loadSession() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved) return null;
    const { studySet } = normalizeStudySet(saved.studySet);
    return { studySet, notes: String(saved.notes ?? ''), count: Number(saved.count) || 8 };
  } catch {
    return null;
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
