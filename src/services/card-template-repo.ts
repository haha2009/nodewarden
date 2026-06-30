import type { CardTypeConfig, DynamicCardSchema } from '../types/index';

const BOOL_FROM_DB = (v: number | null): boolean => !!v;

export async function getAllCardTemplates(db: D1Database): Promise<CardTypeConfig[]> {
  const rows = await db.prepare('SELECT * FROM card_templates ORDER BY order_num ASC').all<{
    key: string;
    title: string;
    enabled: number;
    order_num: number;
    schema_json: string;
  }>();
  return (rows.results || []).map((r) => ({
    key: r.key,
    title: r.title,
    enabled: BOOL_FROM_DB(r.enabled),
    order: r.order_num,
    schema: safeParseSchema(r.schema_json),
  }));
}

export async function getEnabledCardTemplates(db: D1Database): Promise<CardTypeConfig[]> {
  const rows = await db.prepare('SELECT * FROM card_templates WHERE enabled = 1 ORDER BY order_num ASC').all<{
    key: string;
    title: string;
    enabled: number;
    order_num: number;
    schema_json: string;
  }>();
  return (rows.results || []).map((r) => ({
    key: r.key,
    title: r.title,
    enabled: true,
    order: r.order_num,
    schema: safeParseSchema(r.schema_json),
  }));
}

export async function upsertCardTemplate(db: D1Database, config: {
  key: string;
  title: string;
  order: number;
  enabled: boolean;
  schema: DynamicCardSchema;
}): Promise<void> {
  const schemaJson = JSON.stringify(config.schema);
  await db.prepare(
    `INSERT INTO card_templates (key, title, order_num, enabled, schema_json, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET
       title = excluded.title,
       order_num = excluded.order_num,
       enabled = excluded.enabled,
       schema_json = excluded.schema_json,
       updated_at = excluded.updated_at`
  ).bind(config.key, config.title, config.order, config.enabled ? 1 : 0, schemaJson).run();
}

export async function deleteCardTemplate(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM card_templates WHERE key = ?').bind(key).run();
}

function safeParseSchema(json: string): DynamicCardSchema {
  try {
    return JSON.parse(json) as DynamicCardSchema;
  } catch {
    return { key: 'error', title: 'Corrupted template', fields: [] };
  }
}
