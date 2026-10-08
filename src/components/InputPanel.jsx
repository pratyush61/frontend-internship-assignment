import { useId, useState } from 'react';

const MAX_LENGTH = 8000;
const MIN_LENGTH = 3;
const COUNTS = [5, 8, 12];
const SAMPLE =
  'Photosynthesis converts light energy into chemical energy. It happens in chloroplasts, where chlorophyll absorbs mostly red and blue light. The light-dependent reactions occur in the thylakoid membranes and produce ATP, NADPH and oxygen. The Calvin cycle, in the stroma, uses ATP and NADPH to fix carbon dioxide into glucose.';

export default function InputPanel({ notes, count, onNotesChange, onCountChange, onSubmit, isLoading }) {
  const [touched, setTouched] = useState(false);
  const textId = useId();
  const hintId = useId();
  const length = notes.trim().length;
  const tooShort = length < MIN_LENGTH;
  const showError = touched && tooShort;

  const submit = (event) => {
    event?.preventDefault();
    setTouched(true);
    if (!tooShort && !isLoading) onSubmit();
  };

  return (
    <form className="panel input-panel" onSubmit={submit}>
      <div className="field-head">
        <label htmlFor={textId}>Your notes or topic</label>
        <button type="button" className="link-button" onClick={() => onNotesChange(SAMPLE)}>
          Use sample notes
        </button>
      </div>
      <textarea
        id={textId}
        value={notes}
        rows={10}
        maxLength={MAX_LENGTH}
        placeholder="Paste lecture notes, or just type a topic like “the French Revolution”."
        aria-invalid={showError}
        aria-describedby={hintId}
        onChange={(e) => onNotesChange(e.target.value)}
        onBlur={() => setTouched(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit(e);
        }}
      />
      <p id={hintId} className={showError ? 'hint error-text' : 'hint'}>
        {showError ? 'Add some notes or a topic to get started.' : 'Press Ctrl or ⌘ + Enter to generate.'}
        <span className="counter">{notes.length.toLocaleString()} / {MAX_LENGTH.toLocaleString()}</span>
      </p>

      <fieldset className="count-field">
        <legend>Cards and questions</legend>
        <div className="segmented">
          {COUNTS.map((n) => (
            <label key={n} className={n === count ? 'selected' : ''}>
              <input type="radio" name="count" value={n} checked={n === count} onChange={() => onCountChange(n)} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" className="primary" disabled={isLoading}>
        {isLoading ? 'Generating…' : 'Generate study set'}
      </button>
    </form>
  );
}
