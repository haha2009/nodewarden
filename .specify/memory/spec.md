# Feature Specification: NodeWarden 新增密码模块对齐客户端 API

**Feature Branch**: `feat/align-add-cipher`

**Created**: 2026-06-17

**Status**: Draft

**Input**: NodeWarden 的密码添加流程需与 Android 客户端（Monica-1Password）保持一致。现有后端已支持基本 cipher CRUD，但前端新增密码页面（VaultEditor）的数据结构和接口调用需按客户端最新 API 协议调整对齐。

## 背景

Android 客户端（Monica-1Password）使用 Bitwarden-compatible API 与 NodeWarden 通信，支持 5 种 cipher 类型。当前 NodeWarden 后端的 cipher handler (`src/handlers/ciphers.ts`) 已支持完整数据结构，但需验证以下关键点：

1. **SSH Key Fingerprint** 字段需同时兼容 `keyFingerprint` 和 `fingerprint` 别名
2. **FIDO2/Passkey 凭证**数据结构的序列化与响应格式
3. **Attachment v2** 端点（`/ciphers/{id}/attachment/v2`）的支持
4. 前端提交的 `CipherCreateRequest` 格式必须与客户端完全一致

## API 协议对齐

### Cipher API 端点

| 端点 | 方法 | 客户端接口 | NodeWarden 状态 |
|------|------|-----------|----------------|
| `/api/ciphers` | POST | `createCipher()` | ✅ 已实现，需验证字段完整 |
| `/api/ciphers/{id}` | PUT | `updateCipher()` | ✅ 已实现 |
| `/api/ciphers/{id}` | DELETE | `deleteCipher()` | ✅ 已实现 |
| `/api/ciphers/{id}/delete` | DELETE | `permanentDeleteCipher()` | ✅ 已实现 |
| `/api/ciphers/{id}/restore` | PUT | `restoreCipher()` | ✅ 已实现 |
| `/api/ciphers/{id}/attachment/v2` | POST | `createAttachmentUploadUrl()` | 需确认 |
| `/api/ciphers/{id}/attachment/{attachId}` | POST | `uploadAttachmentDirect()` | 需确认 |
| `/api/sync` | GET | `sync()` | ✅ 已实现 |
| `/api/folders` | GET/POST/PUT/DELETE | `getFolders/createFolder/updateFolder/deleteFolder` | ✅ 已实现 |

### Cipher 类型对照

| Client Type | 值 | Web Vault 创建类型 | 内部类型 |
|------------|-----|-------------------|---------|
| Login | 1 | Login | type: 1 |
| Card | 2 | Card | type: 3 |
| Identity | 3 | Identity | type: 4 |
| SecureNote | 4 | Note | type: 2 |
| SSH Key | 5 | SSH Key | type: 5 |

> **注意**: 客户端类型值与 Web Vault 值不同。需确保 `cipherToResponse` 和 `handleCreateCipher` 正确处理。

### CipherCreateRequest 完整字段

```json
{
  "type": 1,
  "folderId": "uuid-or-null",
  "name": "2.encrypted-string",
  "notes": "2.encrypted-string-or-null",
  "login": {
    "username": "2.encrypted-or-null",
    "password": "2.encrypted-or-null",
    "passwordRevisionDate": "ISO-date-or-null",
    "totp": "2.encrypted-or-null",
    "uris": [{"uri": "2.encrypted", "match": 0}],
    "fido2Credentials": [{
      "credentialId": "2.encrypted",
      "keyType": "2.encrypted",
      "keyAlgorithm": "2.encrypted",
      "keyCurve": "2.encrypted",
      "keyValue": "2.encrypted",
      "rpId": "2.encrypted",
      "rpName": "2.encrypted-or-null",
      "counter": "2.encrypted",
      "userHandle": "2.encrypted-or-null",
      "userName": "2.encrypted-or-null",
      "userDisplayName": "2.encrypted-or-null",
      "discoverable": "2.encrypted",
      "creationDate": "ISO-date-or-null"
    }]
  },
  "card": {
    "cardholderName": "2.encrypted",
    "brand": "2.encrypted",
    "number": "2.encrypted",
    "expMonth": "2.encrypted",
    "expYear": "2.encrypted",
    "code": "2.encrypted"
  },
  "identity": {
    "title": "2.encrypted", "firstName": "2.encrypted",
    "middleName": "2.encrypted", "lastName": "2.encrypted",
    "address1": "2.encrypted", "address2": "2.encrypted", "address3": "2.encrypted",
    "city": "2.encrypted", "state": "2.encrypted", "postalCode": "2.encrypted",
    "country": "2.encrypted", "company": "2.encrypted",
    "email": "2.encrypted", "phone": "2.encrypted",
    "ssn": "2.encrypted", "username": "2.encrypted",
    "passportNumber": "2.encrypted", "licenseNumber": "2.encrypted"
  },
  "secureNote": {"type": 0},
  "sshKey": {
    "privateKey": "2.encrypted",
    "publicKey": "2.encrypted",
    "keyFingerprint": "2.encrypted"
  },
  "fields": [{"name": "2.encrypted", "value": "2.encrypted", "type": 0, "linkedId": null}],
  "favorite": false,
  "reprompt": 0,
  "archivedDate": null,
  "key": "2.encrypted-or-null"
}
```

