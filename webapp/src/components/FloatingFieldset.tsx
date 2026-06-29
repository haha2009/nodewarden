import { type ComponentChildren, type JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { t } from '@/lib/i18n';

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

  useEffect(() => { setLabel(props.label); }, [props.label]);

  function startEditing() { setDraft(label); setEditing(true); }
  function cancel() { setEditing(false); }
  function save() {
    const trimmed = draft.trim();
    if (trimmed.length === 0) return;
    setLabel(trimmed);
    setEditing(false);
    props.onSave(trimmed);
  }
  function handleKeyDown(e: JSX.TargetedKeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
  }
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  return (
    <fieldset className="fieldset-floating">
      <legend className="fieldset-floating-legend">
        {editing ? (
          <span className="fieldset-floating-edit-row">
            <input ref={inputRef} className="fieldset-floating-edit-input" type="text" value={draft}
              placeholder={props.placeholder ?? props.label}
              onInput={(e) => setDraft((e.currentTarget as HTMLInputElement).value)}
              onKeyDown={handleKeyDown}
              onBlur={save} />
            <span className="fieldset-floating-edit-suffix">
              <button type="button" className="fieldset-floating-edit-btn save" onClick={save} title={t('txt_save')}>
                &#x2713;
              </button>
              <button type="button" className="fieldset-floating-edit-btn cancel" onClick={cancel} title={t('txt_cancel')}>
                &#x2715;
              </button>
            </span>
          </span>
        ) : (
          <span className="fieldset-floating-title">{label}</span>
        )}
        {!editing && (
          <button type="button" className="fieldset-floating-legend-btn"
            onClick={startEditing} title={t('txt_edit')}>
            &#x270E;
          </button>
        )}
      </legend>
      {!editing && props.titleAccessory && (
        <div className="fieldset-floating-action">
          {props.titleAccessory}
        </div>
      )}
      {props.children}
    </fieldset>
  );
}
