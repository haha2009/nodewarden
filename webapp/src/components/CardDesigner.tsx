import { type JSX } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  Type, ToggleLeft, MousePointer, Upload, AlignLeft, Hash, Mail, Phone,
  Globe, Calendar, Palette, Link, FileText, FolderPlus, Trash2, GripVertical,
  ChevronDown, ChevronRight, Settings as SettingsIcon, Eye, EyeOff,
  Undo2, Redo2, Plus, Sparkles, Copy,
} from 'lucide-preact';
import type { DynamicCardSchema, DynamicFieldSchema, DynamicFieldType } from '@/lib/types';
import { t } from '@/lib/i18n';

// ── Field type definitions ──
interface FieldTypeDef {
  type: DynamicFieldType;
  label: string;
  icon: typeof Type;
  defaultLabel: string;
}

function getFieldTypes(): FieldTypeDef[] {
  return [
    { type: 'text', label: t('txt_field_type_text'), icon: Type, defaultLabel: t('txt_field_default_text') },
    { type: 'password', label: t('txt_field_type_password'), icon: EyeOff, defaultLabel: t('txt_field_default_password') },
    { type: 'textarea', label: t('txt_field_type_textarea'), icon: AlignLeft, defaultLabel: t('txt_field_default_textarea') },
    { type: 'markdown', label: t('txt_field_type_markdown'), icon: FileText, defaultLabel: t('txt_field_default_markdown') },
    { type: 'toggle', label: t('txt_field_type_toggle'), icon: ToggleLeft, defaultLabel: t('txt_field_default_toggle') },
    { type: 'button', label: t('txt_field_type_button'), icon: MousePointer, defaultLabel: t('txt_field_default_button') },
    { type: 'upload', label: t('txt_field_type_upload'), icon: Upload, defaultLabel: t('txt_field_default_upload') },
    { type: 'select', label: t('txt_field_type_select'), icon: ChevronDown, defaultLabel: t('txt_field_default_select') },
    { type: 'number', label: t('txt_field_type_number'), icon: Hash, defaultLabel: t('txt_field_default_number') },
    { type: 'email', label: t('txt_field_type_email'), icon: Mail, defaultLabel: t('txt_field_default_email') },
    { type: 'phone', label: t('txt_field_type_phone'), icon: Phone, defaultLabel: t('txt_field_default_phone') },
    { type: 'url', label: t('txt_field_type_url'), icon: Globe, defaultLabel: t('txt_field_default_url') },
    { type: 'date', label: t('txt_field_type_date'), icon: Calendar, defaultLabel: t('txt_field_default_date') },
    { type: 'color', label: t('txt_field_type_color'), icon: Palette, defaultLabel: t('txt_field_default_color') },
    { type: 'link', label: t('txt_field_type_link'), icon: Link, defaultLabel: t('txt_field_default_link') },
  ];
}


let idCounter = 0;
function uid(): string {
  return `dyn_${Date.now()}_${++idCounter}`;
}

// ── Toast ──
export interface ToastMessage {
  id: string;
  text: string;
  type?: 'info' | 'success' | 'warning';
  undoAction?: () => void;
}
let toastCounter = 0;

// ── Props ──
interface CardDesignerProps {
  schema: DynamicCardSchema;
  onChange: (schema: DynamicCardSchema) => void;
  onToasts?: (toasts: ToastMessage[]) => void;
}

