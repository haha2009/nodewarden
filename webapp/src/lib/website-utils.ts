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

function isPrivateHost(host: string): boolean {
  if (host === 'localhost' || host === '0.0.0.0') return true;
  if (/^127\./.test(host)) return true;
  if (/^10\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
  if (/^192\.168\./.test(host)) return true;
  if (host === '::1' || host === '[::1]') return true;
  return false;
}

export function websiteIconUrl(host: string, uri?: string): string {
  if (isPrivateHost(host)) {
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
