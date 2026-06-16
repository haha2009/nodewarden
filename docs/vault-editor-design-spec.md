# Vault Editor 设计规范

> 本文档定义"添加密码" / "编辑密码"页面的设计规范，所有前端开发必须严格遵循。
> 参考来源：NodeWarden Web 端现有样式系统 + Monica-1Password Android 端 UI 设计模式。

---

## 1. 设计系统基础

### 1.1 CSS 变量体系（Design Tokens）

所有颜色、间距、圆角、阴影、动画缓动函数均使用 CSS 变量定义，见 `tokens.css`。

```css
/* 颜色 */
--panel: #ffffff;                     /* 卡片/面板背景 */
--panel-soft: #f8fafc;               /* 稍暗的面板背景 */
--panel-muted: #edf2f7;              /* 更暗的面板背景 */
--line: rgba(100, 116, 139, 0.24);    /* 边框线 */
--text: #0f172a;                      /* 主文字 */
--muted: #64748b;                     /* 次要文字 */
--muted-strong: #334155;             /* 较强次要文字 */
--primary / --brand: #2563eb;        /* 主色调 / 品牌色 */
--danger: #dc2626;                    /* 危险/删除操作 */
--success: #059669;                   /* 成功状态 */

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

/* 字体 */
--font-sans: Inter, ui-sans-serif, ...;
--font-xs: 11px;  --font-sm: 14px;  --font-base: 15px;
--font-md: 16px;  --font-lg: 17px;  --font-xl: 19px;  --font-2xl: 21px;

/* 行高 */
--leading-tight: 1.25;   --leading-snug: 1.375;
--leading-normal: 1.5;   --leading-relaxed: 1.625;
```

### 1.2 暗色模式

所有暗色模式样式定义在 `dark.css` 中，通过 `:root[data-theme='dark']` 选择器覆盖。暗色模式下：
- 面板背景变为深色（`--panel: #151b24`）
- 边框更透明（`--line: rgba(148, 163, 184, 0.16)`）
- 主色调变亮（`--primary: #60a5fa`）
- 阴影更深（`--shadow-md` 等）

### 1.3 响应式断点

- `max-width: 1180px` — 平板/小屏：三栏变单栏，移动端 tab bar 出现
- `max-width: 640px` — 手机：更紧凑的间距，全屏对话框

---

## 2. 布局结构

### 2.1 页面网格

```css
.vault-grid {
  grid-template-columns: 270px minmax(400px, 36%) minmax(400px, 1fr);
  /* 侧边栏 | 列表 | 详情 */
}
```

### 2.2 间距体系（Spacing System）

所有间距必须使用 `--space-*` token 或 Tailwind 对应值：

| Token | 值 | Tailwind | 用途 |
|-------|-----|----------|------|
| `--space-1` | 4px | `gap-1`, `p-1` | 极小间隙 |
| `--space-2` | 8px | `gap-2`, `mb-2`, `mt-2`, `p-2` | label→input 间距、小间隙 |
| `--space-3` | 12px | `gap-3`, `mb-3`, `mt-3`, `p-3` | 卡片间距、section-head 下边距、按钮组间隙 |
| `--space-4` | 16px | `gap-4`, `mb-4`, `mt-4`, `p-4` | 字段间距、卡片内边距 |
| `--space-5` | 20px | `gap-5`, `mt-5`, `p-5` | 大间距、分区分隔 |
| `--space-6` | 24px | `gap-6` | 更大间距 |
| `--space-8` | 32px | `gap-8` | 大块间距 |
| `--space-10` | 40px | `gap-10` | 极宽间距 |

**严格禁止**：使用不在间距体系中的值（如 `18px`、`10px`、`14px` 等非标准值）。

### 2.3 卡片（Card）

每个功能区块都是一个 `.card`：

```css
.card {
  @apply mb-3 px-4 py-4;                 /* --space-3 | --space-4 | --space-4 */
  @apply rounded-2xl border bg-panel shadow-soft;
  border-color: var(--line);
}
```

**移动端**：
```css
@media (max-width: 1180px) {
  .card { @apply px-4 py-3; }             /* --space-4 | --space-3 */
  .mobile-detail-sheet .card { padding: 12px 16px; margin-bottom: 8px; }
}
```

