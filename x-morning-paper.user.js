// ==UserScript==
// @name         x-paper
// @name:zh-CN   x-paper（X 纸面版）
// @namespace    x-paper
// @version      0.7.9
// @description  A quiet paper layout for X: icon rail, wide reading column, emoji media controls
// @description:zh-CN  把 X 改成安静纸面版面：图标轨、宽阅读列、媒体折叠与悬停原图预览
// @author       venom
// @license      MIT
// @homepageURL  https://github.com/venom-zen/x-paper
// @supportURL   https://github.com/venom-zen/x-paper/issues
// @match        https://x.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const MIN_LAYOUT_WIDTH = 1000;
  const PRIMARY = '[data-testid="primaryColumn"]';
  const CELL = '[data-testid="cellInnerDiv"]';
  const TWEET = '[data-testid="tweet"]';
  const MEDIA_SELECTOR = '[data-testid="tweetPhoto"], [data-testid="previewInterstitial"]';
  const NAV_TOGGLE_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.3 4.6 4.9 6l5.65 5.65L4.9 17.3l1.4 1.4 6.35-6.35a1 1 0 0 0 0-1.4L6.3 4.6Zm8 0L12.9 6l5.65 5.65-5.65 5.65 1.4 1.4 6.35-6.35a1 1 0 0 0 0-1.4L14.3 4.6Z"/></svg>';

  const TWEET_DETAIL_QUERY_ID = 'qpemjmVMoTWDvcRT43JIVQ';
  const FAVORITE_TWEET_QUERY_ID = 'lI07N6Otwv1PhnEgXILM7A';
  const UNFAVORITE_TWEET_QUERY_ID = 'ZYKSe-w7KEslx3JhSIk5LA';
  const CREATE_TWEET_QUERY_ID = 'l4hk8uVGvR-a8kzQ4nOhPA';
  // X Web 的公开 bearer token，不是账号凭据；请求使用浏览器当前会话 cookie。
  const TWEET_DETAIL_BEARER = "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
  const TWEET_DETAIL_FEATURES = {
    "rweb_video_screen_enabled": false,
    "rweb_cashtags_enabled": true,
    "profile_label_improvements_pcf_label_in_post_enabled": true,
    "responsive_web_profile_redirect_enabled": true,
    "rweb_tipjar_consumption_enabled": false,
    "verified_phone_label_enabled": false,
    "creator_subscriptions_tweet_preview_api_enabled": true,
    "responsive_web_graphql_timeline_navigation_enabled": true,
    "premium_content_api_read_enabled": false,
    "communities_web_enable_tweet_community_results_fetch": true,
    "c9s_tweet_anatomy_moderator_badge_enabled": true,
    "responsive_web_grok_analyze_button_fetch_trends_enabled": false,
    "responsive_web_grok_analyze_post_followups_enabled": true,
    "rweb_cashtags_composer_attachment_enabled": true,
    "responsive_web_jetfuel_frame": true,
    "rweb_sports_post_context_enabled": true,
    "x_elections_post_context_enabled": true,
    "responsive_web_grok_share_attachment_enabled": true,
    "responsive_web_grok_annotations_enabled": true,
    "articles_preview_enabled": true,
    "responsive_web_edit_tweet_api_enabled": true,
    "rweb_conversational_replies_downvote_enabled": false,
    "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
    "view_counts_everywhere_api_enabled": true,
    "longform_notetweets_consumption_enabled": true,
    "responsive_web_twitter_article_tweet_consumption_enabled": true,
    "content_disclosure_indicator_enabled": true,
    "content_disclosure_ai_generated_indicator_enabled": true,
    "responsive_web_grok_show_grok_translated_post": true,
    "responsive_web_grok_analysis_button_from_backend": true,
    "post_ctas_fetch_enabled": false,
    "freedom_of_speech_not_reach_fetch_enabled": true,
    "standardized_nudges_misinfo": true,
    "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
    "longform_notetweets_rich_text_read_enabled": true,
    "longform_notetweets_inline_media_enabled": false,
    "responsive_web_nested_quote_preview_enabled": true,
    "responsive_web_grok_image_annotation_enabled": true,
    "responsive_web_grok_imagine_annotation_enabled": true,
    "responsive_web_made_on_x_label_enabled": false,
    "responsive_web_grok_community_note_auto_translation_is_enabled": true,
    "responsive_web_enhance_cards_enabled": false,
  };
  const TWEET_DETAIL_FIELD_TOGGLES = {
    "withPayments": false,
    "withDmBlocks": false,
    "withArticleRichContentState": true,
    "withArticlePlainText": false,
    "withArticleSummaryText": true,
    "withArticleVoiceOver": true,
    "withGrokAnalyze": false,
    "withDisallowedReplyControls": false,
  };

  // 脚本生成的界面文案跟随 X 当前的界面语言（html[lang]），读不到时回退浏览器语言。
  // X 自己的界面由 X 本地化；这里覆盖轨道按钮、媒体按钮、原图预览、评论弹窗和时间格式。
  const DATE_EN = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const DATE_EN_YEAR = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const TEXT = {
    zh: {
      navExpand: '展开导航',
      navCollapse: '收起导航',
      yesterday: clock => `昨天·${clock}`,
      date: (date, now) => {
        const month = date.getMonth() + 1;
        return date.getFullYear() === now.getFullYear()
          ? `${month}月${date.getDate()}日`
          : `${date.getFullYear()}年${month}月${date.getDate()}日`;
      },
      mediaMixed: count => ({
        visible: `🎬 媒体 · ${count} 项`,
        accessible: `展开媒体，共 ${count} 项`,
        expanded: '收起媒体',
        suffix: `，共 ${count} 项`,
      }),
      mediaVideo: {
        visible: '🎬 视频',
        accessible: '展开视频',
        expanded: '收起视频',
        suffix: '',
      },
      mediaImage: {
        visible: '🖼️ 图片',
        accessible: '展开图片',
        expanded: '收起图片',
        suffix: '',
      },
      mediaImages: count => ({
        visible: `🖼️ 图片 · ${count} 张`,
        accessible: `展开图片，共 ${count} 张`,
        expanded: '收起图片',
        suffix: `，共 ${count} 张`,
      }),
      previewMixed: count => `${count} 项 · 原图/封面`,
      previewVideoCovers: count => count > 1 ? `${count} 个视频封面` : '视频封面',
      previewOriginals: count => count > 1 ? `${count} 张 · 原图` : '原图',
      previewIndex: (index, count) => `第 ${index} / ${count} 张 · 原图`,
      unknownUser: '未知用户',
      videoBadge: '视频',
      followers: (count, text) => `${text} 关注者`,
      following: (count, text) => `${text} 正在关注`,
      openProfile: '在 X 打开主页',
      like: '喜欢',
      unlike: '取消喜欢',
      actionFailed: '操作失败',
      likeRequestFailed: '点赞接口返回错误',
      replyLabel: '回复 ',
      replyPlaceholder: '发布你的回复…',
      replyAria: target => `回复 @${target}`,
      cancel: '取消',
      reply: '回复',
      posting: '发布中…',
      replyPosted: '回复已发布',
      replyFailed: error => `回复失败：${error}`,
      headerFailed: error => `生成 X 写入校验头失败：${error}`,
      txPageHttp: status => `transaction 页面 HTTP ${status}`,
      missingToken: '缺少 CSRF token',
      replyHttp: status => `回复接口 HTTP ${status}`,
      replyRequestFailed: '回复接口返回错误',
      viewProfileAria: target => `查看 @${target} 的资料`,
      replyThis: '回复这条评论',
      viewCommenter: '查看评论者资料',
      profile: '资料',
      replyCount: (count, text) => `回复 ${text}`,
      repostCount: (count, text) => `转发 ${text}`,
      viewCount: (count, text) => `${text} 查看`,
      commentsTitle: count => count > 0 ? `评论 · ${count}` : '评论',
      comments: '评论',
      originalPost: '原帖',
      noComments: '暂无评论',
      firstPage: '仅显示首屏评论',
      commentsLoadFailed: '评论加载失败，可能是 X 接口已更新。',
      retry: '重试',
      openPostNewTab: '在新标签页打开帖子',
      loadingComments: '正在加载评论…',
      dialogAria: '帖子评论',
      closeComments: '关闭评论',
    },
    en: {
      navExpand: 'Expand navigation',
      navCollapse: 'Collapse navigation',
      yesterday: clock => `Yesterday·${clock}`,
      date: (date, now) => (date.getFullYear() === now.getFullYear() ? DATE_EN : DATE_EN_YEAR).format(date),
      mediaMixed: count => ({
        visible: `🎬 Media · ${count} items`,
        accessible: `Expand media (${count} items)`,
        expanded: 'Collapse media',
        suffix: ` (${count} items)`,
      }),
      mediaVideo: {
        visible: '🎬 Video',
        accessible: 'Expand video',
        expanded: 'Collapse video',
        suffix: '',
      },
      mediaImage: {
        visible: '🖼️ Image',
        accessible: 'Expand image',
        expanded: 'Collapse image',
        suffix: '',
      },
      mediaImages: count => ({
        visible: `🖼️ Images · ${count}`,
        accessible: `Expand images (${count})`,
        expanded: 'Collapse images',
        suffix: ` (${count})`,
      }),
      previewMixed: count => `${count} items · originals/covers`,
      previewVideoCovers: count => count > 1 ? `${count} video covers` : 'Video cover',
      previewOriginals: count => count > 1 ? `${count} images · originals` : 'Original',
      previewIndex: (index, count) => `${index} / ${count} · Original`,
      unknownUser: 'Unknown user',
      videoBadge: 'Video',
      followers: (count, text) => `${text} ${Number(count) === 1 ? 'Follower' : 'Followers'}`,
      following: (count, text) => `${text} Following`,
      openProfile: 'Open profile on X',
      like: 'Like',
      unlike: 'Unlike',
      actionFailed: 'Action failed',
      likeRequestFailed: 'Like request failed',
      replyLabel: 'Reply to ',
      replyPlaceholder: 'Post your reply…',
      replyAria: target => `Reply to @${target}`,
      cancel: 'Cancel',
      reply: 'Reply',
      posting: 'Posting…',
      replyPosted: 'Reply posted',
      replyFailed: error => `Reply failed: ${error}`,
      headerFailed: error => `Couldn't generate X's request header: ${error}`,
      txPageHttp: status => `Transaction page HTTP ${status}`,
      missingToken: 'Missing CSRF token',
      replyHttp: status => `Reply request HTTP ${status}`,
      replyRequestFailed: 'Reply request failed',
      viewProfileAria: target => `View @${target}'s profile`,
      replyThis: 'Reply to this comment',
      viewCommenter: 'View commenter profile',
      profile: 'Profile',
      replyCount: (count, text) => `${text} ${Number(count) === 1 ? 'reply' : 'replies'}`,
      repostCount: (count, text) => `${text} ${Number(count) === 1 ? 'repost' : 'reposts'}`,
      viewCount: (count, text) => `${text} ${Number(count) === 1 ? 'view' : 'views'}`,
      commentsTitle: count => count > 0 ? `Comments · ${count}` : 'Comments',
      comments: 'Comments',
      originalPost: 'Original post',
      noComments: 'No comments yet',
      firstPage: 'Showing the first page of comments',
      commentsLoadFailed: "Couldn't load comments. X may have updated its API.",
      retry: 'Retry',
      openPostNewTab: 'Open post in a new tab',
      loadingComments: 'Loading comments…',
      dialogAria: 'Post comments',
      closeComments: 'Close comments',
    },
  };
  let UI_LANG = 'en';
  let STR = TEXT.en;
  function initLocale() {
    const lang = (document.documentElement?.lang || navigator.language || '').toLowerCase();
    UI_LANG = lang.startsWith('zh') ? 'zh' : 'en';
    STR = TEXT[UI_LANG];
  }

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
      --xmp-accent: #B4531F;
      --xmp-accent-deep: #97451A;
      --xmp-accent-soft: #F3E3D3;
      --xmp-like: #A8442E;
      --xmp-ui-font: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
      background-color: var(--xmp-paper) !important;
      color-scheme: light !important;
      color: var(--xmp-ink) !important;
      caret-color: var(--xmp-accent);
      scrollbar-color: #C9C4B6 var(--xmp-paper);
      scrollbar-width: thin;
    }

    html[data-xmp-enabled="1"] ::selection {
      background: var(--xmp-accent-soft);
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

    html[data-xmp-enabled="1"] [data-testid="tweetText"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="tweetText"] *:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="tweetTextarea_0"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="tweetTextarea_0"] *:not([role="dialog"] *){
      color: var(--xmp-ink) !important;
      font-family: var(--xmp-ui-font) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweetText"] {
      font-size: 16px !important;
      line-height: 1.65 !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweetText"] a:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweet"] [style*="color: rgb(29, 155, 240)"] {
      color: var(--xmp-accent) !important;
    }

    /* X 把查看数、标题等文字写成内联浅色（深色主题的 --xmpColorlessText），纸面上必须换成墨色；
       但深色推广卡内例外——那里的浅色是给深底用的，转墨色会变成黑底黑字 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [style*="color: rgb(231, 233, 234)"]:not([data-xmp-dark-surface], [data-xmp-dark-surface] *) {
      color: var(--xmp-ink) !important;
    }


    html[data-xmp-enabled="1"] [data-testid="tweetTextarea_0"]:not([role="dialog"] *){
      background-color: transparent !important;
    }

    html[data-xmp-enabled="1"] [data-testid="User-Name"]:not([role="dialog"] *){
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="User-Name"] [dir="ltr"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] time:not([role="dialog"] *){
      color: var(--xmp-ink-secondary) !important;
      font-size: 13px !important;
      line-height: 1.4 !important;
    }

    html[data-xmp-enabled="1"] [role="tab"]:not([role="dialog"] *){
      color: var(--xmp-ink-secondary) !important;
      font-size: 15px !important;
      line-height: 1.4 !important;
      font-weight: 500 !important;
    }

    html[data-xmp-enabled="1"] [role="tab"][aria-selected="true"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [role="tab"][aria-selected="true"] *:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [role="group"]:not([role="dialog"] *){
      color: var(--xmp-ink-secondary) !important;
      padding-bottom: 8px !important;
    }

    html[data-xmp-enabled="1"] [role="group"] svg:not([role="dialog"] *){
      width: 16px !important;
      height: 16px !important;
      color: var(--xmp-ink-secondary) !important;
      fill: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] span:not([role="dialog"] *){
      font-size: 13px !important;
      color: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] button:hover svg:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [role="group"] a:hover svg:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
      fill: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] button:hover span:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="like"][aria-pressed="true"] svg {
      color: var(--xmp-like) !important;
      fill: var(--xmp-like) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] [data-testid="retweet"][aria-pressed="true"] svg:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [role="group"] [data-testid="bookmark"][aria-pressed="true"] svg:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
      fill: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] [data-testid="like"][aria-pressed="true"] span:not([role="dialog"] *){
      color: var(--xmp-like) !important;
    }

    html[data-xmp-enabled="1"] [role="group"] [data-testid="retweet"][aria-pressed="true"] span:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [role="group"] [data-testid="bookmark"][aria-pressed="true"] span:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="SearchBox_Search_Input"] {
      background-color: var(--xmp-paper-raised) !important;
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="trend"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="trend"] *:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="UserCell"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="UserCell"] *:not([role="dialog"] *){
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

    /* 首次进入/刷新 home 时，tab 栏和发帖框会在 JS 标记前按 X 深色绘制；这里用结构选择器
       提前套上纸色，消除首帧闪黑（JS 的 data-xmp-* 标记仍保留，用于边框和间距等细节） */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(nav[role="navigation"]):not(:has([data-testid="tweet"])) {
      background-color: var(--xmp-paper) !important;
      backdrop-filter: none !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has([data-testid="tweetTextarea_0"], [data-testid="toolBar"]):not(:has([data-testid="tweet"])):not([role="dialog"] *){
      background-color: var(--xmp-paper) !important;
      background-image: none !important;
    }

    /* 未标 tabbar 的标签页（个人主页、推荐关注等）内层 nav 还留着 X 的深色分割线 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] nav[role="navigation"]:not([data-xmp-tabbar] *) {
      border-bottom-color: var(--xmp-hairline) !important;
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

    [data-xmp-tabbar] [role="tab"]:not([role="dialog"] *){
      background-color: var(--xmp-paper) !important;
    }

    [data-xmp-tabbar] [role="tab"][aria-selected="true"]:not([role="dialog"] *){
      border-bottom-color: var(--xmp-accent) !important;
    }

    [data-xmp-tabbar] [role="tab"][aria-selected="true"] div[style*="background-color"]:not([role="dialog"] *){
      background-color: var(--xmp-accent) !important;
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

    [data-xmp-composer] [data-testid="tweetTextarea_0"]:not([role="dialog"] *){
      background-color: transparent !important;
      color: var(--xmp-ink) !important;
    }

    [data-xmp-composer] [data-testid="tweetTextarea_0_label"] *:not([role="dialog"] *){
      color: var(--xmp-ink-secondary) !important;
    }

    [data-xmp-composer] button:has(span) span,
    [data-xmp-composer] button:has(span) svg {
      color: var(--xmp-accent) !important;
      fill: var(--xmp-accent) !important;
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
      background-color: var(--xmp-accent) !important;
      border-color: var(--xmp-accent) !important;
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
      background-color: var(--xmp-accent) !important;
      color: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"]:not(:has([data-testid="tweet"])) [role="button"]:not([data-testid$="-follow"], [data-testid$="-unfollow"]):not(:has([data-testid$="-follow"], [data-testid$="-unfollow"])) span {
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid="card.wrapper"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="card.layoutSmall.media"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="card.layoutLarge.media"]:not([role="dialog"] *){
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid="card.wrapper"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid="card.wrapper"] *:not([role="dialog"] *){
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid="card.wrapper"] a:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
    }

    /* 链接卡片里的媒体角标由 X 用内联白色压在 rgba(0,0,0,.77) 上；保留它的白色，:not([role="dialog"] *)
       否则会被卡片正文的墨色规则覆盖成黑底黑字 */:not([role="dialog"] *)
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid="card.wrapper"] [style*="color: rgb(255, 255, 255)"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid="card.wrapper"] [style*="color: rgb(255, 255, 255)"] *:not([role="dialog"] *){
      color: #FFFFFF !important;
    }

    html[data-xmp-enabled="1"] [data-testid="twitter-article-title"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="twitter-article-title"] *:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"] *:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="twitterArticleRichTextView"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="twitterArticleRichTextView"] *:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="longformRichTextComponent"]:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="longformRichTextComponent"] *:not([role="dialog"] *){
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"] a:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="twitterArticleRichTextView"] a:not([role="dialog"] *),
    html[data-xmp-enabled="1"] [data-testid="longformRichTextComponent"] a:not([role="dialog"] *){
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweet"] div:has(> [data-testid="article-cover-image"]) {
      border-color: transparent !important;
    }

    html[data-xmp-enabled="1"] [data-testid="tweet"] div:has(> [data-testid="article-cover-image"]) > div:last-child,
    html[data-xmp-enabled="1"] [data-testid="tweet"] div:has(> [data-testid="article-cover-image"]) > div:last-child * {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div[role="link"]:has([data-testid="User-Name"]):has([data-testid="tweetText"]):not([role="dialog"] *){
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

    /* Grok 抽屉：深色面板/输入卡由 markGrokSurfaces() 标记；文字和图标按最近的底色翻色，
       彩色气泡里的白字/白图标保持原样 */
    html[data-xmp-enabled="1"] [data-testid="GrokDrawer"] {
      color: var(--xmp-ink) !important;
      font-family: var(--xmp-ui-font) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="GrokDrawer"] [role="textbox"] {
      color: var(--xmp-ink) !important;
      caret-color: var(--xmp-accent);
    }

    html[data-xmp-enabled="1"] [data-xmp-paper-icon] {
      color: var(--xmp-ink-secondary) !important;
      fill: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"] > div {
      border-bottom-color: var(--xmp-rule) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="cellInnerDiv"] [data-testid="Tweet-User-Avatar"] ~ div:last-child:not([data-testid="User-Name"], [data-testid="tweetText"]):not(:has([data-testid="User-Name"], [data-testid="tweetText"])):not([role="dialog"] *){
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
      color: var(--xmp-accent) !important;
    }

    /* 个人主页的操作按钮：关注用暖橙实心，正在关注 / 私信 / 更多用纸面浮起 + 细线，
       悬停取消关注时用暖红提示 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-follow"] {
      background-color: var(--xmp-accent) !important;
      border-color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-follow"] :is(span, div, svg) {
      color: var(--xmp-paper) !important;
      fill: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-testid$="-follow"]:hover {
      background-color: var(--xmp-accent-deep) !important;
      border-color: var(--xmp-accent-deep) !important;
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

    /* 个人主页操作行里可能新增按钮（如已关注用户的「接收通知」铃铛，没有 testid）：
       按行结构统一成纸面浮起 + 细线 + 墨色，关注/正在关注保留自己的实心与描边样式 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > button[data-testid="userActions"]) :is(button, a[role="button"]):not([data-testid$="-follow"], [data-testid$="-unfollow"]) {
      background-color: var(--xmp-paper-raised) !important;
      border: 1px solid var(--xmp-hairline) !important;
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > button[data-testid="userActions"]) :is(button, a[role="button"]):not([data-testid$="-follow"], [data-testid$="-unfollow"]):hover {
      border-color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > button[data-testid="userActions"]) :is(button, a[role="button"]):not([data-testid$="-follow"], [data-testid$="-unfollow"]) svg {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > button[data-testid="userActions"]) [aria-pressed="true"] svg {
      color: var(--xmp-accent) !important;
      fill: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([data-testid="sendDMFromProfile"], [data-testid="userActions"], [data-testid="editProfileButton"]) * {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([data-testid="sendDMFromProfile"], [data-testid="userActions"], [data-testid="editProfileButton"]):hover {
      border-color: var(--xmp-accent) !important;
    }

    /* 详情页/文章页顶部条：X 用半透明黑 + blur，纸面下换成纸色 + 细线。
       结构选择器让它一出现就是纸色；data-xmp-appbar 是结构变化时的运行时兜底。 */
    html[data-xmp-enabled="1"] [data-xmp-appbar],
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > div > [data-testid="app-bar-back"]) {
      background-color: var(--xmp-paper) !important;
      backdrop-filter: none !important;
      box-shadow: inset 0 -1px 0 var(--xmp-hairline);
    }

    html[data-xmp-enabled="1"] [data-xmp-appbar] :is(span, svg):not([data-testid$="-follow"] *, [data-testid$="-unfollow"] *, [data-testid="icon-verified"]),
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(> div > div > [data-testid="app-bar-back"]) :is(span, svg):not([data-testid$="-follow"] *, [data-testid$="-unfollow"] *, [data-testid="icon-verified"]) {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-xmp-dark-surface],
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [data-xmp-dark-surface] :is(span, div, p, svg):not(a *, button *) {
      color: #FFFFFF !important;
      fill: #FFFFFF !important;
    }

    /* 「你尚未通过认证」推广卡是深绿底（内联 rgb(0,67,41)）：保留深色卡，卡内文字、链接和
       右上角关闭图标一律纯白（不同账号下文字可能包在链接里，不能排除 a 的后代）；
       白底「获得认证」CTA 单独恢复为深色文字。内联样式串的空格写法各版本不一致，两种都匹配。 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([style*="background-color: rgb(0, 67, 41)"], [style*="background-color: rgb(0,67,41)"]) :is(span, div, p, svg, a) {
      color: #FFFFFF !important;
      fill: #FFFFFF !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([style*="background-color: rgb(0, 67, 41)"], [style*="background-color: rgb(0,67,41)"]) :is([style*="background-color: rgb(239, 243, 244)"], [style*="background-color: rgb(239,243,244)"]),
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] :is([style*="background-color: rgb(0, 67, 41)"], [style*="background-color: rgb(0,67,41)"]) :is([style*="background-color: rgb(239, 243, 244)"], [style*="background-color: rgb(239,243,244)"]) * {
      color: rgb(15, 20, 25) !important;
    }

    /* 用户悬浮资料卡：X 用 rgb(20,20,20) 深色卡 + 16px 圆角，纸面下换成纸面浮起 + 细线 */
    html[data-xmp-enabled="1"] [data-testid="HoverCard"] {
      background-color: var(--xmp-paper-raised) !important;
      border: 1px solid var(--xmp-hairline) !important;
      box-shadow: 0 12px 32px rgba(27, 27, 27, 0.18) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="HoverCard"] :is(div, span, p) {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="HoverCard"] a,
    html[data-xmp-enabled="1"] [data-testid="HoverCard"] a[href^="http"] :is(span, div, p) {
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="HoverCard"] svg {
      color: var(--xmp-ink-secondary) !important;
      fill: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="HoverCard"] [data-testid$="-follow"] {
      background-color: var(--xmp-accent) !important;
      border-color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="HoverCard"] [data-testid$="-follow"] :is(span, div, svg) {
      color: var(--xmp-paper) !important;
      fill: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="HoverCard"] [data-testid$="-unfollow"] {
      background-color: var(--xmp-paper) !important;
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="HoverCard"] [data-testid$="-unfollow"] :is(span, div, svg) {
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
      background-color: var(--xmp-accent) !important;
      border-color: var(--xmp-accent) !important;
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

    /* 弹窗保持 X 原生配色：只把弹窗容器的基础色设回浅色，断开 body 墨色的继承；
       X 自己写了显式颜色的元素（按钮、角标、次要文字）都不受影响 */
    html[data-xmp-enabled="1"] [role="dialog"] {
      color: rgb(231, 233, 234) !important;
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

    /* 文章末尾的升级横幅 */:not([role="dialog"] *)
    html[data-xmp-enabled="1"] [data-testid="twitterArticleReadView"] [role="status"]:not([role="dialog"] *){
      background-color: var(--xmp-paper-raised) !important;
      border: 1px solid var(--xmp-hairline) !important;
    }

    /* 文章阅读进度条 */
    html[data-xmp-enabled="1"] [data-testid="progressBar-bar"] {
      background-color: var(--xmp-accent) !important;
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
      background-color: var(--xmp-accent-soft) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-composer] button:has(span):not([data-testid="tweetButtonInline"]):hover {
      background-color: var(--xmp-accent-soft) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-composer] [data-testid="tweetButtonInline"]:not(:disabled):hover {
      background-color: var(--xmp-accent-deep) !important;
      border-color: var(--xmp-accent-deep) !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] button:hover {
      background-color: var(--xmp-accent-soft) !important;
      border-color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [role="status"][data-keep-composer-open] button:hover * {
      color: var(--xmp-accent) !important;
      fill: var(--xmp-accent) !important;
    }

    /* 探索/搜索顶栏标签：选中下划线是 X 内联蓝色，统一成暖橙；未选中用次要墨色 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [role="tab"] *:not([role="dialog"] *) {
      color: var(--xmp-ink-secondary) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [role="tab"][aria-selected="true"] *:not([role="dialog"] *) {
      color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [role="tab"] [style*="background-color: rgb(29, 155, 240)"],
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] [role="tab"] [style*="background-color:rgb(29,155,240)"] {
      background-color: var(--xmp-accent) !important;
    }

    /* 搜索框：探索页的外壳是纯黑胶囊、搜索页是深色描边，都换成纸面浮起 + 细线；
       外壳由 markExploreSurfaces() 标记，输入框本身改为透明 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] form[role="search"] [data-testid="SearchBox_Search_Input"] {
      background-color: transparent !important;
    }

    /* 首帧：搜索框外壳和它的容器都是 X 深色 class，不能等 JS 标记，先按结构选择器上纸色 */
    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] div:has(form[role="search"]):not([role="dialog"] *) {
      background-color: var(--xmp-paper) !important;
      background-image: none !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] form[role="search"] > div > div {
      background-color: var(--xmp-paper-raised) !important;
      border: 1px solid var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="primaryColumn"] form[role="search"] svg {
      color: var(--xmp-ink-secondary) !important;
      fill: var(--xmp-ink-secondary) !important;
    }

    /* 探索/搜索空状态和错误态的主行动按钮（「搜索」「重试」）由 X 内联蓝色填充，
       按主题强调色绘制；普通文字链接不受影响 */
    html[data-xmp-enabled="1"]:is([data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="primaryColumn"] :is(a, button, [role="button"])[style*="background-color: rgb(29, 155, 240)"] {
      background-color: var(--xmp-accent) !important;
      border-color: var(--xmp-accent) !important;
    }

    /* 探索/搜索的深色表面（模块卡、侧栏卡、搜索框外壳、"显示更多"条）按计算样式标记一次：
       已有 1px 边框的只换边框色，无边框的小胶囊用内阴影补细线，避免撑大布局 */
    html[data-xmp-enabled="1"] :is([data-xmp-paper-surface], [data-xmp-paper-chip]) {
      background-color: var(--xmp-paper-raised) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-paper-surface] {
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-paper-chip] {
      box-shadow: inset 0 0 0 1px var(--xmp-hairline) !important;
    }

    /* 深底上为浅色文字写的颜色在纸面上要翻回来：浅色→墨色，X 蓝→暖橙；
       品牌色（党派色、比分绿勾等）不在标记范围内 */
    html[data-xmp-enabled="1"] [data-xmp-paper-text]:not([role="dialog"] *) {
      color: var(--xmp-ink) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-paper-link]:not([role="dialog"] *) {
      color: var(--xmp-accent) !important;
    }

    /* 模块卡内的按钮描边统一细线，图标跟随墨色 */
    html[data-xmp-enabled="1"] [data-xmp-module] :is(button, [role="button"]) {
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-module] :is(button, [role="button"]):not([data-xmp-paper-surface]) {
      box-shadow: inset 0 0 0 1px var(--xmp-hairline);
    }

    html[data-xmp-enabled="1"] [data-xmp-module] :is(button, [role="button"]) svg {
      color: var(--xmp-ink) !important;
      fill: var(--xmp-ink) !important;
    }

    /* 侧栏「推荐关注」的关注按钮沿用主按钮配色 */
    html[data-xmp-enabled="1"] [data-testid="sidebarColumn"] [data-testid$="-follow"] {
      background-color: var(--xmp-accent) !important;
      border-color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="sidebarColumn"] [data-testid$="-follow"] :is(span, div, svg) {
      color: var(--xmp-paper) !important;
      fill: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] [data-testid="sidebarColumn"] [data-testid$="-follow"]:hover {
      background-color: var(--xmp-accent-deep) !important;
      border-color: var(--xmp-accent-deep) !important;
    }

    /* 搜索过滤单选按钮：选中用暖橙实心 + 纸色勾，未选中用纸面 + 细线 */
    html[data-xmp-enabled="1"] [data-xmp-paper-surface] [role="radiogroup"] label > div > div:last-child > div {
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-paper-surface] [role="radiogroup"] label > div > div:last-child > div > div {
      background-color: var(--xmp-paper) !important;
      border-color: var(--xmp-hairline) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-paper-surface] [role="radiogroup"] label:has(input:checked) > div > div:last-child > div > div {
      background-color: var(--xmp-accent) !important;
      border-color: var(--xmp-accent) !important;
    }

    html[data-xmp-enabled="1"] [data-xmp-paper-surface] [role="radiogroup"] svg {
      color: var(--xmp-paper) !important;
      fill: var(--xmp-paper) !important;
    }

    html[data-xmp-enabled="1"] :is(main, header[role="banner"]) :is(a, button, [role="button"], [role="tab"], [role="link"]):focus-visible {
      outline: 2px solid var(--xmp-accent) !important;
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
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header[role="banner"] {
        width: 88px !important;
        min-width: 88px !important;
        flex: 0 0 88px !important;
        background: var(--xmp-paper) !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav {
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

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a span,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button span {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button > div:first-child > div[dir="ltr"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button {
        justify-content: center !important;
        align-items: center !important;
        flex: 0 0 auto !important;
        height: auto !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button > div:first-child {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button:hover > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a:focus-visible > div:first-child,
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button:focus-visible > div:first-child {
        background-color: var(--xmp-accent-soft) !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav {
        width: 240px !important;
        box-shadow: 4px 0 16px rgba(27, 27, 27, 0.12);
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a span,
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button span {
        display: inline !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a > div:first-child > div[dir="ltr"],
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button > div:first-child > div[dir="ltr"] {
        display: block !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav a,
      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) header nav button {
        justify-content: flex-start !important;
        align-items: flex-start !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"]) header[role="banner"] [data-testid="SideNav_NewTweet_Button"] {
        display: none !important;
      }

      /* 探索/搜索没有首页的内联发帖框：保留左轨发帖入口，把 X 的宽版文字按钮收成 52px 圆形 FAB，
         否则它会停在 275px 宽版位置、露在收起轨道和正文之间 */
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="explore"], [data-xmp-route="search"]) header[role="banner"] [data-testid="SideNav_NewTweet_Button"] {
        position: fixed !important;
        left: 18px !important;
        bottom: 96px !important;
        top: auto !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        width: 52px !important;
        height: 52px !important;
        min-width: 52px !important;
        padding: 0 !important;
        border-radius: 9999px !important;
        border-color: transparent !important;
        background-color: var(--xmp-accent) !important;
        box-shadow: 0 6px 18px rgba(27, 27, 27, 0.18);
        z-index: 1001 !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="explore"], [data-xmp-route="search"]) header[role="banner"] [data-testid="SideNav_NewTweet_Button"] > div {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="explore"], [data-xmp-route="search"]) header[role="banner"] [data-testid="SideNav_NewTweet_Button"]::before {
        content: "";
        width: 24px;
        height: 24px;
        background-color: var(--xmp-paper);
        -webkit-mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H14v1.5h-.5V16H12v-1.5h-.5V13H10v-1.5h1.5V10H13v1.5h1.5V13H16v-1.5h-1.5V10H16z'/%3E%3C/svg%3E") center / contain no-repeat;
        mask: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M23 3c-6.62-.1-10.38 2.421-13.05 6.03C7.29 12.61 6 17.331 6 22h2c0-1.007.07-2.012.19-3H12c4.1 0 7.48-3.082 7.94-7.054C22.79 10.147 23.17 6.359 23 3zm-7 8h-1.5v2H14v1.5h-.5V16H12v-1.5h-.5V13H10v-1.5h1.5V10H13v1.5h1.5V13H16v-1.5h-1.5V10H16z'/%3E%3C/svg%3E") center / contain no-repeat;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="explore"], [data-xmp-route="search"]) header[role="banner"] [data-testid="SideNav_NewTweet_Button"]:hover {
        background-color: var(--xmp-accent-deep) !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="sidebarColumn"] {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) main {
        align-items: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) main > div {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) main > div > div > div {
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="primaryColumn"] {
        width: 760px !important;
        max-width: 760px !important;
        flex: 0 0 760px !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-xmp-inner-timeline] {
        width: 100% !important;
        max-width: 100% !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="cellInnerDiv"],
      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="tweetText"] {
        max-width: 100% !important;
      }

      @media (max-width: 1599px) and (min-width: 1280px) {
        html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="primaryColumn"] {
          width: 720px !important;
          max-width: 720px !important;
          flex: 0 0 720px !important;
        }
      }

      @media (max-width: 1279px) and (min-width: 1000px) {
        html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="primaryColumn"] {
          width: 680px !important;
          max-width: 680px !important;
          flex: 0 0 680px !important;
        }
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-xmp-rail-panel] {
        left: 0 !important;
        right: auto !important;
        width: 88px !important;
        min-width: 88px !important;
        max-width: 88px !important;
        z-index: 1000 !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-xmp-rail-panel] {
        width: 240px !important;
        min-width: 240px !important;
        max-width: 240px !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="SideNav_AccountSwitcher_Button"] {
        width: 72px !important;
        min-width: 0 !important;
        padding: 6px !important;
        justify-content: center !important;
      }

      html[data-xmp-enabled="1"][data-xmp-nav-expanded="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="SideNav_AccountSwitcher_Button"] {
        width: 224px !important;
        padding: 12px !important;
        justify-content: flex-start !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="SideNav_AccountSwitcher_Button"] > div:last-child {
        display: none !important;
      }

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):not([data-xmp-nav-expanded="1"]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) [data-testid="SideNav_AccountSwitcher_Button"] > div:not(:first-child) {
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

      html[data-xmp-enabled="1"]:not([data-xmp-degraded]):is([data-xmp-route="home"], [data-xmp-route="status"], [data-xmp-route="profile"], [data-xmp-route="people"], [data-xmp-route="explore"], [data-xmp-route="search"]) .xmp-nav-toggle {
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
        color: var(--xmp-accent);
        background-color: var(--xmp-accent-soft);
      }

      .xmp-nav-toggle:focus-visible {
        color: var(--xmp-accent);
        background-color: var(--xmp-accent-soft);
        outline: 2px solid var(--xmp-accent);
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
      border-color: var(--xmp-accent);
      color: var(--xmp-accent);
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
      outline: 2px solid var(--xmp-accent);
      outline-offset: 2px;
    }

    html[data-xmp-enabled="1"] [data-xmp-media-state="expanded"] .xmp-media-toggle {
      color: var(--xmp-accent);
      border-color: var(--xmp-accent);
      background: var(--xmp-accent-soft);
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
      /* left:50% + width:auto makes shrink-to-fit use only the right half of the
         viewport; max-content lets the card grow to its real max-width. */
      width: max-content;
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

  const COMMENTS_CSS = `
    .xmp-comments,
    .xmp-comments *,
    .xmp-comments-profile,
    .xmp-comments-profile * {
      box-sizing: border-box;
    }

    .xmp-comments {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .xmp-comments-backdrop {
      position: absolute;
      inset: 0;
      background-color: rgba(27, 27, 27, 0.48);
    }

    .xmp-comments-panel {
      position: relative;
      display: flex;
      flex-direction: column;
      width: min(720px, 94vw);
      max-height: min(86vh, 900px);
      overflow: hidden;
      color: var(--xmp-ink);
      background-color: var(--xmp-paper);
      border: 1px solid var(--xmp-hairline);
      border-radius: 16px;
      box-shadow: 0 24px 64px rgba(27, 27, 27, 0.28);
      font-family: var(--xmp-ui-font);
    }

    .xmp-comments-panel:focus {
      outline: none;
    }

    .xmp-comments-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      border-bottom: 1px solid var(--xmp-hairline);
    }

    .xmp-comments-header h2 {
      margin: 0;
      color: var(--xmp-ink);
      font-size: 18px;
      line-height: 1.3;
      font-weight: 700;
    }

    .xmp-comments-close {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      color: var(--xmp-ink);
      background-color: var(--xmp-paper-raised);
      border: 1px solid var(--xmp-hairline);
      border-radius: 9999px;
      font: inherit;
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
    }

    .xmp-comments-close:hover {
      color: var(--xmp-accent);
      border-color: var(--xmp-accent);
      background-color: var(--xmp-accent-soft);
    }

    .xmp-comments-close:focus-visible {
      outline: 2px solid var(--xmp-accent);
      outline-offset: 2px;
    }

    .xmp-comments-body {
      min-height: 120px;
      padding: 0 18px 18px;
      overflow-y: auto;
      overscroll-behavior: contain;
      scrollbar-width: thin;
      scrollbar-color: #C9C4B6 var(--xmp-paper);
    }

    .xmp-comments-status,
    .xmp-comments-error,
    .xmp-comments-empty {
      padding: 40px 8px;
      color: var(--xmp-ink-secondary);
      font-size: 14px;
      line-height: 1.6;
      text-align: center;
    }

    .xmp-comments-note {
      padding: 16px 8px 4px;
      color: var(--xmp-ink-secondary);
      font-size: 12px;
      line-height: 1.5;
      text-align: center;
    }

    .xmp-comments-error button {
      margin-top: 12px;
      padding: 8px 16px;
      color: var(--xmp-paper);
      background-color: var(--xmp-accent);
      border: 1px solid var(--xmp-accent);
      border-radius: 9999px;
      font: inherit;
      font-size: 14px;
      cursor: pointer;
    }

    .xmp-comments-error button:hover {
      background-color: var(--xmp-accent-deep);
      border-color: var(--xmp-accent-deep);
    }

    .xmp-comments-original {
      margin-top: 14px;
      padding: 14px;
      background-color: var(--xmp-paper-raised);
      border: 1px solid var(--xmp-hairline);
      border-radius: 12px;
    }

    .xmp-comments-original-label {
      margin-bottom: 8px;
      color: var(--xmp-ink-secondary);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-reply {
      position: relative;
      display: grid;
      grid-template-columns: 40px minmax(0, 1fr);
      gap: 10px;
      padding: 14px 0;
    }

    .xmp-comments-replies > .xmp-comments-thread {
      border-bottom: 1px solid var(--xmp-rule);
    }

    .xmp-comments-replies > .xmp-comments-thread:last-child {
      border-bottom: 0;
    }

    .xmp-comments-original .xmp-comments-reply {
      padding: 0;
    }

    /* 嵌套回复的连接线：竖线沿父头像中心向下，末端转弯接到子头像左边。 */
    .xmp-comments-thread {
      position: relative;
    }

    .xmp-comments-children > .xmp-comments-thread::before {
      content: "";
      position: absolute;
      left: -16px;
      top: 0;
      bottom: 0;
      width: 2px;
      background-color: var(--xmp-rule);
      pointer-events: none;
    }

    .xmp-comments-children > .xmp-comments-thread::after {
      content: "";
      position: absolute;
      left: -14px;
      top: 33px;
      width: 14px;
      height: 2px;
      background-color: var(--xmp-rule);
      pointer-events: none;
    }

    /* 最后一个回复是分支终点：竖线停在子头像中心并转弯，转弯处做圆角。 */
    .xmp-comments-children > .xmp-comments-thread:last-child::before {
      bottom: auto;
      width: 16px;
      height: 35px;
      box-sizing: border-box;
      background: transparent;
      border-left: 2px solid var(--xmp-rule);
      border-bottom: 2px solid var(--xmp-rule);
      border-bottom-left-radius: 8px;
    }

    .xmp-comments-children > .xmp-comments-thread:last-child::after {
      display: none;
    }

    .xmp-comments-avatar {
      display: block;
      width: 40px;
      height: 40px;
      object-fit: cover;
      background-color: var(--xmp-paper-raised);
      border-radius: 9999px;
    }

    .xmp-comments-main {
      min-width: 0;
    }

    .xmp-comments-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 6px;
      color: var(--xmp-ink-secondary);
      font-size: 13px;
      line-height: 1.4;
    }

    .xmp-comments-name {
      color: var(--xmp-ink);
      font-size: 15px;
      font-weight: 700;
    }

    .xmp-comments-handle,
    .xmp-comments-time {
      color: var(--xmp-ink-secondary);
    }

    .xmp-comments-text {
      margin-top: 4px;
      color: var(--xmp-ink);
      font-size: 15px;
      line-height: 1.65;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .xmp-comments-text a {
      color: var(--xmp-accent);
      text-decoration: none;
    }

    .xmp-comments-text a:hover {
      text-decoration: underline;
    }

    .xmp-comments-media {
      display: grid;
      gap: 4px;
      margin-top: 8px;
      overflow: hidden;
      border-radius: 10px;
    }

    .xmp-comments-media.one {
      grid-template-columns: 1fr;
    }

    .xmp-comments-media.many {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .xmp-comments-media-item {
      position: relative;
      display: block;
      overflow: hidden;
      background-color: var(--xmp-paper-raised);
    }

    .xmp-comments-media img {
      display: block;
      width: 100%;
      max-height: 240px;
      object-fit: cover;
    }

    .xmp-comments-media.one img {
      max-height: 320px;
    }

    .xmp-comments-media-badge {
      position: absolute;
      left: 8px;
      bottom: 8px;
      padding: 2px 6px;
      color: #FFFFFF;
      background-color: rgba(27, 27, 27, 0.72);
      border-radius: 4px;
      font-size: 11px;
      line-height: 1.4;
    }

    .xmp-comments-stats {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      color: var(--xmp-ink-secondary);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 18px;
      margin-top: 8px;
    }

    .xmp-comments-action {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 0;
      color: var(--xmp-ink-secondary);
      background: transparent;
      border: 0;
      font: inherit;
      font-size: 12px;
      line-height: 1.4;
      cursor: pointer;
    }

    .xmp-comments-action:hover {
      color: var(--xmp-accent);
    }

    .xmp-comments-action svg {
      width: 16px;
      height: 16px;
      fill: currentColor;
    }

    .xmp-comments-action.is-active,
    .xmp-comments-action.is-active svg {
      color: var(--xmp-accent);
      fill: var(--xmp-accent);
    }

    .xmp-comments-action:focus-visible {
      outline: 2px solid var(--xmp-accent);
      outline-offset: 2px;
    }

    .xmp-comments-action.is-open {
      color: var(--xmp-accent);
    }

    .xmp-comments-composer {
      margin-top: 10px;
      padding: 10px;
      background-color: var(--xmp-paper-raised);
      border: 1px solid var(--xmp-hairline);
      border-radius: 10px;
    }

    .xmp-comments-composer-label {
      margin-bottom: 6px;
      color: var(--xmp-ink-secondary);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-composer-label span {
      color: var(--xmp-accent);
    }

    .xmp-comments-composer-input {
      display: block;
      width: 100%;
      min-height: 64px;
      max-height: 180px;
      padding: 8px 10px;
      color: var(--xmp-ink);
      background-color: var(--xmp-paper);
      border: 1px solid var(--xmp-hairline);
      border-radius: 8px;
      font: inherit;
      font-size: 14px;
      line-height: 1.5;
      resize: vertical;
    }

    .xmp-comments-composer-input:focus {
      outline: none;
      border-color: var(--xmp-accent);
      box-shadow: 0 0 0 2px var(--xmp-accent-soft);
    }

    .xmp-comments-composer-footer {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
    }

    .xmp-comments-composer-count {
      margin-right: auto;
      color: var(--xmp-ink-secondary);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-composer-cancel,
    .xmp-comments-composer-submit {
      padding: 6px 12px;
      border-radius: 9999px;
      font: inherit;
      font-size: 12px;
      line-height: 1.4;
      cursor: pointer;
    }

    .xmp-comments-composer-cancel {
      color: var(--xmp-ink-secondary);
      background-color: transparent;
      border: 1px solid var(--xmp-hairline);
    }

    .xmp-comments-composer-submit {
      color: #FFFFFF;
      background-color: var(--xmp-accent);
      border: 1px solid var(--xmp-accent);
    }

    .xmp-comments-composer-submit:not(:disabled):hover {
      background-color: var(--xmp-accent-deep);
      border-color: var(--xmp-accent-deep);
    }

    .xmp-comments-composer-submit:disabled {
      opacity: 0.5;
      cursor: default;
    }

    .xmp-comments-composer-cancel:hover {
      color: var(--xmp-accent);
      border-color: var(--xmp-accent);
    }

    .xmp-comments-composer-cancel:focus-visible,
    .xmp-comments-composer-submit:focus-visible {
      outline: 2px solid var(--xmp-accent);
      outline-offset: 2px;
    }

    .xmp-comments-composer-error {
      margin-top: 6px;
      color: var(--xmp-like);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-notice {
      padding: 8px 18px;
      color: var(--xmp-accent-deep);
      background-color: var(--xmp-accent-soft);
      border-bottom: 1px solid var(--xmp-hairline);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-reply-to {
      margin-top: 3px;
      color: var(--xmp-ink-secondary);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-reply-to span {
      color: var(--xmp-accent);
    }

    .xmp-comments-children {
      margin-left: 20px;
      padding-left: 16px;
    }

    .xmp-comments-reply.has-children {
      position: relative;
    }

    .xmp-comments-reply.has-children::after {
      content: "";
      position: absolute;
      left: 20px;
      top: 54px;
      bottom: 0;
      width: 2px;
      background-color: var(--xmp-rule);
      pointer-events: none;
    }

    .xmp-comments-avatar-button {
      width: 40px;
      height: 40px;
      padding: 0;
      background: transparent;
      border: 0;
      border-radius: 9999px;
      cursor: pointer;
    }

    .xmp-comments-avatar-button:focus-visible {
      outline: 2px solid var(--xmp-accent);
      outline-offset: 2px;
    }

    .xmp-comments-avatar-button .xmp-comments-avatar {
      width: 40px;
      height: 40px;
    }

    .xmp-comments-profile {
      position: fixed;
      z-index: 2100;
      width: 320px;
      max-width: calc(100vw - 16px);
      max-height: min(420px, 70vh);
      overflow-y: auto;
      overscroll-behavior: contain;
      padding: 12px;
      background-color: var(--xmp-paper-raised);
      border: 1px solid var(--xmp-hairline);
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(27, 27, 27, 0.18);
    }

    .xmp-comments-profile-head {
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .xmp-comments-profile-avatar {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 9999px;
      background-color: var(--xmp-paper);
    }

    .xmp-comments-profile-name {
      color: var(--xmp-ink);
      font-size: 15px;
      font-weight: 700;
      line-height: 1.3;
    }

    .xmp-comments-profile-verified {
      margin-left: 4px;
      color: #1D9BF0;
      font-size: 13px;
    }

    .xmp-comments-profile-handle {
      color: var(--xmp-ink-secondary);
      font-size: 13px;
      line-height: 1.4;
    }

    .xmp-comments-profile-bio {
      margin-top: 8px;
      color: var(--xmp-ink);
      font-size: 13px;
      line-height: 1.55;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }

    .xmp-comments-profile-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
      color: var(--xmp-ink-secondary);
      font-size: 12px;
      line-height: 1.4;
    }

    .xmp-comments-profile-link {
      display: inline-block;
      margin-top: 10px;
      color: var(--xmp-accent);
      font-size: 13px;
      text-decoration: none;
    }

    .xmp-comments-profile-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 640px) {
      .xmp-comments {
        padding: 0;
      }

      .xmp-comments-panel {
        width: 100%;
        height: 100%;
        max-height: 100vh;
        border: 0;
        border-radius: 0;
      }
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
  let surfaceObserver = null;
  let surfaceScanTimer = null;
  let surfacePrimary = null;
  let grokObserver = null;
  let grokTimer = null;
  let grokRoot = null;
  let grokClickBound = false;
  let commentsModal = null;
  let commentsAbort = null;
  let commentsReturnFocus = null;
  let commentsKeyHandler = null;
  let commentsProfile = null;
  let commentsComposer = null;
  let commentsTweetId = null;
  let commentsHref = null;
  let profileShowTimer = null;
  let profileHideTimer = null;
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

  // 单个表面标记失败不应中断整轮启动/扫描（否则后面的轨道、按钮都会静默丢失）。
  function safe(label, run) {
    try {
      run();
    } catch (error) {
      warnOnce(`surface-${label}`, `${label} 失败：${error}`);
    }
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
    injectStyle('xmp-comments', COMMENTS_CSS);
  }

  function setNavExpanded(value) {
    navExpanded = value;
    const root = document.documentElement;
    if (value) root.dataset.xmpNavExpanded = '1';
    else delete root.dataset.xmpNavExpanded;
    const toggle = document.querySelector('.xmp-nav-toggle');
    if (!toggle) return;
    const label = value ? STR.navCollapse : STR.navExpand;
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

  // 保留给 X 自己的一级路径；其余 /<handle> 视为个人主页（含 /handle/media 等子页）。
  const RESERVED_HANDLES = new Set([
    'home', 'explore', 'notifications', 'messages', 'i', 'search', 'settings', 'compose',
    'login', 'logout', 'signup', 'tos', 'privacy', 'premium', 'grok', 'jobs', 'communities',
    'about', 'download', 'account', 'lists', 'bookmarks', 'verified', 'connect_people',
    'topics', 'intent', 'share', 'hashtag', 'rules', 'help', 'ads', 'create', 'migrate',
    'oauth', 'welcome', 'flow', 'sms', 'accessibility', 'safety', 'following',
  ]);
  const PROFILE_PATH = /^\/([A-Za-z0-9_]{1,15})(?:\/(?:with_replies|media|likes|highlights|articles|followers|following|affiliates|verified_followers|followers_you_follow))?\/?$/;

  // X 的付费/认证营销页（Premium 订阅、认证申请）本身是深色设计，主题完全不介入，
  // 否则全局墨色会把它们深色模块里的文字压成黑底黑字。
  const STANDALONE_PATH = /^\/i\/(?:premium_sign_up|verification|en\/verification|flow\/)/;

  function classifyRoute(pathname) {
    if (STANDALONE_PATH.test(pathname) || pathname === '/premium') return 'standalone';
    if (pathname === '/' || pathname === '/home') return 'home';
    if (pathname.includes('/status/')) return 'status';
    if (pathname === '/explore' || pathname.startsWith('/explore/')) return 'explore';
    if (pathname === '/search' || pathname.startsWith('/search/')) return 'search';
    const match = pathname.match(PROFILE_PATH);
    if (match && !RESERVED_HANDLES.has(match[1].toLowerCase())) return 'profile';
    if (pathname === '/i/connect_people') return 'people';
    return 'other';
  }

  function isWideRoute(value) {
    return value === 'home' || value === 'status' || value === 'profile' || value === 'people' ||
      value === 'explore' || value === 'search';
  }

  // 探索/搜索保持 X 原生版面，只做主题换肤；这两页的深色表面靠运行时标记，需要跟随流式渲染。
  function isSurfaceRoute(value) {
    return value === 'explore' || value === 'search';
  }

  function setRoute() {
    route = classifyRoute(window.location.pathname);
    const root = document.documentElement;
    root.dataset.xmpRoute = route;
    if (route === 'standalone') root.removeAttribute('data-xmp-enabled');
    else if (enabled) root.dataset.xmpEnabled = '1';
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

  // 帖子时间戳链接指向帖子本身；引用帖的链接也在单元格里，必须优先取带 time 的那个，
  // 否则锚点可能落到被引用的帖子上，返回后对齐到别的单元格。
  function cellStatusLink(cell) {
    if (!cell) return null;
    const links = cell.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      if (link.querySelector('time[datetime]')) return link;
    }
    return links[0] || null;
  }

  // 返回途中重建的帖子按离开前的展开态标注；只在 home 生效，避免这份记录影响个人主页的扫描。
  function wantsExpandedMedia(tweet) {
    if (route !== 'home') return false;
    if (!homeReturn || !homeReturn.expanded || homeReturn.expanded.size === 0) return false;
    const link = cellStatusLink(tweet.closest(CELL));
    return !!link && homeReturn.expanded.has(link.getAttribute('href'));
  }

  // 用户在 home 上手动展开/收起后同步记录，后续 X 再次渲染同一帖时保持当前状态。
  function rememberHomeMedia(tweet, expanded) {
    if (route !== 'home' || !homeReturn?.expanded) return;
    const link = cellStatusLink(tweet.closest(CELL));
    if (!link) return;
    const href = link.getAttribute('href');
    if (expanded) homeReturn.expanded.add(href);
    else homeReturn.expanded.delete(href);
  }

  // 离开 home 时记录滚动量、视口顶部帖子和已展开媒体；返回后按这份记录恢复。
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
      const link = cellStatusLink(cell);
      if (!link) continue;
      anchor = { href: link.getAttribute('href'), top: Math.round(rect.top) };
      break;
    }
    const expanded = new Set();
    for (const tweet of primary.querySelectorAll('[data-xmp-media-state="expanded"]')) {
      const link = cellStatusLink(tweet.closest(CELL));
      if (link) expanded.add(link.getAttribute('href'));
    }
    homeReturn = { y, anchor, expanded };
  }

  // X 从详情页返回首页时会重建时间线，滚动位置会回到顶部。回来后把锚点帖子滚回原来的
  // 视口位置，并恢复媒体展开态，避免重建后集体折叠、页面高度突变。
  // 只在校正窗口内跟随锚点；用户一旦滚动（含拖动滚动条）、点击或按键就把控制权交还。
  function restoreHomeReturn() {
    const state = homeReturn;
    if (!state) return;
    const token = ++homeRestoreToken;
    let cancelled = false;
    let frame = 0;
    let anchorCell = null;
    let cachedTabs = null;
    let lastLocate = 0;
    let tabsSeenAt = 0;
    const started = performance.now();
    const maxWait = 3000;
    const anchorWait = 800;

    const detach = () => {
      window.removeEventListener('wheel', onUserScroll);
      window.removeEventListener('touchmove', onUserScroll);
      document.removeEventListener('pointerdown', onUserScroll, true);
      document.removeEventListener('mousedown', onUserScroll, true);
      document.removeEventListener('keydown', onScrollKey, true);
    };
    const cancel = () => {
      cancelled = true;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      detach();
    };
    const onUserScroll = () => cancel();
    const onScrollKey = event => {
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
      if (['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) cancel();
    };

    // 只认 home 的 tab 栏（For you / Following）；个人主页、探索/搜索也有 tablist，
    // 不能把它们的帖子当成 home 锚点，否则返回时会先滚动错误页面。
    const homeTabs = () => {
      if (cachedTabs && cachedTabs.isConnected && cachedTabs.getBoundingClientRect().height > 0) {
        return cachedTabs;
      }
      cachedTabs = null;
      const primary = document.querySelector(PRIMARY);
      if (!primary) return null;
      cachedTabs = [...primary.querySelectorAll('[role="tablist"]')]
        .find(element => {
          if (element.closest(TWEET) || element.getBoundingClientRect().height <= 0) return false;
          const text = (element.innerText || '').toLowerCase();
          return text.includes('正在关注') || text.includes('following');
        }) || null;
      return cachedTabs;
    };
    const locate = () => {
      if (anchorCell && anchorCell.isConnected) {
        const link = cellStatusLink(anchorCell);
        if (link && link.getAttribute('href') === state.anchor.href) return anchorCell;
      }
      anchorCell = null;
      const now = performance.now();
      if (now - lastLocate < 120) return null;
      lastLocate = now;
      const tabs = homeTabs();
      if (!tabs) return null;
      for (const cell of document.querySelectorAll(CELL)) {
        if (!(tabs.compareDocumentPosition(cell) & Node.DOCUMENT_POSITION_FOLLOWING)) continue;
        const link = cellStatusLink(cell);
        if (link && link.getAttribute('href') === state.anchor.href) {
          anchorCell = cell;
          break;
        }
      }
      return anchorCell;
    };
    const apply = target => {
      const max = Math.max(0, document.scrollingElement.scrollHeight - window.innerHeight);
      const next = Math.max(0, Math.min(Math.round(target), max));
      if (Math.abs(window.scrollY - next) > 2) window.scrollTo(0, next);
      return next;
    };
    const finish = () => {
      cancel();
      // 保留 homeReturn.expanded，后续再次渲染时继续沿用展开态；离开 home 时会重新 capture。
    };
    const run = () => {
      if (cancelled) return;
      if (token !== homeRestoreToken || route !== 'home') {
        detach();
        return;
      }
      const now = performance.now();
      if (!homeTabs()) {
        if (now - started < maxWait) {
          frame = requestAnimationFrame(run);
        } else {
          finish();
        }
        return;
      }
      if (!tabsSeenAt) tabsSeenAt = now;
      const cell = state.anchor ? locate() : null;
      if (cell) {
        // 只对齐这一次；之后不再追着 X 的重排/虚拟化滚动，避免来回跳动。
        const delta = Math.round(cell.getBoundingClientRect().top) - state.anchor.top;
        if (Math.abs(delta) > 2) apply(window.scrollY + delta);
        finish();
        return;
      }
      if (now - tabsSeenAt >= anchorWait) {
        // 锚点不在首屏时按离开时的像素位置回填一次，然后交还控制权。
        apply(state.y);
        finish();
        return;
      }
      frame = requestAnimationFrame(run);
    };

    // 滚动条拖动会在 html 上派发 pointerdown/mousedown；任何主动操作都立即取消自动滚动。
    window.addEventListener('wheel', onUserScroll, { passive: true });
    window.addEventListener('touchmove', onUserScroll, { passive: true });
    document.addEventListener('pointerdown', onUserScroll, true);
    document.addEventListener('mousedown', onUserScroll, true);
    document.addEventListener('keydown', onScrollKey, true);
    run();
  }

  function onRouteChange() {
    if (!enabled) return;
    const previousRoute = route;
    setRoute();
    hidePhotoPreview();
    closeComments();
    if (route === 'standalone') {
      stopObserver();
      stopSurfaceObserver();
      clearSurfaceMarkers();
      setNavExpanded(false);
      return;
    }
    if (previousRoute === 'home' && route !== 'home') captureHomeReturn();
    if (previousRoute !== 'home' && route === 'home') restoreHomeReturn();
    if (route !== 'home') {
      stopObserver();
    }
    const primary = document.querySelector(PRIMARY);
    if (!primary) {
      syncSurfaceRoute(previousRoute);
      scheduleBootRetry();
      return;
    }
    checkSelectorHealth();
    formatTimestamps();
    scheduleSurfaceRefresh();
    safe('tabbar', markTabbar);
    safe('composer', markComposer);
    safe('appbar', markAppBar);
    safe('darkSurface', markDarkSurfaces);
    safe('railPanel', markRailPanel);
    safe('railLayout', markRailLayout);
    if (isSurfaceRoute(route)) safe('exploreSurfaces', markExploreSurfaces);
    ensureNavToggle();
    ensureGrokObserver();
    if (!isWideRoute(route)) setNavExpanded(false);
    if (route === 'home' || route === 'profile') {
      if (!degraded) {
        startObserver();
        scanTimeline();
      }
    } else {
      stopObserver();
    }
    syncSurfaceRoute(previousRoute);
  }

  function formatPostTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    const now = new Date();
    const midnight = day => new Date(day.getFullYear(), day.getMonth(), day.getDate());
    const days = Math.round((midnight(now) - midnight(date)) / 86400000);
    const clock = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    if (days === 0) return clock;
    if (days === 1) return STR.yesterday(clock);
    return `${STR.date(date, now)}·${clock}`;
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

  // X 流式渲染：顶部条、标签栏和回复框可能晚于正文出现，延迟再标一次。
  function scheduleSurfaceRefresh() {
    if (timestampTimer) window.clearTimeout(timestampTimer);
    timestampTimer = window.setTimeout(() => {
      timestampTimer = null;
      safe('timestamps', formatTimestamps);
      safe('tabbar', markTabbar);
      safe('composer', markComposer);
      safe('appbar', markAppBar);
      ensureGrokObserver();
      scheduleGrokScan();
      if (isSurfaceRoute(route)) syncSurfaceRoute(route);
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
    if (tabbar.parentElement !== content) return;
    // 个人主页的标签页没有独立容器，向上会爬到整列（含作者信息/帖子/推广卡）；
    // 只有"只含标签栏"的小容器才标记，否则 [data-xmp-tabbar] div 的透明规则会清掉
    // 认证卡等卡片的背景。
    const box = tabbar.getBoundingClientRect();
    const valid = box.height > 0 && box.height <= 120 &&
      !tabbar.querySelector(TWEET) && !tabbar.querySelector('[data-testid="UserName"]');
    if (valid) tabbar.setAttribute('data-xmp-tabbar', '');
    else tabbar.removeAttribute('data-xmp-tabbar');
    primary.querySelectorAll('[data-xmp-tabbar]').forEach(node => {
      if (node !== tabbar) node.removeAttribute('data-xmp-tabbar');
    });
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

  // 内联深色底的卡片（「你尚未通过认证」等推广卡）保留深色底，卡内文字/图标恢复浅色；
  // 深绿色的已知变体有 CSS 直接命中，这里兜底其他内联深色变体。
  function markDarkSurfaces() {
    const primary = document.querySelector(PRIMARY);
    if (primary) {
      for (const node of primary.querySelectorAll('[style*="background-color"]')) {
        if (node.hasAttribute('data-xmp-dark-surface') || node.hasAttribute('data-xmp-light-surface')) continue;
        const match = (node.style.backgroundColor || '').match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);
        if (!match) continue;
        if (match[4] !== undefined && +match[4] < 0.4) continue;
        const dark = (0.2126 * +match[1] + 0.7152 * +match[2] + 0.0722 * +match[3]) < 90;
        node.setAttribute(dark ? 'data-xmp-dark-surface' : 'data-xmp-light-surface', '');
      }
    }
  }

  // 探索/搜索页的深色表面（模块卡、侧栏卡、搜索框外壳、底部「显示更多」条）没有稳定 testid，
  // 按计算样式识别一次并打运行时标记，主题规则把它们换成纸面浮起，卡内浅色文字翻成墨色。
  const SURFACE_MARKERS = [
    'data-xmp-paper-surface',
    'data-xmp-paper-chip',
    'data-xmp-paper-text',
    'data-xmp-paper-link',
    'data-xmp-paper-icon',
    'data-xmp-module',
    'data-xmp-surface-scan',
  ];
  const SURFACE_NATIVE_CELL = '[data-testid="tweet"], [data-testid="trend"], [data-testid="UserCell"], [data-testid="eventHero"], img';
  const SURFACE_TEXT_SELECTOR = 'span, p, div[dir], h1, h2, h3, a';

  function colorParts(value) {
    const match = value && value.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?\)/);
    if (!match) return null;
    if (match[4] !== undefined && +match[4] < 0.4) return null;
    return [+match[1], +match[2], +match[3]];
  }

  function colorLuma(value) {
    const rgb = colorParts(value);
    if (!rgb) return null;
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }

  function isDarkColor(value) {
    const luma = colorLuma(value);
    return luma !== null && luma < 90;
  }

  function isLightColor(value) {
    const luma = colorLuma(value);
    return luma !== null && luma >= 170;
  }

  function isXBlue(value) {
    const rgb = colorParts(value);
    return !!rgb && rgb[0] === 29 && rgb[1] === 155 && rgb[2] === 240;
  }

  // 已有 1px 边框的表面只换边框色；无边框的小胶囊用内阴影补细线，避免加 border 撑大布局。
  function markPaperSurface(node, style) {
    const bordered = (parseFloat(style.borderTopWidth) || 0) >= 1;
    node.setAttribute(bordered ? 'data-xmp-paper-surface' : 'data-xmp-paper-chip', '');
  }

  function scanPaperSurfaces(root, minSize) {
    for (const node of root.querySelectorAll('div, button, section, ul, form')) {
      if (node.closest('[role="dialog"]')) continue;
      if (node.hasAttribute('data-xmp-paper-surface') || node.hasAttribute('data-xmp-paper-chip')) continue;
      const style = window.getComputedStyle(node);
      if (style.backgroundImage !== 'none' || !isDarkColor(style.backgroundColor)) continue;
      const box = node.getBoundingClientRect();
      const control = node.tagName === 'BUTTON' || node.getAttribute('role') === 'button';
      const min = control ? 20 : minSize;
      if (box.width < min || box.height < min) continue;
      markPaperSurface(node, style);
    }
  }

  // 最近的实心底色：用于判断文字/图标是否落在纸面或深底上，而不是彩色气泡里。
  function nearestPaperBackground(node, boundary) {
    for (let current = node; current && current !== boundary; current = current.parentElement) {
      const style = window.getComputedStyle(current);
      const rgb = colorParts(style.backgroundColor);
      if (!rgb) continue;
      return {
        paper: current.hasAttribute('data-xmp-paper-surface') || current.hasAttribute('data-xmp-paper-chip'),
        dark: isDarkColor(style.backgroundColor),
      };
    }
    return null;
  }

  // 只处理带直接文字的元素：品牌色（党派色、比分绿勾）不在浅色阈值内，保持原样。
  // 传入 boundary 时跳过落在彩色（非纸面/非深底）气泡里的浅色文字。
  function markPaperText(root, boundary) {
    for (const node of root.querySelectorAll(SURFACE_TEXT_SELECTOR)) {
      if (node.closest('[role="dialog"]')) continue;
      if (node.closest('img, [style*="background-image"], [data-testid="tweetPhoto"], [data-testid="previewInterstitial"]')) continue;
      let hasOwnText = false;
      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
          hasOwnText = true;
          break;
        }
      }
      if (!hasOwnText) continue;
      if (boundary) {
        const bg = nearestPaperBackground(node, boundary);
        if (bg && !bg.paper && !bg.dark) continue;
      }
      const color = window.getComputedStyle(node).color;
      if (isLightColor(color)) node.setAttribute('data-xmp-paper-text', '');
      else if (isXBlue(color)) node.setAttribute('data-xmp-paper-link', '');
    }
  }

  // 搜索框外壳：探索页是纯黑胶囊，搜索页是深色描边的圆角层，都从输入框向上找。
  function markSearchChrome(primary) {
    for (const input of primary.querySelectorAll('[data-testid="SearchBox_Search_Input"]')) {
      if (input.closest('[role="dialog"]')) continue;
      for (let node = input; node && node !== primary; node = node.parentElement) {
        const style = window.getComputedStyle(node);
        const radius = parseFloat(style.borderTopLeftRadius) || 0;
        const bordered = (parseFloat(style.borderTopWidth) || 0) >= 1;
        if (isDarkColor(style.backgroundColor) || (bordered && radius >= 8)) markPaperSurface(node, style);
      }
    }
  }

  function markSidebarSurfaces() {
    const sidebar = document.querySelector('[data-testid="sidebarColumn"]');
    if (!sidebar || sidebar.hasAttribute('data-xmp-surface-scan')) return;
    sidebar.setAttribute('data-xmp-surface-scan', '');
    const cards = [...sidebar.querySelectorAll('[data-xmp-paper-surface]')];
    for (const node of sidebar.querySelectorAll('div')) {
      if (node.closest('[role="dialog"]')) continue;
      if (node.hasAttribute('data-xmp-paper-surface') || node.hasAttribute('data-xmp-paper-chip')) continue;
      const style = window.getComputedStyle(node);
      if (style.backgroundImage !== 'none' || !isDarkColor(style.backgroundColor)) continue;
      const box = node.getBoundingClientRect();
      if (box.width < 200 || box.height < 20) continue;
      markPaperSurface(node, style);
      cards.push(node);
    }
    for (const card of cards) markPaperText(card);
  }

  function markExploreSurfaces() {
    const primary = document.querySelector(PRIMARY);
    if (!primary) return;
    for (const cell of primary.querySelectorAll(CELL)) {
      if (cell.hasAttribute('data-xmp-surface-scan')) continue;
      cell.setAttribute('data-xmp-surface-scan', '');
      // 选举/体育这类聚合模块卡自带深色底和浅色文字，整格扫描
      if (cell.querySelector('[class*="jf-element"]')) {
        cell.setAttribute('data-xmp-module', '');
        scanPaperSurfaces(cell, 48);
        markPaperText(cell);
        continue;
      }
      if (cell.querySelector(SURFACE_NATIVE_CELL)) continue;
      scanPaperSurfaces(cell, 48);
      markPaperText(cell);
    }
    markSearchChrome(primary);
    markSidebarSurfaces();
  }

  // Grok 抽屉是独立浮层，深色面板/输入卡按计算样式标记；文字和图标只翻纸面/深底上的，
  // 彩色气泡（如用户消息）里的白字保持原样。
  function markGrokSurfaces() {
    const drawer = document.querySelector('[data-testid="GrokDrawer"]');
    if (!drawer) return;
    scanPaperSurfaces(drawer, 40);
    markPaperText(drawer, drawer);
    for (const icon of drawer.querySelectorAll('svg')) {
      const bg = nearestPaperBackground(icon, drawer);
      if (bg && !bg.paper && !bg.dark) continue;
      icon.setAttribute('data-xmp-paper-icon', '');
    }
  }

  function clearSurfaceMarkers() {
    const selector = SURFACE_MARKERS.map(name => `[${name}]`).join(', ');
    for (const node of document.querySelectorAll(selector)) {
      for (const name of SURFACE_MARKERS) node.removeAttribute(name);
    }
  }

  // 路由切换/延迟刷新时丢弃“已扫描”标记：新内容可能在观察器挂到新 main 之前就已渲染，
  // 只靠 MutationObserver 会漏掉，必须强制下一轮重新扫描。
  function clearSurfaceScanFlags() {
    for (const node of document.querySelectorAll('[data-xmp-surface-scan]')) {
      node.removeAttribute('data-xmp-surface-scan');
    }
  }

  function scheduleSurfaceScan() {
    if (surfaceScanTimer) return;
    surfaceScanTimer = window.setTimeout(() => {
      surfaceScanTimer = null;
      ensureSurfaceObserver();
      if (!enabled || !isSurfaceRoute(route)) return;
      safe('exploreSurfaces', markExploreSurfaces);
    }, 200);
  }

  // React 会整块替换模块/侧栏内容，标记随旧节点消失；按变更记录撤掉对应单元格（或侧栏）的
  // 已扫描标记，下一轮防抖重新扫描。
  function invalidateSurfaceScan(records) {
    for (const record of records) {
      const node = record.target.nodeType === 1 ? record.target : record.target.parentElement;
      if (!node || !node.closest) continue;
      const cell = node.closest(CELL);
      if (cell) cell.removeAttribute('data-xmp-surface-scan');
      const sidebar = node.closest('[data-testid="sidebarColumn"]');
      if (sidebar) sidebar.removeAttribute('data-xmp-surface-scan');
    }
  }

  // 观察 main（跨 SPA 路由稳定）而不是 primaryColumn：路由切换时 primary 可能整块替换，
  // 只观察它会漏掉新内容。侧栏也在 main 内，随同一个观察器更新。
  function surfaceRoot() {
    return document.querySelector('main[role="main"]') || document.querySelector(PRIMARY);
  }

  function startSurfaceObserver() {
    if (!enabled || !isSurfaceRoute(route)) return;
    const root = surfaceRoot();
    if (!root) return;
    if (surfaceObserver && surfacePrimary === root) return;
    stopSurfaceObserver();
    surfacePrimary = root;
    surfaceObserver = new MutationObserver(records => {
      invalidateSurfaceScan(records);
      scheduleSurfaceScan();
    });
    surfaceObserver.observe(root, { childList: true, subtree: true });
    clearSurfaceScanFlags();
  }

  function ensureSurfaceObserver() {
    if (!enabled || !isSurfaceRoute(route)) return;
    const root = surfaceRoot();
    if (!root || (surfaceObserver && surfacePrimary === root)) return;
    startSurfaceObserver();
  }

  function stopSurfaceObserver() {
    if (surfaceObserver) {
      surfaceObserver.disconnect();
      surfaceObserver = null;
    }
    surfacePrimary = null;
    if (surfaceScanTimer) {
      window.clearTimeout(surfaceScanTimer);
      surfaceScanTimer = null;
    }
  }

  // Grok 抽屉在 primary 外，打开/切换对话时会流式替换内容；单独观察抽屉并防抖重扫。
  function scheduleGrokScan() {
    if (grokTimer) return;
    grokTimer = window.setTimeout(() => {
      grokTimer = null;
      ensureGrokObserver();
      safe('grok', markGrokSurfaces);
    }, 200);
  }

  function ensureGrokObserver() {
    if (!enabled) return;
    const drawer = document.querySelector('[data-testid="GrokDrawer"]');
    if (!drawer) {
      if (grokObserver) {
        grokObserver.disconnect();
        grokObserver = null;
        grokRoot = null;
      }
      return;
    }
    if (grokObserver && grokRoot === drawer) return;
    if (grokObserver) grokObserver.disconnect();
    grokRoot = drawer;
    grokObserver = new MutationObserver(scheduleGrokScan);
    grokObserver.observe(drawer, { childList: true, subtree: true });
    scheduleGrokScan();
  }

  // X 打开/关闭 Grok 抽屉时会整块替换 GrokDrawer 根节点，原来挂在根上的观察器会失效。
  // 在 Grok 入口点击后延迟重挂并扫描一次，之后由新根上的观察器接管流式内容。
  function watchGrokDrawer() {
    if (grokClickBound) return;
    grokClickBound = true;
    const sync = () => {
      if (!enabled) return;
      safe('grok', () => {
        ensureGrokObserver();
        scheduleGrokScan();
      });
    };
    document.addEventListener('click', event => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target || !target.closest('[data-testid="GrokDrawerHeader"], [aria-label="Grok"]')) return;
      window.setTimeout(sync, 300);
      window.setTimeout(sync, 1500);
    }, true);
  }

  // 探索/搜索只做换肤不做版面：进入这两页起表面观察器，离开时停掉并清标记（DOM 复用时不留纸面样式）。
  function syncSurfaceRoute(previousRoute) {
    if (isSurfaceRoute(route)) {
      clearSurfaceScanFlags();
      startSurfaceObserver();
      scheduleSurfaceScan();
      return;
    }
    stopSurfaceObserver();
    if (isSurfaceRoute(previousRoute)) clearSurfaceMarkers();
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
    initLocale();
    setRoute();
    if (route === 'standalone') {
      patchHistory();
      return;
    }
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
    safe('tabbar', markTabbar);
    safe('composer', markComposer);
    safe('appbar', markAppBar);
    safe('darkSurface', markDarkSurfaces);
    safe('railPanel', markRailPanel);
    safe('railLayout', markRailLayout);
    if (isSurfaceRoute(route)) safe('exploreSurfaces', markExploreSurfaces);
    ensureNavToggle();
    ensureGrokObserver();
    if (route === 'home' || route === 'profile') {
      if (!degraded) {
        startObserver();
        scanTimeline();
      }
    } else {
      stopObserver();
    }
    syncSurfaceRoute(route);
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
    safe('tabbar', markTabbar);
    safe('composer', markComposer);
    safe('appbar', markAppBar);
    safe('darkSurface', markDarkSurfaces);
    safe('railPanel', markRailPanel);
    safe('railLayout', markRailLayout);
    if (route !== 'home' && route !== 'profile') return;
    const cells = [...primary.querySelectorAll(CELL)];
    if (cells.length > 0 && !commonAncestor(cells)) return;
    safe('media', () => {
      primary.querySelectorAll(TWEET).forEach(tweet => {
        if (!tweet.parentElement.closest(TWEET)) annotateTweet(tweet);
      });
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
      return { kind: 'mixed', count: media.length, ...STR.mediaMixed(media.length) };
    }
    if (videos.length > 0) {
      return { kind: 'video', count: videos.length, ...STR.mediaVideo };
    }
    if (images.length === 1) {
      return { kind: 'image', count: 1, ...STR.mediaImage };
    }
    return { kind: 'images', count: images.length, ...STR.mediaImages(images.length) };
  }

  function renderButton(button, info, state) {
    const expanded = state === 'expanded';
    const countSuffix = info.count > 1 && info.kind !== 'video' ? info.suffix : '';
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
      rememberHomeMedia(tweet, false);
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
      rememberHomeMedia(tweet, true);
      renderButton(toggle, currentInfo, 'expanded');
      return;
    }
    const reveal = (mediaReveals.get(block) || 0) + 1;
    mediaReveals.set(block, reveal);
    block.setAttribute('data-xmp-media-loading', '');
    tweet.dataset.xmpMediaState = 'expanded';
    rememberHomeMedia(tweet, true);
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
        tweet.dataset.xmpMediaState = wantsExpandedMedia(tweet) ? 'expanded' : 'collapsed';
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
    tweet.dataset.xmpMediaState = wantsExpandedMedia(tweet) ? 'expanded' : 'collapsed';
    renderButton(toggle, info, tweet.dataset.xmpMediaState);
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
    if (videos > 0 && images > 0) return STR.previewMixed(stills.length);
    if (videos > 0) return STR.previewVideoCovers(videos);
    return STR.previewOriginals(stills.length);
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
      const label = photos.length > 1 && index >= 0
        ? STR.previewIndex(index + 1, photos.length)
        : STR.previewOriginals(1);
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

  // ---------- 评论弹窗 ----------
  // TweetDetail 读取评论，FavoriteTweet/UnfavoriteTweet 处理用户主动点赞，
  // CreateTweet 处理用户在弹窗内主动提交的文字回复。请求使用浏览器当前会话（cookie）
  // 和 X Web 的公开 bearer；接口失效时弹窗给出重试和“新标签页打开”兜底。
  function commentsEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function decodeCommentText(value) {
    const area = document.createElement('textarea');
    area.innerHTML = value || '';
    return area.value;
  }

  function appendCommentText(container, tweet) {
    let raw = decodeCommentText(commentText(tweet));
    const media = tweet.legacy?.extended_entities?.media || tweet.legacy?.entities?.media || [];
    for (const item of media) {
      if (item.url) raw = raw.split(item.url).join('');
    }
    raw = raw.replace(/[ \t]+\n/g, '\n').replace(/[ \t]+$/, '');
    const urls = commentEntities(tweet).urls || [];
    if (urls.length === 0) {
      container.textContent = raw;
      return;
    }
    const map = new Map(urls.map(item => [item.url, item]));
    const parts = raw.split(/(https:\/\/t\.co\/[A-Za-z0-9]+)/g);
    for (const part of parts) {
      const entity = map.get(part);
      if (!entity) {
        container.appendChild(document.createTextNode(part));
        continue;
      }
      const link = commentsEl('a', null, entity.display_url || entity.expanded_url || part);
      link.href = entity.expanded_url || part;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      container.appendChild(link);
    }
  }

  function commentUser(tweet) {
    const user = tweet.core?.user_results?.result;
    return {
      name: user?.core?.name || user?.legacy?.name || STR.unknownUser,
      handle: user?.core?.screen_name || user?.legacy?.screen_name || '',
      avatar: user?.avatar?.image_url || user?.legacy?.profile_image_url_https || '',
      verified: !!user?.is_blue_verified,
      bio: decodeCommentText(user?.profile_bio?.description || ''),
      location: user?.location?.location || '',
      followers: user?.relationship_counts?.followers,
      following: user?.relationship_counts?.following,
    };
  }

  function commentText(tweet) {
    return tweet.note_tweet?.note_tweet_results?.result?.text || tweet.legacy?.full_text || '';
  }

  function commentEntities(tweet) {
    return tweet.note_tweet?.note_tweet_results?.result?.entity_set || tweet.legacy?.entities || {};
  }

  function commentThumbnail(url) {
    if (!url) return '';
    try {
      const parsed = new URL(url);
      parsed.searchParams.set('name', 'small');
      return parsed.toString();
    } catch (error) {
      return url;
    }
  }

  function commentCount(value) {
    const locale = UI_LANG === 'zh' ? 'zh-CN' : 'en-US';
    return new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value) || 0);
  }

  function appendCommentMedia(container, tweet) {
    const media = (tweet.legacy?.extended_entities?.media || tweet.legacy?.entities?.media || []).slice(0, 4);
    if (media.length === 0) return;
    const grid = commentsEl('div', `xmp-comments-media ${media.length > 1 ? 'many' : 'one'}`);
    for (const item of media) {
      const src = commentThumbnail(item.media_url_https);
      if (!src) continue;
      const wrap = commentsEl('div', 'xmp-comments-media-item');
      const image = document.createElement('img');
      image.loading = 'lazy';
      image.alt = '';
      image.src = src;
      wrap.appendChild(image);
      if (item.type === 'video') wrap.appendChild(commentsEl('span', 'xmp-comments-media-badge', STR.videoBadge));
      else if (item.type === 'animated_gif') wrap.appendChild(commentsEl('span', 'xmp-comments-media-badge', 'GIF'));
      grid.appendChild(wrap);
    }
    container.appendChild(grid);
  }

  const COMMENT_HEART_PATH = 'M12 21.638h-.014C9.403 21.59 1.95 14.856 1.95 8.478 1.95 5.42 4.356 3 7.392 3c1.689 0 3.292.78 4.608 2.256C13.316 3.78 14.919 3 16.608 3c3.036 0 5.442 2.42 5.442 5.478 0 6.378-7.453 13.112-10.036 13.16H12z';
  const COMMENT_HEART_OUTLINE_PATH = 'M16.697 5.5c-1.222-.06-2.679.51-3.89 2.16l-.805 1.09-.806-1.09C9.984 6.01 8.526 5.44 7.304 5.5c-1.243.07-2.349.78-2.91 1.91-.552 1.12-.633 2.78.479 4.82 1.074 1.97 3.257 4.27 7.129 6.61 3.87-2.34 6.052-4.64 7.126-6.61 1.111-2.04 1.03-3.7.477-4.82-.561-1.13-1.666-1.84-2.908-1.91zm4.187 7.69c-1.351 2.48-4.001 5.12-8.379 7.67l-.503.3-.504-.3c-4.379-2.55-7.029-5.19-8.382-7.67-1.36-2.5-1.41-4.86-.514-6.67.887-1.79 2.647-2.91 4.601-3.01 1.651-.09 3.368.56 4.798 2.01 1.429-1.45 3.146-2.1 4.796-2.01 1.954.1 3.714 1.22 4.601 3.01.896 1.81.846 4.17-.514 6.67z';
  const COMMENT_REPLY_PATH = 'M1.751 10c0-4.42 3.584-8 8.005-8h4.366c4.49 0 8.129 3.64 8.129 8.13 0 2.96-1.607 5.68-4.196 7.11l-8.054 4.46v-3.69h-.067c-4.49.1-8.183-3.51-8.183-8.01zm8.005-6c-3.317 0-6.005 2.69-6.005 6 0 3.37 2.77 6.08 6.138 6.01l.351-.01h1.761v2.3l5.087-2.81c1.951-1.08 3.163-3.13 3.163-5.36 0-3.39-2.744-6.13-6.129-6.13H9.756z';
  const COMMENT_PROFILE_PATH = 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm0 2c-4 0-7 2-7 5v2h14v-2c0-3-3-5-7-5z';

  function commentsIcon(path) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    shape.setAttribute('d', path);
    svg.appendChild(shape);
    return svg;
  }

  function buildCommentProfile(user) {
    const card = commentsEl('div', 'xmp-comments-profile');
    const head = commentsEl('div', 'xmp-comments-profile-head');
    if (user.avatar) {
      const avatar = document.createElement('img');
      avatar.className = 'xmp-comments-profile-avatar';
      avatar.loading = 'lazy';
      avatar.alt = '';
      avatar.src = user.avatar;
      head.appendChild(avatar);
    }
    const who = commentsEl('div');
    const name = commentsEl('div', 'xmp-comments-profile-name', user.name);
    if (user.verified) name.appendChild(commentsEl('span', 'xmp-comments-profile-verified', '✓'));
    who.appendChild(name);
    who.appendChild(commentsEl('div', 'xmp-comments-profile-handle', `@${user.handle}`));
    head.appendChild(who);
    card.appendChild(head);
    if (user.bio) card.appendChild(commentsEl('div', 'xmp-comments-profile-bio', user.bio));
    const meta = commentsEl('div', 'xmp-comments-profile-meta');
    if (user.location) meta.appendChild(commentsEl('span', null, user.location));
    if (user.followers !== undefined) {
      meta.appendChild(commentsEl('span', null, STR.followers(user.followers, commentCount(user.followers))));
    }
    if (user.following !== undefined) {
      meta.appendChild(commentsEl('span', null, STR.following(user.following, commentCount(user.following))));
    }
    if (meta.childNodes.length > 0) card.appendChild(meta);
    const link = commentsEl('a', 'xmp-comments-profile-link', STR.openProfile);
    link.href = `https://x.com/${user.handle}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    card.appendChild(link);
    return card;
  }

  function positionCommentProfile(card, anchor) {
    card.style.visibility = 'hidden';
    card.style.left = '0px';
    card.style.top = '0px';
    const rect = anchor.getBoundingClientRect();
    const width = card.offsetWidth || 320;
    const height = card.offsetHeight || 0;
    let left = rect.right + 10;
    if (left + width > window.innerWidth - 8) left = rect.left - width - 10;
    left = Math.max(8, Math.min(left, window.innerWidth - width - 8));
    let top = rect.top;
    if (top + height > window.innerHeight - 8) top = window.innerHeight - height - 8;
    top = Math.max(8, top);
    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
    card.style.visibility = 'visible';
  }

  function removeCommentProfile() {
    if (profileShowTimer) {
      window.clearTimeout(profileShowTimer);
      profileShowTimer = null;
    }
    if (profileHideTimer) {
      window.clearTimeout(profileHideTimer);
      profileHideTimer = null;
    }
    const profile = commentsProfile;
    if (!profile) return;
    profile.card.remove();
    window.removeEventListener('scroll', profile.onScroll);
    window.removeEventListener('resize', profile.onResize);
    profile.body?.removeEventListener('scroll', profile.onScroll);
    if (profile.pointerDown) document.removeEventListener('pointerdown', profile.pointerDown, true);
    commentsProfile = null;
  }

  function showCommentProfile(anchor, user, pinned = false) {
    if (!user?.handle) return;
    removeCommentProfile();
    const card = buildCommentProfile(user);
    card.addEventListener('pointerenter', () => {
      if (profileHideTimer) {
        window.clearTimeout(profileHideTimer);
        profileHideTimer = null;
      }
    });
    card.addEventListener('pointerleave', () => scheduleProfileHide());
    document.body.appendChild(card);
    positionCommentProfile(card, anchor);
    const onScroll = () => removeCommentProfile();
    const onResize = () => removeCommentProfile();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const body = document.querySelector('.xmp-comments-body');
    if (body) body.addEventListener('scroll', onScroll, { passive: true });
    const pointerDown = event => {
      if (!(event.target instanceof Node)) return;
      if (card.contains(event.target) || anchor.contains(event.target)) return;
      if (event.target instanceof Element && event.target.closest('.xmp-comments-action-profile')) return;
      removeCommentProfile();
    };
    if (pinned) document.addEventListener('pointerdown', pointerDown, true);
    commentsProfile = { card, anchor, user, pinned, onScroll, onResize, body, pointerDown };
  }

  function scheduleProfileShow(anchor, user) {
    if (!user?.handle) return;
    if (commentsProfile?.anchor === anchor) {
      if (profileHideTimer) {
        window.clearTimeout(profileHideTimer);
        profileHideTimer = null;
      }
      return;
    }
    if (profileShowTimer) window.clearTimeout(profileShowTimer);
    profileShowTimer = window.setTimeout(() => {
      profileShowTimer = null;
      showCommentProfile(anchor, user, false);
    }, 250);
  }

  function scheduleProfileHide(delay = 180) {
    if (commentsProfile?.pinned) return;
    if (profileShowTimer) {
      window.clearTimeout(profileShowTimer);
      profileShowTimer = null;
    }
    if (profileHideTimer) window.clearTimeout(profileHideTimer);
    profileHideTimer = window.setTimeout(() => {
      profileHideTimer = null;
      removeCommentProfile();
    }, delay);
  }

  function togglePinnedCommentProfile(anchor, user) {
    if (commentsProfile?.anchor === anchor && commentsProfile.pinned) {
      removeCommentProfile();
      return;
    }
    showCommentProfile(anchor, user, true);
  }

  function applyLikeState(button, countElement, liked, count) {
    button.classList.toggle('is-active', liked);
    button.setAttribute('aria-pressed', liked ? 'true' : 'false');
    button.setAttribute('aria-label', liked ? STR.unlike : STR.like);
    button.dataset.count = String(count);
    countElement.textContent = commentCount(count);
    const path = button.querySelector('path');
    if (path) path.setAttribute('d', liked ? COMMENT_HEART_PATH : COMMENT_HEART_OUTLINE_PATH);
  }

  async function toggleCommentLike(tweet, button, countElement) {
    if (button.dataset.busy) return;
    const liked = button.getAttribute('aria-pressed') === 'true';
    const previous = Number(button.dataset.count || 0);
    const next = !liked;
    const nextCount = Math.max(0, previous + (next ? 1 : -1));
    applyLikeState(button, countElement, next, nextCount);
    button.dataset.busy = '1';
    try {
      const queryId = next ? FAVORITE_TWEET_QUERY_ID : UNFAVORITE_TWEET_QUERY_ID;
      const name = next ? 'FavoriteTweet' : 'UnfavoriteTweet';
      const response = await fetch(`/i/api/graphql/${queryId}/${name}`, {
        method: 'POST',
        credentials: 'include',
        headers: tweetDetailHeaders(),
        body: JSON.stringify({ variables: { tweet_id: tweet.rest_id }, queryId }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (payload.errors?.length) throw new Error(payload.errors[0].message || STR.likeRequestFailed);
      tweet.legacy.favorited = next;
      tweet.legacy.favorite_count = nextCount;
    } catch (error) {
      applyLikeState(button, countElement, liked, previous);
      button.title = STR.actionFailed;
      warnOnce('comments-like', `点赞失败：${error}`);
    } finally {
      delete button.dataset.busy;
    }
  }

  // x-client-transaction-id 生成：X 的网页 GraphQL 写入（CreateTweet）要求这个头，
  // 缺少时会返回误导性的 344。算法移植自 Lqm1/x-client-transaction-id（MIT），
  // 与 X responsive-web 客户端的 ondemand.s + loading-x-anim 逻辑一致。
  // 许可与版权声明见 THIRD_PARTY_NOTICES.md；X 改版后可能失效，失败时中止请求并记录日志。
  const TXID_KEYWORD = 'obfiowerehiring';
  const TXID_ADDITIONAL_RANDOM_NUMBER = 3;
  const TXID_EPOCH_SECONDS = 1682924400;
  const TXID_TOTAL_TIME = 4096;
  let clientTransactionKeys = null;
  let clientTransactionInit = null;

  class TxidCubic {
    constructor(curves) {
      const [x1, y1, x2, y2] = curves;
      this.cx = 3.0 * x1;
      this.bx = 3.0 * (x2 - x1) - this.cx;
      this.ax = 1.0 - this.cx - this.bx;
      this.cy = 3.0 * y1;
      this.by = 3.0 * (y2 - y1) - this.cy;
      this.ay = 1.0 - this.cy - this.by;
      if (x1 > 0) this.startGradient = y1 / x1;
      else if (y1 === 0 && x2 > 0) this.startGradient = y2 / x2;
      else if (y1 === 0 && y2 === 0) this.startGradient = 1;
      else this.startGradient = 0;
      if (x2 < 1) this.endGradient = (y2 - 1) / (x2 - 1);
      else if (y2 === 1 && x1 < 1) this.endGradient = (y1 - 1) / (x1 - 1);
      else if (y2 === 1 && y1 === 1) this.endGradient = 1;
      else this.endGradient = 0;
      this.splineSamples = Array.from({ length: 11 }, (_, index) => this.sampleX(index / 10));
    }

    sampleX(t) {
      return ((this.ax * t + this.bx) * t + this.cx) * t;
    }

    sampleY(t) {
      return ((this.ay * t + this.by) * t + this.cy) * t;
    }

    sampleDerivativeX(t) {
      return (3.0 * this.ax * t + 2.0 * this.bx) * t + this.cx;
    }

    solveCurveX(x) {
      let t0 = 0.0;
      let t1 = 1.0;
      let t2 = x;
      for (let index = 1; index < 11; index += 1) {
        if (x <= this.splineSamples[index]) {
          t1 = 0.1 * index;
          t0 = t1 - 0.1;
          t2 = t0 + ((t1 - t0) * (x - this.splineSamples[index - 1])) /
            (this.splineSamples[index] - this.splineSamples[index - 1]);
          break;
        }
      }
      let residual = 0;
      for (let index = 0; index < 4; index += 1) {
        residual = this.sampleX(t2) - x;
        if (Math.abs(residual) < 1e-7) return t2;
        const derivative = this.sampleDerivativeX(t2);
        if (Math.abs(derivative) < 1e-7) break;
        t2 -= residual / derivative;
      }
      if (Math.abs(residual) < 1e-7) return t2;
      while (t0 < t1) {
        residual = this.sampleX(t2);
        if (Math.abs(residual - x) < 1e-7) return t2;
        if (x > residual) t0 = t2;
        else t1 = t2;
        t2 = (t1 + t0) * 0.5;
      }
      return t2;
    }

    getValue(time) {
      if (time < 0) return this.startGradient * time;
      if (time > 1) return 1.0 + this.endGradient * (time - 1.0);
      return this.sampleY(this.solveCurveX(time));
    }
  }

  function txidInterpolateNum(from, to, factor) {
    return from * (1 - factor) + to * factor;
  }

  function txidInterpolate(fromList, toList, factor) {
    return fromList.map((from, index) => txidInterpolateNum(from, toList[index], factor));
  }

  function txidConvertRotationToMatrix(rotation) {
    const radians = (rotation * Math.PI) / 180;
    return [Math.cos(radians), -Math.sin(radians), Math.sin(radians), Math.cos(radians)];
  }

  function txidFloatToHex(value) {
    const integer = Math.floor(value);
    let fraction = value - integer;
    let result = integer > 0 ? integer.toString(16).toUpperCase() : '';
    if (fraction === 0) return result;
    result += '.';
    while (fraction > 0) {
      fraction *= 16;
      const digit = Math.floor(fraction);
      fraction -= digit;
      result += digit.toString(16).toUpperCase();
    }
    return result;
  }

  function txidFormatMatrixValue(value) {
    if (value === 0) return '0';
    const sign = value < 0 ? '-' : '';
    const [mantissa, exponentText] = Math.abs(value).toExponential(5).split('e');
    const exponent = parseInt(exponentText, 10);
    const digits = mantissa.replace('.', '').replace(/0+$/, '') || '0';
    if (exponent < -4 || exponent >= 6) {
      const head = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
      const expSign = exponent < 0 ? '-' : '+';
      const expDigits = String(Math.abs(exponent)).padStart(2, '0');
      return `${sign}${head}e${expSign}${expDigits}`;
    }
    if (exponent >= 0) {
      const intPart = digits.slice(0, exponent + 1).padEnd(exponent + 1, '0');
      const fracPart = digits.slice(exponent + 1);
      return fracPart ? `${sign}${intPart}.${fracPart}` : `${sign}${intPart}`;
    }
    return `${sign}0.${'0'.repeat(-exponent - 1)}${digits}`;
  }

  function txidMatrixNumbers(value) {
    return (txidFormatMatrixValue(value).match(/[\d.-]+/g) ?? []).map(Number);
  }

  function txidSolve(value, min, max, rounding) {
    const result = (value * (max - min)) / 255 + min;
    return rounding ? Math.floor(result) : Math.round(result * 100) / 100;
  }

  function txidAnimate(frameRow, targetTime) {
    const fromColor = frameRow.slice(0, 3);
    const toColor = frameRow.slice(3, 6);
    const toRotation = txidSolve(frameRow[6], 60, 360, true);
    const curves = frameRow.slice(7)
      .map((value, index) => txidSolve(value, index % 2 ? -1.0 : 0.0, 1, false));
    const progress = new TxidCubic(curves).getValue(targetTime);
    const color = txidInterpolate(fromColor, toColor, progress)
      .map(channel => Math.round(Math.max(0, Math.min(255, channel))).toString(16));
    const rotation = txidInterpolateNum(0, toRotation, progress);
    const matrix = txidConvertRotationToMatrix(rotation)
      .flatMap(value => txidMatrixNumbers(value))
      .map(number => {
        const hex = txidFloatToHex(Math.abs(Number(number.toFixed(2)))).toLowerCase();
        return hex.startsWith('.') ? `0${hex}` : hex || '0';
      });
    return [...color, ...matrix, '0', '0'].join('').replace(/[.-]/g, '');
  }

  function txidGetAnimationKey(keyBytes, indices, frameRows) {
    const rowIndex = keyBytes[indices.rowIndex] % 16;
    const frameRow = frameRows[rowIndex];
    if (!frameRow) throw new Error('animation frame row missing');
    const frameTime = indices.keyBytesIndices
      .reduce((time, index) => time * (keyBytes[index] % 16), 1);
    return txidAnimate(frameRow, (Math.round(frameTime / 10) * 10) / TXID_TOTAL_TIME);
  }

  function txidGetVerificationKey(doc) {
    const key = doc.querySelector("[name='twitter-site-verification']")?.getAttribute('content');
    if (!key) throw new Error('verification key missing');
    return key;
  }

  function txidGetOnDemandFileUrl(doc) {
    const pattern = /(\d+):\s*["']ondemand\.s["'][\s\S]*?\}\)\[e\]\s*\|\|\s*e\)\s*\+\s*["']\.["']\s*\+\s*\(\{[\s\S]*?\b\1:\s*["']([a-zA-Z0-9_-]+)["']/;
    const sources = [...doc.querySelectorAll('script')]
      .map(script => script.textContent || '')
      .filter(source => source.includes('ondemand.s'));
    sources.push(doc.documentElement.outerHTML);
    for (const source of sources) {
      const hash = pattern.exec(source)?.[2];
      if (hash) return `https://abs.twimg.com/responsive-web/client-web/ondemand.s.${hash}a.js`;
    }
    throw new Error('ondemand url missing');
  }

  async function txidFetchKeyByteIndices(doc) {
    const url = txidGetOnDemandFileUrl(doc);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`ondemand HTTP ${response.status}`);
    const source = await response.text();
    const values = [...source.matchAll(/\(\w\[(\d{1,2})\],\s*16\)/g)].map(match => Number(match[1]));
    if (values.length === 0) throw new Error('key byte indices missing');
    return { rowIndex: values[0], keyBytesIndices: values.slice(1) };
  }

  function txidGetAnimationFrameRows(doc, keyBytes) {
    const frames = doc.querySelectorAll("[id^='loading-x-anim']");
    const path = frames[keyBytes[5] % 4]?.children[0]?.children[1]?.getAttribute('d');
    if (!path) return [];
    return path.substring(9).split('C')
      .map(segment => (segment.match(/\d+/g) || []).map(Number));
  }

  function txidEncodeBase64(bytes) {
    return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''));
  }

  function txidDecodeBase64(value) {
    return Uint8Array.from(atob(value), char => char.charCodeAt(0));
  }

  async function initClientTransaction() {
    if (clientTransactionKeys) return clientTransactionKeys;
    if (clientTransactionInit) return clientTransactionInit;
    clientTransactionInit = (async () => {
      const response = await fetch('/i/jf/', { credentials: 'omit', cache: 'no-store' });
      if (!response.ok) throw new Error(STR.txPageHttp(response.status));
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const key = txidGetVerificationKey(doc);
      const keyBytes = [...txidDecodeBase64(key)];
      const indices = await txidFetchKeyByteIndices(doc);
      const frameRows = txidGetAnimationFrameRows(doc, keyBytes);
      const animationKey = txidGetAnimationKey(keyBytes, indices, frameRows);
      return { keyBytes, animationKey };
    })();
    try {
      clientTransactionKeys = await clientTransactionInit;
      return clientTransactionKeys;
    } finally {
      clientTransactionInit = null;
    }
  }

  async function generateClientTransactionId(method, path) {
    const keys = await initClientTransaction();
    const time = Math.floor((Date.now() - TXID_EPOCH_SECONDS * 1000) / 1000);
    const data = `${method}!${path}!${time}${TXID_KEYWORD}${keys.animationKey}`;
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data)));
    const randomByte = Math.floor(Math.random() * 256);
    const bytes = [
      ...keys.keyBytes,
      ...[0, 8, 16, 24].map(shift => (time >> shift) & 0xff),
      ...hash.slice(0, 16),
      TXID_ADDITIONAL_RANDOM_NUMBER,
    ];
    const out = new Uint8Array([randomByte, ...bytes.map(byte => byte ^ randomByte)]);
    return txidEncodeBase64(out).replace(/=/g, '');
  }

  async function requestCreateTweet(text, replyToId, signal) {
    const variables = {
      tweet_text: text,
      reply: { in_reply_to_tweet_id: replyToId, exclude_reply_user_ids: [] },
      media: { media_entities: [], possibly_sensitive: false },
      semantic_annotation_ids: [],
      disallowed_reply_options: null,
    };
    let queryId = CREATE_TWEET_QUERY_ID;
    const send = async id => {
      const path = `/i/api/graphql/${id}/CreateTweet`;
      const headers = tweetDetailHeaders();
      try {
        headers['x-client-transaction-id'] = await generateClientTransactionId('POST', path);
      } catch (error) {
        warnOnce('client-transaction', `transaction id 生成失败：${error}`);
        throw new Error(STR.headerFailed(error.message || error));
      }
      return fetch(path, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          variables,
          features: TWEET_DETAIL_FEATURES,
          fieldToggles: TWEET_DETAIL_FIELD_TOGGLES,
          queryId: id,
        }),
        signal,
      });
    };
    let response = await send(queryId);
    if (!response.ok && (response.status === 400 || response.status === 404)) {
      const fresh = await discoverCreateTweetQueryId(signal);
      if (fresh && fresh !== queryId) {
        queryId = fresh;
        response = await send(queryId);
      }
    }
    if (!response.ok) throw new Error(STR.replyHttp(response.status));
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(payload.errors[0].message || STR.replyRequestFailed);
    return payload;
  }

  async function submitCommentReply(tweet, input, submit, cancel, error) {
    const text = input.value.trim();
    if (!text || submit.dataset.busy) return;
    if (commentsComposer) commentsComposer.busy = true;
    submit.dataset.busy = '1';
    submit.disabled = true;
    cancel.disabled = true;
    const label = submit.textContent;
    submit.textContent = STR.posting;
    error.hidden = true;
    try {
      await requestCreateTweet(text, tweet.rest_id);
      if (commentsComposer) commentsComposer.busy = false;
      closeCommentsComposer(false);
      refreshComments(STR.replyPosted);
    } catch (failure) {
      if (commentsComposer) commentsComposer.busy = false;
      submit.disabled = false;
      cancel.disabled = false;
      submit.textContent = label;
      error.textContent = STR.replyFailed(failure.message || failure);
      error.hidden = false;
      warnOnce('comments-reply', STR.replyFailed(failure));
    } finally {
      delete submit.dataset.busy;
    }
  }

  function closeCommentsComposer(restoreFocus = true) {
    if (!commentsComposer || commentsComposer.busy) return;
    const { element, button } = commentsComposer;
    commentsComposer = null;
    element.remove();
    button.classList.remove('is-open');
    if (restoreFocus && button.isConnected) button.focus({ preventScroll: true });
  }

  function openCommentsComposer(tweet, button, anchor) {
    if (!tweet?.rest_id || !commentsModal || commentsComposer?.busy) return;
    if (commentsComposer?.tweet?.rest_id === tweet.rest_id && commentsComposer.button === button) {
      closeCommentsComposer();
      return;
    }
    closeCommentsComposer();
    const user = commentUser(tweet);
    const form = commentsEl('div', 'xmp-comments-composer');
    const label = commentsEl('div', 'xmp-comments-composer-label');
    label.appendChild(document.createTextNode(STR.replyLabel));
    label.appendChild(commentsEl('span', null, `@${user.handle || user.name}`));

    const input = document.createElement('textarea');
    input.className = 'xmp-comments-composer-input';
    input.placeholder = STR.replyPlaceholder;
    input.rows = 3;
    input.maxLength = 280;
    input.setAttribute('aria-label', STR.replyAria(user.handle || user.name));

    const footer = commentsEl('div', 'xmp-comments-composer-footer');
    const count = commentsEl('span', 'xmp-comments-composer-count', '0/280');
    const cancel = commentsEl('button', 'xmp-comments-composer-cancel', STR.cancel);
    cancel.type = 'button';
    const submit = commentsEl('button', 'xmp-comments-composer-submit', STR.reply);
    submit.type = 'button';
    submit.disabled = true;
    footer.appendChild(count);
    footer.appendChild(cancel);
    footer.appendChild(submit);

    const error = commentsEl('div', 'xmp-comments-composer-error');
    error.hidden = true;
    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(footer);
    form.appendChild(error);
    anchor.appendChild(form);
    commentsComposer = { tweet, button, element: form, busy: false };

    button.classList.add('is-open');
    input.addEventListener('input', () => {
      const length = input.value.length;
      count.textContent = `${length}/280`;
      submit.disabled = input.value.trim().length === 0 || length > 280;
      if (!error.hidden) {
        error.hidden = true;
        error.textContent = '';
      }
    });
    cancel.addEventListener('click', () => closeCommentsComposer());
    submit.addEventListener('click', () => submitCommentReply(tweet, input, submit, cancel, error));
    input.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeCommentsComposer();
      } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        submit.click();
      }
    });
    input.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'nearest' });
  }

  function renderComment(tweet, options = {}) {
    const row = commentsEl('div', 'xmp-comments-reply');
    if (options.hasChildren) row.classList.add('has-children');
    const user = commentUser(tweet);
    const main = commentsEl('div', 'xmp-comments-main');

    const avatarButton = commentsEl('button', 'xmp-comments-avatar-button');
    avatarButton.type = 'button';
    avatarButton.setAttribute('aria-label', STR.viewProfileAria(user.handle || user.name));
    const avatar = document.createElement('img');
    avatar.className = 'xmp-comments-avatar';
    avatar.loading = 'lazy';
    avatar.alt = '';
    avatar.src = user.avatar;
    avatarButton.appendChild(avatar);
    avatarButton.addEventListener('pointerenter', () => scheduleProfileShow(avatarButton, user));
    avatarButton.addEventListener('pointerleave', () => scheduleProfileHide());
    avatarButton.addEventListener('focus', () => scheduleProfileShow(avatarButton, user));
    avatarButton.addEventListener('blur', () => scheduleProfileHide());
    avatarButton.addEventListener('click', () => togglePinnedCommentProfile(avatarButton, user));
    row.appendChild(avatarButton);

    const meta = commentsEl('div', 'xmp-comments-meta');
    const nameElement = commentsEl('span', 'xmp-comments-name', user.name);
    nameElement.addEventListener('pointerenter', () => scheduleProfileShow(avatarButton, user));
    nameElement.addEventListener('pointerleave', () => scheduleProfileHide());
    meta.appendChild(nameElement);
    if (user.handle) meta.appendChild(commentsEl('span', 'xmp-comments-handle', `@${user.handle}`));
    const time = formatPostTime(tweet.legacy?.created_at || '');
    if (time) meta.appendChild(commentsEl('span', 'xmp-comments-time', time));
    main.appendChild(meta);

    if (options.parent) {
      const parentUser = commentUser(options.parent);
      if (parentUser.handle) {
        const replyTo = commentsEl('div', 'xmp-comments-reply-to');
        replyTo.appendChild(document.createTextNode(STR.replyLabel));
        replyTo.appendChild(commentsEl('span', null, `@${parentUser.handle}`));
        main.appendChild(replyTo);
      }
    }

    const text = commentsEl('div', 'xmp-comments-text');
    appendCommentText(text, tweet);
    if (text.textContent.trim() || text.children.length > 0) main.appendChild(text);
    appendCommentMedia(main, tweet);

    const stats = [];
    if (tweet.legacy?.reply_count) {
      stats.push(STR.replyCount(tweet.legacy.reply_count, commentCount(tweet.legacy.reply_count)));
    }
    if (tweet.legacy?.retweet_count) {
      stats.push(STR.repostCount(tweet.legacy.retweet_count, commentCount(tweet.legacy.retweet_count)));
    }
    if (tweet.views?.count) {
      stats.push(STR.viewCount(tweet.views.count, commentCount(tweet.views.count)));
    }
    if (stats.length > 0) {
      const statsRow = commentsEl('div', 'xmp-comments-stats');
      for (const stat of stats) statsRow.appendChild(commentsEl('span', null, stat));
      main.appendChild(statsRow);
    }

    const actions = commentsEl('div', 'xmp-comments-actions');
    const likeCount = Number(tweet.legacy?.favorite_count) || 0;
    const likeButton = commentsEl('button', 'xmp-comments-action');
    likeButton.type = 'button';
    likeButton.appendChild(commentsIcon(COMMENT_HEART_OUTLINE_PATH));
    const likeCountElement = commentsEl('span', 'xmp-comments-action-count', commentCount(likeCount));
    likeButton.appendChild(likeCountElement);
    applyLikeState(likeButton, likeCountElement, !!tweet.legacy?.favorited, likeCount);
    likeButton.addEventListener('click', () => toggleCommentLike(tweet, likeButton, likeCountElement));
    actions.appendChild(likeButton);

    const replyButton = commentsEl('button', 'xmp-comments-action');
    replyButton.type = 'button';
    replyButton.setAttribute('aria-label', STR.replyThis);
    replyButton.appendChild(commentsIcon(COMMENT_REPLY_PATH));
    replyButton.appendChild(commentsEl('span', null, STR.reply));
    replyButton.addEventListener('click', () => openCommentsComposer(tweet, replyButton, main));
    actions.appendChild(replyButton);

    const profileButton = commentsEl('button', 'xmp-comments-action');
    profileButton.type = 'button';
    profileButton.classList.add('xmp-comments-action-profile');
    profileButton.setAttribute('aria-label', STR.viewCommenter);
    profileButton.appendChild(commentsIcon(COMMENT_PROFILE_PATH));
    profileButton.appendChild(commentsEl('span', null, STR.profile));
    profileButton.addEventListener('click', () => togglePinnedCommentProfile(avatarButton, user));
    actions.appendChild(profileButton);
    main.appendChild(actions);

    row.appendChild(main);
    return row;
  }

  function unwrapTweetResult(result) {
    if (!result) return null;
    if (result.__typename === 'TweetWithVisibilityResults') return result.tweet || null;
    return result;
  }

  function collectThreadTweets(payload) {
    const instructions = payload?.data?.threaded_conversation_with_injections_v2?.instructions;
    if (!Array.isArray(instructions)) return [];
    const tweets = [];
    const seen = new Set();
    const add = itemContent => {
      const tweet = unwrapTweetResult(itemContent?.tweet_results?.result);
      if (!tweet?.rest_id || seen.has(tweet.rest_id)) return;
      seen.add(tweet.rest_id);
      tweets.push(tweet);
    };
    for (const instruction of instructions) {
      for (const entry of instruction.entries || []) {
        const content = entry.content;
        if (content?.__typename === 'TimelineTimelineItem') add(content.itemContent);
        else if (content?.__typename === 'TimelineTimelineModule') {
          for (const item of content.items || []) add(item.item?.itemContent);
        }
      }
    }
    return tweets;
  }

  function tweetDetailParams(tweetId) {
    const variables = {
      focalTweetId: tweetId,
      with_rux_injections: false,
      rankingMode: 'Relevance',
      includePromotedContent: true,
      withCommunity: true,
      withQuickPromoteEligibilityTweetFields: true,
      withBirdwatchNotes: true,
      withVoice: true,
    };
    return new URLSearchParams({
      variables: JSON.stringify(variables),
      features: JSON.stringify(TWEET_DETAIL_FEATURES),
      fieldToggles: JSON.stringify(TWEET_DETAIL_FIELD_TOGGLES),
    });
  }

  function tweetDetailHeaders() {
    const ct0 = document.cookie.split('; ').find(item => item.startsWith('ct0='))?.slice(4);
    if (!ct0) throw new Error(STR.missingToken);
    return {
      authorization: TWEET_DETAIL_BEARER,
      'x-csrf-token': ct0,
      'x-twitter-auth-type': 'OAuth2Session',
      'x-twitter-active-user': 'yes',
      'x-twitter-client-language': (document.documentElement.lang || 'en').toLowerCase(),
      'content-type': 'application/json',
    };
  }

  async function discoverTweetDetailQueryId(signal) {
    const script = [...document.querySelectorAll('script[src]')]
      .map(item => item.src)
      .find(src => /\/client-web\/main\.[^/]+\.js$/.test(src));
    if (!script) return null;
    const text = await fetch(script, { credentials: 'same-origin', signal }).then(response => response.text());
    return text.match(/queryId:"([^"]+)",operationName:"TweetDetail"/)?.[1] || null;
  }

  async function discoverCreateTweetQueryId(signal) {
    const script = [...document.querySelectorAll('script[src]')]
      .map(item => item.src)
      .find(src => /\/client-web\/main\.[^/]+\.js$/.test(src));
    if (!script) return null;
    const text = await fetch(script, { credentials: 'same-origin', signal }).then(response => response.text());
    return text.match(/queryId:"([^"]+)",operationName:"CreateTweet"/)?.[1] || null;
  }

  async function requestTweetDetail(tweetId, signal) {
    let queryId = TWEET_DETAIL_QUERY_ID;
    const request = async id => fetch(
      `/i/api/graphql/${id}/TweetDetail?${tweetDetailParams(tweetId).toString()}`,
      { credentials: 'include', headers: tweetDetailHeaders(), signal, cache: 'no-store' },
    );
    let response = await request(queryId);
    if (!response.ok && (response.status === 400 || response.status === 404)) {
      const fresh = await discoverTweetDetailQueryId(signal);
      if (fresh && fresh !== queryId) {
        queryId = fresh;
        response = await request(queryId);
      }
    }
    if (!response.ok) throw new Error(`评论接口 HTTP ${response.status}`);
    const payload = await response.json();
    if (payload.errors?.length) throw new Error(payload.errors[0].message || '评论接口返回错误');
    return collectThreadTweets(payload);
  }

  function buildCommentTree(tweets, tweetId) {
    const focalIndex = tweets.findIndex(tweet => tweet.rest_id === tweetId);
    const rootIndex = focalIndex >= 0 ? focalIndex : 0;
    const original = tweets[rootIndex] || null;
    if (!original) return { original: null, candidates: [], byId: new Map(), childrenByParent: new Map(), count: 0 };
    const rootId = original.rest_id;
    const conversationId = original.legacy?.conversation_id_str;
    const candidates = tweets.slice(rootIndex + 1).filter(tweet => {
      if (!tweet?.rest_id || tweet.rest_id === rootId) return false;
      if (conversationId && tweet.legacy?.conversation_id_str !== conversationId) return false;
      if (tweet.promotedMetadata || tweet.legacy?.promoted) return false;
      return true;
    });
    const byId = new Map(candidates.map(tweet => [tweet.rest_id, tweet]));
    const childrenByParent = new Map();
    for (const tweet of candidates) {
      const parentId = tweet.legacy?.in_reply_to_status_id_str;
      // 只保留能连到原帖的回复；父节点不在首屏的旁支（推荐/其它对话）直接丢弃。
      if (parentId !== rootId && !byId.has(parentId)) continue;
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId).push(tweet);
    }
    const reachable = new Set([rootId]);
    const queue = [rootId];
    while (queue.length > 0) {
      const parentId = queue.shift();
      for (const child of childrenByParent.get(parentId) || []) {
        if (reachable.has(child.rest_id)) continue;
        reachable.add(child.rest_id);
        queue.push(child.rest_id);
      }
    }
    return { original, candidates, byId, childrenByParent, count: reachable.size - 1 };
  }

  function renderReplyGroup(tree, parentId, depth) {
    const children = tree.childrenByParent.get(parentId) || [];
    if (children.length === 0) return null;
    const group = commentsEl('div', depth === 0 ? 'xmp-comments-replies' : 'xmp-comments-children');
    for (const child of children) {
      const grandchildren = tree.childrenByParent.get(child.rest_id) || [];
      const parent = parentId === tree.original.rest_id ? tree.original : tree.byId.get(parentId);
      const thread = commentsEl('div', 'xmp-comments-thread');
      thread.appendChild(renderComment(child, { parent, hasChildren: grandchildren.length > 0 }));
      const nested = renderReplyGroup(tree, child.rest_id, depth + 1);
      if (nested) thread.appendChild(nested);
      group.appendChild(thread);
    }
    return group;
  }

  function renderComments(body, tweets, tweetId) {
    body.textContent = '';
    const tree = buildCommentTree(tweets, tweetId);
    const { original, count } = tree;
    const title = commentsModal?.querySelector('.xmp-comments-header h2');
    if (title) title.textContent = STR.commentsTitle(count);
    if (original) {
      const block = commentsEl('div', 'xmp-comments-original');
      block.appendChild(commentsEl('div', 'xmp-comments-original-label', STR.originalPost));
      block.appendChild(renderComment(original));
      body.appendChild(block);
    }
    const group = original ? renderReplyGroup(tree, original.rest_id, 0) : null;
    if (!group) {
      body.appendChild(commentsEl('div', 'xmp-comments-empty', STR.noComments));
      return;
    }
    body.appendChild(group);
    const total = Number(original?.legacy?.reply_count || 0);
    if (total > count) body.appendChild(commentsEl('div', 'xmp-comments-note', STR.firstPage));
  }

  function renderCommentsError(body, tweetId, href) {
    body.textContent = '';
    const error = commentsEl('div', 'xmp-comments-error');
    error.appendChild(document.createTextNode(STR.commentsLoadFailed));
    error.appendChild(document.createElement('br'));
    const retry = commentsEl('button', null, STR.retry);
    retry.type = 'button';
    retry.addEventListener('click', () => {
      closeComments();
      openComments(tweetId, href);
    });
    const open = commentsEl('button', null, STR.openPostNewTab);
    open.type = 'button';
    open.style.marginLeft = '8px';
    open.addEventListener('click', () => window.open(href, '_blank', 'noopener,noreferrer'));
    error.appendChild(retry);
    error.appendChild(open);
    body.appendChild(error);
  }

  function loadComments(body, tweetId, href, scrollTop = 0) {
    if (commentsAbort) commentsAbort.abort();
    const controller = new AbortController();
    commentsAbort = controller;
    body.textContent = '';
    body.appendChild(commentsEl('div', 'xmp-comments-status', STR.loadingComments));
    requestTweetDetail(tweetId, controller.signal)
      .then(tweets => {
        if (!commentsModal || commentsAbort !== controller) return;
        renderComments(body, tweets, tweetId);
        body.scrollTop = scrollTop;
      })
      .catch(error => {
        if (!commentsModal || commentsAbort !== controller || error.name === 'AbortError') return;
        warnOnce('comments', `评论加载失败：${error}`);
        renderCommentsError(body, tweetId, href);
      });
  }

  function refreshComments(message) {
    if (!commentsModal || !commentsTweetId) return;
    const body = commentsModal.querySelector('.xmp-comments-body');
    const panel = commentsModal.querySelector('.xmp-comments-panel');
    if (!body) return;
    const scrollTop = body.scrollTop;
    loadComments(body, commentsTweetId, commentsHref, scrollTop);
    if (message && panel) {
      panel.querySelector('.xmp-comments-notice')?.remove();
      const notice = commentsEl('div', 'xmp-comments-notice', message);
      panel.insertBefore(notice, body);
      window.setTimeout(() => notice.remove(), 3000);
    }
    panel?.focus({ preventScroll: true });
  }

  function closeComments() {
    if (commentsAbort) {
      commentsAbort.abort();
      commentsAbort = null;
    }
    if (commentsKeyHandler) {
      document.removeEventListener('keydown', commentsKeyHandler, true);
      commentsKeyHandler = null;
    }
    commentsComposer = null;
    commentsTweetId = null;
    commentsHref = null;
    if (commentsModal) {
      commentsModal.remove();
      commentsModal = null;
    }
    removeCommentProfile();
    if (commentsReturnFocus?.isConnected) {
      commentsReturnFocus.focus({ preventScroll: true });
    }
    commentsReturnFocus = null;
  }

  function openComments(tweetId, href) {
    if (!enabled || !tweetId) return;
    closeComments();
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overlay = commentsEl('div', 'xmp-comments');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', STR.dialogAria);
    const backdrop = commentsEl('div', 'xmp-comments-backdrop');
    const panel = commentsEl('section', 'xmp-comments-panel');
    panel.tabIndex = -1;

    const header = commentsEl('header', 'xmp-comments-header');
    header.appendChild(commentsEl('h2', null, STR.comments));
    const close = commentsEl('button', 'xmp-comments-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', STR.closeComments);
    header.appendChild(close);

    const body = commentsEl('div', 'xmp-comments-body');
    body.appendChild(commentsEl('div', 'xmp-comments-status', STR.loadingComments));
    panel.appendChild(header);
    panel.appendChild(body);
    overlay.appendChild(backdrop);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);

    commentsModal = overlay;
    commentsReturnFocus = returnFocus;
    commentsTweetId = tweetId;
    commentsHref = href;

    const onKeyDown = event => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (commentsComposer) closeCommentsComposer();
        else closeComments();
        return;
      }
      if (!['PageDown', 'PageUp', 'Home', 'End', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;
      const target = event.target;
      if (target instanceof Element && target.closest('input, textarea, [contenteditable="true"]')) return;
      if (event.key === ' ' && target instanceof Element && target.closest('button, a[href], [role="button"]')) return;
      event.preventDefault();
    };
    commentsKeyHandler = onKeyDown;
    document.addEventListener('keydown', onKeyDown, true);
    close.addEventListener('click', closeComments);
    overlay.addEventListener('click', event => {
      if (event.target === overlay || event.target === backdrop) closeComments();
    });
    const blockBackgroundScroll = event => {
      if (event.target instanceof Element && event.target.closest('.xmp-comments-body')) return;
      event.preventDefault();
    };
    overlay.addEventListener('wheel', blockBackgroundScroll, { passive: false });
    overlay.addEventListener('touchmove', blockBackgroundScroll, { passive: false });
    panel.focus({ preventScroll: true });

    loadComments(body, tweetId, href);
  }

  function watchComments() {
    // 挂在 window 捕获阶段：确保先于 X 和可能仍在运行的旧版脚本拿到评论按钮点击。
    window.addEventListener('click', event => {
      if (!enabled || commentsModal) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const reply = target.closest('[data-testid="reply"]');
      if (!reply || target.closest('[role="dialog"]')) return;
      if (route !== 'home' && route !== 'profile' && route !== 'explore' && route !== 'search') return;
      const tweet = reply.closest(TWEET);
      if (!tweet) return;
      const link = cellStatusLink(tweet.closest(CELL));
      if (!link) return;
      const match = link.getAttribute('href').match(/^\/([^/]+)\/status\/(\d+)/);
      if (!match) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openComments(match[2], link.getAttribute('href'));
    }, true);
  }

  // 设置开启时，主帖正文/时间戳在新标签页打开，home 不卸载；引用帖、正文内链接、媒体和按钮
  // 仍交给 X。只覆盖 home/profile/explore/search 的主帖，其他入口继续走同标签和位置恢复兜底。
  // 设置开启时，主帖正文/时间戳、tweet 头部的头像/用户名在新标签页打开，home 不卸载；
  // 引用帖、正文内链接、媒体和按钮仍交给 X。只覆盖 home/profile/explore/search，
  // 其他入口继续走同标签和位置恢复兜底。
  function isProfileHref(href) {
    try {
      const match = new URL(href, location.href).pathname.match(PROFILE_PATH);
      return !!match && !RESERVED_HANDLES.has(match[1].toLowerCase());
    } catch (error) {
      return false;
    }
  }

  function openInNewTab(href) {
    const opener = document.createElement('a');
    opener.href = href;
    opener.target = '_blank';
    opener.rel = 'noopener noreferrer';
    opener.style.cssText = 'position:fixed;left:-9999px;top:0;';
    document.body.appendChild(opener);
    opener.click();
    opener.remove();
  }

  function watchOpenTargets() {
    window.addEventListener('click', event => {
      if (!enabled || commentsModal) return;
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      // X 的原生资料卡在 tweet 外；头像/用户名等主页链接单独处理，避免落回当前标签。
      const hoverCard = target.closest('[data-testid="HoverCard"]');
      if (hoverCard) {
        const anchor = target.closest('a[href]');
        if (anchor && isProfileHref(anchor.getAttribute('href'))) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          openInNewTab(anchor.href);
        }
        return;
      }
      if (route !== 'home' && route !== 'profile' && route !== 'explore' && route !== 'search') return;
      if (target.closest('[role="dialog"], [data-testid="reply"]')) return;
      const tweet = target.closest(TWEET);
      if (!tweet) return;
      // 引用帖内部仍由 X 处理，避免把外层帖的 status 当成引用帖目标。
      if (tweet.parentElement?.closest(TWEET)) return;
      if (target.closest('button, [role="button"], input, textarea, select, label, [contenteditable="true"]')) return;
      if (target.closest('video, audio, [data-testid="tweetPhoto"], [data-testid="previewInterstitial"], [data-testid="card.wrapper"]')) return;
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) return;
      const anchor = target.closest('a[href]');
      // 头像/用户名链接：只接管 tweet 头部，不接管正文里的 @ 提及。
      if (anchor && !target.closest('[data-testid="tweetText"]') &&
          anchor.closest('[data-testid="User-Name"], [data-testid="Tweet-User-Avatar"]')) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        openInNewTab(anchor.href);
        return;
      }
      const link = cellStatusLink(tweet.closest(CELL));
      if (!link) return;
      if (anchor) {
        let sameStatus = false;
        try {
          sameStatus = new URL(anchor.href, location.href).pathname === new URL(link.href, location.href).pathname;
        } catch (error) {
          sameStatus = false;
        }
        // 只接管指向本帖的时间戳；话题、@、外链、analytics 仍按 X 原行为处理。
        if (!sameStatus) return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openInNewTab(link.href);
    }, true);
  }

  function init() {
    initLocale();
    watchPhotoPreview();
    watchOpenTargets();
    watchComments();
    document.documentElement.dataset.xmpEnabled = '1';
    injectStyles();
    watchGrokDrawer();
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
