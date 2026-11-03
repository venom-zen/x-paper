# X 晨报首页 Design

## Summary

X 首页当前仍是被拉宽的移动 app 骨架：左侧 595px 导航容器、600px 正文列、350px 右栏，
深色大块和 16px 圆角媒体占据视线。用户希望首页像一份清爽晨报 web 页面。本设计把首页改为
88px 图标轨、无右栏、居中宽正文、顶部日期刊头、轻量帖子操作栏和 emoji 媒体入口；
帖子详情复用同一主题和外壳，线程版式留给后续 work item。媒体默认隐藏，以 🖼️/🎬 入口呈现，
点击就地展开。

## Project Traceability

- **Project**: `projects/x-morning-paper/project.md`
- **Backlog**: `projects/x-morning-paper/backlog.md`
- **Work item**: `WI-morning-paper-home`

## Goals

- 首页在视口 ≥1000px 时呈现晨报版面：88px 图标轨、无右栏、居中 680–760px 正文、顶部日期刊头。
- 首页顶层帖子的图片/视频默认折叠为 emoji 入口；点击就地展开，收起后不留下空白媒体区。
- 首页和帖子详情在 X 深色或浅色设置下都显示统一的浅色纸质主题；帖子详情暂不做线程专属版式。
- 首页隐藏推广帖、推荐关注和右栏内容；搜索、通知等页面的用户列表不受影响。
- 脚本可通过 Tampermonkey 菜单关闭；选择器缺失或 X 改版时降级为主题模式，不破坏核心功能。
- 滚动和页面切换无明显卡顿；不添加滚动监听，时间线观察器节流。

## Primary Users / Roles

- **读者（用户本人）**：Windows Chrome + Tampermonkey，已登录 X，日常浏览首页和帖子详情；
  希望文字优先、安静、像 web 页面。
- **维护者（同一用户）**：X 改版时更新选择器；通过 Tampermonkey 菜单开关脚本。

## Non-Goals

- 不做完整 X 客户端，不改账号、发布、私信、通知等业务逻辑。
- 不做帖子详情的线程层级、回复折叠、阅读进度；留给 `WI-post-detail-reading`。
- 不做个人页、搜索、通知、书签、私信、发帖框、设置页的完整重排。
- 不做深色纸感、主题编辑器、页内设置面板、远程配置或数据上报。
- 不实现自定义灯箱或图片查看器；展开后的媒体继续使用 X 原生交互。
- 不插入真实日期分隔章节；日期只在顶部刊头显示。
- 不覆盖 X 的临时菜单、弹窗和对话框；它们保持 X 原生样式。
- 不追求覆盖 X 的所有实验性布局或媒体类型；无法识别时保持原媒体可见。

## Context

项目是 greenfield userscript；项目文档为 `project.md` 和 `backlog.md`，本设计位于
`specs/morning-paper-home/`。目标运行环境为 Windows Chrome 135 + Tampermonkey；
X 是 React 单页应用，使用 `data-testid` 和生成的 class。

脚本只使用 Tampermonkey 的样式注入、菜单和本地存储权限；不请求额外权限、不读取账号数据、
不发起网络请求。离线时页面行为由 X 控制，脚本不缓存内容。选择器不依赖界面文字；
日期固定使用 `zh-CN` 格式。

已登录 X 的现场结构（2026-11-02，1920×953，X 深色主题）：

- `header[role="banner"]` 宽 595px；内部 nav 使用 `position: fixed; left: 320px; width: 275px`。
  nav 链接为 `[data-testid^="AppTabBar_"]`，发帖为 `SideNav_NewTweet_Button`，
  账号为 `SideNav_AccountSwitcher_Button`。
- `main` 宽 1310px；`primaryColumn` 宽 600px；`sidebarColumn` 宽 350px；根容器宽 1905px。
- 时间线单元格为 `[data-testid="cellInnerDiv"]`，帖子为 `[data-testid="tweet"]`，
  正文为 `[data-testid="tweetText"]`，图片为 `[data-testid="tweetPhoto"]`，
  视频预览为 `[data-testid="previewInterstitial"]`，推广为 `[data-testid="placementTracking"]`，
  链接卡片为 `[data-testid="card.wrapper"]`。
- primaryColumn 内部还有 `max-width: 600px` 的时间线容器；只放宽 primaryColumn 不会放宽内容。
- X 深色主题使用内联颜色：body/primaryColumn 背景 `rgb(0, 0, 0)`，正文 `rgb(231, 233, 234)`，
  分隔线 `rgb(47, 51, 54)`。主题必须逐表面覆盖，不能只改 body。
- 现场 CSS 探针已验证：左栏 88px、nav 72px、primary 760px、内层时间线 100%、右栏隐藏、
  正文居中（1920px 下 primary x=617）、广告 `:has(placementTracking)` 隐藏、tweetText 颜色覆盖、
  隐藏媒体块会折叠帖子高度。
