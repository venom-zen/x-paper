# x-paper 选择器与降级参考

本文件记录 `x-morning-paper.user.js` 依赖的现场锚点、运行状态属性和降级行为，供 X 改版时
维护使用。精确选择器仍以现场 DOM 为准；脚本不依赖界面文字。

## 运行状态属性

| Attribute | 值 | 作用 |
|-----------|----|------|
| `data-xmp-enabled` | `1` | `html` 上的主题作用域；关闭脚本时移除 |
| `data-xmp-route` | `home` / `status` / `other` | SPA 路由分类；版面 CSS 只对 home/status 生效 |
| `data-xmp-degraded` | `1` | primary 或版面锚点缺失；只应用主题，关闭版面、噪音和媒体 CSS |
| `data-xmp-inner-timeline` | 空 | 标记 primary 内的 600px 时间线容器，供版面 CSS 放宽到 100% |
| `data-xmp-media-block` | 空 | 媒体块标记；折叠态 CSS 的隐藏目标 |
| `data-xmp-media-state` | `collapsed` / `expanded` | 顶层帖子的媒体状态 |
| `data-xmp-tabbar` | 空 | 首页主内容容器内的 tab 栏容器；主题背景标记 |
| `data-xmp-composer` | 空 | 首页主内容容器内的发帖框包装层；主题背景标记 |
| `data-xmp-divider` | 空 | 首页发帖框后的 1–2px 分隔条；背景透明，由发帖框下边框提供线条 |

## 时间格式

脚本读取 primary 内每个 `time[datetime]` 的 `datetime`，把可见文本重写为本地时间：

- 当天：`HH:mm`
- 昨天：`昨天·HH:mm`
- 更早：`M月D日·HH:mm`；跨年时为 `YYYY年M月D日·HH:mm`

`datetime` 无效时保持 X 原文本。X 重渲染后由首页扫描或路由回调重新格式化。

## 现场锚点

现场结构记录于 `design.md` 的 Context（2026-11-02，1920×953，X 深色主题）。

| 用途 | 选择器 | 备注 |
|------|--------|------|
| 主导航容器 | `header[role="banner"]` | 原宽 595px；内部 nav 原为 `position: fixed; left: 320px; width: 275px` |
| 导航链接 | `[data-testid^="AppTabBar_"]` | 选择器健康检查的 nav 锚点 |
| 发帖 / 账号 | `SideNav_NewTweet_Button` / `SideNav_AccountSwitcher_Button` | 左轨中隐藏文字标签 |
| 正文列 / 右栏 | `[data-testid="primaryColumn"]` / `[data-testid="sidebarColumn"]` | 右栏在 home/status 隐藏 |
| 内层时间线 | primary 内计算样式 `max-width: 600px` 的容器 | 加 `data-xmp-inner-timeline` 后放宽 |
| 时间线单元格 | `[data-testid="cellInnerDiv"]` | 时间线根 = 这些单元格的最近公共容器 |
| 帖子 / 正文 | `[data-testid="tweet"]` / `[data-testid="tweetText"]` | 顶层帖子没有祖先 `tweet` |
| 图片 / 视频预览 | `[data-testid="tweetPhoto"]` / `[data-testid="previewInterstitial"]` | 媒体收集目标 |
| 链接卡片 | `[data-testid="card.wrapper"]` | 卡片内媒体不折叠 |
| 推广单元格 | `[data-testid="placementTracking"]` | 首页 `cellInnerDiv:has(...)` 隐藏 |
| 推荐关注 | `[data-testid="UserCell"]` | 首页隐藏；搜索/通知页保持可见 |
| 操作组 | `[role="group"]` | 媒体块祖先不得包含它；图标 16px、计数 13px |
| 搜索框 / 趋势 | `SearchBox_Search_Input` / `trend` | 其他页面主题表面 |
| 首页 tab 栏 | 首页主内容容器的第一个子元素；含 `[role="tablist"]` | 标 `data-xmp-tabbar`；容器和子 div/nav 都要纸色 |
| 首页发帖框 | 主内容容器的发帖框包装层；含 `[data-testid="tweetTextarea_0"]` 和 `toolBar` | 标 `data-xmp-composer`；外层和子 div 都要纸色 |
| 发帖按钮 | `[data-testid="tweetButtonInline"]` | 主按钮使用 `--xmp-pine` |
| 多图轮播 | 帖子内 `[data-testid="ScrollSnap-List"]` | X 当前多图媒体使用滚动轮播；媒体块取该轮播容器 |

