# PRD: 动态卡片设计器（Dynamic Card Designer）

> **版本**: v1.0  
> **日期**: 2026-06-29  
> **状态**: 前端已实现，服务端持久化待开发  
> **作者**: NodeWarden Team  

---

## 1. 概述（Overview）

### 1.1 背景

NodeWarden 现有的密码库卡片（Vault Editor 中的登录信息、身份信息、卡片信息等）是**硬编码模板**——每个卡片类型有固定的字段布局。用户无法自定义卡片结构，无法为不同网站/类型创建差异化的信息卡片。

### 1.2 目标

构建一个**服务器驱动的卡片渲染系统**：
- 卡片结构由 JSON Schema 定义，服务端下发
- 前端通过 `DynamicCard` 组件递归渲染任意嵌套的卡片结构
- 提供**可视化卡片设计器**（Card Designer），让用户拖拽设计卡片
- 支持 16 种字段类型、无限嵌套子卡片

### 1.3 核心价值

| 用户痛点 | 解决方案 |
|---------|---------|
| 固定模板不灵活 | 动态 Schema 驱动，每个卡片可完全不同 |
| 无法自定义字段 | 16 种字段类型自由组合 |
| 嵌套信息无法表达 | 支持卡片内嵌套子卡片（无限深度） |
| 操作不直观 | 可视化拖拽设计器，所见即所得 |

---

## 2. 数据模型（Data Model）

### 2.1 DynamicCardSchema（卡片）

```typescript
interface DynamicCardSchema {
  key: string;              // 唯一标识（UUID）
  title: string;            // 卡片标题（显示在 floating legend 中）
  titleEditable?: boolean;  // 标题是否可编辑
  description?: string;     // 卡片描述（标题下方灰色文字）
  fields?: DynamicFieldSchema[];  // 字段列表
  children?: DynamicCardSchema[]; // 嵌套子卡片
  collapsed?: boolean;      // 是否默认折叠
  variant?: 'default' | 'accent' | 'warning';  // 视觉变体
}
```

### 2.2 DynamicFieldSchema（字段）

```typescript
interface DynamicFieldSchema {
  key: string;              // 唯一标识
  type: DynamicFieldType;   // 字段类型（决定渲染控件）
  label: string;            // 字段标签
  value?: string;           // 当前值（toggle 用 'true'/'false'）
  placeholder?: string;     // 占位符文本
  required?: boolean;       // 是否必填
  disabled?: boolean;       // 是否禁用
  hint?: string;            // 辅助提示文字
  options?: Array<{label: string; value: string}>;  // select 选项
  variant?: 'primary' | 'secondary' | 'danger';     // button 样式
  action?: string;          // button 触发的服务端动作
  href?: string;            // link 跳转地址
  accept?: string;          // upload 接受的文件类型
  min?: number;             // number 最小值
  max?: number;             // number 最大值
  meta?: Record<string, unknown>;  // 扩展字段
}
```

### 2.3 支持的字段类型（16 种）

| type 值 | 说明 | 渲染控件 | 特殊属性 |
|---------|------|---------|---------|
| `text` | 单行文本 | `<input type="text">` | placeholder |
| `password` | 密码 | `<input type="password">` + 可见性切换 | — |
| `textarea` | 多行文本 | `<textarea>` | rows=3 |
| `markdown` | Markdown 文本 | `<textarea>` | rows=3 |
| `toggle` | 开关 | `<input type="checkbox">` | value='true'/'false' |
| `button` | 按钮 | `<button>` | variant, action |
| `upload` | 文件上传 | `<button>` + 文件选择 | accept |
| `select` | 下拉选择 | `<select>` | options |
| `number` | 数字 | `<input type="number">` | min, max |
| `email` | 邮箱 | `<input type="email">` | — |
| `phone` | 电话 | `<input type="tel">` | — |
| `url` | 网址 | `<input type="url">` | — |
| `date` | 日期 | `<input type="date">` | — |
| `color` | 颜色 | `<input type="color">` | — |
| `link` | 跳转链接 | `<a target="_blank">` | href |
| `markdown` | Markdown | `<textarea>` | rows=3 |

---

