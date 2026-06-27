# NodeWarden — AI Agent Instructions

## Project Identity
NodeWarden 是一个运行在 Cloudflare Workers 上的 Bitwarden 兼容服务端。提供原创 Web Vault 界面（Preact + Vite + Tailwind），后端使用 Cloudflare Workers（D1 + R2 + Durable Objects）。

## Architecture
- **`src/`** — Worker 后端（请求路由/处理器/存储层/服务）
- **`webapp/src/`** — Preact 前端（组件/hooks/lib/样式）
- **`shared/`** — 前后端共享（域名规范化、版本号、备份 schema）
- **`migrations/`** — D1 数据库迁移 SQL
- **`scripts/`** — 工具脚本（i18n、域名同步、SPA 重定向）

## Key Bindings (wrangler.toml)
- `DB` → D1 数据库 `nodewarden-db`
- `ASSETS` → `./dist` 目录（SPA fallback）
- `ATTACHMENTS` → R2 存储桶
- `NOTIFICATIONS_HUB` → Durable Object（通知）
- `BACKUP_TRANSFER_RUNNER` → Durable Object（备份传输）
- Cron Trigger: `*/5 * * * *`

## Development Commands
```bash
npm run dev              # 本地开发（R2 模式）
npm run dev:kv           # 本地开发（KV 模式，替代 R2）
npm run dev:demo         # 前端 demo 模式开发
npm run build            # 构建
npm run deploy           # 部署到 Cloudflare
npm run deploy:kv        # KV 模式部署
npm run deploy:demo      # 构建并部署到 Pages
npm run i18n:validate    # 验证 i18n 翻译完整性
```

## Tech Stack
- **前端**: Preact + Preact Hooks + wouter（路由）+ @tanstack/react-query（数据请求）+ lucide-preact（图标）
- **样式**: Tailwind CSS + 自定义 CSS（按组件拆分）
- **加密**: Web Crypto API + @noble/hashes
- **后端**: Cloudflare Workers + Hono-like 路由模式 + D1 + R2 + Durable Objects
- **构建**: Vite + @preact/preset-vite
- **认证**: WebAuthn/FIDO2 (Passkey) + TOTP + JWT + Session

## Code Conventions
- **语言**: TypeScript（strict mode）
- **提交风格**: Conventional Commits（feat/fix/refactor/chore）
- **i18n**: 所有用户可见文本走 `t('txt_xxx')`，在 `en.ts` / `zh-CN.ts` 加翻译键
- **加密字段**: 服务器存加密密文，前端 `dec*` 字段存解密后明文（如 `decName`, `decUsername`）
- **API**: Bitwarden 兼容 API 路径（`/api/ciphers`, `/api/sync` 等）
- **样式**: Tailwind utility + 拆分 CSS 文件（`styles/vault.css`, `styles/auth.css` 等）
- **设计规范**: 前端样式必须遵守 `docs/vault-editor-design-spec.md` 中的设计规范

## Critical Areas (from CONTRIBUTING.md)
1. **数据库变更** → 改 `storage-schema.ts` + 加 migration SQL + 更新 `storage.ts`
2. **备份/还原** → 白名单系统，涉及 `backup-archive.ts` / `backup-import.ts` / `api/backup.ts`
3. **秘密/提供商设置** → 必须加密存储
4. **Bitwarden 客户端兼容** → `ciphers.ts` / `sync.ts` / `storage-cipher-repo.ts`
5. **域名规则** → 变更需迁移/兼容计划
6. **账户/密码** → 安全约束（密码强度限制、哈希、提示限制）
7. **i18n** → 更新后运行 `npm run i18n:validate`

## Dev Server Workflow
- `wrangler dev` 从 `./dist/` 提供静态文件，不自动检测 webapp 源码变更
- 修改 `webapp/src/` 后必须执行：`npm run build` → 重启 `npm run dev` 进程
- 流程：`pkill -f "nodewarden.*dev"` → `npm run build` → `npm run dev &`
- 每次改完都要等用户验收，再继续下一步

## Before Asking Questions
1. Read CONTRIBUTING.md — 它有详细的敏感区域指南
2. 搜索现有代码模式，不要重新发明
3. 检查 `webapp/src/lib/i18n/locales/` 的翻译模式

## Delivery Standards
- **改动最小化**: 只改必要的代码，不要顺手优化无关部分
- **双向兼容**: 改 API 或加密逻辑时保持向后兼容
- **i18n 完整**: 新增文本必须同时添加英文和中文翻译
- **前端不可破坏**: UI 改动后确保 PWA/离线模式不受影响
- **加密安全**: 敏感字段必须走加密/解密链路，不可明文传输
