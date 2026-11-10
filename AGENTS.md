# AGENTS.md

面向在本仓库迭代 `x-paper` 的 agent。先读本文件，再读 `README.md` 与
`docs/selectors.md`。

## 项目事实

- 插件名是 `x-paper`（userscript 头部的 `@name` / `@namespace`、控制台前缀）。文件名保留
  历史命名 `x-morning-paper.user.js`。
- 作者 `venom`，MIT 许可（`LICENSE`）；userscript 头部保留 `@author` / `@license`。
- 入口：`x-morning-paper.user.js`。文档：`README.md`、`docs/selectors.md`。测试：
  `test/fixture.html`。截图：`screenshots/`。
- 只使用 `GM_addStyle`，不保存任何开关或设置；脚本安装即启用。网络请求只有：
  评论弹窗的 `TweetDetail` 读取，用户主动点击评论弹窗「喜欢」时的 `FavoriteTweet` /
  `UnfavoriteTweet`，用户主动提交回复时的 `CreateTweet`，以及首次回复时读取 X 的公开
  `/i/jf/` app shell 和 `abs.twimg.com` 上的 `ondemand.s`（生成 `x-client-transaction-id`；
  `/i/jf/` 使用 `credentials: omit`）。CreateTweet 使用当前浏览器会话（`ct0` cookie）和
  X Web 的公开 bearer；不发布其他内容，不关注、不私信、不修改其他账号状态。
- 注入的界面文案（轨道按钮、媒体按钮、原图预览、评论弹窗、资料卡、错误提示）和时间/计数格式
  跟随 X 的界面语言（`html[lang]`，回退 `navigator.language`）：`zh*` 用 `TEXT.zh`，其余用
  `TEXT.en`。X 自身的界面仍由 X 本地化；脚本不保存语言设置。新增可见文案必须同时补两个语言
  对象，不要在调用点硬编码中文。
- 当前行为以代码、README 和 `docs/selectors.md` 为准。不要按已删除的旧设计记录回退
  当前行为。
- 已经落地的、与初版设计不同的行为：无日期刊头、无操作栏上分割线、无正文列左右框线、
  无头像框线、引用帖媒体折叠、帖子时间显示具体时刻、通知/Toast 纸面化、左轨点击展开、
  图片悬浮原图预览、详情页/文章页表面纸面化、探索/搜索共用宽版面（右栏隐藏、左轨发帖入口
  收成 FAB）、通知页共用宽版面（右栏隐藏、FAB、缩略图折叠为「🖼️ 图片」）、评论按钮打开
  页面内纸面弹窗、Grok 抽屉与帖子 Grok 总结面板纸面化。不要按旧设计回退（尤其不要把左轨改回 hover/focus-within
  自动展开）。

## 工作方式

- 每轮只做一个主题，先确认目标和边界再动代码。不要把布局、媒体、主题和文案混在一个
  无法审阅的 commit 里。
- 修改前必须读取当前代码和**真实 DOM**。截图只用于发现现象，不能用于推断结构、颜色或
  失败原因。
- 在现有纸面主题上做局部修正，不要重写视觉世界，除非用户明确要求 redesign。
- CSS 优先使用稳定的 `data-testid`、`role`、ARIA 和结构选择器；禁止依赖生成的
  `r-*` class 或界面文字做匹配。确实无法选择时，用运行时标记（见“已踩过的坑”）。
- 适配器必须幂等、可重复执行、捕获异常；异常不能冒泡到 X。
- 行为变化同步更新 README / `docs/selectors.md` / 截图。不要重新引入旧插件名。
- 提交前 review diff；不要提交临时脚本、Playwright 产物、cookie/会话文件或调试截图。

## 验证循环

1. **真实 X 取证**：在已登录的 Chrome 打开 `x.com/home`，用 DevTools 检查
   `html[data-xmp-enabled]`、`data-xmp-route`、`data-xmp-degraded`、`#xmp-theme`、
   `#xmp-layout`。确认已安装的是当前脚本；Tampermonkey 常缓存旧版，必要时重新粘贴。
2. **读 DOM 而非猜**：记录目标元素的计算样式、`getBoundingClientRect()`、祖先链、
   `data-testid` 和可访问名称。先解释现象，再改 CSS/JS。
3. **小步修改**：每改一个主题，先在同一真实页面验证，再扩展。需要隔离时，用独立的浏览器
   上下文注入仓库脚本，关闭后销毁上下文并删除 cookie 副本；不要动用户已安装的 TM 脚本。
4. **等待异步**：X 是流式渲染；媒体扫描 150ms 防抖，探索/搜索表面扫描 200ms 防抖 + 1.2s 强制
   重扫，标签页不可见时浏览器会节流定时器。截图/检查前等待 3–5s，确认扫描完成，必要时再查询
   一次 DOM。SPA 进入探索/搜索后至少等 1.5s 再判定模块是否已换纸面。
5. **状态矩阵**：真实 X 的 1920×953、1440×900；X 深色/浅色设置；中文/英文界面；首页、详情、
   探索/搜索（宽版面）、通知（宽版面、缩略图折叠、SPA 进入与返回首页）；单图、网格、轮播、视频、
   引用帖、引用卡片、混合媒体；hover、focus、
   媒体折叠/展开；
   Grok 抽屉打开/关闭/输入卡、帖子 Grok 总结入口（头部无 testid 按钮）与收起重开；评论弹窗打开/关闭、首页滚动位置、正文跳转仍进入状态页；
   评论点赞/取消（空心→暖橙实心）、资料卡、弹窗内回复输入框、嵌套楼层连接线/圆角终点、
   非评论内容过滤。
6. **边界**：999/1000px 是版面分界；1000px 应用轨道/680 列/媒体按钮，999px 只应用主题。
7. **fixture**：`node --check x-morning-paper.user.js`；`python -m http.server 8765` 后打开
   `http://127.0.0.1:8765/test/fixture.html`，检查媒体、路由、降级、存储回退和 1920/1000/999。
   `?route=notifications` 切到通知页 mock（通知行缩略图折叠、推广隐藏、UserCell 保留），
   `?lang=en` 覆盖 fixture 的 `html[lang]`，用于验证英文界面；`?theme=light` 验证浅色。
   fixture 是 mock，不能替代真实 X。
