# x-paper 选择器与降级参考

本文件记录 `x-morning-paper.user.js` 依赖的现场锚点、运行状态属性和降级行为，供 X 改版时
维护使用。精确选择器仍以现场 DOM 为准；脚本不依赖界面文字。

## 运行状态属性

| Attribute | 值 | 作用 |
|-----------|----|------|
| `data-xmp-enabled` | `1` | `html` 上的主题作用域；关闭脚本时移除 |
| `data-xmp-route` | `home` / `status` / `profile` / `people` / `explore` / `search` / `notifications` / `standalone` / `other` | SPA 路由分类；版面 CSS 对 home/status/profile/people/explore/search/notifications 生效，`standalone` 完全不套主题。`profile` 是 `/<handle>` 及 `/handle/media` 等子页（`RESERVED_HANDLES` 排除 X 自己的保留一级路径）；`people` 是 `/i/connect_people`（「推荐关注」整页）；`explore` 是 `/explore` 及其子路径，`search` 是 `/search`，`notifications` 是 `/notifications` 及其子路径；这几页与首页共用宽版面 |
| `data-xmp-degraded` | `1` | primary 或版面锚点缺失；只应用主题，关闭版面、噪音和媒体 CSS |
| `data-xmp-inner-timeline` | 空 | 标记 primary 内的 600px 时间线容器，供版面 CSS 放宽到 100% |
| `data-xmp-media-block` | 空 | 媒体块标记；折叠态 CSS 的隐藏目标 |
| `data-xmp-media-state` | `collapsed` / `expanded` | 媒体折叠状态；标在顶层帖子或通知行（`article[data-testid="notification"]`）上 |
| `data-xmp-media-loading` | 空 | 展开后的短暂存态；媒体块移出文档流并隐藏，可见媒体图就绪后移除并一次性显示 |
| `data-xmp-notification-thumb` | 空 | 通知行 64px 缩略图的运行时标记，标在包住绘制层（内联背景图）和命中层 `<img>` 的容器上；媒体收集、折叠、按钮标签和悬停预览都按它识别 |
| `data-xmp-tabbar` | 空 | 首页主内容容器内的 tab 栏容器；主题背景标记 |
| `data-xmp-composer` | 空 | 首页主内容容器内的发帖框包装层；主题背景标记。详情页/文章页的回复框不标这个属性，直接按 `inline_reply_offscreen` 写 CSS |
| `data-xmp-divider` | 空 | 首页发帖框后的 1–2px 分隔条；背景透明，由发帖框下边框提供线条 |
| `data-xmp-nav-expanded` | `1` | 左轨展开状态；由 `.xmp-nav-toggle` 点击切换，路由离开或宽度不足时移除 |
| `data-xmp-rail-panel` | 空 | 账号入口所在的固定侧栏层；脚本把它的 left/width 从 275px 收回到 88px（展开 240px），避免账号入口和菜单跑出视口 |
| `data-xmp-appbar` | 空 | 详情页/文章页顶部条；主题用结构选择器直接命中（节点出现即纸色），`markAppBar()` 从 `[data-testid="app-bar-back"]` 向上找带 `backdrop-filter: blur` 或非透明背景的祖先标记它，只作 X 改嵌套后的兜底 |
| `data-xmp-preview-open` | `1` | `.xmp-photo-preview` 悬浮原图预览的显示开关；移出图片/按钮、滚轮或触摸滚动、点击、按 `Esc`、切路由或关闭脚本时移除 |
| `data-xmp-paper-surface` | 空 | 探索/搜索页已有 1px 边框的深色表面（模块卡、侧栏卡、搜索框外壳）；Grok 抽屉输入卡也使用。背景换纸面浮起，边框换细线 |
| `data-xmp-paper-chip` | 空 | 探索/搜索页/Grok 抽屉无边框的深色胶囊（模块按钮、Grok 面板）；背景换纸面浮起，用 inset 阴影补 1px 细线，避免加 border 撑大布局 |
| `data-xmp-paper-text` | 空 | 深底上为浅色文字写的颜色；纸面下改墨色。只标记有直接文字的元素，品牌色不受影响；Grok 里跳过彩色气泡 |
| `data-xmp-paper-link` | 空 | 深底/模块/Grok 抽屉内的 X 蓝文字链接；纸面下改暖橙 |
| `data-xmp-paper-icon` | 空 | Grok 抽屉里落在纸面/深底上的成对图标；纸面下改次要墨色。彩色气泡里的图标不标记 |
| `data-xmp-module` | 空 | 含 `[class*="jf-element"]` 的探索聚合模块单元格；模块内按钮描边和图标配色的作用域 |
| `data-xmp-surface-scan` | 空 | 已扫描过的单元格或侧栏；React 替换内容时由变更记录撤掉并重扫，避免每轮重复扫描 |

`button.xmp-nav-toggle` 是脚本创建并挂到 `body` 的轨道展开按钮：≥1000px、宽版面路由
（home/status/profile/people/explore/search/notifications）且未降级时显示在「更多」项下方
（收起 72px、展开 224px），样式与普通导航项一致，`aria-expanded` 与文案同步；账号悬浮卡或
账号菜单打开时隐藏，关闭脚本或降级时移除或隐藏。悬停和 `:focus-within` 不再触发展开。两个位置
由脚本写入 `html` 的 `--xmp-nav-top`（logo 下方的导航起点）和 `--xmp-toggle-top`（「更多」下方
的按钮位置）两个 CSS 变量，导航和按钮通过它们对齐当前 X 的 logo/更多项布局。

## 配色

主题变量定义在 `THEME_CSS` 的 `html[data-xmp-enabled="1"]` 上，强调色是暖橙：

| 变量 | 值 | 用途 |
|------|----|------|
| `--xmp-paper` / `--xmp-paper-raised` | `#FBFAF7` / `#F4F1E8` | 纸面 / 浮起表面 |
| `--xmp-ink` / `--xmp-ink-secondary` | `#1B1B1B` / `#5C5A52` | 正文 / 次要文字 |
| `--xmp-hairline` / `--xmp-rule` | `#D8D4C8` / `#E6E1D5` | 细线 / 分隔线 |
| `--xmp-accent` / `--xmp-accent-deep` / `--xmp-accent-soft` | `#B4531F` / `#97451A` / `#F3E3D3` | 链接、选中标签、主按钮、进度条 / 悬停 / 浅底 |
| `--xmp-like` | `#A8442E` | 点赞激活 |

已认证徽章（`[data-testid="icon-verified"]`）保留 X 原本的蓝色，主题不再染色。

## 界面语言

脚本生成的界面文案跟随 X 的 `html[lang]`（读不到时回退 `navigator.language`）：`zh*` 使用
`TEXT.zh`，其他语言使用 `TEXT.en`；X 自身的界面仍由 X 本地化。脚本不保存语言设置。评论数使用
对应 locale 的 `Intl.NumberFormat(..., { notation: 'compact' })`（中文 `1.2万`，英文 `12K`）。

## 时间格式

脚本读取 primary 内每个 `time[datetime]` 的 `datetime`，把可见文本重写为本地时间：

- 当天：`HH:mm`
- 昨天：中文 `昨天·HH:mm`；英文 `Yesterday·HH:mm`
- 更早：中文 `M月D日·HH:mm`（跨年 `YYYY年M月D日·HH:mm`）；英文 `Nov 2·HH:mm`
  （跨年 `Nov 2, 2025·HH:mm`）

