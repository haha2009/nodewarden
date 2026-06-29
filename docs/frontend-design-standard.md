# NodeWarden 前端设计标准（Design Standard）

> **强制执行**：本文档是 NodeWarden 前端的唯一设计标准。所有设计师、前端工程师和 AI Agent 在开发新功能或修改现有功能时，必须严格遵守本文档的规则。
>
> **设计参考来源**：Bitwarden Web Vault 官方客户端。
> NodeWarden 是 Bitwarden 兼容服务端，前端设计遵循与 Bitwarden 一致的布局/间距/对齐模式。
>
> **优先级**：代码实现与本文档冲突时，优先修正代码，再更新本文档。

---

## 1. 设计令牌（Design Tokens）

所有颜色、间距、圆角、阴影、动画、字体必须使用 `webapp/src/styles/tokens.css` 中定义的 CSS 变量。

### 1.1 颜色

| 变量 | 亮色值 | 暗色值 | 用途 |
|------|--------|--------|------|
| `--panel` | `#ffffff` | `#151b24` | 卡片/面板背景 |
| `--panel-soft` | `#f8fafc` | `#111720` | 侧栏/顶栏背景 |
| `--panel-muted` | `#edf2f7` | `#0d1219` | 更暗的面板背景 |
| `--panel-subtle` | `#fbfcfe` | `#1a2230` | 微妙面板背景 |
| `--line` | `rgba(100,116,139,0.24)` | `rgba(148,163,184,0.16)` | 边框线 |
| `--line-soft` | `rgba(100,116,139,0.14)` | `rgba(148,163,184,0.09)` | 更淡边框（行间分隔线） |
| `--text` | `#0f172a` | `#f1f5f9` | 主文字 |
| `--muted` | `#64748b` | `#94a3b8` | 次要文字 |
| `--muted-strong` | `#334155` | `#cbd5e1` | 较强次要文字（标签） |
| `--primary` | `#2563eb` | `#60a5fa` | 主色调 |
| `--primary-hover` | `#1d4ed8` | `#93c5fd` | 主色调悬停 |
| `--primary-strong` | `#1e40af` | `#bfdbfe` | 深主色调 |
| `--brand` | `= --primary` | `= --primary` | 品牌色 |
| `--danger` | `#dc2626` | `#f87171` | 危险/删除 |
| `--success` | `#059669` | `#34d399` | 成功 |
| `--warning` | `#d97706` | `#fbbf24` | 警告 |

**规则**：
- 所有颜色必须使用 CSS 变量，**禁止**直接写 `#2563eb`、`white`、`#fff` 等硬编码值
- 需要半透明效果时使用 `color-mix(in srgb, var(--primary) 20%, transparent)`
- 暗色模式的所有颜色覆盖写在 `styles/dark.css` 中

### 1.2 圆角

| 变量 | 值 | 用途 |
|------|-----|------|
| `--radius-sm` | 6px | 小标签、折叠按钮 |
| `--radius-md` | 8px | 输入框、列表项、操作按钮、分组卡片 |
| `--radius-lg` | 10px | **卡片**（`.card`、`.fieldset-floating`） |
| `--radius-xl` | 14px | 分段控制器（segmented-control） |
| `--radius-2xl` | 18px | 名称图标框、侧栏块、对话框 |

**规则**：
- 卡片统一使用 `--radius-lg`（10px）
- 输入框使用 `--radius-md`（8px）
- 操作按钮使用 `--radius-md`（8px）
- 分段控制器使用 `--radius-xl`（14px / `rounded-xl`）
- 名称图标框使用 `--radius-2xl`（18px / `rounded-2xl`）
- 禁止随意使用其他圆角值

### 1.3 阴影

| 变量 | 值（亮色） | 用途 |
|------|-----------|------|
| `--shadow-sm` | `0 1px 3px rgba(15,23,42,0.06), 0 1px 2px rgba(15,23,42,0.04)` | **卡片**、浮起元素 |
| `--shadow-md` | `0 4px 6px -1px rgba(15,23,42,0.08), ...` | 列表项悬停、弹出层 |
| `--shadow-lg` | `0 20px 25px -5px rgba(15,23,42,0.10), ...` | 对话框 |
| `--shadow-glow` | `0 0 20px rgba(37,99,235,0.15), ...` | 聚焦光晕 |

