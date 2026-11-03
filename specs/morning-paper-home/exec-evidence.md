# Execution Evidence

- **Execution baseline**: `b644da19222f422dc53dd192027b0fbb3e79fccf` (`b644da1`)。
  开始前工作树已有用户改动：`backlog.md`/`project.md` 重命名到 `projects/x-morning-paper/` 并带
  未提交修改，`projects/x-morning-paper/github-sync.json` 和 `specs/` 未跟踪。本次实现新增
  `x-morning-paper.user.js`、`README.md`、`docs/selectors.md`、`test/fixture.html` 和
  `screenshots/*.png`；没有覆盖或回退上述既有改动。
- **Input revisions**:
  - `specs/morning-paper-home/design.md` — `sha256:2bf3e04eb2ec2da9aa7828fa79bca5bcf47aac16bccce2f157c40e83ce3addf2`
  - `specs/morning-paper-home/tasks.md` — `sha256:ec3ae0441834ec0039519bc74b74c689b0eeb9a3181ff79428ca84aeff9f9792`
  - `specs/morning-paper-home/review.md` — `sha256:31faa29a15e5b182bc3c55a28445d5fa014a97610a8aad88b1c67b5d9fb42640`
  - `test/fixture.html` — `sha256:6f5a713b0a82cf8381818c2236bad3fa4ce850b3a2912e83f13771d88849b9b3`
  - `x-morning-paper.user.js` — `sha256:cf7a74b1e3fd1a8e80f445f20b7f86e2fa3511106c2d596c26618f737f90479a`
- **Validation environment**: Windows 10 Pro；Node v24.12.0；Playwright MCP Chromium（本地 fixture
  服务器 `127.0.0.1:8765`）；真实 X 通过用户 Chrome 135.0.7049.42 的
  `--remote-debugging-port=9222` 和便携 profile `D:\Software\RunningCheeseChrome\Data` 检查；
  真实 X 页面 `https://x.com/home`，1920×953，X 深色设置；Tampermonkey 脚本已安装。
- **Manifest command**: `node C:\Users\wenlong.chen\.claude\skills\code-review\scripts\review-manifest.mjs --exclude specs/morning-paper-home/code-review.md --exclude specs/morning-paper-home/exec-evidence.md`
- **Diff fingerprint**: `sha256:84304feacdf54676df3d4565c3e164687bcf75c4191c3dcd22b6a1dbf3c465f9`
- **Validation**:
  - `node --check x-morning-paper.user.js`: passed。
  - 本地 fixture（Playwright）：1920 primary 760px/x=616.5；1440 primary 720px/x=396.5；
    999px 原生；1000px primary 680px；左轨 hover/focus 240px 且正文不移动；媒体按钮
    单图/4 图/视频/混合/引用帖/轮播；4 图展开保持 grid；70vh 630/420px；内部滚动；
    操作栏可达；嵌套引用帖和链接卡片不标注；Enter/焦点环；home/status/search 路由；
    存储失败关闭/开启；layout/primary 降级；空时间线刊头；主题表面和 reduced motion；
    passed。fixture 新增 `ScrollSnap-List` 轮播，按钮显示“🖼️ 图片 · 2 张”，展开为
    display:flex、max-height:630px、overflow-y:auto。
  - 真实 X（2026-11-03，远程调试）：发现与设计探针不同的结构。主列 primary 760px 但 x=88；
    `main` 是 1817px column，主内容容器 1050px，primary 的父链有 row；只写
    `main > div { justify-content }` 不会水平居中。首页 tab 栏是主内容容器第一个子元素，
    发帖框是第三个子元素；两者仍是 X 深色。第一条帖子有 5 张图的
    `ScrollSnap-List` 轮播，旧算法因公共祖先含 `tweetText` 而不折叠，只有 2 个媒体按钮。
  - 真实 X hotfix（注入当前页面验证，非最终脚本）：primary x=617、tab bar 背景
    `rgb(251,250,247)`、composer 背景纸色、发帖按钮 `rgb(47,93,80)`；截图
    `screenshots/real-x-hotfix2.png`。hotfix 使用临时 content 级 `data-xmp-tabbar`，
    把首条图片容器也置为透明，截图里首条图片空白；该临时标记已从页面移除。
    最终脚本只标记 tab 栏第一子元素和 composer 包装层，不会影响帖子图片。
  - **未验证**：真实 X 的 Tampermonkey 脚本仍是旧版本；任务 1.4、2.5、3.3、4.8、5.3、
    6.4、7.1、7.2、7.3、7.4 仍需在更新脚本后手动执行。Final gate 尚未完全通过。
- **Implementation notes**:
  - 顶层帖子判断使用 `!tweet.parentElement.closest('[data-testid="tweet"]')`，修复
    `design.md`/`tasks.md` 中 `closest(...) === tweet` 对嵌套引用帖也成立的问题，满足
    `AC-media-nested-count`、`AC-media-nested-hidden` 和 Scope Decisions。
  - 媒体块已有 id 时复用，否则生成 `xmp-media-block-<n>`；`aria-controls` 指向实际媒体块。
  - 多图 `ScrollSnap-List` 轮播优先作为媒体块，即使不 `contains` 其他轮播页；计数仍按
    帖子内收集到的媒体数。
  - 真实 X 的 tab 栏/composer 需要运行时标记 `data-xmp-tabbar`/`data-xmp-composer` 并覆盖
    子 div/nav 背景；这些标记记录在 `docs/selectors.md`。
  - 真实 X 与 `design.md` 的 2026-11-02 探针存在结构差异；设计文档的 Context、
    media block 算法和 ThemeLayer 描述应在下一次 design-refine 中同步。
- **Next**: 在 Tampermonkey 中用最新 `x-morning-paper.user.js` 覆盖旧脚本，保存并刷新
  `x.com/home`；确认 primary 居中、tab 栏/发帖框纸色、首条 5 图显示“🖼️ 图片 · 5 张”。
  完成 10 个真实 X Checkpoint 后替换 `screenshots/`，再运行 `code-review`。
