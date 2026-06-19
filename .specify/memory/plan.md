# Implementation Plan: NodeWarden 新增密码模块对齐客户端 API

**Branch**: `feat/align-add-cipher` | **Date**: 2026-06-17 | **Spec**: `.specify/memory/spec.md`

**Input**: Feature specification — NodeWarden 新增密码页面需与 Android 客户端 API 协议一致

## Summary

NodeWarden 后端的 cipher handler (`src/handlers/ciphers.ts`) 已处理好所有 5 种 cipher 类型的 API 兼容。需要做的事项：
1. **验证**后端 SSH Key fingerprint、FIDO2 字段、Attachment v2 路由的完整性
2. **重构**前端 VaultEditor 的新增密码流程，确保表单字段顺序和数据结构与设计规范完全一致
3. **端到端验证**数据在 Web Vault 和客户端之间正确同步

## 技术上下文

- **语言**: TypeScript (strict mode)
- **后端**: Cloudflare Workers (D1 + R2 + Durable Objects)
- **前端**: Preact + Preact Hooks + wouter + Tailwind CSS
- **加密**: Web Crypto API + @noble/hashes (加密字段使用 Bitwarden EncString 格式)
- **路由**: Hono-like 自定义路由 (`src/index.ts`)
- **存储**: D1 (SQLite via storage-cipher-repo + storage.ts)
- **设计规范**: `docs/vault-editor-design-spec.md`

## Constitution Check

✅ **Security-First**: 所有加密字段走 EncString 验证，不储存明文
✅ **Bitwarden Compatibility**: 保持 `CipherApiResponse` 格式与客户端一致，保留未知字段
✅ **Frontend Quality**: 严格遵循设计规范（13px/700 标签, Section+Card 布局）
✅ **Data Integrity**: 不修改存储 schema，仅验证和重构前端
✅ **Minimal Changes**: 只改必需的前端文件

## 项目结构

```text
src/
├── handlers/
│   └── ciphers.ts          # 📋 验证（不改核心逻辑）
├── types.ts                # 📋 验证类型定义

webapp/src/
├── components/vault/
│   ├── VaultEditor.tsx     # 🔧 重构新增密码页面
│   ├── vault-page-helpers.tsx  # 📋 验证辅助函数
│   └── VaultListPanel.tsx  # 📋 验证创建类型菜单
├── lib/
│   ├── types.ts            # 📋 验证前端类型
│   └── api/
│       └── vault.ts        # 📋 验证 API 调用格式
├── styles/
│   └── vault.css           # 📋 验证 CSS 是否符合设计规范

docs/
└── vault-editor-design-spec.md  # 设计规范参考
```

## 实施步骤

### Phase 1: API 验证（~1h）

**Step 1.1** — 验证后端代码
- 确认 `normalizeCipherSshKeyForCompatibility` 正确处理 `keyFingerprint` + `fingerprint` 双别名
- 确认 `cipherToResponse` 返回 `sshKey.keyFingerprint` 字段
- 确认 `fido2Credentials` 在 `normalizeFido2CredentialsForCompatibility` 中加密字段正确
- 确认 `formatAttachments` 中 `url` 不为 null

**Step 1.2** — 验证路由
- 确认 `/api/ciphers/:id/attachment/v2` (POST) 已注册
- 确认 `/api/ciphers/:id/attachment/:attachmentId` (POST/Multipart) 已注册

### Phase 2: 前端新增密码流程重构（~3h）

**Step 2.1** — 重构 VaultEditor 的 section 结构
- 验证 `VaultEditor.tsx` 中的表单字段布局与设计规范 Section 6.1 完全一致
- 验证每个 section 使用 `section.mb-5 > .section-head > h3.detail-title + .card`
- 验证字段标签使用 13px/700 `--muted-strong`

**Step 2.2** — 验证名称字段布局
- 确保 `name-field-group` 布局: 图标列(48×48) + 输入列并存
- 使用 `name-field-label` 样式

**Step 2.3** — 验证类型切换联动
- 创建空 draft (`createEmptyDraft`) 包含所有类型字段
- 类型切换时正确显示对应 section（login/card/identity/note/ssh）

**Step 2.4** — 验证密码/三方登录分割
- 验证 `loginType` 切换（password / third_party）
- 验证第三方平台选择 + 关联账号 UI

**Step 2.5** — 验证自定义字段
- 验证 FieldType Linked(3) 选项存在
- 验证 `LinkedId` 选择（Identity 字段映射）

### Phase 3: 端到端测试（~1h）

**Step 3.1** — 本地开发环境启动
```bash
npm run dev
```

**Step 3.2** — 验证创建 Login 密码
- 打开 Web Vault → 点 + → Login → 填写 → 保存
- 检查 API 请求体格式（type, name, login 等字段）
- 检查 API 响应体格式

**Step 3.3** — 验证创建 Card / Identity / SSH Key / SecureNote

**Step 3.4** — 验证客户端同步
- 确认客户端调 `/api/sync` 返回的数据结构正确

## 关键风险

- **EncString 格式**: 前端提交的字段需要以 `{type}.{iv}|{data}` 加密格式，非加密的直接明文会导致后端 `optionalEncString` 验证失败
- **字段大小写**: 客户端发送 PascalCase/camelCase 混合，后端已用 `getAliasedProp` 处理
- **Cipher 类型值差异**: 客户端 Type 1-5 映射到 Web Vault 的 Internal Type 1-5，需确保映射一致