8. **机械检查**：`impeccable detect --json x-morning-paper.user.js`；修复后再提交。
9. **截图与文档**：更新 `screenshots/` 的最终图、README 行为说明和 `docs/selectors.md`；
   截图必须来自当前脚本，不能复用旧版本。

## 已踩过的坑

### 选择器与结构

- X 的生成 class 和 `data-testid` 会变化。找不到稳定属性时，用**运行时标记**（按尺寸、
  背景色或相对位置定位一次，加 `data-xmp-*`，再用 CSS），不要写进生成的 class 名。
- 引用帖不是嵌套的 `[data-testid="tweet"]`，而是包含 `User-Name` 和 `tweetText` 的
  `div[role="link"]`。媒体收集要覆盖引用帖；有自有媒体时优先折叠自有媒体，只有引用媒体时
  才折叠引用媒体。引用帖内的卡片媒体包含；帖子外层的链接卡片媒体保持原生。
- 视频的海报层也是 `tweetPhoto`，并且**包住** `previewInterstitial`（interstitial 深度 16、
  tweetPhoto 深度 12）。只排除「在 interstitial 内部」的 tweetPhoto 会把一个视频算成
  「图片 1 + 视频 1 = 2 项」，收集时两种包含关系都要排除。排除后媒体块仍提升到同一个定高外壳，
  因为提升算法是从媒体元素向上找只含媒体的祖先。
- 媒体块要提升到“仍只包含媒体的最高祖先”再隐藏；只隐藏图片内层会留下定高外壳。提升在
  遇到 `tweetText`、`User-Name`、链接卡片、嵌套帖或操作组时停止。
- 轮播必须包含本次选择的**全部**媒体才能作为媒体块；只含部分时退回公共祖先算法。
- 媒体按钮用 `align-self: flex-start`，否则会被 flex 父级拉成整列宽。
- React 会替换已标注的按钮/媒体块；每次扫描要校验按钮与块的配对，失配就清理重标注。
  时间线和单元格是虚拟化的，单元格可能暂时为空或 0 尺寸；不要据此判定选择器失效。
- 详情页在缺少 600px 内层时间线锚点时可能进入 degraded（只应用主题）；不要假设详情页
  一定有轨道/宽列。改动详情排版前先看 `data-xmp-degraded`。
- 个人主页操作行用 `div:has(> div > button[data-testid="userActions"])` 做通用锚点，行内除
  `-follow`/`-unfollow` 外的按钮统一纸面样式；已关注用户的「接收通知」铃铛没有 testid 且图标带
  X 内联浅色，必须用行级规则 + `svg` 图标色覆盖，不要按 testid 逐个补。
- 个人主页（`/<handle>`，含 `/handle/media` 等子页）归为 `profile` 路由，和 home/status 共用宽版面；
  `RESERVED_HANDLES` 必须覆盖 X 自己的保留一级路径（home/explore/notifications/i/...），否则
  `/explore` 之类会被误判成个人主页。观察器只在 home/profile/notifications 运行；媒体折叠在
  首页、个人主页和通知页都生效（详情页不折叠）。关注/正在关注/私信/更多按 testid 后缀主题化，
  关注用暖橙实心；注意「非帖子单元格的 [role=button] span」暖橙规则会把关注按钮文字染成与
  背景同色，必须同时排除自身/后代带 `-follow`、`-unfollow` testid 的按钮。
- `/i/connect_people`（推荐关注整页）归为 `people` 路由，共用宽版面；该页没有内层 600px
  容器，健康检查把内层锚点视为可选（只要求 header/nav/primaryColumn），否则会误降级。
- home 的 tab 栏和发帖框在 JS 标记前就按 X 深色绘制，首帧会闪黑；必须用结构选择器提前上纸色：
  tab 栏 `div:has(nav[role="navigation"]):not(:has([data-testid="tweet"]))`，发帖框
  `div:has([data-testid="tweetTextarea_0"], [data-testid="toolBar"]):not(:has([data-testid="tweet"]))`。
  只靠 `markTabbar`/`markComposer` 的 JS 标记会晚一帧到数百毫秒。
- `markTabbar()` 在个人主页会把整列内容（含作者信息、帖子、推广卡）标成 `data-xmp-tabbar`，
  随后 `[data-xmp-tabbar] div { background-color: transparent }` 会清掉认证卡的深绿背景。标记前必须
  校验：高度 ≤120px、不含 `tweet`/`User-Name`；个人主页/推荐关注页不标记，改用结构规则给容器纸色
  并把内层 `nav[role="navigation"]` 的底边改成细线（避免 X 的深色 1px 分割线）。
- 顶栏文字规则必须排除 `[data-testid="icon-verified"]` 和 `-follow`/`-unfollow` 后代：
  否则滚动后个人主页顶栏的认证徽章会被涂成墨色、关注按钮文字被改回墨色。
- 推广卡（如「你尚未通过认证」）在纸面主题下保留自己的深色底：已知深绿变体用内联
  `background-color: rgb(0, 67, 41)` 直接命中（空格两种写法都要匹配）；其他变体由
  `markDarkSurfaces()` 按内联底色亮度标 `data-xmp-dark-surface` 兜底，卡内文字和关闭图标恢复纯白。
  深绿卡内的文字/链接一律纯白（不能排除 `a` 后代），白底 CTA 再单独恢复深色文字。
  “内联浅色→墨色”的规则必须排除 `[data-xmp-dark-surface]` 祖先/后代，否则深色卡里带内联浅色的
  标题会被优先级更高的墨色规则压成黑色（用户侧不同账号的卡片配色可能不同，只靠固定颜色匹配会漏）。
- 链接卡片内的内联白色文字（媒体角标）要保留白色，否则会被 `card.wrapper` 的墨色规则盖成
  黑底黑字。
- 弹窗一律**不接管配色**：内容类文字规则都加 `:not([role="dialog"] *)`，弹窗容器单独设 X 的浅色
  基础色以断开 body 墨色继承。按底色强制浅色的做法会误判（深色弹窗里的白色卡片会让整个弹窗被认成
  浅色）并压掉按钮原生配色，已废弃。