`datetime` 无效时保持 X 原文本。X 重渲染后由首页扫描或路由回调重新格式化。

## 现场锚点

现场结构记录于 2026-11-02 的探针（1920×953，X 深色主题）；通知页结构于 2026-11-09 补充核验。

| 用途 | 选择器 | 备注 |
|------|--------|------|
| 主导航容器 | `header[role="banner"]` | 原宽 595px；内部 nav 原为 `position: fixed; left: 320px; width: 275px` |
| 导航链接 | `[data-testid^="AppTabBar_"]` | 选择器健康检查的 nav 锚点 |
| 发帖 / 账号 | `SideNav_NewTweet_Button` / `SideNav_AccountSwitcher_Button` | 左轨中隐藏文字标签 |
| 正文列 / 右栏 | `[data-testid="primaryColumn"]` / `[data-testid="sidebarColumn"]` | 右栏在 home/status/profile/people/explore/search/notifications 隐藏 |
| 内层时间线 | primary 内计算样式 `max-width: 600px` 的容器 | 加 `data-xmp-inner-timeline` 后放宽 |
| 时间线单元格 | `[data-testid="cellInnerDiv"]` | 时间线根 = 这些单元格的最近公共容器；通知页也使用 |
| 帖子 / 正文 | `[data-testid="tweet"]` / `[data-testid="tweetText"]` | 顶层帖子没有祖先 `tweet`；通知行只有 `tweetText`，没有 `tweet` |
| 通知行 | `article[data-testid="notification"]` | 行内没有 `tweet`、`User-Name`、操作栏或 status 链接；头像是 `UserAvatar-Container-<handle>` 下的 `/<handle>` 链接 |
| 通知缩略图 | 通知行尾部 64px 内联 `background-image`（`pbs.twimg.com`，`name=120x120`） | 没有 `tweetPhoto` 标记；按尺寸和地址打 `data-xmp-notification-thumb` |
| 图片 / 视频预览 | `[data-testid="tweetPhoto"]` / `[data-testid="previewInterstitial"]` | 媒体收集目标 |
| 链接卡片 | `[data-testid="card.wrapper"]` | 卡片内媒体不折叠 |
| 推广单元格 | 包住帖子的 `[data-testid="placementTracking"]`（在 `[data-testid="tweet"]` 之外） | 首页和详情/文章页 `cellInnerDiv:has(...)` 隐藏；视频播放器的 `placementTracking` 在 `tweetPhoto` 内、帖子之内，不算推广 |
| 推荐关注 | `[data-testid="UserCell"]` | 首页隐藏；搜索/通知页保持可见 |
| 操作组 | `[role="group"]` | 媒体块祖先不得包含它；图标 16px、计数 13px |
| 搜索框 / 趋势 | `SearchBox_Search_Input` / `trend` | 其他页面主题表面；探索/搜索页的搜索框外壳由 `markSearchChrome()` 按圆角 + 边框标记 |
| 探索聚合模块 | 单元格内 `[class*="jf-element"]` | 选举、体育赛程、比赛提供方等聚合卡；标 `data-xmp-module`，按计算样式扫深色表面 |
| 探索/搜索侧栏卡 | `[data-testid="sidebarColumn"]` 内计算背景亮度 < 90 的块 | 宽度 ≥200、高度 ≥20 的深色容器视为卡片，标 `data-xmp-paper-surface` |
| 搜索过滤单选 | `[data-testid="radioGroupPeople"]` / `radioGroupLocation` | 选中态与未选中态按 `input:checked` 和纸面细线重绘 |
| Grok 抽屉 | `[data-testid="GrokDrawer"]` / `GrokDrawerHeader` / `chat-drawer-main` | 抽屉根在 body 末尾；打开/关闭会替换根节点 |
| 评论按钮 | `[data-testid="reply"]` | 捕获阶段拦截；只对 home/profile/explore/search/notifications 生效，且需要所在单元格有 status 链接 |
| 首页 tab 栏 | 首页主内容容器的第一个子元素；含 `[role="tablist"]` | 标 `data-xmp-tabbar`；容器和子 div/nav 都要纸色 |
| 首页发帖框 | 主内容容器的发帖框包装层；含 `[data-testid="tweetTextarea_0"]` 和 `toolBar` | 标 `data-xmp-composer`；外层和子 div 都要纸色 |
| 发帖按钮 | `[data-testid="tweetButtonInline"]` | 主按钮使用 `--xmp-accent` |
| 多图轮播 | 帖子内 `[data-testid="ScrollSnap-List"]` | X 当前多图媒体使用滚动轮播；媒体块取该轮播容器 |
| 详情页顶部条 | `[data-testid="app-bar-back"]` 的 blur/带背景祖先 | 标记为 `data-xmp-appbar`；条本身没有稳定 testid |
| 详情页回复框 | `[data-testid="inline_reply_offscreen"]` | 无 `toolBar`；主题按该 testid 直接写 CSS（纸色 / 内部 div 透明 / 按钮暖橙），不依赖 JS 标记 |
| 文章内嵌引用帖 | `[data-testid="simpleTweet"]` | 纯黑底 + 深灰边，墨色文字在其上不可读 |
| 文章代码块 | `[data-testid="markdown-code-block"]` | 首个子 div 是 28px 头部条，`pre > code` 带内联浅色 |
| 文章升级横幅 | `[data-testid="twitterArticleReadView"] [role="status"]` | 深蓝底 `rgb(2,17,61)` |
| 文章阅读进度条 | `[data-testid="progressBar-bar"]` | X 蓝 `rgb(29,155,240)` |
| 线程短尾 | 头像行上一行里的 `div:only-child` | 回复头像上方 2×8 的深色连接线 |

## 媒体

- 只处理 `!tweet.parentElement.closest('[data-testid="tweet"]')` 的顶层帖子；通知行按
  `article[data-testid="notification"]` 作用域处理（见「通知页」）。
- 视频的海报层也是 `tweetPhoto`，并且**包住** `previewInterstitial`；收集媒体时同时排除「在 interstitial 内部」
  和「内部含 interstitial」两种 `tweetPhoto`，否则一个视频会被算成「图片 1 + 视频 1 = 2 项」。
- 先检查多图轮播：媒体元素最近的 `[data-testid="ScrollSnap-List"]` 若在帖子内、包含本次收集到的
  **全部**媒体、且不含 `tweetText` 或 `[role="group"]`，直接作为媒体块；只含部分媒体时退回
  公共祖先算法，避免只折叠轮播而留下其余媒体。
- 非轮播媒体块是包含全部本次媒体、且不含 `tweetText` 和 `[role="group"]` 的最近祖先。确定后
  继续向上提升到仍只包含媒体的最高祖先；遇到 `tweetText`、作者行、引用帖、卡片、操作组或
  媒体按钮即停止。X 的单图和轮播都会在内层绝对定位层之外保留定高外壳，只隐藏内层会留下空白。
- 引用帖媒体不嵌套为第二个 `[data-testid="tweet"]`，媒体收集同时覆盖引用帖内容，包括引用帖
  内的卡片媒体。帖子有自有媒体时优先折叠自有媒体；只有引用帖媒体时折叠引用帖内的媒体。
  帖子外层的链接卡片媒体仍排除。
