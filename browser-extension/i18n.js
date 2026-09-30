// Fit Passport popup — its words, in English and Chinese.
//
// A classic script (no modules, no build step), loaded before popup.js. The
// choice is the popup's own: remembered in this extension's storage, defaulting
// to the browser's language. It is sent to the server with every check
// (x-fp-lang), so reasons and refusals come back in the same language.
//
// English is the source of every key; app-web/src/lib/extensionI18n.test.ts
// requires the Chinese to have the same keys and {placeholders}, every key the
// popup uses to exist, and the Chinese to follow docs/design/chinese-copy.md.

(function (root) {
  "use strict";

  var LANG_KEY = "fp-lang";

  var DICTS = {
    en: {
      language: "Language",
      server: "Server",
      reading: "Reading this page…",
      notPageTitle: "Open a product page, then click Fit Passport.",
      notPageBody: "It reads the page you are looking at, when you click it — and this tab isn't a web page it can read.",
      cantReadTitle: "This page can't be read.",
      cantReadBody: "The browser doesn't let extensions read this page.",
      tooLargeTitle: "This page is too large to send.",
      tooLargeBody: "Even reduced to its product parts it is over the limit, which usually means it is not a single product page.",
      thisPage: "This page",
      detailsFromAttrs: "Product details — {brand}, from the page's parameter list",
      detailsWithBrand: "Product details — {brand}",
      details: "Product details",
      titleOnly: "Only the product name (the garment type is read from it)",
      noDetails: "No product details (the page may still work)",
      chart: "Size chart — {n} rows",
      noChart: "No size chart on the page yet",
      options: "Size options listed",
      noOptions: "No size options listed",
      chartImage: "A size-chart image the server can try to read",
      pictureDescription: "The description is pictures — sizing doesn't need it",
      openGuideHint: "If the page has a “Size guide” or “Size chart” link, open it, then press Re-scan — most charts only load once opened.",
      check: "Check my size",
      checkAnyway: "Check anyway",
      rescan: "Re-scan",
      sentNote: "Only the product is sent ({sent} of this {page} page{masked}). Nothing leaves your browser until you press Check.",
      maskedOne: ", {n} contact detail masked",
      maskedOther: ", {n} contact details masked",
      underOneKb: "under 1 KB",
      kb: "{n} KB",
      showSent: "Show exactly what would be sent",
      saveCapture: "Save this capture (for the evaluation)",
      checking: "Checking your size…",
      unreachableTitle: "Couldn't reach Fit Passport.",
      unreachableBody: "No answer from {origin}. Check your connection.",
      unreachableBodyDev: "No answer from {origin}. Check your connection — and that the development server is running.",
      tryAgain: "Try again",
      refusalNoChart: "No size chart on this page",
      refusalUnreadable: "Couldn't read this page",
      refusalNotApparel: "This doesn't look like a garment",
      refusalUnsupported: "Not a size we can check yet",
      refusalNotConnected: "Connect Fit Passport first",
      openFitPassport: "Open Fit Passport",
      tooManyTitle: "Too many checks in a short time.",
      tooManyBody: "Try again in a few minutes.",
      cantSize: "We can't size this",
      failedTitle: "The check didn't go through.",
      failedBody: "The server answered {status}.",
      kindBody: "Body measurements",
      kindGarment: "Garment measurements",
      kindUnknown: "Measurements",
      kindAndReader: "{kind} {reader}",
      readerTable: "from this page's size table",
      readerLlmText: "read by AI from this page's text",
      readerLlmVision: "read by AI from a size-chart image",
      readerHaoXing: "from this page's Chinese size codes",
      readerPage: "from this page",
      kindUnstated: "the page didn't say body or garment",
      kindFromTable: "a range for each size, which is how body charts are written",
      kindFromBrand: "body/garment as the brand's own guide states it",
      brandChart: "{brand}'s published size guide, not this product's own chart",
      brandChartRead: "{brand}'s published size guide, not this product's own chart (read {date})",
      theBrand: "The brand",
      estimated: "The page lists sizes but no measurements",
      inBrowser: "read in your browser",
      undetermined: "Can't tell these sizes apart yet",
      confidence: "{pct}% confidence",
      thisProduct: "This product",
      openFull: "Open full explanation",
      checkAgain: "Check again",
    },
    zh: {
      language: "语言",
      server: "服务器",
      reading: "正在读取这一页…",
      notPageTitle: "先打开一个商品页，再点 Fit Passport。",
      notPageBody: "它只在你点它的时候，读你正在看的那一页——而这个标签页不是它能读的网页。",
      cantReadTitle: "这一页读不了。",
      cantReadBody: "浏览器不允许插件读取这一页。",
      tooLargeTitle: "这一页太大，发不出去。",
      tooLargeBody: "即使只留下商品部分也超出了上限，这通常说明它不是单个商品页。",
      thisPage: "这一页",
      detailsFromAttrs: "商品信息——{brand}，来自页面的参数信息",
      detailsWithBrand: "商品信息——{brand}",
      details: "商品信息",
      titleOnly: "只有商品名称（品类从名称里读）",
      noDetails: "没找到商品信息（页面可能仍然可用）",
      chart: "尺码表——{n} 行",
      noChart: "页面上暂时没有尺码表",
      options: "找到了尺码选项",
      noOptions: "没找到尺码选项",
      chartImage: "有一张尺码表图片，服务器可以尝试识别",
      pictureDescription: "商品介绍是图片——不影响尺码推荐",
      openGuideHint: "如果页面上有「尺码指南」「尺码表」或「尺码信息」，先点开它，再按重新扫描——大多数尺码表要点开才会加载。",
      check: "查我的尺码",
      checkAnyway: "仍然查一下",
      rescan: "重新扫描",
      // Reads right for both "不到 1 KB" and "11 KB" in {sent}.
      sentNote: "只发送商品部分：{sent}，整页 {page}{masked}。按下查询之前，什么都不会离开你的浏览器。",
      maskedOne: "，已遮盖 {n} 处联系方式",
      maskedOther: "，已遮盖 {n} 处联系方式",
      underOneKb: "不到 1 KB",
      kb: "{n} KB",
      showSent: "看看具体会发送什么",
      saveCapture: "保存这份采集（用于评估）",
      checking: "正在查你的尺码…",
      unreachableTitle: "连不上 Fit Passport。",
      unreachableBody: "{origin} 没有回应，请检查网络连接。",
      unreachableBodyDev: "{origin} 没有回应，请检查网络连接，以及开发服务器是否在运行。",
      tryAgain: "再试一次",
      refusalNoChart: "这一页没有尺码表",
      refusalUnreadable: "没能读懂这一页",
      refusalNotApparel: "这看起来不是衣服",
      refusalUnsupported: "这类尺码暂时还查不了",
      refusalNotConnected: "请先连接 Fit Passport",
      openFitPassport: "打开 Fit Passport",
      tooManyTitle: "短时间内查得太多了。",
      tooManyBody: "过几分钟再试。",
      cantSize: "这件没法推荐尺码",
      failedTitle: "没查成。",
      failedBody: "服务器返回了 {status}。",
      kindBody: "人体尺寸",
      kindGarment: "成衣尺寸",
      kindUnknown: "尺寸",
      kindAndReader: "{kind}，{reader}",
      readerTable: "来自本页的尺码表",
      readerLlmText: "由 AI 从本页文字读出",
      readerLlmVision: "由 AI 从尺码表图片读出",
      readerHaoXing: "来自本页的号型",
      readerPage: "来自本页",
      kindUnstated: "页面没说是人体尺寸还是成衣尺寸",
      kindFromTable: "每个码是一个区间，人体尺码表通常这样写",
      kindFromBrand: "人体或成衣，按品牌自己的指南认定",
      brandChart: "{brand} 官方公布的尺码指南，不是这件商品自己的尺码表",
      brandChartRead: "{brand} 官方公布的尺码指南，不是这件商品自己的尺码表（读取于 {date}）",
      theBrand: "品牌",
      estimated: "页面列出了尺码，但没有尺寸",
      inBrowser: "在你的浏览器里读取",
      undetermined: "暂时还分不出这几个码",
      confidence: "把握 {pct}%",
      thisProduct: "这件商品",
      openFull: "查看完整解释",
      checkAgain: "再查一次",
    },
  };

  function lang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) { /* storage blocked */ }
    if (saved === "en" || saved === "zh") return saved;
    var nav = (root.navigator && (root.navigator.language || "")) || "";
    return /^zh/i.test(nav) ? "zh" : "en";
  }

  function setLang(l) {
    try { localStorage.setItem(LANG_KEY, l); } catch (e) { /* remembered for this popup only */ }
  }

  function t(key, params) {
    var d = DICTS[lang()];
    var s = d[key] != null ? d[key] : DICTS.en[key] != null ? DICTS.en[key] : key;
    return String(s).replace(/\{(\w+)\}/g, function (m, k) {
      return params && k in params ? String(params[k]) : m;
    });
  }

  root.FP_I18N = { DICTS: DICTS, lang: lang, setLang: setLang, t: t };
})(typeof globalThis !== "undefined" ? globalThis : this);