- Premium/认证营销页（`/i/premium_sign_up`、`/i/verification`、`/i/flow/*`、`/premium`）归为
  `standalone`，`setRoute()` 移除 `data-xmp-enabled` 让整页不套主题：这些页面自带深色模块
  （`data-testid="trend"` 等），全局墨色会把它们压成黑底黑字。
- 表面标记必须包在 `safe(label, fn)` 里：boot/扫描里一个标记函数抛错会静默带走后面的轨道面板标记、
  展开按钮和观察器启动（曾因为 `markDarkSurfaces` 里一个未定义变量让个人主页整个失去左轨）。
- 「你尚未通过认证」推广卡是深绿底（内联 `rgb(0, 67, 41)`），卡内文字和右上角关闭图标必须恢复浅色，
  否则关闭按钮在深绿底上不可见；「获得认证」CTA 保持白色胶囊 + 深色文字。
- 用户悬浮资料卡 `[data-testid="HoverCard"]` 在主题里换成纸面浮起 + 细线；卡内链接用
  `--xmp-accent`，关注/正在关注沿用主按钮规则。
- 个人主页滚动后顶栏的关注按钮落在 `[data-xmp-appbar]` 里，顶栏的文字规则必须排除
  `-follow`/`-unfollow` 后代，否则按钮文字会被改回墨色。
- 已认证徽章 `[data-testid="icon-verified"]` 保持 X 原本的蓝色，不要随强调色染色。
- 强调色 token 从 `--xmp-pine*` 更名为 `--xmp-accent*`（暖橙 `#B4531F`），改名后所有引用与文档同步。
- 详情页/文章页的推广回复和首页推广帖的外壳在 `cellInnerDiv` 内、帖子之外（`placementTracking`
  包住 `[data-testid="tweet"]`），`NOISE_CSS` 的推广规则要覆盖 home 和 status 两个路由。
  `placementTracking` 同时是视频播放器的通用可见性容器：播放开始后出现在 `tweetPhoto` 内并
  包住 `videoPlayer`，必须排除 `[data-testid="tweet"]` 内的实例，否则播放视频会让整条帖子消失。
  推荐关注（`UserCell`）只在首页隐藏，搜索/通知页的用户列表保持可见。

### 主题与排版

- X 深色主题大量使用内联颜色；逐表面覆盖，不要只改 body/primary。
- 正文列左右框线在 `primaryColumn` 的 `border-left/right`；头像框线来自头像内部黑色底层和
  inset 白色 `box-shadow`，不是 `border`。
- 帖子分隔线在 `[data-testid="cellInnerDiv"] > div` 的 `border-bottom`；线程竖线有**两段**：
  头像列最后一个 div（2×N，`Tweet-User-Avatar ~ div:last-child`）是头像下方的长线；回复头像
  **上方**还有一段 2×8 的短尾，它在头像行的上一行里（`div:has(+ div > div > Tweet-User-Avatar)
  > * > * > div:only-child`），不是头像的兄弟，漏掉它就会在回复头像旁留一段 `rgb(51,54,57)` 深色。
  两段都换成 `--xmp-rule`。引用帖头像的最后一个 div 兄弟可能是作者行容器（含 `User-Name`/
  `tweetText`），选择器必须排除，否则引用卡作者行会被涂成一条 `--xmp-rule` 背景带。
  不要用“所有 div 都改 border-color”这种规则，透明边框会显形。
- 详情页/文章页的顶部条（`帖子`/`文章`）是 `rgba(0,0,0,0.65)` + `backdrop-filter: blur(12px)`，
  条本身没有 testid。**首帧闪黑只能靠 CSS 解决**：用结构选择器
  `div:has(> div > div > [data-testid="app-bar-back"])` 直接命中，节点渲染出来就是纸色；
  `markAppBar()`（从返回按钮向上找 blur/非透明祖先标 `data-xmp-appbar`）只作为 X 改嵌套后的兜底，
  单纯靠 JS 标记会晚 1 秒以上，用户能看到一帧黑色。回复框同理：按
  `[data-testid="inline_reply_offscreen"]` 直接写 CSS（纸色 / 内部 div 透明 / 按钮暖橙 / 禁用态纸面浮起），
  不要依赖 `markComposer()` 的 JS 标记。X 还把标题和查看数写成内联 `color: rgb(231, 233, 234)`，
  需要 primary 范围内的内联浅色文字规则改回墨色。文章页还有几个深色表面：`simpleTweet` 内嵌引用帖
  （纯黑）、`markdown-code-block`（`pre` 深底 + 28px 头部条，`code` 带内联浅色，换纸面时必须同时
  强制文字色）、文末 `[role="status"]` 升级横幅（深蓝）、`progressBar-bar`（X 蓝）。
- X 从详情页/个人主页返回首页（app-bar 的 `←` 触发 `popstate`）时会重建/重新排序虚拟列表。
  X 的 `loader.AbsolutePower` 会用估算高度重新挂载，然后不断测量 cell 并调用
  `window.scrollBy` 补偿高度差（实测返回过程中有 +1023、+440、-440、+471、-471 等调用），
  这是页面自动上下滚动的主因；`history.scrollRestoration` 已是 `manual`，不是浏览器历史恢复。
  脚本在离开 home 时记录滚动量、第一条可见帖子（取带 `time` 的时间戳链接，不能用引用帖链接）
  和已展开媒体的帖子；返回后只做一次性对齐，并恢复媒体展开态。
  `restoreHomeReturn` 等 home 专属 tab 栏出现（tablist 文本含「正在关注」或 `following`）后，
  以 120ms 节流搜索锚点；找到就对齐一次并结束，找不到则在 tab 栏出现 800ms 后按 `state.y`
  回填一次，最多等 3s。不要用任意 `[role="tablist"]`：个人主页、探索/搜索也有 tablist，
  而且个人主页时间线可能包含同一条锚点帖子；旧逻辑会先在错误页面滚动再切回 home。
  滚动条拖动会在 `html` 上派发 `pointerdown`/`mousedown`，所以除 wheel/touchmove/滚动键外
  还必须监听这两个事件；用户一旦操作立即取消。已展开媒体集合保留到下一次 capture，
  `toggleMedia` 同步更新。脚本无法在不破坏 AbsolutePower 虚拟列表的前提下抑制 X 自己的
  `scrollBy`；要完全避免重建，使用新标签页打开帖子/用户主页，或使用评论弹窗。
