# NodeWarden 密码功能对齐 — 需求规格说明书

> **版本**: v1.1  
> **日期**: 2026-06-24  
> **状态**: 部分完成（重复项筛选已实施）  

---

## 〇、修订记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|---------|------|
| v1.0 | 2026-06-24 | 初始版本 | — |
| v1.1 | 2026-06-24 | 重复项筛选已确认完成，从待实施列表移除 | — |

---

## 一、项目背景与目标

### 1.1 背景

NodeWarden 是运行在 Cloudflare Workers 上的 Bitwarden 兼容密码管理服务端（v1.6.1），附带原创 Web Vault 前端（Preact + Vite + Tailwind）。当前已实现完整的 cipher CRUD API、加密、同步、D1 数据库、R2 文件存储，以及 Web 端的密码添加/编辑/详情/列表功能。

Monica Android 客户端是一个本地优先的密码管理应用（Room DB），支持 50+ 字段的密码条目、多目标同步（KeePass/MDBX/Bitwarden/Local）、丰富的表单字段和交互体验。

### 1.2 目标

**以 Monica Android 客户端为基准**，对齐 NodeWarden Web 端的密码添加和查看功能。核心原则：

1. **服务端零改动** — NodeWarden 服务端 API 已完全覆盖需求
2. **Web UI 层对齐** — 所有工作在 `webapp/src/` 下完成
3. **不重新开发** — 保留现有 UI 和字段设计，只补齐缺失部分
4. **Bitwarden 兼容** — 不能破坏官方客户端兼容性

### 1.3 范围边界

| 在范围内 | 在范围外 |
|----------|----------|
| Web 端密码添加表单（VaultEditor） | 服务端 API 改动 |
| Web 端密码详情视图（VaultDetailView） | D1 数据库 schema 变更 |
| Web 端密码列表（VaultListPanel） | 加密算法变更 |
| Web 端侧边栏筛选（VaultSidebar） | 认证/授权系统 |
| i18n 翻译补齐 | 移动端适配（已有响应式） |
| 交互体验优化 | 新增密码类型 |

---

## 二、现状审计（已完成代码审查）

### 2.1 已具备的功能（不需要改动）

#### VaultEditor（添加/编辑表单）

| 功能 | 代码位置 | 状态 |
|------|---------|------|
| 标题（name） | `VaultEditor.tsx:486-493` | ✅ 完整 |
| 图标选择（WebsiteIcon + 自定义上传） | `VaultEditor.tsx:467-494, 806-828` | ✅ 完整 |
| 网站 URL（多 URL，添加/删除/排序） | `VaultEditor.tsx:496-547, 79-139` | ✅ 完整 |
| 用户名 | `VaultEditor.tsx:570-572` | ✅ 完整 |
| 登录方式切换（PASSWORD/SSO） | `VaultEditor.tsx:548-657` | ✅ 完整 |
| 密码（单密码 + 生成器 + 复制 + 显示/隐藏） | `VaultEditor.tsx:574-631` | ✅ 完整 |
| TOTP 密钥 + QR 扫码 | `VaultEditor.tsx:613-631, 147-282` | ✅ 完整 |
| 备注 | `VaultEditor.tsx:1047-1057` | ✅ 完整 |
| 自定义字段（分组/排序/模态框） | `VaultEditor.tsx:917-1045` | ✅ 完整 |
| 附件（上传/删除/进度） | `VaultEditor.tsx:830-915` | ✅ 完整 |
| 支付信息（CipherCard 表单） | `VaultEditor.tsx:698-739` | ✅ 完整 |
| 身份信息（CipherIdentity 表单，含邮箱/电话/地址/SSN/护照/驾照） | `VaultEditor.tsx:741-764` | ✅ 完整 |
| SSH 密钥表单 | `VaultEditor.tsx:767-803` | ✅ 完整 |
| 文件夹选择 | `VaultEditor.tsx:454-464` | ✅ 完整 |
| 收藏 | `VaultEditor.tsx:429-432` | ✅ 完整 |
| 密码生成器（长度/大小写/数字/符号/排除相似） | `VaultEditor.tsx:326-390, 1078-1157` | ✅ 完整 |
| 密码历史（自动记录） | 服务端 `ciphers.ts` | ✅ 完整 |