- 媒体高度由 X 的内联和生成样式控制；只改 `tweetPhoto` 高度会留下父容器空白，多图网格还会
  塌缩。因此媒体必须整块隐藏/展开，而不是缩略。
- 开源项目 Control Panel for Twitter（2026-10-18 更新）仍在使用这些选择器；只作为维护参照，
  不作为运行时依赖。

## Discovery

### Key Discoveries

- `primaryColumn` 和 `sidebarColumn` 是稳定锚点；左栏的固定容器不能靠 header 宽度直接推，
  需要覆盖 `position: fixed` 容器和 nav 宽度。
- 右栏移除后，正文居中需要调整 `main > div` 的交叉轴对齐；只设 primary 宽度会让正文贴左。
- 媒体计数必须排除嵌套引用帖里的媒体和 `card.wrapper` 里的链接卡片预览。
- 日期章节如果插入时间线，需要处理 X 的虚拟列表和 React 重渲染；顶部刊头可以完全避开这个问题。
- X 深色主题的内联颜色很多，主题层需要覆盖阅读路径上的每个表面，而不是依赖 `prefers-color-scheme`。
- 只在 CSS 里隐藏媒体会留下父容器高度；整块 `display:none` 可以自然折叠帖子，展开时恢复原媒体。

### Scope Decisions

- 媒体表现由“120px 缩略图”改为“emoji 入口 + 就地展开”。这取代 `project.md` 的
  `PDR-media-presentation` 和 `backlog.md` 里对应的媒体 Scope/Success signal；
  设计完成后由 `brainstorming` 同步项目文档。
- 日期章节落为顶部日期刊头，不插入真实日期分隔。
- 帖子详情复用主题和版面外壳；线程层级属于 `WI-post-detail-reading`。帖子详情不应用 emoji
  媒体入口，媒体保持 X 原生，留给后续 work item。
- 布局覆盖只在 ≥1000px 生效；<1000px 只应用浅色主题，保留 X 原生布局和媒体行为。
- 帖子操作栏轻量化纳入本设计：图标、计数和分隔线使用主题 token，保留 X 原生交互；
  线程版式仍留给 `WI-post-detail-reading`。
- 链接卡片和引用帖媒体不折叠；本设计只处理顶层帖子的图片和视频。
- 展开后的媒体继续使用 X 原生交互：图片可进入 X 灯箱，视频不自动播放。

## Decision Record

### DR-css-runtime-split

**Decision**: 视觉、版面、噪音隐藏用 CSS；运行时只负责日期刊头、媒体入口与标注、路由识别、
选择器健康检查和总开关。

**Rationale**: 纯 CSS 无法可靠折叠媒体块和插入 emoji 入口；完全重建 DOM 会破坏 React 事件和
虚拟列表。CSS 加少量适配器把风险限制在局部。

**Constraints**: 适配器必须幂等、可重复执行、捕获异常；找不到媒体块时不能隐藏原媒体。

**Revisit when**: X 的 DOM 结构变化到 CSS 无法完成版面覆盖，或运行时适配器需要维护的节点类型
明显增加。

### DR-layout-shell

**Decision**: 左栏折叠为 88px 图标轨，悬停或键盘聚焦时以 240px 浮层展开；右栏隐藏；
正文列在 ≥1600px 为 760px、1280–1599px 为 720px、1000–1279px 为 680px，并在剩余空间中居中。

**Rationale**: 现场探针已验证这些覆盖在当前 X 上生效；浮层展开不推动正文，阅读位置稳定；
保留图标轨符合用户对熟悉操作位置的要求。

**Constraints**: 需要覆盖 header 内的 fixed nav 容器、nav 宽度、primary 内层 max-width 和
main 的交叉轴对齐；低于 1000px 不应用。

**Revisit when**: X 改变主导航结构，或用户希望改为顶部报头/完全隐藏导航。

### DR-media-emoji-toggle

**Decision**: 顶层帖子的图片/视频媒体块默认隐藏，显示一个 emoji 按钮（🖼️ 图片或 🎬 视频，
多图带数量）；点击在帖子内就地展开原媒体块，最高 70vh，按钮变为“收起”。

**Rationale**: 这是用户最终确认的方案；它让文字成为时间线主体，避免缩略图的裁切、网格塌缩和
父容器高度问题，也减少自定义查看器的实现量。

**Constraints**: 只在首页且视口 ≥1000px 运行；<1000px 保持 X 原生媒体行为。只处理顶层帖子；
引用帖媒体和链接卡片保持原样；视频不自动播放；媒体块无法识别时保持原媒体可见。
折叠只添加 `display: none` 覆盖，展开时恢复媒体块原有 display；按钮通过唯一 id 和
`aria-controls` 关联媒体块，重渲染后校验配对。

