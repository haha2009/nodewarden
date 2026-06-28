import { type ComponentChildren, isValidElement } from 'preact';
import { useState } from 'preact/hooks';

export interface FloatingLabelInputProps {
  label: string;
  value: string;
  onInput: (v: string) => void;
  type?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /**
   * 右侧按钮区域内容（如生成密码、复制、显示/隐藏等按钮）。
   * 传入后自动启用 suffix 布局，input 右侧预留空间防止文字与按钮重叠。
   * 按钮应使用 className="input-icon-btn" 的 <button> 元素。
   *
   * 示例：
   * <FloatingLabelInput label="密码" value={pwd} onInput={setPwd}>
   *   <button className="input-icon-btn" onClick={genPwd}><RefreshCw size={16} /></button>
   *   <button className="input-icon-btn" onClick={copy}><Copy size={16} /></button>
   * </FloatingLabelInput>
   */
  children?: ComponentChildren;
}

export function FloatingLabelInput(props: FloatingLabelInputProps) {
  const [focused, setFocused] = useState(false);
  const floating = focused || props.value.length > 0;
  const hasSuffix = !!props.children;

  const suffixButtonCount = hasSuffix
    ? Array.isArray(props.children)
      ? Math.max(props.children.filter(isValidElement).length, 1)
      : 1
    : 0;

  return (
    <label
      className={`field field-floating${floating ? ' is-floating' : ''}`}
      style={hasSuffix ? { '--suffix-btn-count': String(suffixButtonCount) } : undefined}
    >
      <input
        className={`input${hasSuffix ? ' has-suffix' : ''}`}
        type={props.type || 'text'}
        value={props.value}
        disabled={props.disabled}
        autoComplete={props.autoComplete}
        autoFocus={props.autoFocus}
        placeholder={props.placeholder}
        onInput={(e) => props.onInput((e.currentTarget as HTMLInputElement).value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      <span>{props.label}</span>
      {hasSuffix ? <div className="field-floating-suffix">{props.children}</div> : null}
    </label>
  );
}