**规则**：
- 卡片必须使用 `box-shadow: var(--shadow-sm)`
- **禁止**在暗色模式下移除卡片阴影
- 禁止自定义阴影值

### 1.4 间距

| 变量 | 值 | 用途 |
|------|-----|------|
| `--space-1` | 4px | 极小间隙 |
| `--space-2` | 8px | 标签与输入框间距、组内间隙 |
| `--space-3` | 12px | segmented control 间距、字段行间隙 |
| `--space-4` | 16px | **字段间距**、**卡片内边距** |
| `--space-5` | 20px | **卡片间距** |
| `--space-6` | 24px | 已弃用，新代码使用 `--space-5` |
| `--space-8` | 32px | 大块间距 |
| `--space-10` | 40px | 极宽间距 |

**规则**：
- 所有间距必须使用 `--space-*` 变量或对应 Tailwind 值（`mb-4` = 16px, `mb-5` = 20px）
- **禁止**使用非 token 的自定义间距值（如 `margin-bottom: 14px`、`padding: 22px`）

### 1.5 动画

| 变量 | 值 | 用途 |
|------|-----|------|
| `--dur-instant` | 80ms | 点击反馈 |
| `--dur-quick` | 120ms | 悬停态切换 |
| `--dur-fast` | 180ms | 标准过渡 |
| `--dur-medium` | 240ms | 面板展开 |
| `--dur-panel` | 280ms | 对话框出现 |
| `--ease-out-strong` | `cubic-bezier(0.22,1,0.36,1)` | 进入动画 |
| `--ease-out-soft` | `cubic-bezier(0.24,0.8,0.32,1)` | 面板动画 |
| `--ease-smooth` | `cubic-bezier(0.4,0,0.2,1)` | 标准过渡 |

---

## 2. 排印系统（Typography）

### 2.1 字体族

```css
--font-sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
  'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei UI',
  'Microsoft YaHei', 'Noto Sans CJK SC', 'Noto Sans SC', Arial, sans-serif;
--font-mono: 'SFMono-Regular', 'Cascadia Code', 'Cascadia Mono', Consolas,
  'Liberation Mono', monospace;
```

**规则**：所有 UI 文字使用 `--font-sans`；代码/密钥/数据使用 `--font-mono`；**禁止**引入其他字体。

### 2.2 字号与字重对照表（强制执行）

| 上下文 | 字号 | 字重 | 行高 | 颜色 | 出现位置 |
|--------|------|------|------|------|---------|
| 页面大标题（h1） | **26px** | 700 | 1.18 | `var(--text)` | 认证页、独立页面 |
| **卡片标题**（legend/h4） | **16px** | **700** | 1.2 | `var(--text)` | FloatingFieldset 标题、卡片 h4 |
| 列表项标题 | 15px | 600 | 1.25 | `var(--primary-strong)` | 密码库列表 `.list-title` |
| 正文/输入框文字 | 15px | 400 | 1.375 | `var(--text)` | `.input`、正文 |
| **字段标签**（`.field > span`） | **13px** | **700** | 1.375 | `var(--muted-strong)` | 表单字段标签 |
| 浮动标签（floating） | 14px→12px | 400 | 1.0 | `var(--muted)`→`var(--primary)` | FloatingLabelInput |
| 按钮文字 | 14px | 600 | 1.0 | `inherit` | `.btn` |
| 全宽按钮 | 16px | 600 | 1.0 | `inherit` | `.btn.full` |
| 辅助文字/副文本 | 14px | 400 | 1.625 | `var(--muted)` | `.detail-sub`、`.list-sub` |
| 极小文字/时间戳 | 11px | 400 | 1.5 | `var(--muted)` | `.list-count`、侧栏标题 |
| 侧栏标题 | 11px | 700 | 1.25 | `var(--muted)` | `.sidebar-title`（大写） |
| 分段按钮 | 14px | 600 | — | `inherit` | `.segmented-btn` |
| 自定义字段标签 | 11px | 700 | 1.2 | `var(--muted)` | `.custom-field-label` |
| 附件元信息 | 11px | 400 | — | `var(--muted)` | `.attachment-text span` |

### 2.3 字号速查