**Rejected concern**: 不采用 120px 缩略图、全宽横幅、自定义纸质覆盖层或打开帖子详情；
用户已明确选择 emoji 入口和就地展开。

**Revisit when**: 用户觉得 emoji 入口过于抽象、展开后页面高度变化不可接受，或需要统一的
图片查看器。

### DR-date-masthead

**Decision**: 首页顶部显示非粘性日期刊头，格式为“晨报 · YYYY.MM.DD 星期X”，位于时间线 tabs 上方；
不使用真实日期分隔章节。

**Rationale**: 用户选择了顶部刊头；它不需要 observe 虚拟列表，也不会在 React 重渲染时丢失
分隔标题。

**Constraints**: 日期在页面加载和路由变化时计算；不在页面跨午夜时自动更新；帖子详情和其他页面不显示。

**Revisit when**: 用户希望真实日期分隔，或需要跨午夜自动更新。

### DR-noise-filter

**Decision**: 首页隐藏含 `placementTracking` 的推广单元格和含 `UserCell` 的推荐关注单元格；
右栏整体隐藏。规则只在首页路由生效。

**Rationale**: 用户希望时间线只保留自然内容；按路由限定避免误伤搜索结果、通知等页面的用户列表。

**Constraints**: 依赖 `:has()` 和 `data-testid`；选择器缺失时保持内容可见，不进行模糊文本匹配。

**Revisit when**: X 更改推广/推荐模块的标记，或用户在搜索等页面也希望隐藏推荐内容。

### DR-fixed-light-system-fonts

**Decision**: 强制浅色纸感主题；正文使用系统无衬线字体栈，日期刊头和少量展示文字使用系统衬线栈；
不加载网页字体。

**Rationale**: 用户选择固定浅色和系统字体；这避免 CDN 依赖、字体闪烁和跨平台差异，也符合性能目标。

**Constraints**: X 深色内联颜色需要逐表面覆盖；临时菜单/弹窗保持 X 原生样式；不做深色纸感。

**Revisit when**: 用户需要夜间阅读、希望更强的衬线气质，或愿意加载网页字体。

### DR-route-scope

**Decision**: 用 `history.pushState`/`replaceState` 补丁和 `popstate` 识别路由；首页应用完整版面、
刊头和媒体适配，帖子详情应用主题和版面外壳，其他页面只应用主题。主题覆盖其他页面仍可见的
右栏、搜索框和趋势表面，但不重排这些页面。

**Rationale**: X 是 SPA，路由切换不刷新页面；按路由限定可以避免在搜索/通知页误隐藏用户列表。

**Constraints**: 补丁必须保留原始行为；路由变化后重新评估刊头、观察器和媒体标注；不监听滚动。

**Revisit when**: X 改用其他路由机制，或帖子详情需要完整阅读版式。

### DR-control-fallback

**Decision**: MVP 只提供 Tampermonkey 菜单总开关；开关使用 Tampermonkey 的
`GM_getValue`/`GM_setValue` 持久化，关闭后重新加载页面并恢复 X 原生外观；存储写入失败时，
关闭只作用于当前页面（移除注入样式和 DOM），不重新加载，菜单仍可在当前页面重新开启。
启动时检查 primary、时间线根（primary 内 `[data-testid="cellInnerDiv"]` 的最近公共容器）和
版面锚点（header/nav、primary 内层时间线容器）。primary 或版面锚点缺失时降级为主题模式。
时间线根缺失时保留主题、版面和刊头，跳过媒体按钮标注并记录一次诊断；
没有 `cellInnerDiv` 的加载/空时间线不判定缺失，也不记录诊断。

**Rationale**: 总开关满足“随时退出”的需求，不引入页内设置 UI；选择器健康检查让 X 改版时
页面保持可用。

**Constraints**: 菜单在关闭状态下仍需注册以便重新开启；primary 或版面锚点缺失时不插入刊头、
不隐藏媒体；时间线根缺失时保留已插入的刊头和观察器，只跳过媒体按钮标注；
存储失败时默认启用，并允许当前页面关闭。

**Revisit when**: 用户需要调整媒体高度/密度，或需要更细的开关。

## Proposed Solution

### Architecture

脚本分为五层：

1. **预置样式**：`document-start` 注入 `html` 的纸张背景和 `color-scheme: light`，避免深色闪屏。
2. **主题 CSS**：在 `html[data-xmp-enabled="1"]` 下注入颜色、字体、分隔线、组件表面和纸纹。
3. **版面 CSS**：在 `html[data-xmp-route="home"]`、`html[data-xmp-route="status"]` 且视口 ≥1000px 时
   注入图标轨、右栏隐藏、正文宽度和居中规则。
4. **运行时适配器**：维护日期刊头、媒体按钮/媒体块状态、路由属性、选择器健康检查和观察器；
   媒体适配只在首页且视口 ≥1000px 运行。
