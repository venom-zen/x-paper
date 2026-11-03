# X 晨报 Project Plan

## Summary

用户在 Windows Chrome 上通过 Tampermonkey 使用 X。当前桌面版首页仍像被拉宽的移动 app：
左栏只能收成图标、右栏的趋势和广告占用空间、图片和视频过大、视觉厚重，阅读节奏被打断。
项目把首页和帖子详情改造成一份清爽晨报式的 web 页面：冷白新闻纸、墨黑正文、松绿点缀、
日期刊头、细线分隔，左栏收成细图标轨，右栏移除，媒体默认折叠为 emoji 入口，
推广和推荐内容隐藏。

## Planning Status

- **Status**: `ready`。
- **Reason**: 项目问题、目标用户、视觉方向、MVP 边界、覆盖范围、运行环境、成功信号和优先级已由用户确认；
  MVP 对应 3 个 Now work item；`WI-morning-paper-home` 已产出设计并通过结构校验，等待 `design-review`。

## External Tracking

- **Enabled**: yes。
- **Host**: github.com。
- **Owner**: venom-zen。
- **Repo**: venom-zen/x-morning-paper。
- **Project title**: X 晨报。
- **Project number**: 3。
- **Project visibility**: private。
- **Mirror mode**: safe-subset。

已启用；公开仓库上的 Issue 对外可见，镜像只使用 `safe-subset` 字段。

## Target Users and Outcomes

| User / Role | Current problem | Desired outcome |
|-------------|-----------------|-----------------|
| 用户本人 | 首页像移动 app：左栏只能收成图标、右栏占空间、图片视频过大、阅读节奏差 | 首页和详情像清爽晨报：文字为主体、无右栏、媒体 emoji 入口 |
| 同一用户的其他浏览场景 | 其他页面仍是 X 原版风格，切换时风格断层 | 主要浏览页保持统一的浅色纸质基调 |

## Goals

- 首页在 1440px 宽屏下呈现晨报式阅读版面：细图标轨、无右栏、宽正文列、日期刊头、媒体 emoji 入口。
- 首页隐藏推广帖、推荐关注和右栏内容，时间线只保留自然内容。
- 帖子详情和线程页延续同一套视觉与阅读层级，长线程可读。
- 用户可随时关闭主题；X 小改版时核心功能仍可用，滚动无明显卡顿。
- 其他主要浏览页保持统一的浅色纸质基调，不出现强烈风格断层。

## Non-Goals

- 不重做 X 的数据、账号、发布、私信等业务逻辑。
- 不在 MVP 中完整重排个人页、搜索、通知、书签、私信、发帖框和设置页。
- 不做移动端 app、独立客户端或后端服务。
- 不做深色纸感主题（列入 Next）。
- 不做页内设置面板、远程配置、账号同步或数据上报。
- 不追求覆盖 X 的所有实验性布局或 100% 像素一致。

## Success Metrics

| Metric | Baseline | Target | Evidence source |
|--------|----------|--------|-----------------|
| 连续使用意愿 | Unknown | 连续 7 天保持开启，不主动切回 X 原主题 | 用户自述与使用记录 |
| 首页版面 | X 当前三栏 app 布局 | 1440px 宽屏下右栏消失、正文列成为主体、媒体为 emoji 入口 | 截图对比 |
| 核心功能 | X 原生功能全部可用 | 发帖、回复、转发、点赞、搜索、通知、私信入口通过手动冒烟检查 | 手动检查清单 |
| 视觉气质 | X 原版黑白界面 | 截图能明确看出冷白新闻纸、墨黑、松绿、衬线标题和日期刊头 | 截图与用户判断 |
| 性能 | Unknown | 连续滚动 5 分钟无明显掉帧；脚本不产生持续长任务 | Chrome DevTools 性能录制 |

## MVP Boundary

### Now

- `WI-morning-paper-home` — 首页晨报化：视觉、版面、媒体 emoji 入口、噪音过滤。
- `WI-post-detail-reading` — 帖子详情/线程阅读版式。
- `WI-resilience-controls` — 总开关、容错、性能。