```
11px  → 侧栏标题（大写）、时间戳、自定义字段标签、附件元信息
13px  → 字段标签（.field > span）—— 唯一使用场景
14px  → 按钮文字、辅助文字、副文本、floating label、树节点
15px  → 正文、输入框文字（--font-base）、列表项标题
16px  → 卡片标题（--font-md）、全宽按钮
26px  → 认证页大标题
```

---

## 3. 按钮系统

### 3.1 基础按钮

```css
.btn {
  height: 38px;
  min-width: 38px;
  border-radius: var(--radius-md);  /* 8px */
  font-size: 14px;
  font-weight: 600;
  box-shadow: none;
  transition: all var(--dur-fast) var(--ease-smooth);
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:active:not(:disabled) { transform: translateY(0) scale(0.98); }
```

### 3.2 按钮尺寸

| 尺寸 | 高度 | 内边距 | 字号 | 使用场景 |
|------|------|--------|------|---------|
| 默认 `.btn` | 38px | `px-4` | 14px | 标准操作 |
| `.btn.small` | 32px | `px-2.5` | 14px | 卡片内操作、工具栏、附件操作 |
| `.btn.full` | 44px | `px-4` | 16px | 全宽按钮（如添加分组） |

### 3.3 按钮变体

| 变体 | 背景 | 边框 | 文字色 | 使用场景 |
|------|------|------|--------|---------|
| `.btn-primary` | `#2563eb` | 透明 | `#fff` | 主要操作（保存、确认） |
| `.btn-secondary` | `var(--panel)` | `var(--line)` | `var(--primary-strong)` | 次要操作（取消、添加、附件） |
| `.btn-danger` | `color-mix(danger 5%)` | `color-mix(danger 24%)` | `var(--danger)` | 危险操作（删除） |

### 3.4 输入框内按钮（Suffix Buttons）

```css
.field-floating-suffix .input-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);  /* 8px */
  border: none;
  background: transparent;
  color: var(--muted-strong);
}
.field-floating-suffix .input-icon-btn:hover {
  color: var(--primary);
  background: color-mix(in srgb, var(--primary) 8%, transparent);
}
```

**规则**：
- 输入框内按钮尺寸固定 32×32px，间距 2px
- 最多 3 个按钮并排（密码字段：生成+复制+可见性）
- 图标尺寸 16px（`size={16}`）或 18px（眼睛图标）
- 禁用态 `opacity: 0.4; cursor: not-allowed`

### 3.5 Icon 使用规则

| 场景 | 是否加 Icon | Icon 尺寸 | 说明 |
|------|------------|-----------|------|
| 主按钮（保存/确认） | ✅ CheckCheck | 14px | `btn-icon` class |
| 取消按钮 | ✅ X | 14px | `btn-icon` class |
| 删除按钮 | ✅ Trash2 | 14px | `btn-icon` class |
| 附件添加按钮 | ✅ Plus | 14px | 在 legend 右侧 |
| 附件下载按钮 | ✅ Download | 14px | 在附件行操作区 |
| 附件删除按钮 | ✅ X | 14px | 在附件行操作区 |
| 收藏按钮 | ✅ Star/StarOff | 14px | 在 legend 右侧 |
| 密码生成 | ✅ RefreshCw | 16px | 输入框内 suffix |
| 密码复制 | ✅ Copy/CheckCheck | 16px | 输入框内 suffix |
| 密码可见性 | ✅ Eye/EyeOff | 18px | 输入框内 suffix |
| TOTP 扫码 | ✅ QrCode | 18px | 输入框内 suffix |
| SSH 重新生成 | ✅ RefreshCw | 14px | 在 legend 右侧 |
| 添加分组 | ✅ Plus | 14px | 全宽按钮内 |
| 分组折叠 | ✅ ChevronRight/Down | 14px | 组头左侧 |
| 分组/登录删除 | ✅ X | 14px | 无文字，纯图标 |
| 自定义字段添加 | ✅ Plus | 14px | 带文字 |
| AI 自动识别 | ✅ Sparkles | 16px | 输入框内 suffix |
| 附件文件图标 | ✅ Paperclip | 14px | 附件行左侧 |
| 附件上传图标 | ✅ Upload | 14px | 新附件行左侧 |
| 平台选择 | ✅ PlatformIcon | — | 第三方登录 |