#### VaultDetailView（详情视图）

| 功能 | 代码位置 | 状态 |
|------|---------|------|
| 登录凭据（用户名/密码/TOTP/Passkey） | `VaultDetailView.tsx:149-250` | ✅ 完整 |
| 网站 URL（多 URL + 打开 + 复制） | `VaultDetailView.tsx:253-277` | ✅ 完整 |
| 支付信息（卡号/持卡人/有效期/CVV/品牌） | `VaultDetailView.tsx:279-294` | ✅ 完整 |
| 身份信息（姓名/用户名/邮箱/电话/公司/地址合并） | `VaultDetailView.tsx:296-306` | ✅ 完整（待优化展示） |
| SSH 密钥（私钥/公钥/指纹 + 显示/隐藏） | `VaultDetailView.tsx:308-357` | ✅ 完整 |
| 备注 | `VaultDetailView.tsx:360-365` | ✅ 完整 |
| 自定义字段（分组/隐藏/布尔/附件） | `VaultDetailView.tsx:367-472` | ✅ 完整 |
| 附件下载 | `VaultDetailView.tsx:474-506` | ✅ 完整 |
| 密码历史 | `VaultDetailView.tsx:508-521, 45-82` | ✅ 完整 |
| 操作栏（编辑/删除/收藏/归档/恢复） | `VaultDetailView.tsx:524-550` | ✅ 完整 |
| 主密码重提示（reprompt） | `VaultDetailView.tsx:114-124` | ✅ 完整 |

#### VaultListPanel（列表）

| 功能 | 代码位置 | 状态 |
|------|---------|------|
| 密码列表（图标 + 标题 + 副标题） | `VaultListPanel.tsx:77-107, 250-263` | ✅ 完整 |
| 搜索 | `VaultListPanel.tsx:139-163` | ✅ 完整 |
| 排序（编辑时间/创建时间/名称） | `VaultListPanel.tsx:165-190` | ✅ 完整 |
| 多选（checkbox + selectedMap） | `VaultListPanel.tsx:87-93` | ✅ 完整 |
| 批量操作栏（归档/取消归档/移动/删除/全选/取消选择） | `VaultListPanel.tsx:198-237` | ✅ 完整 |
| 虚拟滚动 | `VaultListPanel.tsx:240-263` | ✅ 完整 |
| "Select Duplicates" 按钮 | `VaultListPanel.tsx:199-201` | ✅ 完整 |

#### VaultSidebar（侧边栏）

| 功能 | 代码位置 | 状态 |
|------|---------|------|
| 全部/收藏/归档/回收站 | `VaultSidebar.tsx:95-106` | ✅ 完整 |
| 重复项入口 | `VaultSidebar.tsx:107-109` | ✅ 完整 |
| 类型筛选（登录/卡/身份/笔记/SSH） | `VaultSidebar.tsx:112-129` | ✅ 完整 |
| 文件夹列表 + 排序 + 增删改 | `VaultSidebar.tsx:131-221` | ✅ 完整 |

#### 重复项筛选（已实施 ✅）

| 功能 | 代码位置 | 状态 |
|------|---------|------|
| `buildCipherDuplicateSignature()` 签名函数 | `vault-page-helpers.tsx:455-529` | ✅ 完整 |
| `duplicateSignatureInfo` 计算（按签名分组计数） | `VaultPage.tsx:341-352` | ✅ 完整 |
| `duplicates` 筛选 case（过滤只保留重复项） | `VaultPage.tsx:363-365` | ✅ 完整 |
| 排序强制为 name | `VaultPage.tsx:419` | ✅ 完整 |
| "Select Duplicates" 批量选择 | `VaultPage.tsx:988-1000` | ✅ 完整 |

