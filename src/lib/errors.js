const USER_MESSAGES = {
  network: 'Could not reach the server. Check your connection and try again.',
  timeout: 'The model took too long to respond. Try again, or use shorter notes.',
  rate_limit: 'The AI service is busy right now. Wait a few seconds and try again.',
  invalid_output: 'The model returned something we could not read, even after a retry. Try again.',
  empty: 'The model did not return any usable cards or questions. Try more detailed notes.',
  blocked: 'The AI service declined this input. Try rewording your notes.',
  config: 'The server is not configured with an API key yet.',
  upstream: 'The AI service had a problem. Try again in a moment.',
  bad_request: 'That input was not accepted. Check it and try again.',
};

const NON_RETRYABLE = new Set(['config', 'bad_request', 'blocked']);

export class AppError extends Error {
  constructor(kind, message) {
    super(message || USER_MESSAGES[kind] || USER_MESSAGES.upstream);
    this.name = 'AppError';
    this.kind = kind;
    this.retryable = !NON_RETRYABLE.has(kind);
  }
}

/** Kinds where asking the model again is likely to help (vs. a network or config problem). */
export const isModelOutputError = (err) =>
  err instanceof AppError && (err.kind === 'invalid_output' || err.kind === 'empty');
