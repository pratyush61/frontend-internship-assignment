import { normalizeStudySet } from './parseStudySet.js';

const KEY = 'recall:last-session:v1';

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
