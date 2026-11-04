# x-paper 选择器与降级参考

本文件记录 `x-morning-paper.user.js` 依赖的现场锚点、运行状态属性和降级行为，供 X 改版时
维护使用。精确选择器仍以现场 DOM 为准；脚本不依赖界面文字。

## 运行状态属性

| Attribute | 值 | 作用 |
|-----------|----|------|
| `data-xmp-enabled` | `1` | `html` 上的主题作用域；关闭脚本时移除 |
| `data-xmp-route` | `home` / `status` / `profile` / `people` / `other` | SPA 路由分类；版面 CSS 对 home/status/profile/people 生效。`profile` 是 `/<handle>` 及 `/handle/media` 等子页（`RESERVED_HANDLES` 排除 X 自己的保留一级路径）；`people` 是 `/i/connect_people`（「推荐关注」整页） |
| `data-xmp-degraded` | `1` | primary 或版面锚点缺失；只应用主题，关闭版面、噪音和媒体 CSS |
| `data-xmp-inner-timeline` | 空 | 标记 primary 内的 600px 时间线容器，供版面 CSS 放宽到 100% |
| `data-xmp-media-block` | 空 | 媒体块标记；折叠态 CSS 的隐藏目标 |
| `data-xmp-media-state` | `collapsed` / `expanded` | 顶层帖子的媒体状态 |
| `data-xmp-media-loading` | 空 | 展开后的短暂存态；媒体块移出文档流并隐藏，可见媒体图就绪后移除并一次性显示 |
| `data-xmp-tabbar` | 空 | 首页主内容容器内的 tab 栏容器；主题背景标记 |
| `data-xmp-composer` | 空 | 首页主内容容器内的发帖框包装层；主题背景标记。详情页/文章页的回复框不标这个属性，直接按 `inline_reply_offscreen` 写 CSS |
| `data-xmp-divider` | 空 | 首页发帖框后的 1–2px 分隔条；背景透明，由发帖框下边框提供线条 |
| `data-xmp-nav-expanded` | `1` | 左轨展开状态；由 `.xmp-nav-toggle` 点击切换，路由离开或宽度不足时移除 |
| `data-xmp-rail-panel` | 空 | 账号入口所在的固定侧栏层；脚本把它的 left/width 从 275px 收回到 88px（展开 240px），避免账号入口和菜单跑出视口 |
| `data-xmp-appbar` | 空 | 详情页/文章页顶部条；主题用结构选择器直接命中（节点出现即纸色），`markAppBar()` 从 `[data-testid="app-bar-back"]` 向上找带 `backdrop-filter: blur` 或非透明背景的祖先标记它，只作 X 改嵌套后的兜底 |
| `data-xmp-preview-open` | `1` | `.xmp-photo-preview` 悬浮原图预览的显示开关；移出图片/按钮、滚轮或触摸滚动、点击、按 `Esc`、切路由或关闭脚本时移除 |

`button.xmp-nav-toggle` 是脚本创建并挂到 `body` 的轨道展开按钮：≥1000px、home/status/profile 且未
降级时显示在「更多」项下方（收起 72px、展开 224px），样式与普通导航项一致，`aria-expanded`
与文案同步；账号悬浮卡或账号菜单打开时隐藏，关闭脚本或降级时移除或隐藏。悬停和
`:focus-within` 不再触发展开。两个位置由脚本写入 `html` 的 `--xmp-nav-top`（logo 下方的
导航起点）和 `--xmp-toggle-top`（「更多」下方的按钮位置）两个 CSS 变量，导航和按钮通过
它们对齐当前 X 的 logo/更多项布局。

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

## 时间格式

脚本读取 primary 内每个 `time[datetime]` 的 `datetime`，把可见文本重写为本地时间：

- 当天：`HH:mm`
- 昨天：`昨天·HH:mm`
- 更早：`M月D日·HH:mm`；跨年时为 `YYYY年M月D日·HH:mm`

`datetime` 无效时保持 X 原文本。X 重渲染后由首页扫描或路由回调重新格式化。

## 现场锚点

现场结构记录于 2026-11-02 的探针（1920×953，X 深色主题）。

