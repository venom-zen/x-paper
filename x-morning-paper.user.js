// ==UserScript==
// @name         x-paper
// @namespace    x-paper
// @version      0.3.2
// @description  A quiet paper layout for X: icon rail, wide reading column, emoji media controls
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
  const STYLE_IDS = ['xmp-preflight', 'xmp-theme', 'xmp-layout', 'xmp-noise', 'xmp-media'];
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

    html[data-xmp-enabled="1"] [data-testid^="UserAvatar-Container"]:not(header[role="banner"] *) div,
    html[data-xmp-enabled="1"] [data-testid^="UserAvatar-Container"]:not(header[role="banner"] *) img,
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

    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"]:not(:has([data-testid="tweet"])) [role="button"] span {
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
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header[role="banner"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header[role="banner"] {
        width: 88px !important;
        min-width: 88px !important;
        flex: 0 0 88px !important;
        background: var(--xmp-paper) !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav {
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

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav a span,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav button span,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav a span,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav button span {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav a > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav button > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav a > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav button > div:first-child > div[dir="ltr"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav a,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav button,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav a,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav button {
        justify-content: center !important;
        align-items: center !important;
        flex: 0 0 auto !important;
        height: auto !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav a > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav button > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav a > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav button > div:first-child {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav a:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav button:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav a:focus-visible > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header nav button:focus-visible > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav a:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav button:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav a:focus-visible > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header nav button:focus-visible > div:first-child {
        background-color: var(--xmp-pine-soft) !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) header nav {
        width: 240px !important;
        box-shadow: 4px 0 16px rgba(27, 27, 27, 0.12);
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) header nav a span,
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) header nav button span {
        display: inline !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) header nav a > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) header nav button > div:first-child > div[dir="ltr"] {
        display: block !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) header nav a,
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) header nav button {
        justify-content: flex-start !important;
        align-items: flex-start !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] header[role="banner"] [data-testid="SideNav_NewTweet_Button"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] header[role="banner"] [data-testid="SideNav_NewTweet_Button"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="sidebarColumn"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] [data-testid="sidebarColumn"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] main,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] main {
        align-items: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] main > div,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] main > div {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] main > div > div > div,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] main > div > div > div {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="primaryColumn"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] [data-testid="primaryColumn"] {
        width: 760px !important;
        max-width: 760px !important;
        flex: 0 0 760px !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-xmp-inner-timeline],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] [data-xmp-inner-timeline] {
        width: 100% !important;
        max-width: 100% !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="cellInnerDiv"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="tweetText"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] [data-testid="cellInnerDiv"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] [data-testid="tweetText"] {
        max-width: 100% !important;
      }

      @media (max-width: 1599px) and (min-width: 1280px) {
        html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="primaryColumn"],
        html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] [data-testid="primaryColumn"] {
          width: 720px !important;
          max-width: 720px !important;
          flex: 0 0 720px !important;
        }
      }

      @media (max-width: 1279px) and (min-width: 1000px) {
        html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="primaryColumn"],
        html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] [data-testid="primaryColumn"] {
          width: 680px !important;
          max-width: 680px !important;
          flex: 0 0 680px !important;
        }
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) [data-xmp-rail-panel] {
        left: 0 !important;
        right: auto !important;
        width: 88px !important;
        min-width: 88px !important;
        max-width: 88px !important;
        z-index: 1000 !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) [data-xmp-rail-panel] {
        width: 240px !important;
        min-width: 240px !important;
        max-width: 240px !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) [data-testid="SideNav_AccountSwitcher_Button"] {
        width: 72px !important;
        min-width: 0 !important;
        padding: 6px !important;
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"]) [data-testid="SideNav_AccountSwitcher_Button"] {
        width: 224px !important;
        padding: 12px !important;
        justify-content: flex-start !important;
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

      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] .xmp-nav-toggle,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="status"] .xmp-nav-toggle {
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
    html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="cellInnerDiv"]:has([data-testid="placementTracking"]),
    html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-testid="cellInnerDiv"]:has([data-testid="UserCell"]) {
      display: none !important;
    }
  `;

  const MEDIA_CSS = `
    html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-xmp-media-state="collapsed"] [data-xmp-media-block] {
      display: none !important;
    }

    html[data-xmp-enabled="1"]:not([data-xmp-degraded])[data-xmp-route="home"] [data-xmp-media-state="expanded"] [data-xmp-media-block] {
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
  const warned = new Set();
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
    scheduleTimestampFormat();
    markTabbar();
    markComposer();
    markRailPanel();
    markRailLayout();
    ensureNavToggle();
    if (route === 'home' && !degraded) {
      startObserver();
      scanTimeline();
    }
  }

  function classifyRoute(pathname) {
    if (pathname === '/' || pathname === '/home') return 'home';
    if (pathname.includes('/status/')) return 'status';
    return 'other';
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

  function onRouteChange() {
    if (!enabled) return;
    setRoute();
    if (route !== 'home') {
      stopObserver();
      cleanupAllMedia();
    }
    const primary = document.querySelector(PRIMARY);
    if (!primary) {
      scheduleBootRetry();
      return;
    }
    checkSelectorHealth();
    formatTimestamps();
    scheduleTimestampFormat();
    markTabbar();
    markComposer();
    markRailPanel();
    markRailLayout();
    ensureNavToggle();
    if (route !== 'home' && route !== 'status') setNavExpanded(false);
    if (route === 'home' && !degraded) {
      startObserver();
      scanTimeline();
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

  function scheduleTimestampFormat() {
    if (timestampTimer) window.clearTimeout(timestampTimer);
    timestampTimer = window.setTimeout(() => {
      timestampTimer = null;
      formatTimestamps();
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
    scheduleTimestampFormat();
    markTabbar();
    markComposer();
    markRailPanel();
    markRailLayout();
    ensureNavToggle();
    if (route === 'home' && !degraded) {
      startObserver();
      scanTimeline();
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
    const inner = findInnerTimelineContainer(primary);
    if (!header || !nav || !inner) {
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
    if (!inner.hasAttribute('data-xmp-inner-timeline')) {
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
    if (!enabled || degraded || route !== 'home' || !widthQuery.matches) return;
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
    if (!enabled || degraded || route !== 'home' || !widthQuery.matches) return;
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    formatTimestamps();
    markTabbar();
    markComposer();
    markRailPanel();
    markRailLayout();
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
      if (element.getAttribute('data-testid') === 'tweetPhoto' &&
          element.closest('[data-testid="previewInterstitial"]')) return false;
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
    toggle.addEventListener('click', () => {
      const currentMedia = selectMedia(tweet, collectMedia(tweet));
      if (currentMedia.length === 0) return;
      const currentInfo = describeMedia(currentMedia);
      const nextState = tweet.dataset.xmpMediaState === 'expanded' ? 'collapsed' : 'expanded';
      tweet.dataset.xmpMediaState = nextState;
      renderButton(toggle, currentInfo, nextState);
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
      if (block.id.startsWith('xmp-media-block-')) block.removeAttribute('id');
    });
  }

  function cleanupAllMedia() {
    document.querySelectorAll('.xmp-media-toggle').forEach(button => button.remove());
    document.querySelectorAll('[data-xmp-media-block]').forEach(block => {
      block.removeAttribute('data-xmp-media-block');
      if (block.id.startsWith('xmp-media-block-')) block.removeAttribute('id');
    });
    document.querySelectorAll('[data-xmp-media-state]').forEach(tweet => {
      delete tweet.dataset.xmpMediaState;
    });
  }

  function handleWidthChange() {
    if (!enabled) return;
    if (!widthQuery.matches) {
      stopObserver();
      cleanupAllMedia();
      setNavExpanded(false);
    }
    if (widthQuery.matches && route === 'home' && !degraded) {
      startObserver();
      scanTimeline();
    }
  }

  function init() {
    registerMenu();
    enabled = readEnabled();
    if (!enabled) return;
    document.documentElement.dataset.xmpEnabled = '1';
    injectStyles();
    if (typeof widthQuery.addEventListener === 'function') {
      widthQuery.addEventListener('change', handleWidthChange);
    }
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && navExpanded) setNavExpanded(false);
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
