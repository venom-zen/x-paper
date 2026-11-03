# Implementation Plan: X 晨报首页

## Overview

本计划由 [design.md](design.md) 的已批准设计和 Acceptance Criteria 驱动，对应
`WI-morning-paper-home`。实现为一个 Tampermonkey userscript `x-morning-paper.user.js`，
不引入构建步骤；CSS 优先，运行时只维护刊头、媒体标注、路由、健康检查和菜单。

执行顺序为 7 个阶段：脚本骨架/控制层/主题 → 版面外壳 → 日期刊头 → 媒体适配 → 噪音过滤 →
路由/选择器健康/容错 → 最终 QA、无障碍和性能。每个阶段以一个 Checkpoint 结束；
Checkpoint 在已登录 X 的 Windows Chrome + Tampermonkey 中执行。

精确 CSS 选择器在编码阶段以现场 DOM 为准；任务使用 `design.md` 的 Context、
Key Mechanisms 和组件设计作为选择器来源，不依赖界面文字。

## Tasks

- [ ] 1. Phase 1: 脚本骨架、控制层和主题
  - [✅] 1.1 创建 userscript 骨架和总开关
    - 创建 `x-morning-paper.user.js`，写入 `@match https://x.com/*`、`@run-at document-start`、
      `@grant GM_getValue`、`@grant GM_setValue`、`@grant GM_registerMenuCommand`、`@grant GM_addStyle`
    - 实现 `readEnabled()`、`writeEnabled()`、`registerMenu()` 和 `init()`；关闭状态下仍注册菜单，
      正常路径关闭后重新加载页面
    - _Acceptance: AC-control-off, AC-control-on_
    - _Design: Decision Record / DR-control-fallback_
    - _Design: Proposed Solution / Architecture_
  - [✅] 1.2 实现预置样式和主题 CSS
    - 在 `document-start` 注入 `PREFLIGHT_CSS`：`html` 纸张背景和 `color-scheme: light`
    - 在 `html[data-xmp-enabled="1"]` 下注入 `THEME_CSS`：`--xmp-*` token、正文/元信息/tabs/
      发帖框/媒体按钮/右栏/搜索框/趋势表面；用 `!important` 覆盖 X 深色内联颜色；加入纸纹层
    - 覆盖 X 深色和 dim，验证正文 7:1、次要文字 4.5:1 的对比度
    - _Acceptance: AC-theme-surfaces, AC-theme-contrast, AC-theme-dark-mode, AC-state-loading-flash_
    - _Design: Proposed Solution / Theme Tokens_
    - _Design: Decision Record / DR-fixed-light-system-fonts_
  - [✅] 1.3 实现操作栏、其他页面主题和动效偏好
    - 在 `THEME_CSS` 中加入操作栏：16px 图标、`--xmp-ink-secondary`、悬停/焦点松绿、
      点赞 `--xmp-like`、`--xmp-hairline` 分隔线、底部 8px；不改变 X 原生点击区域
    - 为搜索/通知页的右栏、搜索框和趋势模块补充纸张表面规则，不重排这些页面
    - 在 `prefers-reduced-motion: reduce` 下关闭左轨和媒体过渡
    - _Acceptance: AC-theme-actions, AC-theme-other-pages, AC-a11y-motion_
    - _Design: Proposed Solution / Theme Tokens_
    - _Design: Decision Record / DR-route-scope_
  - [ ] 1.4 Checkpoint - 主题和控制
    - 在 Tampermonkey 中加载 `x-morning-paper.user.js`，打开 `https://x.com/home`
    - 分别在 X 深色和浅色设置下检查纸张底色、正文、tabs、发帖框、媒体按钮、操作栏、
      搜索/通知页右栏与趋势；确认无深色大块、对比度达标、操作栏 16px 图标
    - 通过 Tampermonkey 菜单关闭/开启，确认重载后无残留样式/DOM
    - Pass when 主题表面和开关均符合上述 AC；否则停止并记录差异
    - _Acceptance: AC-theme-surfaces, AC-theme-contrast, AC-theme-actions, AC-theme-other-pages, AC-theme-dark-mode, AC-state-loading-flash, AC-control-off, AC-control-on_
    - _Design: Testing_
  - [✅]* 1.5 添加 README 安装和手动检查说明
    - 创建 `README.md`，记录 Tampermonkey 安装、权限、开关和 Testing 章节的手动检查步骤
    - _Design: Testing_

