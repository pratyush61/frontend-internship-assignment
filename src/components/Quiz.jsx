import { useEffect, useReducer, useRef } from 'react';
import { createQuizState, quizReducer } from '../lib/quizReducer.js';

function optionClass(state, question, i) {
  if (state.selected === null) return 'option';
  if (i === question.answerIndex) return 'option correct';
  if (i === state.selected) return 'option wrong';
  return 'option dim';
}

function QuizResults({ state, questions, dispatch }) {
  const { correct, total } = state.history.at(-1);
  const missed = state.queue.filter((q) => state.answers.some((a) => a.id === q.id && !a.correct));
  const perfect = missed.length === 0;

  return (
    <div className="results">
      <h3>{perfect ? (state.round > 1 ? 'You got them all' : 'Perfect score') : 'Round complete'}</h3>
      <p className="score">{correct} of {total} correct</p>
      {state.history.length > 1 && (
        <ul className="history" aria-label="Score by round">
          {state.history.map((h) => (
            <li key={h.round}>Round {h.round}: {h.correct}/{h.total}</li>
          ))}
        </ul>
      )}
      {!perfect && (
        <>
          <h4>To review</h4>
          <ul className="missed">
            {missed.map((q) => (
              <li key={q.id}>
                <strong>{q.question}</strong>
                <span>Answer: {q.options[q.answerIndex]}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="actions">
        {!perfect && (
          <button type="button" className="primary" onClick={() => dispatch({ type: 'retest-wrong' })}>
            Retest {missed.length} missed {missed.length === 1 ? 'question' : 'questions'}
          </button>
        )}
        <button type="button" className={perfect ? 'primary' : 'secondary'} onClick={() => dispatch({ type: 'restart', questions })}>
          Retake full quiz
        </button>
      </div>
    </div>
  );
}

export default function Quiz({ questions }) {
  const [state, dispatch] = useReducer(quizReducer, questions, createQuizState);
  const headingRef = useRef(null);
  const position = `${state.round}-${state.index}-${state.phase}`;
  const previousPosition = useRef(position);

  // Move focus to the new question / results so keyboard and screen-reader users aren't left behind.
  useEffect(() => {
    if (previousPosition.current === position) return;
    previousPosition.current = position;
    headingRef.current?.focus();
  }, [position]);

  if (state.phase === 'finished') {
    return (
      <div ref={headingRef} tabIndex={-1} className="quiz">
        <QuizResults state={state} questions={questions} dispatch={dispatch} />
      </div>
    );
  }

  const question = state.queue[state.index];
  const answered = state.selected !== null;
  const wasCorrect = answered && state.selected === question.answerIndex;
  const isLast = state.index + 1 === state.queue.length;

  return (
    <div className="quiz">
      <p className="progress">
        Question {state.index + 1} of {state.queue.length}
        {state.round > 1 && <span className="badge">Retest round {state.round}</span>}
      </p>
      <h3 ref={headingRef} tabIndex={-1} className="question">{question.question}</h3>

      <div className="options" role="group" aria-label="Answer options">
        {question.options.map((option, i) => (
          <button
            key={i}
            type="button"
            className={optionClass(state, question, i)}
            disabled={answered}
            onClick={() => dispatch({ type: 'select', optionIndex: i })}
          >
            <span className="option-text">{option}</span>
            {answered && i === question.answerIndex && <span className="option-tag">Correct answer</span>}
            {answered && i === state.selected && i !== question.answerIndex && <span className="option-tag">Your answer</span>}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {answered && (
          <div className={`feedback ${wasCorrect ? 'good' : 'bad'}`}>
            <strong>{wasCorrect ? 'Correct.' : 'Not quite.'}</strong>{' '}
            {question.explanation}
          </div>
        )}
      </div>

      <div className="actions">
        <button type="button" className="primary" disabled={!answered} onClick={() => dispatch({ type: 'next' })}>
          {isLast ? 'See results' : 'Next question'}
        </button>
      </div>
    </div>
  );
}
