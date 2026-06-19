# NodeWarden 前端设计规范

> 本文档是 NodeWarden 前端的唯一设计参考标准，涵盖所有页面组件。
> 所有前端开发必须严格遵循，发现不一致时优先更新代码，然后更新本文档。
>
> **设计参考来源**：Bitwarden Web Vault 官方客户端（Angular + Tailwind）。
> NodeWarden 是 Bitwarden 兼容服务端，前端设计遵循与 Bitwarden 一致的布局/间距/对齐模式。

---

## 1. 设计系统基础

### 1.1 CSS 变量体系（Design Tokens）

所有颜色、间距、圆角、阴影、动画缓动函数均使用 CSS 变量定义，见 `tokens.css`。

```css
/* 颜色 */
--panel: #ffffff;                     /* 卡片/面板背景 */
--panel-soft: #f8fafc;               /* 稍暗的面板背景（侧栏/顶栏） */
--panel-muted: #edf2f7;              /* 更暗的面板背景 */
--line: rgba(100, 116, 139, 0.24);    /* 边框线 */
--line-soft: rgba(100, 116, 139, 0.14); /* 更淡边框 */
--text: #0f172a;                      /* 主文字 */
--muted: #64748b;                     /* 次要文字 */
--muted-strong: #334155;             /* 较强次要文字（标签） */
--primary / --brand: #2563eb;        /* 主色调 / 品牌色 */
--primary-hover: #1d4ed8;
--danger: #dc2626;                    /* 危险/删除操作 */
--success: #059669;                   /* 成功状态 */
--warning: #d97706;                   /* 警告 */

/* 圆角 */
--radius-sm: 6px;    --radius-md: 8px;   --radius-lg: 10px;
--radius-xl: 14px;   --radius-2xl: 18px;

/* 阴影 */
--shadow-sm;  --shadow-md;  --shadow-lg;  --shadow-xl;  --shadow-glow;

/* 动画缓动 */
--ease-out-strong: cubic-bezier(0.22, 1, 0.36, 1);
--ease-out-soft: cubic-bezier(0.24, 0.8, 0.32, 1);
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* 动画时长 */
--dur-instant: 80ms;   --dur-quick: 120ms;   --dur-fast: 180ms;
--dur-medium: 240ms;   --dur-panel: 280ms;   --dur-slow: 350ms;

/* 间距 */
--space-1: 4px;   --space-2: 8px;   --space-3: 12px;
--space-4: 16px;  --space-5: 20px;  --space-6: 24px;
--space-8: 32px;  --space-10: 40px;

/* 字体 */
--font-sans: Inter, ui-sans-serif, ...;
--font-xs: 11px;  --font-sm: 14px;  --font-base: 15px;
--font-md: 16px;  --font-lg: 17px;  --font-xl: 19px;  --font-2xl: 21px;
```

### 1.2 暗色模式

所有暗色模式样式定义在 `tokens.css` 的 `:root[data-theme='dark']` 中。
暗色模式下面板背景变深、边框更透明、主色调变亮、阴影更深。

### 1.3 响应式断点

- `max-width: 1180px` — 平板/小屏：三栏变单栏，移动端 tab bar 出现
- `max-width: 640px` — 手机：更紧凑的间距，全屏对话框

---

## 2. 排印系统（Typography）

### 2.1 字体使用规则

所有文字必须使用 `--font-sans` 或 `--font-mono`，禁止引入其他字体。

### 2.2 字号与字重对照表

| 上下文 | 字号 | 字重 | 实现方式 |
|--------|------|------|---------|
| 页面标题（h1） | 26px | 700 | `@apply text-[26px] font-bold` |
| 卡片标题（h3/h4） | 16px | 700 | `font-size: 16px; font-weight: 700` |
| 正文/输入框文字 | 15px | 400 | `font-size: var(--font-base)` |
| **字段标签**（field > span） | **13px** | **700** | **硬编码，不使用变量** |
| 按钮文字 | 14px | 600 | `font-size: var(--font-sm)` |
| 全宽按钮 | 16px | 600 | `font-size: var(--font-md)` |
| 辅助文字/副文本 | 14px | 400 | `font-size: var(--font-sm)` |
| 极小文字/时间戳 | 11px | 400 | `font-size: var(--font-xs)` |
| segment 按钮 | 14px | 600 | `text-sm font-semibold` |

