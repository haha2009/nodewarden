import { type ComponentChildren, type JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Check, Pencil, X } from 'lucide-preact';

export interface FloatingFieldsetProps {
  /** Current title text */
  label: string;
  /** Called with new label text when user saves */
  onSave: (newLabel: string) => void;
  /** Placeholder for the edit input */
  placeholder?: string;
  /** Card content */
  children: ComponentChildren;
}

export function FloatingFieldset(props: FloatingFieldsetProps) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(props.label);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Sync external label changes (e.g. i18n locale switch)
  useEffect(() => { setLabel(props.label); }, [props.label]);

  function startEditing() {
    setDraft(label);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
  }

  function save() {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    setLabel(trimmed);
    setEditing(false);
    props.onSave(trimmed);
  }

  function handleKeyDown(e: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    }
  }

  // Auto-focus + select input when entering edit mode (mount only)
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const floating = draft.length > 0;

  return (
    <fieldset className="fieldset-floating">
      {editing ? (
        <legend className="fieldset-floating-legend is-editing">
          <label
            className={`field field-floating${floating ? ' is-floating' : ''}`}
            style={{ '--suffix-btn-count': '2' }}
          >
            <input
              ref={inputRef}
              className="input has-suffix"
              type="text"
              value={draft}
              placeholder={props.placeholder ?? props.label}
              onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
            />
            <span>{label}</span>
            <div className="field-floating-suffix">
              <button
                type="button"
                className="input-icon-btn"
                onClick={save}
                title="Save"
              >
                <Check size={16} />
              </button>
              <button
                type="button"
                className="input-icon-btn"
                onClick={cancel}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          </label>
        </legend>
      ) : (
        <legend className="fieldset-floating-legend">
          <span className="fieldset-floating-title">{label}</span>
          <button
            type="button"
            className="fieldset-floating-legend-btn"
            onClick={startEditing}
            title="Edit title"
          >
            <Pencil size={12} />
          </button>
        </legend>
      )}
      {props.children}
    </fieldset>
  );
}
