# AGENTS.md

面向在本仓库迭代 `x-paper` 的 agent。先读本文件，再读 `README.md` 与
`docs/selectors.md`。

## 项目事实

- 插件名是 `x-paper`（userscript 头部的 `@name` / `@namespace`、Tampermonkey 菜单、
  控制台前缀）。文件名保留历史命名 `x-morning-paper.user.js`。
- 入口：`x-morning-paper.user.js`。文档：`README.md`、`docs/selectors.md`。测试：
  `test/fixture.html`。截图：`screenshots/`。
- 只使用 `GM_getValue`、`GM_setValue`、`GM_registerMenuCommand`、`GM_addStyle`；不发起
  网络请求，不读取账号数据，不发布、点赞、关注、私信或修改任何账号状态。
- 当前行为以代码、README 和 `docs/selectors.md` 为准。不要按已删除的旧设计记录回退
  当前行为。
- 已经落地的、与初版设计不同的行为：无日期刊头、无操作栏上分割线、无正文列左右框线、
  无头像框线、引用帖媒体折叠、帖子时间显示具体时刻、通知/Toast 纸面化。不要按旧设计回退。

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
- 媒体块要提升到“仍只包含媒体的最高祖先”再隐藏；只隐藏图片内层会留下定高外壳。提升在
  遇到 `tweetText`、`User-Name`、链接卡片、嵌套帖或操作组时停止。
- 轮播必须包含本次选择的**全部**媒体才能作为媒体块；只含部分时退回公共祖先算法。
- 媒体按钮用 `align-self: flex-start`，否则会被 flex 父级拉成整列宽。
- React 会替换已标注的按钮/媒体块；每次扫描要校验按钮与块的配对，失配就清理重标注。
  时间线和单元格是虚拟化的，单元格可能暂时为空或 0 尺寸；不要据此判定选择器失效。
- 详情页在缺少 600px 内层时间线锚点时可能进入 degraded（只应用主题）；不要假设详情页
  一定有轨道/宽列。改动详情排版前先看 `data-xmp-degraded`。

### 主题与排版

- X 深色主题大量使用内联颜色；逐表面覆盖，不要只改 body/primary。
- 正文列左右框线在 `primaryColumn` 的 `border-left/right`；头像框线来自头像内部黑色底层和
  inset 白色 `box-shadow`，不是 `border`。
- 帖子分隔线在 `[data-testid="cellInnerDiv"] > div` 的 `border-bottom`；线程竖线是头像列
  最后一个 div（2px 宽、深色背景）。用 `Tweet-User-Avatar ~ div:last-child` 定位，换成
  `--xmp-rule` 浅纸色。不要用“所有 div 都改 border-color”这种规则，透明边框会显形。
- 操作栏的上分割线在 `[role="group"]` 的 `border-top`；移除时不要误删媒体/正文的边框。
- 发帖编辑器的背景会盖住 Draft.js placeholder；编辑器必须保持透明。
- 左轨图标左偏是 nav 标签包装层的 20px/16px 外边距造成的；收起时同时隐藏包装层，并用
  `align-items: center` 居中，而不是只改 `justify-content`。X 的 `SideNav_NewTweet_Button`
  偏在屏幕左侧，收起为 88px 后会在轨道里露出一角，版面模式需要隐藏。
- 新帖提示是 `[role="status"][data-keep-composer-open]` 内的按钮；必须 `width: auto` 并给
  图标/文字 `gap`，否则「已发布」这类短文案会留下大间隔。Toast 是 `[data-testid="toast"]`；
  两者都使用纸面浮起色，不要沿用 X 的蓝/绿大色块。
- tab 栏和发帖工具栏的滚动箭头是深色圆形按钮；在纸面主题中要改成 paper-raised + 细线。
- 推文里的「显示更多」可能是内联 X 蓝色，不是 `<a>`；用推文范围内的内联颜色选择器改为松绿。
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

## 已知限制

- 同一帖子同时有自有媒体和引用媒体时，当前只折叠自有媒体；引用媒体保持可见。若要分别折叠，
  需要把媒体状态从帖子级改为媒体块级（多按钮/多状态）。
- 帖子外层的链接卡片媒体保持原生，不参与折叠。
- X 的 A/B 布局、实验性卡片和生成 class 会继续变化；`docs/selectors.md` 是维护入口。

## 提交前检查

- [ ] `node --check x-morning-paper.user.js`
- [ ] fixture 的 1920 / 1000 / 999、媒体、路由、降级通过
- [ ] 真实 X 的 1920/1440、深色/浅色、首页/详情、媒体/时间/通知检查
- [ ] `impeccable detect --json x-morning-paper.user.js` 无新增发现
- [ ] README、`docs/selectors.md`、截图与当前行为一致
- [ ] 无旧插件名、调试截图、临时文件、cookie 或会话数据进入 diff
- [ ] commit 信息只覆盖本轮改动
