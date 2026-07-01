import { jsonResponse, errorResponse } from '../utils/response';
import type { AIProvider } from '../types/index';
import type { Env } from '../types';
import { getAIProvidersByUser, upsertAIProvider, deleteAIProvider } from '../services/ai-provider-repo';

// ── Encryption helpers (AES-GCM, key derived from JWT_SECRET) ──

async function deriveEncKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(secret), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('ai-provider-key-v1'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptApiKey(plaintext: string, secret: string): Promise<string> {
  const key = await deriveEncKey(secret);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  let binary = '';
  for (const b of combined) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function decryptApiKey(encoded: string, secret: string): Promise<string> {
  const key = await deriveEncKey(secret);
  const combined = new Uint8Array(atob(encoded).split('').map(c => c.charCodeAt(0)));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// ── Handlers ──

export async function handleGetAIProviders(env: Env, userId: string): Promise<Response> {
  const providers = await getAIProvidersByUser(env.DB, userId);
  const safe = providers.map((p) => ({
    id: p.id, userId: p.userId, name: p.name, providerType: p.providerType,
    modelName: p.modelName, baseUrl: p.baseUrl,
    isDefault: p.isDefault, isActive: p.isActive,
    createdAt: p.createdAt, updatedAt: p.updatedAt,
  }));
  return jsonResponse({ data: safe });
}

export async function handleCreateAIProvider(request: Request, env: Env, userId: string): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const name = String(body.name || '').trim();
  const providerType = String(body.providerType || 'custom').trim();
  const modelName = String(body.modelName || '').trim();
  const apiKey = String(body.apiKey || '').trim();
  const baseUrl = body.baseUrl ? String(body.baseUrl).trim() : null;
  const isDefault = body.isDefault === true;

  if (!name || !apiKey || !modelName) {
    return errorResponse('Name, API key and model are required', 400);
  }

  const apiKeyEnc = await encryptApiKey(apiKey, env.JWT_SECRET);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const provider: AIProvider = {
    id, userId, name, providerType, modelName,
    baseUrl, isDefault, isActive: true,
    apiKeyEnc,
    createdAt: now, updatedAt: now,
  };

  await upsertAIProvider(env.DB, provider);
  return jsonResponse({ ...provider }, 201);
}

export async function handleUpdateAIProvider(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const body = await request.json() as Record<string, unknown>;
  const existing = await getAIProvidersByUser(env.DB, userId);
  const current = existing.find(p => p.id === id);
  if (!current) return errorResponse('Provider not found', 404);

  const name = body.name !== undefined ? String(body.name).trim() : current.name;
  const providerType = body.providerType !== undefined ? String(body.providerType).trim() : current.providerType;
  const modelName = body.modelName !== undefined ? String(body.modelName).trim() : current.modelName;
  const baseUrl = body.baseUrl !== undefined ? (String(body.baseUrl).trim() || null) : current.baseUrl;
  const isDefault = body.isDefault !== undefined ? body.isDefault === true : current.isDefault;
  const isActive = body.isActive !== undefined ? body.isActive === true : current.isActive;

  let apiKeyEnc: string | null = null;
  if (body.apiKey && String(body.apiKey).trim()) {
    apiKeyEnc = await encryptApiKey(String(body.apiKey).trim(), env.JWT_SECRET);
  }

  const now = new Date().toISOString();

  await upsertAIProvider(env.DB, {
    id, userId, name, providerType, modelName,
    baseUrl, isDefault, isActive,
    apiKeyEnc: apiKeyEnc || current.apiKeyEnc,
    createdAt: current.createdAt, updatedAt: now,
  });

  return jsonResponse({ success: true });
}

export async function handleDeleteAIProvider(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  await deleteAIProvider(env.DB, id, userId);
  return jsonResponse({ success: true });
}

export async function handleTestAIProvider(request: Request, env: Env, userId: string, id: string): Promise<Response> {
  const debugLog: string[] = [];
  const log = (msg: string) => { debugLog.push(`[${new Date().toISOString()}] ${msg}`); };

  try {
    const providers = await getAIProvidersByUser(env.DB, userId);
    const provider = providers.find(p => p.id === id);
    if (!provider) return errorResponse('Provider not found', 404);

    if (!provider.apiKeyEnc) {
      log('No API key configured');
      return jsonResponse({ success: false, message: 'API key not configured', log: debugLog });
    }

    const apiKey = await decryptApiKey(provider.apiKeyEnc, env.JWT_SECRET);
    const baseUrl = (provider.baseUrl || '').replace(/\/+$/, '') || 'https://api.openai.com/v1';
    log(`Provider: ${provider.name}, Type: ${provider.providerType}, BaseURL: ${baseUrl}, Model: ${provider.modelName}`);

    let endpoint: string;
    let headers: Record<string, string>;
    let body: Record<string, unknown>;

    if (provider.providerType === 'anthropic') {
      endpoint = `${baseUrl}/messages`;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      body = {
        model: provider.modelName,
        max_tokens: 1,
        messages: [{ role: 'user', content: 'hi' }],
      };
      log(`Anthropic: POST ${endpoint}`);
    } else if (provider.providerType === 'google') {
      endpoint = `${baseUrl}/models/${provider.modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
      headers = { 'Content-Type': 'application/json' };
      body = {
        contents: [{ parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 1 },
      };
      log(`Google: POST ${endpoint}`);
    } else {
      endpoint = `${baseUrl}/chat/completions`;
      headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };
      body = {
        model: provider.modelName,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      };
      log(`${provider.providerType}: POST ${endpoint}`);
    }

    log(`Request body: ${JSON.stringify(body)}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    log('Sending request (timeout: 30s)...');
    const res = await fetch(endpoint, {
      method: 'POST',
      signal: controller.signal,
      headers,
      body: JSON.stringify(body),
    });
    clearTimeout(timeoutId);

    log(`Response: HTTP ${res.status} ${res.statusText}`);
    const resText = await res.text().catch(() => '(empty)');
    log(`Response body: ${resText.slice(0, 500)}`);

    if (res.ok) {
      log('Connection test PASSED');
      return jsonResponse({ success: true, message: 'Connected', model: provider.modelName, log: debugLog });
    }

    let errMsg = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errData = JSON.parse(resText);
      if (errData.error?.message) errMsg = errData.error.message;
      else if (errData.error?.type) errMsg = `${errData.error.type}: ${errData.error.message || ''}`;
      else if (typeof errData === 'string') errMsg = errData;
    } catch { /* use raw text */ }
    log(`Connection test FAILED: ${errMsg}`);
    return jsonResponse({ success: false, message: errMsg, log: debugLog }, 200);
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      log('Request timeout (30s)');
      return jsonResponse({ success: false, message: 'Request timeout (30s)', log: debugLog }, 200);
    }
    log(`Exception: ${e instanceof Error ? e.message : 'unknown error'}`);
    return jsonResponse({ success: false, message: e instanceof Error ? e.message : 'Error', log: debugLog }, 200);
  }
}
