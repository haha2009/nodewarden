import { jsonResponse, errorResponse } from '../utils/response';
import type { DynamicCardSchema, DynamicFieldSchema, DynamicFieldType } from '../types';

interface Env {
  DB: D1Database;
  [key: string]: any;
}

const ALLOWED_FIELD_TYPES = new Set<DynamicFieldType>([
  'text', 'password', 'textarea', 'markdown', 'toggle', 'button',
  'upload', 'select', 'number', 'email', 'phone', 'url', 'date', 'color', 'link',
]);

export async function handleGetDynamicSchema(request: Request, env: Env, userId: string, cipherId: string): Promise<Response> {
  const row = await env.DB
    .prepare('SELECT dynamic_schema FROM ciphers WHERE id = ? AND user_id = ?')
    .bind(cipherId, userId)
    .first<{ dynamic_schema: string | null }>();

  if (!row) return errorResponse('Cipher not found', 404);

  if (!row.dynamic_schema) {
    return jsonResponse({ dynamicSchema: null, cipherId });
  }

  let schema: DynamicCardSchema;
  try {
    schema = JSON.parse(row.dynamic_schema);
  } catch {
    return errorResponse('Invalid stored schema', 500);
  }

  return jsonResponse({ dynamicSchema: schema, cipherId });
}

export async function handlePutDynamicSchema(request: Request, env: Env, userId: string, cipherId: string): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const schema = body.dynamicSchema ?? body.schema;
  if (!schema || typeof schema !== 'object') {
    return errorResponse('dynamicSchema is required', 400);
  }

  const validation = validateSchema(schema);
  if (!validation.valid) {
    return jsonResponse({ valid: false, errors: validation.errors }, 400);
  }

  const schemaJson = JSON.stringify(schema);
  const now = new Date().toISOString();
  const stmt = env.DB.prepare(
    "INSERT OR IGNORE INTO ciphers(id, user_id, type, name, notes, favorite, dynamic_schema, created_at, updated_at) " +
    "VALUES(?, ?, 1, '', '', 0, ?, ?, ?)"
  );
  await env.DB.batch([
    stmt.bind(cipherId, userId, schemaJson, now, now),
    env.DB.prepare("UPDATE ciphers SET dynamic_schema = ?, updated_at = ? WHERE id = ?").bind(schemaJson, now, cipherId),
  ]);

  return jsonResponse({ dynamicSchema: schema, cipherId });
}

export async function handleValidateDynamicSchema(request: Request, _env: Env, _userId: string, cipherId: string): Promise<Response> {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  const schema = body.dynamicSchema ?? body.schema;
  if (!schema || typeof schema !== 'object') {
    return jsonResponse({ valid: false, errors: [{ path: '', message: 'dynamicSchema is required' }] });
  }

  const validation = validateSchema(schema);
  return jsonResponse(validation);
}

function validateSchema(schema: any): { valid: boolean; errors: { path: string; message: string }[] } {
  const errors: { path: string; message: string }[] = [];

  if (!schema || typeof schema !== 'object') {
    return { valid: false, errors: [{ path: '', message: 'Schema must be an object' }] };
  }

  if (typeof schema.key !== 'string' || !schema.key) {
    errors.push({ path: 'key', message: 'key is required and must be a non-empty string' });
  }

  if (typeof schema.title !== 'string') {
    errors.push({ path: 'title', message: 'title is required and must be a string' });
  }

  if (schema.variant && !['default', 'accent', 'warning'].includes(schema.variant)) {
    errors.push({ path: 'variant', message: 'variant must be one of: default, accent, warning' });
  }

  if (typeof schema.collapsed !== 'undefined' && typeof schema.collapsed !== 'boolean') {
    errors.push({ path: 'collapsed', message: 'collapsed must be a boolean' });
  }

  if (schema.children && !Array.isArray(schema.children)) {
    errors.push({ path: 'children', message: 'children must be an array' });
  }

  if (schema.fields && !Array.isArray(schema.fields)) {
    errors.push({ path: 'fields', message: 'fields must be an array' });
  }

  // Validate fields
  const fieldKeys = new Set<string>();
  if (Array.isArray(schema.fields)) {
    for (let i = 0; i < schema.fields.length; i++) {
      const field = schema.fields[i];
      validateField(field, `fields[${i}]`, errors, fieldKeys);
    }
  }

  // Validate nested children
  if (Array.isArray(schema.children)) {
    validateChildren(schema.children, 'children', errors, new Set(fieldKeys));
  }

  return { valid: errors.length === 0, errors };
}