5. **控制层**：Tampermonkey 菜单总开关和本地存储。

CSS 通过 `data-xmp-route` 和 `data-xmp-enabled` 作用域生效；运行时只修改必要的节点属性和
少量注入节点，不复制或重建时间线。

### Theme Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--xmp-paper` | `#FBFAF7` | 页面与正文列底色 |
| `--xmp-paper-raised` | `#F4F1E8` | 发帖框、左轨悬停、媒体按钮底、搜索框/趋势底 |
| `--xmp-ink` | `#1B1B1B` | 正文、图标、主要文字 |
| `--xmp-ink-secondary` | `#5C5A52` | 元信息、未激活 tab、操作栏图标/计数 |
| `--xmp-hairline` | `#D8D4C8` | 分隔线、媒体按钮边框、操作栏分隔线 |
| `--xmp-pine` | `#2F5D50` | 链接、激活 tab、焦点环、主按钮、操作栏悬停 |
| `--xmp-pine-soft` | `#E6ECE7` | 激活/悬停浅底 |
| `--xmp-like` | `#A8442E` | 仅点赞激活态，不做装饰色 |

- **界面字体**：`-apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif`。
- **展示字体**：`Georgia, "Times New Roman", "Songti SC", "SimSun", serif`。
- **字号**：正文 16px/1.65，元信息 13px/1.4，tabs 15px/1.4 500，日期刊头 20px/1.3。
- **形状与动效**：媒体按钮和展开媒体使用 2–4px 圆角，不使用 16px 大圆角卡片；
  过渡 160ms ease，`prefers-reduced-motion` 下关闭。
- **帖子操作栏**：图标视觉尺寸 16px，图标和计数使用 `--xmp-ink-secondary`；悬停/焦点使用
  `--xmp-pine` 和 `--xmp-pine-soft`；点赞激活使用 `--xmp-like`；操作栏上方使用
  `--xmp-hairline` 分隔线，底部内边距 8px；不改变 X 原生按钮的可点击区域和交互。
- **其他页面表面**：搜索、通知等页面仍可见的右栏、搜索框和趋势模块使用
  `--xmp-paper`/`--xmp-paper-raised`，文字使用 `--xmp-ink`/`--xmp-ink-secondary`，
  分隔线使用 `--xmp-hairline`；这些页面不重排版面。
- **纸纹**：仅页面底层一层低透明度颗粒，不大于 0.03 不透明度；文字和媒体上不加纹理。
  纸纹层固定覆盖、`pointer-events: none`，不进入交互层级。

### Components

| Component | Trigger | Input / Action | Output / Side effect |
|-----------|---------|----------------|----------------------|
| PreflightStyle | document-start | 读取开关；注入 html 背景/配色 | 避免深色闪屏；关闭时不注入 |
| ThemeLayer | enabled | 注入主题 CSS 变量和阅读表面规则 | 纸张、墨色、松绿、细线、操作栏、其他页面表面 |
| LayoutShell | home/status 且 ≥1000px | 注入左轨、右栏隐藏、正文宽度和居中规则 | 88px 图标轨、无右栏、居中宽正文 |
| DateMasthead | home | 计算本地日期；确保唯一刊头节点 | 时间线上方显示“晨报 · 日期” |
| MediaAdapter | home 且 ≥1000px + 时间线变化 | 找顶层帖子媒体块；计数；插入按钮；切换状态 | emoji 入口、媒体块折叠/展开 |
| NoiseFilter | home | CSS `:has()` 隐藏推广/推荐单元格 | 时间线只保留自然内容 |
| RouteController | history/popstate | 更新 `data-xmp-route`；调度重评估 | 首页/详情/其他页面作用域切换 |
| SelectorHealth | boot | 检查 primary、timeline 根（`cellInnerDiv` 公共容器）和版面锚点 | 按 primary/版面锚点/时间线根分别处理 |
| MenuController | Tampermonkey 菜单 | 读取/写入开关；正常重载；存储失败时当前页禁用/恢复 | 关闭恢复 X 原生，开启重新应用 |

### Key Mechanisms

#### 媒体块识别与折叠

对每个顶层帖子（`tweet.closest('[data-testid="tweet"]') === tweet`），收集以下媒体：

- `[data-testid="tweetPhoto"]`
- `[data-testid="previewInterstitial"]`

排除位于嵌套 `[data-testid="tweet"]` 内的媒体和位于 `[data-testid="card.wrapper"]` 内的链接卡片预览。
若没有媒体，清除该帖子已有的媒体标注和按钮。