> **关键规则**：字段标签统一使用 `13px / Bold 700`，不随 `--font-sm` (14px) 变化。
> 这是系统的一致性约定，不是疏漏。

### 2.3 文字颜色

| 用途 | 颜色变量 |
|------|---------|
| 主文字 | `var(--text)` |
| 字段标签 | `var(--muted-strong)` |
| 次要文字 | `var(--muted)` |
| 品牌色文字/链接 | `var(--brand)` |
| 危险操作 | `var(--danger)` |

---

## 3. 布局系统

### 3.1 页面网格

```css
.vault-grid {
  grid-template-columns: 270px minmax(400px, 36%) minmax(400px, 1fr);
  /* 侧边栏 | 列表 | 详情 */
}
```

### 3.2 间距体系

所有间距必须使用 `--space-*` token 或 Tailwind 对应值：

| Token | 值 | Tailwind | 用途 |
|-------|-----|----------|------|
| `--space-1` | 4px | `gap-1`, `p-1` | 极小间隙 |
| `--space-2` | 8px | `gap-2`, `mb-2` | 标签与输入框间距 |
| `--space-3` | 12px | `gap-3`, `mb-3` | 卡片间距、按钮组 |
| `--space-4` | 16px | `gap-4`, `mb-4` | 字段间距、卡片内边距 |
| `--space-5` | 20px | `gap-5`, `mb-5` | **Section 间距**（固定 20px） |
| `--space-6` | 24px | `gap-6` | 更大间距 |
| `--space-8` | 32px | `gap-8` | 大块间距 |
| `--space-10` | 40px | `gap-10` | 极宽间距 |

### 3.3 Section + Card 模式

所有表单页面的基本结构，参考 Bitwarden 官方设计。每个功能区块都是一个 **section**：

```html
<!-- Section 标准模板 -->
<section class="mb-5">     <!-- --space-5 = 20px 固定间距 -->
  <div class="section-head">
    <h3 class="detail-title">登录凭据</h3>  <!-- 16px / 700 -->
  </div>
  <div class="card">
    <label class="field">
      <span>用户名</span>
      <input class="input" />
    </label>
    <label class="field">
      <span>密码</span>
      <input class="input" />
    </label>
  </div>
</section>
```

**关键规则**：
- **Section 间距**：section 之间 `margin-bottom: 20px`（`--space-5` / `mb-5`）
- **每个 section**：含一个 section-head + 一个 card
- **不能有裸 card**：card 必须包裹在 section 中
- **Section header**：统一 `h3.detail-title`（16px, 700）
- **最后一个 field**：用 `last-child` 或 `disableMargin` 去除底部间距

```css
/* Section 之间间距 */
section {
  margin-bottom: 20px;     /* --space-5，参考 Bitwarden tw-mb-5 */
}
section:last-child {
  margin-bottom: 0;        /* 最后一个去除底部间距 */
}

/* Section header */
.section-head {
  margin-bottom: 10px;     /* --space-2.5，header 到 card 间距 */
}

/* 字段间距 - field 之间 */
.field {
  margin-bottom: 16px;     /* --space-4 */
}
.field:last-child {
  margin-bottom: 0;        /* 字段组最后一个去除底部间距 */
}
```

### 3.4 卡片（Card）

所有面板级容器使用统一样式：

```css
.card, .auth-card, .dialog-card, .list-panel {
  border-color: var(--line);
  border-radius: var(--radius-lg);   /* 10px */
  background: var(--panel);
  box-shadow: var(--shadow-sm);
}

/* 可交互列表项 */
.list-item {
  border-color: var(--line);
  border-radius: var(--radius-md);   /* 8px */
  background: var(--panel);
}
```

