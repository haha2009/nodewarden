# NodeWarden 密码功能对齐 — 实施 Prompt

> **版本**: v3.0  
> **日期**: 2026-06-24  

---

## 项目背景

NodeWarden 是运行在 Cloudflare Workers 上的 Bitwarden 兼容密码管理服务端（v1.6.1），附带原创 Web Vault 前端（Preact + Vite + Tailwind）。服务端已完全实现 cipher CRUD API、加密、同步、D1 数据库、R2 文件存储。**服务端零改动**，所有工作在 Web UI 层（`webapp/src/`）。

**目标**: 以 Monica Android 客户端为基准，补齐 NodeWarden Web 端缺失的密码字段和功能。

---

## 已完成（不需要再做）

- ✅ **重复项筛选** — `VaultPage.tsx:341-398` 已有完整的 `duplicates` 筛选逻辑，`buildCipherDuplicateSignature()` 覆盖所有字段类型，"Select Duplicates" 按钮已就位（`VaultListPanel.tsx:199-201`），侧边栏入口已渲染（`VaultSidebar.tsx:107-109`）。**Task 1 完全跳过。**

---

## 待实施任务

### Task 1: 关联应用字段（P1）

**现状**: VaultEditor 登录表单有标题、多 URL、用户名、密码、TOTP、备注、自定义字段、附件、卡/身份/SSH 表单。但**没有关联应用字段**。Android 客户端有 `AppSelectorDialog`，Web 完全缺失。

**步骤**:

1. **类型扩展** — `webapp/src/lib/types.ts`:
   - `VaultDraft` 接口新增 `associatedApps: string[]`

2. **辅助函数** — `webapp/src/components/vault/vault-page-helpers.tsx`:
   - `createEmptyDraft()` 新增 `associatedApps: []`
   - `draftFromCipher()` 从 customFields 还原 associatedApps（匹配 `group: 'associated-apps'` 的字段）

3. **UI** — `webapp/src/components/vault/VaultEditor.tsx`:
   - `VaultEditorProps` 新增 `onUpdateDraftAssociatedApps: (apps: string[]) => void`
   - 在网站 URL 列表下方（约第 547 行之后），新增关联应用区域
   - 仅 `draft.type === 1`（登录类型）时渲染
   - 默认折叠，显示"已关联 N 个应用"
   - 展开后显示应用列表（名称 + 删除按钮）+ "添加"按钮
   - 点击"添加"→ 输入应用名称 → 确认

4. **i18n** — `en.ts` + `zh-CN.ts`:
   - `txt_associated_apps` — "关联应用" / "Associated Apps"
   - `txt_associated_apps_count` — "已关联 {{count}} 个应用" / "{{count}} associated app(s)"
   - `txt_add_app` — "关联应用" / "Associate App"
   - `txt_app_name` — "应用名称" / "App Name"
   - `txt_remove_app` — "取消关联" / "Remove Association"

**文件变更**:
- `webapp/src/lib/types.ts` — +3 行
- `webapp/src/components/vault/vault-page-helpers.tsx` — +10 行
- `webapp/src/components/vault/VaultEditor.tsx` — +60 行
- `webapp/src/lib/i18n/locales/en.ts` — +5 行
- `webapp/src/lib/i18n/locales/zh-CN.ts` — +5 行

**验收**:
- [ ] `npx tsc --noEmit` 通过
- [ ] `npm run build` 成功
- [ ] `npm run i18n:validate` 通过
- [ ] 添加密码时可关联多个应用，保存后正确加载
- [ ] 非登录类型不显示关联应用区域

---

### Task 2: 身份详情展示优化（P2）

**现状**（`VaultDetailView.tsx:296-306`）:
- 身份信息区（第 296-306 行）地址字段全部合并在一行（`decAddress1` ~ `decCountry` join 成一行）
- SSN/护照/驾照（`decSsn`/`decPassportNumber`/`decLicenseNumber`）完全未渲染
- 现有字段使用 `kv-line` 模式（简单行），不带复制/显示隐藏

**步骤**:

1. `read` `VaultDetailView.tsx:84-310` 确认上下文

2. **地址拆分**（替换第 304 行的合并地址行）:
   将一行拆为独立行，每行空字段不显示:
   ```tsx
   {!!identity.decAddress1 && <div className="kv-line"><span>{t('txt_address_1')}</span><strong>{identity.decAddress1}</strong></div>}
   {!!identity.decAddress2 && <div className="kv-line"><span>{t('txt_address_2')}</span><strong>{identity.decAddress2}</strong></div>}
   {!!identity.decAddress3 && <div className="kv-line"><span>{t('txt_address_3')}</span><strong>{identity.decAddress3}</strong></div>}
   {!!identity.decCity && <div className="kv-line"><span>{t('txt_city_town')}</span><strong>{identity.decCity}</strong></div>}
   {!!identity.decState && <div className="kv-line"><span>{t('txt_state_province')}</span><strong>{identity.decState}</strong></div>}
   {!!identity.decPostalCode && <div className="kv-line"><span>{t('txt_postal_code')}</span><strong>{identity.decPostalCode}</strong></div>}
   {!!identity.decCountry && <div className="kv-line"><span>{t('txt_country')}</span><strong>{identity.decCountry}</strong></div>}
   ```

3. **SSN/护照/驾照**（在第 302 行电话之后、第 303 行公司之前插入）:
   - 新增 3 个状态: `showSsn`, `showPassport`, `showLicense`（默认 false）
   - 每个字段使用 `kv-row` 模式（与用户名/密码字段一致）:
     - 显示/隐藏按钮（参考密码字段 `props.onToggleShowPassword` 模式，但此处是本地 state）
     - 复制按钮（使用已有的 `copyToClipboard()`）
     - 默认隐藏，使用 `maskSecret()` 遮蔽
   - `useEffect` 在 `props.selectedCipher.id` 变化时重置 3 个状态为 false