- [ ] 2. Phase 2: 版面外壳
  - [✅] 2.1 实现左轨和右栏隐藏
    - 在 `LAYOUT_CSS` 中覆盖 `header[role="banner"]`、内部 fixed nav、nav 宽度和 primary 内层
      `max-width: 600px` 时间线容器；左轨 88px、标签隐藏、`sidebarColumn` 隐藏
    - CSS 作用域限定在 `html[data-xmp-route="home"]`、`html[data-xmp-route="status"]`
      且视口 ≥1000px
    - _Acceptance: AC-layout-rail-collapsed, AC-layout-sidebar-hidden_
    - _Design: Decision Record / DR-layout-shell_
    - _Design: Proposed Solution / Key Mechanisms / 路由与选择器健康_
  - [✅] 2.2 实现左轨悬停/键盘浮层
    - 为 nav 添加 `:hover` 和 `:focus-within` 的 240px 浮层；浮层覆盖正文，不推动正文
    - 键盘焦点进入左轨时显示标签；过渡遵守 `prefers-reduced-motion`
    - _Acceptance: AC-layout-rail-expand, AC-layout-rail-no-shift, AC-a11y-rail_
    - _Design: Decision Record / DR-layout-shell_
  - [✅] 2.3 实现正文列宽度、居中和时间线宽度
    - 按 1600/1280/1000 断点设置正文列 760/720/680px；在左轨之外的剩余空间居中
    - 放宽 primary 内层时间线容器到 100%，确保 `cellInnerDiv` 和 `tweetText` 使用正文列宽度
    - _Acceptance: AC-layout-column-width, AC-layout-column-centered, AC-layout-timeline-width_
    - _Design: Decision Record / DR-layout-shell_
  - [✅] 2.4 实现 <1000px 边界
    - 通过 CSS media query 和运行时视口判断，在 <1000px 不应用左轨、右栏和正文宽度覆盖，
      只保留浅色主题；刊头、媒体适配也按 Scope Decision 在 ≥1000px 启用
    - 在 999/1000px 手动切换视口，确认布局属性按边界移除/恢复
    - _Acceptance: AC-layout-breakpoint_
    - _Design: Discovery / Scope Decisions_
    - _Design: Decision Record / DR-layout-shell_
  - [ ] 2.5 Checkpoint - 版面
    - 在 1440×900、1920×953、999px 和 1000px 检查：88px 左轨、无右栏、正文列
      760/720/680px、居中、时间线宽度；悬停/键盘展开不移动正文
    - 打开帖子详情，确认 ≥1000px 时同样应用左轨、右栏隐藏、列宽和居中
    - Pass when 上述布局 AC 全部可观察；否则停止并记录断点或选择器差异
    - _Acceptance: AC-layout-rail-collapsed, AC-layout-rail-expand, AC-layout-rail-no-shift, AC-layout-sidebar-hidden, AC-layout-column-width, AC-layout-column-centered, AC-layout-timeline-width, AC-layout-breakpoint, AC-a11y-rail_
    - _Design: Testing_

