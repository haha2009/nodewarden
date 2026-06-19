# Tasks: 新增密码模块对齐客户端 API

**Input**: Spec (`.specify/memory/spec.md`) + Plan (`.specify/memory/plan.md`)

## Phase 1: API 验证（P1）

**目的**: 验证后端 API 与客户端协议的兼容性

- [ ] T001 验证 SSH Key fingerprint 字段兼容性 — 检查 `normalizeCipherSshKeyForCompatibility` 双别名处理
- [ ] T002 验证 FIDO2/Passkey 凭证字段 — 检查 `normalizeFido2CredentialsForCompatibility` 加密字段校验
- [ ] T003 验证 Attachment v2 路由 — 确认 `/api/ciphers/:id/attachment/v2` (POST) 和 `/api/ciphers/:id/attachment/:attachId` (POST/Multipart) 已注册
- [ ] T004 验证 `cipherToResponse` 输出 — 确认包含所有客户端期望字段

## Phase 2: 前端 VaultEditor 重构（P1）

**目的**: 按设计规范重构新增密码页面

**注意**: TypeScript 类型、EncString 验证、i18n 均已存在。主要是视觉布局验证和修复。

- [ ] T005 检查 VaultEditor 的 section 结构 — 验证 `section.mb-5 > .section-head > h3.detail-title + .card` 布局，确认字段标签使用 13px/700
- [ ] T006 检查名称字段布局 — 确认图标列(48×48) + 输入列并存布局
- [ ] T007 检查类型切换联动 — 创建空 draft `createEmptyDraft` 是否包含所有 5 种类型字段，切换时 section 显示/隐藏是否正确
- [ ] T008 检查自定义字段 — 确认 FieldType 选项包含 Linked(3)，LinkedId 选择存在
- [ ] T009 检查附件管理 UI — 确认上传/下载/删除流程
- [ ] T010 检查密码生成器 — 确认弹窗布局和功能

## Phase 3: 端到端验证（P2）

**目的**: 在两个端之间验证数据一致性

- [ ] T011 本地启动开发环境 — `npm run dev`
- [ ] T012 验证创建 Login 密码 — Web Vault 创建 → 检查 API 请求/响应格式
- [ ] T013 验证创建 Card / Identity / SecureNote / SSH Key
- [ ] T014 验证 sync 输出 — 确认 `/api/sync` 返回数据结构完整

## 执行顺序

```
Phase 1 (T001-T004) → Phase 2 (T005-T010) → Phase 3 (T011-T014)
```

每个 Phase 完成后停一下验证。