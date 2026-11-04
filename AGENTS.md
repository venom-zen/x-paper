# AGENTS.md

面向在本仓库迭代 `x-paper` 的 agent。先读本文件，再读 `README.md` 与
`docs/selectors.md`。

## 项目事实

- 插件名是 `x-paper`（userscript 头部的 `@name` / `@namespace`、Tampermonkey 菜单、
  控制台前缀）。文件名保留历史命名 `x-morning-paper.user.js`。
- 作者 `venom`，MIT 许可（`LICENSE`）；userscript 头部保留 `@author` / `@license`。
- 入口：`x-morning-paper.user.js`。文档：`README.md`、`docs/selectors.md`。测试：
  `test/fixture.html`。截图：`screenshots/`。
- 只使用 `GM_getValue`、`GM_setValue`、`GM_registerMenuCommand`、`GM_addStyle`；不发起
  网络请求，不读取账号数据，不发布、点赞、关注、私信或修改任何账号状态。
- 当前行为以代码、README 和 `docs/selectors.md` 为准。不要按已删除的旧设计记录回退
  当前行为。
- 已经落地的、与初版设计不同的行为：无日期刊头、无操作栏上分割线、无正文列左右框线、
  无头像框线、引用帖媒体折叠、帖子时间显示具体时刻、通知/Toast 纸面化、左轨点击展开、
  图片悬浮原图预览、详情页/文章页表面纸面化。不要按旧设计回退（尤其不要把左轨改回
  hover/focus-within 自动展开）。

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
4. **等待异步**：X 是流式渲染；媒体扫描 150ms 防抖，标签页不可见时浏览器会节流定时器。
   截图/检查前等待 3–5s，确认扫描完成，必要时再查询一次 DOM。
5. **状态矩阵**：真实 X 的 1920×953、1440×900；X 深色/浅色设置；首页、详情、搜索/通知；
   单图、网格、轮播、视频、引用帖、引用卡片、混合媒体；hover、focus、媒体折叠/展开。
6. **边界**：999/1000px 是版面分界；1000px 应用轨道/680 列/媒体按钮，999px 只应用主题。
7. **fixture**：`node --check x-morning-paper.user.js`；`python -m http.server 8765` 后打开
   `http://127.0.0.1:8765/test/fixture.html`，检查媒体、路由、降级、存储回退和 1920/1000/999。
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
  `/explore` 之类会被误判成个人主页。观察器只在 home/profile 运行；媒体折叠在首页和个人主页都生效
  （详情页不折叠）。关注/正在关注/私信/更多按 testid 后缀主题化，
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
- 详情页/文章页的推广回复和首页推广帖用同一个标记（`cellInnerDiv` 内含
  `[data-testid="placementTracking"]`），`NOISE_CSS` 的推广规则要覆盖 home 和 status 两个路由；
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
- X 从详情页返回首页（app-bar 的 `←` 触发 `popstate`）时会重建时间线，滚动位置会回到顶部，
  而且重建后往往只有少量单元格。脚本在离开 home 时记录滚动量、第一条可见帖子（取带 `time` 的
  时间戳链接，不能用引用帖链接）和已展开媒体的帖子；返回后把该帖子钉回原来的视口位置，并恢复
  那些媒体块的展开态，否则重建后媒体集体折叠会让页面高度突变、定位漂移。帖子还没渲染时先等 2s
  再按像素回填，锚点未出现时至少校正到 6s。重建期间用 rAF 每帧对齐锚点（250ms 轮询会让用户看到
  明显跳动），布局静止 1.5s 后停止，最多 10s。A/B 验证（同一流程，关闭恢复）：恢复关闭时返回后
  停在 `scrollY≈649`（目标帖 `top≈1512`，在视口外），开启时回到 `scrollY≈2002`（目标帖在视口内）。
  用户 wheel/touchmove 或 PageUp/PageDown/Home/End/方向键/空格即放弃校正，别长时间抢滚动。
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

### 时间

- 可见时间来自 `time[datetime]`；用本地时间格式化：当天 `HH:mm`，昨天 `昨天·HH:mm`，更早
  `M月D日·HH:mm`（跨年带年份）。
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
- 悬浮原图预览只覆盖图片：视频、GIF 和链接卡片缩略图不预览；预览按悬停的那一张显示，
  轮播只预览当前可见的 slide，不能在浮层里翻页。
- X 的 A/B 布局、实验性卡片和生成 class 会继续变化；`docs/selectors.md` 是维护入口。

## 提交前检查

- [ ] `node --check x-morning-paper.user.js`
- [ ] fixture 的 1920 / 1000 / 999、媒体、路由、降级通过
- [ ] 真实 X 的 1920/1440、深色/浅色、首页/详情、媒体/时间/通知检查
- [ ] `impeccable detect --json x-morning-paper.user.js` 无新增发现
- [ ] README、`docs/selectors.md`、截图与当前行为一致
- [ ] 无旧插件名、调试截图、临时文件、cookie 或会话数据进入 diff
- [ ] commit 信息只覆盖本轮改动
