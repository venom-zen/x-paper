# X 晨报 Backlog

## Status Model

主状态：

```text
candidate -> ready-for-clarifying -> design-ready -> planned -> executing -> done
```

旁路状态：`blocked`、`deferred`、`cancelled`。

## Current Focus

- `WI-morning-paper-home` — 首页晨报化设计已写入 `specs/morning-paper-home/design.md`，
  并通过结构校验；下一步由 `design-review` 评审，评审通过后进入 `spec-plan`。

## Work Items

| ID | Outcome | Priority | Status | Dependencies |
|----|---------|----------|--------|--------------|
| `WI-morning-paper-home` | 首页呈现晨报版面：细图标轨、无右栏、宽正文、日期刊头、媒体 emoji 入口 | Now | design-ready | None |
| `WI-post-detail-reading` | 点进帖子或线程时，阅读版面延续晨报风格，长线程层级清晰 | Now | candidate | `WI-morning-paper-home` |
| `WI-resilience-controls` | 可一键关闭主题；X 改版时核心功能不被破坏，滚动流畅 | Now | candidate | `WI-morning-paper-home` |
| `WI-focus-mode` | 可隐藏外围元素，只留正文列专注阅读 | Next | candidate | `WI-morning-paper-home` |
| `WI-other-pages` | 个人页、搜索、通知、书签等主要浏览页也呈现晨报视觉和版面 | Next | candidate | `WI-morning-paper-home` |
| `WI-keyboard-navigation` | 可以用键盘移动、打开、点赞、转发、回复 | Next | candidate | `WI-morning-paper-home` |
| `WI-night-paper` | 夜间可以使用深色纸感主题 | Next | candidate | `WI-morning-paper-home` |
| `WI-preferences` | 可调整媒体展示、正文密度、字体大小和部分开关 | Later | deferred | `WI-resilience-controls` |

### WI-morning-paper-home: 首页晨报化

- **Outcome**: 用户打开 X 首页时，看到以文字阅读为主体的晨报版面：左侧细图标轨、右栏消失、
  正文列更宽、日期刊头、媒体默认折叠为 emoji 入口；整体是冷白新闻纸、墨黑与松绿。
- **Scope**: 首页时间线（For you / Following）；全站浅色纸质基调；左栏窄轨与悬停展开；
  右栏移除；正文列宽与留白；日期刊头；卡片和分隔线降噪；推广帖、推荐关注和右栏内容隐藏；
  媒体 emoji 入口与就地展开；帖子操作栏轻量化。
- **Non-Goals**: 不改 X 的数据和交互逻辑；不做多栏杂志布局；不做页内设置面板；
  不完整重排个人页、搜索、通知、私信；不做深色纸感；不做自定义灯箱；
  帖子详情的线程版式留给 `WI-post-detail-reading`。
- **Success signal**: 1440px 宽屏下右栏消失、正文列成为主体、媒体默认折叠为 emoji 入口；
  用户连续使用 7 天仍保持开启；发帖、回复、转发、点赞、搜索、通知、私信入口正常。
- **Priority**: Now。
- **Status**: design-ready。
- **Dependencies**: None。
- **Readiness**: 设计已写入 `specs/morning-paper-home/design.md` 并通过结构校验；
  等待 `design-review`，评审通过后进入 `spec-plan`。
- **Spec**: `specs/morning-paper-home/design.md`。
- **Status evidence**: 2026-11-02 clarifying：现场 DOM 探针、CSS 布局验证、媒体 emoji 方案；
  设计结构校验通过。
