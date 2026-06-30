import { type JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Eye, EyeOff, Upload, Trash2, Copy, GripVertical } from 'lucide-preact';
import { t } from '@/lib/i18n';
import type { DynamicCardSchema, DynamicFieldSchema } from '@/lib/types';

// ── Types ──

interface DynamicCardProps {
  schema: DynamicCardSchema;
  depth?: number;
  readOnly?: boolean;
  /** Design mode: shows drag handles, selection, hover actions */
  designMode?: boolean;
  /** Currently selected field key */
  selectedFieldKey?: string | null;
  /** Currently selected card key */
  selectedCardKey?: string | null;
  /** Callback when a field is clicked */
  onSelectField?: (cardKey: string, fieldKey: string) => void;
  /** Callback when a card header is clicked */
  onSelectCard?: (cardKey: string) => void;
  /** Callback when a field label is double-clicked for inline edit */
  onStartInlineEdit?: (fieldKey: string) => void;
  /** Callback to delete a field */
  onDeleteField?: (cardKey: string, fieldKey: string) => void;
  /** Callback to duplicate a field */
  onDuplicateField?: (cardKey: string, fieldKey: string) => void;
  /** Callback to reorder fields within a card */
  onReorderFields?: (cardKey: string, fromIndex: number, toIndex: number) => void;
  /** Whether preview mode is active (hides all design chrome) */
  previewMode?: boolean;
}

export function DynamicCard(props: DynamicCardProps) {
  const { schema, depth = 0, designMode = false, previewMode = false } = props;
  const [collapsed, setCollapsed] = useState(schema.collapsed ?? false);
  const [hoveredCard, setHoveredCard] = useState(false);
  const isCardSelected = props.selectedCardKey === schema.key;

  const fieldCount = schema.fields?.length ?? 0;
  const childCount = schema.children?.length ?? 0;
  const isEmpty = fieldCount === 0 && childCount === 0;

  return (
    <fieldset
      className={[
        'fieldset-floating dynamic-card',
        designMode ? 'design-mode' : '',
        schema.variant === 'accent' ? 'is-accent' : '',
        schema.variant === 'warning' ? 'is-warning' : '',
        isCardSelected && designMode ? 'card-is-selected' : '',
        isEmpty && designMode ? 'is-empty' : '',
      ].filter(Boolean).join(' ')}
      style={depth > 0 ? { marginLeft: `${depth * 24}px` } : undefined}
      onMouseEnter={() => setHoveredCard(true)}
      onMouseLeave={() => setHoveredCard(false)}
    >
      <legend
        className="fieldset-floating-legend"
        onClick={(e) => {
          if (designMode) {
            e.stopPropagation();
            props.onSelectCard?.(schema.key);
          }
        }}
        style={designMode ? { cursor: 'pointer' } : undefined}
      >
        <span className="fieldset-floating-title">{schema.title}</span>
        {collapsed && (fieldCount > 0 || childCount > 0) && (
          <span className="dynamic-card-badge">{fieldCount + childCount}</span>
        )}
        {(schema.children && schema.children.length > 0) && (
          <button
            type="button"
            className="fieldset-floating-legend-btn"
            onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
            title={collapsed ? t('txt_expand') : t('txt_collapse')}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        )}
      </legend>

      {schema.description && (
        <p className="dynamic-card-description">{schema.description}</p>
      )}

      {/* Empty state */}
      {isEmpty && designMode && !previewMode && (
        <div className="dynamic-card-empty">
          <div className="dynamic-card-empty-icon">📦</div>
          <p className="dynamic-card-empty-text">点击上方「+」按钮添加字段</p>
        </div>
      )}

      {/* Fields */}
      {schema.fields && schema.fields.length > 0 && (
        <div className="dynamic-card-fields">
          {schema.fields.map((field, index) => (
            <DesignField
              key={field.key}
              field={field}
              cardKey={schema.key}
              index={index}
              totalFields={schema.fields!.length}
              readOnly={props.readOnly}
              designMode={designMode}
              previewMode={previewMode}
              isSelected={props.selectedFieldKey === field.key}
              isHovered={hoveredCard}
              onSelect={() => props.onSelectCard && props.onSelectField?.(schema.key, field.key)}
              onDoubleClickLabel={() => props.onStartInlineEdit?.(field.key)}
              onDelete={() => props.onDeleteField?.(schema.key, field.key)}
              onDuplicate={() => props.onDuplicateField?.(schema.key, field.key)}
              onMoveUp={index > 0 ? () => props.onReorderFields?.(schema.key, index, index - 1) : undefined}
              onMoveDown={index < schema.fields!.length - 1 ? () => props.onReorderFields?.(schema.key, index, index + 1) : undefined}
            />
          ))}
        </div>
      )}

      {/* Children */}
      {!collapsed && schema.children && schema.children.length > 0 && (
        <div className="dynamic-card-children">
          {schema.children.map((child) => (
            <DynamicCard
              key={child.key}
              schema={child}
              depth={depth + 1}
              readOnly={props.readOnly}
              designMode={designMode}
              previewMode={previewMode}
              selectedFieldKey={props.selectedFieldKey}
              selectedCardKey={props.selectedCardKey}
              onSelectField={props.onSelectField}
              onSelectCard={props.onSelectCard}
              onStartInlineEdit={props.onStartInlineEdit}
              onDeleteField={props.onDeleteField}
              onDuplicateField={props.onDuplicateField}
              onReorderFields={props.onReorderFields}
            />
          ))}
        </div>
      )}
    </fieldset>
  );
}

// ── Design-mode Field Wrapper ──