## 3. 前端架构（Frontend Architecture）

### 3.1 组件结构

```
VaultEditor.tsx
├── [按钮] 打开卡片设计器 → designerOpen = true
└── createPortal → CardDesigner（弹窗）
    ├── CardDesignerToolbar（撤销/重做/预览切换）
    ├── CardDesignerBody（三栏布局）
    │   ├── Palette（左侧面板：字段选择）
    │   ├── Canvas（中间：卡片树编辑区）
    │   │   └── DesignerCardNode（递归）
    │   │       ├── CardHeader（标题 + 操作按钮）
    │   │       ├── EmptyState（空状态引导）
    │   │       ├── Fields（字段列表）
    │   │       │   └── DesignerFieldItem（单个字段）
    │   │       │       ├── DragHandle（拖拽手柄）
    │   │       │       ├── FieldBody（标签 + 类型标记）
    │   │       │       └── Actions（复制/删除按钮）
    │   │       ├── QuickAdd（快速添加按钮）
    │   │       └── Children（递归子卡片）
    │   └── Properties（右侧属性面板）
    │       ├── FieldProperties（字段属性编辑）
    │       └── CardProperties（卡片属性编辑）
    └── ToastStack（底部通知）
```

### 3.2 状态管理

```
CardDesigner 组件内部状态：
├── localSchema: DynamicCardSchema     // 本地编辑中的 schema
├── selectedFieldKey: string | null   // 当前选中字段
├── selectedCardKey: string | null    // 当前选中卡片
├── previewMode: boolean              // 预览/编辑模式切换
├── inlineEditKey: string | null      // 内联编辑中的字段
├── historyRef: DynamicCardSchema[]   // 撤销历史（50步）
├── historyIndexRef: number           // 当前历史位置
├── dragItem: { type, fromPalette, fieldKey, cardKey }  // 拖拽项
├── dragOver: string | null           // 拖拽悬停的卡片 key
└── dragOverField: { cardKey, index, pos }  // 拖拽悬停的字段位置
```

### 3.3 数据流

```
用户操作 → 树操作函数 → commit(next) → setLocalSchema + props.onChange + pushHistory
                ↓
         props.onChange(next) → VaultEditor.setDynamicSchema → 父组件状态更新
```

### 3.4 树操作函数（纯函数，递归处理）

| 函数 | 功能 |
|------|------|
| `addToCard(root, cardKey, field)` | 向指定卡片添加字段 |
| `addToCardChildren(root, parentKey, child)` | 向指定卡片添加子卡片 |
| `removeFromCard(root, cardKey, fieldKey)` | 从卡片删除字段 |
| `removeCardRecursive(root, cardKey)` | 递归删除卡片 |
| `updateFieldInCard(root, cardKey, fieldKey, patch)` | 更新字段属性 |
| `updateCardRecursive(root, cardKey, patch)` | 更新卡片属性 |
| `insertAfterField(root, cardKey, afterKey, field)` | 在指定字段后插入 |
| `reorderFieldsInCard(root, cardKey, from, to)` | 字段重排序 |
| `findField(root, fieldKey)` | 递归查找字段 |
| `findCard(root, cardKey)` | 递归查找卡片 |

---

## 4. 功能规格（Feature Specification）

### 4.1 卡片渲染（DynamicCard）

| 功能 | 描述 | 状态 |
|------|------|------|
| 递归渲染 | 卡片可无限嵌套子卡片 | ✅ 已完成 |
| 16 种字段类型 | text/password/textarea/toggle/button/upload/select/number/email/phone/url/date/color/link/markdown | ✅ 已完成 |
| 卡片变体 | default/accent/warning 三种视觉风格 | ✅ 已完成 |
| 折叠/展开 | 子卡片可折叠，显示数量标记 | ✅ 已完成 |
| 标题可编辑 | 双击标题进入编辑模式 | ✅ 已完成 |
| 只读模式 | designMode=false 时渲染纯展示卡片 | ✅ 已完成 |

### 4.2 卡片设计器（Card Designer）

