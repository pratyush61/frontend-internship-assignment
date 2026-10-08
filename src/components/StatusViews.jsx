import { useEffect, useState } from 'react';

export function EmptyState() {
  return (
    <div className="panel status empty">
      <h2>Nothing to study yet</h2>
      <p>Paste your notes or type a topic, then generate. You’ll get flashcards to flip through and a quiz that re-tests what you missed.</p>
    </div>
  );
}

const SLOW_AFTER_MS = 8000;

export function LoadingState() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setSlow(true), SLOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="panel status loading" role="status" aria-live="polite">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-card" />
      <div className="skeleton skeleton-line" />
      <p>{slow ? 'Still working. Longer notes take more time.' : 'Writing your cards and questions…'}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry, compact = false }) {
  return (
    <div className={`panel status error ${compact ? 'compact' : ''}`} role="alert">
      <div>
        <h2>{compact ? 'Could not generate a new set' : 'Something went wrong'}</h2>
        <p>{error.message}</p>
        {compact && <p className="muted">Your previous study set is still below.</p>}
      </div>
      {error.retryable && (
        <button type="button" className="secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
