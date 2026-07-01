import { jsonResponse, errorResponse } from '../utils/response';
import type { Env } from '../types';

export async function handleFetchMeta(request: Request, _env: Env, _userId: string): Promise<Response> {
  const body = await request.json() as { url: string };
  const url = String(body.url || '').trim();
  if (!url) return errorResponse('URL required', 400);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'NodeWarden/1.0' },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const html = await res.text();

    const descMatch = html.match(/<meta\s+(?:name|property)="(?:description|og:description)"\s+content="([^"]+)"/i);
    const description = descMatch ? descMatch[1] : '';
    return jsonResponse({ description });
  } catch {
    return jsonResponse({ description: '' });
  }
}