| 功能 | 描述 | 状态 |
|------|------|------|
| 三栏布局 | 左侧面板 + 中间画布 + 右侧属性 | ✅ 已完成 |
| 点击添加字段 | 从左侧面板点击字段类型添加到根卡片 | ✅ 已完成 |
| 拖拽添加字段 | 从左侧面板拖拽字段到卡片 | ✅ 已完成 |
| 拖拽排序 | 在卡片内拖拽字段调整顺序 | ✅ 已完成 |
| 跨卡片拖拽 | 将字段从一个卡片拖到另一个卡片 | ✅ 已完成 |
| 添加子卡片 | 点击添加嵌套子卡片 | ✅ 已完成 |
| 删除字段/卡片 | 选中后点击删除按钮 | ✅ 已完成 |
| 复制字段 | 点击复制按钮克隆字段 | ✅ 已完成 |
| 双击编辑标签 | 双击字段标签进入内联编辑 | ✅ 已完成 |
| 属性面板 | 右侧面板编辑选中项的属性 | ✅ 已完成 |
| 撤销/重做 | 工具栏按钮，最多 50 步历史 | ✅ 已完成 |
| 删除 Toast | 删除字段后显示可撤销的 toast | ✅ 已完成 |
| 预览模式 | 切换编辑/预览，隐藏所有设计 chrome | ✅ 已完成 |
| 空状态引导 | 空卡片显示引导文字和图标 | ✅ 已完成 |
| 悬停交互 | 拖拽手柄和操作按钮仅在悬停时显示 | ✅ 已完成 |
| 拖拽指示线 | 蓝色横线指示放置位置 | ✅ 已完成 |
| 属性面板动画 | 选择项时面板从右侧滑入 | ✅ 已完成 |

### 4.3 待开发功能

| 功能 | 优先级 | 描述 |
|------|--------|------|
| 服务端持久化 | P0 | Schema 保存到 D1 数据库，下次加载时渲染 |
| JSON 导入/导出 | P1 | 手动编辑/备份 Schema |
| i18n 翻译 | P1 | 设计器界面文本国际化 |
| 字段验证规则 | P2 | required + 自定义 validator |
| 服务端动作 | P2 | button 类型触发服务端 action |
| 模板系统 | P2 | 从模板创建卡片 |
| 暗色模式适配 | P3 | 设计器弹窗暗色模式 |

---

## 5. 服务端接口设计（API Design）

### 5.1 存储方案

动态卡片 Schema 存储在 `cipher` 记录的 `dynamicSchema` 字段中（JSON 文本）。

```sql
-- 在 ciphers 表新增列
ALTER TABLE ciphers ADD COLUMN dynamic_schema TEXT DEFAULT NULL;
```

### 5.2 API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| `GET` | `/api/ciphers/:id/dynamic-schema` | 获取指定卡片的动态 Schema |
| `PUT` | `/api/ciphers/:id/dynamic-schema` | 更新指定卡片的动态 Schema |
| `POST` | `/api/ciphers/:id/dynamic-schema/validate` | 校验 Schema 合法性 |
| `GET` | `/api/dynamic-cards/templates` | 获取卡片模板列表 |
| `POST` | `/api/dynamic-cards/templates` | 创建卡片模板 |

### 5.3 Schema 校验规则

```typescript
interface SchemaValidationResult {
  valid: boolean;
  errors: Array<{
    path: string;       // 错误路径，如 "children[0].fields[2].label"
    message: string;    // 错误描述
  }>;
}
```

校验项：
- `key` 必须存在且唯一
- `type` 必须是合法的 DynamicFieldType
- `label` 不能为空
- `select` 类型必须有 `options`
- `link` 类型 `href` 必须是合法 URL
- 嵌套深度不超过 10 层

---

## 6. 文件清单（File Inventory）

### 6.1 新增文件

| 文件 | 描述 |
|------|------|
| `webapp/src/components/DynamicCard.tsx` | 动态卡片渲染器（递归组件） |
| `webapp/src/components/CardDesigner.tsx` | 卡片设计器（三栏布局 + 工具栏） |
| `webapp/src/lib/types.ts` (修改) | 新增 DynamicCardSchema / DynamicFieldSchema 类型 |

### 6.2 修改文件