- 按钮 `button.xmp-media-toggle` 按内容宽度显示（`align-self: flex-start`），带 `aria-expanded`、
  `aria-controls` 和可访问名称；`aria-controls` 指向媒体块 id。媒体块已有 id 时复用它，
  否则生成 `xmp-media-block-<n>`。
- 折叠只加 `display: none` 覆盖；展开移除覆盖，恢复原 grid/flex，设 `max-height: 70vh` 和
  `overflow-y: auto`。适配器不向媒体块写内联 `display`。
- 单图 `🖼️ 图片`；多图 `🖼️ 图片 · N 张`；视频 `🎬 视频`；混合 `🎬 媒体 · N 项`。
- 引用帖内的媒体块和按钮各自左右缩进 12px，媒体块底部再留 12px，和引用卡正文对齐；展开时
  媒体不会覆盖引用卡的左右或底部边框，图片/视频圆角 12px。
- 折叠态 `display:none` 会让 X 延后加载展开后的大图/网格变体；点击后直接显示会闪空。
  按钮的 `pointerenter`/`focus` 先预热当前块里的图片和背景图 URL。点击展开时给块加
  `data-xmp-media-loading`：块以 `position: absolute` 移出文档流并 `visibility: hidden`，
  保持页面高度不变，让 X 渲染并加载真实媒体。轮询块内**可见**的 inline
  `background-image` URL（这是实际绘制层；`<img>` 多为 opacity 0 的命中层）并在
  `Image` 缓存中加载；全部就绪或 700ms 超时后移除标记，块恢复文档流并一次性显示。
  网格需要等所有可见单元，轮播只等当前可见 slide；不显示空白占位，也不触发内部滚动条。
- 媒体块或公共祖先找不到时不插入按钮，原媒体保持可见。
- 媒体按钮只在 home 路由标注（`scanTimeline` 要求 `route === 'home'`），详情页不显示媒体按钮。
- 悬浮原图预览有两个入口，都不需要先展开媒体：
  1. **折叠按钮** `.xmp-media-toggle`：`pointerover` 后延时 220ms，取 `aria-controls` 指向的媒体块里
     全部静帧（图片 + 视频海报）并排预览。视频海报是包住（或位于）`previewInterstitial` 的
     `tweetPhoto`，折叠态只有 `amplify_video_thumb/...?name=120x120` 缩略图，同样换成 `name=orig`
     （实测 120×68 → 1920×1080）；只显示封面静帧，不创建 `<video>`、不播放。标题按内容为
     `N 张 · 原图`、`视频封面`、`N 个视频封面` 或 `N 项 · 原图/封面`。
  2. **已展开的图片** `[data-testid="tweetPhoto"]`（≥40px、非视频海报、非卡片、不在
     `data-xmp-media-loading` 存态）：只预览悬停的那一张，先用已下载尺寸立即显示、原图解码完替换，
     标题 `第 n / N 张 · 原图`。已展开的视频本身在播放，不再弹封面预览。
  绘制层取内联 `background-image` 的 URL，取不到时退回 `img.currentSrc || img.src`；
  `pbs.twimg.com` 的 URL 把 `name=` 参数换成 `orig` 得到原图，已加载过的原图记在 `previewReady` 里。
  浮层 `pointer-events: none`；移出图片/按钮、点击、`Esc`、切路由、宽度跌破 1000px 或关闭脚本都会收起。
  **不要监听 `scroll` 事件**：X 加载图片时的滚动锚定会触发 scroll，把刚打开的预览误关；只在
  `wheel`/`touchmove` 时收起。浮层尺寸按图片数量分级（单图最多 88vh，2 张 66vh，3 张以上 30vh 并换行）。
  浮层是 `position: fixed; left: 50%`，宽度 auto 时 shrink-to-fit 只按右半视口计算；必须设
  `width: max-content` 再加 `max-width: min(1600px, 92vw)`，否则两张竖图并排会被误判放不下而换行，
  卡片高度超过 92vh、图片溢出纸框。3/4 张和 `many` 由 `flex-wrap` 和 `max-width` 决定每行数量。

## 个人主页

- 路由：`/<handle>`（含 `/<handle>/media` 等子页）归为 `profile`，与 home/status 共用宽版面：
  88px 轨道、隐藏右栏、正文列 680/720/760px 居中；横幅、头像随列宽缩放，轨道展开按钮和账号入口
  同样生效。`checkSelectorHealth` 需要的内层 600px 容器在个人主页存在，不会降级。
- 观察器在 home 和 profile 运行（格式化时间、标记表面）；媒体折叠在 home 和 profile 都生效，
  详情页（status）不折叠。
- 操作按钮：`[data-testid$="-follow"]`（关注）用暖橙实心 + 纸色文字，`:hover` 暖橙深色；
  `[data-testid$="-unfollow"]`（正在关注）用纸面浮起 + 细线 + 墨色，`:hover` 转暖红。
- 操作行通用规则：`div:has(> div > button[data-testid="userActions"])` 是操作行的稳定锚点
  （「更多」按钮一定在行内），行内除关注类以外的 `button`/`a[role="button"]` 统一纸面浮起 + 细线 +
  墨色，图标也改墨色，`:hover` 暖橙描边；`[aria-pressed="true"]` 的图标保留暖橙。已关注用户的
  「接收通知」铃铛没有 testid（`aria-label="开启帖子通知"`，图标带 X 内联浅色），靠这条通用规则
  覆盖，后续新增按钮同样生效。
  顶部返回条由 `data-xmp-appbar` / 结构选择器主题化，与详情页一致。

## 详情页与文章页表面

- 顶部条（`帖子`/`文章`）是 `rgba(0,0,0,0.65)` + `backdrop-filter: blur(12px)`，没有稳定 testid。
  主题用结构选择器 `div:has(> div > div > [data-testid="app-bar-back"])` 直接命中，节点一出现就是
  纸色 + 下沿细线，不会先闪黑；`markAppBar()` 从 `[data-testid="app-bar-back"]` 向上找带 blur 或
  非透明背景的祖先标 `data-xmp-appbar`，只作为 X 改嵌套后的运行时兜底。X 还把标题写成内联
  `color: rgb(231, 233, 234)`，由 primary 内的内联浅色文字规则统一改墨色。
- 回复框（`发布你的回复`）是 `[data-testid="inline_reply_offscreen"]` 内的纯黑层，且没有
  `toolBar`。主题按该 testid 直接覆盖（纸色、内部 div 透明、`tweetButtonInline` 暖橙、禁用态纸面浮起），
  同样不依赖 JS 标记；`markComposer()` 只负责首页发帖框。
- 文章页其余深色表面：`[data-testid="simpleTweet"]`（内嵌引用帖，纯黑底）、
  `[data-testid="markdown-code-block"]`（`pre` 深底 + 28px 头部条）、文末 `[role="status"]`
  升级横幅（`rgb(2,17,61)`）、`[data-testid="progressBar-bar"]` 阅读进度条（X 蓝）。
  主题分别换成纸面浮起色 + 细线、纸色代码块（语法色统一墨色）、暖橙进度条。