- [ ] 3. Phase 3: 日期刊头
  - [✅] 3.1 实现日期刊头
    - 实现 `formatMastheadDate()`，使用 `Intl.DateTimeFormat('zh-CN', ...)`/`formatToParts`
      生成 `YYYY.MM.DD 星期X`
    - 实现 `ensureMasthead()`：在首页 ≥1000px 时于时间线 tabs 上方插入唯一、非粘性
      `#xmp-date-masthead`；离开首页或 <1000px 时移除
    - 路由进入/离开首页时重新计算日期；跨午夜不设定时器
    - _Acceptance: AC-layout-masthead, AC-layout-breakpoint_
    - _Design: Proposed Solution / Key Mechanisms / 日期刊头_
    - _Design: Decision Record / DR-date-masthead_
  - [✅] 3.2 实现加载、空和错误状态
    - 为骨架、空时间线和错误状态补充纸张配色规则；空时间线保留刊头，不因缺少
      `cellInnerDiv` 移除刊头或设置 degraded
    - 确认 `document-start` 预置样式覆盖首屏，主题应用前不出现深色闪屏
    - _Acceptance: AC-state-loading-colors, AC-state-loading-flash_
    - _Design: Proposed Solution / Key Mechanisms / 日期刊头_
    - _Design: Error Handling_
  - [ ] 3.3 Checkpoint - 刊头和状态
    - 在 1440/1920 和 999/1000px 检查刊头：格式、唯一、非粘性、只在首页、≥1000px 显示
    - 刷新、慢网和空时间线：确认刊头保留、骨架/空状态纸张配色、无深色闪屏
    - Pass when `AC-layout-masthead`、`AC-layout-breakpoint` 和状态 AC 均符合；否则停止
    - _Acceptance: AC-layout-masthead, AC-layout-breakpoint, AC-state-loading-colors, AC-state-loading-flash_
    - _Design: Testing_