**卡片内边距**：
- 桌面：`@apply px-4 py-4`（16px）
- 移动端（<1180px）：`@apply px-4 py-3`（水平 16px / 垂直 12px）

### 3.4 字段（Field）

```css
.field {
  @apply mb-4 block;                 /* --space-4 = 16px 字段间距 */
}

/* 字段标签 — 所有页面统一 */
.field > span,
.name-field-label {
  display: block;
  margin: 0 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted-strong);
}
```

### 3.5 输入框（Input）

```css
.input {
  @apply h-12 w-full rounded-xl border px-3.5 py-2.5 outline-none;
  background: var(--panel);
  border-color: rgba(74, 103, 150, 0.34);
  font-size: var(--font-base);       /* 15px */
  color: var(--text);
}
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}
```

### 3.6 选择框（Select）

```css
select.input {
  @apply py-0 pr-[42px];
  appearance: none;
}
```

---

## 4. 按钮系统

### 4.1 基础按钮

```css
.btn {
  @apply inline-flex h-9 cursor-pointer items-center justify-center
         gap-1.5 rounded-full border border-transparent px-4 no-underline;
  font-size: var(--font-sm);         /* 14px */
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  line-height: 1;
  transition: all var(--dur-fast) var(--ease-smooth);
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:active:not(:disabled) { transform: translateY(0) scale(0.97); }
```

### 4.2 按钮变体

| 变体 | 用途 | 样式 |
|------|------|------|
| `btn-primary` | 主要操作 | 蓝色底 `#2563eb` + 白色字 |
| `btn-secondary` | 次要操作 | 白色背景 + 蓝色边框 |
| `btn-danger` | 危险操作 | 浅红背景 + 红色边框 |
| `btn.small` | 紧凑按钮 | 高度 30px + 更小内边距 |
| `btn.full` | 全宽按钮 | `h-12 w-full` + 16px 字号 |

### 4.3 输入框内按钮

```css
.input-icon-btn {
  @apply absolute right-2 top-1/2 grid h-8 w-8 cursor-pointer
         place-items-center rounded-full border-0 bg-transparent;
  transform: translateY(-50%);
}
```

---

## 5. CSS 编码规范

### 5.1 样式优先级

编写新样式时按以下优先级选择实现方式：

1. **Tailwind utility** — 适用于单次布局或间距（如 `mb-4`, `flex`, `gap-3`）
2. **CSS 变量** — 适用于颜色、圆角、阴影、动画（如 `var(--panel)`, `var(--radius-lg)`）
3. **@apply 指令** — 复用多个 Tailwind 工具的组合
4. **硬编码值** — 仅当超出 token 体系时使用（如 13px 字段标签、6px 标签间距）

### 5.2 禁止事项

- ❌ 禁止使用非 --space-* 体系的自定义间距值
- ❌ 禁止字段标签使用 `var(--font-sm)`（固定 13px）
- ❌ 禁止使用 `!important`（极少数动画激活态例外）
- ❌ 禁止使用 ID 选择器
- ❌ 禁止修改 `tokens.css` 中的变量值

### 5.3 类命名规范

- 使用 **kebab-case**
- 语义化命名（`.name-field-group` 而非 `.flex-row-mb-4`）
- 组件前缀：`vault-*`, `pw-gen-*`, `totp-scan-*`, `bottom-sheet-*`
- 状态后缀：`.active`, `.open`, `.is-removed`

---

## 6. 添加密码页面详细规范

### 6.1 字段顺序

