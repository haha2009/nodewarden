# PRD: Cipher Group（登录分组）功能

## Problem Statement

当前 NodeWarden 的 VaultEditor 中，一个 Cipher（密码条目）只能包含**一组登录信息**（一个用户名/密码/TOTP，或一个三方登录）。但实际使用中，一个网站/应用通常有**多个账号**（个人号、工作号、测试号等），每个账号有独立的登录凭据、自定义字段和附件。

用户需要在同一个网站条目下管理多个登录账号，而不是创建多个平行的 Cipher 条目。

## Solution

在 Cipher 内部引入 **Group（组）** 概念。每个 Group 代表一个登录账号分组，包含：
- 自定义名称和描述
- 完整的登录方式（密码登录或三方登录，含用户名/密码/TOTP/Fido2）
- 自定义字段
- 附件

系统为每个 Cipher 默认创建至少一个 Group。编辑已有 Cipher 时，原有登录数据自动归入默认 Group。

## User Stories

### Group 基础管理

1. 作为用户，我希望在编辑登录类型的 Cipher 时看到分组区域，以便管理该网站下的多个账号
2. 作为用户，我希望系统自动将已有的登录数据（用户名/密码/TOTP）放入默认 Group，而不需要手动迁移
3. 作为用户，我希望新建 Cipher 时系统自动创建一个空的默认 Group，以便直接添加登录方式
4. 作为用户，我希望点击"添加分组"按钮创建新的 Group，以便将不同用途的账号分开
5. 作为用户，我希望每个 Group 可以自定义名称和描述，以便区分不同账号（如"工作账号"、"个人号"）
6. 作为用户，我希望删除不需要的 Group，删除前需要确认

### 登录方式管理

7. 作为用户，我期望在每个 Group 内可以添加多个登录方式（密码登录或三方登录），以便管理同一个账号的多种认证方式
8. 作为用户，我期望登录方式的字段和原来一样完整：用户名、密码、TOTP、Fido2、三方平台和账号
9. 作为用户，我期望每个登录方式可以独立删除
10. 作为用户，我希望添加登录方式时可以选择类型（密码登录 / 三方登录），以便灵活配置

### 自定义字段与附件

11. 作为用户，我希望每个 Group 可以有独立的自定义字段，以便存储该账号特有的附加信息
12. 作为用户，我希望每个 Group 可以有独立的附件，以便存储该账号相关的文件或密钥

### 详情展示

13. 作为用户，我期望在详情视图中看到 Group 的结构化展示（组名、描述、登录列表、自定义字段、附件）
14. 作为用户，我期望密码类敏感信息在 Group 详情中默认隐藏，可以点击显示/复制

### 非登录类型

15. 作为用户，我期望非登录类型（卡片、身份、安全备注、SSH 密钥）不显示 Group 区域，因为这些类型没有登录概念

## Implementation Decisions

### 数据模型

- **Group 是 Cipher 内部的子结构**，不是独立实体
- 新增 `VaultDraftGroup` 类型：包含 id、name、description、logins、customFields、attachments
- 新增 `VaultDraftGroupLogin` 类型：包含完整登录字段（username、password、totp、fido2Credentials、thirdPartyPlatform、thirdPartyAccount）
- `VaultDraft` 新增 `groups: VaultDraftGroup[]` 字段

### 前端先行，后端后续

- 第一阶段仅实现前端 UI 和交互，Group 数据暂不持久化到后端
- 数据结构设计与 future 后端 API 对齐，减少后续迁移成本
- 保存 Cipher 时 groups 数据暂丢弃（等后端就绪后补充）

### 自动迁移策略

- `draftFromCipher()` 中：如果 cipher 有登录数据（username/password/totp/thirdParty），自动创建默认 Group 并将数据移入
- 默认 Group 名称使用 `txt_default_group`（"默认分组" / "Default Group"）
- Cipher 原有登录字段保留（向后兼容）

### UI 设计

- Group 区域位于 Cipher 基础信息（网址、名称、图标）之下、原登录表单之后
- 使用折叠面板展示每个 Group（默认展开）
- 保持与现有 VaultEditor 一致的卡片式布局和 Tailwind 样式
- 登录字段交互与现有主表单一致（密码显示/隐藏、复制、生成器、TOTP 扫码）
- 仅 `draft.type === 1`（登录类型）时渲染 Group 区域

### 侧边栏

- 不在侧边栏添加 Group 筛选/分组
- Group 仅在编辑页和详情页体现

### i18n

- 新增 Group 相关翻译键（~16 个）
- 同时更新英文（en.ts）和简体中文（zh-CN.ts）

## Testing Decisions

### 测试重点

- 类型安全：TypeScript 编译零错误
- 构建通过：Vite 构建零错误
- i18n 完整性：所有新增文本有对应翻译
- 交互正确性：Group CRUD、登录方式 CRUD、折叠展开、删除确认
- 数据迁移：编辑已有 Cipher 时自动创建默认 Group 并移入数据
- 非登录类型不显示 Group 区域

### 验收命令

```bash
npx tsc --noEmit         # TypeScript 类型检查
npm run build            # Vite 构建
npm run i18n:validate    # i18n 完整性验证
```

### 验收清单

- [ ] 新建登录类型 Cipher → 自动有 1 个空默认 Group
- [ ] 编辑已有 Cipher（有登录数据）→ 自动创建默认 Group 并移入数据
- [ ] 添加/删除 Group
- [ ] 修改 Group 名称和描述
- [ ] 在 Group 内添加/删除登录方式（密码/三方）
- [ ] 登录方式字段完整（用户名/密码/TOTP/Fido2/三方）
- [ ] Group 内自定义字段和附件
- [ ] 折叠/展开 Group
- [ ] 删除确认
- [ ] 详情视图正确展示 Group 数据
- [ ] 非登录类型不显示 Group 区域
- [ ] 密码默认隐藏，可显示/复制

## Out of Scope

- 后端 API 实现（Group 的持久化存储）
- 侧边栏 Group 筛选/分组
- Group 跨 Cipher 共享
- Group 模板/预设
- Folder → Tag 重命名（独立需求）
- 多密码支持（独立需求）
- 关联应用字段（独立需求）

## Further Notes

- Group 数据结构设计应考虑未来后端 API 的对齐：`/api/ciphers/{id}/groups` 或嵌入 Cipher 对象
- 附件上传流程与现有 Cipher 级别附件一致，但 scope 缩小到 Group
- 自定义字段的 group 字段（`VaultDraftField.group`）与本功能中的 Group 是不同概念，不冲突