- [ ] 4. Phase 4: 媒体适配
  - [✅] 4.1 实现顶层帖子媒体收集
    - 实现 `collectMedia(tweet)`：只处理 `tweet.closest('[data-testid="tweet"]') === tweet`
      的顶层帖子；收集 `tweetPhoto` 和 `previewInterstitial`
    - 排除嵌套 `tweet` 内的媒体和 `card.wrapper` 内的链接卡片预览；没有媒体时清除已有标注
    - _Acceptance: AC-media-nested-count_
    - _Design: Proposed Solution / Key Mechanisms / 媒体块识别与折叠_
  - [✅] 4.2 实现媒体块、按钮和文案
    - 实现 `findMediaBlock()`：从第一个媒体元素向上查找包含全部媒体、且不含 `tweetText`
      或操作组的最近祖先；分配 `id="xmp-media-block-<n>"`，标记 `data-xmp-media-block`
    - 插入 `button.xmp-media-toggle`，设置 `aria-expanded="false"`、`aria-controls` 和
      可访问名称；按单图/多图/视频/混合媒体生成文案（混合媒体按设计使用“媒体 · N 项”）
    - 默认把帖子设为 `data-xmp-media-state="collapsed"`，媒体块由 CSS 隐藏
    - _Acceptance: AC-media-trigger, AC-media-count, AC-a11y-media-name_
    - _Design: Proposed Solution / Key Mechanisms / 媒体块识别与折叠_
    - _Design: Decision Record / DR-media-emoji-toggle_
  - [✅] 4.3 实现展开/收起状态
    - 实现 `setMediaState()`：切换 `data-xmp-media-state`、按钮文字和 `aria-expanded`
    - `collapsed` 只添加 `display: none` 覆盖；`expanded` 移除覆盖，不写死
      `display: block`，保留媒体块原有 grid/flex；设置 `max-height: 70vh` 和
      `overflow-y: auto`
    - 保留 X 原生图片点击和视频播放；不自动播放视频
    - _Acceptance: AC-media-expand, AC-media-expand-layout, AC-media-expand-state, AC-media-collapse, AC-media-collapse-state_
    - _Design: Proposed Solution / Key Mechanisms / 展开与收起_
  - [✅] 4.4 实现 70vh 边界
    - 为展开媒体块设置 `max-height: 70vh`、`overflow-y: auto`；确认帖子操作栏在媒体块后仍可到达
    - 在 953px 和 600px 视口高下分别验证完整显示和内部滚动
    - _Acceptance: AC-media-boundary-scroll, AC-media-boundary-actions_
    - _Design: Proposed Solution / Key Mechanisms / 展开与收起_
  - [✅] 4.5 实现回退和引用帖媒体保护
    - `findMediaBlock()` 或公共祖先找不到时，保留原媒体可见，不插入按钮、不隐藏媒体
    - 顶层按钮切换时不隐藏嵌套引用帖或 `card.wrapper` 内的媒体
    - _Acceptance: AC-media-fallback, AC-media-nested-hidden_
    - _Design: Error Handling_
    - _Design: Proposed Solution / Key Mechanisms / 媒体块识别与折叠_
  - [✅] 4.6 实现媒体按钮无障碍
    - 确保按钮可获得键盘焦点、焦点可见，Enter/Space 切换状态
    - 可访问名称包含媒体类型和数量；`aria-controls` 指向唯一媒体块 `id`
    - _Acceptance: AC-a11y-media-focus, AC-a11y-media-keyboard, AC-a11y-media-name_
    - _Design: Proposed Solution / Key Mechanisms / 媒体块识别与折叠_
  - [✅] 4.7 实现观察器和性能约束
    - 使用 `MutationObserver` 观察 primary 的 `childList` + `subtree`；回调合并到 rAF 或
      150ms 防抖；只在首页、≥1000px、已启用、未降级时处理
    - 只标注未标注的帖子，并校验按钮仍指向当前媒体块；React 重渲染后重新标注/清理；
      媒体集合变化时重新计数；路由离开或关闭时断开观察器
    - 不添加滚动监听
    - _Acceptance: AC-performance-scroll, AC-media-trigger_
    - _Design: Proposed Solution / Key Mechanisms / 观察器_
  - [ ] 4.8 Checkpoint - 媒体矩阵
    - 在单图、4 图网格、视频、引用帖、链接卡片、推广帖和混合媒体上验证折叠、展开、收起；
      4 图网格展开后保持网格布局；70vh 边界、操作栏可达、键盘操作和原生图片/视频交互
    - 在 999/1000px 验证媒体边界；在 React 重渲染/滚动复用后检查按钮 `aria-controls`
      和媒体块配对；引用帖媒体不计入、不被隐藏
    - Pass when 媒体 AC 和无障碍 AC 全部通过；否则停止并记录场景
    - _Acceptance: AC-media-trigger, AC-media-expand, AC-media-expand-layout, AC-media-expand-state, AC-media-collapse, AC-media-collapse-state, AC-media-count, AC-media-boundary-scroll, AC-media-boundary-actions, AC-media-fallback, AC-media-nested-count, AC-media-nested-hidden_
    - _Acceptance: AC-a11y-media-focus, AC-a11y-media-keyboard, AC-a11y-media-name_
    - _Design: Testing_

- [ ] 5. Phase 5: 噪音过滤
  - [✅] 5.1 实现首页推广和推荐隐藏
    - 在 `NOISE_CSS` 中仅对 `html[data-xmp-route="home"]` 隐藏含
      `[data-testid="placementTracking"]` 的单元格和含 `[data-testid="UserCell"]` 的推荐单元格
    - 使用 `:has()` 和 `data-testid`；选择器缺失时保持内容可见，不做模糊文本匹配
    - _Acceptance: AC-noise-promoted, AC-noise-recommendations_
    - _Design: Decision Record / DR-noise-filter_
  - [✅] 5.2 保持其他页面的用户列表
    - 确认噪音规则只在首页路由生效；搜索和通知页的 `UserCell` 保持可见
    - 为主题层补充搜索/通知页的右栏、搜索框和趋势表面，但不重排这些页面
    - _Acceptance: AC-noise-recommendations-scope_
    - _Design: Decision Record / DR-noise-filter_
    - _Design: Decision Record / DR-route-scope_
  - [ ] 5.3 Checkpoint - 噪音过滤
    - 首页确认推广帖和推荐关注不可见；搜索和通知页确认 `UserCell` 仍可见
    - Pass when `AC-noise-promoted`、`AC-noise-recommendations` 和
      `AC-noise-recommendations-scope` 均符合；否则停止并记录选择器或路由差异
    - _Acceptance: AC-noise-promoted, AC-noise-recommendations, AC-noise-recommendations-scope_
    - _Design: Testing_