| 文件 | 修改内容 |
|------|---------|
| `webapp/src/components/vault/VaultEditor.tsx` | 添加设计器弹窗、Toast 渲染、Schema 状态 |
| `webapp/src/styles.css` | 新增设计器 CSS（约 400 行） |

---

## 7. UX 设计规范

### 7.1 设计器弹窗尺寸

```
宽度: min(960px, calc(100vw - 32px))
最大高度: calc(100vh - 64px)
三栏网格: 180px | 1fr | 220px
```

### 7.2 交互反馈

| 交互 | 反馈 |
|------|------|
| 悬停字段行 | 显示拖拽手柄 + 操作按钮（淡入 150ms） |
| 选中字段行 | 蓝色左边框 + 浅蓝背景 |
| 拖拽经过字段 | 蓝色横线指示放置位置（before/after） |
| 删除字段 | 底部 toast 弹出，带"撤销"按钮 |
| 选择项切换 | 属性面板从右侧滑入（200ms） |
| 添加字段 | 新字段自动选中，属性面板更新 |
| 空卡片 | 虚线边框 + 引导文字"从左侧拖入字段" |

### 7.3 动画时序

| 动画 | 时长 | 缓动函数 |
|------|------|---------|
| 操作按钮淡入 | 150ms | ease-smooth |
| 属性面板滑入 | 200ms | ease-smooth |
| Toast 弹出 | 200ms | ease-smooth |
| 拖拽指示线 | 即时 | — |
| 快速添加按钮显示 | 120ms | ease-smooth |

---

## 8. 技术约束

### 8.1 框架约束

- **Preact**（非 React）— 使用 `preact/hooks`、`preact/compat`
- **lucide-preact** 图标库
- **CSS Variables** 设计令牌系统（`tokens.css`）
- **无拖拽库** — 原生 HTML5 Drag API 实现

### 8.2 性能约束

- Schema 深度不超过 10 层
- 单个卡片字段数建议不超过 50 个
- 历史记录最多 50 步（深拷贝存储）
- 设计器弹窗最大高度 `calc(100vh - 64px)`

### 8.3 兼容性

- 暗色模式：通过 `data-theme='dark'` CSS 变量自动适配
- 响应式：弹窗在移动端自动缩小宽度
- 浏览器：Chrome/Firefox/Safari 最新版

---

## 9. 验收标准（Acceptance Criteria）

### 9.1 前端渲染

- [x] `DynamicCard` 能渲染所有 16 种字段类型
- [x] 嵌套子卡片能正确递归渲染
- [x] 卡片折叠/展开功能正常
- [x] 只读模式下所有控件正确显示

### 9.2 设计器功能

- [x] 点击左侧面板添加字段到卡片
- [x] 拖拽排序字段（含视觉指示线）
- [x] 双击字段标签内联编辑
- [x] 属性面板实时编辑字段/卡片属性
- [x] 撤销/重做功能正常（50步）
- [x] 删除字段后 toast 可撤销
- [x] 预览模式切换正常
- [x] 空状态引导正确显示

### 9.3 代码质量

- [x] TypeScript 类型检查通过（`tsc --noEmit`）
- [x] 构建成功（`npm run build`）
- [x] 遵循 `frontend-design-standard.md` 设计规范
- [x] 所有用户文本使用 `t('txt_xxx')` + 中英文翻译

---

## 10. 开发里程碑

| 阶段 | 内容 | 状态 |
|------|------|------|
| Phase 1 | 数据模型定义（types.ts） | ✅ 完成 |
| Phase 2 | DynamicCard 渲染组件 | ✅ 完成 |
| Phase 3 | CardDesigner 三栏布局 | ✅ 完成 |
| Phase 4 | 拖拽排序 + 属性面板 | ✅ 完成 |
| Phase 5 | UX 优化（悬停/空状态/撤销/预览/Toast） | ✅ 完成 |
| Phase 6 | 服务端持久化 + API | 🔲 待开发 |
| Phase 7 | JSON 导入/导出 | 🔲 待开发 |
| Phase 8 | i18n 国际化 | 🔲 待开发 |

---

*本文档为 NodeWarden 动态卡片设计器的完整产品需求文档，作为后续开发和 review 的基准。*
