# X 晨报首页 Design Review

> 对 `specs/morning-paper-home/design.md` 的设计评审。Verdict 是评审时快照；当前流程状态见 Current Readiness。

## Verdict

- **Review round**: R4
- **Review mode**: Closure
- **Mode reason**: Current Readiness 为 `ready-for-closure`，`Refine validation` 为 Passed，
  `Next review mode` 为 Closure；实际 changed sections 与 R3-refine-1 的影响矩阵一致，
  执行 Closure Review。refine 预判值：Closure，一致。
- **Overall at review**: Pass
- **spec-plan readiness at review**: Go
- **Findings**: 0 Blocker / 0 Major / 0 Minor
- **Summary**: F-001 到 F-008 的冻结 Closure test 全部通过；F-007 的空/加载状态冲突已消除，
  没有新的 refinement regression。设计可以进入 `spec-plan`。

## Scope Reviewed

- **Reviewed file**: `specs/morning-paper-home/design.md`
- **Project baseline**: commit `b644da1`；工作树含未提交的 `project.md`/`backlog.md` 移动和
  `github-sync.json`，`design.md`/`review.md` 在 `specs/` 下未提交。仓库是 greenfield userscript，
  没有既有实现代码；X 选择器事实以设计记录的 2026-11-02 现场探针为准。
- **Project context consulted**: `projects/x-morning-paper/project.md`、
  `projects/x-morning-paper/backlog.md`、`projects/x-morning-paper/github-sync.json`、
  git 历史和状态、`check-design-doc.mjs`、`find-identifiers.mjs`、`check-markdown-lines.mjs`。
- **Changed sections**: R3-refine-1 的 changed sections：§DR-control-fallback、
  §Components/SelectorHealth、§Key Mechanisms/路由与选择器健康、§Error Handling、
  §AC-resilience-timeline、§Testing、§Open Questions。
- **Acceptance Criteria checked**: 46 条 AC；本轮复核 F-007 的空/加载状态、刊头保留、观察器等待和
  `AC-resilience-timeline` 的新条件。Project Traceability 的 Project、Backlog 和
  `WI-morning-paper-home` 可解析。
- **Numeric re-check**: 沿用 R1 的复算：1920px 布局 x=616.5、999/1000px 断点、70vh 边界和
  对比度均与判定式一致；R3-refine-1 未改变这些判定式。
- **Canonical contract**: `clarifying/assets/design-doc-template.md`
- **Rubric**: D1-D7

## Findings

本轮无新 finding；F-007 已闭合，见 Closure。

## Dimension Summary

| Dimension | Status | Finding refs |
|-----------|--------|--------------|
| D1 Completeness | OK | None |
| D2 Usability | OK | None |
| D3 Conformance | OK | None |
| D4 Project Fit | OK | None |
| D5 Blind Spots | OK | None |
| D6 Over-Engineering | OK | None |
| D7 Optimization | OK | None |

## Current Readiness

- **Review round**: R4
- **Refine run**: R3-refine-1
- **Overall**: ready
- **spec-plan readiness**: Go
- **Next step**: 进入 `spec-plan`。
- **Refine validation**: Not run
- **Change class**: None
- **Next review mode**: Not determined
- **Mode trigger**: None
- **Loop pressure**: None
- **Impact matrix**: None
- **Changed identifiers**: None

无活动 finding；历史结果见 Closure。

## Closure

| Finding | Title | Result | Resolution ref | Summary |
|---------|-------|--------|----------------|---------|
| F-001 | 媒体视口限定 | closed | DR-media-emoji-toggle / AC-media-trigger | 999/1000px 契约一致。 |
| F-002 | 多图网格 display | closed | 展开与收起 / AC-media-expand-layout | 展开恢复原 display。 |
| F-003 | 媒体按钮配对 | closed | 媒体块识别 / 观察器 | 唯一 id 与配对校验。 |
| F-004 | 存储回退 | closed | DR-control-fallback / AC-control-storage-fallback | 存储失败当前页关闭/重开。 |
| F-005 | 帖子详情 shell | closed | AC-layout-* / AC-route-status | 详情页 rail/列宽/居中 AC。 |
| F-006 | 操作栏与冒烟 | closed | Scope Decisions / AC-theme-actions | 操作栏规则与核心冒烟。 |
| F-007 | 时间线根选择器 | closed | SelectorHealth / AC-resilience-timeline | 时间线根已定义；空/加载状态保留刊头/观察器，AC 冲突已消除。 |
| F-008 | 其他页面主题表面 | closed | DR-route-scope / AC-theme-other-pages | 右栏/搜索/趋势主题面。 |

## Observations

- `AC-media-count` 只覆盖图片和视频，没有覆盖设计已定义的混合媒体按钮“媒体 · N 项”；
  这是 R1 Full Review 的 `baseline-miss` 候选，满足下一次 Full Review 的漏检条件；
  建议提前触发：否，可在 `spec-plan` 补一条 AC 或作为实现细节处理。
- `§Scope Decisions`（第 88–90 行）仍写“设计完成后由 `brainstorming` 同步项目文档”，
  但当前 `projects/x-morning-paper/project.md` 的 `PDR-media-presentation` 已采用 emoji 入口；
  这是项目文档在上一轮后的 `context-change` 候选，不改变设计行为；
  建议提前触发：否，下一次编辑时清理措辞。
- `AC-layout-masthead`（第 412–414 行）没有视口条件，而 `AC-layout-breakpoint`（第 415–416 行）
  和 Scope Decision 规定 <1000px 只保留浅色主题；两者在 <1000px 的刊头行为上冲突。
  这是 R1 Full Review 的 `baseline-miss` 候选，满足下一次 Full Review 的漏检条件；
  建议提前触发：否，可在 `spec-plan` 按 Scope Decision 把刊头限定为 ≥1000px，
  或明确 <1000px 仍显示。

## Recommended Next Step

进入 `spec-plan`。Observations 中的三项留待下一次 Full Review 或 `spec-plan` 处理。
