import type { Cipher } from './types';

export function firstCipherUri(cipher: Cipher): string {
  const uris = cipher.login?.uris || [];
  for (const uri of uris) {
    const raw = uri.decUri || uri.uri || '';
    if (raw.trim()) return raw.trim();
  }
  return '';
}

export function hostFromUri(uri: string): string {
  if (!uri.trim()) return '';
  try {
    const normalized = /^https?:\/\//i.test(uri) ? uri : `https://${uri}`;
    return new URL(normalized).hostname || '';
  } catch {
    return '';
  }
}

export function websiteIconUrl(host: string, uri?: string): string {
  if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0') {
    const origin = uri ? originFromUri(uri) : `http://${host}`;
    return `${origin}/favicon.ico`;
  }
  return `/icons/${encodeURIComponent(host)}/icon.png?fallback=404`;
}

export function originFromUri(uri: string): string {
  if (!uri.trim()) return '';
  try {
    const normalized = /^https?:\/\//i.test(uri) ? uri : `https://${uri}`;
    return new URL(normalized).origin;
  } catch {
    return '';
  }
}
