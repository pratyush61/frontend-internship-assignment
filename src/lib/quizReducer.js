/**
 * Quiz state machine. Pure, so it is unit-tested without React.
 * A "round" is one pass over `queue`. Retesting wrong answers starts a new
 * round whose queue is only the questions missed in the previous one.
 */
export function createQuizState(questions) {
  return { queue: questions, index: 0, selected: null, answers: [], phase: 'question', round: 1, history: [] };
}

export function quizReducer(state, action) {
  switch (action.type) {
    case 'select': {
      if (state.phase !== 'question' || state.selected !== null) return state;
      const question = state.queue[state.index];
      return {
        ...state,
        selected: action.optionIndex,
        answers: [...state.answers, { id: question.id, correct: action.optionIndex === question.answerIndex }],
      };
    }
    case 'next': {
      if (state.selected === null) return state;
      if (state.index + 1 < state.queue.length) return { ...state, index: state.index + 1, selected: null };
      const correct = state.answers.filter((a) => a.correct).length;
      return {
        ...state,
        phase: 'finished',
        selected: null,
        history: [...state.history, { round: state.round, correct, total: state.queue.length }],
      };
    }
    case 'retest-wrong': {
      const wrong = new Set(state.answers.filter((a) => !a.correct).map((a) => a.id));
      const queue = state.queue.filter((q) => wrong.has(q.id));
      if (queue.length === 0) return state;
      return { ...state, queue, index: 0, selected: null, answers: [], phase: 'question', round: state.round + 1 };
    }
    case 'restart':
      return createQuizState(action.questions);
    default:
      return state;
  }
}