卡片有 **staggered entrance animation**：
```
.card:nth-of-type(1) { animation-delay: 0ms; }
.card:nth-of-type(2) { animation-delay: 40ms; }
...
.card:nth-of-type(5) { animation-delay: 160ms; }
```

### 2.4 三段式标题栏（Section Head）

```css
.section-head {
  @apply mb-2.5 flex items-center justify-between;   /* 10px — 使用 Tailwind mb-2.5 */
  gap: var(--space-3);   /* 12px */
}

@media (max-width: 1180px) {
  .mobile-detail-sheet .section-head {
    gap: var(--space-2);  /* 8px */
    margin-bottom: var(--space-2);  /* 8px */
  }
}
```

### 2.5 字段（Field）

```css
.field {
  @apply mb-4 block;               /* --space-4 = 16px 字段间距 */
}
.field > span {
  @apply mb-2 block;               /* --space-2 = 8px */
  font-size: var(--font-sm);   /* 14px */
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  color: var(--muted-strong);  /* #334155 */
  line-height: var(--leading-snug);
}
```

**间距规则总结（Card 1 内部）**：

| 元素 | 间距 | 值 |
|------|------|-----|
| `.section-head` → 第一个 `.field` | `margin-bottom: 10px` | --space-2.5 |
| `.field` → 下一个 `.field` | `margin-bottom: 16px` | --space-4 |
| `.field` → `.segmented-control` | `margin-bottom: 16px` | --space-4 |
| `.segmented-control` → `.field` | `margin-bottom: 16px` | --space-4 |
| `.name-field-group` | `margin-bottom: 16px` | --space-4 |
| `.add-website-btn-inline` → `.extra-websites-list` | `margin-top: 12px` | --space-3 |
| `.extra-websites-list` → `.segmented-control` | (extra-lists container spacing uses last-child margin) | |
| `.card` → next `.card` | `margin-bottom: 12px` | --space-3 |
| `.passkeys-section-head`（分区标题） | `margin-top: 20px` | --space-5 |
| `.detail-actions` | `margin: 12px 0` | --space-3 |

> ⚠️ 严禁在 Card 1 内部使用非 --space-* 的自定义间距值。

---

## 3. 表单元素

### 3.1 输入框（Input）

```css
.input {
  @apply h-12 w-full rounded-xl border px-3.5 py-2.5 outline-none;
  background: var(--panel);
  border-color: rgba(74, 103, 150, 0.34);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  font-size: var(--font-base);  /* 15px */
  color: var(--text);
}
.input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
  transform: translateY(-1px);
}
```

- 高度：**48px**（`h-12`）
- 圆角：**12px**（`rounded-xl`）

### 3.2 选择框（Select）

```css
select.input {
  @apply py-0 pr-[42px];
  appearance: none;
  background-image: /* 自定义下拉箭头 */;
}
```

### 3.3 文本域（Textarea）

```css
.textarea {
  @apply h-auto min-h-28 resize-y;
}
```

### 3.4 输入框内按钮（Input Icon Button）

用于输入框右侧的操作按钮（如密码可见性切换、生成密码、复制、AI 识别）：

```css
.input-icon-btn {
  @apply absolute right-2 top-1/2 grid h-8 w-8 cursor-pointer
         place-items-center rounded-full border-0 bg-transparent
         text-slate-700 transition;
  transform: translateY(-50%);
}
.input-icon-btn:hover:not(:disabled) {
  color: var(--primary);
  background: rgba(37, 99, 235, 0.08);
  transform: translateY(-50%) scale(1.04);
}
```

**按钮间距规则**（适用于密码字段的 3 个 trailing 按钮）：

```css
.leading-input-inner .input-icon-btn {
  right: 2px;                         /* 第3个按钮（可见性） */
}
.leading-input-inner .input-icon-btn:nth-child(2) {
  right: 70px;                        /* 第1个按钮（生成密码） */
}
.leading-input-inner .input-icon-btn:nth-child(3) {
  right: 36px;                        /* 第2个按钮（复制密码） */
}
input { padding-right: 106px; }       /* 3个按钮所需空间 */
```

### 3.5 输入框-操作按钮包裹（Input Action Wrap）

