import { useEffect, useState } from 'react';

export function EmptyState() {
  return (
    <div className="panel status empty">
      <div className="empty-heading">
        <div><span className="section-label">THE RECALL WORKFLOW</span><h2>Your next study session, <em>upgraded.</em></h2><p>One source of truth. Three steps toward knowledge that lasts.</p></div>
        <div className="empty-score" aria-hidden="true"><span>01</span><small>START HERE</small></div>
      </div>
      <div className="empty-feature-grid">
        <div className="empty-feature feature-cyan"><span className="feature-index">01 / ABSORB</span><div className="feature-symbol" aria-hidden="true">↗</div><h3>Build your set</h3><p>Turn notes, chapters, or a topic into a focused study set.</p></div>
        <div className="empty-feature feature-violet"><span className="feature-index">02 / RETRIEVE</span><div className="feature-symbol" aria-hidden="true">⌘</div><h3>Test your recall</h3><p>Use flashcards and quizzes to strengthen active memory.</p></div>
        <div className="empty-feature feature-coral"><span className="feature-index">03 / IMPROVE</span><div className="feature-symbol" aria-hidden="true">↻</div><h3>Close the gaps</h3><p>Return to missed concepts and see what you truly know.</p></div>
      </div>
      <div className="empty-footer"><span className="footer-pulse" /><div><strong>Your workspace is ready</strong><p>Add material on the left to generate your first study set.</p></div><span className="footer-arrow" aria-hidden="true">↗</span></div>
    </div>
  );
}

const SLOW_AFTER_MS = 8000;

export function LoadingState({ onCancel }) {
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
      {onCancel && (
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
      )}
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