**规则**：
- 操作按钮**必须**带 icon，纯文字按钮仅用于 "Confirm"、"Cancel"、"Favorite"、"Add Field"、"Add Group"
- Icon 统一使用 `lucide-preact` 库
- Icon class 使用 `className="btn-icon"`（自动 `shrink-0`）
- 输入框内 suffix icon 不需要 `btn-icon` class，直接用 `size={16}` 或 `size={18}`

---

## 4. 卡片（Card / FloatingFieldset）

### 4.1 基础卡片样式

```css
.fieldset-floating {
  position: relative;
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);    /* 10px */
  background: var(--panel);
  box-shadow: var(--shadow-sm);        /* 必须 */
  padding: 16px;
  margin: 0 0 20px 0;
  min-height: 56px;
}
```

**规则**：
- 圆角必须是 `var(--radius-lg)`（10px）
- **必须**有 `box-shadow: var(--shadow-sm)`
- 内边距必须是 `16px`
- 边框必须使用 `1px solid var(--line)`

### 4.2 卡片间距

- 卡片之间 `margin-bottom: 20px`
- 最后一张卡片 `margin-bottom: 0`

### 4.3 卡片标题（Floating Legend）

```css
.fieldset-floating-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
}
```

- 标题绝对定位浮于卡片顶部边框之上
- 编辑按钮使用文本符号 `✎`（14px），`color: var(--muted)`，hover `var(--text)`
- 右侧 accessory 区域（收藏按钮、添加按钮等）通过 `titleAccessory` prop 传入
- 编辑模式：标题变为底部边框输入框，16px/700，带 ✓/✕ 操作按钮

### 4.4 传统卡片（Identity 类型使用）

```css
.card {
  border-radius: var(--radius-lg);
  background: var(--panel);
  box-shadow: var(--shadow-sm);
  padding: 16px;
}
.card h4 {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  margin-bottom: 12px;
}
```

---

## 5. 输入控件

### 5.1 FloatingLabelInput（标准输入控件）

```tsx
<FloatingLabelInput
  label="用户名"
  value={value}
  onInput={(v) => setValue(v)}
  type="text"
  disabled={false}
>
  {/* 右侧按钮区域 — 可选 */}
  <button className="input-icon-btn"><RefreshCw size={16} /></button>
  <button className="input-icon-btn"><Copy size={16} /></button>
</FloatingLabelInput>
```

**样式规则**：
- 输入框高度 `44px`，`padding-top: 10px`（给浮动标签留空间）
- 浮动标签：未聚焦时居中 14px，聚焦/有值时缩放上浮至 12px（`scale(0.85)`），颜色变 `var(--primary)`
- 有 suffix 按钮时，输入框右侧预留空间 `calc(8px + count * 36px)`
- 按钮区域 `.field-floating-suffix` 绝对定位于右侧

### 5.2 传统字段（Field）

```html
<label class="field">
  <span>标签文本</span>
  <input class="input" />
</label>
```

- 字段间距 `margin-bottom: 12px`（用于 textarea 等非 floating 场景）
- 标签字号固定 `13px`，`font-weight: 700`

### 5.3 输入框（Input）

```css
.input {
  height: 42px;  /* floating 模式为 44px */
  border-radius: var(--radius-md);   /* 8px */
  border: 1px solid rgba(74,103,150,0.34);
  background: var(--panel);
  padding: 0 14px;
  font-size: 15px;
  color: var(--text);
}
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 14%, transparent);
  transform: translateY(-1px);
}
```

**规则**：
- 只读态：`background: var(--panel-muted); color: var(--muted)`
- 禁用态：`background: var(--panel-muted); color: var(--muted); cursor: not-allowed`
- 文本域：`min-height: 96px`（`.textarea`）

### 5.4 字段布局

| 布局类型 | class | 使用场景 |
|----------|-------|---------|
| 单列 | 默认 | 标准表单字段 |
| 双列网格 | `.field-grid` | 卡片详情、身份信息 |
| 水平行 | `.field-row` | 类型+标签选择器并排 |
| 紧凑字段 | `.field-compact` | 在 `.field-row` 内使用 |

```css
.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 16px;
}
.field-row {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
```

### 5.5 分段控制器（Segmented Control）