用于只有一个 trailing 按钮的输入框（如 TOTP、网站 AI 按钮）：

```css
.input-action-wrap .input {
  @apply pr-12;   /* 为按钮留空间 */
}
```

---

## 4. 按钮系统

### 4.1 基础按钮（`.btn`）

```css
.btn {
  @apply inline-flex h-9 cursor-pointer items-center justify-center
         gap-1.5 rounded-full border border-transparent px-4 no-underline;
  font-size: var(--font-sm);
  font-weight: 600;
  letter-spacing: var(--tracking-wide);
  line-height: 1;
}
.btn:hover:not(:disabled) { transform: translateY(-1px); }
.btn:active:not(:disabled) { transform: translateY(0) scale(0.97); }
```

### 4.2 按钮变体

| 变体 | 用途 | 样式 |
|------|------|------|
| `btn-primary` | 主要操作（保存/确认） | 纯蓝色底 `#2563eb` + 白色文字。无渐变、无阴影、无 hover 上浮。hover 变深 `#1d4ed8`，active 变更深 `#1e40af` |
| `btn-secondary` | 次要操作 | 白色背景 + 蓝色边框 + hover 渐变 |
| `btn-danger` | 危险操作（删除） | 浅红色背景 + 红色边框 |
| `btn.small` | 紧凑按钮 | 高度 30px + 更小字号 |
| `btn.full` | 全宽按钮 | `h-12 w-full` + 16px 字号 |

### 4.3 加载状态（Spinner）

```css
.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: btn-spin 600ms linear infinite;
}
```

保存按钮在 `props.busy` 时：`.btn-spinner` 代替图标，文字变为 `txt_saving`。

---

## 5. 对话框系统

### 5.1 遮罩层（Dialog Mask）

```css
.dialog-mask {
  @apply fixed inset-0 grid h-dvh w-screen place-items-center p-5;
  background: rgba(15, 23, 42, 0.5);
  z-index: 1200;
  backdrop-filter: blur(6px);
  animation: fade-in var(--dur-medium) var(--ease-smooth) both;
}
```

### 5.2 对话框卡片（Dialog Card）

```css
.dialog-card {
  @apply rounded-[20px] border bg-white p-5 text-center;
  width: min(500px, 100%);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.2);
  animation: dialog-in 240ms var(--ease-out-strong) both;
}
```

入场动画：
```css
@keyframes dialog-in {
  from { opacity: 0; transform: translateY(12px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
```

### 5.3 底部弹窗（Bottom Sheet）

用于选择（如标签/密码库选择）：

```css
.dialog-mask.bottom-sheet-mask {
  display: flex;
  align-items: flex-end;   /* 从底部弹出 */
  justify-content: center;
  padding: 0;
  background: rgba(15, 23, 42, 0.48);
}
.bottom-sheet {
  width: 100%;
  max-width: 500px;
  max-height: 70vh;
  border-radius: 20px 20px 0 0;
  animation: sheet-up 280ms var(--ease-out-strong) both;
}
@keyframes sheet-up {
  from { transform: translateY(100%); opacity: 0; }
  to   { transform: translateY(0); opacity: 1; }
}
```

**底部弹窗结构**：
```html
<div class="dialog-mask bottom-sheet-mask open">
  <section class="bottom-sheet open">
    <div class="bottom-sheet-head">
      <h3 class="dialog-title">标题</h3>
      <button class="bottom-sheet-close"><X /></button>
    </div>
    <div class="bottom-sheet-body">
      <!-- 选项列表 -->
      <button class="vault-option active">
        <span>选项名</span>
        <CheckCheck class="vault-option-check" />
      </button>
    </div>
  </section>
</div>
```

---

## 6. 添加密码页面详细规范

### 6.1 字段顺序