从第一个媒体元素向上查找媒体块：该祖先必须包含本次收集的全部媒体，且不包含 `tweetText`
或帖子操作组；只有一项媒体时也至少向上取一层，避免只隐藏图片本身而留下父容器高度。
把该祖先标记为 `data-xmp-media-block`，并分配唯一 `id`（`xmp-media-block-<n>`，n 在页面内递增）；
在其前面插入一个 `button.xmp-media-toggle`，设置 `aria-expanded="false"`、`aria-controls`
指向该 id 和可访问名称。默认给帖子设置 `data-xmp-media-state="collapsed"`，CSS 隐藏媒体块。

按钮的可访问名称：

- 单张图片：`展开图片`
- 多张图片：`展开图片，共 N 张`
- 视频：`展开视频`
- 混合媒体：`展开媒体，共 N 项`

按钮可见文字：

- 单张图片：`🖼️ 图片`
- 多张图片：`🖼️ 图片 · N 张`
- 视频：`🎬 视频`
- 混合媒体：`🎬 媒体 · N 项`

#### 展开与收起

点击按钮时切换 `data-xmp-media-state`：

- `collapsed`：媒体块 `display: none`；按钮 `aria-expanded="false"`；文字为展开态。
- `expanded`：媒体块恢复原有 display（展开时移除 collapsed 的 `display: none` 覆盖，
  不写死 `display: block`），`max-height: 70vh`，`overflow-y: auto`；
  按钮 `aria-expanded="true"`；文字为“收起图片/收起视频/收起媒体”。

适配器不向媒体块写入 display 值；多图网格、单图和视频各保留 X 原生布局。
媒体块展开后保留 X 原生的图片点击和视频播放行为；不自动播放视频。再次点击按钮回到
`collapsed`。

#### 日期刊头

使用 `Intl.DateTimeFormat('zh-CN', {year, month, day, weekday})` 计算本地日期，格式化为
`YYYY.MM.DD 星期X`。刊头文字为 `晨报 · 日期`。刊头是 primary 区域内唯一的刊头节点，非粘性；
路由进入首页时确保存在，离开首页时移除。跨午夜不设定时器；下次加载或路由变化时更新。

#### 路由与选择器健康

`RouteController` 包装 `history.pushState` 和 `history.replaceState`，调用原方法后更新
`html[data-xmp-route]`；同时监听 `popstate`。路由分类：

- `/home`、`/`：`home`
- 包含 `/status/`：`status`
- 其他：`other`

启动时先查 `[data-testid="primaryColumn"]`、时间线根（primary 内
`[data-testid="cellInnerDiv"]` 的最近公共容器）和版面锚点（`header[role="banner"]`、
`[data-testid^="AppTabBar_"]`、primary 内带 600px max-width 的内层时间线容器）。primary 缺失则
设置 `data-xmp-degraded="1"`，只注入主题 CSS，记录一次警告。没有 `cellInnerDiv` 时视为加载中
或空时间线：保留主题、版面和刊头，启动观察器等待单元格，不设置 degraded。
primary 存在、已有 `cellInnerDiv` 但找不到它们的最近公共容器时，保留主题、版面和刊头，
跳过媒体按钮标注，保留观察器，记录一次警告。版面锚点缺失时，设置 `data-xmp-degraded="1"`，
只应用主题，跳过版面、刊头与媒体适配，记录一次警告。

#### 观察器

`MutationObserver` 只观察 primary 区域，`childList` + `subtree`。回调合并到一次
`requestAnimationFrame` 或 150ms 防抖；只在首页、视口 ≥1000px、已启用、未降级时处理。
只标注尚未标注的顶层帖子，并校验已标注帖子的按钮仍指向当前媒体块；帖子被 React 重渲染后，
按钮或媒体块被移除或配对失配时重新标注；媒体集合变化时重新计数。
路由离开首页或关闭开关时断开观察器。

### Boundary Examples

- **版面**：视口 1920px、滚动条 15px 时，根宽 1905px；左轨 88px 后剩余 1817px。760px 正文居中，
  左右各 528.5px，primary 的 x=616.5px，与现场探针 617px 一致。
- **断点**：视口 1000px 时应用 680px 正文；视口 999px 时不应用版面覆盖，保留 X 原生 600px 列。
- **媒体**：视口高 953px 时 70vh=667.1px，420px 高的图片完整显示；视口高 600px 时 70vh=420px，
  500px 高的媒体块进入内部滚动。
- **对比度**：`#1B1B1B` 在 `#FBFAF7` 上约 16.8:1，`#5C5A52` 在 `#FBFAF7` 上约 6.7:1，
  均高于 7:1 / 4.5:1 的目标。

### Data Flow

1. `document-start`：读取开关；关闭则注册菜单并停止。开启则注入预置样式和主题 CSS。
2. DOM 可用：查找 primary/timeline 和版面锚点；设置路由；按路由注入版面；首页确保刊头；
   首页在视口 ≥1000px 时启动媒体观察器。
