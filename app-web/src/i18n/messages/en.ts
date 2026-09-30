// English — the source of truth for every message key.
//
// Chinese (zh.ts) must have exactly these keys, the same {placeholders} and the
// same tags; the type system and i18n.test.ts enforce both. A new string goes here
// first, then into zh.ts, written (not machine-translated) to
// docs/design/chinese-copy.md.
//
// Tags a message may use: <b> <strong> <em> <i> <code> <link> <link2> <accent>,
// and <br/> — mapped to elements at the call site (i18n/format.ts).

export const en = {
  meta: {
    title: "Fit Passport",
    description: "One body. One fit identity. Any store. A consumer-owned fit layer for apparel.",
  },

  common: {
    languageLabel: "Language",
    zhShort: "中",
    enShort: "EN",
    zhLong: "中文",
    enLong: "English",
    backToTop: "Back to top",
    dismiss: "Dismiss",
    beta: "Beta",
    accuracy: {
      low: "Basic accuracy",
      medium: "Good accuracy",
      high: "High accuracy",
    },
  },

  nav: {
    main: "Main",
    check: "Check",
    extension: "Extension",
    closet: "Closet",
    passport: "Passport",
    outfits: "Outfits",
    community: "Community",
    help: "Help",
    review: "Review",
    yourAccount: "Your account, @{username}",
    claimAccount: "Claim account",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },

  footer: {
    tagline:
      "One body. One fit identity. Any store. A consumer-owned fit layer — you keep the profile, it works wherever you shop.",
    privacy: "Precise measurements never leave your account.",
    columns: { product: "Product", community: "Community", account: "Account" },
    links: {
      check: "Check a size",
      extension: "Browser extension",
      closet: "Your closet",
      passport: "Passport",
      outfits: "Outfits",
      directory: "Directory",
      badges: "Badges",
      help: "Help & guide",
      account: "Your account",
      login: "Log in",
      recover: "Reset password",
    },
    demo: "DEMO",
    demoLine: "A working prototype. Recommendations are explained, never guessed at silently.",
  },

  claimNudge: {
    title: "Save your passport",
    body: "Set a username and password, so your closet and measurements stay when you close the browser.",
    cta: "Claim account",
  },

  home: {
    hero: {
      eyebrow: "One body · one fit identity · any store",
      title: "Know what fits,<br/><accent>anywhere.</accent>",
      lede: "Check your size on any product page. We weigh it against the clothes you already own — and show our working.",
      cta: "Add Fit Passport to Chrome",
      noteZip: "Free · {size} KB · reads only the page you click it on",
      noteStore: "Free · reads only the page you click it on",
      pasteLink: "Or paste a product link",
      placeholder: "Paste a product URL…",
      linkLabel: "Product link",
      submit: "Get my size",
      pasteNote:
        "Works on some stores. Many large ones block our servers from reading their pages — the extension reads the page in your own browser instead.",
    },
    how: {
      eyebrow: "The idea",
      title: "Your fit,<br/>carried between stores.",
      body: "Sizes never agree across brands. Fit Passport holds one portable profile and translates it anywhere you shop — no retailer integration, no guessing.",
      cta: "Build your passport",
      steps: {
        open: {
          title: "Open a product page",
          body: "Click Fit Passport on any store's product page. It reads the brand, the garment and the size chart from the page you're looking at.",
        },
        weigh: {
          title: "We weigh it against you",
          body: "Your measurements, your preferred fit, and the clothes you already own and love — all considered.",
        },
        answer: {
          title: "A size, and the reason",
          body: "Not a guess. Every recommendation shows its work, so you can trust it — or overrule it.",
        },
      },
    },
    get: {
      eyebrow: "What you get",
      title: "A wardrobe that travels.",
      closet: {
        title: "Your closet, learned",
        line: "Clothes you love become anchors — we learn how each brand runs on you.",
      },
      outfit: {
        title: "Compose the look",
        line: "Build outfits on a mannequin shaped like you, then share them.",
      },
      badge: {
        title: "Earn your taste",
        line: "Struck-metal badges for a curated closet and admired looks.",
      },
    },
    parallax: {
      eyebrow: "Consumer-owned",
      title: "You keep the profile.<br/>It works at every store.",
      body: "Fit was never a picture problem. It’s a memory problem — and the memory is already hanging in your closet.",
    },
    community: {
      eyebrow: "More than a size calculator",
      title: "A community that<br/><accent>dresses better together.</accent>",
      body: "Sizing is the tool. The reason people stay is each other — seeing what fits real bodies, sharing taste, and getting better at buying clothes.",
      cards: {
        bodies: {
          title: "Fit intelligence from real bodies",
          body: "See which brands and sizes actually worked for people built like you — not a model in a studio.",
          cta: "Browse the directory",
        },
        taste: {
          title: "Share your taste, build a reputation",
          body: "Post outfits from your own closet and earn struck-metal badges as your archive grows.",
          cta: "Compose a look",
        },
        next: {
          title: "Learn what to buy next",
          body: "Every look shows its pieces and sizes — so one you like is one you can actually find and fit.",
          cta: "See the badge ladder",
        },
      },
      footnote:
        "Everything social is opt-in: you choose to be listed, and precise measurements are never shared — only coarse, useful signals.",
    },
    closing: {
      title: "Start your<br/><accent>fit passport.</accent>",
      create: "Create your passport",
      extension: "Get the extension",
      demo: "Just exploring? Try a demo closet",
    },
    dashboard: {
      yourPassport: "Your passport",
      badgesEarned: { one: "{n} badge earned", other: "{n} badges earned" },
      viewPassport: "View your fit passport",
      badges: "Badges",
      profileTitle: "Your fit profile",
      accuracyHigh: "You've given the engine strong signals — recommendations should be sharp.",
      accuracyMedium: "Good start. Add more known-good items to raise accuracy.",
      accuracyLow: "Add your fit preference and a few clothes to unlock accurate sizing.",
      setUp: "set up",
      doIt: "Do it",
      lastRecommendation: "Last recommendation",
      lastLine: "<b>{size}</b> for {product} · {pct}% confidence",
      recordFit: "Record fit",
      steps: {
        profile: "Set your fit preference",
        closet: "Add 3 items that fit you well",
        check: "Check your first product",
        outcome: "Record how it fit",
      },
    },
  },

  extension: {
    metaTitle: "Browser extension · Fit Passport",
    metaDescription: "Check your size on the product page you're already looking at.",
    eyebrow: "Browser extension",
    title: "Check your size on the page you're already on",
    lede: "Open any product page, click Fit Passport, and get the size — with the reasons and where every number came from.",
    cardName: "Fit Passport for Chrome",
    versionZip: "Version {version} · {size} KB · free",
    versionStore: "Version {version} · free",
    download: "Download the extension",
    addToChrome: "Add to Chrome",
    notInStore:
      "It isn’t in the Chrome Web Store yet, so for now you add it yourself — four steps, about a minute. It’s the same extension either way. Tested in Chrome; other Chromium browsers (Edge, Brave, Arc) accept the same steps, but we haven’t tested them.",
    installTitle: "Install it",
    install: {
      unzip: "Download the file above and <b>unzip it</b>. Keep the folder somewhere it won’t be deleted — Chrome loads the extension from it.",
      devMode: "In Chrome, go to <code>chrome://extensions</code> and turn on <b>Developer mode</b> (top right).",
      load: "Click <b>Load unpacked</b> and choose the folder you unzipped.",
      connect:
        "Open <link>Fit Passport</link> once in the same browser. That connects the extension to your passport — without it, the extension will ask you to connect first rather than check against an empty profile.",
    },
    pinTip: "Tip: click the puzzle-piece icon in Chrome’s toolbar and pin Fit Passport, so it’s one click away.",
    usingTitle: "Using it",
    using1:
      "Open a product page and click the Fit Passport icon. You’ll see what it found on the page before anything is sent; press <b>Check my size</b> to get the answer.",
    using2:
      "Many stores only load their size chart when you open their “Size guide”. If the extension says it found no chart, open the size guide on the page, then press <b>Re-scan</b>. It never clicks anything on the page for you.",
    readsTitle: "What it reads",
    readsBody:
      "Only the page you click it on, only when you click. It builds a small copy of the product parts — name, size chart, size options — and leaves everything else behind: your cart, your account, your address, forms. On a real product page that’s <b>11 KB out of 1.78 MB</b>.",
    whyTitle: "Why an extension",
    whyBody:
      "Many large stores block our servers from reading their pages — pasting a link works on some stores and not others. The extension reads the page in your own browser instead, the page you’re already looking at, so it works where a link can’t.",
    troubleTitle: "If something goes wrong",
    trouble: {
      connectQ: "It says “connect Fit Passport first”.",
      connectA:
        "Open Fit Passport once in this browser, then try again. If you block third-party cookies, the extension can't see that you're signed in — it asks you to connect rather than quietly checking against an empty profile.",
      noChartQ: "It found no size chart.",
      noChartA:
        "Open the store's size guide on the page, then press Re-scan. Some stores keep the chart on a separate page; for brands we've curated, Fit Passport falls back to the brand's published chart and says so.",
      marketQ: "On Taobao or Tmall.",
      marketA:
        "Tmall may ask you to log in before it shows the product — do that in the same browser first. The extension reads the brand and gender from the page's 参数信息 list and the chart from 尺码信息; if it finds no chart, scroll to 尺码信息 so it loads, then press Re-scan. The size profile Taobao shows you there (我的档案) is never sent.",
      devModeQ: "Chrome mentions a developer-mode extension.",
      devModeA: "That can happen with extensions added this way. It goes away once Fit Passport is in the Chrome Web Store.",
    },
  },
} as const;
