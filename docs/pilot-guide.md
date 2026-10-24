# 试点指南 · Pilot guide

**Purpose:** find out how often the recommended size is right. This can only be measured from what real
people do after buying. The evaluation's charts only tell us what a page printed.

**Size:** 10–20 people, 3–4 weeks. Each should buy at least one piece of clothing online in that time.
Fewer people who actually buy beat many who only browse.

---

## 1. 邀请文案(可直接发)

> 嗨!我们在做 Fit Passport,一个帮你在网上买衣服时选对尺码的工具。想请你试用 3–4 周:
>
> 1. 打开 https://www.fitpassport.fit ,填一下你的尺寸和平时喜欢的松紧(2 分钟),再加两三件你穿着合身的衣服。
> 2. 在 Chrome 里装我们的插件:https://chromewebstore.google.com/detail/fit-passport/ciecejomnniicliemefagfegkmgfkgfe
> 3. 网上看到想买的衣服时,点插件,看它推荐什么尺码、为什么。
> 4. 每天花几秒,在"穿搭日历"(fitpassport.fit/calendar)记一下今天穿了衣橱里的哪几件,顺手点一下"偏紧 / 合身 / 偏松"。
> 5. **最重要的一步:** 收到衣服试穿后,回到网站的"合身记录"(fitpassport.fit/history),选"留下 / 退货 / 换货",说一下是紧了还是松了。
>
> 不管推荐得对不对都请记录,推荐错的记录对我们最有用。有任何问题,点网站底部的"反馈"告诉我们。谢谢!

## 1b. Invitation (English)

> Hi! We're building Fit Passport, which helps you pick the right size when you buy clothes online.
> Could you try it for 3–4 weeks?
>
> 1. Open https://www.fitpassport.fit, enter your measurements and how you like clothes to fit (2 minutes),
>    then add two or three pieces you own that fit well.
> 2. Install the Chrome extension:
>    https://chromewebstore.google.com/detail/fit-passport/ciecejomnniicliemefagfegkmgfkgfe
> 3. When you see clothes you want to buy online, click the extension. It recommends a size and says why.
> 4. Each day, take a few seconds on the wear calendar (fitpassport.fit/calendar): tap what you wore from your
>    closet, and whether it felt snug, just right or roomy.
> 5. **The most important step:** once it arrives and you've tried it on, go to "Fit history"
>    (fitpassport.fit/history). Choose kept / returned / exchanged, and say whether it was tight or loose.
>
> Please record every purchase, whether the size was right or wrong. A wrong one helps us most.
> Questions or problems: the "Feedback" link at the bottom of the site. Thank you!

---

## 2. What the founder watches (/admin)

| Panel | What it answers | When to worry |
|---|---|---|
| **Pilot** | Who is active, what they do, the most common refusals and errors, and their feedback | A refusal or error code that keeps coming back |
| **Was the recommended size right?** | Right size X of N; how many bought the size we recommended; returns that pointed the right way; hit rate by stated confidence | Fewer than about 20 judged purchases is too few to quote. If the 80–100% row is well below 80% right, confidence is overstated |

**Weekly:** read the feedback, then message anyone who checked a size but never recorded what happened.
Reporting is the step people forget.

## 3. Known gaps before starting

- ~~"Bought it" on the to-buy list records no outcome~~: fixed (Session 103). It now records a kept
  purchase with the fit the person reports, when the saved product had been checked.
- **Shops that refuse to serve their pages to us** can only be read through the extension, not by pasting a link.
- **Prices and payments:** none. Hobby-plan Vercel forbids commercial use (`docs/DEPLOYMENT.md`).