interface DesignFieldProps {
  field: DynamicFieldSchema;
  cardKey: string;
  index: number;
  totalFields: number;
  readOnly?: boolean;
  designMode: boolean;
  previewMode: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: () => void;
  onDoubleClickLabel: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

function DesignField(props: DesignFieldProps) {
  const { field, designMode, previewMode, isSelected, isHovered } = props;
  const [localHover, setLocalHover] = useState(false);
  const showActions = designMode && !previewMode && (localHover || isSelected);

  if (!designMode) {
    return <DynamicField field={field} readOnly={props.readOnly} />;
  }

  return (
    <div
      className={[
        'design-field',
        isSelected ? 'is-selected' : '',
        localHover ? 'is-hovered' : '',
      ].filter(Boolean).join(' ')}
      onClick={(e) => { e.stopPropagation(); props.onSelect(); }}
      onMouseEnter={() => setLocalHover(true)}
      onMouseLeave={() => setLocalHover(false)}
    >
      {/* Drag handle — visible on hover or selection */}
      {showActions && !previewMode && (
        <div className="design-field-handle" title="拖拽排序">
          <GripVertical size={14} />
        </div>
      )}

      {/* Field content */}
      <div className="design-field-content">
        <div className="design-field-label" onDblClick={(e) => { e.stopPropagation(); props.onDoubleClickLabel(); }}>
          <span>{field.label}</span>
          {field.required && <span className="design-field-required">*</span>}
        </div>
        <div className="design-field-input">
          <DynamicField field={field} readOnly={true} />
        </div>
      </div>

      {/* Actions — visible on hover or selection */}
      {showActions && !previewMode && (
        <div className="design-field-actions">
          {props.onMoveUp && (
            <button type="button" className="design-field-action-btn" title="上移" onClick={(e) => { e.stopPropagation(); props.onMoveUp!(); }}>↑</button>
          )}
          {props.onMoveDown && (
            <button type="button" className="design-field-action-btn" title="下移" onClick={(e) => { e.stopPropagation(); props.onMoveDown!(); }}>↓</button>
          )}
          <button type="button" className="design-field-action-btn" title="复制" onClick={(e) => { e.stopPropagation(); props.onDuplicate(); }}>
            <Copy size={12} />
          </button>
          <button type="button" className="design-field-action-btn danger" title="删除" onClick={(e) => { e.stopPropagation(); props.onDelete(); }}>
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Field Renderer (read-only display) ──

interface DynamicFieldProps {
  field: DynamicFieldSchema;
  readOnly?: boolean;
}

function DynamicField({ field, readOnly }: DynamicFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const disabled = true; // In design mode, always read-only

  const inputBase = 'input dynamic-field-input';
  const fieldCls = `field dynamic-field dynamic-field-${field.type}`;

  switch (field.type) {
    case 'password':
      return (
        <label className={fieldCls}>
          <span className="dynamic-field-label-text">{field.label}</span>
          <div className="dynamic-field-password">
            <input className={inputBase} type={showPassword ? 'text' : 'password'} value={field.value ?? '••••••••'} placeholder={field.placeholder} disabled />
            <button type="button" className="dynamic-field-suffix-btn" tabIndex={-1} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {field.hint && <small className="dynamic-field-hint">{field.hint}</small>}
        </label>
      );

    case 'textarea':
    case 'markdown':
      return (
        <label className={fieldCls}>
          <span className="dynamic-field-label-text">{field.label}</span>
          <textarea className={`${inputBase} textarea`} value={field.value ?? ''} placeholder={field.placeholder} disabled rows={3} />
          {field.hint && <small className="dynamic-field-hint">{field.hint}</small>}
        </label>
      );

    case 'toggle':
      return (
        <label className={`${fieldCls} dynamic-field-toggle`}>
          <input type="checkbox" checked={field.value === 'true'} disabled />
          <span>{field.label}</span>
        </label>
      );

    case 'button':
      return (
        <div className={fieldCls}>
          <button type="button" className={`btn btn-${field.variant ?? 'secondary'} small`} disabled>{field.label}</button>
        </div>
      );

    case 'upload':
      return (
        <label className={fieldCls}>
          <span className="dynamic-field-label-text">{field.label}</span>
          <div className="dynamic-field-upload">
            <button type="button" className="btn btn-secondary small" disabled>
              <Upload size={14} className="btn-icon" />
              {t('txt_upload_attachments')}
            </button>
          </div>
        </label>
      );

    case 'select':
      const selOptions = field.options ?? [];
      const matchedOpt = selOptions.find(o => o.value === field.value);
      if (field.value && !matchedOpt) {
        return (
          <div className={fieldCls}>
            <span className="dynamic-field-label-text">{field.label}</span>
            <span className={`${inputBase} select-unknown-value`}>{field.value}</span>
          </div>
        );
      }
      return (
        <label className={fieldCls}>
          <span className="dynamic-field-label-text">{field.label}</span>
          <select className={inputBase} value={field.value ?? ''} disabled>
            {field.placeholder && <option value="">{field.placeholder}</option>}
            {selOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </label>
      );

    case 'link':
      return (
        <div className={fieldCls}>
          <a className="dynamic-field-link" href={field.href ?? '#'} target="_blank" rel="noopener noreferrer">{field.label}</a>
        </div>
      );

    default:
      return (
        <label className={fieldCls}>
          <span className="dynamic-field-label-text">{field.label}</span>
          <input
            className={inputBase}
            type={field.type === 'url' ? 'url' : field.type === 'email' ? 'email' : field.type}
            value={field.value ?? ''}
            placeholder={field.placeholder}
            disabled
          />
        </label>
      );
  }
}
