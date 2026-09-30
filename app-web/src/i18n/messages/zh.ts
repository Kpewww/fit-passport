// 简体中文。
//
// 这是写出来的文案，不是翻译稿：句子可以和英文不同，但说的事实必须相同，
// 键、{占位符}、标签必须和 en.ts 一一对应（类型系统和 i18n.test.ts 会检查）。
// 用词、标点、语气、文言的用量，都以 docs/design/chinese-copy.md 为准。

import type { Messages } from "../types";

export const zh: Messages = {
  meta: {
    title: "Fit Passport",
    description: "一副身材，一份尺码，走遍每家店。一份握在你自己手里的合身档案。",
  },

  common: {
    languageLabel: "语言",
    zhShort: "中",
    enShort: "EN",
    zhLong: "中文",
    enLong: "English",
    backToTop: "回到顶部",
    dismiss: "关闭",
    beta: "测试版",
    accuracy: {
      low: "准确度：初级",
      medium: "准确度：良好",
      high: "准确度：高",
    },
  },

  nav: {
    main: "主导航",
    check: "查尺码",
    extension: "插件",
    closet: "衣橱",
    passport: "档案",
    outfits: "搭配",
    community: "社区",
    help: "帮助",
    review: "审核",
    yourAccount: "我的账号，@{username}",
    claimAccount: "注册账号",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
  },

  footer: {
    tagline: "一副身材，一份尺码，走遍每家店。档案握在你自己手里，去哪儿买衣服都用得上。",
    privacy: "精确尺寸从不离开你的账号。",
    columns: { product: "产品", community: "社区", account: "账号" },
    links: {
      check: "查尺码",
      extension: "浏览器插件",
      closet: "我的衣橱",
      passport: "身材档案",
      outfits: "搭配",
      directory: "社区名录",
      badges: "徽章",
      help: "帮助与指南",
      account: "我的账号",
      login: "登录",
      recover: "重置密码",
    },
    demo: "演示版",
    demoLine: "一个能用的原型。每条推荐都讲清理由，从不闷声瞎猜。",
  },

  claimNudge: {
    title: "把身材档案存下来",
    body: "设个用户名和密码，关掉浏览器之后，衣橱和尺寸也都还在。",
    cta: "注册账号",
  },

  home: {
    hero: {
      eyebrow: "一副身材 · 一份尺码 · 走遍每家店",
      title: "尺码，<br/><accent>不必再猜。</accent>",
      lede: "打开任意商品页，点一下就知道该买哪个码。拿你衣橱里本就合身的衣服来比——怎么算的，一步步摆给你看。",
      cta: "把 Fit Passport 加到 Chrome",
      noteZip: "免费 · {size} KB · 只读你点开的那一页",
      noteStore: "免费 · 只读你点开的那一页",
      pasteLink: "或者，粘贴商品链接",
      placeholder: "粘贴商品链接…",
      linkLabel: "商品链接",
      submit: "查我的尺码",
      pasteNote: "部分商店可用。不少大型商店会拦下我们的服务器，不让读页面；插件则在你自己的浏览器里读，没有这层阻拦。",
    },
    how: {
      eyebrow: "思路",
      title: "你的合身，<br/>随身带到每家店。",
      body: "每个牌子的 M 都不一样大。Fit Passport 替你保管一份随身的身材档案，逛到哪家店，就换算成哪家的码——不用商家配合，也不用你猜。",
      cta: "建立身材档案",
      steps: {
        open: {
          title: "打开商品页",
          body: "在任意商店的商品页上点一下 Fit Passport，它会从你正看着的这一页，读出品牌、款式和尺码表。",
        },
        weigh: {
          title: "拿你自己来比",
          body: "不是“和你身材相似的人买了什么”，而是你的尺寸、你偏爱的版型、你衣橱里穿着正合身的那几件——统统算进去。",
        },
        answer: {
          title: "给你一个码，也给你理由",
          body: "不靠猜。每条推荐都附上依据；卡在两个码之间时，我们直说，不让你赌。你可以放心采纳，也可以随时推翻。",
        },
      },
    },
    get: {
      eyebrow: "你会得到",
      title: "一个会跟着你走的衣橱。",
      closet: {
        title: "衣橱，越用越懂你",
        line: "你爱穿的衣服就是标尺——每个牌子在你身上偏大还是偏小，我们一件件记下。",
      },
      outfit: {
        title: "搭一身造型",
        line: "在照你身形塑造的人台上搭配，搭好了再分享出去。",
      },
      badge: {
        title: "品味，有据可凭",
        line: "精心打理的衣橱、被人称道的搭配，都会换来一枚金属徽章。",
      },
    },
    parallax: {
      eyebrow: "数据归你",
      title: "档案在你手里，<br/>哪家店都能用。",
      body: "合不合身，从来不是看图能解决的事，而是记性的事——这份记性，早就挂在你的衣橱里了。",
    },
    community: {
      eyebrow: "不只是尺码计算器",
      title: "一群人，<br/><accent>一起穿得更好。</accent>",
      body: "尺码是工具，让人留下来的是彼此：看真实的身材穿出什么样，交流品味，买衣服越买越有数。",
      cards: {
        bodies: {
          title: "来自真实身材的合身经验",
          body: "看看和你身形相近的人，哪些牌子、哪个码真的穿对了——不是影棚里的模特。",
          cta: "逛逛社区",
        },
        taste: {
          title: "晒出品味，攒下口碑",
          body: "用自己衣橱里的衣服发搭配，收藏越丰富，徽章越多。",
          cta: "去搭一身",
        },
        next: {
          title: "下一件买什么，心里有数",
          body: "每套搭配都标明单品和尺码——看中了，就找得到、穿得上。",
          cta: "看看徽章等级",
        },
      },
      footnote: "所有社交功能都要你主动开启：是否公开由你决定，精确尺寸从不外露，只分享粗略而有用的信息。",
    },
    closing: {
      title: "衣不在多，<br/><accent>合身则灵。</accent>",
      create: "建立身材档案",
      extension: "获取插件",
      demo: "先随便看看？试试示例衣橱",
    },
    dashboard: {
      yourPassport: "我的身材档案",
      badgesEarned: { one: "已获得 {n} 枚徽章", other: "已获得 {n} 枚徽章" },
      viewPassport: "查看身材档案",
      badges: "徽章",
      profileTitle: "你的身材档案",
      accuracyHigh: "你提供的信息已经很充分，推荐应当相当准。",
      accuracyMedium: "开了个好头。再添几件穿着合身的衣服，准确度还能再提高。",
      accuracyLow: "填上你偏爱的版型，再添几件衣服，推荐才会准。",
      setUp: "已完成",
      doIt: "去完成",
      lastRecommendation: "上次推荐",
      lastLine: "{product}：<b>{size}</b> · 把握 {pct}%",
      recordFit: "记录穿着感受",
      steps: {
        profile: "设定你偏爱的版型",
        closet: "添加 3 件穿着合身的衣服",
        check: "查第一件商品",
        outcome: "记录穿着结果",
      },
    },
  },

  extension: {
    metaTitle: "浏览器插件 · Fit Passport",
    metaDescription: "在你正看着的商品页上，直接查尺码。",
    eyebrow: "浏览器插件",
    title: "逛到哪一页，就在哪一页查尺码",
    lede: "打开任意商品页，点一下 Fit Passport，尺码就出来了——附带理由，每个数字从哪来都写得清清楚楚。",
    cardName: "Fit Passport · Chrome 版",
    versionZip: "版本 {version} · {size} KB · 免费",
    versionStore: "版本 {version} · 免费",
    download: "下载插件",
    addToChrome: "添加到 Chrome",
    notInStore:
      "它暂时还没上架 Chrome 应用商店，所以现在需要你手动安装——四步，一分钟左右，装上的就是同一个插件。已在 Chrome 上测试；其他 Chromium 内核的浏览器（Edge、Brave、Arc，以及 360、QQ 等浏览器的极速模式）步骤相同，但我们都还没测过。",
    installTitle: "安装",
    install: {
      unzip: "下载上面的文件并<b>解压</b>。把文件夹放在不会被误删的地方——Chrome 每次都从这里加载插件。",
      devMode: "在 Chrome 地址栏打开 <code>chrome://extensions</code>，打开右上角的<b>开发者模式</b>。",
      load: "点击<b>加载未打包的扩展程序</b>，选中刚才解压出来的文件夹。",
      connect:
        "在同一个浏览器里打开一次 <link>Fit Passport</link>，插件就和你的身材档案连上了。没连上时，插件会先请你连接，而不是拿一份空档案来算。",
    },
    pinTip: "小技巧：点 Chrome 工具栏上的拼图图标，把 Fit Passport 固定出来，下次一点就到。",
    usingTitle: "怎么用",
    using1: "打开商品页，点 Fit Passport 图标。发送任何内容之前，你会先看到它在这一页找到了什么；点<b>查我的尺码</b>，答案就来了。",
    using2:
      "很多商店要点开「尺码指南」或「尺码信息」才会加载尺码表。如果插件说没找到，先在页面上点开它，再按<b>重新扫描</b>。插件从不替你点页面上的任何东西。",
    readsTitle: "它读什么",
    readsBody:
      "只读你点开的那一页，只在你点的那一刻。它只摘取商品相关的部分——名称、尺码表、尺码选项——其余一概不碰：购物车、账号、地址、表单。在一个真实的商品页上，这部分只有 <b>1.78 MB 里的 11 KB</b>。",
    whyTitle: "为什么要装插件",
    whyBody:
      "很多大型商店会拦下我们的服务器，不让读页面，所以粘贴链接时灵时不灵。插件则在你自己的浏览器里，读你正在看的那一页——链接够不着的地方，它也读得到。",
    troubleTitle: "遇到问题",
    trouble: {
      connectQ: "提示「请先连接 Fit Passport」",
      connectA:
        "在这个浏览器里打开一次 Fit Passport，再试一次。如果你屏蔽了第三方 Cookie，插件就看不到你的登录状态——这时它会请你先连接，而不是悄悄拿一份空档案来算。",
      noChartQ: "没找到尺码表",
      noChartA:
        "先在页面上点开商店的尺码指南，再按重新扫描。有些商店把尺码表放在单独的页面；对我们收录过的品牌，Fit Passport 会改用品牌官方公布的尺码表，并注明来源。",
      marketQ: "在淘宝、天猫上使用",
      marketA:
        "天猫可能要求先登录才显示商品，请先在同一个浏览器里登录淘宝。插件从「参数信息」读品牌和适用性别，从「尺码信息」读尺码表；如果没读到尺码表，把页面滚到「尺码信息」让它加载出来，再按重新扫描。淘宝在那里显示的你自己的尺码档案（我的档案）从不会被发送。",
      devModeQ: "Chrome 提示正在使用开发者模式的扩展程序",
      devModeA: "手动安装的插件会有这个提示，属正常现象。等 Fit Passport 上架 Chrome 应用商店后就不会再出现。",
    },
  },
};