| 用途 | 选择器 | 备注 |
|------|--------|------|
| 主导航容器 | `header[role="banner"]` | 原宽 595px；内部 nav 原为 `position: fixed; left: 320px; width: 275px` |
| 导航链接 | `[data-testid^="AppTabBar_"]` | 选择器健康检查的 nav 锚点 |
| 发帖 / 账号 | `SideNav_NewTweet_Button` / `SideNav_AccountSwitcher_Button` | 左轨中隐藏文字标签 |
| 正文列 / 右栏 | `[data-testid="primaryColumn"]` / `[data-testid="sidebarColumn"]` | 右栏在 home/status/profile 隐藏 |
| 内层时间线 | primary 内计算样式 `max-width: 600px` 的容器 | 加 `data-xmp-inner-timeline` 后放宽 |
| 时间线单元格 | `[data-testid="cellInnerDiv"]` | 时间线根 = 这些单元格的最近公共容器 |
| 帖子 / 正文 | `[data-testid="tweet"]` / `[data-testid="tweetText"]` | 顶层帖子没有祖先 `tweet` |
| 图片 / 视频预览 | `[data-testid="tweetPhoto"]` / `[data-testid="previewInterstitial"]` | 媒体收集目标 |
| 链接卡片 | `[data-testid="card.wrapper"]` | 卡片内媒体不折叠 |
| 推广单元格 | `[data-testid="placementTracking"]` | 首页和详情/文章页 `cellInnerDiv:has(...)` 隐藏；详情页的推广回复用同一标记 |
| 推荐关注 | `[data-testid="UserCell"]` | 首页隐藏；搜索/通知页保持可见 |
| 操作组 | `[role="group"]` | 媒体块祖先不得包含它；图标 16px、计数 13px |
| 搜索框 / 趋势 | `SearchBox_Search_Input` / `trend` | 其他页面主题表面 |
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

- 只处理 `!tweet.parentElement.closest('[data-testid="tweet"]')` 的顶层帖子。
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
  `wheel`/`touchmove` 时收起。浮层尺寸按图片数量分级（单图最多 88vh，2 张 66vh，3 张以上 30vh 并换行），
  保证整卡不超过 92vh。

## 个人主页

- 路由：`/<handle>`（含 `/<handle>/media` 等子页）归为 `profile`，与 home/status 共用宽版面：
  88px 轨道、隐藏右栏、正文列 680/720/760px 居中；横幅、头像随列宽缩放，轨道展开按钮和账号入口
  同样生效。`checkSelectorHealth` 需要的内层 600px 容器在个人主页存在，不会降级。
- 观察器在 home 和 profile 运行（格式化时间、标记表面）；媒体折叠在 home 和 profile 都生效，
  详情页（status）不折叠。
- 操作按钮：`[data-testid$="-follow"]`（关注）用暖橙实心 + 纸色文字，`:hover` 暖橙深色；
  `[data-testid$="-unfollow"]`（正在关注）用纸面浮起 + 细线 + 墨色，`:hover` 转暖红；
  `sendDMFromProfile`、`userActions`、`editProfileButton` 用纸面浮起 + 细线 + 墨色，悬停暖橙描边。
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

## 返回首页的位置恢复

X 从详情页返回首页时会重建时间线，滚动位置会回到顶部。脚本在**离开 home** 时记录
`window.scrollY` 和视口内第一条完整可见帖子的状态链接（`captureHomeReturn`），**回到 home** 时
（`previousRoute !== 'home' && route === 'home'`）用 `restoreHomeReturn` 复位：

- 帖子还在 DOM 里：把它滚回离开时的视口位置（`cell.top` 与记录值比对，差 2px 以上才动）。
- 帖子还没渲染出来：先等 2 秒，之后按像素位置回填（用当前文档高度钳制），并在 6 秒内每 250ms
  校正一次，避免 X 稍后的滚动恢复又把它拉走。
- 用户 `wheel`/`touchmove` 主动滚动即放弃；不在 home 路由时自动停止。
- 只在 SPA 内导航生效；整页刷新交给浏览器自己的滚动恢复。

## 弹窗与悬浮卡

- 弹窗按**实际底色**分深浅：`markDialogs()` 从 `[role="dialog"]` 向下最多四层找第一个非透明背景，
  亮度 < 90 标 `data-xmp-dark-dialog`，否则标 `data-xmp-light-dialog`；`MutationObserver` 观察 body，
  新弹窗出现后 120ms 内补标。深色弹窗内文字/图标恢复成 X 的浅色 `rgb(231,233,234)`，
  浅色弹窗继续用纸面墨色——只在深色弹窗上强制浅色，避免把浅色弹窗的文字和关闭按钮“抹掉”。
- 用户悬浮资料卡 `[data-testid="HoverCard"]`（X 原本是 `rgb(20,20,20)` 深色卡）换成纸面浮起 +
  细线 + 阴影；卡内文字墨色，`http(s)` 链接暖橙，关注/正在关注按钮沿用主按钮规则。
- 「你尚未通过认证」推广卡是**深绿底**（内联 `background-color: rgb(0, 67, 41)`），保留深色卡：
  卡内文字和右上角关闭图标恢复浅色（`... :is(span, div, p, svg):not(a *)`），否则标题和关闭按钮
  都会被纸面墨色吞掉；「获得认证」CTA 是白色胶囊 + 深色文字，保持原样。
- 滚动后个人主页顶栏的关注按钮由 `[data-xmp-appbar]` 标记，顶栏的文字规则已排除
  `-follow`/`-unfollow` 的后代，避免把按钮文字改回墨色。
- 关注按钮的文字曾被「非帖子单元格的 [role=button] span」暖橙规则染成与背景同色；
  该规则现在排除自身或后代带 `[data-testid$="-follow"]` / `[data-testid$="-unfollow"]` 的按钮。

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
