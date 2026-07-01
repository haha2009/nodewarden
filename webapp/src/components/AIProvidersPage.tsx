import { useState, useEffect } from 'preact/hooks';
import { Plus, Trash2, Wifi, WifiOff, Settings2, Sparkles, Loader2, X, Check, RefreshCw } from 'lucide-preact';
import type { AuthedFetch } from '@/lib/api/shared';
import { FloatingFieldset } from '@/components/FloatingFieldset';
import { FloatingLabelInput } from '@/components/FloatingLabelInput';
import ConfirmDialog from '@/components/ConfirmDialog';
import { t } from '@/lib/i18n';

interface AIProviderView {
  id: string;
  name: string;
  providerType: string;
  modelName: string;
  baseUrl: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PRESET_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
  google: 'https://generativelanguage.googleapis.com/v1beta',
  mistral: 'https://api.mistral.ai/v1',
  custom: '',
};

interface AIProvidersPageProps {
  authedFetch: AuthedFetch;
}

export default function AIProvidersPage(props: AIProvidersPageProps) {
  const { authedFetch } = props;
  const [providers, setProviders] = useState<AIProviderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [debugOpen, setDebugOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '', providerType: 'openai', baseUrl: PRESET_URLS.openai,
    modelName: '', apiKey: '', isDefault: false,
  });
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const loadProviders = async () => {
    setLoading(true);
    try {
      const res = await authedFetch('/api/settings/ai-providers');
      const data = await res.json() as { data: AIProviderView[] };
      setProviders(data.data || []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadProviders(); }, []);

  const openAddDialog = () => {
    setEditingId(null);
    setFormData({ name: '', providerType: 'openai', baseUrl: PRESET_URLS.openai, modelName: '', apiKey: '', isDefault: false });
    setTestResult(null);
    setJsonText('');
    setJsonError('');
    setDebugLog([]);
    setDebugOpen(false);
    setDialogOpen(true);
  };

  const openEditDialog = (p: AIProviderView) => {
    setEditingId(p.id);
    setFormData({ name: p.name, providerType: p.providerType, baseUrl: p.baseUrl || PRESET_URLS[p.providerType] || '', modelName: p.modelName, apiKey: '', isDefault: p.isDefault });
    setTestResult(null);
    setJsonText('');
    setJsonError('');
    setDebugLog([]);
    setDebugOpen(false);
    setDialogOpen(true);
  };

  const addDebugLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setDebugLog(prev => [...prev, `[${ts}] ${msg}`]);
  };

  const copyDebugLog = async () => {
    try {
      await navigator.clipboard.writeText(debugLog.join('\n'));
    } catch { /* ignore */ }
  };

  const clearDebugLog = () => setDebugLog([]);

  const handleTypeChange = (type: string) => {
    setFormData({ ...formData, providerType: type, baseUrl: PRESET_URLS[type] || '' });
  };

  const parseJsonConfig = (text: string) => {
    try {
      const json = JSON.parse(text);
      const env = json.env || json;

      // Match keys by provider type — check the right env vars first
      const detectedType = (() => {
        if (Object.keys(env).some(k => k.startsWith('ANTHROPIC_') || k.startsWith('CLAUDE_'))) return 'anthropic';
        if (Object.keys(env).some(k => k.startsWith('OPENAI_'))) return 'openai';
        if (Object.keys(env).some(k => k.startsWith('GOOGLE_') || k.startsWith('GEMINI_'))) return 'google';
        if (Object.keys(env).some(k => k.startsWith('MISTRAL_'))) return 'mistral';
        return 'custom';
      })();

      // Extract values in provider-type priority order
      const keyMap: Record<string, { url: string; key: string; model: string }> = {
        anthropic: {
          url: env.ANTHROPIC_BASE_URL || '',
          key: env.ANTHROPIC_AUTH_TOKEN || env.CLAUDE_API_KEY || env.ANTHROPIC_API_KEY || '',
          model: env.ANTHROPIC_MODEL || env.ANTHROPIC_DEFAULT_SONNET_MODEL || env.ANTHROPIC_DEFAULT_OPUS_MODEL || env.ANTHROPIC_DEFAULT_HAIKU_MODEL || env.ANTHROPIC_DEFAULT_FABLE_MODEL || '',
        },
        openai: {
          url: env.OPENAI_BASE_URL || '',
          key: env.OPENAI_API_KEY || '',
          model: env.OPENAI_MODEL || '',
        },
        google: {
          url: env.GOOGLE_BASE_URL || '',
          key: env.GOOGLE_API_KEY || env.GEMINI_API_KEY || '',
          model: env.GOOGLE_MODEL || env.GEMINI_MODEL || '',
        },
        mistral: {
          url: env.MISTRAL_BASE_URL || '',
          key: env.MISTRAL_API_KEY || '',
          model: env.MISTRAL_MODEL || '',
        },
        custom: {
          url: env.OPENAI_BASE_URL || env.ANTHROPIC_BASE_URL || env.GOOGLE_BASE_URL || env.MISTRAL_BASE_URL || '',
          key: env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY || env.GOOGLE_API_KEY || env.GEMINI_API_KEY || env.MISTRAL_API_KEY || env.ANTHROPIC_AUTH_TOKEN || '',
          model: env.OPENAI_MODEL || env.ANTHROPIC_MODEL || env.GOOGLE_MODEL || env.GEMINI_MODEL || env.MISTRAL_MODEL || '',
        },
      };
      const PRESET_URLS_FINAL: Record<string, string> = {
        openai: 'https://api.openai.com/v1',
        anthropic: 'https://api.anthropic.com/v1',
        google: 'https://generativelanguage.googleapis.com/v1beta',
        mistral: 'https://api.mistral.ai/v1',
        custom: '',
      };

      const info = keyMap[detectedType] || keyMap.custom;
      const baseUrl = info.url || PRESET_URLS_FINAL[detectedType] || '';

      // Generate name from URL hostname
      const domain = baseUrl ? new URL(baseUrl).hostname.replace(/^api\./, '').split('.')[0] : '';
      const name = domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : '';

      if ((!info.key || !info.key.trim()) && !baseUrl) {
        setJsonError(t('txt_ai_provider_json_parse_error'));
        return;
      }
      setFormData({ ...formData, name: name || formData.name, providerType: detectedType, baseUrl, apiKey: info.key, modelName: info.model });
      setJsonText('');
      setJsonError('');
    } catch {
      setJsonError(t('txt_ai_provider_json_parse_error'));
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.apiKey.trim() || !formData.modelName.trim()) {
      setTestResult({ ok: false, msg: t('txt_ai_provider_required') });
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/settings/ai-providers/${editingId}`
        : '/api/settings/ai-providers';
      const method = editingId ? 'PUT' : 'POST';
      const res = await authedFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Save failed');
      await loadProviders();
      setDialogOpen(false);
    } catch { setTestResult({ ok: false, msg: 'Save failed' }); }
    setSubmitting(false);
  };

  const handleTest = async () => {
    if (!editingId) return;
    setTesting(true);
    setTestResult(null);
    setDebugLog([]);
    try {
      addDebugLog(`POST /api/settings/ai-providers/${editingId}/test`);
      const res = await authedFetch(`/api/settings/ai-providers/${editingId}/test`, { method: 'POST' });
      addDebugLog(`HTTP ${res.status} ${res.statusText}`);
      const data = await res.json().catch(() => null);
      addDebugLog(`Response: ${JSON.stringify(data)}`);
      if (!res.ok) {
        setTestResult({ ok: false, msg: data?.error_description || data?.error || 'Request failed' });
        setDebugOpen(true);
        setTesting(false);
        return;
      }
      // Merge backend debug log into frontend log
      if (data?.log && Array.isArray(data.log)) {
        addDebugLog('--- Server log ---');
        for (const line of data.log) addDebugLog(line);
      }
      if (data?.success) {
        setTestResult({ ok: true, msg: data.message || 'Connected' });
      } else {
        setTestResult({ ok: false, msg: data?.message || data?.error_description || 'Connection failed' });
        setDebugOpen(true);
      }
    } catch (e) {
      addDebugLog(`Network error: ${e instanceof Error ? e.message : 'unknown'}`);
      setTestResult({ ok: false, msg: 'Network error' });
    }
    setTesting(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await authedFetch(`/api/settings/ai-providers/${id}`, { method: 'DELETE' });
      await loadProviders();
    } catch { /* ignore */ }
    setDeleteConfirm(null);
  };

  const providerBadge = (type: string) => {
    const colors: Record<string, string> = { openai: '#10a37f', anthropic: '#d97706', google: '#2563eb', mistral: '#dc2626' };
    return <span className="badge" style={{ background: colors[type] || '#64748b', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 700 }}>{type}</span>;
  };

  return (
    <div className="page-standard">
      <FloatingFieldset label={t('txt_ai_providers_title')}>
        {loading ? (
          <div className="detail-sub">{t('txt_loading')}</div>
        ) : providers.length === 0 ? (
          <div className="empty-state">
            <div className="detail-sub">{t('txt_ai_provider_no_providers')}</div>
            <div className="detail-sub" style={{ marginTop: 4 }}>{t('txt_ai_provider_no_providers_hint')}</div>
          </div>
        ) : (
          <div className="provider-list">
            {providers.map((p) => (
              <div key={p.id} className="card" style={{ marginBottom: 12 }}>
                <div className="flex-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ fontSize: 15, color: 'var(--text)' }}>{p.name}</strong>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                      {providerBadge(p.providerType)}
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>{p.modelName}</span>
                      {p.isDefault && <span className="badge" style={{ background: 'var(--primary)', color: '#fff', padding: '2px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', fontWeight: 700 }}>{t('txt_ai_provider_default_badge')}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <button type="button" className="btn btn-secondary small" onClick={() => openEditDialog(p)}>
                      <Settings2 size={14} className="btn-icon" />
                    </button>
                    <button type="button" className="btn btn-secondary small" onClick={() => setDeleteConfirm(p.id)}>
                      <Trash2 size={14} className="btn-icon" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="btn btn-secondary full" style={{ marginTop: 16 }} onClick={openAddDialog}>
          <Plus size={14} className="btn-icon" /> {t('txt_ai_provider_add')}
        </button>
      </FloatingFieldset>

      {dialogOpen && (
        <ConfirmDialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editingId ? t('txt_ai_provider_edit') : t('txt_ai_provider_add')} onConfirm={handleSubmit} onCancel={() => setDialogOpen(false)}>
          <div style={{ display: 'grid', gap: 16 }}>
            <FloatingLabelInput label={t('txt_ai_provider_name')} value={formData.name} onInput={(v) => setFormData({ ...formData, name: v })} />
            <label className="field">
              <span>{t('txt_ai_provider_type')}</span>
              <select className="input" value={formData.providerType} onInput={(e) => handleTypeChange((e.currentTarget as HTMLSelectElement).value)}>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="google">Google</option>
                <option value="mistral">Mistral</option>
                <option value="custom">{t('txt_custom')}</option>
              </select>
            </label>
            <FloatingLabelInput label={t('txt_ai_provider_base_url')} value={formData.baseUrl} onInput={(v) => setFormData({ ...formData, baseUrl: v })} />
            <FloatingLabelInput label={t('txt_ai_provider_model')} value={formData.modelName} onInput={(v) => setFormData({ ...formData, modelName: v })} />
            <FloatingLabelInput label={t('txt_ai_provider_api_key')} value={formData.apiKey} type="password" onInput={(v) => setFormData({ ...formData, apiKey: v })} placeholder={editingId ? '•'.repeat(20) : ''} />
            <label className="check-line">
              <input type="checkbox" checked={formData.isDefault} onInput={(e) => setFormData({ ...formData, isDefault: (e.currentTarget as HTMLInputElement).checked })} />
              {t('txt_ai_provider_set_default')}
            </label>
            {/* JSON parse section */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <label className="field">
                <span>{t('txt_ai_provider_json_paste')}</span>
                <textarea className="input textarea" value={jsonText} onInput={(e) => { setJsonText((e.currentTarget as HTMLTextAreaElement).value); setJsonError(''); }} style={{ minHeight: 60 }} />
              </label>
              <button type="button" className="btn btn-secondary small" onClick={() => parseJsonConfig(jsonText)} disabled={!jsonText.trim()}>
                <RefreshCw size={14} className="btn-icon" /> {t('txt_ai_provider_json_parse')}
              </button>
              {jsonError && <div style={{ color: 'var(--danger)', fontSize: 13, marginTop: 4 }}>{jsonError}</div>}
            </div>
            {testResult && (
              <div style={{ color: testResult.ok ? 'var(--success)' : 'var(--danger)', fontSize: 14, padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'color-mix(in srgb, ' + (testResult.ok ? 'var(--success)' : 'var(--danger)') + ' 8%, transparent)' }}>
                {testResult.ok ? <Check size={14} style={{ marginRight: 6 }} /> : <X size={14} style={{ marginRight: 6 }} />}
                {testResult.msg}
              </div>
            )}
            {/* Debug log panel */}
            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: debugLog.length > 0 ? 8 : 0 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Debug Log ({debugLog.length})</span>
                {debugLog.length > 0 && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" className="btn btn-secondary small" onClick={copyDebugLog} title="Copy log">Copy</button>
                    <button type="button" className="btn btn-ghost small" onClick={clearDebugLog}>Clear</button>
                  </div>
                )}
              </div>
              {debugLog.length > 0 && (
                <pre style={{ fontSize: 12, lineHeight: '1.6', color: 'var(--muted)', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', maxHeight: 200, overflowY: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{debugLog.join('\n')}</pre>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              {editingId && (
                <button type="button" className="btn btn-secondary small" onClick={handleTest} disabled={testing || submitting}>
                  {testing || submitting ? <Loader2 size={14} className="spinning" /> : <Wifi size={14} className="btn-icon" />}
                  {t('txt_ai_provider_test')}
                </button>
              )}
            </div>
          </div>
        </ConfirmDialog>
      )}

      {deleteConfirm && (
        <ConfirmDialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('txt_ai_provider_delete')} onConfirm={() => handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)}>
          <p style={{ margin: '12px 0', fontSize: 15, color: 'var(--text)' }}>{t('txt_ai_provider_confirm_delete')}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>{t('txt_cancel')}</button>
            <button type="button" className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>
              <Trash2 size={14} className="btn-icon" /> {t('txt_ai_provider_delete')}
            </button>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
