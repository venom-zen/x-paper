// ==UserScript==
// @name         x-paper
// @namespace    x-paper
// @version      0.5.1
// @description  A quiet paper layout for X: icon rail, wide reading column, emoji media controls
// @author       venom
// @license      MIT
// @match        https://x.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const ENABLED_KEY = 'xmp-enabled';
  const MIN_LAYOUT_WIDTH = 1000;
  const PRIMARY = '[data-testid="primaryColumn"]';
  const CELL = '[data-testid="cellInnerDiv"]';
  const TWEET = '[data-testid="tweet"]';
  const MEDIA_SELECTOR = '[data-testid="tweetPhoto"], [data-testid="previewInterstitial"]';
  const STYLE_IDS = ['xmp-preflight', 'xmp-theme', 'xmp-layout', 'xmp-noise', 'xmp-media', 'xmp-preview'];
  const NAV_TOGGLE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.3 4.6 4.9 6l5.65 5.65L4.9 17.3l1.4 1.4 6.35-6.35a1 1 0 0 0 0-1.4L6.3 4.6Zm8 0L12.9 6l5.65 5.65-5.65 5.65 1.4 1.4 6.35-6.35a1 1 0 0 0 0-1.4L14.3 4.6Z"/></svg>';

  const PREFLIGHT_CSS = `
    html {
      background-color: #FBFAF7 !important;
      color-scheme: light !important;
    }
  `;

  const THEME_CSS = `
    html[data-xmp-enabled="1"] {
      --xmp-paper: #FBFAF7;
      --xmp-paper-raised: #F4F1E8;
      --xmp-ink: #1B1B1B;
      --xmp-ink-secondary: #5C5A52;
      --xmp-hairline: #D8D4C8;
      --xmp-rule: #E6E1D5;
      --xmp-pine: #2F5D50;
      --xmp-pine-deep: #264C42;
      --xmp-pine-soft: #E6ECE7;
      --xmp-like: #A8442E;
      --xmp-ui-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      background-color: var(--xmp-paper) !important;
      color-scheme: light !important;
      color: var(--xmp-ink) !important;
      caret-color: var(--xmp-pine);
      scrollbar-color: #C9C4B6 var(--xmp-paper);
      scrollbar-width: thin;
    }

    html[data-xmp-enabled="1"] ::selection {
      background: var(--xmp-pine-soft);
      color: var(--xmp-ink);
    }

    html[data-xmp-enabled="1"] body {
      background-color: var(--xmp-paper) !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.025'/%3E%3C/svg%3E");
      background-repeat: repeat;
      color: var(--xmp-ink) !important;
      font-family: var(--xmp-ui-font) !important;
    }

    html[data-xmp-enabled="1"] main,
    html[data-xmp-enabled="1"] header[role="banner"],
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"],
    html[data-xmp-enabled="1"] [data-testid="sidebarColumn"] {
      background-color: var(--xmp-paper) !important;
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] {
      border-left: 0 !important;
      border-right: 0 !important;
    }

    html[data-xmp-enabled="1"] [data-testid^="UserAvatar-Container"] div,
    html[data-xmp-enabled="1"] [data-testid^="UserAvatar-Container"] img,
    html[data-xmp-enabled="1"] [data-testid="Tweet-User-Avatar"] div,
    html[data-xmp-enabled="1"] [data-testid="Tweet-User-Avatar"] img {
      background-color: transparent !important;
      box-shadow: none !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweetText"],
    html[data-xmp-enabled="1"] [data-testid="tweetText"] *,
    html[data-xmp-enabled="1"] [data-testid="tweetTextarea_0"],
    html[data-xmp-enabled="1"] [data-testid="tweetTextarea_0"] * {
      color: var(--xmp-ink) !important;
      font-family: var(--xmp-ui-font) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweetText"] {
      font-size: 16px !important;
      line-height: 1.65 !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweetText"] a {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweet"] [style*="color: rgb(29, 155, 240)"] {
      color: var(--xmp-pine) !important;
    }

    /* X 把查看数、标题等文字写成内联浅色（深色主题的 --xmpColorlessText），纸面上必须换成墨色 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [style*="color: rgb(231, 233, 234)"] {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweetTextarea_0"] {
      background-color: transparent !important;
    }

    html[data-xmp-enabled="1"] [data-testid="User-Name"] {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="User-Name"] [dir="ltr"],
    html[data-xmp-enabled="1"] time {
      color: var(--xmp-ink-secondary) !important;
      font-size: 13px !important;
      line-height: 1.4 !important;
    }

    html[data-xmp-enabled="1"] [role="tab"] {
      color: var(--xmp-ink-secondary) !important;
      font-size: 15px !important;
      line-height: 1.4 !important;
      font-weight: 500 !important;
    }

    html[data-xmp-enabled="1"] [role="tab"][aria-selected="true"],
    html[data-xmp-enabled="1"] [role="tab"][aria-selected="true"] * {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] {
      color: var(--xmp-ink-secondary) !important;
      padding-bottom: 8px !important;
    }

    html[data-xmp-enabled="1"] [role="group"] svg {
      width: 16px !important;
      height: 16px !important;
      color: var(--xmp-ink-secondary) !important;
      fill: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] span {
      font-size: 13px !important;
      color: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] button:hover svg,
    html[data-xmp-enabled="1"] [role="group"] a:hover svg {
      color: var(--xmp-pine) !important;
      fill: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] button:hover span {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="like"][aria-pressed="true"] svg {
      color: var(--xmp-like) !important;
      fill: var(--xmp-like) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] [data-testid="retweet"][aria-pressed="true"] svg,
    html[data-xmp-enabled="1"] [role="group"] [data-testid="bookmark"][aria-pressed="true"] svg {
      color: var(--xmp-pine) !important;
      fill: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] [data-testid="like"][aria-pressed="true"] span {
      color: var(--xmp-like) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] [data-testid="retweet"][aria-pressed="true"] span,
    html[data-xmp-enabled="1"] [role="group"] [data-testid="bookmark"][aria-pressed="true"] span {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="SearchBox_Search_Input"] {
      background-color: var(--xmp-paper-raised) !important;
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="trend"],
    html[data-xmp-enabled="1"] [data-testid="trend"] *,
    html[data-xmp-enabled="1"] [data-testid="UserCell"],
    html[data-xmp-enabled="1"] [data-testid="UserCell"] * {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] header[role="banner"] svg {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] header nav a > div:first-child > div[dir="ltr"],
    html[data-xmp-enabled="1"] header nav a > div:first-child > div[dir="ltr"] *,
    html[data-xmp-enabled="1"] header nav button > div:first-child > div[dir="ltr"],
    html[data-xmp-enabled="1"] header nav button > div:first-child > div[dir="ltr"] * {
      color: var(--xmp-ink) !important;
    }

    [data-xmp-tabbar] {
      background-color: var(--xmp-paper) !important;
      background-image: none !important;
      border-bottom: 1px solid var(--xmp-hairline) !important;
      backdrop-filter: none !important;
    }

    [data-xmp-tabbar] div,
    [data-xmp-tabbar] nav {
      background-color: transparent !important;
      backdrop-filter: none !important;
      border-bottom-color: transparent !important;
    }

    [data-xmp-tabbar] div:not([style*="background-image"]),
    [data-xmp-tabbar] nav {
      background-image: none !important;
    }

    [data-xmp-tabbar] [role="tab"] {
      background-color: var(--xmp-paper) !important;
    }

    [data-xmp-tabbar] [role="tab"][aria-selected="true"] {
      border-bottom-color: var(--xmp-pine) !important;
    }

    [data-xmp-tabbar] [role="tab"][aria-selected="true"] div[style*="background-color"] {
      background-color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] button {
      background-color: var(--xmp-paper-raised) !important;
      color: var(--xmp-ink) !important;
      border: 1px solid var(--xmp-hairline) !important;
      box-shadow: 0 2px 8px rgba(27, 27, 27, 0.08);
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      width: auto !important;
      min-width: 0 !important;
      max-width: 100% !important;
      gap: 6px !important;
      justify-content: center !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] [data-testid="userAvatars"] [data-testid^="UserAvatar-Container"] {
      border-radius: 9999px !important;
      box-shadow: inset 0 0 0 1px var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] button * {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] button > div {
      gap: 6px !important;
      justify-content: center !important;
    }

    [data-xmp-composer] {
      background-color: var(--xmp-paper) !important;
      background-image: none !important;
      border-bottom: 1px solid var(--xmp-hairline) !important;
      color: var(--xmp-ink) !important;
    }

    [data-xmp-composer] div {
      background-color: transparent !important;
    }

    [data-xmp-composer] div:not([style*="background-image"]) {
      background-image: none !important;
    }

    [data-xmp-composer] .DraftEditor-root,
    [data-xmp-composer] .DraftEditor-editorContainer {
      color: var(--xmp-ink) !important;
    }

    [data-xmp-composer] [data-testid="tweetTextarea_0"] {
      background-color: transparent !important;
      color: var(--xmp-ink) !important;
    }

    [data-xmp-composer] [data-testid="tweetTextarea_0_label"] * {
      color: var(--xmp-ink-secondary) !important;
    }

    [data-xmp-composer] button:has(span) span,
    [data-xmp-composer] button:has(span) svg {
      color: var(--xmp-pine) !important;
      fill: var(--xmp-pine) !important;
    }

    [data-xmp-composer] [data-testid="toolBar"] {
      background-color: transparent !important;
      color: var(--xmp-ink-secondary) !important;
    }

    [data-xmp-composer] [data-testid="toolBar"] svg {
      color: var(--xmp-ink-secondary) !important;
      fill: var(--xmp-ink-secondary) !important;
    }

    [data-xmp-composer] [data-testid="tweetButtonInline"] {
      background-color: var(--xmp-pine) !important;
      border-color: var(--xmp-pine) !important;
      color: var(--xmp-paper) !important;
    }

    [data-xmp-composer] [data-testid="tweetButtonInline"] span {
      color: var(--xmp-paper) !important;
    }

    [data-xmp-composer] [data-testid="tweetButtonInline"]:disabled {
      background-color: var(--xmp-paper-raised) !important;
      color: var(--xmp-ink-secondary) !important;
      opacity: 1 !important;
    }

    [data-xmp-composer] [data-testid="tweetButtonInline"]:disabled span {
      color: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] header nav div[aria-label] {
      background-color: var(--xmp-pine) !important;
      color: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="icon-verified"] {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="icon-verified"] path {
      fill: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"]:not(:has([data-testid="tweet"])) [role="button"]:not([data-testid$="-follow"], [data-testid$="-unfollow"]):not(:has([data-testid$="-follow"], [data-testid$="-unfollow"])) span {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="card.wrapper"],
    html[data-xmp-enabled="1"] [data-testid="card.layoutSmall.media"],
    html[data-xmp-enabled="1"] [data-testid="card.layoutLarge.media"] {
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="card.wrapper"],
    html[data-xmp-enabled="1"] [data-testid="card.wrapper"] * {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="card.wrapper"] a {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="twitter-article-title"],
    html[data-xmp-enabled="1"] [data-testid="twitter-article-title"] *,
    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"],
    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"] *,
    html[data-xmp-enabled="1"] [data-testid="twitterArticleRichTextView"],
    html[data-xmp-enabled="1"] [data-testid="twitterArticleRichTextView"] *,
    html[data-xmp-enabled="1"] [data-testid="longformRichTextComponent"],
    html[data-xmp-enabled="1"] [data-testid="longformRichTextComponent"] * {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"] a,
    html[data-xmp-enabled="1"] [data-testid="twitterArticleRichTextView"] a,
    html[data-xmp-enabled="1"] [data-testid="longformRichTextComponent"] a {
      color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweet"] div:has(> [data-testid="article-cover-image"]) {
      border-color: transparent !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweet"] div:has(> [data-testid="article-cover-image"]) > div:last-child,
    html[data-xmp-enabled="1"] [data-testid="tweet"] div:has(> [data-testid="article-cover-image"]) > div:last-child * {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div[role="link"]:has([data-testid="User-Name"]):has([data-testid="tweetText"]) {
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="GrokDrawerHeader"],
    html[data-xmp-enabled="1"] [data-testid="chat-drawer-main"] {
      background-color: var(--xmp-paper-raised) !important;
      border: 1px solid var(--xmp-hairline) !important;
      color: var(--xmp-ink) !important;
      backdrop-filter: none !important;
      box-shadow: 0 2px 8px rgba(27, 27, 27, 0.08);
    }

    html[data-xmp-enabled="1"] [data-testid="GrokDrawerHeader"] svg,
    html[data-xmp-enabled="1"] [data-testid="chat-drawer-main"] svg {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"] > div {
      border-bottom-color: var(--xmp-rule) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"] [data-testid="Tweet-User-Avatar"] ~ div:last-child:not([data-testid="User-Name"], [data-testid="tweetText"]):not(:has([data-testid="User-Name"], [data-testid="tweetText"])) {
      background-color: var(--xmp-rule) !important;
      border-radius: 1px !important;
    }

    /* Thread tail: the reply row paints a short connector above its avatar, in
       the row that precedes the avatar row. It is not a sibling of the avatar,
       so the rule above cannot reach it and X's dark stub would show. */
    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"] div:has(+ div > div > [data-testid="Tweet-User-Avatar"]) > * > * > div:only-child {
      background-color: var(--xmp-rule) !important;
      border-radius: 1px !important;
    }

    [data-xmp-divider] {
      background-color: transparent !important;
    }

    html[data-xmp-enabled="1"] [data-testid="toast"] {
      background-color: var(--xmp-paper-raised) !important;
      color: var(--xmp-ink) !important;
      border: 1px solid var(--xmp-hairline) !important;
      box-shadow: 0 2px 8px rgba(27, 27, 27, 0.08) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="toast"] * {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="toast"] svg {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="toast"] a {
      color: var(--xmp-pine) !important;
    }

    /* 个人主页的操作按钮：关注用松绿实心，正在关注 / 私信 / 更多用纸面浮起 + 细线，
       悬停取消关注时用暖红提示 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-follow"] {
      background-color: var(--xmp-pine) !important;
      border-color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-follow"] :is(span, div, svg) {
      color: var(--xmp-paper) !important;
      fill: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-follow"]:hover {
      background-color: var(--xmp-pine-deep) !important;
      border-color: var(--xmp-pine-deep) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-unfollow"] {
      background-color: var(--xmp-paper-raised) !important;
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-unfollow"] :is(span, div, svg) {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-unfollow"]:hover {
      background-color: var(--xmp-paper) !important;
      border-color: var(--xmp-like) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-unfollow"]:hover * {
      color: var(--xmp-like) !important;
      fill: var(--xmp-like) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([data-testid="sendDMFromProfile"], [data-testid="userActions"], [data-testid="editProfileButton"]) {
      background-color: var(--xmp-paper-raised) !important;
      border-color: var(--xmp-hairline) !important;
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([data-testid="sendDMFromProfile"], [data-testid="userActions"], [data-testid="editProfileButton"]) * {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([data-testid="sendDMFromProfile"], [data-testid="userActions"], [data-testid="editProfileButton"]):hover {
      border-color: var(--xmp-pine) !important;
    }

    /* 详情页/文章页顶部条：X 用半透明黑 + blur，纸面下换成纸色 + 细线。
       结构选择器让它一出现就是纸色；data-xmp-appbar 是结构变化时的运行时兜底。 */
    html[data-xmp-enabled="1"] [data-xmp-appbar],
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > div > [data-testid="app-bar-back"]) {
      background-color: var(--xmp-paper) !important;
      backdrop-filter: none !important;
      box-shadow: inset 0 -1px 0 var(--xmp-hairline);
    }

    html[data-xmp-enabled="1"] [data-xmp-appbar] :is(span, svg),
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > div > [data-testid="app-bar-back"]) :is(span, svg) {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    /* 详情页/文章页的回复框：黑底在 inline_reply_offscreen 的子里；按 testid 直接覆盖，
       节点渲染出来就是纸色，不用等 JS 标记，避免进入详情页时闪一下黑色。 */
    html[data-xmp-enabled="1"] [data-testid="inline_reply_offscreen"] {
      background-color: var(--xmp-paper) !important;
      border-bottom: 1px solid var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="inline_reply_offscreen"] div {
      background-color: transparent !important;
    }

    html[data-xmp-enabled="1"] [data-testid="inline_reply_offscreen"] div:not([style*="background-image"]) {
      background-image: none !important;
    }

    html[data-xmp-enabled="1"] [data-testid="inline_reply_offscreen"] [data-testid="tweetButtonInline"] {
      background-color: var(--xmp-pine) !important;
      border-color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="inline_reply_offscreen"] [data-testid="tweetButtonInline"] span {
      color: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="inline_reply_offscreen"] [data-testid="tweetButtonInline"]:disabled {
      background-color: var(--xmp-paper-raised) !important;
      border-color: var(--xmp-hairline) !important;
      opacity: 1 !important;
    }

    html[data-xmp-enabled="1"] [data-testid="inline_reply_offscreen"] [data-testid="tweetButtonInline"]:disabled span {
      color: var(--xmp-ink-secondary) !important;
    }

    /* 弹窗（Premium、认证、回复框、图片查看器等）保留 X 的深色外观：
       纸面墨色在深色底上不可读，统一恢复成 X 的浅色文字 */
    html[data-xmp-enabled="1"] [role="dialog"] {
      color: rgb(231, 233, 234) !important;
    }

    html[data-xmp-enabled="1"] [role="dialog"] :is(span, div, p, h1, h2, h3, h4, time) {
      color: rgb(231, 233, 234) !important;
    }

    html[data-xmp-enabled="1"] [role="dialog"] svg {
      color: rgb(231, 233, 234) !important;
      fill: rgb(231, 233, 234) !important;
    }

    /* 文章内嵌的引用帖：X 用纯黑底 + 深灰边，墨色文字在其上几乎不可读 */
    html[data-xmp-enabled="1"] [data-testid="simpleTweet"] {
      background-color: var(--xmp-paper-raised) !important;
      border-color: var(--xmp-hairline) !important;
    }

    /* 文章代码块：换成纸面终端块，浅底深字；语法色统一为墨色 */
    html[data-xmp-enabled="1"] [data-testid="markdown-code-block"] {
      border: 1px solid var(--xmp-hairline) !important;
      border-radius: 8px !important;
      overflow: hidden;
    }

    html[data-xmp-enabled="1"] [data-testid="markdown-code-block"] > div:first-child {
      background-color: var(--xmp-rule) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="markdown-code-block"] pre {
      background-color: var(--xmp-paper-raised) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="markdown-code-block"] :is(div, span, pre, code, svg) {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    /* 文章末尾的升级横幅 */
    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"] [role="status"] {
      background-color: var(--xmp-paper-raised) !important;
      border: 1px solid var(--xmp-hairline) !important;
    }

    /* 文章阅读进度条 */
    html[data-xmp-enabled="1"] [data-testid="progressBar-bar"] {
      background-color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-tabbar] [data-testid="ScrollSnap-prevButtonWrapper"] button,
    html[data-xmp-enabled="1"] [data-xmp-tabbar] [data-testid="ScrollSnap-nextButtonWrapper"] button,
    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="ScrollSnap-prevButtonWrapper"] button,
    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="ScrollSnap-nextButtonWrapper"] button {
      background-color: var(--xmp-paper-raised) !important;
      border: 1px solid var(--xmp-hairline) !important;
      color: var(--xmp-ink) !important;
      backdrop-filter: none !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-tabbar] [data-testid="ScrollSnap-prevButtonWrapper"] svg,
    html[data-xmp-enabled="1"] [data-xmp-tabbar] [data-testid="ScrollSnap-nextButtonWrapper"] svg,
    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="ScrollSnap-prevButtonWrapper"] svg,
    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="ScrollSnap-nextButtonWrapper"] svg {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="toolBar"] button:hover,
    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="toolBar"] button:focus-visible {
      background-color: var(--xmp-pine-soft) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-composer] button:has(span):not([data-testid="tweetButtonInline"]):hover {
      background-color: var(--xmp-pine-soft) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="tweetButtonInline"]:not(:disabled):hover {
      background-color: var(--xmp-pine-deep) !important;
      border-color: var(--xmp-pine-deep) !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] button:hover {
      background-color: var(--xmp-pine-soft) !important;
      border-color: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] button:hover * {
      color: var(--xmp-pine) !important;
      fill: var(--xmp-pine) !important;
    }

    html[data-xmp-enabled="1"] :is(main, header[role="banner"]) :is(a, button, [role="button"], [role="tab"], [role="link"]):focus-visible {
      outline: 2px solid var(--xmp-pine) !important;
      outline-offset: 2px;
    }

    @media (prefers-reduced-motion: reduce) {
      html[data-xmp-enabled="1"] header nav,
      html[data-xmp-enabled="1"] .xmp-media-toggle {
        transition: none !important;
      }
    }
  `;

  const LAYOUT_CSS = `
    @media (max-width: 999px) {
      .xmp-nav-toggle {
        display: none !important;
      }
    }

    @media (min-width: 1000px) {
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header[role="banner"] {
        width: 88px !important;
        min-width: 88px !important;
        flex: 0 0 88px !important;
        background: var(--xmp-paper) !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav {
        position: fixed !important;
        left: 0 !important;
        top: var(--xmp-nav-top, 0px) !important;
        width: 88px !important;
        height: calc(100vh - var(--xmp-nav-top, 0px)) !important;
        padding: 6px 8px 16px !important;
        box-sizing: border-box !important;
        gap: 2px !important;
        overflow: hidden !important;
        background: var(--xmp-paper) !important;
        z-index: 1000 !important;
        transition: width 160ms ease, box-shadow 160ms ease;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a span,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button span {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button > div:first-child > div[dir="ltr"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button {
        justify-content: center !important;
        align-items: center !important;
        flex: 0 0 auto !important;
        height: auto !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button > div:first-child {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a:focus-visible > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button:focus-visible > div:first-child {
        background-color: var(--xmp-pine-soft) !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav {
        width: 240px !important;
        box-shadow: 4px 0 16px rgba(27, 27, 27, 0.12);
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a span,
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button span {
        display: inline !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button > div:first-child > div[dir="ltr"] {
        display: block !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav a,
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header nav button {
        justify-content: flex-start !important;
        align-items: flex-start !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header[role="banner"] [data-testid="SideNav_NewTweet_Button"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="sidebarColumn"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) main {
        align-items: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) main > div {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) main > div > div > div {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="primaryColumn"] {
        width: 760px !important;
        max-width: 760px !important;
        flex: 0 0 760px !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-xmp-inner-timeline] {
        width: 100% !important;
        max-width: 100% !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="cellInnerDiv"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="tweetText"] {
        max-width: 100% !important;
      }

      @media (max-width: 1599px) and (min-width: 1280px) {
        html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="primaryColumn"] {
          width: 720px !important;
          max-width: 720px !important;
          flex: 0 0 720px !important;
        }
      }

      @media (max-width: 1279px) and (min-width: 1000px) {
        html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="primaryColumn"] {
          width: 680px !important;
          max-width: 680px !important;
          flex: 0 0 680px !important;
        }
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-xmp-rail-panel] {
        left: 0 !important;
        right: auto !important;
        width: 88px !important;
        min-width: 88px !important;
        max-width: 88px !important;
        z-index: 1000 !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-xmp-rail-panel] {
        width: 240px !important;
        min-width: 240px !important;
        max-width: 240px !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="SideNav_AccountSwitcher_Button"] {
        width: 72px !important;
        min-width: 0 !important;
        padding: 6px !important;
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="SideNav_AccountSwitcher_Button"] {
        width: 224px !important;
        padding: 12px !important;
        justify-content: flex-start !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="SideNav_AccountSwitcher_Button"] > div:last-child {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):not([data-xmp-nav-expanded="1"]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) [data-testid="SideNav_AccountSwitcher_Button"] > div:not(:first-child) {
        display: none !important;
      }

      .xmp-nav-toggle {
        display: none;
        position: fixed;
        left: 8px;
        top: var(--xmp-toggle-top, 680px);
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 72px;
        height: 34px;
        padding: 0;
        font: inherit;
        font-family: var(--xmp-ui-font);
        font-size: 15px;
        line-height: 1.4;
        color: var(--xmp-ink);
        background-color: transparent;
        border: 0;
        border-radius: 9999px;
        cursor: pointer;
        z-index: 1001;
        transition: width 160ms ease, background-color 160ms ease, color 160ms ease;
      }

      .xmp-nav-toggle svg {
        width: 20px;
        height: 20px;
        flex: 0 0 auto;
        fill: currentColor;
        transition: transform 160ms ease;
      }

      .xmp-nav-toggle span {
        display: none;
        white-space: nowrap;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) .xmp-nav-toggle {
        display: inline-flex;
      }

      html[data-xmp-nav-expanded="1"] .xmp-nav-toggle {
        width: 224px;
        justify-content: flex-start;
        padding: 0 12px;
      }

      html[data-xmp-nav-expanded="1"] .xmp-nav-toggle svg {
        transform: rotate(180deg);
      }

      html[data-xmp-nav-expanded="1"] .xmp-nav-toggle span {
        display: inline;
      }

      html[data-xmp-enabled="1"]:has([data-testid="hoverCardParent"]) .xmp-nav-toggle {
        visibility: hidden;
      }

      .xmp-nav-toggle:hover {
        color: var(--xmp-pine);
        background-color: var(--xmp-pine-soft);
      }

      .xmp-nav-toggle:focus-visible {
        color: var(--xmp-pine);
        background-color: var(--xmp-pine-soft);
        outline: 2px solid var(--xmp-pine);
        outline-offset: 2px;
      }
    }
  `;

  const NOISE_CSS = `
    html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) [data-testid="cellInnerDiv"]:has([data-testid="placementTracking"]),
    html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="cellInnerDiv"]:has([data-testid="UserCell"]) {
      display: none !important;
    }
  `;

  const MEDIA_CSS = `
    html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="profile"]) [data-xmp-media-state="collapsed"] [data-xmp-media-block] {
      display: none !important;
    }

    html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="profile"]) [data-xmp-media-state="expanded"] [data-xmp-media-block] {
      max-height: 70vh !important;
      overflow-y: auto !important;
      overscroll-behavior: contain;
      scrollbar-color: #C9C4B6 transparent;
    }

    html[data-xmp-enabled="1"] .xmp-media-toggle {
      display: inline-flex;
      align-self: flex-start;
      align-items: center;
      gap: 6px;
      max-width: 100%;
      margin: 8px 0 4px;
      padding: 5px 9px;
      font: inherit;
      font-family: var(--xmp-ui-font);
      font-size: 13px;
      line-height: 1.4;
      letter-spacing: 0.01em;
      color: var(--xmp-ink-secondary);
      background: var(--xmp-paper-raised);
      border: 1px solid var(--xmp-hairline);
      border-radius: 3px;
      cursor: pointer;
      transition: border-color 160ms ease, color 160ms ease;
    }

    html[data-xmp-enabled="1"] .xmp-media-toggle:hover {
      border-color: var(--xmp-pine);
      color: var(--xmp-pine);
    }

    html[data-xmp-enabled="1"] [data-xmp-media-block][data-xmp-media-loading] {
      position: absolute !important;
      left: 0 !important;
      right: 0 !important;
      top: 0 !important;
      width: 100% !important;
      visibility: hidden !important;
      pointer-events: none !important;
    }

    html[data-xmp-enabled="1"] .xmp-media-toggle:focus-visible {
      outline: 2px solid var(--xmp-pine);
      outline-offset: 2px;
    }

    html[data-xmp-enabled="1"] [data-xmp-media-state="expanded"] .xmp-media-toggle {
      color: var(--xmp-pine);
      border-color: var(--xmp-pine);
      background: var(--xmp-pine-soft);
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div[role="link"]:has([data-testid="User-Name"]):has([data-testid="tweetText"]) .xmp-media-toggle {
      margin-left: 12px;
      margin-right: 12px;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div[role="link"]:has([data-testid="User-Name"]):has([data-testid="tweetText"]) [data-xmp-media-block] {
      max-width: calc(100% - 24px) !important;
      margin: 0 12px 12px !important;
      border-radius: 12px !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div[role="link"]:has([data-testid="User-Name"]):has([data-testid="tweetText"]) [data-xmp-media-block] :is(img, video) {
      border-radius: 12px !important;
    }
  `;

  const PREVIEW_CSS = `
    html[data-xmp-enabled="1"] .xmp-photo-preview {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      z-index: 1400;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      max-width: min(1600px, 92vw);
      max-height: 92vh;
      padding: 10px;
      background: var(--xmp-paper);
      border: 1px solid var(--xmp-hairline);
      border-radius: 12px;
      box-shadow: 0 18px 48px rgba(27, 27, 27, 0.28);
      pointer-events: none;
    }

    html[data-xmp-enabled="1"] .xmp-photo-preview[data-xmp-preview-open="1"] {
      display: flex;
    }

    html[data-xmp-enabled="1"] .xmp-photo-preview-body {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 8px;
      max-width: 100%;
    }

    html[data-xmp-enabled="1"] .xmp-photo-preview img {
      display: block;
      max-width: min(1200px, 86vw);
      max-height: calc(88vh - 52px);
      border-radius: 8px;
      object-fit: contain;
    }

    html[data-xmp-enabled="1"] .xmp-photo-preview[data-xmp-preview-count="2"] img {
      max-width: 40vw;
      max-height: 66vh;
    }

    html[data-xmp-enabled="1"] .xmp-photo-preview:is([data-xmp-preview-count="3"], [data-xmp-preview-count="4"], [data-xmp-preview-count="many"]) img {
      max-width: 28vw;
      max-height: 30vh;
    }

    html[data-xmp-enabled="1"] .xmp-photo-preview span {
      font-family: var(--xmp-ui-font);
      font-size: 13px;
      line-height: 1.4;
      color: var(--xmp-ink-secondary);
    }
  `;

  let enabled = true;
  let degraded = false;
  let route = 'other';
  let historyPatched = false;
  let observer = null;
  let observedPrimary = null;
  let scanTimer = null;
  let timestampTimer = null;
  let bootObserver = null;
  let bootTimer = null;
  let mediaBlockCounter = 0;
  let layoutRetry = 0;
  let navExpanded = false;
  let railTimer = null;
  let homeReturn = null;
  let homeRestoreToken = 0;
  const warned = new Set();
  const mediaWarmups = new WeakMap();
  const mediaReveals = new WeakMap();
  const mediaImageCache = new Map();
  const widthQuery = window.matchMedia(`(min-width: ${MIN_LAYOUT_WIDTH}px)`);

  function warnOnce(key, message) {
    if (warned.has(key)) return;
    warned.add(key);
    console.warn(`[x-paper] ${message}`);
  }

  function readEnabled() {
    try {
      if (typeof GM_getValue === 'function') return GM_getValue(ENABLED_KEY, true) !== false;
      const stored = window.localStorage.getItem(ENABLED_KEY);
      return stored === null ? true : stored !== '0';
    } catch (error) {
      return true;
    }
  }

  function writeEnabled(value) {
    if (typeof GM_setValue === 'function') {
      GM_setValue(ENABLED_KEY, value);
      return;
    }
    window.localStorage.setItem(ENABLED_KEY, value ? '1' : '0');
  }

  function registerMenu() {
    if (typeof GM_registerMenuCommand !== 'function') return;
    GM_registerMenuCommand('关闭 x-paper', () => setEnabled(false));
    GM_registerMenuCommand('开启 x-paper', () => setEnabled(true));
  }

  function injectStyle(id, css) {
    let element = document.getElementById(id);
    if (element) {
      element.textContent = css;
      return element;
    }
    if (typeof GM_addStyle === 'function') {
      element = GM_addStyle(css);
      if (element) element.id = id;
      return element;
    }
    element = document.createElement('style');
    element.id = id;
    element.textContent = css;
    (document.head || document.documentElement).appendChild(element);
    return element;
  }

  function injectStyles() {
    injectStyle('xmp-preflight', PREFLIGHT_CSS);
    injectStyle('xmp-theme', THEME_CSS);
    injectStyle('xmp-layout', LAYOUT_CSS);
    injectStyle('xmp-noise', NOISE_CSS);
    injectStyle('xmp-media', MEDIA_CSS);
    injectStyle('xmp-preview', PREVIEW_CSS);
  }

  function removeStyles() {
    STYLE_IDS.forEach(id => document.getElementById(id)?.remove());
  }

  function setNavExpanded(value) {
    navExpanded = value;
    const root = document.documentElement;
    if (value) root.dataset.xmpNavExpanded = '1';
    else delete root.dataset.xmpNavExpanded;
    const toggle = document.querySelector('.xmp-nav-toggle');
    if (!toggle) return;
    const label = value ? '收起导航' : '展开导航';
    const text = toggle.querySelector('span');
    if (text) text.textContent = label;
    toggle.setAttribute('aria-expanded', value ? 'true' : 'false');
    toggle.setAttribute('aria-label', label);
    toggle.title = label;
  }

  function ensureNavToggle() {
    if (!enabled || !document.body) return;
    let toggle = document.querySelector('.xmp-nav-toggle');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'xmp-nav-toggle';
      toggle.innerHTML = `${NAV_TOGGLE_ICON}<span></span>`;
      toggle.addEventListener('click', () => setNavExpanded(!navExpanded));
      document.body.appendChild(toggle);
    }
    setNavExpanded(navExpanded);
  }

  function removeNavToggle() {
    document.querySelectorAll('.xmp-nav-toggle').forEach(toggle => toggle.remove());
    setNavExpanded(false);
  }

  function setEnabled(value) {
    let stored = true;
    try {
      writeEnabled(value);
    } catch (error) {
      stored = false;
    }
    if (stored) {
      window.location.reload();
      return;
    }
    if (value) enableInPage();
    else disableInPage();
  }

  function disableInPage() {
    enabled = false;
    stopObserver();
    cleanupAllMedia();
    hidePhotoPreview();
    if (previewEl) {
      previewEl.remove();
      previewEl = null;
    }
    removeNavToggle();
    removeStyles();
    const root = document.documentElement;
    delete root.dataset.xmpEnabled;
    delete root.dataset.xmpRoute;
    delete root.dataset.xmpDegraded;
    degraded = false;
  }

  function enableInPage() {
    enabled = true;
    document.documentElement.dataset.xmpEnabled = '1';
    injectStyles();
    setRoute();
    const primary = document.querySelector(PRIMARY);
    if (!primary) {
      scheduleBootRetry();
      return;
    }
    checkSelectorHealth();
    formatTimestamps();
    scheduleSurfaceRefresh();
    markTabbar();
    markComposer();
    markAppBar();
    markRailPanel();
    markRailLayout();
    ensureNavToggle();
    if (route === 'home' || route === 'profile') {
      if (!degraded) {
        startObserver();
        scanTimeline();
      }
    }
  }

  // 保留给 X 自己的一级路径；其余 /<handle> 视为个人主页（含 /handle/media 等子页）。
  const RESERVED_HANDLES = new Set([
    'home', 'explore', 'notifications', 'messages', 'i', 'search', 'settings', 'compose',
    'login', 'logout', 'signup', 'tos', 'privacy', 'premium', 'grok', 'jobs', 'communities',
    'about', 'download', 'account', 'lists', 'bookmarks', 'verified', 'connect_people',
    'topics', 'intent', 'share', 'hashtag', 'rules', 'help', 'ads', 'create', 'migrate',
    'oauth', 'welcome', 'flow', 'sms', 'accessibility', 'safety', 'following',
  ]);
  const PROFILE_PATH = /^\/([A-Za-z0-9_]{1,15})(?:\/(?:with_replies|media|likes|highlights|articles|followers|following|affiliates|verified_followers))?\/?$/;

  function classifyRoute(pathname) {
    if (pathname === '/' || pathname === '/home') return 'home';
    if (pathname.includes('/status/')) return 'status';
    const match = pathname.match(PROFILE_PATH);
    if (match && !RESERVED_HANDLES.has(match[1].toLowerCase())) return 'profile';
    if (pathname === '/i/connect_people') return 'people';
    return 'other';
  }

  function isWideRoute(value) {
    return value === 'home' || value === 'status' || value === 'profile' || value === 'people';
  }

  function setRoute() {
    route = classifyRoute(window.location.pathname);
    document.documentElement.dataset.xmpRoute = route;
  }

  function patchHistory() {
    if (historyPatched) return;
    historyPatched = true;
    ['pushState', 'replaceState'].forEach(method => {
      const original = history[method];
      history[method] = function patchedHistory(...args) {
        const result = original.apply(this, args);
        try {
          onRouteChange();
        } catch (error) {
          warnOnce('route', `路由回调失败：${error}`);
        }
        return result;
      };
    });
    window.addEventListener('popstate', () => {
      try {
        onRouteChange();
      } catch (error) {
        warnOnce('route', `popstate 回调失败：${error}`);
      }
    });
  }

  // X 从详情页返回首页时会重建时间线，滚动位置会回到顶部。
  // 离开首页时记住滚动量和当时第一条完整可见的帖子，回来后按它复位；帖子还没渲染出来时
  // 先等 2s 让 X 补内容，再按像素位置回填，并在 6s 内持续校正（用户主动滚动即放弃）。
  function captureHomeReturn() {
    const primary = document.querySelector(PRIMARY);
    const y = Math.round(window.scrollY);
    if (!primary || y <= 0) {
      homeReturn = null;
      return;
    }
    let anchor = null;
    for (const cell of primary.querySelectorAll(CELL)) {
      const rect = cell.getBoundingClientRect();
      if (rect.bottom <= 80) continue;
      const link = cell.querySelector('a[href*="/status/"]');
      if (!link) continue;
      anchor = { href: link.getAttribute('href'), top: Math.round(rect.top) };
      break;
    }
    homeReturn = { y, anchor };
  }

  function restoreHomeReturn() {
    const state = homeReturn;
    if (!state) return;
    const token = ++homeRestoreToken;
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    ['wheel', 'touchmove'].forEach(type => {
      window.addEventListener(type, cancel, { passive: true, once: true });
    });
    const started = performance.now();
    const tick = () => {
      if (cancelled || token !== homeRestoreToken || route !== 'home') return;
      const elapsed = performance.now() - started;
      let aligned = false;
      if (state.anchor) {
        const link = document.querySelector(`a[href="${state.anchor.href}"]`);
        const cell = link ? link.closest(CELL) : null;
        if (cell) {
          const delta = Math.round(cell.getBoundingClientRect().top) - state.anchor.top;
          if (Math.abs(delta) > 2) window.scrollBy(0, delta);
          aligned = true;
        }
      }
      // 锚点还没渲染出来时先等 X 补内容，否则按像素滚动会被短页面钳到底部。
      if (!aligned && elapsed >= 2000) {
        const max = Math.max(0, document.scrollingElement.scrollHeight - window.innerHeight);
        const target = Math.min(state.y, max);
        if (Math.abs(window.scrollY - target) > 2) window.scrollTo(0, target);
      }
      if (elapsed < 6000) window.setTimeout(tick, 250);
    };
    window.setTimeout(tick, 120);
  }

  function onRouteChange() {
    if (!enabled) return;
    const previousRoute = route;
    setRoute();
    hidePhotoPreview();
    if (previousRoute === 'home' && route !== 'home') captureHomeReturn();
    if (previousRoute !== 'home' && route === 'home') restoreHomeReturn();
    if (route !== 'home') {
      stopObserver();
    }
    const primary = document.querySelector(PRIMARY);
    if (!primary) {
      scheduleBootRetry();
      return;
    }
    checkSelectorHealth();
    formatTimestamps();
    scheduleSurfaceRefresh();
    markTabbar();
    markComposer();
    markAppBar();
    markRailPanel();
    markRailLayout();
    ensureNavToggle();
    if (!isWideRoute(route)) setNavExpanded(false);
    if (route === 'home' || route === 'profile') {
      if (!degraded) {
        startObserver();
        scanTimeline();
      }
    } else {
      stopObserver();
    }
  }

  function formatPostTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const now = new Date();
    const midnight = day => new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const days = Math.round((midnight(now) - midnight(date)) / 86400000);
    const clock = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    if (days === 0) return clock;
    if (days === 1) return `昨天·${clock}`;
    const month = date.getMonth() + 1;
    const dateText = date.getFullYear() === now.getFullYear()
      ? `${month}月${date.getDate()}日`
      : `${date.getFullYear()}年${month}月${date.getDate()}日`;
    return `${dateText}·${clock}`;
  }

  function formatTimestamps() {
    if (!enabled) return;
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    for (const element of primary.querySelectorAll('time[datetime]')) {
      const text = formatPostTime(element.getAttribute('datetime'));
      if (!text || element.textContent.trim() === text) continue;
      element.textContent = text;
      const link = element.closest('a');
      if (link && link.hasAttribute('aria-label')) link.setAttribute('aria-label', text);
    }
  }

  // X 流式渲染：顶部条和回复框可能晚于正文出现，延迟再标一次。
  function scheduleSurfaceRefresh() {
    if (timestampTimer) window.clearTimeout(timestampTimer);
    timestampTimer = window.setTimeout(() => {
      timestampTimer = null;
      formatTimestamps();
      markComposer();
      markAppBar();
    }, 1200);
  }

  function markTabbar() {
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    const tablist = [...primary.querySelectorAll('[role="tablist"]')]
      .find(element => !element.closest(TWEET));
    if (!tablist) return;
    let content = tablist;
    while (content.parentElement && content.parentElement !== primary) {
      content = content.parentElement;
    }
    if (content.parentElement !== primary) return;
    let tabbar = tablist;
    while (tabbar.parentElement && tabbar.parentElement !== content) {
      tabbar = tabbar.parentElement;
    }
    if (tabbar.parentElement === content) {
      tabbar.setAttribute('data-xmp-tabbar', '');
    }
  }

  function markComposer() {
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    const textarea = [...primary.querySelectorAll('[data-testid="tweetTextarea_0"]')]
      .find(element => !element.closest(TWEET) && !element.closest('[role="dialog"]'));
    const toolbar = [...primary.querySelectorAll('[data-testid="toolBar"]')]
      .find(element => !element.closest(TWEET) && !element.closest('[role="dialog"]'));
    if (!textarea || !toolbar) return;
    let common = textarea;
    while (common && common !== primary &&
           !(common.contains(toolbar) && common.contains(textarea))) {
      common = common.parentElement;
    }
    if (!common || common === primary) return;
    let content = common;
    while (content.parentElement && content.parentElement !== primary) {
      content = content.parentElement;
    }
    if (content.parentElement !== primary) return;
    let wrapper = common;
    while (wrapper.parentElement && wrapper.parentElement !== content) {
      wrapper = wrapper.parentElement;
    }
    if (wrapper.parentElement === content) {
      wrapper.setAttribute('data-xmp-composer', '');
      for (const child of content.children) {
        if (child === wrapper || child.hasAttribute('data-xmp-tabbar')) continue;
        const box = child.getBoundingClientRect();
        if (box.height > 0 && box.height <= 2) child.setAttribute('data-xmp-divider', '');
      }
    }
  }

  // 详情页/文章页的顶部条没有稳定 testid，从返回按钮向上找带 blur/背景的那一层，
  // 标成 data-xmp-appbar 交给主题规则。
  function markAppBar() {
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    const back = primary.querySelector('[data-testid="app-bar-back"]');
    if (!back) return;
    document.querySelectorAll('[data-xmp-appbar]').forEach(node => {
      if (!node.contains(back)) node.removeAttribute('data-xmp-appbar');
    });
    let node = back.parentElement;
    for (let depth = 0; node && node !== primary && depth < 8; depth += 1) {
      const cs = window.getComputedStyle(node);
      if (cs.backdropFilter.includes('blur') ||
          (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent')) {
        node.setAttribute('data-xmp-appbar', '');
        return;
      }
      node = node.parentElement;
    }
  }

  function markRailPanel() {
    const switcher = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    if (!switcher) return;
    let panel = switcher.parentElement;
    while (panel && panel !== document.body) {
      if (window.getComputedStyle(panel).position === 'fixed') break;
      panel = panel.parentElement;
    }
    if (!panel || panel === document.body) return;
    document.querySelectorAll('[data-xmp-rail-panel]').forEach(node => {
      if (node !== panel) node.removeAttribute('data-xmp-rail-panel');
    });
    panel.setAttribute('data-xmp-rail-panel', '');
  }

  function markRailLayout() {
    const root = document.documentElement;
    const nav = document.querySelector('header nav');
    const logo = document.querySelector('header a[aria-label="X"]');
    if (nav && logo) {
      if (nav.contains(logo)) {
        root.style.removeProperty('--xmp-nav-top');
      } else {
        const top = Math.max(0, Math.round(logo.getBoundingClientRect().bottom + 2));
        root.style.setProperty('--xmp-nav-top', `${top}px`);
      }
    }
    const more = document.querySelector('[data-testid="AppTabBar_More_Menu"]');
    const switcher = document.querySelector('[data-testid="SideNav_AccountSwitcher_Button"]');
    let top = more ? Math.round(more.getBoundingClientRect().bottom - 1) : 0;
    const maxTop = switcher
      ? Math.round(switcher.getBoundingClientRect().top - 50)
      : window.innerHeight - 56;
    if (top > maxTop) top = maxTop;
    if (top > 0) root.style.setProperty('--xmp-toggle-top', `${top}px`);
    else root.style.removeProperty('--xmp-toggle-top');
  }

  function bootWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
      boot();
    }
  }

  function boot() {
    if (!enabled) return;
    setRoute();
    patchHistory();
    const primary = document.querySelector(PRIMARY);
    if (!primary) {
      scheduleBootRetry();
      return;
    }
    if (bootObserver) {
      bootObserver.disconnect();
      bootObserver = null;
    }
    if (bootTimer) {
      window.clearTimeout(bootTimer);
      bootTimer = null;
    }
    checkSelectorHealth();
    formatTimestamps();
    scheduleSurfaceRefresh();
    markTabbar();
    markComposer();
    markAppBar();
    markRailPanel();
    markRailLayout();
    ensureNavToggle();
    if (route === 'home' || route === 'profile') {
      if (!degraded) {
        startObserver();
        scanTimeline();
      }
    } else {
      stopObserver();
    }
  }

  function scheduleBootRetry() {
    if (bootObserver) return;
    bootObserver = new MutationObserver(() => {
      if (document.querySelector(PRIMARY)) {
        bootObserver.disconnect();
        bootObserver = null;
        boot();
      }
    });
    bootObserver.observe(document.documentElement, { childList: true, subtree: true });
    if (bootTimer) window.clearTimeout(bootTimer);
    bootTimer = window.setTimeout(() => {
      if (bootObserver) {
        bootObserver.disconnect();
        bootObserver = null;
      }
      if (enabled && !document.querySelector(PRIMARY)) checkSelectorHealth();
    }, 10000);
  }

  function findInnerTimelineContainer(primary) {
    const elements = primary.querySelectorAll('div');
    for (const element of elements) {
      if (element.hasAttribute('data-xmp-inner-timeline')) return element;
      if (window.getComputedStyle(element).maxWidth === '600px') return element;
    }
    return null;
  }

  function checkSelectorHealth() {
    if (!enabled) return;
    const primary = document.querySelector(PRIMARY);
    if (!primary) {
      setDegraded('primary');
      return;
    }
    const header = document.querySelector('header[role="banner"]');
    const nav = document.querySelector('[data-testid^="AppTabBar_"]');
    if (!header || !nav) {
      if (layoutRetry < 5) {
        layoutRetry += 1;
        window.setTimeout(() => {
          if (enabled) checkSelectorHealth();
        }, 200);
        return;
      }
      setDegraded('layout');
      return;
    }
    layoutRetry = 0;
    // 内层 600px 时间线容器是可选锚点：个人主页以外的一些列表页（如 /i/connect_people）
    // 没有它，但主列本身可以放宽，不应因此降级。
    const inner = findInnerTimelineContainer(primary);
    if (inner && !inner.hasAttribute('data-xmp-inner-timeline')) {
      inner.setAttribute('data-xmp-inner-timeline', '');
    }
    clearDegraded();
    const cells = [...primary.querySelectorAll(CELL)];
    if (cells.length === 0) return;
    if (!commonAncestor(cells)) {
      warnOnce('timeline-root', '未找到时间线根，跳过媒体按钮标注');
    }
  }

  function setDegraded(reason) {
    degraded = true;
    document.documentElement.dataset.xmpDegraded = '1';
    warnOnce(`degraded-${reason}`, `选择器降级（${reason}）`);
    stopObserver();
    cleanupAllMedia();
    setNavExpanded(false);
  }

  function clearDegraded() {
    if (!degraded) return;
    degraded = false;
    delete document.documentElement.dataset.xmpDegraded;
  }

  function commonAncestor(nodes) {
    if (nodes.length === 0) return null;
    let candidate = nodes[0].parentElement;
    while (candidate && candidate !== document.body) {
      if (nodes.every(node => candidate.contains(node))) return candidate;
      candidate = candidate.parentElement;
    }
    return null;
  }

  function startObserver() {
    if (!enabled || degraded || !isWideRoute(route) || route === 'status' || !widthQuery.matches) return;
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    if (observer && observedPrimary === primary) return;
    stopObserver();
    observedPrimary = primary;
    observer = new MutationObserver(scheduleScan);
    observer.observe(primary, { childList: true, subtree: true });
    scheduleScan();
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    observedPrimary = null;
    if (scanTimer) {
      window.clearTimeout(scanTimer);
      scanTimer = null;
    }
  }

  function scheduleScan() {
    if (scanTimer) return;
    scanTimer = window.setTimeout(() => {
      scanTimer = null;
      scanTimeline();
    }, 150);
  }

  function scanTimeline() {
    if (!enabled || degraded || !isWideRoute(route) || route === 'status' || !widthQuery.matches) return;
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    formatTimestamps();
    markTabbar();
    markComposer();
    markAppBar();
    markRailPanel();
    markRailLayout();
    if (route !== 'home' && route !== 'profile') return;
    const cells = [...primary.querySelectorAll(CELL)];
    if (cells.length > 0 && !commonAncestor(cells)) return;
    primary.querySelectorAll(TWEET).forEach(tweet => {
      if (!tweet.parentElement.closest(TWEET)) annotateTweet(tweet);
    });
  }

  function collectMedia(tweet) {
    return [...tweet.querySelectorAll(MEDIA_SELECTOR)].filter(element => {
      if (element.closest(TWEET) !== tweet) return false;
      if (element.closest('[data-testid="card.wrapper"]') && !isQuoteMedia(tweet, element)) return false;
      if (element.getAttribute('data-testid') === 'tweetPhoto') {
        // A clip paints its poster through a tweetPhoto shell: the shell either
        // wraps the interstitial or sits inside one. Counting both would report
        // one video as an image plus a video.
        if (element.closest('[data-testid="previewInterstitial"]')) return false;
        if (element.querySelector('[data-testid="previewInterstitial"]')) return false;
      }
      return true;
    });
  }

  function isQuoteMedia(tweet, element) {
    let node = element.parentElement;
    while (node && node !== tweet) {
      if (node.getAttribute('role') === 'link' &&
          node.querySelector('[data-testid="User-Name"]') &&
          node.querySelector('[data-testid="tweetText"]')) {
        return true;
      }
      node = node.parentElement;
    }
    return false;
  }

  // Collapse the tweet's own media first. Quoted media is only promoted when
  // the tweet itself carries no media, so a quote's image can also be folded.
  function selectMedia(tweet, media) {
    const own = media.filter(element => !isQuoteMedia(tweet, element));
    return own.length > 0 ? own : media;
  }

  const MEDIA_BLOCK_STOP =
    '[data-testid="tweetText"], [data-testid="User-Name"], [data-testid="card.wrapper"], ' +
    '[data-testid="tweet"], [role="group"]';

  function findMediaBlock(tweet, media) {
    const carousel = media[0].closest('[data-testid="ScrollSnap-List"]');
    if (carousel && tweet.contains(carousel) &&
        media.every(item => carousel.contains(item)) &&
        !carousel.querySelector('[data-testid="tweetText"]') &&
        !carousel.querySelector('[role="group"]')) {
      return liftMediaBlock(tweet, carousel);
    }
    let candidate = media[0].parentElement;
    while (candidate && candidate !== tweet) {
      if (media.every(item => candidate.contains(item)) &&
          !candidate.querySelector('[data-testid="tweetText"]') &&
          !candidate.querySelector('[role="group"]')) {
        return liftMediaBlock(tweet, candidate);
      }
      candidate = candidate.parentElement;
    }
    return null;
  }

  // The nearest media wrapper often carries no height; the sized figure shell
  // sits higher up. Lift the block to the highest ancestor that still contains
  // only media: text, the author row, cards, quoted tweets and the action bar
  // all stop the climb before it reaches the rest of the tweet.
  function liftMediaBlock(tweet, block) {
    let lifted = block;
    let probe = block;
    while (probe.parentElement && probe.parentElement !== tweet) {
      const parent = probe.parentElement;
      if (parent.querySelector(MEDIA_BLOCK_STOP)) break;
      if (parent.querySelector('.xmp-media-toggle')) break;
      lifted = parent;
      probe = parent;
    }
    return lifted;
  }

  function describeMedia(media) {
    const images = media.filter(element => element.getAttribute('data-testid') === 'tweetPhoto');
    const videos = media.filter(element => element.getAttribute('data-testid') === 'previewInterstitial');
    if (images.length > 0 && videos.length > 0) {
      const count = media.length;
      return {
        kind: 'mixed',
        count,
        visible: `🎬 媒体 · ${count} 项`,
        accessible: `展开媒体，共 ${count} 项`,
        expanded: '收起媒体',
      };
    }
    if (videos.length > 0) {
      return {
        kind: 'video',
        count: videos.length,
        visible: '🎬 视频',
        accessible: '展开视频',
        expanded: '收起视频',
      };
    }
    if (images.length === 1) {
      return {
        kind: 'image',
        count: 1,
        visible: '🖼️ 图片',
        accessible: '展开图片',
        expanded: '收起图片',
      };
    }
    return {
      kind: 'images',
      count: images.length,
      visible: `🖼️ 图片 · ${images.length} 张`,
      accessible: `展开图片，共 ${images.length} 张`,
      expanded: '收起图片',
    };
  }

  function renderButton(button, info, state) {
    const expanded = state === 'expanded';
    const countSuffix = info.count > 1 && info.kind !== 'video'
      ? `，共 ${info.count} ${info.kind === 'mixed' ? '项' : '张'}`
      : '';
    button.textContent = expanded ? info.expanded : info.visible;
    button.setAttribute('aria-label', expanded ? `${info.expanded}${countSuffix}` : info.accessible);
    button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    button.dataset.xmpKind = info.kind;
    button.dataset.xmpCount = String(info.count);
  }

  function collectMediaUrls(block) {
    const urls = new Set();
    for (const image of block.querySelectorAll('img[src]')) {
      const src = image.currentSrc || image.src;
      if (src) urls.add(src);
    }
    for (const node of block.querySelectorAll('[style*="background-image"]')) {
      const match = (node.getAttribute('style') || '').match(/url\((["']?)(.*?)\1\)/);
      if (match && match[2]) urls.add(match[2]);
    }
    for (const video of block.querySelectorAll('video[poster]')) {
      if (video.poster) urls.add(video.poster);
    }
    return [...urls];
  }

  // Warm images while the media block is still collapsed, so expanding it
  // paints the decoded media instead of a placeholder that pops in later.
  function warmMedia(block) {
    if (!block) return Promise.resolve();
    let promise = mediaWarmups.get(block);
    if (promise) return promise;
    promise = Promise.all(collectMediaUrls(block).map(url => new Promise(resolve => {
      const image = new Image();
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        const decoded = typeof image.decode === 'function' ? image.decode() : Promise.resolve();
        decoded.catch(() => {}).finally(resolve);
      };
      image.onload = finish;
      image.onerror = () => {
        if (!settled) { settled = true; resolve(); }
      };
      window.setTimeout(() => {
        if (!settled) { settled = true; resolve(); }
      }, 1200);
      image.src = url;
      if (image.complete && image.naturalWidth > 0) finish();
    })));
    mediaWarmups.set(block, promise);
    return promise;
  }

  function mediaImageReady(url) {
    let entry = mediaImageCache.get(url);
    if (!entry) {
      entry = { ready: false };
      const image = new Image();
      image.onload = () => { entry.ready = true; };
      image.onerror = () => { entry.ready = true; };
      image.src = url;
      mediaImageCache.set(url, entry);
    }
    return entry.ready;
  }

  function visibleMediaUrls(block) {
    const bounds = block.getBoundingClientRect();
    const visible = rect => rect.width > 0 && rect.height > 0 &&
      rect.right > bounds.left && rect.left < bounds.right &&
      rect.bottom > bounds.top && rect.top < bounds.bottom;
    const urls = new Set();
    for (const node of block.querySelectorAll('[style*="background-image"]')) {
      if (!visible(node.getBoundingClientRect())) continue;
      const match = (node.getAttribute('style') || '').match(/url\((["']?)(.*?)\1\)/);
      if (match && match[2]) urls.add(match[2]);
    }
    if (urls.size > 0) return [...urls];
    return [...block.querySelectorAll('img[src]')]
      .filter(image => visible(image.getBoundingClientRect()))
      .map(image => image.currentSrc || image.src)
      .filter(Boolean);
  }

  function waitForMediaPaint(block) {
    return new Promise(resolve => {
      const started = performance.now();
      const check = () => {
        const elapsed = performance.now() - started;
        const urls = visibleMediaUrls(block);
        const minimumWait = urls.length === 0 ? 160 : 0;
        const loaded = urls.every(url => mediaImageReady(url));
        if ((loaded && elapsed >= minimumWait) || elapsed >= 700) {
          window.setTimeout(resolve, 30);
        } else {
          window.setTimeout(check, 40);
        }
      };
      window.setTimeout(check, 0);
    });
  }

  function toggleMedia(tweet, toggle) {
    const currentMedia = selectMedia(tweet, collectMedia(tweet));
    if (currentMedia.length === 0) return;
    const currentInfo = describeMedia(currentMedia);
    const block = document.getElementById(toggle.getAttribute('aria-controls') || '');
    if (tweet.dataset.xmpMediaState === 'expanded') {
      tweet.dataset.xmpMediaState = 'collapsed';
      hidePhotoPreview();
      if (block) {
        mediaReveals.set(block, (mediaReveals.get(block) || 0) + 1);
        block.removeAttribute('data-xmp-media-loading');
      }
      renderButton(toggle, currentInfo, 'collapsed');
      return;
    }
    if (!block || !tweet.contains(block)) {
      tweet.dataset.xmpMediaState = 'expanded';
      renderButton(toggle, currentInfo, 'expanded');
      return;
    }
    const reveal = (mediaReveals.get(block) || 0) + 1;
    mediaReveals.set(block, reveal);
    block.setAttribute('data-xmp-media-loading', '');
    tweet.dataset.xmpMediaState = 'expanded';
    renderButton(toggle, currentInfo, 'expanded');
    warmMedia(block);
    waitForMediaPaint(block).then(() => {
      if (mediaReveals.get(block) !== reveal || !block.isConnected) return;
      block.removeAttribute('data-xmp-media-loading');
    });
  }

  function annotateTweet(tweet) {
    const media = selectMedia(tweet, collectMedia(tweet));
    if (media.length === 0) {
      cleanupTweet(tweet);
      return;
    }
    const info = describeMedia(media);
    const existingButton = tweet.querySelector('.xmp-media-toggle');
    const existingBlock = existingButton
      ? document.getElementById(existingButton.getAttribute('aria-controls') || '')
      : null;
    if (existingButton && existingBlock && tweet.contains(existingBlock) &&
        media.every(item => existingBlock.contains(item))) {
      if (!tweet.hasAttribute('data-xmp-media-state')) {
        tweet.dataset.xmpMediaState = 'collapsed';
      }
      if (existingButton.dataset.xmpKind !== info.kind ||
          existingButton.dataset.xmpCount !== String(info.count)) {
        renderButton(existingButton, info, tweet.dataset.xmpMediaState);
      }
      return;
    }
    if (existingButton || existingBlock) cleanupTweet(tweet);
    const mediaBlock = findMediaBlock(tweet, media);
    if (!mediaBlock) {
      cleanupTweet(tweet);
      return;
    }
    const existingId = mediaBlock.id;
    const id = existingId && !existingId.startsWith('xmp-media-block-')
      ? existingId
      : `xmp-media-block-${++mediaBlockCounter}`;
    if (mediaBlock.id !== id) mediaBlock.id = id;
    mediaBlock.setAttribute('data-xmp-media-block', '');
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'xmp-media-toggle';
    toggle.setAttribute('aria-controls', id);
    toggle.addEventListener('click', () => toggleMedia(tweet, toggle));
    toggle.addEventListener('pointerenter', () => {
      const block = document.getElementById(toggle.getAttribute('aria-controls') || '');
      if (block) warmMedia(block);
    });
    toggle.addEventListener('focus', () => {
      const block = document.getElementById(toggle.getAttribute('aria-controls') || '');
      if (block) warmMedia(block);
    });
    tweet.dataset.xmpMediaState = 'collapsed';
    renderButton(toggle, info, 'collapsed');
    mediaBlock.parentElement.insertBefore(toggle, mediaBlock);
  }

  function cleanupTweet(tweet) {
    tweet.querySelectorAll('.xmp-media-toggle').forEach(button => button.remove());
    delete tweet.dataset.xmpMediaState;
    tweet.querySelectorAll('[data-xmp-media-block]').forEach(block => {
      block.removeAttribute('data-xmp-media-block');
      block.removeAttribute('data-xmp-media-loading');
      if (block.id.startsWith('xmp-media-block-')) block.removeAttribute('id');
    });
  }

  function cleanupAllMedia() {
    hidePhotoPreview();
    document.querySelectorAll('.xmp-media-toggle').forEach(button => button.remove());
    document.querySelectorAll('[data-xmp-media-block]').forEach(block => {
      block.removeAttribute('data-xmp-media-block');
      block.removeAttribute('data-xmp-media-loading');
      if (block.id.startsWith('xmp-media-block-')) block.removeAttribute('id');
    });
    document.querySelectorAll('[data-xmp-media-state]').forEach(tweet => {
      delete tweet.dataset.xmpMediaState;
    });
  }

  const PHOTO_SELECTOR = '[data-testid="tweetPhoto"]';
  const PREVIEW_SHOW_DELAY = 220;
  const PREVIEW_ORIG_TIMEOUT = 800;
  let previewEl = null;
  let previewTimer = null;
  let previewKey = null;
  let previewToken = 0;
  const previewReady = new Set();

  function ensurePreview() {
    if (previewEl && previewEl.isConnected) return previewEl;
    previewEl = document.createElement('div');
    previewEl.className = 'xmp-photo-preview';
    previewEl.setAttribute('aria-hidden', 'true');
    previewEl.innerHTML = '<div class="xmp-photo-preview-body"></div><span></span>';
    document.body.appendChild(previewEl);
    return previewEl;
  }

  function photoUrl(photo) {
    for (const node of photo.querySelectorAll('[style*="background-image"]')) {
      const match = (node.getAttribute('style') || '').match(/url\((["']?)(.*?)\1\)/);
      if (match && match[2]) return match[2];
    }
    const image = photo.querySelector('img[src]');
    return image ? image.currentSrc || image.src : '';
  }

  // pbs.twimg.com 用 name=orig 提供原图；折叠块里只有 120x120 缩略图。
  function originalUrl(url) {
    if (!/^https?:\/\/pbs\.twimg\.com\//.test(url)) return url;
    if (/[?&]name=/.test(url)) return url.replace(/([?&]name=)[^&#]*/i, '$1orig');
    return `${url}${url.includes('?') ? '&' : '?'}name=orig`;
  }

  // 视频的海报层是包住（或位于）previewInterstitial 的 tweetPhoto。折叠按钮悬停时
  // 把海报当静帧预览，不触发播放；已展开的视频本身可见，不再弹预览。
  function isVideoPoster(photo) {
    return !!photo.querySelector('[data-testid="previewInterstitial"]') ||
      !!photo.closest('[data-testid="previewInterstitial"]');
  }

  function mediaPhotos(scope) {
    return [...scope.querySelectorAll(PHOTO_SELECTOR)].filter(photo => !isVideoPoster(photo));
  }

  function mediaStills(scope) {
    return [...scope.querySelectorAll(PHOTO_SELECTOR)];
  }

  function stillsLabel(stills) {
    const videos = stills.filter(isVideoPoster).length;
    const images = stills.length - videos;
    if (videos > 0 && images > 0) return `${stills.length} 项 · 原图/封面`;
    if (videos > 0) return videos > 1 ? `${videos} 个视频封面` : '视频封面';
    return stills.length > 1 ? `${stills.length} 张 · 原图` : '原图';
  }

  function hidePhotoPreview() {
    if (previewTimer) {
      window.clearTimeout(previewTimer);
      previewTimer = null;
    }
    previewKey = null;
    previewToken += 1;
    if (previewEl) previewEl.removeAttribute('data-xmp-preview-open');
  }

  // waitForOriginal: 折叠块里只有 120px 缩略图，放大后一片模糊；
  // 等原图解码（或 800ms 超时）再弹出。展开后的图片已有较大尺寸，立即显示再替换原图。
  function openPreview(key, photos, label, waitForOriginal) {
    const urls = [...new Set(photos.map(photoUrl).filter(Boolean))];
    if (!urls.length) return;
    previewKey = key;
    const token = ++previewToken;
    const el = ensurePreview();
    const build = () => {
      if (token !== previewToken || previewKey !== key) return;
      const body = el.querySelector('.xmp-photo-preview-body');
      body.textContent = '';
      el.dataset.xmpPreviewCount = urls.length === 1 ? '1' : urls.length <= 4 ? String(urls.length) : 'many';
      el.querySelector('span').textContent = label;
      for (const url of urls) {
        const image = document.createElement('img');
        image.alt = '';
        const orig = originalUrl(url);
        image.src = previewReady.has(orig) ? orig : url;
        body.appendChild(image);
        if (orig !== url && !previewReady.has(orig)) {
          const loader = new Image();
          loader.onload = () => {
            previewReady.add(orig);
            if (token === previewToken) image.src = orig;
          };
          loader.src = orig;
        }
      }
      el.setAttribute('data-xmp-preview-open', '1');
    };
    if (!waitForOriginal) {
      build();
      return;
    }
    const pending = [...new Set(urls.map(originalUrl))].filter(url => !previewReady.has(url));
    if (pending.length === 0) {
      build();
      return;
    }
    let left = pending.length;
    let timer = null;
    const finish = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
      build();
    };
    for (const url of pending) {
      const loader = new Image();
      const settle = () => {
        previewReady.add(url);
        left -= 1;
        if (left === 0) finish();
      };
      loader.onload = settle;
      loader.onerror = settle;
      loader.src = url;
    }
    timer = window.setTimeout(finish, PREVIEW_ORIG_TIMEOUT);
  }

  function hoveredPhoto(target) {
    if (!enabled || degraded || !widthQuery.matches || !(target instanceof Element)) return null;
    const photo = target.closest(PHOTO_SELECTOR);
    if (!photo || photo.closest('.xmp-photo-preview') || !photo.closest(PRIMARY)) return null;
    if (isVideoPoster(photo)) return null;
    if (photo.closest('[data-xmp-media-loading]')) return null;
    const box = photo.getBoundingClientRect();
    if (box.width < 40 || box.height < 40) return null;
    return photo;
  }

  function hoveredToggle(target) {
    if (!enabled || degraded || !widthQuery.matches || !(target instanceof Element)) return null;
    const toggle = target.closest('.xmp-media-toggle');
    return toggle && toggle.closest(PRIMARY) ? toggle : null;
  }

  function schedulePreview(key, open) {
    if (key === previewKey) return;
    if (previewTimer) window.clearTimeout(previewTimer);
    hidePhotoPreview();
    previewKey = key;
    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      open();
    }, PREVIEW_SHOW_DELAY);
  }

  function watchPhotoPreview() {
    document.addEventListener('pointerover', event => {
      const toggle = hoveredToggle(event.target);
      if (toggle) {
        const block = document.getElementById(toggle.getAttribute('aria-controls') || '');
        const stills = block ? mediaStills(block) : [];
        if (stills.length === 0) return;
        const label = stillsLabel(stills);
        schedulePreview(toggle, () => openPreview(toggle, stills, label, true));
        return;
      }
      const photo = hoveredPhoto(event.target);
      if (!photo) return;
      const group = photo.closest('[data-xmp-media-block]') || photo.closest(TWEET) || photo.parentElement;
      const photos = group ? mediaPhotos(group) : [photo];
      const index = photos.indexOf(photo);
      const label = photos.length > 1 && index >= 0 ? `第 ${index + 1} / ${photos.length} 张 · 原图` : '原图';
      schedulePreview(photo, () => openPreview(photo, [photo], label, false));
    });
    document.addEventListener('pointerout', event => {
      if (!previewKey) return;
      const from = event.target instanceof Element
        ? event.target.closest('.xmp-media-toggle, [data-testid="tweetPhoto"]')
        : null;
      if (from !== previewKey) return;
      const to = event.relatedTarget;
      if (to instanceof Element && to.closest('.xmp-media-toggle, [data-testid="tweetPhoto"]') === previewKey) return;
      hidePhotoPreview();
    });
    // 点击进入 X 自己的大图查看器或展开媒体，预览先让位。
    document.addEventListener('click', hidePhotoPreview, true);
    // 用户滚轮/触摸滚动时收起；不监听 scroll 事件，否则 X 加载时的滚动锚定会把刚打开的预览误关。
    ['wheel', 'touchmove'].forEach(type => {
      window.addEventListener(type, hidePhotoPreview, { capture: true, passive: true });
    });
  }

  function handleWidthChange() {
    if (!enabled) return;
    if (!widthQuery.matches) {
      hidePhotoPreview();
      stopObserver();
      cleanupAllMedia();
      setNavExpanded(false);
    }
    if (widthQuery.matches && (route === 'home' || route === 'profile') && !degraded) {
      startObserver();
      scanTimeline();
    }
  }

  function init() {
    registerMenu();
    watchPhotoPreview();
    enabled = readEnabled();
    if (!enabled) return;
    document.documentElement.dataset.xmpEnabled = '1';
    injectStyles();
    if (typeof widthQuery.addEventListener === 'function') {
      widthQuery.addEventListener('change', handleWidthChange);
    }
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape') return;
      hidePhotoPreview();
      if (navExpanded) setNavExpanded(false);
    });
    window.addEventListener('resize', () => {
      if (railTimer) window.clearTimeout(railTimer);
      railTimer = window.setTimeout(() => {
        railTimer = null;
        if (enabled) markRailLayout();
      }, 150);
    });
    bootWhenReady();
  }

  init();
})();