- 引用帖媒体块在卡片内是整卡宽，展开后会压住引用卡左右和底部边框；给引用帖内的媒体块和
  按钮左右各 12px 内缩，媒体块底部再留 12px，并对媒体元素设 12px 圆角。引用卡作者行保持透明。
- X 文章预览卡是 `div:has(> [data-testid="article-cover-image"])`：外框在它的 border，标题/
  摘要在最后一个子 div。去掉外框并只给最后子 div 设墨色；“X 文章”角标在封面图内，保持原样。
- 折叠媒体用 `display:none` 时，X 会延后加载展开后的大图/网格节点；只预热折叠 DOM 的旧 URL
  不够，展开会先闪空。展开时给块加 `data-xmp-media-loading`：块 absolute + visibility hidden
  移出文档流，页面高度不变，让 X 渲染真实媒体；轮询块内可见的 inline `background-image`
  URL（实际绘制层，`<img>` 常是 opacity 0 的命中层），全部就绪后恢复文档流并一次性显示。
  网格等全部可见单元，轮播只等当前 slide；不要用纸面占位/隐藏子元素那套，会看起来像加载
  帖子并带出滚动条。按钮 hover/focus 时先预热 URL 缩短等待。
- 图片悬浮预览取的是**绘制层** URL（内联 `background-image`，退回 `img.currentSrc`），
  原图靠 `pbs.twimg.com` 的 `name=orig` 变体。浮层挂在 `body` 上、`pointer-events: none`，
  所以点击仍然命中底下的图片、由 X 打开自己的大图。预览有两个入口：折叠的 `.xmp-media-toggle`
  （悬停即预览整块静帧：图片 + 视频海报，多张并排，标题按内容为 `N 张 · 原图`、`视频封面`
  或 `N 项 · 原图/封面`）和已展开的图片（只预览悬停那张）。视频海报 = 包住/位于
  `previewInterstitial` 的 `tweetPhoto`，`amplify_video_thumb` 的 `name=orig` 同样可用；预览只渲染
  `<img>` 静帧，不创建 `<video>`、不播放；已展开的视频本身在播放，不弹封面预览。
  折叠块里只有 `name=120x120` 缩略图，放大后一片模糊，必须先等 orig 解码（或 800ms 超时）再弹出；
  展开后的图片可以先用已下载尺寸立即显示、原图解码完再替换（同一张图比例一致，不会跳动）。
  浮层是 `position: fixed; left: 50%`，宽度 auto 时 shrink-to-fit 只按右半视口计算；必须设
  `width: max-content`（再用 `max-width: min(1600px, 92vw)` 收口），否则两张竖图并排会被判定
  放不下而换行，卡片高度超出 92vh、图片溢出纸框。3/4 张和 `many` 走 `flex-wrap`，由 `max-width`
  决定每行数量，不再受半视口限制。
  链接卡片、仍在 `data-xmp-media-loading` 存态的块不预览；视频只在折叠按钮上预览封面。
  **不要用 `scroll` 事件收起预览**：X 加载图片时的滚动锚定会触发 scroll，把刚弹出的预览误关；
  用 `wheel`/`touchmove` 判定用户主动滚动。点击、`Esc`、切路由、宽度跌破 1000px 和关闭脚本也要收起。
- 操作栏的上分割线在 `[role="group"]` 的 `border-top`；移除时不要误删媒体/正文的边框。
- 发帖编辑器的背景会盖住 Draft.js placeholder；编辑器必须保持透明。
- 左轨图标左偏是 nav 标签包装层的 20px/16px 外边距造成的；收起时同时隐藏包装层，并用
  `align-items: center` 居中，而不是只改 `justify-content`。X 的 `SideNav_NewTweet_Button`
  偏在屏幕左侧，收起为 88px 后会在轨道里露出一角，版面模式需要隐藏。账号入口在独立的
  fixed 275px 侧栏层，不在 nav 里；只收窄 nav 会让账号入口和菜单跑到视口左侧。用
  `data-xmp-rail-panel` 标记那个固定层并设 88/240px，账号按钮设 72/224px，菜单才能完整弹出。
  收起时账号按钮只保留第一个子元素（头像）并居中，隐藏文案和末尾省略号，否则头像与 `···`
  会挤在一起。展开只由 `.xmp-nav-toggle` 的点击切换 `html[data-xmp-nav-expanded]`，不要恢复
  hover/focus-within；按钮放在「更多」项下方，账号悬浮卡打开时隐藏。当前 X 的 logo 在 nav
  外，nav 固定在 top:0 会压住 Home；测量 logo 底部写入 `--xmp-nav-top`，nav 用该变量设置
  top/height。
- 新帖提示是 `[role="status"][data-keep-composer-open]` 内的按钮；必须 `display: flex` +
  `flex-direction: row` + `width: auto` + `gap`，否则当前把文案放在按钮直接子级的版本会按
  View 的 column 排成两行。提示在 `[data-xmp-tabbar]` 内；tab 栏/发帖框的
  `background-image: none` 必须排除带内联 `background-image` 的元素，否则脸谱头像的照片层
  被清空，只剩轮廓。头像在 `[data-testid="userAvatars"]` 里，清空背景后要用 1px 细线圆环
  保留轮廓；头像清理同时覆盖 `header[role="banner"]` 里的账号头像，否则底部账号 logo 外
  会多出一圈原生边框。Toast 是 `[data-testid="toast"]`；两者都使用纸面浮起色，不要沿用
  X 的蓝/绿大色块。
- tab 栏和发帖工具栏的滚动箭头是深色圆形按钮；在纸面主题中要改成 paper-raised + 细线。
- 推文里的「显示更多」可能是内联 X 蓝色，不是 `<a>`；用推文范围内的内联颜色选择器改为暖橙。
- 不要做宽泛的 `!important` 覆盖；先看元素是否被按钮/链接/媒体共享。必要时用 `:has()` 精确
  限定范围。

