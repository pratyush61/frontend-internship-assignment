import {
  ALLOWED_COUNTS,
  MAX_NOTES_LENGTH,
  MIN_NOTES_LENGTH,
  SYSTEM_PROMPT,
  buildUserPrompt,
} from './prompt.js';

const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const UPSTREAM_TIMEOUT_MS = 30_000;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

const fail = (status, kind, message) => ({ status, body: { error: { kind, message } } });

/**
 * Validates the request, calls Gemini, and returns the model's raw text.
 * The raw text is deliberately NOT parsed here: turning it into trusted data
 * is the client's job (src/lib/parseStudySet.js).
 *
 * Framework-agnostic: takes a parsed body and env, returns { status, body }.
 * `fetchImpl` is injectable for tests.
 */
export async function handleGenerate(body, env, fetchImpl = fetch) {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return fail(500, 'config', 'The server has no GEMINI_API_KEY. Copy .env.example to .env and add one.');
  }

  const notes = typeof body?.notes === 'string' ? body.notes.trim() : '';
  const count = Number(body?.count ?? 8);
  if (notes.length < MIN_NOTES_LENGTH) return fail(400, 'bad_request', 'Add some notes or a topic first.');
  if (notes.length > MAX_NOTES_LENGTH) {
    return fail(400, 'bad_request', `Notes are too long. Keep them under ${MAX_NOTES_LENGTH} characters.`);
  }
  if (!ALLOWED_COUNTS.includes(count)) return fail(400, 'bad_request', 'Unsupported item count.');

  const model = env.GEMINI_MODEL || DEFAULT_MODEL;
  let upstream;
  try {
    upstream = await fetchImpl(`${GEMINI_BASE_URL}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: buildUserPrompt(notes, count) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4, maxOutputTokens: 8192 },
      }),
    });
  } catch (err) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return fail(504, 'timeout', 'The AI model took too long to respond.');
    }
    return fail(502, 'upstream', 'Could not reach the AI service.');
  }

  if (!upstream.ok) {
    // Log status only. Never log headers or the key.
    console.error(`[generate] upstream responded ${upstream.status}`);
    if (upstream.status === 429) {
      return fail(429, 'rate_limit', 'The AI service is rate-limited right now. Wait a moment and retry.');
    }
    return fail(502, 'upstream', 'The AI service returned an error.');
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return fail(502, 'upstream', 'The AI service returned an unreadable response.');
  }

  if (payload?.promptFeedback?.blockReason) {
    return fail(422, 'blocked', 'The AI service declined to process this input. Try rewording it.');
  }

  const parts = payload?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts) ? parts.map((p) => p?.text ?? '').join('') : '';
  return { status: 200, body: { text } };
}