### Next

- `WI-focus-mode` — 专注阅读模式。
- `WI-other-pages` — 个人页、搜索、通知、书签的晨报化。
- `WI-keyboard-navigation` — 键盘导航。
- `WI-night-paper` — 夜间纸色。

### Later

- `WI-preferences` — 媒体展示方式、密度、字体大小等更多配置。

## Capability Map

| Capability | User outcome | MVP | Work items |
|------------|--------------|-----|------------|
| 晨报视觉系统 | 页面呈现冷白新闻纸、墨黑、松绿、衬线标题、日期刊头和细线分隔 | Now | `WI-morning-paper-home` |
| 首页版面重排 | 左栏细图标轨、右栏消失、正文列加宽、卡片降噪 | Now | `WI-morning-paper-home` |
| 媒体入口 | 图片和视频默认折叠为 emoji 入口，点击就地展开 | Now | `WI-morning-paper-home` |
| 噪音过滤 | 推广帖、推荐关注和右栏内容不进入首页版面 | Now | `WI-morning-paper-home` |
| 帖子详情阅读 | 点进帖子后风格连续，长线程层级清晰 | Now | `WI-post-detail-reading` |
| 轻量控制与容错 | 一键关闭、X 改版不崩、滚动流畅 | Now | `WI-resilience-controls` |
| 专注模式 | 只留正文列的沉浸阅读 | Next | `WI-focus-mode` |
| 其他页面版面 | 个人页、搜索、通知、书签风格连续 | Next | `WI-other-pages` |
| 键盘导航 | 常用操作可以不用鼠标 | Next | `WI-keyboard-navigation` |
| 夜间纸色 | 夜间阅读舒适的深色纸感 | Next | `WI-night-paper` |
| 更多配置 | 媒体展示方式、密度、字体可调 | Later | `WI-preferences` |

## Constraints and Assumptions

### Confirmed Constraints

- 运行环境为 Windows 上的 Chrome + Tampermonkey。
- X 是 React 单页应用，DOM 和 class 名可能随版本变化；脚本必须可降级。
- 脚本无后端、无数据上报，所有状态保存在本地。
- MVP 固定浅色晨报，不做深色主题。
- 媒体默认隐藏为 emoji 入口，点击就地展开；视频不自动播放。
- 左栏为细图标轨，悬停展开；右栏在首页和帖子详情页移除。
- 覆盖首页时间线和帖子详情/线程页；其他页面只做轻量换肤。

### Assumptions to Validate

- X 当前 DOM 暴露足够稳定的挂钩，能通过 CSS 为主、少量 DOM 完成右栏移除、左轨收窄、
  正文列加宽和媒体入口。验证方式：在 Chrome DevTools 检查首页和帖子详情页，记录选择器与备选。
- 媒体 emoji 入口和就地展开在单图、多图、视频、引用帖、链接卡等场景下都可用。
  验证方式：设计已在现场验证基础行为，实施时逐类试装。
- 中文衬线标题在 Windows Chrome 的系统字体栈下可接受。验证方式：用中英文混排帖子做视觉对比。
- 用户接受 MVP 固定浅色，夜间刺眼问题不在第一版解决。已在 2026-11-02 对话确认。

## Project Risks

| Risk | Impact | Mitigation / next action | Owner |
|------|--------|--------------------------|-------|
| X 的 DOM/class 频繁变化 | 选择器失效，布局错乱 | CSS 优先；优先使用稳定属性/ARIA；准备选择器备选；总开关可快速恢复 | 实现者 |
| 媒体结构多样（单图/多图/视频/引用帖/链接卡） | emoji 入口或展开块不一致、误伤引用帖/链接卡 | 整块隐藏/展开；只处理顶层帖子；无法识别时保留原媒体 | 设计者/实现者 |
| 中文字体差异 | 衬线标题在 Windows Chrome 上不可用或不协调 | 系统字体栈 + 无衬线后备；在实际环境验证 | 设计者 |
| MutationObserver 或纸纹导致卡顿 | 滚动不流畅，违背性能目标 | 避免滚动时执行 JS；节流；纯 CSS 纹理；性能录制 | 实现者 |
| X A/B 实验导致结构差异 | 部分页面布局不一致 | 特性检测；降级到轻量主题；不追求 100% 一致 | 实现者 |