### 探索与搜索

- `/explore`（含子路径）和 `/search` 归为 `explore` / `search`，并加入 `isWideRoute`：≥1000px 时
  与首页共用 88px 轨道、680/720/760px 居中正文列和隐藏右栏；<1000px 回到 X 原生布局。
  `isSurfaceRoute()` 只用于主题表面的运行时标记，媒体折叠只在 home/profile/notifications 运行。
- 探索/搜索没有首页发帖框：`SideNav_NewTweet_Button` 在这两页保留，CSS 收成 52px 圆形 FAB
  （left 18、bottom 96、暖橙底、纸色笔形 mask），隐藏文本子 div，原生 `href` 不变；首页/详情/
  个人主页/推荐关注页继续隐藏。只改样式，不要重新创建按钮。
- 搜索页右栏是「搜索过滤」；宽版面隐藏右栏后过滤控件不可见（与首页结构一致），这是有意的取舍。
  <1000px 时右栏恢复，侧栏卡按下面的规则换肤。
- 深色表面没有稳定 testid：搜索框胶囊、选举/体育聚合卡（`[class*="jf-element"]`）、侧栏卡和
  底部「显示更多」条都是类名/内联样式驱动的深色底。按计算样式（背景亮度、边框、圆角、尺寸）
  打 `data-xmp-paper-surface` / `data-xmp-paper-chip`，不要写生成的 `r-*` class。
  模块白字的可靠信号是内联 `text-shadow: rgb(255, 255, 255)`；翻色时只处理浅色和 X 蓝，
  党派色、比分绿勾等品牌色保持原样。
- 表面观察器必须观察 `main[role="main"]` 而不是 `primaryColumn`：SPA 切路由时 primary 会整块
  替换，只观察 primary 会漏掉探索页的新内容；侧栏也在 `main` 内。200ms 防抖，用
  `data-xmp-surface-scan` 记录已扫描的单元格/侧栏；React 替换内容时按变更记录撤掉后重扫。
  路由切换和 1.2s 延迟刷新要 `clearSurfaceScanFlags()` 强制重扫：模块内容可能在观察器挂到新
  `main` 之前就已渲染，只靠变更记录会漏标（表现为 SPA 进入探索后模块卡仍是深色）。
- 搜索框的可见胶囊是 `form[role="search"] > div > div`（输入框上两级）；探索页是纯黑底，
  搜索页是深色描边 + 透明底。首帧用这条结构选择器直接上纸面浮起 + 细线，`markSearchChrome()`
  再兜底容器和祖先的深色；只给祖先设纸色会把整个顶栏染成浮起色或无圆角块。
- 探索页模块卡的选中态按钮是白底（不是深色）；深色按钮标 `paper-chip` 后用 inset 细线补边，
  模块卡内按钮统一细线描边、图标改墨色，避免白字/白图标留在纸上不可见。
- 侧栏卡宽 ≥200、高 ≥20 才按卡片处理；头像的黑色底层、单选按钮等小元素保持原样。
  搜索过滤 radio 用 `input:checked` + 纸面细线重绘，选中态暖橙实心 + 纸色勾。
- 探索/搜索的帖子媒体保持 X 原生展开，不注入媒体按钮；媒体折叠在首页、个人主页和通知页生效。

### 通知页

- 通知行是 `article[data-testid="notification"]`，**不是** `[data-testid="tweet"]`。行内没有
  `User-Name`、操作栏、`[data-testid="reply"]` 或 `/status/` 链接，只有通知图标、头像链接
  （`UserAvatar-Container-<handle>` → `/<handle>`）、标题行 + `time[datetime]`、`tweetText`
  预览、`caret`（更多）和 64px 缩略图。媒体作用域、媒体按钮和新标签页判断都要按这个结构写，
  不要假设通知行能复用 tweet 选择器。
- 缩略图是内联 `background-image`（`pbs.twimg.com`，`name=120x120`）+ 同名 `<img>`，**没有**
  `tweetPhoto`。`markNotificationThumbs()` 把 `data-xmp-notification-thumb` 打在**包住绘制层和
  命中层 `<img>` 的容器**上（≥40px，背景图必须是 `url(...)`）：标记落在媒体自身上，`findMediaBlock()`
  必须从该元素开始而不是父级，否则会把 76px 缩略图列（含「更多」）当成媒体块；`MEDIA_BLOCK_STOP`
  包含 `[data-testid="caret"]`，提升也会停在缩略图外壳。
- 预览：`PHOTO_SELECTOR` 同时匹配 `tweetPhoto` 和 `data-xmp-notification-thumb`，
  `mediaStills()`/`mediaPhotos()` 在作用域自身命中时把它计入，折叠按钮和展开后的缩略图都能悬停
  预览原图（`name=orig`）。改这两个函数时不要只查后代节点。
- 通知行没有 status 链接：评论弹窗和「正文/时间戳新标签页」在这些行上没有锚点可用，只有
  头像链接走 `isProfileHref` 新标签页；整行点击交给 X 当前标签打开。含内嵌 tweet 的通知
  类型仍由 tweet 分支处理。
- SPA 切路由后 X 会整块替换 `primaryColumn`：路由回调里的 `checkSelectorHealth()` 和
  `startObserver()` 指向旧节点，内层 600px 容器标记丢失（通知页/首页正文停在 600px）、
  观察器不再触发。`syncTimelineRoute()` 在 1.2s 刷新时按当前 primary 重新体检、重挂观察器并
  扫描；新增宽版面路由时务必确认这条路径。用注入了脚本的标签页验证 SPA 往返，不要只测刷新。
- 后台标签页里通知缩略图不会加载（媒体外壳为空），探针前先 `Page.bringToFront`；否则会把
  「缩略图没有 testid」误判成「没有缩略图」。

### Grok 抽屉

- Grok 抽屉在 `body` 末尾、`primaryColumn` 外；根节点是 `[data-testid="GrokDrawer"]`，
  打开/关闭时会**替换根节点和它上面两层包装**，挂在旧根上的 MutationObserver 会失效。但
  `#layers` 的直接子层（`drawer.closest('#layers > div')`，含 Grok/聊天/BottomBar 三个抽屉层）
  保持不变，`ensureGrokObserver()` 观察这一层接住替换和流式内容。不要在 `body` 上挂全量观察器。
