# Architecture and decisions

## Request flow

1. `InputPanel` collects notes and an item count. The draft is saved to `localStorage` as the user types.
2. `App` calls `generate()` from `useStudySet`.
3. `useStudySet` tracks the latest request and aborts any earlier request before calling `generateStudySet`.
4. `generateStudySet` (`studyService.js`) calls `requestModelText` (`api.js`) which POSTs to `/api/generate`.
5. `server/generate.js` validates input, calls Gemini with a timeout, and returns the model's raw text.
6. Back on the client, `parseStudySet` extracts JSON, validates every item, and drops invalid ones. Unusable output triggers one retry. The validated study set is then rendered, and the flashcard deck can be shuffled by the user.
7. The hook dispatches `success` only if the request is still current. Otherwise the result is discarded.
8. `StudyView` renders `FlashcardDeck` and `Quiz` from the validated data only.

## Why it is built this way

**Raw text from the server, validation on the client.** The UI is the part that breaks when data is wrong, so the contract is enforced right before rendering, in one module (`parseStudySet.js`) with unit tests. The server stays a thin, safe proxy that also hides the API key.

**No AI SDK.** One `fetch` call is easy to read and explain. The prompt describes the JSON shape, and our validator enforces it. We do not rely on provider-side schema enforcement, so switching providers means changing one file.

**Drop bad items, don't fail the whole response.** One malformed question should not cost the user eleven good ones. The UI reports how many were skipped.

**Retry once on unusable output only.** Malformed output is often a one-off, so a retry usually works. Network, timeout and rate-limit errors are not auto-retried, because repeating them wastes quota and hides the real problem. The user decides.

**Latest request wins.** Aborting the old fetch saves work, and the `isCurrent()` check guarantees correctness even if an old response still arrives. The race is covered by a unit test.

**Quiz logic is a pure reducer.** `quizReducer.js` has no React in it, so retest rounds, answer locking and scoring are tested directly.

**State stays local.** The request lifecycle is one `useReducer`. Flashcard and quiz progress live in their components. There is no global store because nothing needs one.

## Known trade-offs

- The rate limiter is in-memory per serverless instance, so it is best-effort.
- The prompt asks for the same language as the notes, but quality in other languages is untested.
- Persistence is `localStorage` only, so there is no cross-device sync.

## Testing

`npm test` runs Node's built-in test runner over the parser, API client, retry service, request gate, quiz reducer, storage, shuffle, export and server handler, using injected fakes instead of network calls. CI runs the same tests plus the production build. Browser-level behaviour (layout, flip animation, keyboard focus) is checked manually.
