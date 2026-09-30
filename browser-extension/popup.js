// Fit Passport popup: read this page, show what was found, send only on "Check".
//
// Acquisition and display only. The size, the confidence, the reasons and every
// refusal come from the Fit Passport API — the popup computes none of them, so
// there is exactly one recommendation engine and it is the one that is tested.
//
// Everything the server says is rendered with textContent, never innerHTML.

"use strict";

(function () {
  var CFG = globalThis.FP_CONFIG;
  var I18N = globalThis.FP_I18N;
  var t = I18N.t;
  var app = document.getElementById("app");
  var originSelect = document.getElementById("origin");
  var ORIGIN_KEY = "fp-origin";

  // ---- language: the popup's own switch (i18n.js) ----

  var langSwitch = document.getElementById("lang");
  function applyLang() {
    document.documentElement.lang = I18N.lang() === "zh" ? "zh-CN" : "en";
    document.getElementById("server-label").textContent = t("server");
    langSwitch.setAttribute("aria-label", t("language"));
    Array.prototype.forEach.call(langSwitch.querySelectorAll("button"), function (b) {
      b.setAttribute("aria-pressed", String(b.value === I18N.lang()));
    });
  }
  langSwitch.addEventListener("click", function (e) {
    var b = e.target.closest("button");
    if (!b || b.value === I18N.lang()) return;
    I18N.setLang(b.value);
    applyLang();
    start(); // re-read and re-render in the chosen language; nothing is sent
  });
  applyLang();

  // ---- settings ----

  function origin() {
    var saved = null;
    try { saved = localStorage.getItem(ORIGIN_KEY); } catch (e) { /* storage blocked */ }
    var known = CFG.origins.some(function (o) { return o.url === saved; });
    return known ? saved : CFG.origins[0].url;
  }

  CFG.origins.forEach(function (o) {
    var opt = document.createElement("option");
    opt.value = o.url;
    opt.textContent = o.label;
    originSelect.appendChild(opt);
  });
  originSelect.value = origin();
  originSelect.addEventListener("change", function () {
    try { localStorage.setItem(ORIGIN_KEY, originSelect.value); } catch (e) { /* ignore */ }
    start();
  });

  // ---- tiny DOM builder: text is always text ----

  function el(tag, props, children) {
    var node = document.createElement(tag);
    Object.keys(props || {}).forEach(function (k) {
      if (k === "text") node.textContent = props[k];
      else if (k === "onclick") node.addEventListener("click", props[k]);
      else if (k === "className") node.className = props[k];
      else node.setAttribute(k, props[k]);
    });
    (children || []).forEach(function (c) {
      if (c == null || c === false) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  }

  function show() {
    app.textContent = "";
    Array.prototype.forEach.call(arguments, function (n) { if (n) app.appendChild(n); });
  }

  function button(label, onclick, primary) {
    return el("button", { text: label, onclick: onclick, className: primary ? "primary" : "" });
  }

  function message(title, body, actions) {
    show(
      el("p", { className: "title", text: title }),
      body ? el("p", { className: "muted", text: body }) : null,
      actions && actions.length ? el("div", { className: "actions" }, actions) : null
    );
  }

  function openTab(url) {
    chrome.tabs.create({ url: url });
    window.close();
  }

  function kb(chars) {
    return chars < 1024 ? t("underOneKb") : t("kb", { n: Math.round(chars / 1024) });
  }

  // ---- 1. read the page (nothing leaves the browser here) ----

  async function activeTab() {
    var tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    return tabs[0];
  }

  async function capture(tabId) {
    // capture.js defines globalThis.fpCapture in the extension's isolated world
    // for this tab; the second call runs it against the live page.
    await chrome.scripting.executeScript({ target: { tabId: tabId }, files: ["capture.js"] });
    var results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: function () { return globalThis.fpCapture(document, location); },
    });
    return results && results[0] ? results[0].result : null;
  }

  async function start() {
    show(el("p", { className: "muted", text: t("reading") }));
    var tab;
    try { tab = await activeTab(); } catch (e) { /* fall through */ }
    if (!tab || !/^https?:/i.test(tab.url || "")) {
      return message(t("notPageTitle"), t("notPageBody"));
    }
    var cap;
    try {
      cap = await capture(tab.id);
    } catch (e) {
      return message(t("cantReadTitle"), t("cantReadBody"));
    }
    if (!cap || !cap.ok) {
      return message(t("tooLargeTitle"), t("tooLargeBody"));
    }
    preview(cap, tab);
  }

  // ---- 2. show what was found, and exactly what would be sent ----

  function preview(cap, tab) {
    var f = cap.found;
    var hasChart = f.sizeTables > 0 || f.chartImages > 0;
    // Three states for the product line. Marketplace pages (Tmall, Taobao, JD)
    // publish no schema.org data; their details come from the page's parameter
    // list, and failing that the name alone — which still names the garment.
    var details = f.productData
      ? (f.brand ? t(f.attrs ? "detailsFromAttrs" : "detailsWithBrand", { brand: f.brand }) : t("details"))
      : f.title
        ? t("titleOnly")
        : t("noDetails");
    var items = [
      [f.productData, details],
      [f.sizeTables > 0, f.sizeTables > 0 ? t("chart", { n: f.sizeRows }) : t("noChart")],
      [f.sizeOptions > 0, f.sizeOptions > 0 ? t("options") : t("noOptions")],
    ];
    // An image only matters when there is no table: the server reads a table
    // first and goes to its image reader only when it finds none.
    if (f.chartImages > 0 && f.sizeTables === 0) items.push([true, t("chartImage")]);
    // Neutral, not a failure: a listing whose description is all pictures has no
    // product text to read, and the size does not depend on it.
    if (f.pictureDescription) items.push(["info", t("pictureDescription")]);

    var what = el("pre", { text: cap.html });
    show(
      el("p", { className: "title", text: f.title || tab.title || t("thisPage") }),
      el("div", { className: "card" }, [
        el("ul", { className: "found" }, items.map(function (it) {
          var state = it[0] === "info" ? "info" : it[0] ? "yes" : "no";
          return el("li", { className: state }, [
            el("span", { className: "mark", text: state === "yes" ? "✓" : state === "info" ? "·" : "–" }),
            el("span", { text: it[1] }),
          ]);
        })),
      ]),
      hasChart ? null : el("p", { className: "hint", text: t("openGuideHint") }),
      el("div", { className: "actions" }, [
        button(hasChart ? t("check") : t("checkAnyway"), function () { send(cap); }, true),
        button(t("rescan"), start),
        button(t("saveToBuy"), function () { saveForm(cap, null, function () { preview(cap, tab); }); }),
      ]),
      el("p", {
        className: "small",
        text: t("sentNote", {
          sent: kb(cap.stats.payloadChars),
          page: kb(cap.stats.domChars),
          masked: cap.stats.masked ? t(cap.stats.masked === 1 ? "maskedOne" : "maskedOther", { n: cap.stats.masked }) : "",
        }),
      }),
      el("details", {}, [
        el("summary", { text: t("showSent") }),
        what,
        el("div", { className: "actions" }, [
          button(t("saveCapture"), function () { saveCapture(cap); }),
        ]),
      ])
    );
  }

  // For the evaluation (app-web/eval/README.md): save exactly what would be sent,
  // as a capture file. Sites that block automated browsers (H&M, REI) have to be
  // captured by a person, in their own browser, and this is how. Nothing is sent.
  function saveCapture(cap) {
    var slug = String(cap.found.title || "capture").toLowerCase()
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "capture";
    var payload = {
      url: cap.url,
      capturedAt: new Date().toISOString(),
      extensionVersion: CFG.version,
      loggedIn: null, // the person capturing confirms a logged-out profile (README)
      capturedBy: "extension popup",
      html: cap.html,
      stats: cap.stats,
    };
    var a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    a.download = slug + ".capture.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  // ---- 3. send, and render whatever the API says ----

  async function send(cap) {
    show(el("p", { className: "muted", text: t("checking") }));
    var res;
    var body = null;
    try {
      res = await fetch(origin() + "/api/check", {
        method: "POST",
        // Carries the Fit Passport session: Chrome treats this request as
        // same-site because the manifest grants host permission for the origin.
        credentials: "include",
        // x-fp-lang: the popup's language, so reasons and refusals come back in it.
        headers: { "content-type": "application/json", "x-fp-client": "extension/" + CFG.version, "x-fp-lang": I18N.lang() },
        body: JSON.stringify({ url: cap.url, html: cap.html }),
      });
      try { body = await res.json(); } catch (e) { body = null; }
    } catch (e) {
      return message(
        t("unreachableTitle"),
        t(origin().indexOf("localhost") >= 0 ? "unreachableBodyDev" : "unreachableBody", { origin: origin() }),
        [button(t("tryAgain"), function () { send(cap); }, true)]
      );
    }
    if (res.ok && body && body.result) return result(body, cap);
    refusal(res.status, body || {}, cap);
  }

  var REFUSAL_TITLES = {
    "no-chart-on-page": "refusalNoChart",
    unreadable: "refusalUnreadable",
    "not-apparel": "refusalNotApparel",
    "unsupported-category": "refusalUnsupported",
    "not-connected": "refusalNotConnected",
  };

  function refusal(status, body, cap) {
    var code = typeof body.error === "string" ? body.error : "";
    if (status === 401) {
      return message(t(REFUSAL_TITLES["not-connected"]), body.message, [
        button(t("openFitPassport"), function () { openTab(origin()); }, true),
      ]);
    }
    if (status === 429) {
      return message(t("tooManyTitle"), t("tooManyBody"));
    }
    if (status === 422) {
      return message(REFUSAL_TITLES[code] ? t(REFUSAL_TITLES[code]) : t("cantSize"), body.message, [
        code === "no-chart-on-page" ? button(t("rescan"), start, true) : null,
      ].filter(Boolean));
    }
    message(
      t("failedTitle"),
      typeof body.message === "string" ? body.message : t("failedBody", { status: status }),
      [button(t("tryAgain"), function () { send(cap); }, true)]
    );
  }

  // Where the numbers came from, in the fewest true words — mirrors /check.
  function provenance(source, brand) {
    if (!source) return "";
    var parts = [];
    if (source.sizesFrom === "page") {
      var kind = source.measurementKind === "body" ? t("kindBody")
        : source.measurementKind === "garment" ? t("kindGarment") : t("kindUnknown");
      var reader = t({
        table: "readerTable",
        "llm-text": "readerLlmText",
        "llm-vision": "readerLlmVision",
        "hao-xing": "readerHaoXing",
      }[source.extractedBy] || "readerPage");
      parts.push(t("kindAndReader", { kind: kind, reader: reader }));
      if (!source.measurementKind) parts.push(t("kindUnstated"));
      else if (source.measurementKindFrom === "table") parts.push(t("kindFromTable"));
      else if (source.measurementKindFrom === "brand") parts.push(t("kindFromBrand"));
    } else if (source.sizesFrom === "brand-chart") {
      var b = brand || t("theBrand");
      parts.push(source.chart ? t("brandChartRead", { brand: b, date: source.chart.capturedAt }) : t("brandChart", { brand: b }));
    } else if (source.sizesFrom === "estimated") {
      parts.push(t("estimated"));
    }
    if (source.fetch === "extension") parts.push(t("inBrowser"));
    return parts.join(" · ");
  }

  function result(data, cap) {
    var r = data.result;
    var best = r.best || {};
    var lines = String(r.explanation || "").split("\n").map(function (l) { return l.trim(); });
    var reasons = lines
      .filter(function (l) { return /^•/.test(l); })
      .map(function (l) { return l.replace(/^•\s*/, ""); })
      .slice(0, 3);
    // In a near-tie the engine names the runner-up — the line a low confidence
    // most needs beside it. The structured field when the server sends it; the
    // English prose line from a server that predates it.
    var alternative = r.alternative || lines.filter(function (l) { return /^Alternative:/.test(l); })[0];
    var notes = [alternative, r.conflictNote, r.domainNote].filter(Boolean);

    var head = r.undetermined
      ? el("div", {}, [
          el("p", { className: "title", text: t("undetermined") }),
          el("p", { className: "muted", text: r.explanation }),
        ])
      : el("div", {}, [
          el("div", { className: "size-line" }, [
            el("span", { className: "size", text: best.label }),
            el("span", { className: "conf", text: t("confidence", { pct: Math.round((best.confidence || 0) * 100) }) }),
            best.verdict ? el("span", { className: "chip", text: verdictWord(best.verdict) }) : null,
          ]),
          reasons.length ? el("ul", { className: "reasons" }, reasons.map(function (t) { return el("li", { text: t }); })) : null,
        ]);

    show(
      el("p", { className: "title", text: (data.product && data.product.productName) || t("thisProduct") }),
      el("div", { className: "card" }, [
        head,
        notes.length ? el("p", { className: "note", text: notes.join(" ") }) : null,
        el("p", { className: "source", text: provenance(data.source, data.product && data.product.brand) }),
      ]),
      el("div", { className: "actions" }, [
        button(t("openFull"), function () {
          openTab(origin() + "/check?product=" + encodeURIComponent(data.product.id));
        }, true),
        button(t("checkAgain"), start),
        cap ? button(t("saveToBuy"), function () { saveForm(cap, data, function () { result(data, cap); }); }) : null,
      ])
    );
  }

  // The engine's verdict is an English key; the words are the popup's.
  var VERDICT_KEYS = { "too small": "verdictTooSmall", snug: "verdictSnug", "true to size": "verdictTrue", relaxed: "verdictRelaxed", "too big": "verdictTooBig" };
  function verdictWord(v) { return VERDICT_KEYS[v] ? t(VERDICT_KEYS[v]) : v; }

  // ---- 4. save to the to-buy list (Session 80) ----
  //
  // A saved product is not a garment the user owns: the server keeps it apart from
  // the closet, and nothing that recommends a size reads it. The user confirms what
  // is saved — name, brand, the size they mean to buy — before anything is sent.
  // After a check, the stored check is referenced instead of resending the page.

  function field(label, input) {
    return el("label", { className: "field" }, [el("span", { text: label }), input]);
  }

  function saveForm(cap, data, back) {
    var f = cap.found;
    var product = data && data.product;
    var sizes = f.sizes || [];
    var nameIn = el("input", { type: "text", maxlength: "200", value: (product && product.productName) || f.title || "" });
    var brandIn = el("input", { type: "text", maxlength: "80", value: (product && product.brand) || f.brand || "" });
    var sizeIn;
    if (sizes.length) {
      sizeIn = el("select", {}, [el("option", { value: "", text: t("noSize") })].concat(sizes.map(function (z) {
        var o = el("option", { value: z, text: z });
        if (z === f.selectedSize) o.setAttribute("selected", "");
        return o;
      })));
    } else {
      sizeIn = el("input", { type: "text", maxlength: "24", value: f.selectedSize || "" });
    }
    var noteIn = el("input", { type: "text", maxlength: "500", placeholder: t("notePlaceholder") });
    var go = button(t("saveConfirm"), function () {
      submitSave(cap, product, {
        productName: nameIn.value.trim(),
        brand: brandIn.value.trim(),
        size: sizeIn.value.trim(),
        note: noteIn.value.trim(),
      }, back);
    }, true);
    show(
      el("p", { className: "title", text: t("saveTitle") }),
      el("p", { className: "muted", text: t("saveIntro") }),
      el("div", { className: "card form" }, [
        field(t("fieldName"), nameIn),
        field(t("fieldBrand"), brandIn),
        field(t("fieldSize"), sizeIn),
        field(t("fieldNote"), noteIn),
      ]),
      el("div", { className: "actions" }, [go, button(t("back"), back)])
    );
  }

  async function savedRequest(method, path, body) {
    var res = await fetch(origin() + path, {
      method: method,
      credentials: "include",
      headers: { "content-type": "application/json", "x-fp-client": "extension/" + CFG.version, "x-fp-lang": I18N.lang() },
      body: body ? JSON.stringify(body) : undefined,
    });
    var json = null;
    try { json = await res.json(); } catch (e) { json = null; }
    return { res: res, body: json || {} };
  }

  async function submitSave(cap, product, fields, back) {
    show(el("p", { className: "muted", text: t("saving") }));
    var r;
    try {
      r = await savedRequest("POST", "/api/saved", {
        url: cap.url,
        // The stored check already holds what the page said; otherwise the same
        // reduced page the preview showed, and nothing more.
        productId: product ? product.id : undefined,
        html: product ? undefined : cap.html,
        productName: fields.productName,
        brand: fields.brand,
        size: fields.size,
        note: fields.note,
      });
    } catch (e) {
      return message(
        t("unreachableTitle"),
        t(origin().indexOf("localhost") >= 0 ? "unreachableBodyDev" : "unreachableBody", { origin: origin() }),
        [button(t("tryAgain"), function () { submitSave(cap, product, fields, back); }, true), button(t("back"), back)]
      );
    }
    var status = r.res.status;
    if (r.res.ok) {
      return message(t("savedTitle"), t("savedBody"), [
        button(t("viewSaved"), function () { openTab(origin() + "/saved"); }, true),
        button(t("back"), back),
      ]);
    }
    if (status === 409 && r.body.item) {
      var item = r.body.item;
      var actions = [];
      if (fields.size && fields.size !== item.size) {
        actions.push(button(t("updateSize", { size: fields.size }), function () { updateSize(item, fields.size, back); }, true));
      }
      actions.push(button(t("viewSaved"), function () { openTab(origin() + "/saved"); }, actions.length === 0));
      actions.push(button(t("back"), back));
      return message(t("alreadyTitle"), t("alreadyBody", { size: item.size || t("noSize") }), actions);
    }
    if (status === 401) {
      return message(t(REFUSAL_TITLES["not-connected"]), r.body.message, [
        button(t("openFitPassport"), function () { openTab(origin()); }, true),
      ]);
    }
    if (status === 429) return message(t("tooManyTitle"), t("tooManyBody"), [button(t("back"), back)]);
    message(t("saveFailedTitle"), typeof r.body.message === "string" ? r.body.message : t("failedBody", { status: status }), [
      button(t("tryAgain"), function () { submitSave(cap, product, fields, back); }, true),
      button(t("back"), back),
    ]);
  }

  async function updateSize(item, size, back) {
    show(el("p", { className: "muted", text: t("saving") }));
    try {
      var r = await savedRequest("PATCH", "/api/saved", { id: item.id, size: size });
      if (r.res.ok) {
        return message(t("updated", { size: size }), null, [
          button(t("viewSaved"), function () { openTab(origin() + "/saved"); }, true),
          button(t("back"), back),
        ]);
      }
      message(t("saveFailedTitle"), typeof r.body.message === "string" ? r.body.message : t("failedBody", { status: r.res.status }), [button(t("back"), back)]);
    } catch (e) {
      message(t("unreachableTitle"), t("unreachableBody", { origin: origin() }), [button(t("back"), back)]);
    }
  }

  start();
})();