#### 服务端 API

| API | 状态 |
|-----|------|
| `GET/POST/PUT/DELETE /api/ciphers` | ✅ 完整 |
| `GET /api/ciphers/:id` | ✅ 完整 |
| `PUT /api/ciphers/:id/partial` | ✅ 完整 |
| `PUT /api/ciphers/:id/restore` | ✅ 完整 |
| `GET /api/folders` | ✅ 完整 |
| `PUT /api/sync` | ✅ 完整 |
| WebSocket 通知 | ✅ 完整 |

### 2.2 缺失功能（需要实施）

经过逐行代码审查，确认以下功能**确实缺失**：

| # | 缺失项 | 影响 | 优先级 |
|---|--------|------|--------|
| F1 | VaultEditor 登录表单无「关联应用」字段 | Android 有 AppSelectorDialog，Web 完全缺失 | P1 |
| F2 | VaultDetailView 身份信息中 SSN/护照/驾照无独立展示行 | 字段存在于 CipherIdentity 类型，但详情视图未渲染 | P2 |
| F3 | VaultDetailView 身份信息中地址字段合并展示，不够清晰 | 所有地址字段挤在一行 | P2 |
| ~~F4~~ | ~~重复项筛选逻辑未接入~~ | ✅ 已完成，`VaultPage.tsx:341-398` | ~~P1~~ ✅ |
| F5 | VaultEditor 登录表单无多密码支持 | Android 支持多密码，Web 仅单密码 | P2 |

---

## 三、功能需求（按优先级排列）

### 3.1 ~~P0：重复项筛选接入~~ ✅ 已完成

~~本节已移至 §2.1「已具备的功能」。~~

---

### 3.2 P1：VaultEditor 关联应用字段

#### 3.2.1 需求描述

Android 客户端的密码添加表单有「关联应用」功能（`AppSelectorDialog`），允许用户将密码条目与特定 Android 应用绑定。NodeWarden Web 端完全缺失此功能。

#### 3.2.2 详细规格

**UI 位置**: VaultEditor 登录表单中，网站 URL 字段下方（`VaultEditor.tsx:547` 之后）

**交互设计**:
1. 在网站 URL 列表下方，显示"关联应用"区域
2. 默认折叠（显示"已关联 0 个应用"）
3. 点击展开后：
   - 显示已关联应用列表（应用名称 + 删除按钮）
   - 显示"关联应用"按钮
4. 点击"关联应用"按钮：
   - 显示输入框（可输入应用名称）
   - 确认后添加到关联列表

**数据存储**:
- 使用 `VaultDraft.customFields` 数组，type=0（文本），group='associated-apps'，label="app"，value=应用名称
- 不新增数据库字段，完全在现有 `fields` JSON 列中存储

**表单字段**:
```typescript
// VaultDraft 新增:
associatedApps: string[];  // 应用名称列表
```

**i18n 翻译键**:
- `txt_associated_apps` — "关联应用" (zh) / "Associated Apps" (en)
- `txt_associated_apps_count` — "已关联 {{count}} 个应用" (zh) / "{{count}} associated app(s)" (en)
- `txt_add_app` — "关联应用" (zh) / "Associate App" (en)
- `txt_app_name` — "应用名称" (zh) / "App Name" (en)
- `txt_remove_app` — "取消关联" (zh) / "Remove Association" (en)

#### 3.2.3 文件变更清单