- [ ] 6. Phase 6: 路由、选择器健康和容错
  - [✅] 6.1 实现路由控制器
    - 包装 `history.pushState`/`replaceState`，保留原行为；监听 `popstate`；按路径设置
      `html[data-xmp-route]`：`/home`、`/` 为 home，包含 `/status/` 为 status，其他为 other
    - 路由变化后重新评估刊头、观察器和媒体标注；帖子详情应用主题和 ≥1000px 版面外壳，
      移除刊头和媒体按钮；回到首页时恢复
    - _Acceptance: AC-route-status, AC-route-status-exclusions, AC-route-home_
    - _Design: Decision Record / DR-route-scope_
    - _Design: Proposed Solution / Key Mechanisms / 路由与选择器健康_
  - [✅] 6.2 实现选择器健康检查
    - 检查 `[data-testid="primaryColumn"]`、时间线根（primary 内 `cellInnerDiv` 的最近公共容器）
      和版面锚点（`header[role="banner"]`、`[data-testid^="AppTabBar_"]`、primary 内
      600px max-width 内层容器）
    - primary 或版面锚点缺失时设置 `data-xmp-degraded="1"`，只应用主题并记录一次警告
    - 没有 `cellInnerDiv` 时按加载/空时间线处理：保留主题、版面和刊头，启动观察器，
      不设置 degraded、不记录诊断
    - 已有 `cellInnerDiv` 但找不到最近公共容器时：保留主题、版面和刊头，跳过媒体按钮标注，
      保留观察器，记录一次警告
    - _Acceptance: AC-resilience-primary, AC-resilience-timeline, AC-resilience-layout_
    - _Design: Decision Record / DR-control-fallback_
    - _Design: Proposed Solution / Key Mechanisms / 路由与选择器健康_
  - [✅] 6.3 实现存储失败回退
    - 使用 `GM_getValue`/`GM_setValue`；存储写入失败时跳过重新加载，移除当前页面注入的样式和
      DOM，菜单仍可在当前页面重新开启；刷新后恢复默认启用
    - _Acceptance: AC-control-storage-fallback_
    - _Design: Decision Record / DR-control-fallback_
    - _Design: Error Handling_
  - [ ] 6.4 Checkpoint - 路由、健康和容错
    - 首页 → 帖子详情 → 返回：检查 SPA 无刷新、详情页主题/左轨/右栏/列宽/居中、
      无刊头和媒体按钮，返回后恢复刊头和媒体按钮
    - 在本地副本中分别破坏 primary、时间线根、header/nav 和内层时间线容器，验证
      主题降级、刊头保留、观察器等待、警告次数；恢复真实选择器
    - 模拟存储不可用/写入失败，验证当前页面关闭和重新开启
    - Pass when 路由、resilience 和存储回退 AC 全部符合；否则停止并记录失败场景
    - _Acceptance: AC-resilience-primary, AC-resilience-timeline, AC-resilience-layout, AC-control-storage-fallback, AC-route-status, AC-route-status-exclusions, AC-route-home_
    - _Design: Testing_

