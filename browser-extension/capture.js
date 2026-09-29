// Fit Passport — page capture.
//
// Runs ONLY when the user clicks the extension, ONLY in the tab they are looking
// at (activeTab), and reads ONLY the parts of a product page that the server's
// size parser uses. It returns them as a small HTML document — the same shape the
// server already parses (app-web/src/lib/pageParse.ts) — so nothing about parsing
// or recommending lives in the extension. See docs/design/browser-extension.md.
//
// ALLOWLIST, not denylist. A logged-in page shows who you are in more places than
// anyone can enumerate (a greeting, a cart drawer, a saved address, a recently
// viewed rail), so this never tries to delete the private parts of a page. It
// builds a new document out of the few parts that are known to be product:
//   • <title>, and a few product meta tags
//   • schema.org Product / ProductGroup / BreadcrumbList JSON-LD, cut down to a
//     short list of keys — reviews (other people's names) are dropped
//   • the first <h1>
//   • every table that mentions a measurement, rebuilt as plain-text cells, plus
//     a little text from the dialog or section holding it
//   • any sentence saying the chart is body or garment measurements
//   • the page's size <select> options and data-size swatch values
//   • <img> tags that look like size-chart images (address and alt text)
// Never: forms or their values, cart, account, header, nav, footer, reviews,
// iframes, scripts (other than the JSON-LD above), styles, cookies, storage.
// Emails, phone numbers and card-like numbers that slip into kept TEXT are
// masked, and the popup shows the user exactly what will be sent before any of it
// is.
//
// A classic script (no modules, no build step) defining globalThis.fpCapture, so
// the popup can inject it with chrome.scripting and the tests can load it into
// jsdom. The constants that must agree with the server parser are exposed on
// fpCapture and checked against it by app-web/src/lib/extensionCapture.test.ts.