```
Card 1 (单一卡片，合并 Android 的 CredentialsCard)
├── 标题行（类型名 + ★ 收藏按钮）
├── 类型选择器（select dropdown）
├── VaultSelector（标签/密码库选择器卡片）
│   └── [vault-selector-card] 标签: xxx        ▼
├── 网站 ── 输入框 + ✨ AI 按钮
├── [+ 添加网站] ── 按钮（仅第一个URI非空时显示）
├── [额外 URI 列表] ── 匹配规则选择 + 排序 + 删除
│   └── [+ 添加网站] ── 多URI时底部按钮
├── 名称 ── [logo 48×48] + [label / input]
├── 分割按钮（Password Login / Third-Party Login）
├── [密码登录模式]
│   ├── 👤 用户名 ── User 图标 + input
│   ├── 🔒 密码 ── Lock 图标 + [input + 生成🔄 + 复制📋 + 可见性👁️]
│   └── QR TOTP ── QrCode 图标 + input + 📷 扫码按钮
├── [三方登录模式]
│   ├── 平台选择（Google/Apple/Facebook...）
│   └── 关联账号

Card 2: 附件
Card 3: 自定义字段
Card 4: 附加选项（备注 + 主密码二次确认复选框）

底部操作栏：
  [✓ 确认] [✕ 取消]           （创建时）
  [✓ 确认] [✕ 取消]  [🗑️ 删除]（编辑时）
```

### 6.2 名称字段布局

**布局规则**（与 Android 对齐）：

```
┌────────────────────────────────────────┐
│  [logo 48×48]  名称 （label, 只有右侧） │
│  [圆角方形]    [input                ] │
└────────────────────────────────────────┘
```

- logo 在左侧，label 和 input 在右侧垂直排列
- logo 和 input 顶部对齐（`align-items: flex-start`）
- 间距：gap 10px

```html
<div class="name-field-group">
  <div class="name-field-row">  <!-- flex, gap-10px, align-items: flex-start -->
    <span class="name-icon-box">  <!-- 48×48, rounded-2xl -->
      <WebsiteIcon />
    </span>
    <div class="name-field-input-block">  <!-- flex: 1 -->
      <span class="name-field-label">名称</span>
      <input class="input" />
    </div>
  </div>
</div>
```

### 6.3 网站图标（Icon Box）

```css
.name-icon-box {
  @apply flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border;
  background: var(--panel-soft);
  border-color: var(--line);
  transition: border-color var(--dur-fast) var(--ease-smooth);
  cursor: pointer;    /* 创建模式下可点击上传 */
}
.name-icon-box:hover {
  border-color: var(--brand);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand) 18%, transparent);
}
```

- 尺寸：**48×48**（与 input 高度 `h-12` 一致）
- 圆角：**rounded-2xl**（Google 风格大圆角）
- 内部图标尺寸：**26×26**
- 内部 fallback SVG：**24×24**

### 6.4 前导图标行（Leading Input Row）

用于用户名、密码、TOTP 字段（Android 风格 icon+input 布局）：

```css
.leading-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.leading-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  color: var(--muted);
  flex-shrink: 0;
}
.leading-input-inner {
  flex: 1;
  min-width: 0;
  position: relative;
}
```

| 字段 | 图标 | icon | 说明 |
|------|------|------|------|
| 用户名 | User | `<User size={18} />` | 前导图标 |
| 密码 | Lock | `<Lock size={18} />` | 前导图标 |
| TOTP | QrCode | `<QrCode size={18} />` | 前导图标 |

### 6.5 密码字段（Password Field）

密码字段有 3 个 trailing 操作按钮：

| 按钮 | 位置 | 图标 | 行为 |
|------|------|------|------|
| 生成密码 | `right: 70px` | RefreshCw | 打开 PasswordGeneratorDialog |
| 复制密码 | `right: 36px` | Copy / CheckCheck | 复制到剪贴板，2秒后变回Copy |
| 可见性 | `right: 2px` | Eye / EyeOff | 切换 input type `password`/`text` |

**复制成功状态**：按钮变绿色 `color: #16a34a` + 图标变为 CheckCheck + 文字显示"Copied!" 2 秒后自动恢复。

**密码为空规则**：type=1 + loginType='password' 时密码为空 → 保存按钮禁用；第三方登录模式不检查。

### 6.6 分割按钮（Segmented Control）

```css
.segmented-control {
  @apply mb-3 inline-flex w-full overflow-hidden rounded-xl border;
  border-color: var(--line);
  background: var(--panel-soft);
}
.segmented-btn {
  @apply flex flex-1 cursor-pointer items-center justify-center
         gap-1.5 border-0 px-3 py-2.5 text-sm font-semibold;
  background: transparent;
  color: var(--muted);
}
.segmented-btn.active {
  background: var(--panel);
  color: var(--brand);
  box-shadow: var(--shadow-sm);
}
```