| # | 文件 | 变更类型 | 变更内容 | 行数估算 |
|---|------|---------|---------|---------|
| 1 | `webapp/src/lib/types.ts` | 修改 | `VaultDraft` 接口新增 `associatedApps: string[]` | +3 行 |
| 2 | `webapp/src/components/vault/vault-page-helpers.tsx` | 修改 | `createEmptyDraft()` 新增 `associatedApps: []` | +1 行 |
| 3 | `webapp/src/components/vault/vault-page-helpers.tsx` | 修改 | `draftFromCipher()` 从 customFields 还原 associatedApps | +8 行 |
| 4 | `webapp/src/components/vault/VaultEditor.tsx` | 修改 | 新增关联应用 UI 区域 | +60 行 |
| 5 | `webapp/src/components/vault/VaultEditor.tsx` | 修改 | `VaultEditorProps` 新增 `onUpdateDraftAssociatedApps` | +1 行 |
| 6 | `webapp/src/lib/i18n/locales/en.ts` | 新增 | 5 个翻译键 | +5 行 |
| 7 | `webapp/src/lib/i18n/locales/zh-CN.ts` | 新增 | 5 个翻译键 | +5 行 |

#### 3.2.4 验收标准

- [ ] 添加密码表单（登录类型）显示"关联应用"区域
- [ ] 可添加多个关联应用
- [ ] 可删除已关联应用
- [ ] 保存后数据持久化
- [ ] 编辑时能加载已保存的关联应用
- [ ] 非登录类型（卡/身份/笔记/SSH）不显示关联应用区域
- [ ] i18n 验证通过

#### 3.2.5 过程要求

- 关联应用 UI 仅在 `draft.type === 1`（登录类型）时渲染
- 使用折叠模式（默认收起），参考 VaultEditor 中 Passkey 区域的折叠模式
- 不新增 CSS 类，复用现有的 `field`、`field-compact`、`section-head` 类

---

### 3.3 P2：VaultDetailView 身份信息展示优化

#### 3.3.1 需求描述

当前 `VaultDetailView.tsx:296-306` 中，身份信息的地址字段合并在一行展示（第 304 行），SSN/护照/驾照字段完全未渲染。需要优化展示方式。

#### 3.3.2 详细规格

**3.3.2.1 地址字段拆分**

当前代码（`VaultDetailView.tsx:304`）:
```tsx
<div className="kv-line">
  <span>{t('txt_address')}</span>
  <strong>{[identity.decAddress1, identity.decAddress2, identity.decAddress3, identity.decCity, identity.decState, identity.decPostalCode, identity.decCountry].filter(Boolean).join(', ')}</strong>
</div>
```

改为（每个字段独立行，空字段不显示）:
```tsx
{!!identity.decAddress1 && <div className="kv-line"><span>{t('txt_address_1')}</span><strong>{identity.decAddress1}</strong></div>}
{!!identity.decAddress2 && <div className="kv-line"><span>{t('txt_address_2')}</span><strong>{identity.decAddress2}</strong></div>}
{!!identity.decAddress3 && <div className="kv-line"><span>{t('txt_address_3')}</span><strong>{identity.decAddress3}</strong></div>}
{!!identity.decCity && <div className="kv-line"><span>{t('txt_city_town')}</span><strong>{identity.decCity}</strong></div>}
{!!identity.decState && <div className="kv-line"><span>{t('txt_state_province')}</span><strong>{identity.decState}</strong></div>}
{!!identity.decPostalCode && <div className="kv-line"><span>{t('txt_postal_code')}</span><strong>{identity.decPostalCode}</strong></div>}
{!!identity.decCountry && <div className="kv-line"><span>{t('txt_country')}</span><strong>{identity.decCountry}</strong></div>}
```

**3.3.2.2 SSN/护照/驾照独立展示**

在电话之后（第 302 行）、公司之前（第 303 行），新增三个字段展示行。每个字段带显示/隐藏按钮（参考密码的显示/隐藏模式）:

```tsx
// 新增状态（在组件顶部，与其他 useState 一起）:
const [showSsn, setShowSsn] = useState(false);
const [showPassport, setShowPassport] = useState(false);
const [showLicense, setShowLicense] = useState(false);

// 在 useEffect 中重置（与 showSshPrivateKey 一起）:
useEffect(() => {
  setShowSshPrivateKey(false);
  setPasswordHistoryOpen(false);
  setShowSsn(false);
  setShowPassport(false);
  setShowLicense(false);
}, [props.selectedCipher.id]);

// 渲染（在电话之后、公司之前）:
{!!identity.decSsn && (
  <div className="kv-row">
    <span className="kv-label">{t('txt_ssn')}</span>
    <div className="kv-main">
      <strong>{showSsn ? identity.decSsn : maskSecret(identity.decSsn)}</strong>
    </div>
    <div className="kv-actions">
      <button type="button" className="btn btn-secondary small" onClick={() => setShowSsn(v => !v)}>
        {showSsn ? <EyeOff size={14} /> : <Eye size={14} />}
        {showSsn ? t('txt_hide') : t('txt_reveal')}
      </button>
      <button type="button" className="btn btn-secondary small" onClick={() => copyToClipboard(identity.decSsn || '')}>
        <Clipboard size={14} /> {t('txt_copy')}
      </button>
    </div>
  </div>
)}
// 同样处理 decPassportNumber (txt_passport_number), decLicenseNumber (txt_license_number)
```

#### 3.3.3 文件变更清单

| # | 文件 | 变更类型 | 变更内容 | 行数估算 |
|---|------|---------|---------|---------|
| 1 | `webapp/src/components/vault/VaultDetailView.tsx` | 修改 | 地址字段拆分（1行 → 最多7行） | +20 行 |
| 2 | `webapp/src/components/vault/VaultDetailView.tsx` | 修改 | SSN/护照/驾照独立展示 | +45 行 |
| 3 | `webapp/src/components/vault/VaultDetailView.tsx` | 修改 | 新增 3 个 useState + useEffect 重置 | +5 行 |
| 4 | `webapp/src/lib/i18n/locales/en.ts` | 新增 | 补齐缺失的地址/身份翻译键 | ±0 |
| 5 | `webapp/src/lib/i18n/locales/zh-CN.ts` | 新增 | 同上 | ±0 |

#### 3.3.4 验收标准

- [ ] 地址信息按字段分行展示（地址行1/2/3、城市、州/省、邮编、国家）
- [ ] 空地址字段不显示
- [ ] SSN/护照/驾照独立展示，带显示/隐藏和复制按钮
- [ ] 切换密码详情时，敏感字段显示状态重置为隐藏
- [ ] 现有身份信息字段（姓名/用户名/邮箱/电话/公司）展示不受影响

#### 3.3.5 过程要求

- 修改前先 `read` `VaultDetailView.tsx:84-310` 确认上下文
- 使用 `kv-row` + `kv-label` + `kv-main` + `kv-actions` 模式（与现有字段一致）
- 敏感字段（SSN/护照/驾照）默认隐藏，使用 `maskSecret()` 函数
- 复制使用已有的 `copyToClipboard()` 辅助函数

---

### 3.4 P2：VaultEditor 多密码支持

#### 3.4.1 需求描述

Android 客户端支持为同一登录条目添加多个密码（如"当前密码"、"旧密码"、"备用密码"）。NodeWarden Web 端当前仅支持单密码。

#### 3.4.2 详细规格

**数据存储方案**:

使用 `VaultDraft.customFields` 存储额外密码（type=1 隐藏类型，label 为密码标签，value 为密码值）。主密码仍使用 `loginPassword` 字段。

**理由**:
- 不新增数据库字段（服务端零改动）
- `CipherField` 类型已支持 hidden 类型（type=1）
- `CipherField` 已有 `label`/`value`/`group` 字段
- 保存时，额外密码序列化到 `cipher.fields` 数组

**UI 设计**:

在 VaultEditor 登录表单的密码字段区域（`VaultEditor.tsx:574-632`），改为:

```
密码 (主密码)
[输入框..................] [生成器] [复制] [显示/隐藏]

额外密码
┌─────────────────────────────────────────────┐
│ 旧密码: [输入框............] [复制] [隐藏] [×] │
│ 备用密码: [输入框............] [复制] [隐藏] [×] │
└─────────────────────────────────────────────┘
[+ 添加额外密码]
```