export function CardDesigner(props: CardDesignerProps) {
  const [localSchema, setLocalSchema] = useState<DynamicCardSchema>(props.schema);
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null);
  const [selectedCardKey, setSelectedCardKey] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [inlineEditKey, setInlineEditKey] = useState<string | null>(null);

  // History for undo/redo
  const historyRef = useRef<DynamicCardSchema[]>([JSON.parse(JSON.stringify(props.schema))]);
  const historyIndexRef = useRef(0);
  const MAX_HISTORY = 50;

  // Drag state
  const dragItem = useRef<{ type: DynamicFieldType; fromPalette: boolean; fieldKey?: string; cardKey?: string } | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [dragOverField, setDragOverField] = useState<{ cardKey: string; index: number; pos: 'before' | 'after' } | null>(null);
  const [paletteDragging, setPaletteDragging] = useState<string | null>(null);

  const prevSchemaSnapshot = useRef(JSON.stringify({ key: props.schema.key, title: props.schema.title, fields: props.schema.fields?.length, children: props.schema.children?.length }));
  let schemaShouldSync = false;
  const curSnap = JSON.stringify({ key: props.schema.key, title: props.schema.title, fields: props.schema.fields?.length, children: props.schema.children?.length });
  if (curSnap !== prevSchemaSnapshot.current) {
    prevSchemaSnapshot.current = curSnap;
    schemaShouldSync = true;
  }
  useEffect(() => {
    if (schemaShouldSync) {
      setLocalSchema(props.schema);
      setSelectedFieldKey(null);
      setSelectedCardKey(null);
      historyRef.current = [JSON.parse(JSON.stringify(props.schema))];
      historyIndexRef.current = 0;
    }
  });

  const pushHistory = function(schema: DynamicCardSchema) {
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    h.splice(idx + 1);
    h.push(JSON.parse(JSON.stringify(schema)));
    if (h.length > MAX_HISTORY) h.shift();
    historyIndexRef.current = h.length - 1;
  };

  const commit = function(next: DynamicCardSchema) {
    setLocalSchema(next);
    props.onChange(next);
    pushHistory(next);
  };

  const undo = function() {
    const idx = historyIndexRef.current;
    if (idx > 0) {
      historyIndexRef.current = idx - 1;
      const prev = JSON.parse(JSON.stringify(historyRef.current[idx - 1]));
      setLocalSchema(prev);
      props.onChange(prev);
    }
  };

  const redo = function() {
    const h = historyRef.current;
    const idx = historyIndexRef.current;
    if (idx < h.length - 1) {
      historyIndexRef.current = idx + 1;
      const next = JSON.parse(JSON.stringify(h[idx + 1]));
      setLocalSchema(next);
      props.onChange(next);
    }
  };

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const showToast = function(text: string, undoAction?: () => void) {
    if (props.onToasts) {
      const id = `toast_${++toastCounter}`;
      props.onToasts([{ id, text, type: undoAction ? 'warning' : 'info', undoAction }]);
    }
  };

  function addField(type: DynamicFieldType, cardKey: string) {
    const def = getFieldTypes().find(d => d.type === type)!;
    const newField: DynamicFieldSchema = { key: uid(), type, label: def.defaultLabel, value: type === 'toggle' ? 'false' : '' };
    const next = addToCard(localSchema, cardKey, newField);
    commit(next);
    setSelectedFieldKey(newField.key);
    setSelectedCardKey(cardKey);
  }

  function addSubCard(parentKey: string) {
    const newCard: DynamicCardSchema = { key: uid(), title: t('txt_designer_new_card'), fields: [], children: [] };
    const next = addToCardChildren(localSchema, parentKey, newCard);
    commit(next);
    setSelectedCardKey(newCard.key);
  }

  function duplicateField(cardKey: string, fieldKey: string) {
    const found = findField(localSchema, fieldKey);
    if (!found) return;
    const clone: DynamicFieldSchema = { ...found.field, key: uid(), label: found.field.label + t('txt_designer_duplicate_suffix') };
    const next = insertAfterField(localSchema, cardKey, fieldKey, clone);
    commit(next);
    setSelectedFieldKey(clone.key);
    setSelectedCardKey(cardKey);
  }

  function removeField(cardKey: string, fieldKey: string) {
    const found = findField(localSchema, fieldKey);
    if (!found) return;
    const backup = found.field;
    const next = removeFromCard(localSchema, cardKey, fieldKey);
    commit(next);
    setSelectedFieldKey(null);
    showToast(t('txt_designer_toast_field_deleted', { label: backup.label }), () => {
      const restored = addToCard(localSchema, cardKey, backup);
      commit(restored);
      setSelectedFieldKey(fieldKey);
    });
  }

  function removeCard(cardKey: string) {
    const card = findCard(localSchema, cardKey);
    if (!card) return;
    const next = removeCardRecursive(localSchema, cardKey);
    commit(next);
    setSelectedCardKey(null);
    showToast(t('txt_designer_toast_card_deleted', { title: card.title }));
  }

  function updateField(cardKey: string, fieldKey: string, patch: Partial<DynamicFieldSchema>) {
    const next = updateFieldInCard(localSchema, cardKey, fieldKey, patch);
    commit(next);
  }

  function updateCard(cardKey: string, patch: Partial<DynamicCardSchema>) {
    const next = updateCardRecursive(localSchema, cardKey, patch);
    commit(next);
  }

  function reorderFields(cardKey: string, fromIndex: number, toIndex: number) {
    const next = reorderFieldsInCard(localSchema, cardKey, fromIndex, toIndex);
    commit(next);
  }


  let selectedField: DynamicFieldSchema | null = null;
  let selectedFieldCardKey = '';
  if (selectedFieldKey) {
    const found = findField(localSchema, selectedFieldKey);
    if (found) { selectedField = found.field; selectedFieldCardKey = found.cardKey; }
  }
  let selectedCard: DynamicCardSchema | null = null;
  if (selectedCardKey) {
    selectedCard = findCard(localSchema, selectedCardKey) ?? null;
  }

  return (
    <div className="card-designer-wrapper">
      <div className="card-designer-toolbar">
        <div className="card-designer-toolbar-left">
          <button type="button" className="designer-toolbar-btn" onClick={undo} disabled={!canUndo} title={t('txt_designer_undo')}>
            <Undo2 size={14} />
          </button>
          <button type="button" className="designer-toolbar-btn" onClick={redo} disabled={!canRedo} title={t('txt_designer_redo')}>
            <Redo2 size={14} />
          </button>
          <div className="card-designer-toolbar-sep" />
          <button type="button" className={`designer-toolbar-btn ${previewMode ? 'is-active' : ''}`} onClick={() => setPreviewMode(!previewMode)} title={t('txt_designer_preview_toggle')}>
            {previewMode ? <Eye size={14} /> : <EyeOff size={14} />}
            <span>{previewMode ? t('txt_designer_previewing') : t('txt_designer_edit_mode')}</span>
          </button>
        </div>
        <div className="card-designer-toolbar-right">
          <span className="card-designer-hint">
            {previewMode ? t('txt_designer_preview_hint') : t('txt_designer_edit_hint')}
          </span>
        </div>
      </div>

      <div className="card-designer-body">
        <div className="card-designer-palette">
          <div className="designer-section-title">{t('txt_designer_add_field')}</div>
          <div className="palette-grid">
            {getFieldTypes().map((def) => (
              <div
                key={def.type}
                className={`palette-item${paletteDragging === def.type ? ' is-dragging' : ''}`}
                draggable
                onDragStart={() => { dragItem.current = { type: def.type, fromPalette: true }; setPaletteDragging(def.type); }}
                onDragEnd={() => { dragItem.current = null; setDragOver(null); setDragOverField(null); setPaletteDragging(null); }}
                onClick={() => addField(def.type, localSchema.key)}
                title={t('txt_designer_add_field') + ' ' + def.label}
              >
                <def.icon size={14} />
                <span>{def.label}</span>
              </div>
            ))}
          </div>
          <div className="designer-section-title" style={{marginTop: '12px'}}>{t('txt_designer_add_card')}</div>
          <div className="palette-item palette-add-card" onClick={() => addSubCard(localSchema.key)}>
            <FolderPlus size={14} />
            <span>{t('txt_designer_subcard')}</span>
          </div>
        </div>

        <div className={`card-designer-canvas ${previewMode ? 'is-preview' : ''}`}>
          <DesignerCardNode
            card={localSchema}
            depth={0}
            selectedCardKey={selectedCardKey}
            selectedFieldKey={selectedFieldKey}
            dragOver={dragOver}
            dragOverField={dragOverField}
            inlineEditKey={inlineEditKey}
            previewMode={previewMode}
            onSelectCard={(key) => { setSelectedCardKey(key); setSelectedFieldKey(null); }}
            onSelectField={(cardKey, fieldKey) => { setSelectedFieldKey(fieldKey); setSelectedCardKey(cardKey); }}
            onAddField={(cardKey, type) => addField(type, cardKey)}
            onAddSubCard={addSubCard}
            onRemoveField={removeField}
            onRemoveCard={removeCard}
            onDuplicateField={duplicateField}
            onReorderFields={reorderFields}
            onDragOverCard={(key) => setDragOver(key)}
            onDragLeave={() => { setDragOver(null); setDragOverField(null); }}
            onDragOverFieldSlot={(cardKey, index, pos) => setDragOverField({ cardKey, index, pos })}
            onDropOnCard={(cardKey) => {
              if (dragItem.current) {
                if (dragItem.current.fromPalette) {
                  addField(dragItem.current.type, cardKey);
                } else if (dragItem.current.fieldKey && dragItem.current.cardKey) {
                  const srcCardKey = dragItem.current.cardKey;
                  const fieldKey = dragItem.current.fieldKey;
                  const found = findField(localSchema, fieldKey);
                  if (found) {
                    const field = found.field;
                    let next = removeFromCard(localSchema, srcCardKey, fieldKey);
                    next = addToCard(next, cardKey, field);
                    commit(next);
                    setSelectedFieldKey(field.key);
                    setSelectedCardKey(cardKey);
                  }
                }
              }
              dragItem.current = null;
              setDragOver(null);
              setDragOverField(null);
            }}
            onDropOnFieldSlot={(cardKey, toIndex) => {
              if (dragItem.current && !dragItem.current.fromPalette && dragItem.current.fieldKey) {
                const fieldKey = dragItem.current.fieldKey;
                const card = findCard(localSchema, cardKey);
                if (card && card.fields) {
                  const fromIndex = card.fields.findIndex(f => f.key === fieldKey);
                  if (fromIndex >= 0 && fromIndex !== toIndex) {
                    const adjustedTo = toIndex > fromIndex ? toIndex - 1 : toIndex;
                    reorderFields(cardKey, fromIndex, adjustedTo);
                  }
                }
              }
              dragItem.current = null;
              setDragOverField(null);
            }}
            onStartInlineEdit={(fieldKey) => setInlineEditKey(fieldKey)}
            onEndInlineEdit={() => setInlineEditKey(null)}
            onUpdateField={updateField}
          />
        </div>

        <div className={`card-designer-props ${selectedField || selectedCard ? 'has-selection' : ''}`}>
          {selectedField ? (
            <FieldProperties
              field={selectedField}
              cardKey={selectedFieldCardKey}
              onUpdate={(patch) => updateField(selectedFieldCardKey, selectedField.key, patch)}
              onRemove={() => removeField(selectedFieldCardKey, selectedField.key)}
            />
          ) : selectedCard ? (
            <CardProperties
              card={selectedCard}
              onUpdate={(patch) => updateCard(selectedCard.key, patch)}
              onRemove={selectedCard.key !== localSchema.key ? () => removeCard(selectedCard.key) : undefined}
            />
          ) : (
            <div className="designer-empty-props">
              <Sparkles size={28} />
              <p>{t('txt_designer_empty_props')}</p>
              <span className="designer-empty-props-sub">{t('txt_designer_empty_props_sub')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Designer Card Node (recursive) ──

interface DesignerCardNodeProps {
  card: DynamicCardSchema;
  depth: number;
  selectedCardKey: string | null;
  selectedFieldKey: string | null;
  dragOver: string | null;
  dragOverField: { cardKey: string; index: number; pos: 'before' | 'after' } | null;
  inlineEditKey: string | null;
  previewMode: boolean;
  onSelectCard: (key: string) => void;
  onSelectField: (cardKey: string, fieldKey: string) => void;
  onAddField: (cardKey: string, type: DynamicFieldType) => void;
  onAddSubCard: (parentKey: string) => void;
  onRemoveField: (cardKey: string, fieldKey: string) => void;
  onRemoveCard: (cardKey: string) => void;
  onDuplicateField: (cardKey: string, fieldKey: string) => void;
  onReorderFields: (cardKey: string, fromIndex: number, toIndex: number) => void;
  onDragOverCard: (key: string) => void;
  onDragLeave: () => void;
  onDragOverFieldSlot: (cardKey: string, index: number, pos: 'before' | 'after') => void;
  onDropOnCard: (cardKey: string) => void;
  onDropOnFieldSlot: (cardKey: string, toIndex: number) => void;
  onStartInlineEdit: (fieldKey: string) => void;
  onEndInlineEdit: () => void;
  onUpdateField: (cardKey: string, fieldKey: string, patch: Partial<DynamicFieldSchema>) => void;
}

function DesignerCardNode(props: DesignerCardNodeProps) {
  const { card, depth } = props;
  const isSelected = props.selectedCardKey === card.key;
  const isDragOver = props.dragOver === card.key;
  const [collapsed, setCollapsed] = useState(false);
  const fieldCount = card.fields?.length ?? 0;
  const childCount = card.children?.length ?? 0;
  const isEmpty = fieldCount === 0 && childCount === 0;
  const showCardActions = !props.previewMode && (isSelected || isDragOver);

  return (
    <div
      className={[
        'designer-card-node',
        isSelected ? 'is-selected' : '',
        isDragOver ? 'is-drag-over' : '',
        isEmpty ? 'is-empty' : '',
      ].filter(Boolean).join(' ')}
      style={depth > 0 ? { marginLeft: `${depth * 12}px` } : undefined}
      onClick={(e) => { e.stopPropagation(); props.onSelectCard(card.key); }}
      onDragOver={(e) => { e.preventDefault(); props.onDragOverCard(card.key); }}
      onDragLeave={props.onDragLeave}
      onDrop={(e) => { e.preventDefault(); props.onDropOnCard(card.key); }}
    >
      <div className="designer-card-header">
        <span className="designer-card-title">{card.title || t('txt_designer_unnamed_card')}</span>
        {showCardActions && (
          <div className="designer-card-actions">
            <button type="button" className="designer-icon-btn" title={t('txt_designer_add_subcard')}
              onClick={(e) => { e.stopPropagation(); props.onAddSubCard(card.key); }}>
              <FolderPlus size={13} />
            </button>
            {depth > 0 && (
              <button type="button" className="designer-icon-btn danger" title={t('txt_designer_delete_card')}
                onClick={(e) => { e.stopPropagation(); props.onRemoveCard(card.key); }}>
                <Trash2 size={13} />
              </button>
            )}
            {card.children && card.children.length > 0 && (
              <button type="button" className="designer-icon-btn" title={collapsed ? t('txt_designer_expand') : t('txt_designer_collapse')}
                onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}>
                {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
              </button>
            )}
          </div>
        )}
      </div>

      {isEmpty && !props.previewMode && (
        <div className="designer-empty-state">
          <Plus size={16} />
          <span>{t('txt_designer_empty_state')}</span>
        </div>
      )}

      {card.fields && card.fields.length > 0 && (
        <div className="designer-fields">
          {card.fields.map((field, index) => (
            <DesignerFieldItem
              key={field.key}
              field={field}
              cardKey={card.key}
              index={index}
              totalFields={card.fields!.length}
              isSelected={props.selectedFieldKey === field.key}
              isInlineEdit={props.inlineEditKey === field.key}
              dragOverField={props.dragOverField}
              previewMode={props.previewMode}
              onSelect={() => props.onSelectField(card.key, field.key)}
              onRemove={() => props.onRemoveField(card.key, field.key)}
              onDuplicate={() => props.onDuplicateField(card.key, field.key)}
              onDragStart={() => { dragItem.current = { type: field.type, fromPalette: false, fieldKey: field.key, cardKey: card.key }; }}
              onDragEnd={() => { dragItem.current = null; }}
              onDragOverSlot={(pos) => props.onDragOverFieldSlot(card.key, index, pos)}
              onDropOnSlot={(pos) => {
                const toIndex = pos === 'before' ? index : index + 1;
                props.onDropOnFieldSlot(card.key, toIndex);
              }}
              onStartInlineEdit={() => props.onStartInlineEdit(field.key)}
              onEndInlineEdit={props.onEndInlineEdit}
              onUpdateField={(patch) => props.onUpdateField(card.key, field.key, patch)}
            />
          ))}
        </div>
      )}

      {!props.previewMode && (
        <div className="designer-card-quickadd" onClick={(e) => { e.stopPropagation(); props.onAddField(card.key, 'text'); }}>
          <Plus size={12} />
          <span>{t('txt_designer_quick_add_field')}</span>
        </div>
      )}

      {!collapsed && card.children && card.children.map((child) => (
        <DesignerCardNode
          key={child.key}
          card={child}
          depth={depth + 1}
          selectedCardKey={props.selectedCardKey}
          selectedFieldKey={props.selectedFieldKey}
          dragOver={props.dragOver}
          dragOverField={props.dragOverField}
          inlineEditKey={props.inlineEditKey}
          previewMode={props.previewMode}
          onSelectCard={props.onSelectCard}
          onSelectField={props.onSelectField}
          onAddField={props.onAddField}
          onAddSubCard={props.onAddSubCard}
          onRemoveField={props.onRemoveField}
          onRemoveCard={props.onRemoveCard}
          onDuplicateField={props.onDuplicateField}
          onReorderFields={props.onReorderFields}
          onDragOverCard={props.onDragOverCard}
          onDragLeave={props.onDragLeave}
          onDragOverFieldSlot={props.onDragOverFieldSlot}
          onDropOnCard={props.onDropOnCard}
          onDropOnFieldSlot={props.onDropOnFieldSlot}
          onStartInlineEdit={props.onStartInlineEdit}
          onEndInlineEdit={props.onEndInlineEdit}
          onUpdateField={props.onUpdateField}
        />
      ))}
    </div>
  );
}

// ── Designer Field Item ──

interface DesignerFieldItemProps {
  field: DynamicFieldSchema;
  cardKey: string;
  index: number;
  totalFields: number;
  isSelected: boolean;
  isInlineEdit: boolean;
  dragOverField: { cardKey: string; index: number; pos: 'before' | 'after' } | null;
  previewMode: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onDragOverSlot: (pos: 'before' | 'after') => void;
  onDropOnSlot: (pos: 'before' | 'after') => void;
  onStartInlineEdit: () => void;
  onEndInlineEdit: () => void;
  onUpdateField: (patch: Partial<DynamicFieldSchema>) => void;
}

function DesignerFieldItem(props: DesignerFieldItemProps) {
  const { field, isSelected, isInlineEdit, dragOverField, previewMode } = props;
  const [hovered, setHovered] = useState(false);
  const [editValue, setEditValue] = useState(field.label);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering inline edit
  useEffect(() => {
    if (isInlineEdit && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isInlineEdit]);

  const showActions = !previewMode && (hovered || isSelected);
  const isDragBefore = dragOverField?.cardKey === props.cardKey && dragOverField?.index === props.index && dragOverField?.pos === 'before';
  const isDragAfter = dragOverField?.cardKey === props.cardKey && dragOverField?.index === props.index && dragOverField?.pos === 'after';

  function handleEditSubmit() {
    props.onUpdateField({ label: editValue || field.label });
    props.onEndInlineEdit();
  }

  function handleEditCancel() {
    setEditValue(field.label);
    props.onEndInlineEdit();
  }

  return (
    <div
      className={[
        'designer-field-item',
        isSelected ? 'is-selected' : '',
        hovered ? 'is-hovered' : '',
        isDragBefore ? 'drag-indicator-before' : '',
        isDragAfter ? 'drag-indicator-after' : '',
      ].filter(Boolean).join(' ')}
      draggable={!previewMode && !isInlineEdit}
      onDragStart={(e) => {
        if (!previewMode) {
          e.stopPropagation();
          props.onDragStart();
        }
      }}
      onDragEnd={props.onDragEnd}
      onDragOver={(e) => {
        if (previewMode) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const pos = e.clientY < midY ? 'before' : 'after';
        props.onDragOverSlot(pos);
      }}
      onDrop={(e) => {
        if (previewMode) return;
        e.preventDefault();
        e.stopPropagation();
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        const pos = e.clientY < midY ? 'before' : 'after';
        props.onDropOnSlot(pos);
      }}
      onClick={(e) => { e.stopPropagation(); props.onSelect(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showActions && !isInlineEdit && (
        <div className="designer-field-handle" title={t('txt_designer_drag_sort')}>
          <GripVertical size={12} />
        </div>
      )}

      <div className="designer-field-body">
        {isInlineEdit ? (
          <input
            ref={inputRef}
            className="designer-inline-edit-input"
            type="text"
            value={editValue}
            onInput={(e) => setEditValue((e.currentTarget as HTMLInputElement).value)}
            onBlur={handleEditSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEditSubmit();
              if (e.key === 'Escape') handleEditCancel();
              e.stopPropagation();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className="designer-field-label"
            onDblClick={(e) => { e.stopPropagation(); props.onStartInlineEdit(); }}
          >
            {field.label}
            {field.required && <span className="designer-field-required">*</span>}
          </span>
        )}
        <span className="designer-field-type-badge">{field.type}</span>
      </div>

      {showActions && !isInlineEdit && (
        <div className="designer-field-actions">
          <button type="button" className="designer-icon-btn" title={t('txt_designer_duplicate')}
            onClick={(e) => { e.stopPropagation(); props.onDuplicate(); }}>
            <Copy size={12} />
          </button>
          <button type="button" className="designer-icon-btn danger" title={t('txt_designer_delete')}
            onClick={(e) => { e.stopPropagation(); props.onRemove(); }}>
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </div>
  );
}

// ── Field Properties Panel ──

interface FieldPropertiesProps {
  field: DynamicFieldSchema;
  cardKey: string;
  onUpdate: (patch: Partial<DynamicFieldSchema>) => void;
  onRemove: () => void;
}

function FieldProperties({ field, onUpdate, onRemove }: FieldPropertiesProps) {
  const prevFieldKey = useRef(field.key);
  const prevFieldTexts = useRef({ label: field.label, value: field.value ?? '', placeholder: field.placeholder ?? '', hint: field.hint ?? '' });
  const textCache: Record<string, string> = { ...prevFieldTexts.current };

  useEffect(() => {
    const texts = { label: field.label, value: field.value ?? '', placeholder: field.placeholder ?? '', hint: field.hint ?? '' };
    if (field.key !== prevFieldKey.current || texts.label !== prevFieldTexts.current.label || texts.value !== prevFieldTexts.current.value || texts.placeholder !== prevFieldTexts.current.placeholder || texts.hint !== prevFieldTexts.current.hint) {
      prevFieldKey.current = field.key;
      Object.assign(prevFieldTexts.current, texts);
      Object.assign(textCache, texts);
    }
  });

  return (
    <div className="designer-props-panel">
      <div className="designer-props-header">
        <span>{t('txt_designer_field_props')}</span>
        <button type="button" className="designer-icon-btn danger" onClick={onRemove} title={t('txt_designer_delete_field')}>
          <Trash2 size={13} />
        </button>
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_type')}</label>
        <select className="input" value={field.type}
          onChange={(e) => onUpdate({ type: (e.currentTarget as HTMLSelectElement).value as DynamicFieldType })}>
          {getFieldTypes().map((def) => (
            <option key={def.type} value={def.type}>{def.label}</option>
          ))}
        </select>
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_label')}</label>
        <input className="input" type="text" value={textCache.label}
          onInput={(e) => { textCache.label = (e.currentTarget as HTMLInputElement).value; }}
          onBlur={() => onUpdate({ label: textCache.label })}
          onKeyDown={(e) => { if (e.key === 'Escape') { onUpdate({ label: textCache.label }); (e.currentTarget as HTMLElement).blur(); } }} />
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_value')}</label>
        <input className="input" type="text" value={textCache.value}
          onInput={(e) => { textCache.value = (e.currentTarget as HTMLInputElement).value; }}
          onBlur={() => onUpdate({ value: textCache.value })}
          onKeyDown={(e) => { if (e.key === 'Escape') { onUpdate({ value: textCache.value }); (e.currentTarget as HTMLElement).blur(); } }} />
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_placeholder')}</label>
        <input className="input" type="text" value={textCache.placeholder}
          onInput={(e) => { textCache.placeholder = (e.currentTarget as HTMLInputElement).value; }}
          onBlur={() => onUpdate({ placeholder: textCache.placeholder })}
          onKeyDown={(e) => { if (e.key === 'Escape') { onUpdate({ placeholder: textCache.placeholder }); (e.currentTarget as HTMLElement).blur(); } }} />
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_hint')}</label>
        <input className="input" type="text" value={textCache.hint}
          onInput={(e) => { textCache.hint = (e.currentTarget as HTMLInputElement).value; }}
          onBlur={() => onUpdate({ hint: textCache.hint })}
          onKeyDown={(e) => { if (e.key === 'Escape') { onUpdate({ hint: textCache.hint }); (e.currentTarget as HTMLElement).blur(); } }} />
      </div>

      <div className="designer-prop-row">
        <label className="check-line">
          <input type="checkbox" checked={field.required ?? false}
            onChange={(e) => onUpdate({ required: (e.currentTarget as HTMLInputElement).checked })} />
          {t('txt_designer_prop_required')}
        </label>
      </div>

      <div className="designer-prop-row">
        <label className="check-line">
          <input type="checkbox" checked={field.disabled ?? false}
            onChange={(e) => onUpdate({ disabled: (e.currentTarget as HTMLInputElement).checked })} />
          {t('txt_designer_prop_disabled')}
        </label>
      </div>

      {field.type === 'button' && (
        <div className="designer-prop-row">
          <label>{t('txt_designer_prop_btn_style')}</label>
          <select className="input" value={field.variant ?? 'secondary'}
            onChange={(e) => onUpdate({ variant: (e.currentTarget as HTMLSelectElement).value as 'primary' | 'secondary' | 'danger' })}>
            <option value="primary">{t('txt_designer_variant_primary')}</option>
            <option value="secondary">{t('txt_designer_variant_secondary')}</option>
            <option value="danger">{t('txt_designer_variant_danger')}</option>
          </select>
        </div>
      )}

      {field.type === 'select' && (
        <div className="designer-prop-row">
          <label>{t('txt_designer_prop_options')}</label>
          <textarea className="input textarea" style={{ minHeight: '80px' }}
            value={(field.options ?? []).map(o => `${o.label}=${o.value}`).join('\n')}
            placeholder={t('txt_designer_options_example')}
            onInput={(e) => {
              const lines = (e.currentTarget as HTMLTextAreaElement).value.split('\n').filter(Boolean);
              const options = lines.map(line => {
                const [label, value] = line.split('=');
                return { label: label.trim(), value: (value ?? label).trim() };
              });
              onUpdate({ options });
            }} />
        </div>
      )}

      {field.type === 'link' && (
        <div className="designer-prop-row">
          <label>{t('txt_designer_prop_href')}</label>
          <input className="input" type="url" value={field.href ?? ''}
            onInput={(e) => onUpdate({ href: (e.currentTarget as HTMLInputElement).value })} />
        </div>
      )}

      {field.type === 'number' && (
        <>
          <div className="designer-prop-row">
            <label>{t('txt_designer_prop_min')}</label>
            <input className="input" type="number" value={field.min ?? ''}
              onInput={(e) => onUpdate({ min: Number((e.currentTarget as HTMLInputElement).value) || undefined })} />
          </div>
          <div className="designer-prop-row">
            <label>{t('txt_designer_prop_max')}</label>
            <input className="input" type="number" value={field.max ?? ''}
              onInput={(e) => onUpdate({ max: Number((e.currentTarget as HTMLInputElement).value) || undefined })} />
          </div>
        </>
      )}
    </div>
  );
}

// ── Card Properties Panel ──

interface CardPropertiesProps {
  card: DynamicCardSchema;
  onUpdate: (patch: Partial<DynamicCardSchema>) => void;
  onRemove?: () => void;
}

function CardProperties({ card, onUpdate, onRemove }: CardPropertiesProps) {
  const prevCardKey = useRef(card.key);
  const prevCardTexts = useRef({ title: card.title, description: card.description ?? '' });
  const textCache: Record<string, string> = { ...prevCardTexts.current };

  useEffect(() => {
    const texts = { title: card.title, description: card.description ?? '' };
    if (card.key !== prevCardKey.current || texts.title !== prevCardTexts.current.title || texts.description !== prevCardTexts.current.description) {
      prevCardKey.current = card.key;
      Object.assign(prevCardTexts.current, texts);
      Object.assign(textCache, texts);
    }
  });

  return (
    <div className="designer-props-panel">
      <div className="designer-props-header">
        <span>{t('txt_designer_card_props')}</span>
        {onRemove && (
          <button type="button" className="designer-icon-btn danger" onClick={onRemove} title={t('txt_designer_delete_card')}>
            <Trash2 size={13} />
          </button>
        )}
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_title')}</label>
        <input className="input" type="text" value={textCache.title}
          onInput={(e) => { textCache.title = (e.currentTarget as HTMLInputElement).value; }}
          onBlur={() => onUpdate({ title: textCache.title })}
          onKeyDown={(e) => { if (e.key === 'Escape') { onUpdate({ title: textCache.title }); (e.currentTarget as HTMLElement).blur(); } }} />
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_desc')}</label>
        <input className="input" type="text" value={textCache.description}
          onInput={(e) => { textCache.description = (e.currentTarget as HTMLInputElement).value; }}
          onBlur={() => onUpdate({ description: textCache.description })}
          onKeyDown={(e) => { if (e.key === 'Escape') { onUpdate({ description: textCache.description }); (e.currentTarget as HTMLElement).blur(); } }} />
      </div>

      <div className="designer-prop-row">
        <label>{t('txt_designer_prop_style')}</label>
        <select className="input" value={card.variant ?? 'default'}
          onChange={(e) => onUpdate({ variant: (e.currentTarget as HTMLSelectElement).value as 'default' | 'accent' | 'warning' })}>
          <option value="default">{t('txt_designer_style_default')}</option>
          <option value="accent">{t('txt_designer_style_accent')}</option>
          <option value="warning">{t('txt_designer_style_warning')}</option>
        </select>
      </div>

      <div className="designer-prop-row">
        <label className="check-line">
          <input type="checkbox" checked={card.collapsed ?? false}
            onChange={(e) => onUpdate({ collapsed: (e.currentTarget as HTMLInputElement).checked })} />
          {t('txt_designer_prop_collapsed')}
        </label>
      </div>

      <div className="designer-prop-row">
        <label className="check-line">
          <input type="checkbox" checked={card.titleEditable ?? false}
            onChange={(e) => onUpdate({ titleEditable: (e.currentTarget as HTMLInputElement).checked })} />
          {t('txt_designer_prop_title_editable')}
        </label>
      </div>

      <div className="designer-prop-stats">
        <span>{t('txt_designer_prop_field_count', { count: String(card.fields?.length ?? 0) })}</span>
        <span>{t('txt_designer_prop_child_count', { count: String(card.children?.length ?? 0) })}</span>
      </div>
    </div>
  );
}

// ── Tree manipulation helpers ──

function addToCard(root: DynamicCardSchema, cardKey: string, field: DynamicFieldSchema): DynamicCardSchema {
  if (root.key === cardKey) {
    return { ...root, fields: [...(root.fields ?? []), field] };
  }
  return { ...root, children: root.children?.map(c => addToCard(c, cardKey, field)) };
}

function addToCardChildren(root: DynamicCardSchema, parentKey: string, child: DynamicCardSchema): DynamicCardSchema {
  if (root.key === parentKey) {
    return { ...root, children: [...(root.children ?? []), child] };
  }
  return { ...root, children: root.children?.map(c => addToCardChildren(c, parentKey, child)) };
}

function removeFromCard(root: DynamicCardSchema, cardKey: string, fieldKey: string): DynamicCardSchema {
  if (root.key === cardKey) {
    return { ...root, fields: (root.fields ?? []).filter(f => f.key !== fieldKey) };
  }
  return { ...root, children: root.children?.map(c => removeFromCard(c, cardKey, fieldKey)) };
}

function removeCardRecursive(root: DynamicCardSchema, cardKey: string): DynamicCardSchema {
  return {
    ...root,
    children: (root.children ?? []).filter(c => c.key !== cardKey).map(c => removeCardRecursive(c, cardKey)),
  };
}

function updateFieldInCard(root: DynamicCardSchema, cardKey: string, fieldKey: string, patch: Partial<DynamicFieldSchema>): DynamicCardSchema {
  if (root.key === cardKey) {
    return { ...root, fields: (root.fields ?? []).map(f => f.key === fieldKey ? { ...f, ...patch } : f) };
  }
  return { ...root, children: root.children?.map(c => updateFieldInCard(c, cardKey, fieldKey, patch)) };
}

function updateCardRecursive(root: DynamicCardSchema, cardKey: string, patch: Partial<DynamicCardSchema>): DynamicCardSchema {
  if (root.key === cardKey) {
    return { ...root, ...patch };
  }
  return { ...root, children: root.children?.map(c => updateCardRecursive(c, cardKey, patch)) };
}

function insertAfterField(root: DynamicCardSchema, cardKey: string, afterFieldKey: string, newField: DynamicFieldSchema): DynamicCardSchema {
  if (root.key === cardKey) {
    const fields = [...(root.fields ?? [])];
    const idx = fields.findIndex(f => f.key === afterFieldKey);
    fields.splice(idx + 1, 0, newField);
    return { ...root, fields };
  }
  return { ...root, children: root.children?.map(c => insertAfterField(c, cardKey, afterFieldKey, newField)) };
}

function reorderFieldsInCard(root: DynamicCardSchema, cardKey: string, fromIndex: number, toIndex: number): DynamicCardSchema {
  if (root.key === cardKey) {
    const fields = [...(root.fields ?? [])];
    const [moved] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, moved);
    return { ...root, fields };
  }
  return { ...root, children: root.children?.map(c => reorderFieldsInCard(c, cardKey, fromIndex, toIndex)) };
}

function findField(root: DynamicCardSchema, fieldKey: string): { field: DynamicFieldSchema; cardKey: string } | null {
  for (const f of root.fields ?? []) {
    if (f.key === fieldKey) return { field: f, cardKey: root.key };
  }
  for (const child of root.children ?? []) {
    const found = findField(child, fieldKey);
    if (found) return found;
  }
  return null;
}

function findCard(root: DynamicCardSchema, cardKey: string): DynamicCardSchema | null {
  if (root.key === cardKey) return root;
  for (const child of root.children ?? []) {
    const found = findCard(child, cardKey);
    if (found) return found;
  }
  return null;
}