- 帖子头部的 Grok 总结入口**没有 testid**、`aria-label` 随界面语言变化（中文「Grok 操作」），
  不能靠点击入口的 `aria-label` 重挂观察器（旧 `watchGrokDrawer` 只认 `[aria-label="Grok"]`，
  从帖子打开时漏挂，面板停在深色）。
- 开合瞬间 `GrokDrawer` 会**短暂缺席**：移除变更触发的扫描若发现抽屉不在就断开观察器，抽屉回来
  后没人重挂。`grokLayer()` 在抽屉缺席时沿用仍 `isConnected` 的旧层，避免观察器被自己的扫描断掉。
- 抽屉的深色面板和输入卡按计算样式标记（复用 `scanPaperSurfaces`）；文字/图标只翻**最近底色**
  是纸面或深底的，用户消息的彩色气泡里的白字/白图标保持原样（`nearestPaperBackground`）。
  标记属性是 `data-xmp-paper-surface/chip/text/icon`，图标属性新增 `data-xmp-paper-icon`。
- 引用帖卡片的作者名是**不带 `dir` 的纯 `div`**，默认 `SURFACE_TEXT_SELECTOR` 的 `div[dir]`
  漏标会在纸面上留下白字；`markGrokSurfaces()` 传入了包含裸 `div` 的选择器。改 `markPaperText`
  时保持默认选择器不变，避免影响探索/搜索的无 boundary 调用。

### 评论弹窗

- 只拦截 `[data-testid="reply"]`（评论按钮）的点击；在 **window 捕获阶段**（不是 document，
  确保先于 X 和可能仍在运行的旧版脚本）`preventDefault + stopPropagation +
  stopImmediatePropagation`，阻止 X 跳到 `/compose/post`。帖子正文/时间链接不拦截，仍然进入
  状态页。只对 home/profile/explore/search/notifications 生效；弹窗内和 `[role="dialog"]`
  内不拦截。通知行需要内嵌带操作栏的 tweet 才有评论按钮。
- 节点定位：`reply.closest('[data-testid="tweet"]')` 取顶层帖子，再用 `cellStatusLink(cell)`
  找带 `time[datetime]` 的 `/handle/status/id` 链接；不要取引用帖链接。
- 数据：`/i/api/graphql/<queryId>/TweetDetail`。当前 queryId 为
  `qpemjmVMoTWDvcRT43JIVQ`；请求头用公开 bearer + `ct0` cookie（`x-csrf-token`）、
  `x-twitter-auth-type: OAuth2Session`、`x-twitter-active-user: yes`、`content-type: application/json`；
  实测不需要 `x-client-transaction-id`。`features`/`fieldToggles` 对象在脚本顶部；X 改版后
  需要从真实请求或 `main.*.js` 更新。HTTP 400/404 时从 `main.*.js` 正则
  `queryId:"...",operationName:"TweetDetail"` 重新发现 queryId 并重试一次。
- 响应解析：`data.threaded_conversation_with_injections_v2.instructions[].entries[]`；
  `TimelineTimelineItem` 和 `TimelineTimelineModule` 都可能含推文；`TweetWithVisibilityResults`
  用 `.tweet` 解包；按 `rest_id` 去重。用户字段在 `core.user_results.result.core/avatar`，
  长文在 `note_tweet.note_tweet_results.result.text`，媒体在
  `legacy.extended_entities.media`，查看数在 `views.count`。
- **过滤非评论内容**：只保留 focal 之后、`legacy.conversation_id_str === focal` 的推文，
  并跳过 `promotedMetadata`/`legacy.promoted`。X 会在对话模块里混入其他帖子（推荐、广告、
  不相关的主页帖），不能把所有 entry 都当评论；实测同一响应 42 条里只有 36 条属于对话。
- **层级**：用 `legacy.in_reply_to_status_id_str` 建树；只保留能连到 focal 的回复。
  `renderReplyGroup` 为每个顶层回复创建 `.xmp-comments-thread`，只给
  `.xmp-comments-replies > .xmp-comments-thread` 加底部分割线（最后一个除外），父子回复之间
  不能有分割线；嵌套 `.xmp-comments-children` 左缩进 20px + 16px padding，不再用整组
  `border-left`。每个子 `.xmp-comments-thread::before` 沿父头像中心画竖线、`::after` 画 14px
  短横线接到子头像（`|_`）；有子回复的行加 `.has-children`，`::after` 从头像下方画竖线接上
  子树。最后一个子线程用 `:last-child::before` 的 16×35 border-left + border-bottom +
  `border-bottom-left-radius: 8px` 在头像中心圆角转弯并停止，不能延伸到最后一个头像下方；
  每条非原帖评论显示回复对象（中文「回复 @parentHandle」，英文「Reply to @parentHandle」）。
  不要退回扁平列表。
