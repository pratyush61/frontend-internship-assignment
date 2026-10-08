# Recall

Paste lecture notes or type a topic. Recall asks an LLM for **structured JSON**, validates it, and turns it into two study tools:

- **Flashcards**: flip, move through the deck, mark "Got it" or "Still learning", then review only the cards you were still learning.
- **Quiz**: multiple choice with instant feedback and explanations, a score, and **re-testing of only the questions you got wrong**, repeated until you clear them.

It is not a chatbot: the model never returns text that is shown directly. Everything on screen is rendered from validated data.

> Live demo: _add your deployed URL here_  ·  Screen recording: _add link here_

## Quick start

Requires Node 18+ and a free [Gemini API key](https://aistudio.google.com/apikey).

```bash
cp .env.example .env     # then paste your key into GEMINI_API_KEY
npm install && npm start # http://localhost:5173
```

| Command | What it does |
| --- | --- |
| `npm start` | Dev server. Also serves `POST /api/generate` locally. |
| `npm test` | Unit tests (Node's built-in test runner, no extra dependencies). |
| `npm run build` | Production build into `dist/`. |

### Environment variables

| Name | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Server-side only. Never sent to or bundled into the browser. |
| `GEMINI_MODEL` | no | Defaults to `gemini-3.1-flash-lite`. Any Gemini model that supports `generateContent` works. |

### Deploy (Vercel)

Import the repo, add `GEMINI_API_KEY` under Project Settings → Environment Variables, deploy. Vercel detects Vite for the frontend and runs `api/generate.js` as the serverless function.

## How it works

```
InputPanel ──► useStudySet ──► studyService ──► api.js ──► POST /api/generate ──► Gemini
                    ▲               │ parseStudySet (validate + clean)
                    └───────────────┘
        status: idle | loading | success | error  ──►  StudyView ► FlashcardDeck / Quiz
```

- **API key stays on the server.** The browser only talks to `/api/generate` (`server/generate.js`). The same handler runs under Vite in dev and as a Vercel function in production (thin adapters in `vite.config.js` and `api/generate.js`). The server validates input size and count, applies a timeout, maps upstream failures to safe error kinds, and returns the model's raw text.
- **The client owns trust.** `src/lib/parseStudySet.js` is the single place model output becomes app data (details below).
- **State.** `useStudySet` is a small reducer-based hook for the request lifecycle. The quiz is a pure reducer (`src/lib/quizReducer.js`) so its rules are unit-tested without React. Flashcard progress is local component state.
- **No SDK.** The Gemini call is one `fetch` in `server/generate.js`, requesting `responseMimeType: application/json`. The JSON shape is specified in the prompt (`server/prompt.js`) and **enforced by our own validator**, not by the provider.

## Handling bad AI output

| Failure | Behaviour |
| --- | --- |
| Malformed or truncated JSON | `extractJson` strips code fences and surrounding chatter; if still invalid, one automatic retry, then an error with a Try again button. |
| Wrong shape (array, string, `null`) | Rejected as `invalid_output`, same retry path. |
| Valid JSON, nothing usable | Rejected as `empty`, same retry path. |
| Some items invalid (missing text, `answerIndex` out of range, duplicate options, <2 options) | Only those items are dropped; the rest are used and the UI says how many were skipped. |
| Only flashcards or only quiz returned | The missing tab is disabled; the other works. |
| Slow response | 30s timeout on the server, 40s on the client, then a timeout error. After 8s the loading state says it is still working. |
| Network down / rate limit (429) / provider error / blocked prompt | Distinct, plain-language messages. Retry is offered where it can help (not for config or rejected-input errors). These are not auto-retried. |
| **Stale responses** | Starting a new request aborts the previous fetch, and a request-id check discards any result that still arrives late, so an old response can never overwrite a newer one. |
| Failed regenerate when a set already exists | The error appears above the previous set instead of replacing it. |
| Corrupt saved session | `localStorage` data is re-validated on load; invalid data is ignored. |

Prompt injection: the user's notes are wrapped in `<notes>` tags and the system prompt tells the model to treat them as data only. This reduces the risk; it is not a guarantee.

## UI notes

Two-column layout on desktop, stacked on mobile. Loading (skeleton), empty, and error states. Keyboard: Space/Enter flips a card, ← → move between cards, arrow keys switch tabs, focus moves to each new quiz question, Cmd/Ctrl+Enter submits. Colour is never the only signal (answers are labelled "Correct answer" / "Your answer"). Follows the system light/dark setting and `prefers-reduced-motion`. The last study set is saved in `localStorage` and restored on reload.

## AI usage note

_Edit this so it is true for you._ I used Claude to help plan the architecture and to generate a first draft of much of the code, tests, and this README. I then ran, read, and changed it, and I can explain each file. The study content itself is generated at runtime by Gemini.

## Known limitations

- Answer positions in the quiz are as the model returns them; there is no client-side option shuffling.
- No streaming and no follow-up refinement of an existing set.
- Only one saved session; no history.
- No rate limiting on `/api/generate`, so a public deployment could be abused until you add limits or a quota alert on the key.
- Very long notes are rejected (8,000 characters) rather than chunked.
- Quality depends on the model; factual errors in generated cards are possible, so check anything important against your source.
- Tested with unit tests and a production build. Browser-level and real-device testing is listed under "Time spent" below.

## Time spent

_Fill in honestly, e.g. "~X hours: planning X, implementation X, testing X, README X."_

## What I'd do next

Option shuffling, streaming partial results, a "make these harder" refinement prompt, per-item regenerate, IP-based rate limiting, and end-to-end tests with Playwright.