- 线程竖线有两段：头像**下方**的长线是 `Tweet-User-Avatar ~ div:last-child`；回复头像**上方**还有
  一段 2×8 的短尾，位于头像行的上一行里（`div:has(+ div > div > Tweet-User-Avatar) > * > * > div:only-child`），
  两段都要涂 `--xmp-rule`，否则短尾保持 X 的深色 `rgb(51,54,57)`。

## 推荐关注整页

- `/i/connect_people`（个人主页「推荐关注」里的「显示更多」）归为 `people`，与 home/status/profile
  共用宽版面；该页没有内层 600px 时间线容器，因此 `checkSelectorHealth` 把内层锚点视为**可选**，
  只要求 header、nav 和 primaryColumn，找不到内层容器时不再降级。
- 顶部条、标签页和关注按钮沿用同一套规则：顶部条走 `data-xmp-appbar` / 结构选择器，标签选中暖橙，
  关注按钮暖橙实心 + 纸色文字。

## 探索与搜索

- 路由：`/explore` 及子路径归为 `explore`，`/search` 归为 `search`。两页加入 `isWideRoute`，
  与首页共用宽版面：≥1000px 时 88px 轨道、680/720/760px 居中正文列、隐藏右栏；<1000px 时回到
  X 原生布局。`isSurfaceRoute()` 仍只用于主题表面的运行时标记。
- 探索/搜索没有首页的内联发帖框。`SideNav_NewTweet_Button` 在首页/详情/个人主页/推荐关注页隐藏，
  在探索/搜索/通知页保留并收成 52px 圆形 FAB（left 18px、bottom 96px、暖橙底 + 纸色笔形 mask
  图标），避免 X 的 275px 宽版按钮停在收起轨道旁；文本子 div 隐藏，原生 `href="/compose/post"`
  保持不变。
- 搜索页的右栏是「搜索过滤」；宽版面隐藏右栏后这组过滤控件不再显示（与首页结构一致），
  搜索词仍可通过输入框和 X 语法调整。`<1000px` 时右栏恢复，侧栏卡会按下面的规则换肤。
- 搜索框：`form[role="search"]` 内 `[data-testid="SearchBox_Search_Input"]` 向上，
  带 1px 边框且 `border-radius ≥ 8px` 的圆角层是可见胶囊，`markSearchChrome()` 标记它；
  探索页这个胶囊是纯黑 `rgb(0,0,0)`，搜索页是 `rgb(51,54,57)` 描边、透明底。
  输入框本身改透明，放大镜等 `svg` 改 `--xmp-ink-secondary`。
- 首帧搜索框：外壳是 X 深色 class，不能等 JS 标记。结构规则
  `[data-testid="primaryColumn"] div:has(form[role="search"])` 把容器提前上纸色，
  `form[role="search"] > div > div`（可见圆角胶囊）提前设纸面浮起 + 细线。
- 顶栏标签：选中标签的下划线是内联 `background-color: rgb(29, 155, 240)` 的 4px div，
  主题按内联蓝精确命中改成 `--xmp-accent`；选中标签文字暖橙，未选中用 `--xmp-ink-secondary`。
- 深色表面：模块卡、侧栏卡、搜索框外壳和底部「显示更多」条没有稳定 testid，`markExploreSurfaces()`
  按**计算样式**识别（`backgroundColor` 亮度 < 90 且不透明度 ≥ 0.4、无 `background-image`、
  尺寸达标），逐个打 `data-xmp-paper-surface` / `data-xmp-paper-chip`：
  - 已有 1px 边框的表面标 `paper-surface`，只换边框色（侧栏卡、模块卡）；
  - 无边框的按钮/胶囊标 `paper-chip`，用 `box-shadow: inset 0 0 0 1px` 补细线，避免 border 撑大布局。
- 文字翻转：深底上的浅色文字（计算颜色亮度 ≥ 170）标 `data-xmp-paper-text`，纸面下改墨色；
  X 蓝（`rgb(29, 155, 240)`）标 `data-xmp-paper-link` 改暖橙。只标记**有直接文字节点**的元素，
  党派色、比分绿勾等品牌色（亮度低于阈值）保持原样。选举/体育模块的白字来自内联
  `text-shadow: rgb(255, 255, 255)`，同样落在浅色阈值里。
- 聚合模块：无 `tweet`/`trend`/`UserCell`、含 `[class*="jf-element"]` 的单元格标 `data-xmp-module`，
  整格扫描表面和文字；模块卡内的按钮描边统一细线、图标改墨色。`jf-element` 是 X 聚合卡
  （选举、体育赛程、比赛提供方）自己的类名前缀，不是生成的 `r-*` class。
- 侧栏（<1000px 或降级时可见）：`[data-testid="sidebarColumn"]` 内宽度 ≥200、高度 ≥20 的深色块
  视为卡片（`搜索过滤`、`有什么新鲜事`、`推荐关注`）；卡内浅色标题/标签翻墨色，X 蓝
  「高级搜索」「显示更多」翻暖橙。侧栏关注按钮按 `[data-testid$="-follow"]` 用暖橙实心 +
  纸色文字；搜索过滤的 radio 选中态用暖橙实心 + 纸色勾，未选中用纸面 + 细线。
- 观察器：探索/搜索页由 `startSurfaceObserver()` 观察 **`main[role="main"]`**（不是
  `primaryColumn`：X 在 SPA 切路由时可能整块替换 primary），200ms 防抖；侧栏也在 `main` 内。
  React 替换内容时 `invalidateSurfaceScan()` 按变更记录撤掉对应单元格/侧栏的
  `data-xmp-surface-scan`，下一轮重扫；已标记的单元格不会每轮重复扫描。
  路由切换/1.2s 延迟刷新还会 `clearSurfaceScanFlags()` 强制重扫全部单元格：新内容可能在
  观察器挂到新 `main` 之前就已渲染，只靠变更记录会漏掉（表现为模块卡在 SPA 切换后保持深色）。
- 清理：离开这两页时 `stopSurfaceObserver()` + `clearSurfaceMarkers()`，DOM 复用时不会把
  `data-xmp-paper-*` 样式带到首页/详情页；关闭脚本同样清理。
- 主题只接管深色表面，媒体、文章预览卡和事件头图保持原生：`eventHero`、`tweet`、`trend`、
  `UserCell` 以及包含 `img` 的单元格不参与表面扫描。
- 媒体折叠只在首页、个人主页和通知页运行；探索/搜索的帖子媒体保持原生展开，不插入
  `xmp-media-toggle`。

## 通知页

- 路由：`/notifications` 及子路径（`/notifications/mentions` 等）归为 `notifications`，加入
  `isWideRoute`：≥1000px 时 88px 轨道、680/720/760px 居中正文列、隐藏右栏；标签栏（`全部`/
  `提及`，53–54px 高的 `ScrollSnap-List` + `nav`）由 `markTabbar()` 按“只含标签栏的小容器”
  标记，纸色 + 暖橙选中下划线。通知页没有内联发帖框，`SideNav_NewTweet_Button` 收成 52px FAB。
- 通知行是 `article[data-testid="notification"]`，结构与帖子不同，这些锚点**都不存在**：
  `[data-testid="tweet"]`、`[data-testid="User-Name"]`、`[role="group"]`、`[data-testid="reply"]`、
  指向 `/status/` 的链接。行内只有：左侧通知类型图标、`UserAvatar-Container-<handle>` 里的
  `/<handle>` 头像链接、标题行（`来自 …` + `time[datetime]`，时间不在链接里）、`tweetText`
  预览、右侧“更多”（`data-testid="caret"`）和 64px 缩略图。