**交互规则**:
1. 主密码始终显示在顶部，不可删除
2. 额外密码可添加/删除
3. 每个额外密码有独立的显示/隐藏、复制按钮
4. 每个额外密码有标签（默认"额外密码 N"，可编辑）
5. 最少 0 个额外密码，最多 10 个

**表单字段**:
```typescript
// VaultDraft 新增:
extraPasswords: Array<{
  id: string;        // crypto.randomUUID()
  label: string;     // 默认 "额外密码 N"
  value: string;
}>;
```

#### 3.4.3 文件变更清单

| # | 文件 | 变更类型 | 变更内容 | 行数估算 |
|---|------|---------|---------|---------|
| 1 | `webapp/src/lib/types.ts` | 修改 | `VaultDraft` 接口新增 `extraPasswords` | +6 行 |
| 2 | `webapp/src/components/vault/vault-page-helpers.tsx` | 修改 | `createEmptyDraft()` 新增 `extraPasswords: []` | +1 行 |
| 3 | `webapp/src/components/vault/vault-page-helpers.tsx` | 修改 | `draftFromCipher()` 从 customFields 还原 extraPasswords | +10 行 |
| 4 | `webapp/src/components/vault/VaultEditor.tsx` | 修改 | `VaultEditorProps` 新增 3 个 props | +3 行 |
| 5 | `webapp/src/components/vault/VaultEditor.tsx` | 修改 | 密码区域 UI 重写 | +80 行 |
| 6 | `webapp/src/lib/i18n/locales/en.ts` | 新增 | 翻译键 | +6 行 |
| 7 | `webapp/src/lib/i18n/locales/zh-CN.ts` | 新增 | 翻译键 | +6 行 |

**i18n 翻译键**:
- `txt_extra_passwords` — "额外密码" (zh) / "Extra Passwords" (en)
- `txt_add_extra_password` — "添加额外密码" (zh) / "Add Extra Password" (en)
- `txt_extra_password_label` — "额外密码 {{n}}" (zh) / "Extra Password {{n}}" (en)
- `txt_main_password` — "主密码" (zh) / "Main Password" (en)
- `txt_remove_password` — "删除密码" (zh) / "Remove Password" (en)
- `txt_password_label` — "密码标签" (zh) / "Password Label" (en)

#### 3.4.4 验收标准

- [ ] 添加密码表单可添加多个额外密码
- [ ] 每个额外密码独立显示/隐藏、复制、删除
- [ ] 主密码不可删除
- [ ] 保存后数据持久化（主密码 + 额外密码）
- [ ] 编辑时能加载已保存的所有密码
- [ ] 额外密码数量限制：最多 10 个
- [ ] 非登录类型不显示额外密码区域
- [ ] i18n 验证通过

#### 3.4.5 过程要求

- 密码输入使用 `type={show ? 'text' : 'password'}` 模式（与现有一致）
- 生成器按钮点击后打开现有密码生成器对话框（复用 `pgOpen` 状态）
- 额外密码的 `id` 使用 `crypto.randomUUID()` 生成
- 保存时，额外密码写入 `customFields` 数组：
  ```typescript
  const extraPasswordFields = draft.extraPasswords.map(pw => ({
    type: 1,  // hidden
    label: pw.label,
    value: pw.value,
    linkedId: null,
    group: 'extra-passwords',
  }));
  ```

---

## 四、非功能需求

### 4.1 性能

- 列表筛选（包括重复项）响应时间 < 100ms（1000 条 cipher 以内）
- 密码表单渲染不增加首屏加载时间 > 50ms
- 虚拟滚动保持不变

### 4.2 安全

- 额外密码存储时必须加密（走现有加密链路）
- SSN/护照/驾照默认隐藏显示
- 复制到剪贴板后不留下内存痕迹（使用 `setTimeout` 清理）

### 4.3 兼容性