3. 时间线变化（首页且视口 ≥1000px）：观察器找到新增顶层帖子；媒体适配器隐藏媒体块、
   插入 emoji 按钮；噪音过滤器通过作用域 CSS 隐藏推广/推荐单元格。
4. 用户点击 emoji：切换媒体状态；CSS 显示/隐藏媒体块；更新按钮文字和 `aria-expanded`。
5. 路由变化：更新 `data-xmp-route`；首页重新确保刊头，≥1000px 时重新确保媒体观察器；
   详情页移除刊头和媒体适配；回到首页时恢复。
6. 用户关闭开关：正常路径写入关闭状态并重新加载；重新加载后脚本提前停止，不注入任何
   样式或 DOM。存储写入失败时跳过重新加载，只移除当前页面的注入样式和 DOM，
   菜单可在当前页面重新开启。

## Error Handling

- **primary 缺失**：只应用主题，设置 `data-xmp-degraded="1"`，记录一次警告；
  不注入版面、刊头或媒体按钮。
- **时间线根缺失**：primary 内已有 `[data-testid="cellInnerDiv"]` 但找不到它们的最近公共容器时，
  保留主题、版面和刊头；跳过媒体按钮标注，保留观察器，记录一次警告。
  没有 `cellInnerDiv` 的加载或空时间线不触发该分支。
- **版面锚点缺失**：header/nav 或 primary 内层时间线容器找不到时，只应用主题，
  设置 `data-xmp-degraded="1"`，跳过版面、刊头、观察器和媒体适配，记录一次警告。
- **媒体块找不到**：保留原媒体可见，不为该帖子插入按钮；不隐藏任何媒体。
- **公共祖先找不到**：同上，保留原媒体。
- **观察器回调异常**：捕获并记录一次；继续运行，不让异常冒泡到 X。
- **路由补丁异常**：回退到 `popstate` 和初始路径判断；不阻断页面导航。
- **存储不可用**：默认启用；菜单关闭时跳过重新加载，只移除当前页面的注入样式和 DOM，
  菜单仍可在当前页面重新开启；刷新后恢复默认启用。
- **视频无法播放**：媒体块仍展开，用户可点击 X 原生播放控件；不自动重试，不阻塞页面。
- **X 重渲染移除按钮或替换媒体块**：观察器重新标注；若媒体块已被移除或按钮与当前媒体块
  失配，清理残留标注并按当前媒体重新标注，保持页面可用。

## Acceptance Criteria

### Layout

- **AC-layout-rail-collapsed**:
  WHEN 首页或帖子详情在视口宽度 ≥1000px 加载完成, THEN 系统 SHALL 将左栏显示为 88px 图标轨
  并隐藏文字标签。
- **AC-layout-rail-expand**:
  WHEN 用户将指针悬停在左轨或键盘焦点进入导航, THEN 系统 SHALL 将左轨展开为 240px 浮层。
- **AC-layout-rail-no-shift**:
  WHEN 左轨展开时, THEN 正文列的 x 坐标和宽度 SHALL 保持不变。
- **AC-layout-sidebar-hidden**:
  WHEN 首页或帖子详情在 ≥1000px 加载完成, THEN 系统 SHALL 不显示
  `[data-testid="sidebarColumn"]` 及其内容。
- **AC-layout-column-width**:
  WHEN 首页或帖子详情在 ≥1600px、1280–1599px、1000–1279px 加载, THEN 正文列 SHALL 分别为
  760px、720px、680px。
- **AC-layout-column-centered**:
  WHEN 首页或帖子详情在 ≥1000px 加载完成, THEN 正文列 SHALL 在左轨之外的剩余宽度中居中。
- **AC-layout-timeline-width**:
  WHEN 正文列加宽后, THEN 时间线单元格和 `tweetText` SHALL 使用正文列宽度，
  而不是原 600px 上限。
- **AC-layout-masthead**:
  WHEN 首页加载完成, THEN 系统 SHALL 在时间线 tabs 上方显示
  “晨报 · YYYY.MM.DD 星期X”的非粘性刊头。
- **AC-layout-breakpoint**:
  IF 视口宽度 <1000px, THEN 系统 SHALL 不应用左轨、右栏和正文宽度覆盖，只保留浅色主题。

### Media

- **AC-media-trigger**:
  WHEN 首页在视口 ≥1000px 且顶层帖子包含图片或视频, THEN 系统 SHALL 隐藏媒体块并显示
  带 🖼️ 或 🎬 的媒体按钮，不留空白媒体区。
- **AC-media-expand**:
  WHEN 用户激活媒体按钮, THEN 系统 SHALL 在帖子内展开原媒体块。
- **AC-media-expand-layout**:
  WHEN 多图帖的媒体块展开, THEN 系统 SHALL 保留 X 原生的网格行列布局，
  不得把网格容器改为普通块流。