### CipherApiResponse 完整字段

必须包含：`id`, `organizationId`, `folderId`, `type`, `name`, `notes`, `login`/`card`/`identity`/`secureNote`/`sshKey`, `fields`, `favorite`, `reprompt`, `key`, `revisionDate`, `creationDate`, `deletedDate`, `archivedDate`, `attachments`, `edit`, `viewPassword`, `permissions`, `collectionIds`, `object`, `organizationUseTotp`, `passwordHistory`, `data`, `encryptedFor`

**SSH Key 字段兼容性**：`sshKey.keyFingerprint` 必须在 sync 载荷中正确返回。Android 2026.2.0 要求该字段。需同时保留 `fingerprint` 别名。

**Attachment URL**：`attachments[].url` 必须非 null，格式 `/api/ciphers/${id}/attachment/${attachId}`
**Attachment size**：`size` 字段为字符串（`String(Number(a.size) || 0)`）

## 前端设计要求

### 设计规范

严格遵循 `docs/vault-editor-design-spec.md`：
- Section + Card 布局模式，section 间距 `mb-5` (20px)
- 字段标签 `13px / 700` (`--muted-strong`)
- 名称字段布局：图标列 + 输入列并列
- 分割按钮（密码登录 / 第三方登录）
- 自定义字段支持 Text(0), Hidden(1), Boolean(2), Linked(3)
- 右侧 `LinkedId` 下拉（Custom Field Type 3）

### 新增密码页面字段顺序

参照设计规范 Section 6.1，确保：
1. 标题行（类型名 + ★ 收藏）
2. 类型选择器
3. 名称（图标 + label + input，按 `name-field-group` 布局）
4. 网站（URI 列表 + 添加按钮）
5. 分割按钮（密码登录 / 第三方登录）
6. 用户名 + 密码 + TOTP（密码模式）
7. 或 平台 + 关联账号（第三方模式）
8. 卡片信息（card 类型时）
9. 身份信息（identity 类型时）
10. SSH Key 字段（ssh key 类型时）
11. 备注（notes）
12. 自定义字段
13. 附件
14. 附加选项（主密码二次确认）

## 优先级与实施顺序

### P1 — API 兼容性验证与修复
1. 验证 SSH Key `keyFingerprint` 在 `normalizeCipherSshKeyForCompatibility` 中的处理（已实现 ✅）
2. 验证 `cipherToResponse` 返回 `sshKey.keyFingerprint` 字段（已实现 ✅）
3. 确认 Attachment v2 端点路由存在
4. 确认前端提交的 `CipherCreateRequest` 使用正确 PascalCase/camelCase 字段名

### P2 — 前端新建密码流程重构
1. 按设计规范重构 VaultEditor 的 section 结构
2. 确保添加密码页面创建空 draft 时包含所有字段占位
3. 确保 `draftFromCipher` 正确读取所有解密字段
4. 验证类型切换时表单字段正确联动

### P3 — 端到端验证
1. 在客户端创建一个 Login 密码 → 验证 Web Vault 可见
2. 在 Web Vault 创建一个 Card → 验证客户端同步可见
3. 验证 SSH Key 和 Identity 类型的来回同步

## 成功标准

- SC-001: Android 客户端在 NodeWarden 服务端上可以完整执行创建/更新/删除密码
- SC-002: Web Vault 和 Android 客户端同步后数据完全一致
- SC-003: 所有 5 种 cipher 类型在两端均可创建
- SC-004: 自定义字段、附件、收藏等附属属性同步无误