- [ ] 7. Phase 7: 最终 QA、无障碍和性能
  - [ ] 7.1 执行无障碍和状态检查
    - 用键盘 Tab 走查左轨和媒体按钮；用 Lighthouse/axe 检查对比度和可访问名称；
      用 DevTools 模拟 `prefers-reduced-motion`
    - 覆盖刷新、慢网、空时间线和 X 报错状态；检查无深色闪屏、纸张骨架/空状态、
      空时间线刊头保留，单元格出现后媒体按钮恢复
    - _Acceptance: AC-a11y-media-focus, AC-a11y-media-keyboard, AC-a11y-media-name, AC-a11y-rail, AC-a11y-motion, AC-state-loading-colors, AC-state-loading-flash, AC-theme-dark-mode_
    - _Design: Testing_
  - [ ] 7.2 执行性能检查
    - 用 Chrome Performance 录制 5 分钟滚动；确认无滚动监听、观察器回调合并、
      无脚本引起的 >50ms 长任务
    - _Acceptance: AC-performance-scroll_
    - _Design: Testing_
  - [ ] 7.3 执行核心功能冒烟
    - 在改造后的首页和时间线手动检查发帖、回复、转发、点赞、搜索、通知、私信的入口和一次完整交互
    - 确认操作栏图标、计数和分隔线使用晨报样式，点击和键盘行为与 X 原生一致
    - _Acceptance: AC-theme-actions_
    - _Design: Testing_
  - [ ] 7.4 Checkpoint - 完整验收矩阵
    - 在 Tampermonkey 中加载最终脚本，按 `design.md` 的 Testing 章节和全部 46 条 AC 做完整手动矩阵
    - 覆盖深色/浅色、1440/1920、999/1000、首页/详情/搜索/通知、单图/多图/视频/引用帖/
      链接卡片/推广/混合媒体、存储失败和降级场景
    - Pass when 全部 AC 可观察且无回归；否则停止并按 AC ID 记录失败
    - _Acceptance: AC-layout-rail-collapsed, AC-layout-rail-expand, AC-layout-rail-no-shift, AC-layout-sidebar-hidden, AC-layout-column-width, AC-layout-column-centered, AC-layout-timeline-width, AC-layout-masthead, AC-layout-breakpoint_
    - _Acceptance: AC-media-trigger, AC-media-expand, AC-media-expand-layout, AC-media-expand-state, AC-media-collapse, AC-media-collapse-state, AC-media-count, AC-media-boundary-scroll, AC-media-boundary-actions, AC-media-fallback, AC-media-nested-count, AC-media-nested-hidden_
    - _Acceptance: AC-theme-surfaces, AC-theme-actions, AC-theme-other-pages, AC-theme-contrast, AC-theme-dark-mode, AC-noise-promoted, AC-noise-recommendations, AC-noise-recommendations-scope_
    - _Acceptance: AC-control-off, AC-control-on, AC-control-storage-fallback, AC-resilience-primary, AC-resilience-timeline, AC-resilience-layout, AC-performance-scroll, AC-route-status, AC-route-status-exclusions, AC-route-home_
    - _Acceptance: AC-a11y-media-focus, AC-a11y-media-keyboard, AC-a11y-media-name, AC-a11y-rail, AC-a11y-motion, AC-state-loading-colors, AC-state-loading-flash_
    - _Design: Testing_
  - [✅]* 7.5 保存视觉对比截图和选择器记录
    - 在 `screenshots/` 保存 1440/1920 深色/浅色截图；在 `docs/selectors.md` 记录现场选择器、
      备选和失效表现，供后续维护使用
    - _Design: Testing_
    - _Design: Context_

## Notes

- 标记 `*` 的任务可以在 MVP 中跳过；其余任务是验收所需。
- 任务编号在开始执行后保持稳定。
- `design.md` 是行为和验收的唯一来源；本文件不复制完整 AC 文本。
- 精确 CSS 选择器在编码阶段以现场 DOM 为准；选择器缺失一律走主题降级路径，不做模糊文本匹配。
- 手动 Checkpoint 需要已登录的 X 会话和 Windows Chrome + Tampermonkey；如果执行环境无法访问
  用户登录态，按 Checkpoint 步骤交给用户验证。
- 本设计没有数据库、SQL、后端或远程配置，不存在迁移任务。