- 互动：
  - 点赞/取消点赞：`FavoriteTweet`（`lI07N6Otwv1PhnEgXILM7A`）/
    `UnfavoriteTweet`（`ZYKSe-w7KEslx3JhSIk5LA`），POST body
    `{variables:{tweet_id},queryId}`，头部与 TweetDetail 相同；实测不需要
    `x-client-transaction-id`。乐观更新计数/`aria-pressed`，失败回滚并用 `warnOnce` 记录。
  - 回复：弹窗内嵌纸面输入框（`.xmp-comments-composer`），提交时 POST
    `/i/api/graphql/<queryId>/CreateTweet`，当前 queryId 为 `l4hk8uVGvR-a8kzQ4nOhPA`。
    body 为 `{variables:{tweet_text, reply:{in_reply_to_tweet_id,exclude_reply_user_ids:[]},
    media:{media_entities:[],possibly_sensitive:false},semantic_annotation_ids:[],
    disallowed_reply_options:null}, features, fieldToggles, queryId}`；`batch_compose` 不能传
    `'off'`（GraphQL 校验失败），省略即可。HTTP 400/404 时从 `main.*.js` 正则
    `queryId:"...",operationName:"CreateTweet"` 重新发现 queryId。
    每次 POST 前生成 `x-client-transaction-id`：读取 `/i/jf/` app shell（`credentials: omit`），
    从 `twitter-site-verification` 取 key、从 `loading-x-anim` 取动画帧、从 `ondemand.s` 取
    key byte indices，缓存 keyBytes/animationKey；按 `method!path!time + obfiowerehiring +
    animationKey` 计算 94 字符头，header 与本次 queryId 的 path 绑定。缺少这个头时 X 会返回
    误导性的 344（不是真实日限额）。算法移植自 `Lqm1/x-client-transaction-id`（MIT，见
    `THIRD_PARTY_NOTICES.md`），X 改版后可能失效；生成失败时中止请求并在输入框显示
    「生成 X 写入校验头失败」，不发送无头请求。
    提交成功后关闭输入框、重新请求 TweetDetail 刷新首屏评论并保留弹窗滚动位置；失败时把接口
    错误显示在输入框下方。只支持纯文字、280 字；不要打开 X 原生 composer 的独立窗口或同一页
    隐藏 anchor。X 时间线里的回复按钮能在页面内打开 composer 且保留滚动，但只覆盖时间线里
    已有的原帖、无法回复弹窗里的任意评论；弹窗统一用 CreateTweet。
  - 点赞图标：未点赞用空心 path `COMMENT_HEART_OUTLINE_PATH`，点赞后用实心
    `COMMENT_HEART_PATH` 和 `--xmp-accent` 暖橙色；`applyLikeState` 同时更新 `path.d`、
    `aria-pressed` 和计数。
  - 资料：与主页 HoverCard 一致的悬浮卡。头像/用户名 `pointerenter` 250ms 后展示，离开
    180ms 收起，进入卡片取消收起；「资料」按钮可点击钉住/取消。卡片挂到 `body`、fixed、
    z-index 2100，不被弹窗 overflow 裁切；滚动/缩放/外部点击/关闭弹窗都移除。数据来自同一条
    响应（`profile_bio.description`、`location.location`、`relationship_counts`），不额外请求；
    「在 X 打开主页」/「Open profile on X」新标签页打开。只保留一张卡。资料按钮用
    `.xmp-comments-action-profile` 标记，外部点击判定依赖这个 class；不要改回按
    `aria-label` 文字匹配（文案会随界面语言变化）。
- 渲染：`textContent` 渲染正文（先解码 HTML 实体），t.co 链接换成 `display_url`；媒体里的
  t.co URL 从正文删除，仅渲染缩略图/封面。所有用户内容不拼 `innerHTML`。
- 弹窗打开时**不要**把 `html/body` 设 `overflow: hidden`（Chrome 会把滚动位置清到 0，关掉后
  首页跳回顶部）。改用 overlay 上 `wheel`/`touchmove` 阻止背景滚动，body 区域放行；键盘
  滚动键在弹窗内阻止。关闭后首页滚动位置保持。
- 关闭入口：`×`、`Esc`、点击 backdrop；切路由或关闭脚本也关闭。输入框打开时 `Esc` 只收起
  输入框，不关闭弹窗；提交中不允许关闭输入框。请求用 AbortController，关闭后忽略迟到的响应；
  接口失败时弹窗内提供「重试」和「在新标签页打开帖子」兜底。只展示接口返回的第一页评论，
  不加载更多。

### 帖子/用户主页在新标签页打开

- 不再提供「开启/关闭」或「新标签页打开」菜单开关；脚本安装后默认启用。`init()` 不再读
  `GM_getValue`/localStorage，也没有 `registerMenu`/`setEnabled`。
- window 捕获阶段拦截点击：
  - 先处理 X 原生资料卡 `[data-testid="HoverCard"]`（它在 tweet 外，不能要求 `closest(TWEET)`）：
    点击的 anchor pathname 匹配 `PROFILE_PATH`（含 following/followers/verified_followers/
    followers_you_follow）且不是 `RESERVED_HANDLES` 时，直接 `openInNewTab(anchor.href)`；
    其他资料卡点击直接 return，不再落到下面的帖子逻辑。资料卡在任意路由都可用，因此这段在
    route 检查之前。
  - 再处理 tweet 头部资料链接：点击的 anchor 位于 `[data-testid="User-Name"]` 或
    `[data-testid="Tweet-User-Avatar"]`、且不在 `[data-testid="tweetText"]` 内时，直接
    `openInNewTab(anchor.href)`；正文里的 @ 提及不接管。
  - 再处理主帖正文/时间戳：点击的 anchor pathname 必须与 `cellStatusLink(cell)` 相同；话题/
    外链/analytics 交给 X。
- 不拦截：`[role="dialog"]`、评论按钮 `[data-testid="reply"]`、`button`/`[role="button"]`/
  `input`/`textarea`/`select`/`label`/`contenteditable`、`video`/`audio`/`tweetPhoto`/
  `previewInterstitial`/`card.wrapper`；有文本选区时也不拦截。
- 打开方式：`openInNewTab()` 新建临时 `<a target="_blank" rel="noopener noreferrer">` 并 click，
  避免 `window.open(..., 'noopener')` 返回 null 无法判断是否成功；打开后移除。
- 主帖/头部资料链接覆盖 home/profile/explore/search 和通知页（通知行内头像）；资料卡覆盖所有路由。
  引用帖、列表、外部链接等仍走 X 原行为；通知行本身没有 status 链接，整行继续由 X 同标签打开。
  `restoreHomeReturn` 继续保留给这些同标签入口兜底。
- 评论按钮仍由后注册的 `watchComments` 处理（`watchOpenTargets` 先 return）。

### 时间

- 可见时间来自 `time[datetime]`；用本地时间格式化：当天 `HH:mm`；中文界面昨天 `昨天·HH:mm`，
  更早 `M月D日·HH:mm`（跨年 `YYYY年M月D日·HH:mm`）；英文界面 `Yesterday·HH:mm`，
  更早 `Nov 2·HH:mm`（跨年 `Nov 2, 2025·HH:mm`）。
- 注入 UI 的计数用 `Intl.NumberFormat` 的 compact 格式：中文 `1.2万`，英文 `12K`；不要把
  `zh-CN` 写死。
