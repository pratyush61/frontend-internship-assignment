import { useId, useState } from 'react';
import FlashcardDeck from './FlashcardDeck.jsx';
import Quiz from './Quiz.jsx';

export default function StudyView({ studySet, dropped }) {
  const { title, flashcards, quiz } = studySet;
  const [tab, setTab] = useState(flashcards.length > 0 ? 'cards' : 'quiz');
  const baseId = useId();

  const tabs = [
    { id: 'cards', label: `Flashcards (${flashcards.length})`, disabled: flashcards.length === 0 },
    { id: 'quiz', label: `Quiz (${quiz.length})`, disabled: quiz.length === 0 },
  ];

  const onTabKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const enabled = tabs.filter((t) => !t.disabled);
    const next = enabled[(enabled.findIndex((t) => t.id === tab) + (e.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length];
    setTab(next.id);
    document.getElementById(`${baseId}-${next.id}`)?.focus();
  };

  return (
    <section className="panel study" aria-label="Study set">
      <h2 className="study-title">{title}</h2>
      {dropped > 0 && (
        <p className="notice">
          {dropped} {dropped === 1 ? 'item' : 'items'} from the model {dropped === 1 ? 'was' : 'were'} malformed and skipped.
        </p>
      )}

      <div className="tabs" role="tablist" aria-label="Study mode" onKeyDown={onTabKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            id={`${baseId}-${t.id}`}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            aria-controls={`${baseId}-panel`}
            tabIndex={tab === t.id ? 0 : -1}
            disabled={t.disabled}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-${tab}`}>
        {tab === 'cards' ? <FlashcardDeck cards={flashcards} /> : <Quiz questions={quiz} />}
      </div>
    </section>
  );
}