- 两个选项等宽（`flex: 1`）
- 激活项：白色背景 + 蓝色文字 + 浅阴影（3D 凸起效果）

### 6.7 VaultSelector（标签选择器）

用卡片式点击组件替代原生 `<select>`：

```html
<button class="vault-selector-card" onClick={openSheet}>
  <div class="vault-selector-left">
    <span class="vault-selector-label">标签</span>
    <span class="vault-selector-value">当前选中的标签</span>
  </div>
  <ChevronDown class="vault-selector-chevron" />
</button>
```

- 点击后打开 **BottomSheet**（`bottom-sheet`）列出所有标签
- 每个选项是 `.vault-option`，选中项有绿色 `CheckCheck` 图标 + `active` 高亮

```css
.vault-option {
  padding: 12px 14px;
  border-radius: 12px;
}
.vault-option.active {
  background: color-mix(in srgb, var(--brand) 11%, transparent);
  color: var(--brand);
  font-weight: 600;
}
```

---

## 7. 密码生成器弹窗（Password Generator Dialog）

### 7.1 布局

```
┌────────────────────────────────┐
│  生成密码                  ✕   │  ← .pw-gen-dialog (440px max-width)
│                                │
│  [s8F#k2L!pQx@9mA&... ]  🔄  │  ← .pw-gen-preview-row
│                                │
│  长度: 20                      │  ← .pw-gen-slider-row
│  ├────●────────────────────┤  │
│  8                         32  │
│                                │
│  ☑ A-Z   ☑ a-z                │  ← .pw-gen-options grid 2列
│  ☑ 0-9   ☑ !@#$%              │
│  ☐ 排除相似字符                │
│                                │
│  [      ✓ 应用     ]           │  ← .pw-gen-footer
└────────────────────────────────┘
```

### 7.2 字符选项

| 选项 | 默认 | 字符集 |
|------|------|--------|
| A-Z | ✓ 开启 | `ABCDEFGHIJKLMNOPQRSTUVWXYZ` |
| a-z | ✓ 开启 | `abcdefghijklmnopqrstuvwxyz` |
| 0-9 | ✓ 开启 | `0123456789` |
| !@#$% | ✓ 开启 | `!@#$%^&*()-_=+` |
| 排除相似字符 | ✕ 关闭 | 排除 `il1Lo0O` |

### 7.3 生成逻辑

- 默认长度：**20**
- 长度范围：**8 - 32**
- 每个开启的字符集至少贡献 1 个字符
- 剩余字符从合并后的 pool 中随机选取
- 勾选"排除相似字符"时过滤 `il1Lo0O`
- 滑块或复选框变化时**立即重新生成**预览

---

## 8. 动画与交互规范

### 8.1 常用动画名称

| 动画名 | 用途 | 时长 | 缓动 |
|--------|------|------|------|
| `fade-in` | 遮罩层显现 | 240ms | ease-smooth |
| `dialog-in` | 对话框入场 | 240ms | ease-out-strong |
| `sheet-up` | 底部弹窗入场 | 280ms | ease-out-strong |
| `surface-enter` | 卡片入场 | 280ms | ease-out-soft |
| `menu-in` | 下拉菜单入场 | 190ms | ease-out-strong |
| `toast-in` | Toast 通知入场 | 240ms | ease-out-strong |
| `sparkle-pop` | AI ✨ 按钮动画 | 400ms | ease-out-soft |
| `btn-spin` | Spinner 旋转 | 600ms | linear infinite |

### 8.2 Hover 交互规范

所有可交互元素（按钮、卡片、列表项）：

```css
transition: all var(--dur-fast) var(--ease-smooth);
/* hover 效果集 */
transform: translateY(-1px);        /* 轻微上浮 */
box-shadow: 0 4px 12px ...;         /* 加深阴影 */
border-color: var(--brand);          /* 边框变为品牌色 */
color: var(--brand);                 /* 文字变为品牌色 */
background: rgba(37, 99, 235, 0.08); /* 浅蓝色背景 */
```