- 详情页主时间可能在一个 `<time>` 中包含“下午2:58 · 2026年11月2日”整段；直接替换可见文本，
  不要额外拼接日期。同步更新父链接的 `aria-label`。
- X 重渲染会恢复相对时间；首页扫描和路由回调在每次渲染后重新格式化。

### 性能与状态

- 观察器只观察 `primaryColumn`，150ms 防抖；不添加滚动监听。不要用 `requestAnimationFrame`
  作为扫描唯一入口——后台标签页/不可见窗口不会触发 rAF。
- 适配器要幂等；扫描只处理变更节点。避免对 primary 内所有元素做 `getComputedStyle`。
- 隐藏标签页的定时器会被节流，截图可能出现未重绘的黑块；这是截图/合成器现象，先查 DOM
  计算样式再判断，不要据此改 CSS。
- 后台标签页里 X **不会加载详情页的回复**，会话模块看起来只有 1 个单元格；`Page.bringToFront`
  并等待数秒后回复才会渲染出来，否则会把「回复没加载」误判成「选择器失效」。同理，注入脚本后
  媒体按钮要等 1–3 秒（X 流式渲染 + 150ms 防抖）才会全部出现。
- 调试 Chrome 的 `Emulation.setDeviceMetricsOverride` 只改布局视口，`Input.dispatchMouseEvent`
  的坐标按 CSS 像素给；把鼠标移到视口外不会产生 pointer 事件，验证悬浮层前先确认目标在
  70–890px 之间。

## 已知限制

- 同一帖子同时有自有媒体和引用媒体时，当前只折叠自有媒体；引用媒体保持可见。若要分别折叠，
  需要把媒体状态从帖子级改为媒体块级（多按钮/多状态）。
- 帖子外层的链接卡片媒体保持原生，不参与折叠。
- 注入的界面文案只提供中文和英文；`html[lang]` 不是 `zh*` 时回退英文，没有手动语言开关。
- 悬浮原图预览只覆盖图片：视频、GIF 和链接卡片缩略图不预览；预览按悬停的那一张显示，
  轮播只预览当前可见的 slide，不能在浮层里翻页。
- 评论弹窗依赖 X 的私有 `TweetDetail`、`FavoriteTweet`/`UnfavoriteTweet` 和 `CreateTweet`
  接口和当前 `features`/`queryId`；X 改版后可能返回 400/404，脚本会尝试从 `main.*.js` 重新
  发现 queryId 并重试一次，仍失败则显示兜底按钮或输入框错误。只展示第一页评论，不继续加载
  更多；回复只支持纯文字（280 字），不支持图片、视频或投票。
- 回复依赖 `x-client-transaction-id` 生成器（`/i/jf/` + `ondemand.s` + `loading-x-anim`）。
  X 改版导致 key/indices/动画帧结构变化时，生成器会失效并在输入框显示「生成 X 写入校验头
  失败」；如果生成的头仍被 X 拒绝，可能再次出现 344。需要更新生成器，或临时改用 X 原生 composer。
- 评论层级按 `in_reply_to_status_id_str` 建树；父评论不在首屏的回复直接丢弃（推荐/旁支）。
  对话里混入的推荐/广告帖按 conversation id 过滤；X 若改变 conversation 字段，需要补过滤规则。
- Grok 抽屉的对话气泡按最近底色翻色；如果 X 给消息加新的彩色表面，白字/白图标会按“彩色气泡”
  保持原样，需要时再在 `nearestPaperBackground` 的白名单里补规则。
- 通知行没有 status 链接，点正文/整行仍由 X 在当前标签打开帖子；只有行内头像链接走新标签页。
  评论弹窗需要通知行内嵌带操作栏的 tweet，当前「最新帖子」类通知不显示操作栏。
- 通知缩略图折叠和预览按 64px 内联背景图识别；X 若改用 `tweetPhoto` 或新增缩略图尺寸，需要
  调整 `markNotificationThumbs()` 的尺寸/地址阈值。预览用 `name=orig` 变体，其他 CDN 保持原样。
- X 的 A/B 布局、实验性卡片和生成 class 会继续变化；`docs/selectors.md` 是维护入口。

## 发版

- 版本号在 userscript 头部的 `@version`，Greasy Fork 以它作为发布版本：修复递增补丁位
  （0.8.0 → 0.8.1），功能递增次版本位（0.7.9 → 0.8.0）。commit 信息用 `feat:` / `fix:` 前缀。
- Greasy Fork 已配置从 GitHub 自动同步：脚本页 → Admin → Source Syncing 指向
  `https://raw.githubusercontent.com/venom-zen/x-paper/main/x-morning-paper.user.js`，方式为
  Automatic，约每小时检查一次。同步只取代码；脚本页的 Additional info 不随同步更新。
- push 到 `main` 且 `x-morning-paper.user.js` 有变化时，Greasy Fork 按文件里的 `@version`
  发布新版本。只改 README / docs / AGENTS 不影响同步，因为同步 URL 只指向 userscript 文件；
  改了脚本却不递增 `@version` 时无法作为新版本发布。
- 需要 push 后立即发布时，在仓库 Settings → Webhooks 配置 Greasy Fork 提供的 webhook
  （见 Admin 页 Source Syncing 区的说明）。

## 提交前检查

- [ ] `node --check x-morning-paper.user.js`
- [ ] fixture 的 1920 / 1000 / 999、媒体、路由（含 `?route=notifications`）、降级、中英文通过
- [ ] 真实 X 的 1920/1440、深色/浅色、中英文、首页/详情、媒体/时间/通知检查
- [ ] 通知页检查 SPA 进入（从首页点通知）和返回首页：`data-xmp-inner-timeline` 存在、正文列
      与 cell 同宽、时间已格式化
- [ ] `impeccable detect --json x-morning-paper.user.js` 无新增发现
- [ ] `@version` 已按本轮类型递增（fix → 补丁位，feat → 次版本位）
- [ ] README、`docs/selectors.md`、截图与当前行为一致
- [ ] 无旧插件名、调试截图、临时文件、cookie 或会话数据进入 diff
- [ ] commit 信息只覆盖本轮改动
