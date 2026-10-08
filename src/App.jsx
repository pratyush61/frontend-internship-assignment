import { useState } from 'react';
import InputPanel from './components/InputPanel.jsx';
import StudyView from './components/StudyView.jsx';
import { EmptyState, ErrorState, LoadingState } from './components/StatusViews.jsx';
import { useStudySet } from './hooks/useStudySet.js';
import { loadSession } from './lib/storage.js';

export default function App() {
  const [saved] = useState(loadSession);
  const [notes, setNotes] = useState(saved?.notes ?? '');
  const [count, setCount] = useState(saved?.count ?? 8);
  const { status, studySet, version, dropped, error, generate, retry } = useStudySet(saved);

  const isLoading = status === 'loading';
  let results;
  if (isLoading) {
    results = <LoadingState />;
  } else if (studySet) {
    results = (
      <>
        {status === 'error' && <ErrorState error={error} onRetry={retry} compact />}
        <StudyView key={version} studySet={studySet} dropped={dropped} />
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
        <h1 className="brand">Recall</h1>
        <p>Turn notes into flashcards and a quiz that re-tests what you miss.</p>
      </header>
      <main className="layout">
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