- 影响：时间格式化照常生效（`time[datetime]` 在 primary 内）；评论弹窗和“正文/时间戳新标签页”
  无锚点可用，只有头像链接走新标签页（`UserAvatar-Container-*` → `isProfileHref`）；行本身的
  点击继续交给 X 在当标签打开。
- 媒体折叠：缩略图是 64px 的内联 `background-image`（`pbs.twimg.com`，`name=120x120`）+ 同名
  `<img>`，没有 `tweetPhoto`。`markNotificationThumbs()` 把标记打在**包住绘制层和 `<img>` 的
  容器**上（`data-xmp-notification-thumb`），通知作用域的 `collectMedia()` 把它算作图片；因为
  标记就在媒体容器自身上，`findMediaBlock()` 从该元素开始（而不是父级），`MEDIA_BLOCK_STOP`
  包含 `[data-testid="caret"]`，媒体块停在缩略图外壳、不会连「更多」按钮一起隐藏。折叠按钮插在
  缩略图所在列中（列宽 76px，按钮 68×30）。
- 悬停预览：`PHOTO_SELECTOR` 同时匹配 `tweetPhoto` 和 `data-xmp-notification-thumb`；
  `mediaStills()`/`mediaPhotos()` 在作用域自身命中时把它计入。折叠按钮悬停预览缩略图里的
  原图（`name=120x120` → `name=orig`）；展开后悬停缩略图也按单张原图预览。
- 观察器：`isTimelineRoute()`（home/profile/notifications）决定 primary 观察器、时间刷新和媒体
  标注；`<1000px` 不运行。
- SPA 切换：X 会在 `pushState` 之后整块替换 `primaryColumn`，路由回调体检到的是旧节点，内层
  600px 容器标记和 primary 观察器都会失效（通知页正文停在 600px、时间不再刷新）。`syncTimelineRoute()`
  在 1.2s 刷新时按当前 primary 重新 `checkSelectorHealth()`、重挂观察器并扫描。
- 降噪：包住帖子的 `placementTracking` 外壳在 home/status/notifications 隐藏；`placementTracking`
  也是视频播放器的通用可见性容器（播放开始后出现在 `tweetPhoto` 内），匹配时必须排除
  `[data-testid="tweet"]` 内的实例，否则整条帖子会被当成推广隐藏。`UserCell`（推荐关注）
  只在首页隐藏，通知页保持可见。
- 主题：通知行沿用全局墨色/纸面规则；通知类型图标保留 X 自己的颜色（紫、蓝等品牌色），
  时间与预览文本使用 X 的内联次要色。

## 首帧与提前着色

- 首次进入/刷新 home 时，tab 栏（`rgba(0,0,0,0.65)` + blur）和发帖框（纯黑）会在 JS 标记前按 X 深色
  绘制。主题用结构选择器提前上纸色，消除首帧闪黑：
  - tab 栏：`[data-testid="primaryColumn"] div:has(nav[role="navigation"]):not(:has([data-testid="tweet"]))`
  - 发帖框：`div:has([data-testid="tweetTextarea_0"], [data-testid="toolBar"]):not(:has([data-testid="tweet"]))`
  JS 的 `data-xmp-tabbar` / `data-xmp-composer` 标记仍保留，负责边框、间距和子元素透明等细节。
  实测把这两个标记全部移除后，顶部 400px 内不再有深色层。
- `markTabbar()` 只标记"只含标签栏"的小容器（高度 ≤120px、不含 `tweet`/`User-Name`）。个人主页的
  标签页没有独立容器，向上会爬到整列；误标会让 `[data-xmp-tabbar] div` 的透明规则清掉整列卡片的
  背景（包括深绿的「你尚未通过认证」卡）。未标记的标签页（个人主页、推荐关注）由结构规则兜底：
  容器纸色 + `nav[role="navigation"]` 的底边改细线。
- 顶部条徽章：`[data-xmp-appbar]` 的文字规则排除 `icon-verified`、`-follow`/`-unfollow` 后代，
  已认证徽章保持 X 原本的蓝色渐变，关注按钮保持纸色文字。
- 内联深色卡片：`markDarkSurfaces()` 扫描 primary 里带内联 `background-color` 的元素，亮度 < 90 标
  `data-xmp-dark-surface` 并恢复浅色文字/图标（C 端推广卡在不同账号下颜色可能不同，用它兜底）；
  已知深绿「你尚未通过认证」卡另有 CSS 直接命中（`background-color: rgb(0, 67, 41)`）。

## Grok 抽屉

- 抽屉根是 `[data-testid="GrokDrawer"]`，在 `body` 末尾、`primaryColumn` 外；入口按钮是
  `[data-testid="GrokDrawerHeader"]`（`aria-label="Grok"`），聊天按钮是
  `[data-testid="chat-drawer-main"]`。帖子头部的 Grok 总结入口**没有 testid**，`aria-label`
  随界面语言变化（中文「Grok 操作」），不能靠它做点击重挂。
- X 打开/关闭抽屉时会**替换根节点和它上面两层包装**，挂在旧根上的观察器会失效；但 `#layers`
  的直接子层（`drawer.closest('#layers > div')`，含 Grok、聊天、BottomBar 三个抽屉层）保持不变。
  `ensureGrokObserver()` 观察这一层（`childList + subtree`，200ms 防抖）接住根节点替换和流式内容。
  开合瞬间抽屉会短暂缺席，`grokLayer()` 此时沿用仍 `isConnected` 的旧层，否则移除变更触发的扫描
  会把观察器断掉、抽屉回来后停在深色。
- `markGrokSurfaces()` 复用 `scanPaperSurfaces()` 标记深色面板/输入卡，再用
  `nearestPaperBackground()` 只翻转最近底色为纸面或深底的文字/图标；用户消息的彩色气泡
  （例如蓝色气泡）里的白字和白图标保持原样。图标标记为 `data-xmp-paper-icon`。文字选择器额外
  包含不带 `dir` 的纯 `div`（引用帖卡片的作者名是裸 `div`，默认 `div[dir]` 会漏标留下白字）。
- Grok 抽屉的深色面板是 `[data-testid="GrokDrawer"]` 的第一个 div（无边框，标
  `data-xmp-paper-chip`）；输入卡是 376×104、`border-radius:24px`、1px 边框的 div（标
  `data-xmp-paper-surface`）；编辑器是 `div[role="textbox"][aria-label="Ask anything"]`。
- 抽屉头部 `GrokDrawerHeader` 和聊天按钮 `chat-drawer-main` 沿用纸面浮起 + 细线规则。

## 评论弹窗

- 只拦截评论按钮 `[data-testid="reply"]`：在 **window 捕获阶段** preventDefault + stopPropagation
  + stopImmediatePropagation，阻止 X 跳到 `/compose/post`；帖子正文/时间链接不拦截。
  只对 home/profile/explore/search/notifications 生效，`[role="dialog"]` 内不拦截。window 捕获
  确保先于 X 和可能仍在运行的旧版脚本。
- 从 `reply.closest('[data-testid="tweet"]')` 找到顶层帖子，再用
  `cellStatusLink(cell)` 取带 `time[datetime]` 的 `/handle/status/id` 链接。