```css
.segmented-control {
  border-radius: var(--radius-xl);  /* 14px */
  border: 1px solid var(--line);
  background: var(--panel-soft);
  margin-bottom: 12px;
}
.segmented-btn {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}
.segmented-btn.active {
  background: var(--panel);
  color: var(--brand);
  box-shadow: var(--shadow-sm);
}
```

- 用于登录类型切换（密码登录 / 第三方登录）
- 按钮内可包含 SVG 图标（16px）+ 文字

### 5.6 名称字段布局

```css
.name-field-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.name-icon-box {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-2xl);  /* 18px */
  background: var(--panel-soft);
  border: 1px solid var(--line);
}
.name-field-input-block {
  flex: 1;
}
```

---

## 6. 附件系统

### 6.1 附件行

```css
.attachment-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line-soft);
}
.attachment-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.attachment-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.attachment-text span {
  font-size: 11px;
  color: var(--muted);
}
```

- 左侧：Paperclip/Upload 图标 + 文件名（bold）+ 大小（11px muted）
- 右侧：操作按钮组（`.kv-actions`），包含下载/删除按钮
- 删除态：`opacity: 0.6` + 文件名删除线

### 6.2 空状态

```html
<div class="detail-sub">暂无附件</div>
```

---

## 7. 自定义字段

### 7.1 自定义字段卡片

```css
.custom-field-card {
  display: grid;
  gap: 8px;
  padding: 10px 0;
  border-bottom: 1px solid var(--line-soft);
}
.custom-field-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--muted);
  line-height: 1.2;
}
.custom-field-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
}
```

### 7.2 复选框行

```css
.check-line {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: var(--muted-strong);
}
```

---

## 8. 分组系统（Login Groups）

### 8.1 分组卡片

```css
.group-card {
  margin-bottom: 12px;
  border-radius: var(--radius-md);  /* 8px */
  border: 1px solid var(--line-soft);
  background: var(--panel-soft);
}
```

### 8.2 分组头部

```css
.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}
.group-collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);  /* 6px */
  background: transparent;
  border: none;
  color: var(--muted);
}
.group-title-input {
  height: 36px;
  border-radius: var(--radius-md);  /* 8px */
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
}
.group-title-input:focus {
  border-color: var(--primary);
  background: var(--panel);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
}
.group-name-input {
  height: 36px;
  border-radius: var(--radius-md);  /* 8px */
  border: 1px solid transparent;
  background: transparent;
}
.group-body {
  padding: 4px 12px 12px;
}
.group-login-card {
  margin-bottom: 12px;
  border-radius: var(--radius-md);  /* 8px */
  border: 1px solid var(--line);
  background: var(--panel);
  padding: 12px;
}
.group-login-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
```

### 8.3 分组标签

```css
.group-logins-label,
.group-section-label {
  margin: 8px 0 4px;
  font-size: var(--font-xs);  /* 11px */
  font-weight: 600;
  color: var(--muted);
  letter-spacing: 0.02em;
}
```

---

## 9. 对话框（Dialog）

### 9.1 基础对话框

```css
.dialog-card {
  border-radius: var(--radius-2xl);  /* 18px ~ 20px */
  border: 1px solid var(--line);
  background: var(--panel);
  box-shadow: var(--shadow-lg);
  padding: 20px;
  width: min(500px, 100%);
}
.dialog-title {
  font-size: var(--font-3xl);  /* 25px */
  margin: 6px 0;
}
.dialog-btn {
  height: 50px;
  width: 100%;
  font-size: var(--font-xl);  /* 19px */
  margin-top: 8px;
}
```

### 9.2 密码生成器对话框

- 使用 `.pw-gen-dialog` 自定义样式
- 包含密码预览、长度滑块、字符集选项、应用按钮

---

## 10. 暗色模式

### 10.1 实现方式

- 所有暗色模式样式写在 `styles/dark.css` 中
- 使用 `:root[data-theme='dark']` 选择器
- **禁止**在组件 JS 中判断主题后内联样式

### 10.2 暗色模式规则

- 面板背景变深、边框更透明、主色调变亮
- 卡片阴影由 `tokens.css` 中的暗色 `--shadow-sm` 自动处理
- **禁止**在暗色模式下移除卡片阴影
- 所有颜色引用必须使用 CSS 变量

