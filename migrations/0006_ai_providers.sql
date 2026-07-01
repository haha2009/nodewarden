CREATE TABLE IF NOT EXISTS ai_providers (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL DEFAULT 'custom',
  api_key_enc TEXT NOT NULL,
  model_name TEXT NOT NULL,
  base_url TEXT,
  is_default INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_providers_user ON ai_providers(user_id);
