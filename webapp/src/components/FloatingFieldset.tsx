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
  /** Optional element shown next to the title (e.g. favorite button) */
  titleAccessory?: ComponentChildren;
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

  return (
    <fieldset className="fieldset-floating">
      {editing ? (
        <div className="fieldset-floating-legend is-editing">
          <div className="fieldset-floating-edit-input-wrap">
            <input
              ref={inputRef}
              className="input"
              type="text"
              value={draft}
              placeholder={props.placeholder ?? props.label}
              onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
            />
            <div className="fieldset-floating-legend-actions">
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
          </div>
        </div>
      ) : (
        <legend className="fieldset-floating-legend">
          <div className="fieldset-floating-legend-left">
            <span className="fieldset-floating-title">{label}</span>
            <button
              type="button"
              className="fieldset-floating-legend-btn"
              onClick={startEditing}
              title="Edit title"
            >
              <Pencil size={12} />
            </button>
          </div>
          <div className="fieldset-floating-title-accent">
            {props.titleAccessory}
          </div>
        </legend>
      )}
      {props.children}
    </fieldset>
  );
}