(function (root) {
  "use strict";

  var VERSION = "0.1.0";

  // The server refuses supplied markup over 1,000,000 characters. A capture this
  // big means something went wrong, and the popup says so instead of sending it.
  var MAX_PAYLOAD = 900000;
  // Text kept from the dialog/section around each size table. That is where a
  // page says "these are body measurements"; it is also as far as we reach.
  var CONTEXT_CHARS = 1500;
  // Characters kept either side of a body/garment sentence found elsewhere.
  var SNIPPET_RADIUS = 100;
  var MAX_SWATCH_VALUES = 100;
  var MAX_CHART_IMAGES = 10;

  // ---- Must equal the server parser. Checked by extensionCapture.test.ts. ----

  // pageParse.ts KIND_PATTERNS — the sentences that say what a chart measures.
  // NO \b on the CJK patterns: word boundaries are ASCII-defined and never match
  // at a CJK boundary (invariant ⑫).
  var KIND_BODY = [
    /\bbody measurements?\b/i,
    /measurements?\s+(?:below\s+)?(?:are|is)\s+(?:the\s+)?body\b/i,
    /(?:人体|净体)(?:尺寸|测量|围度)/,
  ];
  var KIND_GARMENT = [
    /\bgarment measurements?\b/i,
    /\b(?:measured|laid|lying)\s+flat\b/i,
    /\bflat measurements?\b/i,
    /\bproduct measurements?\b/i,
    /(?:平铺|衣服)(?:尺寸|测量)/,
  ];
  // pageParse.ts SIZE_SELECT_RE — which <select> holds sizes.
  var SIZE_SELECT_RE = /size|尺码|规格/i;
  // pageParse.ts CHART_IMG_TOKENS — what marks an <img> as a size chart.
  var CHART_IMG_TOKENS = [
    "size-chart", "sizechart", "size_chart", "size-guide", "sizeguide", "size-table",
    "尺码表", "尺寸表", "尺码", "尺寸", "measurement", "measurements", "规格",
  ];

  // A table is kept when it mentions any measurement. This must be a SUPERSET of
  // what pageParse.ts MEASURE_MAP can read — a table the parser would have used
  // but the capture dropped is a silent regression, so the test derives a sample
  // from every MEASURE_MAP alternative and requires a match here. The extras (hip,
  // inseam, width, 身幅…) are headers the parser cannot read yet; keeping them now
  // means a parser improvement does not also need an extension update.
  var MEASURE_RE =
    /chest|bust|waist|hip|shoulder|sleeve|arm\s*length|length|inseam|width|pit\s*to\s*pit|胸围|胸|腰围|腰|臀|肩宽|肩|袖长|袖|衣长|总长|后中长|身幅|着丈|裄丈|肩幅/i;

  // ---- Allowlists ----

  var META_KEYS = ["og:title", "og:description", "og:site_name", "og:type", "product:brand", "description"];
  var LD_TYPES = ["product", "productgroup", "breadcrumblist"];
  var LD_KEYS = {
    "@context": 1, "@type": 1, "@id": 1, name: 1, brand: 1, category: 1, material: 1,
    color: 1, size: 1, sku: 1, mpn: 1, gtin: 1, gtin8: 1, gtin12: 1, gtin13: 1, gtin14: 1,
    description: 1, audience: 1, suggestedGender: 1, suggestedAge: 1, itemListElement: 1,
  };
  // Query parameters that identify a product or variant. Everything else — utm_*,
  // click ids, email links' own parameters, session tokens — is dropped.
  var KEEP_PARAMS = /^(id|productid|product_id|pid|sku|variant|variant_id|variantid|color|colour|size|style|item|itemid|dwvar_.+)$/i;
  // Subtrees never read for context text, even inside a size-guide section.
  var SKIP_CONTEXT = { HEADER: 1, NAV: 1, FOOTER: 1, FORM: 1, TABLE: 1 };
  var SKIP_TEXT = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEMPLATE: 1, SVG: 1, IFRAME: 1, CANVAS: 1 };

  // ---- Masking ----

  var EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
  var PHONE_RE = /(?:\+?\d{1,3}[\s.-])?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g;
  var CN_MOBILE_RE = /\b1[3-9]\d{9}\b/g;
  // Grouped in fours, or one unbroken run of 13–19 digits. Loose digit runs are
  // left alone: a size row like "81 86 91 96 101 106" must never be masked.
  var CARD_RE = /\b(?:\d{4}[ -]){3}\d{1,7}\b|\b\d{13,19}\b/g;

  function luhn(digits) {
    var sum = 0;
    for (var i = 0; i < digits.length; i++) {
      var d = +digits.charAt(digits.length - 1 - i);
      if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
      sum += d;
    }
    return sum % 10 === 0;
  }

  function masker(stats) {
    return function mask(text) {
      var s = String(text);
      s = s.replace(EMAIL_RE, function () { stats.masked++; return "[email]"; });
      s = s.replace(CARD_RE, function (m) {
        var digits = m.replace(/\D/g, "");
        if (digits.length < 13 || digits.length > 19 || !luhn(digits)) return m;
        stats.masked++;
        return "[number]";
      });
      s = s.replace(PHONE_RE, function () { stats.masked++; return "[phone]"; });
      s = s.replace(CN_MOBILE_RE, function () { stats.masked++; return "[phone]"; });
      return s;
    };
  }

  // ---- Small helpers ----

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // For URLs in attributes. The server reads <img> addresses with a regex and
  // does not decode entities, so "&" must stay "&"; only the characters that
  // would end the attribute or the tag are escaped.
  function escAttr(s) {
    return String(s).replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function collapse(s) {
    return String(s).replace(/\s+/g, " ").trim();
  }

  function tagOf(n) {
    return n && n.nodeName ? String(n.nodeName).toUpperCase() : "";
  }

  // Text of a subtree the way the server's stripTags reads markup: every tag —
  // opening or closing — becomes a space, comments vanish, and text nodes that
  // were only split by a comment run together (React writes `36<!-- -->in`,
  // which the server reads as "36in"). Scripts, styles and SVG say nothing.
  // `skip` returns true for subtrees to leave out.
  function textOf(el, skip) {
    var out = [];
    var stack = [el];
    while (stack.length) {
      var n = stack.pop();
      if (typeof n === "string") { out.push(n); continue; } // a closing tag
      if (n.nodeType === 3) { out.push(n.nodeValue); continue; }
      if (n.nodeType === 1) {
        if (SKIP_TEXT[tagOf(n)] || (skip && n !== el && skip(n))) { out.push(" "); continue; }
      } else if (n.nodeType !== 9 && n.nodeType !== 11) {
        continue; // comments, processing instructions
      }
      out.push(" "); // the opening tag
      stack.push(" "); // popped after the children: the closing tag
      for (var c = n.lastChild; c; c = c.previousSibling) stack.push(c);
    }
    return collapse(out.join(""));
  }

  function closestTable(el) {
    var p = el.parentElement;
    while (p && tagOf(p) !== "TABLE") p = p.parentElement;
    return p;
  }

  // Every table, including those inside OPEN shadow roots (web-component PDPs).
  // Closed shadow roots cannot be read by anyone, including us.
  function allTables(scope) {
    var out = Array.prototype.slice.call(scope.querySelectorAll("table"));
    var all = scope.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) {
      if (all[i].shadowRoot) out = out.concat(allTables(all[i].shadowRoot));
    }
    return out;
  }

  // Rows as the server's tableGrid reads them: one row per <tr> that has cells,
  // cells in order, text only. Rows of tables nested inside this one are left to
  // that table.
  function rowsOf(table) {
    var rows = [];
    var trs = table.querySelectorAll("tr");
    for (var i = 0; i < trs.length; i++) {
      if (closestTable(trs[i]) !== table) continue;
      var cells = [];
      for (var c = trs[i].firstElementChild; c; c = c.nextElementSibling) {
        var tag = tagOf(c);
        if (tag === "TD" || tag === "TH") cells.push({ th: tag === "TH", text: textOf(c) });
      }
      if (cells.length) rows.push(cells);
    }
    return rows;
  }

  function isVisible(el) {
    for (var n = el; n && n.nodeType === 1; n = n.parentElement || (n.getRootNode && n.getRootNode().host) || null) {
      if (n.hidden || n.getAttribute("aria-hidden") === "true") return false;
    }
    if (typeof el.checkVisibility === "function") {
      try { return el.checkVisibility(); } catch (e) { /* fall through */ }
    }
    return true;
  }

  // Text from the box a size table sits in — where a page writes "these are body
  // measurements" or "measured flat". A dialog is the size guide, so its text is
  // used (capped). A section or a plain wrapper is used only if it is small: a box
  // whose text runs past BOX_MAX_CHARS is page layout, not a size guide, and the
  // first stretch of a whole page can be a greeting with the user's name in it.
  // Never climbs past <main> or <body>.
  var BOX_MAX_CHARS = 3000;
  var SKIP_IN_CONTEXT = function (n) { return !!SKIP_CONTEXT[tagOf(n)]; };

  function contextFor(table) {
    var dialog = null;
    var box = null;
    var el = table.parentElement;
    for (var depth = 0; el && depth < 4; depth++, el = el.parentElement) {
      var tag = tagOf(el);
      if (tag === "BODY" || tag === "HTML" || tag === "MAIN") break;
      var role = (el.getAttribute("role") || "").toLowerCase();
      if (tag === "DIALOG" || role === "dialog" || role === "alertdialog" || el.getAttribute("aria-modal") === "true") {
        dialog = el;
        break;
      }
      if (!box && (tag === "SECTION" || tag === "ASIDE" || tag === "ARTICLE")) box = el;
    }
    if (dialog) return textOf(dialog, SKIP_IN_CONTEXT).slice(0, CONTEXT_CHARS);
    var parent = table.parentElement;
    var candidate = box || (parent && ["BODY", "HTML", "MAIN"].indexOf(tagOf(parent)) < 0 ? parent : null);
    if (!candidate) return "";
    var text = textOf(candidate, SKIP_IN_CONTEXT);
    return text.length > BOX_MAX_CHARS ? "" : text.slice(0, CONTEXT_CHARS);
  }

  // The sentences saying what the chart measures, wherever on the page they are.
  //
  // Taken from the ELEMENT that holds the sentence (its paragraph, cell, heading),
  // never as a window over the page's text. The first version cut ±100
  // characters out of the flattened page, and its own test caught it carrying a
  // cart drawer's "Deliver to 42 Wallaby Way" along with the sentence — adjacent
  // on the page, so adjacent in the text. Inside header, nav, footer and forms is
  // never read at all. One sentence per kind is all the server's reading needs;
  // a second is kept for context.
  var KIND_HINT = /measure|flat|人体|净体|平铺|衣服/i;
  var BLOCK = {
    P: 1, LI: 1, DD: 1, DT: 1, TD: 1, TH: 1, CAPTION: 1, FIGCAPTION: 1, LABEL: 1, BLOCKQUOTE: 1,
    H1: 1, H2: 1, H3: 1, H4: 1, H5: 1, H6: 1, DIV: 1, SECTION: 1, ASIDE: 1, ARTICLE: 1, DIALOG: 1,
  };
  var NEVER_READ = { HEADER: 1, NAV: 1, FOOTER: 1, FORM: 1 };

  function kindSentences(doc) {
    var found = { body: [], garment: [] };
    var done = [];
    var root = doc.body || doc.documentElement;
    if (!root || !doc.createTreeWalker) return [];
    var walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!KIND_HINT.test(node.nodeValue || "")) continue;
      var block = null;
      var excluded = false;
      for (var el = node.parentElement; el; el = el.parentElement) {
        var tag = tagOf(el);
        if (SKIP_TEXT[tag] || NEVER_READ[tag]) { excluded = true; break; }
        if (!block && BLOCK[tag]) block = el;
      }
      if (excluded || !block || done.indexOf(block) >= 0) continue;
      done.push(block);
      var text = textOf(block, SKIP_IN_CONTEXT);
      [["body", KIND_BODY], ["garment", KIND_GARMENT]].forEach(function (pair) {
        var bucket = found[pair[0]];
        if (bucket.length >= 2) return;
        for (var g = 0; g < pair[1].length; g++) {
          var m = text.match(pair[1][g]);
          if (!m || m.index == null) continue;
          // A long block (a whole description in one element) contributes only
          // the stretch around the sentence.
          bucket.push(text.length <= 2 * SNIPPET_RADIUS + m[0].length
            ? text
            : text.slice(Math.max(0, m.index - SNIPPET_RADIUS), m.index + m[0].length + SNIPPET_RADIUS));
          return;
        }
      });
    }
    return found.body.concat(found.garment);
  }

  function cleanUrl(href, stats) {
    var u;
    try { u = new URL(href); } catch (e) { return String(href); }
    var keep = new URLSearchParams();
    u.searchParams.forEach(function (v, k) {
      if (KEEP_PARAMS.test(k)) keep.append(k, v);
      else stats.queryParamsDropped++;
    });
    var q = keep.toString();
    u.search = q ? "?" + q : "";
    u.hash = "";
    return u.toString();
  }

  // ---- JSON-LD ----

  function ldNodes(data) {
    // Same flattening as the server's jsonLdNodes.
    var out = [];
    var push = function (v) { if (v && typeof v === "object") out.push(v); };
    if (Array.isArray(data)) data.forEach(push);
    else {
      push(data);
      if (data && Array.isArray(data["@graph"])) data["@graph"].forEach(push);
    }
    return out;
  }

  function ldTypes(node) {
    var t = node["@type"];
    return (Array.isArray(t) ? t : [t]).map(function (x) { return String(x).toLowerCase(); });
  }

  function ldTypeIs(node) {
    return ldTypes(node).some(function (t) { return LD_TYPES.indexOf(t) >= 0; });
  }

  function pruneLd(node, mask) {
    var out = {};
    Object.keys(node).forEach(function (k) {
      if (!LD_KEYS[k]) return;
      var v = node[k];
      if (typeof v === "string") v = mask(k === "description" ? v.slice(0, 1500) : v);
      if (k === "brand" && v && typeof v === "object" && !Array.isArray(v)) {
        v = { "@type": v["@type"], name: typeof v.name === "string" ? mask(v.name) : v.name };
      }
      if (k === "itemListElement" && Array.isArray(v)) {
        v = v.slice(0, 20).map(function (li) {
          if (!li || typeof li !== "object") return li;
          var name = li.name || (li.item && typeof li.item === "object" ? li.item.name : undefined);
          return { "@type": li["@type"], position: li.position, name: typeof name === "string" ? mask(name) : name };
        });
      }
      out[k] = v;
    });
    return out;
  }

  // JSON inside <script>: "</" would end the tag early (and end the server's
  // regex match early), so write it as "<\/", which JSON reads identically.
  function scriptJson(value) {
    return JSON.stringify(value).replace(/<\//g, "<\\/");
  }

  // ---- The capture ----

  function fpCapture(doc, loc, options) {
    var started = Date.now();
    var withContext = !(options && options.withoutContext);
    var stats = {
      version: VERSION,
      domChars: 0,
      payloadChars: 0,
      tablesSeen: 0,
      tablesKept: 0,
      ldJsonKept: 0,
      optionsKept: 0,
      swatchValuesKept: 0,
      chartImagesKept: 0,
      kindSnippets: 0,
      masked: 0,
      queryParamsDropped: 0,
      lang: "",
      ms: 0,
    };
    var mask = masker(stats);
    var head = [];
    var body = [];

    var html = doc.documentElement;
    stats.domChars = html && html.outerHTML ? html.outerHTML.length : 0;
    stats.lang = (html && html.getAttribute("lang")) || "";

    var title = collapse(doc.title || "");
    if (title) head.push("<title>" + esc(mask(title.slice(0, 300))) + "</title>");

    // Product meta tags.
    var metas = doc.querySelectorAll("meta[property], meta[name]");
    var ogTitle = "";
    for (var i = 0; i < metas.length; i++) {
      var key = (metas[i].getAttribute("property") || metas[i].getAttribute("name") || "").toLowerCase();
      var content = metas[i].getAttribute("content");
      if (META_KEYS.indexOf(key) < 0 || !content) continue;
      content = mask(collapse(content).slice(0, 1000));
      if (key === "og:title") ogTitle = content;
      head.push('<meta property="' + esc(key) + '" content="' + esc(content) + '">');
    }

    // JSON-LD, product-shaped nodes only, cut to an allowlist of keys.
    var hasLdProduct = false;
    var scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (var s = 0; s < scripts.length; s++) {
      var data;
      try { data = JSON.parse(scripts[s].textContent || ""); } catch (e) { continue; }
      var kept = ldNodes(data).filter(ldTypeIs).map(function (n) { return pruneLd(n, mask); });
      if (!kept.length) continue;
      if (kept.some(function (n) { return ldTypes(n).indexOf("product") >= 0; })) hasLdProduct = true;
      head.push('<script type="application/ld+json">' + scriptJson(kept.length === 1 ? kept[0] : kept) + "</script>");
      stats.ldJsonKept += kept.length;
    }

    var h1 = doc.querySelector("h1");
    var h1Text = h1 ? mask(textOf(h1).slice(0, 300)) : "";
    if (h1Text) body.push("<h1>" + esc(h1Text) + "</h1>");

    // Size tables, rebuilt from their text. Identical tables (a mobile and a
    // desktop copy of the same chart) are sent once.
    var seen = Object.create(null);
    var tables = allTables(doc);
    var biggest = 0;
    for (var t = 0; t < tables.length; t++) {
      stats.tablesSeen++;
      var rows = rowsOf(tables[t]);
      if (rows.length < 2) continue;
      var flat = rows.map(function (r) { return r.map(function (c) { return c.text; }).join(" | "); }).join("\n");
      if (!MEASURE_RE.test(flat) || seen[flat]) continue;
      seen[flat] = true;
      biggest = Math.max(biggest, rows.length - 1);
      var section = '<section data-fp="chart" data-fp-visible="' + (isVisible(tables[t]) ? "1" : "0") + '">';
      if (withContext) {
        var context = contextFor(tables[t]);
        if (context) section += "<p>" + esc(mask(context)) + "</p>";
      }
      section += "<table>" + rows.map(function (r) {
        return "<tr>" + r.map(function (c) {
          var tag = c.th ? "th" : "td";
          return "<" + tag + ">" + esc(mask(c.text)) + "</" + tag + ">";
        }).join("") + "</tr>";
      }).join("") + "</table></section>";
      body.push(section);
      stats.tablesKept++;
    }

    // What the page says its numbers measure, wherever it says it.
    kindSentences(doc).forEach(function (sentence) {
      body.push('<p data-fp="kind">' + esc(mask(sentence)) + "</p>");
      stats.kindSnippets++;
    });

    // Size <select>s. The server decides "is this a size select" by testing the
    // whole <select> markup, so the same test runs on the same markup here — and
    // a select that is not about size (quantity, country, a saved address) is
    // never sent at all.
    var selects = doc.querySelectorAll("select");
    for (var q = 0; q < selects.length; q++) {
      if (!SIZE_SELECT_RE.test(selects[q].outerHTML)) continue;
      var opts = selects[q].querySelectorAll("option");
      var optHtml = "";
      for (var o = 0; o < opts.length; o++) {
        var txt = collapse(opts[o].textContent || "");
        optHtml += "<option>" + esc(mask(txt)) + "</option>";
        stats.optionsKept++;
      }
      body.push('<select data-fp="size">' + optHtml + "</select>");
    }

    // Swatch buttons carrying a size in data-size / data-value / data-option-value.
    // Only short values; the server keeps only those shaped like a size label.
    var swatches = doc.querySelectorAll("[data-size],[data-value],[data-option-value]");
    var values = [];
    var seenValue = Object.create(null);
    for (var w = 0; w < swatches.length && values.length < MAX_SWATCH_VALUES; w++) {
      ["data-size", "data-value", "data-option-value"].forEach(function (a) {
        var v = swatches[w].getAttribute(a);
        if (v == null) return;
        v = v.trim();
        if (!v || v.length > 8 || seenValue[v] || values.length >= MAX_SWATCH_VALUES) return;
        seenValue[v] = true;
        values.push(v);
      });
    }
    if (values.length) {
      body.push('<div data-fp="labels">' + values.map(function (v) {
        return '<span data-size="' + esc(v) + '"></span>';
      }).join("") + "</div>");
      stats.swatchValuesKept = values.length;
    }

    // Images that look like a size chart, for the server's vision reader.
    var IMG_ATTRS = ["src", "data-src", "data-original", "srcset", "alt", "class", "id", "title"];
    var imgs = doc.querySelectorAll("img");
    for (var im = 0; im < imgs.length && stats.chartImagesKept < MAX_CHART_IMAGES; im++) {
      var img = imgs[im];
      var hay = IMG_ATTRS.map(function (a) { return img.getAttribute(a) || ""; }).join(" ").toLowerCase();
      if (!CHART_IMG_TOKENS.some(function (tok) { return hay.indexOf(tok) >= 0; })) continue;
      body.push("<img " + IMG_ATTRS.filter(function (a) { return img.getAttribute(a); }).map(function (a) {
        return a + '="' + escAttr(a === "alt" || a === "title" ? mask(img.getAttribute(a)) : img.getAttribute(a)) + '"';
      }).join(" ") + ">");
      stats.chartImagesKept++;
    }

    var url = cleanUrl(loc && loc.href ? loc.href : String(loc), stats);
    var out =
      "<!doctype html><html" + (stats.lang ? ' lang="' + escAttr(stats.lang) + '"' : "") + "><head>" +
      head.join("") + "</head><body>" + body.join("") + "</body></html>";

    if (out.length > MAX_PAYLOAD) {
      // Context text is the only part that can grow without bound; try without.
      if (withContext) return fpCapture(doc, loc, { withoutContext: true });
      stats.ms = Date.now() - started;
      return { ok: false, error: "too-large", url: url, stats: stats };
    }

    stats.payloadChars = out.length;
    stats.ms = Date.now() - started;
    return {
      ok: true,
      url: url,
      html: out,
      stats: stats,
      // What the popup tells the user it found, before anything is sent.
      found: {
        title: h1Text || ogTitle || title,
        productData: hasLdProduct,
        sizeTables: stats.tablesKept,
        sizeRows: biggest,
        sizeOptions: stats.optionsKept + stats.swatchValuesKept,
        chartImages: stats.chartImagesKept,
      },
    };
  }

  fpCapture.VERSION = VERSION;
  fpCapture.KIND_BODY = KIND_BODY;
  fpCapture.KIND_GARMENT = KIND_GARMENT;
  fpCapture.SIZE_SELECT_RE = SIZE_SELECT_RE;
  fpCapture.CHART_IMG_TOKENS = CHART_IMG_TOKENS;
  fpCapture.MEASURE_RE = MEASURE_RE;
  root.fpCapture = fpCapture;
})(typeof globalThis !== "undefined" ? globalThis : this);