- **AC-media-expand-state**:
  WHEN 媒体块展开时, THEN 媒体按钮 SHALL 显示“收起”，并通过 `aria-expanded="true"` 暴露展开状态。
- **AC-media-collapse**:
  WHEN 用户在展开状态再次激活媒体按钮, THEN 系统 SHALL 隐藏媒体块。
- **AC-media-collapse-state**:
  WHEN 媒体块收起时, THEN 媒体按钮 SHALL 恢复展开态文字，
  并通过 `aria-expanded="false"` 暴露收起状态。
- **AC-media-count**:
  WHEN 顶层帖子有 N 张图片、单张图片或视频, THEN 媒体按钮 SHALL 分别显示“N 张”“图片”或“视频”，
  且 N>1 时才显示数量。
- **AC-media-boundary-scroll**:
  WHEN 展开后的媒体块超过 70vh, THEN 媒体块 SHALL 在内部纵向滚动。
- **AC-media-boundary-actions**:
  WHEN 展开后的媒体块超过 70vh, THEN 帖子操作栏 SHALL 仍可到达。
- **AC-media-fallback**:
  IF 媒体块或公共祖先无法识别, THEN 系统 SHALL 保持原媒体可见，且不为该帖子插入媒体按钮。
- **AC-media-nested-count**:
  WHEN 顶层帖子包含引用帖且引用帖内有媒体, THEN 系统 SHALL 不把引用帖媒体计入顶层帖子数量。
- **AC-media-nested-hidden**:
  WHEN 顶层媒体按钮切换状态, THEN 系统 SHALL 不隐藏引用帖内的媒体。

### Theme and Noise

- **AC-theme-surfaces**:
  WHEN X 处于深色或浅色主题且晨报启用, THEN 页面底色、正文列、帖子正文、元信息、tabs、
  发帖框、媒体按钮、右栏、搜索框和趋势模块 SHALL 使用纸张配色，阅读路径不出现深色大块。
- **AC-theme-actions**:
  WHEN 首页帖子操作栏渲染完成, THEN 操作图标和计数 SHALL 使用 `--xmp-ink-secondary`，
  操作栏上方分隔线 SHALL 使用 `--xmp-hairline`，点赞激活态 SHALL 使用 `--xmp-like`，
  图标视觉尺寸 SHALL 为 16px。
- **AC-theme-other-pages**:
  WHEN X 在搜索或通知页处于深色设置且晨报启用, THEN 右栏、搜索框和趋势模块 SHALL 使用
  纸张配色，不出现深色大块。
- **AC-theme-contrast**:
  WHEN 晨报主题启用, THEN 正文文字与纸张背景的对比度 SHALL ≥7:1，次要文字 SHALL ≥4.5:1。
- **AC-theme-dark-mode**:
  WHEN 用户在 X 设置中切换到深色或 dim, THEN 晨报 SHALL 保持浅色纸感且文字可读。
- **AC-noise-promoted**:
  WHEN 首页加载完成, THEN 含 `[data-testid="placementTracking"]` 的单元格 SHALL 不可见。
- **AC-noise-recommendations**:
  WHEN 首页加载完成, THEN 含 `[data-testid="UserCell"]` 的推荐关注单元格 SHALL 不可见。
- **AC-noise-recommendations-scope**:
  WHEN 用户在搜索或通知页面, THEN 这些页面的 `UserCell` SHALL 保持可见。

### Control and Resilience

- **AC-control-off**:
  WHEN 用户在 Tampermonkey 菜单选择关闭晨报, THEN 页面 SHALL 重新加载并恢复 X 原生外观。
- **AC-control-on**:
  WHEN 用户在关闭后再次选择开启晨报, THEN 页面 SHALL 重新加载并恢复晨报主题。
- **AC-control-storage-fallback**:
  IF 存储不可用, THEN 用户在菜单关闭晨报时系统 SHALL 只在当前页面移除注入样式和 DOM，
  不重新加载；当前页面仍可通过菜单重新开启。
- **AC-resilience-primary**:
  IF `[data-testid="primaryColumn"]` 缺失, THEN 系统 SHALL 只应用主题、跳过版面/刊头/媒体适配，
  并保持 X 原生交互可用。
- **AC-resilience-timeline**:
  IF primary 内已有 `[data-testid="cellInnerDiv"]` 但找不到它们的最近公共容器,
  THEN 系统 SHALL 保留主题、版面和刊头，跳过媒体按钮标注，保留观察器，并保持页面可用。
- **AC-resilience-layout**:
  IF 版面锚点（header/nav 或 primary 内层时间线容器）缺失, THEN 系统 SHALL 只应用主题、
  跳过版面/刊头/媒体适配，并保持 X 原生交互可用。
- **AC-performance-scroll**:
  WHEN 用户连续滚动首页 5 分钟, THEN 页面 SHALL 保持无可见卡顿，
  且不出现脚本引起的 >50ms 长任务。