- 数据接口：`/i/api/graphql/<queryId>/TweetDetail`，当前 queryId
  `qpemjmVMoTWDvcRT43JIVQ`；`variables` 由 `focalTweetId` 等组成，`features` 42 个开关、
  `fieldToggles` 8 个开关保存在脚本顶部。请求头：
  - `authorization`: X Web 公开 bearer（脚本常量，非账号凭据）
  - `x-csrf-token`: 页面 `ct0` cookie
  - `x-twitter-auth-type: OAuth2Session`、`x-twitter-active-user: yes`、
    `x-twitter-client-language`、`content-type: application/json`
  - 实测不需要 `x-client-transaction-id`；`credentials: 'include'`。
  - HTTP 400/404 时从 `main.*.js` 正则 `queryId:"...",operationName:"TweetDetail"` 重新发现
    queryId 并重试一次。
- 响应：`data.threaded_conversation_with_injections_v2.instructions[].entries[]`。
  - `TimelineTimelineItem` 的 `content.itemContent`、`TimelineTimelineModule` 的
    `content.items[].item.itemContent` 都可能含推文。
  - `TweetWithVisibilityResults` 需要 `.tweet` 解包；按 `rest_id` 去重。
  - 用户：`core.user_results.result.core.name/screen_name`、`avatar.image_url`；
    资料卡还用 `profile_bio.description`、`location.location`、`relationship_counts`。
  - 正文：`note_tweet.note_tweet_results.result.text` 优先，否则 `legacy.full_text`；
    媒体：`legacy.extended_entities.media`；查看数：`views.count`；时间：`legacy.created_at`。
- 过滤与层级：
  - 只保留 `focal` 之后、`legacy.conversation_id_str === focal.conversation_id_str` 的推文，
    并跳过 `promotedMetadata`/`legacy.promoted`。X 会在对话模块里混入其他帖子，不能全当评论。
  - 用 `legacy.in_reply_to_status_id_str` 建树；只保留能连到原帖的回复。
    每个顶层回复包在 `.xmp-comments-thread` 中：`.xmp-comments-replies > .xmp-comments-thread`
    才有底部分割线（最后一个除外），父子回复之间**没有**分割线；嵌套线程
    `.xmp-comments-children` 做 20px 缩进 + 16px padding，不再用整组 `border-left`。
    每个子线程 `::before` 沿父头像中心画竖线、`::after` 画 14px 短横线接到子头像，形成 `|_`；
    有子回复的行加 `.has-children`，`::after` 从头像下方画线接上子树。最后一个子线程用
    `:last-child::before` 的 16×35 border-left + border-bottom +
    `border-bottom-left-radius: 8px` 在头像中心圆角转弯并停止，不能延伸到最后一个头像下方；
    每条非原帖评论显示回复对象（中文「回复 @parent」，英文「Reply to @parent」）。
- 互动：
  - 喜欢/取消：`FavoriteTweet`（`lI07N6Otwv1PhnEgXILM7A`）/
    `UnfavoriteTweet`（`ZYKSe-w7KEslx3JhSIk5LA`），POST body
    `{variables:{tweet_id},queryId}`，头部同 TweetDetail；实测不需要 transaction id。
    未点赞用空心 `COMMENT_HEART_OUTLINE_PATH`，点赞后用实心 `COMMENT_HEART_PATH` 和
    `--xmp-accent` 暖橙色；乐观更新 `path.d`/`aria-pressed`/计数，失败回滚。
  - 回复：在弹窗内展开 `.xmp-comments-composer`，提交时 POST
    `/i/api/graphql/<queryId>/CreateTweet`，当前 queryId `l4hk8uVGvR-a8kzQ4nOhPA`。body：
    `{variables:{tweet_text, reply:{in_reply_to_tweet_id,exclude_reply_user_ids:[]},
    media:{media_entities:[],possibly_sensitive:false},semantic_annotation_ids:[],
    disallowed_reply_options:null}, features, fieldToggles, queryId}`；`batch_compose` 传
    `'off'` 会触发 GraphQL 校验错误，省略。HTTP 400/404 时从 `main.*.js` 正则
    `queryId:"...",operationName:"CreateTweet"` 重新发现 queryId。每次 POST 前生成
    `x-client-transaction-id`（见下节）；缺少这个头时 X 会返回误导性的 344。成功后重新请求
    TweetDetail 并保留 `.xmp-comments-body` 的滚动位置；失败把接口错误显示在输入框下方。
    只支持纯文字、280 字；不打开 X 原生 composer 独立窗口，也不在同一页用隐藏 anchor。
  - 资料：与主页 HoverCard 一致的悬停卡片。头像/用户名 `pointerenter` 250ms 后展示，
    离开 180ms 后收起；鼠标进入卡片取消收起。卡片挂到 `body`、`position: fixed`、
    `z-index: 2100`，不会被弹窗的 overflow 裁切；滚动（窗口或 `.xmp-comments-body`）、
    resize、点击外部、关闭弹窗都会移除。`.xmp-comments-action` 的「资料」/「Profile」按钮可点击
    钉住/取消，只保留一张卡；该按钮带 `.xmp-comments-action-profile`，外部点击判定依赖这个
    class，不按 `aria-label` 文案匹配（文案随界面语言变化）。资料卡数据来自同一条 TweetDetail
    响应，不额外请求。
- 渲染：所有文字用 `textContent`；先解码 HTML 实体，再把 t.co 链接替换为 `display_url`；
  媒体 t.co URL 从正文删除，渲染 `media_url_https` 缩略图（视频/GIF 加角标）。
  不使用 innerHTML 拼接用户内容。
- 弹窗结构：`.xmp-comments`（fixed overlay）+ `.xmp-comments-panel` + `.xmp-comments-body`
  （溢出滚动）。输入框 `.xmp-comments-composer` 挂在被回复评论的 `.xmp-comments-main` 内；
  `Esc` 在输入框打开时只收起输入框，不关闭弹窗；提交期间不允许收起。关闭：`×`、`Esc`、
  点击 backdrop、切路由、关闭脚本；请求用 AbortController，关闭后忽略迟到响应。失败时显示
  「重试」和「在新标签页打开帖子」。
- **不要**在打开时给 `html`/`body` 加 `overflow: hidden`：Chrome 会把首页滚动位置清到 0。
  改为在 overlay 上阻止 `wheel`/`touchmove`（`.xmp-comments-body` 内放行），键盘滚动键
  同样阻止；关闭后首页滚动位置不变。
- 只渲染接口返回的第一页评论，不加载更多；回复在弹窗内完成，只支持纯文字（280 字），
  不支持图片、视频或投票。

## x-client-transaction-id

只用于 `CreateTweet`；读取和点赞不需要。

- 初始化：`fetch('/i/jf/', { credentials: 'omit' })` → `DOMParser`：
  - `[name='twitter-site-verification']` 的 `content` 是 base64 key；
  - 4 个 `[id^='loading-x-anim']` SVG，`keyBytes[5] % 4` 选中一个，取 `path` 的 `d`；
  - 内联脚本里匹配 `ondemand.s` 的 webpack chunk hash，拉取
    `https://abs.twimg.com/responsive-web/client-web/ondemand.s.<hash>a.js`；
  - 从 ondemand 里用 `/\(\w\[(\d{1,2})\],\s*16\)/g` 提取 rowIndex + keyByteIndices。