- **External ref**: [Issue #1](https://github.com/venom-zen/x-morning-paper/issues/1)。

#### Open Questions

- 无遗留问题；媒体交互、字体栈、降级策略和布局参数已在设计文档中确定。

### WI-post-detail-reading: 帖子详情阅读版式

- **Outcome**: 用户点进帖子或线程时，阅读版面延续晨报风格：主帖和回复层级清晰，
  正文列适合长文阅读，媒体入口和展开方式与首页一致，不再跳回 X 原版三栏。
- **Scope**: 帖子详情页和线程页；主帖与回复的视觉层级；线程连接线；
  媒体入口和展开方式一致；操作栏轻量化；与首页共享视觉规则。
- **Non-Goals**: 不做完整文章阅读器；不做离线保存；不改回复、转发的功能逻辑；不覆盖私信。
- **Success signal**: 从首页点进帖子后风格连续；长线程阅读不累；返回首页不突兀；核心交互正常。
- **Priority**: Now。
- **Status**: candidate。
- **Dependencies**: `WI-morning-paper-home`。
- **Readiness**: 首页设计已确定主题和选择器策略；线程页 DOM 待验证。
- **Spec**: Not created。
- **Status evidence**: None。
- **External ref**: [Issue #2](https://github.com/venom-zen/x-morning-paper/issues/2)。

#### Open Questions

- 回复的缩进和连接线方式。
- 是否折叠低优先级回复。
- 主帖与回复的视觉区分用细线、底色还是排版层级。

### WI-resilience-controls: 轻量控制与容错

- **Outcome**: 用户可以随时通过 Tampermonkey 菜单关闭晨报主题；X 小改版或页面结构变化时，
  脚本不会破坏原生功能，滚动和加载无明显卡顿。
- **Scope**: 总开关；页面结构变化时的降级；滚动与加载性能；避免重复注入。
- **Non-Goals**: 不做自动更新；不做远程配置；不做错误上报；不做页内设置面板。
- **Success signal**: 一键恢复原版；X 改版后核心功能仍可用；连续滚动 5 分钟无明显掉帧；
  脚本不产生持续长任务。
- **Priority**: Now。
- **Status**: candidate。
- **Dependencies**: `WI-morning-paper-home`。
- **Readiness**: 首页设计已包含基础总开关和降级；本 work item 在其上验证更全面的容错与性能。
- **Spec**: Not created。
- **Status evidence**: None。
- **External ref**: [Issue #3](https://github.com/venom-zen/x-morning-paper/issues/3)。

#### Open Questions

- 是否需要版本更新提示。
- 选择器失效时是退回轻量主题还是完全停用布局改造。
- 性能预算的具体阈值。

### WI-focus-mode: 专注阅读模式

- **Outcome**: 用户可以一键隐藏图标轨和所有外围元素，只留正文列，适合长线程或沉浸阅读。
- **Scope**: 专注模式开关；隐藏左轨、顶部元素和无关装饰；保留退出入口；记住上次状态。
- **Non-Goals**: 不做离线阅读；不做阅读进度同步；不改时间线内容。
- **Success signal**: 开启后页面只剩正文列，退出后恢复原布局；长线程阅读更安静。
- **Priority**: Next。
- **Status**: candidate。
- **Dependencies**: `WI-morning-paper-home`。
- **Readiness**: 首页设计已完成；等待实现稳定后进入 clarifying。
- **Spec**: Not created。
- **Status evidence**: None。
- **External ref**: [Issue #4](https://github.com/venom-zen/x-morning-paper/issues/4)。

#### Open Questions

- 专注模式是全局开关还是单页状态。
- 是否自动在帖子详情页开启。

### WI-other-pages: 其他页面晨报化

- **Outcome**: 个人主页、搜索、通知、书签等主要浏览页也呈现晨报视觉和版面，
  不再出现明显风格断层。
- **Scope**: 个人主页、搜索、通知、书签；复用首页视觉规则；按页面调整版面。
- **Non-Goals**: 不覆盖私信、发帖框、设置页；不做这些页面的深度功能重排。
- **Success signal**: 在这些页面浏览时视觉连续；没有明显未样式化的 X 原版区块。
- **Priority**: Next。
- **Status**: candidate。
- **Dependencies**: `WI-morning-paper-home`。
- **Readiness**: 首页设计已完成；等待实现稳定并完成选择器抽象。
- **Spec**: Not created。
- **Status evidence**: None。
- **External ref**: [Issue #5](https://github.com/venom-zen/x-morning-paper/issues/5)。

#### Open Questions

- 哪些页面优先。
- 通知页的列表结构是否适合晨报版式。

### WI-keyboard-navigation: 键盘导航

- **Outcome**: 用户可以用键盘在时间线中移动、打开帖子、点赞、转发、回复，减少鼠标操作。
- **Scope**: 焦点移动、打开帖子、点赞、转发、回复等常用操作；焦点可视化。
- **Non-Goals**: 不做完整命令面板；不覆盖所有 X 快捷键；不改变 X 原生快捷键。
- **Success signal**: 常用操作可以不用鼠标完成；焦点状态清晰；不与 X 原生快捷键冲突。
- **Priority**: Next。
- **Status**: candidate。
- **Dependencies**: `WI-morning-paper-home`。
- **Readiness**: 首页设计已完成；等待实现稳定和焦点管理方案。
- **Spec**: Not created。
- **Status evidence**: None。
- **External ref**: [Issue #6](https://github.com/venom-zen/x-morning-paper/issues/6)。

#### Open Questions

- 快捷键集合。
- 与 X 原生快捷键的冲突处理。
- 是否需要可配置。

### WI-night-paper: 夜间纸色

- **Outcome**: 用户在夜间使用 X 时，可以选择深色纸感主题，避免浅色晨报刺眼。
- **Scope**: 深色纸底、暖白字、低饱和点缀；跟随 X 明暗或手动切换；保持晨报的排版和版面。
- **Non-Goals**: 不做多套主题市场；不做自动按时间切换。
- **Success signal**: 夜间阅读舒适；切换后布局不跳变；主题选择被记住。
- **Priority**: Next。
- **Status**: candidate。
- **Dependencies**: `WI-morning-paper-home`。
- **Readiness**: 首页设计已完成；等待浅色主题实现稳定。
- **Spec**: Not created。
- **Status evidence**: None。
- **External ref**: [Issue #7](https://github.com/venom-zen/x-morning-paper/issues/7)。

#### Open Questions

- 深色纸感是炭黑、墨绿还是深棕。
- 是否跟随 X 的明暗设置。

### WI-preferences: 更多配置

- **Outcome**: 用户可以根据阅读习惯调整媒体展示、正文密度、字体大小和部分开关，
  不必修改脚本代码。
- **Scope**: 设置入口；媒体展示方式、正文密度、字体大小、左右栏行为；本地保存。
- **Non-Goals**: 不做账号同步；不做主题编辑器；不做远程配置。
- **Success signal**: 常用参数可调；设置被记住；界面仍然简洁。
- **Priority**: Later。
- **Status**: deferred。
- **Dependencies**: `WI-resilience-controls`。
- **Readiness**: 需要先验证哪些参数值得暴露；当前不投入。
- **Spec**: Not created。
- **Status evidence**: None。
- **External ref**: [Issue #8](https://github.com/venom-zen/x-morning-paper/issues/8)。

#### Open Questions

- 设置入口放在哪里。
- 哪些参数真正需要调整。

## Dependency Notes

- `WI-post-detail-reading` 和 `WI-resilience-controls` 基于首页设计；首页设计已完成，
  可以进入 clarifying 或评审。
- `WI-focus-mode`、`WI-other-pages`、`WI-night-paper` 复用首页的版面规则；
  建议等首页实现稳定后再展开。
- `WI-preferences` 依赖 `WI-resilience-controls` 的开关和本地存储机制。

## Deferred / Cancelled

- 当前无取消项。`WI-preferences` 状态为 `deferred`，保留 ID，等 MVP 验证后再评估。