**禁止**：hover 后元素位置突变、布局重排、内容跳闪。

### 8.3 交互反馈

| 事件 | 反馈 |
|------|------|
| 按钮 hover | 上浮 1px + 加深阴影 |
| 按钮 active/click | scale(0.97) 回弹 |
| 输入框 focus | 蓝色边框 + 3px 发光 + 上浮 1px |
| 列表项 hover | 向右位移 2px + 渐变光效 |
| AI 识别成功 | Sparkles 图标 400ms 弹出动画 + 蓝色闪烁 |

---

## 9. i18n 命名规范

所有文字必须使用 i18n key，格式：

```
txt_<英文描述>
```

示例：
```
"txt_generate_password": "Generate Password"
"txt_copy_password": "Copy password"
"txt_copied": "Copied!"
```

**所有中英文对照必须同步维护**（`en.ts` + `zh-CN.ts`）。

---

## 10. 功能状态映射

### 10.1 Android ↔ Web 功能对照表

| # | Android 功能 | Web 状态 | 备注 |
|---|-------------|---------|------|
| 1 | 屏幕标题 "Add Password" | ✅ | 类型名 + header |
| 2 | 关闭/取消 | ✅ | 取消按钮 |
| 3 | VaultSelectorCard（卡片式选择器） | ✅ | `.vault-selector-card` + 底部弹窗 |
| 4 | 字段顺序：网站→名称→用户名→密码→TOTP | ✅ | 与用户确认保持网站在前 |
| 5 | 每个字段有 leading 图标 | ✅ | User/Lock/QrCode |
| 6 | 密码可见性切换 | ✅ | Eye/EyeOff |
| 7 | 密码生成器弹窗 | ✅ | 完整：预览+滑块+字符选项+应用 |
| 8 | 密码复制按钮 | ✅ | 复制+已复制状态 2s |
| 9 | 保存按钮加载状态 | ✅ | spinner 动画 |
| 10 | 密码为空时保存按钮禁用 | ✅ | 仅 password login 模式 |
| 11 | VaultSelector 底部弹窗 | ✅ | 动画 + 选中态 |
| 12 | 分割按钮（密码/第三方登录） | ✅ | segmented-control |
| 13 | 三方登录平台选择 | ✅ | 含平台图标 |
| 14 | 保存按钮全宽 | ✅ | `.btn.full` |

---

## 11. CSS 类命名规范

### 11.1 命名模式

- **组件容器**：`.vault-selector-card`, `.name-field-group`, `.name-field-row`
- **弹窗**：`.pw-gen-dialog`, `.pw-gen-head`, `.pw-gen-body`, `.pw-gen-footer`, `.bottom-sheet`
- **选项/按钮**：`.vault-option`, `.pw-gen-option`, `.segmented-btn`, `.input-icon-btn`
- **工具**：`.btn-spinner`, `.vault-option-check`, `.leading-icon`

### 11.2 类命名原则

- 使用 kebab-case
- 语义化 > 表现化（`.name-field-group` 而非 `.flex-row-mb-4`）
- 避免 ID 选择器，避免 `!important`（少数情况如激活态动画可例外）
- 自定义 CSS 变量通过 `var(--xxx)` 引用，避免硬编码值

---

## 12. 文件结构

```
webapp/src/
├── components/vault/
│   ├── VaultEditor.tsx         # 编辑器主组件
│   ├── vault-page-helpers.tsx  # 工具函数（域名提取、图标URL、生成空URI等）
│   ├── WebsiteIcon.tsx         # 网站图标组件
│   └── ...
├── styles/
│   ├── vault.css               # 编辑器专用样式（本规范的主要定义位置）
│   ├── forms.css               # 通用表单样式
│   ├── tokens.css              # 设计变量
│   ├── overlays.css            # 对话框/遮罩层
│   ├── motion.css              # 动画定义
│   ├── dark.css                # 暗色模式
│   └── responsive.css          # 响应式布局
└── lib/i18n/locales/
    ├── en.ts                   # 英文
    └── zh-CN.ts                # 简体中文
```

---

*本文档作为前端开发的唯一设计参考，所有 UI 实现必须与此规范一致。发现不一致时优先更新代码，然后更新本文档。*
