import { useState } from 'react';

export default function FlashcardDeck({ cards }) {
  const [queue, setQueue] = useState(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [marks, setMarks] = useState({}); // card id -> 'known' | 'learning'

  const isDone = index >= queue.length;
  const learning = queue.filter((c) => marks[c.id] === 'learning');
  const knownCount = queue.length - learning.length;

  const goTo = (next) => {
    setIndex(Math.min(Math.max(next, 0), queue.length - 1));
    setFlipped(false);
  };

  const mark = (value) => {
    setMarks((prev) => ({ ...prev, [queue[index].id]: value }));
    setIndex(index + 1);
    setFlipped(false);
  };

  const restart = (nextQueue) => {
    setQueue(nextQueue);
    setMarks({});
    setIndex(0);
    setFlipped(false);
  };

  if (isDone) {
    return (
      <div className="deck-summary">
        <h3>Deck complete</h3>
        <p>
          {knownCount} of {queue.length} marked as known{learning.length > 0 && `, ${learning.length} still learning`}.
        </p>
        <div className="actions">
          {learning.length > 0 && (
            <button type="button" className="primary" onClick={() => restart(learning)}>
              Review {learning.length} still learning
            </button>
          )}
          <button type="button" className="secondary" onClick={() => restart(cards)}>
            Start over
          </button>
        </div>
      </div>
    );
  }

  const card = queue[index];
  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') goTo(index + 1);
    if (e.key === 'ArrowLeft') goTo(index - 1);
  };

  return (
    <div className="deck" onKeyDown={onKeyDown}>
      <p className="progress" aria-live="polite">
        Card {index + 1} of {queue.length}
      </p>

      <button type="button" className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped((f) => !f)}>
        <span className="face front" aria-hidden={flipped}>{card.front}</span>
        <span className="face back" aria-hidden={!flipped}>{card.back}</span>
        <span className="sr-only">{flipped ? 'Answer shown.' : 'Question shown.'} Press to flip.</span>
      </button>

      <div className="deck-controls">
        <button type="button" className="secondary" onClick={() => goTo(index - 1)} disabled={index === 0}>
          Previous
        </button>
        {flipped ? (
          <>
            <button type="button" className="secondary" onClick={() => mark('learning')}>Still learning</button>
            <button type="button" className="primary" onClick={() => mark('known')}>Got it</button>
          </>
        ) : (
          <>
            <span className="hint-flip">Click the card or press Space to flip</span>
            <button type="button" className="secondary" onClick={() => goTo(index + 1)} disabled={index === queue.length - 1}>
              Next
            </button>
          </>
        )}
      </div>
    </div>
  );
}
