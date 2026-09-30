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
  var app = document.getElementById("app");
  var originSelect = document.getElementById("origin");
  var ORIGIN_KEY = "fp-origin";

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
    return chars < 1024 ? "under 1 KB" : Math.round(chars / 1024) + " KB";
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
    show(el("p", { className: "muted", text: "Reading this page…" }));
    var tab;
    try { tab = await activeTab(); } catch (e) { /* fall through */ }
    if (!tab || !/^https?:/i.test(tab.url || "")) {
      return message(
        "Open a product page, then click Fit Passport.",
        "It reads the page you are looking at, when you click it — and this tab isn't a web page it can read."
      );
    }
    var cap;
    try {
      cap = await capture(tab.id);
    } catch (e) {
      return message("This page can't be read.", "The browser doesn't let extensions read this page.");
    }
    if (!cap || !cap.ok) {
      return message(
        "This page is too large to send.",
        "Even reduced to its product parts it is over the limit, which usually means it is not a single product page."
      );
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
      ? (f.brand ? "Product details — " + f.brand + (f.attrs ? ", from the page's parameter list" : "") : "Product details")
      : f.title
        ? "Only the product name (the garment type is read from it)"
        : "No product details (the page may still work)";
    var items = [
      [f.productData, details],
      [f.sizeTables > 0, f.sizeTables > 0 ? "Size chart — " + f.sizeRows + " rows" : "No size chart on the page yet"],
      [f.sizeOptions > 0, f.sizeOptions > 0 ? "Size options listed" : "No size options listed"],
    ];
    // An image only matters when there is no table: the server reads a table
    // first and goes to its image reader only when it finds none.
    if (f.chartImages > 0 && f.sizeTables === 0) items.push([true, "A size-chart image the server can try to read"]);
    // Neutral, not a failure: a listing whose description is all pictures has no
    // product text to read, and the size does not depend on it.
    if (f.pictureDescription) items.push(["info", "The description is pictures — sizing doesn't need it"]);

    var what = el("pre", { text: cap.html });
    show(
      el("p", { className: "title", text: f.title || tab.title || "This page" }),
      el("div", { className: "card" }, [
        el("ul", { className: "found" }, items.map(function (it) {
          var state = it[0] === "info" ? "info" : it[0] ? "yes" : "no";
          return el("li", { className: state }, [
            el("span", { className: "mark", text: state === "yes" ? "✓" : state === "info" ? "·" : "–" }),
            el("span", { text: it[1] }),
          ]);
        })),
      ]),
      hasChart ? null : el("p", {
        className: "hint",
        text: "If the page has a “Size guide” or “Size chart” link, open it, then press Re-scan — most charts only load once opened.",
      }),
      el("div", { className: "actions" }, [
        button(hasChart ? "Check my size" : "Check anyway", function () { send(cap); }, true),
        button("Re-scan", start),
      ]),
      el("p", {
        className: "small",
        text:
          "Only the product is sent (" + kb(cap.stats.payloadChars) + " of this " + kb(cap.stats.domChars) + " page" +
          (cap.stats.masked ? ", " + cap.stats.masked + " contact detail" + (cap.stats.masked === 1 ? "" : "s") + " masked" : "") +
          "). Nothing leaves your browser until you press Check.",
      }),
      el("details", {}, [
        el("summary", { text: "Show exactly what would be sent" }),
        what,
        el("div", { className: "actions" }, [
          button("Save this capture (for the evaluation)", function () { saveCapture(cap); }),
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
    show(el("p", { className: "muted", text: "Checking your size…" }));
    var res;
    var body = null;
    try {
      res = await fetch(origin() + "/api/check", {
        method: "POST",
        // Carries the Fit Passport session: Chrome treats this request as
        // same-site because the manifest grants host permission for the origin.
        credentials: "include",
        headers: { "content-type": "application/json", "x-fp-client": "extension/" + CFG.version },
        body: JSON.stringify({ url: cap.url, html: cap.html }),
      });
      try { body = await res.json(); } catch (e) { body = null; }
    } catch (e) {
      return message(
        "Couldn't reach Fit Passport.",
        "No answer from " + origin() + ". Check your connection" +
          (origin().indexOf("localhost") >= 0 ? " — and that the development server is running." : "."),
        [button("Try again", function () { send(cap); }, true)]
      );
    }
    if (res.ok && body && body.result) return result(body);
    refusal(res.status, body || {}, cap);
  }

  var REFUSAL_TITLES = {
    "no-chart-on-page": "No size chart on this page",
    unreadable: "Couldn't read this page",
    "not-apparel": "This doesn't look like a garment",
    "unsupported-category": "Not a size we can check yet",
    "not-connected": "Connect Fit Passport first",
  };

  function refusal(status, body, cap) {
    var code = typeof body.error === "string" ? body.error : "";
    if (status === 401) {
      return message(REFUSAL_TITLES["not-connected"], body.message, [
        button("Open Fit Passport", function () { openTab(origin()); }, true),
      ]);
    }
    if (status === 429) {
      return message("Too many checks in a short time.", "Try again in a few minutes.");
    }
    if (status === 422) {
      return message(REFUSAL_TITLES[code] || "We can't size this", body.message, [
        code === "no-chart-on-page" ? button("Re-scan", start, true) : null,
      ].filter(Boolean));
    }
    message(
      "The check didn't go through.",
      typeof body.message === "string" ? body.message : "The server answered " + status + ".",
      [button("Try again", function () { send(cap); }, true)]
    );
  }

  // Where the numbers came from, in the fewest true words — mirrors /check.
  function provenance(source, brand) {
    if (!source) return "";
    var parts = [];
    if (source.sizesFrom === "page") {
      var kind = source.measurementKind === "body" ? "Body measurements"
        : source.measurementKind === "garment" ? "Garment measurements" : "Measurements";
      var reader = {
        table: "from this page's size table",
        "llm-text": "read by AI from this page's text",
        "llm-vision": "read by AI from a size-chart image",
        "hao-xing": "from this page's Chinese size codes",
      }[source.extractedBy] || "from this page";
      parts.push(kind + " " + reader);
      if (!source.measurementKind) parts.push("the page didn't say body or garment");
      else if (source.measurementKindFrom === "table") parts.push("a range for each size, which is how body charts are written");
      else if (source.measurementKindFrom === "brand") parts.push("body/garment as the brand's own guide states it");
    } else if (source.sizesFrom === "brand-chart") {
      parts.push((brand || "The brand") + "'s published size guide, not this product's own chart" +
        (source.chart ? " (read " + source.chart.capturedAt + ")" : ""));
    } else if (source.sizesFrom === "estimated") {
      parts.push("The page lists sizes but no measurements");
    }
    if (source.fetch === "extension") parts.push("read in your browser");
    return parts.join(" · ");
  }

  function result(data) {
    var r = data.result;
    var best = r.best || {};
    var lines = String(r.explanation || "").split("\n").map(function (l) { return l.trim(); });
    var reasons = lines
      .filter(function (l) { return /^•/.test(l); })
      .map(function (l) { return l.replace(/^•\s*/, ""); })
      .slice(0, 3);
    // In a near-tie the engine names the runner-up — the line a low confidence
    // most needs beside it.
    var alternative = lines.filter(function (l) { return /^Alternative:/.test(l); })[0];
    var notes = [alternative, r.conflictNote, r.domainNote].filter(Boolean);

    var head = r.undetermined
      ? el("div", {}, [
          el("p", { className: "title", text: "Can't tell these sizes apart yet" }),
          el("p", { className: "muted", text: r.explanation }),
        ])
      : el("div", {}, [
          el("div", { className: "size-line" }, [
            el("span", { className: "size", text: best.label }),
            el("span", { className: "conf", text: Math.round((best.confidence || 0) * 100) + "% confidence" }),
            best.verdict ? el("span", { className: "chip", text: best.verdict }) : null,
          ]),
          reasons.length ? el("ul", { className: "reasons" }, reasons.map(function (t) { return el("li", { text: t }); })) : null,
        ]);

    show(
      el("p", { className: "title", text: (data.product && data.product.productName) || "This product" }),
      el("div", { className: "card" }, [
        head,
        notes.length ? el("p", { className: "note", text: notes.join(" ") }) : null,
        el("p", { className: "source", text: provenance(data.source, data.product && data.product.brand) }),
      ]),
      el("div", { className: "actions" }, [
        button("Open full explanation", function () {
          openTab(origin() + "/check?product=" + encodeURIComponent(data.product.id));
        }, true),
        button("Check again", start),
      ])
    );
  }

  start();
})();
