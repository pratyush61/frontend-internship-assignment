import { useEffect, useState } from 'react';
import InputPanel from './components/InputPanel.jsx';
import StudyView from './components/StudyView.jsx';
import { EmptyState, ErrorState, LoadingState } from './components/StatusViews.jsx';
import { useStudySet } from './hooks/useStudySet.js';
import { loadDraft, loadSession, saveDraft } from './lib/storage.js';

export default function App() {
  const [saved] = useState(loadSession);
  const [draft] = useState(loadDraft);
  const [notes, setNotes] = useState(draft?.notes ?? saved?.notes ?? '');
  const [count, setCount] = useState(draft?.count ?? saved?.count ?? 8);
  const { status, studySet, version, dropped, error, generate, retry, cancel, reset } = useStudySet(saved);

  useEffect(() => saveDraft({ notes, count }), [notes, count]);

  const isLoading = status === 'loading';
  let results;
  if (isLoading) {
    results = <LoadingState onCancel={cancel} />;
  } else if (studySet) {
    results = (
      <>
        {status === 'error' && <ErrorState error={error} onRetry={retry} compact />}
        <StudyView key={version} studySet={studySet} dropped={dropped} onClear={reset} />
      </>
    );
  } else if (status === 'error') {
    results = <ErrorState error={error} onRetry={retry} />;
  } else {
    results = <EmptyState />;
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-topline">
          <a className="brand-lockup" href="#main" aria-label="Recall home">
            <span className="brand-mark" aria-hidden="true">R</span>
            <span className="brand-copy">
              <span className="header-kicker">AI LEARNING WORKSPACE</span>
              <h1 className="brand">Recall<span className="brand-period">.</span></h1>
            </span>
          </a>
          <div className="header-status"><span className="status-dot" /> BUILT FOR ACTIVE RECALL <span className="status-divider">/</span> LEARN · TEST · RETAIN</div>
        </div>
        <div className="hero-row">
          <div className="hero-copy">
            <p className="hero-eyebrow">YOUR PERSONAL KNOWLEDGE ENGINE</p>
            <p className="hero-title">Turn information into <span>long-term memory.</span></p>
            <p className="hero-description">Transform notes into focused flashcards and adaptive quizzes. Find the gaps, revisit what you miss, and make every study session count.</p>
            <div className="header-flow" aria-label="Study workflow">
              <span><b>01</b> Add material</span><i aria-hidden="true" />
              <span><b>02</b> Generate</span><i aria-hidden="true" />
              <span><b>03</b> Recall</span>
            </div>
          </div>
          <div className="hero-visual" aria-label="Recall learning cycle">
            <div className="hero-visual-top"><span className="live-indicator" /> RECALL ENGINE <span className="hero-visual-version">01 / 03</span></div>
            <div className="orbit-stage" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" />
              <span className="orbit-node node-one">LEARN</span><span className="orbit-node node-two">TEST</span><span className="orbit-node node-three">RETAIN</span>
              <div className="orbit-core"><span>R</span><small>RECALL</small></div>
            </div>
            <div className="hero-visual-footer"><span>From passive reading</span><span className="visual-arrow">→</span><strong>to active learning</strong></div>
          </div>
        </div>
      </header>
      <main className="layout" id="main">
        <InputPanel
          notes={notes}
          count={count}
          onNotesChange={setNotes}
          onCountChange={setCount}
          onSubmit={() => generate({ notes: notes.trim(), count })}
          isLoading={isLoading}
        />
        <div className="results-column">{results}</div>
      </main>
    </div>
  );
}