- Bitwarden 官方客户端 API 响应格式不变
- 现有密码数据（无额外密码/关联应用）正常加载
- 暗色模式兼容

### 4.4 国际化

- 所有新增 UI 文本必须同时添加英文（en.ts）和中文（zh-CN.ts）翻译
- 运行 `npm run i18n:validate` 必须通过

---

## 五、编码规范

### 5.1 文件注释

- 新增函数上方必须有 JSDoc 注释，说明功能、参数、返回值
- 新增 UI 区域用注释标注 `/* === 功能名称 === */` 分隔
- 修改现有代码时，在修改点附近用注释说明改动原因

### 5.2 组件规范

- 遵循现有函数式组件 + Hooks 模式
- 状态声明放在组件顶部
- 事件处理函数命名: `handleXxx`
- Props 命名: `onXxx`（回调）、`isXxx`/`hasXxx`（布尔）

### 5.3 样式规范

- 使用现有 CSS 类（`field`、`field-compact`、`kv-row`、`kv-line`、`card`、`section-head` 等）
- 如需新 CSS 类，添加到 `webapp/src/styles/vault.css`
- 遵循 `docs/vault-editor-design-spec.md` 中的设计 token

### 5.4 i18n 规范

- 所有用户可见文本使用 `t('txt_xxx')`
- 翻译键前缀 `txt_` 保持一致
- 复数形式使用 `{{count}}` 插值
- 新增翻译键后立即更新 `en.ts` 和 `zh-CN.ts`

### 5.5 TypeScript 规范

- 不使用 `any`，使用具体类型
- 新增 interface/type 放在 `types.ts` 中
- 函数参数使用 `Readonly<>` 如果不需要修改

---

## 六、交付标准

### 6.1 代码质量

| 检查项 | 命令 | 要求 |
|--------|------|------|
| TypeScript 编译 | `npx tsc --noEmit` | 零错误 |
| 构建 | `npm run build` | 零错误 |
| i18n 完整性 | `npm run i18n:validate` | 零缺失 |

### 6.2 功能验收

| # | 验收项 | 验收方法 |
|---|--------|---------|
| 1 | 重复项筛选 | ✅ 已完成，创建 2 个相同密码 → 侧边栏点"重复项" → 只显示这 2 个 |
| 2 | 关联应用 | 添加密码时关联 2 个应用 → 保存 → 刷新 → 编辑 → 2 个应用正确加载 |
| 3 | 身份详情优化 | 查看含 SSN/护照/多行地址的密码 → 字段分行展示 → 显示/隐藏正常 |
| 4 | 多密码 | 添加密码时添加 3 个额外密码 → 保存 → 刷新 → 编辑 → 所有密码正确加载 |
| 5 | Bitwarden 兼容 | 用 Bitwarden 浏览器扩展连接 → 增删改查正常 |

### 6.3 文档交付

- 本需求文档更新修订记录
- 代码中新增注释完整
- 实施完成后更新 `docs/vault-editor-design-spec.md`（如有 UI 变更）

---

## 七、实施顺序建议

```
Phase 1 (P1): 关联应用字段
  ↓ 预计 2-3 小时
Phase 2 (P2): 身份详情优化 + 多密码支持（可并行）
  ↓ 预计 3-4 小时
Phase 3: 集成测试 + i18n 验证 + 文档更新
  ↓ 预计 1 小时
```

---

## 八、风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `VaultEditor.tsx` 登录表单区域插入关联应用 UI 可能影响现有布局 | 中 | 先 `read` 529 行后的确切位置，确认 Passkey 区域结束位置再插入 |
| 多密码存储方案（customFields）可能与现有自定义字段冲突 | 中 | 使用 `group: 'extra-passwords'` 前缀区分 |
| 身份详情改动可能影响现有布局 | 低 | 只新增/拆分字段，不改已有字段结构 |
| i18n 翻译不全导致验证失败 | 低 | 每新增一个键就立即更新两个 locale 文件 |