- **AC-route-status**:
  WHEN 用户通过 X 的 SPA 从首页进入帖子详情, THEN 系统 SHALL 在不刷新页面的情况下应用主题；
  在视口 ≥1000px 时应用 88px 左轨、隐藏右栏、正文列宽度和居中。
- **AC-route-status-exclusions**:
  WHEN 用户进入帖子详情, THEN 系统 SHALL 不显示日期刊头和媒体 emoji 按钮。
- **AC-route-home**:
  WHEN 用户从帖子详情返回首页, THEN 系统 SHALL 在不刷新页面的情况下恢复日期刊头；
  在视口 ≥1000px 时恢复媒体按钮。

### Accessibility and States

- **AC-a11y-media-focus**:
  WHEN 键盘焦点到达媒体按钮, THEN 焦点 SHALL 可见。
- **AC-a11y-media-keyboard**:
  WHEN 焦点位于媒体按钮, THEN Enter 或 Space SHALL 切换媒体的展开状态。
- **AC-a11y-media-name**:
  WHEN 媒体按钮渲染完成, THEN 其可访问名称 SHALL 包含媒体类型和数量。
- **AC-a11y-rail**:
  WHEN 键盘焦点进入左轨, THEN 标签 SHALL 可见。
- **AC-a11y-motion**:
  WHEN 系统偏好 `prefers-reduced-motion: reduce`, THEN 左轨和媒体展开的过渡 SHALL 被禁用。
- **AC-state-loading-colors**:
  WHEN 首页处于加载、空或错误状态, THEN 骨架和空状态 SHALL 使用纸张配色。
- **AC-state-loading-flash**:
  WHEN 首页开始加载, THEN 主题应用前 SHALL 不出现深色闪屏。

## Testing

- **选择器与标注**：在已登录 Chrome 中加载脚本，用 DevTools 检查 `data-xmp-route`、
  `data-xmp-media-state`、`data-xmp-media-block`、媒体块 `id`、按钮的 `aria-*` 和诊断日志。
- **视觉与布局**：在 1440×900 和 1920×953 下截图对比，检查 88px 左轨、无右栏、正文居中、
  日期刊头、纸张配色和细线；覆盖 X 深色与浅色两种设置。在帖子详情页检查左轨、右栏、
  列宽和居中，并确认没有日期刊头和媒体按钮。
- **媒体矩阵**：单图、4 图网格（展开后保持网格布局）、视频、引用帖、链接卡片、推广帖；
  分别验证折叠、展开、收起、70vh 边界、键盘操作和图片/视频原生交互；在 999/1000px
  边界验证媒体行为；在 React 重渲染后检查按钮 `aria-controls` 和媒体块配对。
- **主题表面**：在搜索和通知页的 X 深色设置下检查右栏、搜索框和趋势模块；检查首页帖子
  操作栏的图标、计数、分隔线和点赞激活态。
- **路由**：首页 → 帖子详情 → 返回；检查刊头、媒体按钮和观察器是否按路由恢复或移除。
- **降级**：在本地副本中把 primary 选择器指向不存在的值，验证主题模式、页面可用和单次诊断；
  把时间线根选择器指向不存在的值，验证刊头保留、观察器等待和媒体按钮标注跳过；
  再分别破坏 header/nav 和 primary 内层时间线容器，验证版面锚点降级；恢复真实选择器。
- **控制**：通过 Tampermonkey 菜单关闭和重新开启，确认重新加载后无残留样式/DOM；模拟存储
  不可用或写入失败，确认当前页面可以关闭和重新开启。
- **核心功能冒烟**：在改造后的首页和时间线中手动检查发帖、回复、转发、点赞、搜索、通知、
  私信的入口和一次完整交互；确认操作栏图标、计数和分隔线使用晨报样式，点击和键盘行为与
  X 原生一致。
- **性能**：Chrome Performance 录制 5 分钟滚动；确认无滚动监听、观察器回调合并、
  无脚本引起的 >50ms 长任务。
- **无障碍**：键盘 Tab 走查左轨和媒体按钮；用 Lighthouse/axe 检查对比度和可访问名称；
  用 DevTools 模拟 `prefers-reduced-motion`。
- **状态**：刷新、慢网、空时间线和 X 报错状态；检查无深色闪屏和主题一致性；
  空时间线确认刊头显示，单元格出现后媒体按钮恢复。

## Open Questions

无遗留问题。时间线根以 primary 内 `[data-testid="cellInnerDiv"]` 的最近公共容器判定；
没有单元格时按加载/空时间线处理，不判定缺失；精确 CSS 选择器（包括帖子操作栏和版面锚点）
在编码阶段以现场 DOM 为准；选择器失效属于运行时降级路径，不改变本设计的行为、范围或
Acceptance Criteria。