function validateChildren(children: any[], path: string, errors: { path: string; message: string }[], parentFieldKeys: Set<string>): void {
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childPath = `${path}[${i}]`;

    if (!child || typeof child !== 'object') {
      errors.push({ path: childPath, message: 'Each child must be an object' });
      continue;
    }

    if (typeof child.key !== 'string' || !child.key) {
      errors.push({ path: `${childPath}.key`, message: 'key is required and must be a non-empty string' });
    }

    if (typeof child.title !== 'string') {
      errors.push({ path: `${childPath}.title`, message: 'title is required and must be a string' });
    }

    if (child.variant && !['default', 'accent', 'warning'].includes(child.variant)) {
      errors.push({ path: `${childPath}.variant`, message: 'variant must be one of: default, accent, warning' });
    }

    const fieldKeys = new Set(parentFieldKeys);
    if (Array.isArray(child.fields)) {
      for (let j = 0; j < child.fields.length; j++) {
        validateField(child.fields[j], `${childPath}.fields[${j}]`, errors, fieldKeys);
      }
    }

    if (Array.isArray(child.children)) {
      validateChildren(child.children, `${childPath}.children`, errors, fieldKeys);
    }
  }
}

function validateField(field: any, path: string, errors: { path: string; message: string }[], fieldKeys: Set<string>): void {
  if (!field || typeof field !== 'object') {
    errors.push({ path, message: 'Each field must be an object' });
    return;
  }

  if (typeof field.key !== 'string' || !field.key) {
    errors.push({ path: `${path}.key`, message: 'key is required and must be a non-empty string' });
  } else if (fieldKeys.has(field.key)) {
    errors.push({ path: `${path}.key`, message: `Duplicate field key: ${field.key}` });
  } else {
    fieldKeys.add(field.key);
  }

  if (!ALLOWED_FIELD_TYPES.has(field.type)) {
    errors.push({ path: `${path}.type`, message: `Invalid field type: ${field.type}` });
  }

  if (typeof field.label !== 'string' || !field.label.trim()) {
    errors.push({ path: `${path}.label`, message: 'label is required and must be a non-empty string' });
  }

  if (field.type === 'select') {
    if (!Array.isArray(field.options) || field.options.length === 0) {
      errors.push({ path: `${path}.options`, message: 'select type requires a non-empty options array' });
    }
    for (let i = 0; i < (field.options?.length ?? 0); i++) {
      const opt = field.options[i];
      if (!opt || typeof opt.label !== 'string' || typeof opt.value !== 'string') {
        errors.push({ path: `${path}.options[${i}]`, message: 'Each option must have label (string) and value (string)' });
      }
    }
  }

  if (field.type === 'link' && field.href) {
    try {
      new URL(field.href);
    } catch {
      errors.push({ path: `${path}.href`, message: 'href must be a valid URL' });
    }
  }

  if (field.type === 'number') {
    if (field.min !== undefined && typeof field.min !== 'number') {
      errors.push({ path: `${path}.min`, message: 'min must be a number' });
    }
    if (field.max !== undefined && typeof field.max !== 'number') {
      errors.push({ path: `${path}.max`, message: 'max must be a number' });
    }
    if (field.min !== undefined && field.max !== undefined && field.min > field.max) {
      errors.push({ path: `${path}.max`, message: 'max must be greater than or equal to min' });
    }
  }
}
