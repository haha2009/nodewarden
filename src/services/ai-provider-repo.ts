import type { D1Database } from '@cloudflare/workers-types';
import type { AIProvider } from '../types/index';

function rowToProvider(row: Record<string, unknown>): AIProvider {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    name: row.name as string,
    providerType: row.provider_type as string,
    modelName: row.model_name as string,
    baseUrl: (row.base_url as string) || null,
    isDefault: (row.is_default as number) === 1,
    isActive: (row.is_active as number) === 1,
    apiKeyEnc: (row.api_key_enc as string) || '',
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAIProvidersByUser(db: D1Database, userId: string): Promise<AIProvider[]> {
  const result = await db
    .prepare('SELECT * FROM ai_providers WHERE user_id = ? ORDER BY created_at ASC')
    .bind(userId)
    .all();
  return (result.results || []).map(rowToProvider);
}

export async function getDefaultAIProvider(db: D1Database, userId: string): Promise<AIProvider | null> {
  const row = await db
    .prepare('SELECT * FROM ai_providers WHERE user_id = ? AND is_default = 1 LIMIT 1')
    .bind(userId)
    .first<Record<string, unknown>>();
  return row ? rowToProvider(row) : null;
}

export async function upsertAIProvider(db: D1Database, provider: AIProvider): Promise<void> {
  const now = new Date().toISOString();
  if (provider.isDefault) {
    await db
      .prepare('UPDATE ai_providers SET is_default = 0 WHERE user_id = ?')
      .bind(provider.userId)
      .run();
  }
  await db
    .prepare(
      'INSERT INTO ai_providers (id, user_id, name, provider_type, api_key_enc, model_name, base_url, is_default, is_active, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ' +
      'ON CONFLICT(id) DO UPDATE SET ' +
      'name = excluded.name, provider_type = excluded.provider_type, api_key_enc = excluded.api_key_enc, ' +
      'model_name = excluded.model_name, base_url = excluded.base_url, ' +
      'is_default = excluded.is_default, is_active = excluded.is_active, updated_at = excluded.updated_at'
    )
    .bind(
      provider.id, provider.userId, provider.name, provider.providerType,
      provider.apiKeyEnc, provider.modelName, provider.baseUrl,
      provider.isDefault ? 1 : 0, provider.isActive ? 1 : 0,
      now, now
    )
    .run();
}

export async function deleteAIProvider(db: D1Database, id: string, userId: string): Promise<void> {
  const row = await db
    .prepare('SELECT is_default FROM ai_providers WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .first<{ is_default: number }>();

  await db
    .prepare('DELETE FROM ai_providers WHERE id = ? AND user_id = ?')
    .bind(id, userId)
    .run();

  if (row && row.is_default === 1) {
    const next = await db
      .prepare('SELECT id FROM ai_providers WHERE user_id = ? ORDER BY created_at ASC LIMIT 1')
      .bind(userId)
      .first<{ id: string }>();
    if (next) {
      await db
        .prepare('UPDATE ai_providers SET is_default = 1 WHERE id = ?')
        .bind(next.id)
        .run();
    }
  }
}