## Project Decision Record

### PDR-visual-world

**Decision**: 采用「清爽晨报」视觉世界：冷白新闻纸 `#FBFAF7`、墨黑 `#1B1B1B`、松绿 `#2F5D50`；
标题衬线、正文无衬线；日期作为顶部刊头；细线替代卡片和重边框；MVP 固定浅色。

**Rationale**: 对应「纸质、清新、简洁」和「更像 web 页面」的目标；避开米色加衬线的常见模板；
固定浅色降低 MVP 维护面。被拒方向：稿纸/方格本、信笺/书页、索引卡/档案盒。

**Revisit when**: 用户希望夜间使用、觉得晨报过于编辑化，或需要两套主题。

### PDR-layout-navigation

**Decision**: 首页左栏收成细图标轨并支持悬停展开；右栏移除；正文列加宽并居中；
媒体 emoji 入口；日期刊头。

**Rationale**: 直接回应用户「左栏不能真正隐藏、右栏占空间、媒体过大」的痛点；
保留图标轨降低操作习惯改变。被拒方向：顶部报头导航、完全隐藏侧栏、极简浮动按钮。

**Revisit when**: 用户觉得图标轨仍像 app，或 X 改变导航结构。

### PDR-media-presentation

**Decision**: 时间线媒体默认隐藏，显示 🖼️/🎬 emoji 入口（多图带数量）；点击在帖子内就地展开原媒体，
最高 70vh，视频不自动播放。

**Rationale**: 让文字成为时间线主体，同时保留媒体可访问性；避免缩略图裁切、网格塌缩和父容器空白；
比自定义灯箱少一层实现。被拒方向：120px 缩略图、全宽横幅、自定义覆盖层、打开帖子详情。

**Revisit when**: 用户觉得 emoji 入口过于抽象、就地展开改变页面高度不可接受，或需要统一图片查看器。

### PDR-noise-filter

**Decision**: 首页隐藏推广帖、推荐关注和右栏内容；搜索、通知等页面的用户列表不受影响。

**Rationale**: 用户希望时间线只保留自然内容；按路由限定避免误伤其他页面。

**Revisit when**: X 更改推广/推荐模块标记，或用户希望在其他页面也隐藏推荐。

### PDR-mvp-scope

**Decision**: MVP 覆盖首页时间线和帖子详情/线程页；其他页面只做轻量换肤；
不覆盖私信、发帖框、设置页的完整重排。

**Rationale**: 覆盖主要阅读场景，控制选择器和维护面；先验证晨报方向，再扩展。

**Revisit when**: 用户日常频繁使用其他页面，或首页改造稳定后需要全站一致性。

### PDR-runtime-platform

**Decision**: 以 Chrome + Tampermonkey 为唯一目标环境；CSS 优先、少量 DOM；
无后端、无数据上报；本地存储保存开关。

**Rationale**: 匹配用户实际环境；降低跨浏览器兼容成本；个人工具不需要服务端。

**Revisit when**: 用户更换浏览器或脚本管理器，或需要同步配置。

### PDR-controls

**Decision**: MVP 只提供 Tampermonkey 菜单总开关，不做页内设置面板；
媒体入口形式、颜色、字体等参数先固定。

**Rationale**: 保持界面简洁和实现最小；先验证视觉方向，再决定哪些参数值得暴露。

**Revisit when**: 用户频繁想调整媒体入口或密度，或 Next 阶段需要更多开关。

## Backlog

[backlog.md](backlog.md)

## Open Questions

- 项目级无。首页设计见 `specs/morning-paper-home/design.md`；实现细节由设计文档记录。