---

## 11. CSS 编码规范

### 11.1 样式优先级

1. **Tailwind utility** — 单次布局或间距（`mb-4`, `flex`, `gap-3`）
2. **CSS 变量** — 颜色、圆角、阴影、动画
3. **`@apply` 指令** — 复用多个 Tailwind 工具的组合
4. **硬编码值** — 仅当超出 token 体系时（13px 字段标签、26px 页面标题）

### 11.2 禁止事项

| 禁止 | 原因 |
|------|------|
| ❌ 非 `--space-*` 的自定义间距值 | 破坏间距一致性 |
| ❌ 字段标签使用 `var(--font-sm)` | 必须固定 13px |
| ❌ 卡片标题使用 13px 或 14px | 必须 16px |
| ❌ `!important`（动画激活态除外） | 破坏样式层叠 |
| ❌ ID 选择器 | specificity 过高 |
| ❌ 修改 `tokens.css` 中的变量值 | 令牌是基础，不可变 |
| ❌ 硬编码颜色值 | 暗色模式无法适配 |
| ❌ 非标准字号（12px、18px、22px 等） | 破坏排印一致性 |
| ❌ 卡片 `box-shadow: none` | 卡片必须有阴影 |
| ❌ 卡片 `border-radius` 非 `--radius-lg` | 必须 10px |

### 11.3 类命名规范

- 使用 **kebab-case**（如 `.field-row`, `.detail-actions`）
- 语义化命名（`.name-field-group` 而非 `.flex-row-mb-4`）
- 组件前缀：`vault-*`, `pw-gen-*`, `totp-scan-*`, `bottom-sheet-*`
- 状态后缀：`.active`, `.open`, `.is-removed`, `.is-editing`

---

## 12. i18n 规范

- 所有用户可见文字走 `t('txt_xxx')` 模式
- 中英文必须同步维护（`en.ts` + `zh-CN.ts`）
- Key 格式：`txt_<英文描述>`
- 新增文本后必须运行 `npm run i18n:validate`

---

## 13. 文件结构

```
webapp/src/
├── components/vault/       # 密码库相关组件
├── styles/
│   ├── tokens.css          设计变量（被所有文件引用）— 禁止修改值
│   ├── forms.css           通用表单样式（按钮/输入框/选择框）
│   ├── vault.css           密码库编辑器/列表样式
│   ├── management.css      管理后台样式
│   ├── overlays.css        对话框/遮罩层
│   ├── auth.css            认证页面样式
│   ├── responsive.css      响应式布局
│   ├── dark.css            暗色模式
│   └── styles.css          全局样式
└── lib/i18n/locales/
    ├── en.ts
    └── zh-CN.ts
```

---

## 14. 新增功能开发 Checklist

开发新功能时，必须逐项检查：

- [ ] 所有颜色使用 CSS 变量（`var(--xxx)`），无硬编码
- [ ] 所有间距使用 `--space-*` 变量或对应 Tailwind 值
- [ ] 卡片使用 `border-radius: var(--radius-lg)` + `box-shadow: var(--shadow-sm)` + `padding: 16px`
- [ ] 卡片标题使用 `16px / 700 / var(--text)`
- [ ] 字段标签使用 `13px / 700 / var(--muted-strong)`（硬编码 13px）
- [ ] 字段间距使用 `margin-bottom: 16px`（`--space-4`）
- [ ] 卡片间距使用 `margin-bottom: 20px`（`--space-5`）
- [ ] 按钮使用标准变体（`btn-primary`, `btn-secondary`, `btn-danger`）
- [ ] 圆角使用 `--radius-*` 变量
- [ ] 暗色模式适配（`dark.css` 中检查）
- [ ] 所有用户文本使用 `t('txt_xxx')` + 中英文翻译
- [ ] 响应式适配（≤ 1180px / ≤ 640px）
- [ ] 动画使用 `transform` + `opacity`，使用 `--dur-*` / `--ease-*` 变量
- [ ] Icon 使用 `lucide-preact`，尺寸按规范（14px/16px/18px）

---

*本文档作为前端开发的唯一设计标准，所有 UI 实现必须与此规范一致。发现偏差时优先修正代码，再更新本文档。*