```
Card 1
├── 标题行（类型名 + ★ 收藏按钮）
├── 类型选择器 + 标签选择器（双列）
├── 网站 — 输入框 + ✨ AI 按钮
├── [+ 添加网站] — 按钮
├── [额外 URI 列表 — 可选]
├── 名称 — icon + label + input（见 6.2）
├── 分割按钮（密码登录 / 第三方登录）
├── [密码登录模式]
│   ├── 用户名 — input
│   ├── 密码 — input + 生成🔄 + 复制📋 + 可见性👁️
│   └── TOTP — input + QR 扫码按钮
├── [三方登录模式]
│   ├── 平台选择
│   └── 关联账号

Card 2: 附件
Card 3: 自定义字段
Card 4: 附加选项（备注 + 主密码二次确认）
```

### 6.2 名称字段布局

```
┌────────────────────────────────────┐
│  图标（label）    名称（label）    │  ← 两个 label 水平对齐
│  [icon 48×48]    [input         ]  │
└────────────────────────────────────┘
```

```html
<div class="name-field-group">
  <div class="name-field-row" style="align-items: flex-start;">
    <div class="name-field-icon-col">
      <span class="name-field-label">{t('txt_logo')}</span>
      <span class="name-icon-box">
        <WebsiteIcon />
      </span>
    </div>
    <div class="name-field-input-block">
      <span class="name-field-label">{t('txt_name')}</span>
      <input class="input" />
    </div>
  </div>
</div>
```

```css
.name-field-group { @apply mb-4; }
.name-field-row { display: flex; gap: 12px; align-items: center; }
.name-field-icon-col {
  display: flex; flex-direction: column; align-items: flex-start; gap: 0;
}
.name-icon-box {
  @apply flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border;
  background: var(--panel-soft);
  border-color: var(--line);
}
.name-field-input-block { flex: 1; min-width: 0; }
```

### 6.3 间距规则总结

| 元素 | 间距 | 值 |
|------|------|-----|
| `section` → 下一个 `section` | margin-bottom | **20px**（`--space-5`） |
| `.section-head` → `.card` | margin-bottom | 10px |
| `.field` → 下一个 `.field` | margin-bottom | **16px**（`--space-4`） |
| `.field:last-child` / `disableMargin` | margin-bottom | **0**（去除底部间距） |
| `.segmented-control` | margin-bottom | 12px（`--space-3`） |
| `.card` → `.detail-actions` | margin-top | 12px |
| `.detail-actions` | margin | 12px 0 |
| card 内边距（桌面） | padding | 16px |
| card 内边距（移动端） | padding | 16px 水平 / 12px 垂直 |

### 6.4 密码生成器弹窗

```
┌────────────────────────────────┐
│  生成密码                  ✕   │
│  [预览密码           ]  🔄    │
│  长度: 20                      │
│  ├────●────────────────────┤  │
│  ☑ A-Z  ☑ a-z                │
│  ☑ 0-9  ☑ !@#$%              │
│  ☐ 排除相似字符                │
│  [      ✓ 应用     ]           │
└────────────────────────────────┘
```

- 默认长度 20，范围 8-32
- 每个开启字符集至少贡献 1 个字符
- 排除相似字符过滤 `il1Lo0O`
- 滑块和复选框变化时立即重新生成

---

## 7. i18n 规范

- 所有用户可见文字走 `t('txt_xxx')` 模式
- 中英文必须同步维护（`en.ts` + `zh-CN.ts`）
- Key 格式：`txt_<英文描述>`

---

## 8. 文件结构

```
webapp/src/
├── components/vault/       # 密码库相关组件
├── styles/
│   ├── tokens.css           设计变量（被所有文件引用）
│   ├── forms.css            通用表单样式（按钮/输入框/选择框）
│   ├── vault.css            密码库编辑器/列表样式
│   ├── management.css       管理后台样式
│   ├── overlays.css         对话框/遮罩层
│   ├── auth.css             认证页面样式
│   ├── responsive.css       响应式布局
│   └── dark.css             暗色模式
└── lib/i18n/locales/
    ├── en.ts
    └── zh-CN.ts
```

---

*本文档作为前端开发的唯一设计参考，所有 UI 实现必须与此规范一致。*