## 媒体

- 只处理 `!tweet.parentElement.closest('[data-testid="tweet"]')` 的顶层帖子。
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
- 媒体块或公共祖先找不到时不插入按钮，原媒体保持可见。

## 降级

| 缺失 / 条件 | 行为 |
|-------------|------|
| `primaryColumn` 缺失 | 设置 `data-xmp-degraded`，只应用主题；移除媒体标注 |
| header/nav 或内层时间线容器缺失 | 同 primary 缺失，主题模式 |
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
  脚本用 `data-xmp-tabbar`/`data-xmp-composer` 标记并覆盖其子 div/nav 背景。
- 多图帖子使用 `[data-testid="ScrollSnap-List"]` 滚动轮播；轮播包含全部收集到的媒体时作为
  媒体块，否则退回公共祖先算法，避免只折叠轮播而留下其余媒体。
- 引用帖不是嵌套的 `[data-testid="tweet"]`，而是包含 `User-Name` 和 `tweetText` 的
  `div[role="link"]` 容器；媒体适配用它区分引用帖媒体：有自有媒体时优先自有，只有引用媒体
  时折叠引用媒体的图片。
- 帖子分隔线是 `[data-testid="cellInnerDiv"] > div` 的深色 `border-bottom`；主题改为
  `--xmp-rule` 浅纸色。
- 详情页线程竖线是 `cellInnerDiv` 内头像列最后一个 div（2×57px、深色背景）；主题用
  `[data-testid="Tweet-User-Avatar"] ~ div:last-child` 改为同一浅纸色。
- 头像框来自头像容器内部的黑色底层和 inset 白色 `box-shadow`；主题清空头像后代的背景和阴影。
- 正文列左右框线是 `primaryColumn` 的 1px `border-left/right`；版面主题将其设为 0。
- 操作栏上分割线是 `[role="group"]` 的 `border-top`；主题不再绘制。
- 新帖提示是 `[role="status"][data-keep-composer-open]` 内的按钮；按钮需要 `width: auto`、
  `gap: 6px`，否则短文案「已发布」会留下大间隔。
- Toast 是 `[data-testid="toast"]`；原为 X 蓝/绿色块，主题改为纸面浮起色和墨色文字。
- 左栏 nav 的标签包装层带 20px/16px 水平外边距；只隐藏文字会让图标被外边距拉向左边缘，
  收起时必须同时隐藏标签包装层。
- 发帖入口 `SideNav_NewTweet_Button` 位于屏幕左侧 275px 容器内，收起为 88px 轨道后会在
  轨道内露出一角；版面模式隐藏该按钮，发帖使用首页发帖框。
- 发帖编辑器的背景色会覆盖 Draft.js 的 placeholder；编辑器保持透明才能显示提示文字。
- 首页 tab 栏和发帖框仍可能由 X 的 `background-image`/`backdrop-filter` 或子容器背景控制；
  主题规则必须覆盖容器和子元素，不能只改 primary。

## 维护

1. X 改版后先在 DevTools 核对上表锚点；用 `data-testid`/ARIA，不做文本匹配。
2. 优先更新 `x-morning-paper.user.js` 的选择器，然后同步 `test/fixture.html` 和本文件。
3. 运行 `node --check`，用 fixture 验证布局、媒体、路由和降级，再在真实 X 上按
   `design.md` 的 Testing 章节手动检查。
4. 选择器缺失时保持内容可见；不要用模糊文本或位置选择器兜底。