4. **i18n 确认**: 确认以下键已存在于 `en.ts` 和 `zh-CN.ts`:
   - `txt_address_1`, `txt_address_2`, `txt_address_3`
   - `txt_city_town`, `txt_state_province`, `txt_postal_code`, `txt_country`
   - `txt_ssn`, `txt_passport_number`, `txt_license_number`
   - 如不存在则添加

**文件变更**:
- `webapp/src/components/vault/VaultDetailView.tsx` — +80 行
- `webapp/src/lib/i18n/locales/en.ts` — 补齐缺失键
- `webapp/src/lib/i18n/locales/zh-CN.ts` — 补齐缺失键

**验收**:
- [ ] `npx tsc --noEmit` 通过
- [ ] 地址字段分行展示（空字段不显示）
- [ ] SSN/护照/驾照独立展示 + 显示/隐藏 + 复制
- [ ] 切换密码时敏感字段状态重置为隐藏
- [ ] 现有身份字段（姓名/用户名/邮箱/电话/公司）不受影响

---

### Task 3: 多密码支持（P2）

**现状**: VaultEditor 登录表单仅单密码（`loginPassword`），Android 支持多密码。

**步骤**:

1. **类型扩展** — `webapp/src/lib/types.ts`:
   ```typescript
   export interface VaultDraftExtraPassword {
     id: string;     // crypto.randomUUID()
     label: string;  // 默认 "额外密码 N"
     value: string;
   }
   // VaultDraft 新增:
   extraPasswords: VaultDraftExtraPassword[];
   ```

2. **辅助函数** — `vault-page-helpers.tsx`:
   - `createEmptyDraft()` 新增 `extraPasswords: []`
   - `draftFromCipher()` 从 customFields 还原 extraPasswords（匹配 `group: 'extra-passwords'` 的字段）

3. **UI** — `VaultEditor.tsx`:
   - `VaultEditorProps` 新增 3 个 props: `onAddExtraPassword`, `onRemoveExtraPassword`, `onUpdateExtraPassword`
   - 密码区域布局改为:
     ```
     主密码（固定，不可删除）
     ┌─────────────────────────────────────────────┐
     │ 额外密码 1: [标签] [密码输入] [复制] [隐藏] [×] │
     │ 额外密码 2: [标签] [密码输入] [复制] [隐藏] [×] │
     └─────────────────────────────────────────────┘
     [+ 添加额外密码]
     ```
   - 最多 10 个额外密码
   - 仅 `draft.type === 1` 时渲染

4. **保存逻辑**: 额外密码写入 `customFields`:
   ```typescript
   const extraPasswordFields = draft.extraPasswords.map(pw => ({
     type: 1, label: pw.label, value: pw.value, linkedId: null, group: 'extra-passwords',
   }));
   ```

5. **i18n**: 6 个翻译键
   - `txt_extra_passwords` / `txt_add_extra_password` / `txt_extra_password_label`
   - `txt_main_password` / `txt_remove_password` / `txt_password_label`

**文件变更**:
- `webapp/src/lib/types.ts` — +6 行
- `webapp/src/components/vault/vault-page-helpers.tsx` — +12 行
- `webapp/src/components/vault/VaultEditor.tsx` — +83 行
- `webapp/src/lib/i18n/locales/en.ts` — +6 行
- `webapp/src/lib/i18n/locales/zh-CN.ts` — +6 行

**验收**:
- [ ] `npx tsc --noEmit` 通过
- [ ] `npm run build` 成功
- [ ] `npm run i18n:validate` 通过
- [ ] 可添加/删除多个额外密码，保存后正确加载
- [ ] 主密码不可删除

---

## 通用约束

1. **不改服务端**: `src/` 目录（注意是 webapp 外的 `src/`）零改动
2. **不改 D1 schema**: 不新增数据库字段
3. **Bitwarden 兼容**: API 响应格式不变
4. **设计规范**: 遵守 `docs/vault-editor-design-spec.md`
5. **i18n**: 所有用户可见文本走 `t('txt_xxx')`，同时更新 `en.ts` + `zh-CN.ts`
6. **最小改动**: 只改必要的代码，不顺手优化无关部分
7. **注释**: 新增函数加 JSDoc，新增 UI 区域用 `/* === 名称 === */` 分隔

## 开发命令

```bash
npx tsc --noEmit         # TypeScript 类型检查（必须先过）
npm run build            # 构建验证（必须先过）
npm run i18n:validate    # i18n 验证（必须先过）
npm run dev              # 本地开发
```

## 实施前必须读的文件

1. `webapp/src/lib/types.ts` — 理解 VaultDraft、Cipher 类型
2. `webapp/src/components/vault/VaultEditor.tsx:424-696` — 登录表单渲染逻辑
3. `webapp/src/components/vault/VaultDetailView.tsx:84-310` — 详情视图（重点 296-306 身份区）
4. `webapp/src/components/vault/vault-page-helpers.tsx:455-529` — buildCipherDuplicateSignature + createEmptyDraft + draftFromCipher
5. `webapp/src/components/VaultPage.tsx:341-398` — 重复项筛选逻辑（已完整，不改）
6. `docs/vault-editor-design-spec.md` — 设计规范

## 最终验收（全部通过才算完成）

- [ ] `npx tsc --noEmit` — 零错误
- [ ] `npm run build` — 零错误
- [ ] `npm run i18n:validate` — 零缺失
- [ ] 关联应用字段功能正常
- [ ] 身份详情展示优化完成
- [ ] 多密码支持功能正常
- [ ] Bitwarden 官方客户端兼容不受影响