- animationKey：用 keyByteIndices 算 frameTime，选 SVG 的对应行，按 Chromium 的
  CubicBezier 求值，输出颜色 + 旋转矩阵的 hex。
- 生成：`time = floor((Date.now() - 1682924400e3) / 1000)`；
  对 `method + "!" + path + "!" + time + "obfiowerehiring" + animationKey` 做 SHA-256；
  随机字节 XOR 后 base64，去掉 `=`，得到 94 字符头。每次请求重新取 time/random；`path`
  必须与本次 queryId 的 `/i/api/graphql/<queryId>/CreateTweet` 一致。
- 缓存 keyBytes/animationKey；X 改版会破坏 key/indices/动画结构，生成失败时中止请求并在
  输入框显示「生成 X 写入校验头失败」；如果生成的头仍被 X 拒绝，可能收到 344（不是真实日限额）。
- 算法移植自 [Lqm1/x-client-transaction-id](https://github.com/Lqm1/x-client-transaction-id)
  （MIT），版权与许可见 `THIRD_PARTY_NOTICES.md`。

## 帖子/用户主页在新标签页打开

- 不再有菜单或存储开关；脚本安装后默认启用。
- window 捕获阶段拦截点击：
  - 先处理 X 原生资料卡 `[data-testid="HoverCard"]`（它在 tweet 外，任意路由都可用）：
    anchor pathname 匹配 `PROFILE_PATH`（含 following/followers/verified_followers/
    followers_you_follow）且不是 `RESERVED_HANDLES` 时，`openInNewTab(anchor.href)`；
    其他资料卡点击直接 return，不落到帖子逻辑。
  - 再处理 tweet 头部资料链接：anchor 位于 `[data-testid="User-Name"]` 或
    `[data-testid="Tweet-User-Avatar"]`、且不在 `[data-testid="tweetText"]` 内时，直接打开
    `anchor.href`；正文里的 @ 提及不接管。
  - 再处理主帖正文/时间戳：点击的 anchor pathname 必须与 `cellStatusLink(cell)` 相同。
  - 排除 `[role="dialog"]`、`[data-testid="reply"]`、button/role=button/input/textarea/select/
    label/contenteditable、video/audio/tweetPhoto/previewInterstitial/card.wrapper。
  - 有文本选区时不拦截。命中后用 `openInNewTab()` 的临时
    `<a target="_blank" rel="noopener noreferrer">` 打开，preventDefault +
    stopImmediatePropagation，当前标签保持 home。
- 主帖/头部资料链接覆盖 home/profile/explore/search 和通知页（通知行内头像）；原生资料卡覆盖
  所有路由。引用帖、列表、外部链接等仍可能同标签打开，继续依赖 `restoreHomeReturn` 兜底。

## 返回首页的位置恢复

X 从详情页/个人主页返回首页时会重建/重新排序虚拟列表，滚动位置会回到顶部。X 的
`loader.AbsolutePower` 会在返回过程中用 `window.scrollBy` 补偿估算高度与实测高度的差值
（实测有 +1023、+440、-440、+471、-471 等调用），这是页面自动上下滚动的主因；
`history.scrollRestoration` 已经是 `manual`，不是浏览器历史恢复。脚本在**离开 home** 时记录
`window.scrollY`、视口内第一条完整可见帖子的时间戳链接和已展开媒体的帖子（`captureHomeReturn`），
**回到 home** 时（`previousRoute !== 'home' && route === 'home'`）用 `restoreHomeReturn` 复位：

- 锚点取单元格里带 `time[datetime]` 的链接，不能取引用帖链接；只对齐一次，超过 2px 才动。
- 只等 home 专属 tab 栏（tablist 文本含「正在关注」/`following`）；个人主页、探索/搜索也有
  tablist，不能使用任意 `[role="tablist"]`，否则会先滚动错误页面。
- 找到 tab 栏后用 `compareDocumentPosition` 过滤 tab 栏之后的单元格，120ms 节流搜索锚点；
  找到就对齐一次并结束；找不到则在 tab 栏出现 800ms 后按像素位置回填一次（用当前文档高度
  钳制）；最多等 3s。不要再持续追着 X 的重排滚动。
- 已展开媒体按单元格时间戳链接记录，保留到下一次 `captureHomeReturn`；`toggleMedia` 同步更新
  集合，重建后的帖子标注时恢复为 `expanded`，避免返回后集体折叠导致页面高度突变和定位漂移。
- 用户 `wheel`/`touchmove`/`pointerdown`/`mousedown`/`PageUp`/`PageDown`/`Home`/`End`/方向键/
  空格主动滚动或点击即取消；滚动条拖动会在 `html` 上派发 `pointerdown`/`mousedown`，不能只监听
  `wheel`/`touch`。离开 home 路由时自动停止。
- X 自己的 AbsolutePower loader 仍可能调用 `scrollBy`；不要屏蔽它（虚拟列表靠它保持 cell 对齐）。
  要完全避免重建，使用新标签页打开帖子/用户主页，或使用评论弹窗。
- 只在 SPA 内导航生效；整页刷新交给浏览器自己的滚动恢复。

## 弹窗与悬浮卡

- 弹窗保持 X 原生配色，主题不往里灌墨色：
  - 内容类文字规则（`tweetText`、`User-Name`、`time`、`[role="tab"]`、`[role="group"]`、
    `card.wrapper`、文章正文等）都带 `:not([role="dialog"] *)`，不会命中弹窗内部。
  - `html[data-xmp-enabled="1"] [role="dialog"] { color: rgb(231,233,234) }` 只设弹窗容器的基础色，
    断开 `body` 墨色的继承；X 自己写了显式颜色的元素（按钮、角标、次要文字）不受影响。
  - 早期"按弹窗底色强制浅色文字"的做法会误判底色并压掉按钮原生配色，已废弃。
- Premium 订阅页和认证申请页（`/i/premium_sign_up`、`/i/verification`、`/i/flow/*`、`/premium`）
  归为 `standalone`：`setRoute()` 移除 `data-xmp-enabled`，整页不套主题（这些页面本身是深色设计，
  且带 X 自己的深色模块，全局墨色会把文字压成黑底黑字）。离开该路由时 `setRoute()` 会重新上色。
- 用户悬浮资料卡 `[data-testid="HoverCard"]` 不在弹窗内，仍按纸面浮起 + 细线渲染。
- 「你尚未通过认证」推广卡是**深绿底**（内联 `background-color: rgb(0, 67, 41)`），保留深色卡：
  卡内文字、链接和右上角关闭图标一律纯白（不能排除 `a` 后代），白底「获得认证」CTA 用内联白底
  `rgb(239,243,244)` 单独恢复深色文字。X 各版本的内联样式串空格写法不一致，两种都匹配；
  未知配色由 `markDarkSurfaces()` 兜底——同时「内联浅色→墨色」规则排除
  `[data-xmp-dark-surface]` 的祖先/后代，深色卡里的浅色文字不会再被转成黑色。
- 链接卡片里的媒体角标由 X 用内联白色文字压在 `rgba(0,0,0,.77)` 上；`card.wrapper` 的墨色规则
  只作用于 primary 内，并保留卡片内的内联白色文字。
- `markDarkSurfaces()` 扫描 primary 内带内联 `background-color` 的元素，亮度 < 90 标
  `data-xmp-dark-surface`（文字/图标转白，跳过 `a`/`button` 后代），兜底其他深色推广卡变体。
- 表面标记统一走 `safe(label, fn)`：单个标记函数抛错只记录一次 `warnOnce`，不会带走同一轮里
  后续的轨道面板、展开按钮和观察器启动。

## 降级

| 缺失 / 条件 | 行为 |
|-------------|------|
| `primaryColumn` 缺失 | 设置 `data-xmp-degraded`，只应用主题；移除媒体标注 |
| header/nav 缺失 | 同 primary 缺失，主题模式 |
| 内层 600px 时间线容器缺失 | 不降级：主列照常放宽，只是跳过内层容器的 100% 规则（`/i/connect_people` 等列表页） |
| 没有 `cellInnerDiv`（加载/空时间线） | 保留主题、版面；启动观察器等待单元格 |
| 有 `cellInnerDiv` 但找不到公共容器 | 保留主题、版面；跳过媒体按钮标注；保留观察器 |
| 媒体块 / 公共祖先找不到 | 该帖子保持原媒体可见，不插入按钮 |
| 存储不可用 | 默认启用；菜单关闭只移除当前页面样式/DOM，不重载；菜单可重新开启 |
| 路由补丁异常 | 回退到 `popstate` 和初始路径判断 |

## 2026-11-03 现场补充

真实 X 当前与设计记录的 2026-11-02 探针有结构差异：

- `main[role="main"]` 是 **column** flex，宽度 1817px；`main > div` 是宽 1050px 的 column，
  primary 的父链里有一层 row。水平居中需要 `main { align-items: center }` 加上
  `main > div > div > div { justify-content: center }`，不能只用 `justify-content`。
- primary 主内容容器的第一个子元素是 tab 栏，第三个是发帖框包装层；两者都有自己的深色背景。
  脚本用 `data-xmp-tabbar`/`data-xmp-composer` 标记并覆盖其子 div/nav 背景。tab 栏容器可能
  包含新帖提示，发帖框容器可能包含媒体；子 div 的 `background-image: none` 必须排除带内联
  `background-image` 的元素，否则提示头像和附件图片会被清空。
- 多图帖子使用 `[data-testid="ScrollSnap-List"]` 滚动轮播；轮播包含全部收集到的媒体时作为
  媒体块，否则退回公共祖先算法，避免只折叠轮播而留下其余媒体。
- 引用帖不是嵌套的 `[data-testid="tweet"]`，而是包含 `User-Name` 和 `tweetText` 的
  `div[role="link"]` 容器；媒体适配用它区分引用帖媒体：有自有媒体时优先自有，只有引用媒体
  时折叠引用媒体的图片。
- 帖子分隔线是 `[data-testid="cellInnerDiv"] > div` 的深色 `border-bottom`；主题改为
  `--xmp-rule` 浅纸色。
- 详情页线程竖线是 `cellInnerDiv` 内头像列最后一个 div（2×57px、深色背景）；主题用
  `[data-testid="Tweet-User-Avatar"] ~ div:last-child` 改为同一浅纸色。引用帖头像的最后一个
  div 兄弟可能是作者行容器（含 `User-Name`/`tweetText`），选择器必须排除这类容器，否则引用卡
  作者行会被涂成 `--xmp-rule` 色。
- 引用卡不是嵌套 `tweet`，而是 `div[role="link"]`；卡片内的 `card.wrapper` 和
  `twitter-article-title`/`twitterArticleRichTextView` 等文章预览文字在 X 深色设置下是浅色，
  主题需要改为墨色，链接使用暖橙。
- X 文章预览卡是 `div:has(> [data-testid="article-cover-image"])`：外框在该 div 的
  `border`，标题/摘要在其最后一个子 div 内。主题把外框设为透明，并把最后子 div 的文字
  改为墨色；“X 文章”角标在封面图内，不能被这条规则覆盖。
- 头像框来自头像容器内部的黑色底层和 inset 白色 `box-shadow`；主题清空所有头像后代的背景和
  阴影，包括 `header[role="banner"]` 内的轨道账号头像，避免底部账号 logo 外多出一圈边框。
- 正文列左右框线是 `primaryColumn` 的 1px `border-left/right`；版面主题将其设为 0。
- 操作栏上分割线是 `[role="group"]` 的 `border-top`；主题不再绘制。
- 新帖提示是 `[role="status"][data-keep-composer-open]` 内的按钮；按钮需要 `width: auto`、
  `display: flex`、`flex-direction: row` 和 `gap: 6px`。当前版本把文案作为按钮的直接子元素
  （与箭头/头像行并列），而按钮的 View 默认是 column；不强制 row 时文案会换到第二行。提示在
  `[data-xmp-tabbar]` 内，tab 栏规则不能把带内联 `background-image` 的头像照片层设为
  `none`，否则脸谱头像只剩轮廓。头像在 `[data-testid="userAvatars"]` 内，清空头像背景后要用
  1px 细线圆环保留轮廓；头像框清理也覆盖 `header[role="banner"]` 内的轨道账号头像，避免
  底部账号 logo 外多出一圈原生边框。
- Toast 是 `[data-testid="toast"]`；原为 X 蓝/绿色块，主题改为纸面浮起色和墨色文字。
- 左栏 nav 的标签包装层带 20px/16px 水平外边距；只隐藏文字会让图标被外边距拉向左边缘，
  收起时必须同时隐藏标签包装层。展开改由 `.xmp-nav-toggle` 点击驱动（`data-xmp-nav-expanded`）。
  账号入口在独立的 fixed 275px 侧栏层里，不在 nav 内；只改 nav 宽度会让账号入口和它的菜单
  跑到视口左侧。脚本给该固定层加 `data-xmp-rail-panel` 并收回到 88/240px，按钮 72/224px；
  收起时隐藏文案和末尾省略号，只保留居中的账号头像；展开按钮放在「更多」项下方，账号菜单
  打开时隐藏。
- 当前 X 把 logo 放在 nav 外，nav 原生从 logo 下方开始；把 nav 固定在 top:0 会让首页/详情页
  的 Home 项压在 logo 上。脚本测量 logo 底部写入 `--xmp-nav-top`，nav 用该变量设置 top 和
  height，导航项从 logo 下方开始。
- 发帖入口 `SideNav_NewTweet_Button` 位于屏幕左侧 275px 容器内，收起为 88px 轨道后会在
  轨道内露出一角；版面模式隐藏该按钮，发帖使用首页发帖框。
- 发帖编辑器的背景色会覆盖 Draft.js 的 placeholder；编辑器保持透明才能显示提示文字。
- 首页 tab 栏和发帖框仍可能由 X 的 `background-image`/`backdrop-filter` 或子容器背景控制；
  主题规则必须覆盖容器和子元素，不能只改 primary。

## 维护

1. X 改版后先在 DevTools 核对上表锚点；用 `data-testid`/ARIA，不做文本匹配。
2. 优先更新 `x-morning-paper.user.js` 的选择器，然后同步 `test/fixture.html` 和本文件。
3. 运行 `node --check`，用 fixture 验证布局、媒体、路由和降级，再在真实 X 上按
   `AGENTS.md` 的验证矩阵手动检查。
4. 选择器缺失时保持内容可见；不要用模糊文本或位置选择器兜底。
