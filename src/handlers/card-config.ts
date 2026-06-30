import { jsonResponse, errorResponse } from '../utils/response';
import type { CardTypeConfig, DynamicCardSchema } from '../types/index';
import { getAllCardTemplates, upsertCardTemplate, deleteCardTemplate } from '../services/card-template-repo';
import type { Env, User } from '../types';
import { validateSchema } from '../handlers/dynamic-cards';

function isAdmin(user: User): boolean {
  return user.role === 'admin';
}

export async function handleGetCardTemplates(env: Env): Promise<Response> {
  const templates = await getAllCardTemplates(env.DB);
  return jsonResponse({ cardTypes: templates });
}

export async function handleUpsertCardTemplate(request: Request, env: Env, user: User): Promise<Response> {
  if (!isAdmin(user)) return errorResponse('Forbidden', 403);

  const body = await request.json<DynamicCardSchema & { title?: string; order?: number; enabled?: boolean }>();
  if (!body.key || !body.title) return errorResponse('key and title required', 400);

  const schema: DynamicCardSchema = {
    key: body.key,
    title: body.title,
    description: body.description,
    fields: body.fields,
    children: body.children,
    collapsed: body.collapsed,
    variant: body.variant,
    titleEditable: body.titleEditable,
  };

  const validation = validateSchema(schema);
  if (!validation.valid) {
    return jsonResponse({ valid: false, errors: validation.errors }, 400);
  }

  const config: CardTypeConfig = {
    key: body.key,
    title: body.title,
    order: body.order ?? 0,
    enabled: body.enabled ?? true,
    schema,
  };

  await upsertCardTemplate(env.DB, config);
  return jsonResponse({ ok: true });
}

export async function handleDeleteCardTemplate(request: Request, env: Env, user: User, key: string): Promise<Response> {
  if (!isAdmin(user)) return errorResponse('Forbidden', 403);
  await deleteCardTemplate(env.DB, key);
  return jsonResponse({ ok: true });
}
