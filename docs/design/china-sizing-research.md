# Chinese E-commerce Apparel Sizing — Market & Technical Research

**Purpose:** Inform Fit Passport (consumer-owned, transparent, measurement-based size recommendation) with how Chinese channels handle size recommendation, how their product pages structure size data, Chinese sizing conventions, and market/return context.

**Date:** 2026-08-20
**Method:** Web research via WebFetch. General search engines (DuckDuckGo, Bing informational, Yandex, several SearXNG instances) were heavily CAPTCHA / rate-limited during this session. Brave Search and direct fetches of authoritative pages (Wikipedia, Alibaba developer docs) worked intermittently and are the backbone of the citations below. Items that could not be independently confirmed from a fetched page are explicitly flagged **[UNVERIFIED]** or **[PARTIALLY VERIFIED]**.

---

## 1. Size-recommendation / fit features on major Chinese platforms

### 1.1 淘宝 / 天猫 (Taobao / Tmall) — 尺码助手 (Size Assistant) + AI 试衣间

**What it is:** A merchant-configured, buyer-facing size recommender embedded in the product detail page. Called **尺码助手** ("size assistant"). There is also an **AI 试衣间 / 虚拟试穿** (AI fitting room / virtual try-on) layer that can generate a virtual avatar.

**How it works (mechanism):**
- **Merchant side:** Sellers must upload a structured size dataset. The current schema requires *both* a **size grouping** and a **size table** — quote: "新版尺码支持尺码分组和尺码表，并且两个都需要商家填写." Configured via Alibaba open-platform publish/edit APIs (`alibaba.item.publish.omnichannel.submit`, `alibaba.item.edit.submit`, `alibaba.item.edit.schema.get`).
- **Required measurement fields vary by leaf category** (from the Alibaba developer doc):
  - Men's/Women's Polo & Jacket: **肩宽 (shoulder width), 身高 (height, [120,220] cm), 体重 (weight, [30,160] kg), 胸围 (bust, [50,200] cm)**
  - Pants / skirts (西裤/卫裤/半身裙): **身高, 体重, 臀围 (hip), 腰围 (waist)**
  - Shoes (帆布鞋/切尔西靴): **脚长 (foot length, [20,32] cm)**
  - Bras (文胸): **上胸围 (upper bust), 下胸围 (under bust), 上下胸围差 (bust difference)**
- **Validation rules** the platform enforces on merchant data: rejects unreasonable ranges (e.g., height 300 cm), illogical monotonicity (S weight > L weight), and duplicate rows. Error examples include full-duplicate rows like "尺码145/80A与尺码150/80A信息完全一致" (`isv.parameter-parse-error:sizeMapping`) and missing tables (`isv.missing-parameter:sizeMapping`). **Note the size labels in the platform's own examples use 号型 notation — `145/80A`, `150/80A`.**
- **Buyer side:** The buyer enters body data (height, weight, and for some categories waist/hip/fit preference); the system matches against the merchant's size table and recommends the best size on the detail page. Community pages describe: "根据用户填写的身高体重等信息，在商品详情页自动推荐最合适的尺码" and "结合商品详情页的详细尺码表，自动为你推荐最合适的尺码." AI 试衣间 additionally "系统会自动匹配推荐尺码，并生成虚拟人像进行试穿模拟" (auto-matches a size and generates a virtual avatar for simulated try-on).
- **模特试穿组件 (Model Try-On component):** Merchants can add a real model's try-on record (model name, try-on size, height, weight, notes, up to 3 image/video assets), gated behind an audit chain before it displays.
- **尺码偏大偏小建议 (fit-bias advice), component `sizeSellerRecommend`:** Lets merchants flag "码数偏大，选小X码" (runs large, size down) / "码数偏小，选大X码" (runs small, size up); shoes add wide/high-instep options and half-size increments ("大半"/"小半").

**Stated goal / numbers:** The Alibaba merchant doc explicitly frames the feature as improving conversion and reducing wrong-size refunds — "让用户更快选出适合自己的尺码，提升转化效率，降低尺码拍错带来的退款率." No specific quantified return-reduction percentage was found in fetched sources. **[UNVERIFIED: quantified adoption / return-reduction numbers.]**

*Alibaba/DAMO virtual try-on research:* Alibaba has published generative virtual try-on work (e.g., "Outfit Anyone" / image-based try-on from Alibaba's Institute for Intelligent Computing). This session could not fetch a primary source (Alizila returned HTTP 403). **[UNVERIFIED here — recommend a follow-up fetch of alizila.com / arXiv.]**

### 1.2 得物 (Dewu / Poizon) — community-driven fit signals for sneakers/streetwear

**What it is:** China's dominant sneaker/streetwear resale-and-retail platform. Founded 2015 as sneaker forum "毒 App" (Poizon), added trading in 2017, renamed 得物 on 2020-01-01. Scale: 100M+ registered users / ~8M DAU reported as of Aug 2019; MAUs ~100M by June 2022; 350M+ downloads by Oct 2024. Core differentiator is authentication ("先鉴别 后发货" — inspect-first, ship-later).

**How sizing guidance works (mechanism):** Dewu leans on **community + review data**, not a body-measurement questionnaire:
- **尺码感受 ("Size Feel")** — aggregated review sentiment on whether an item runs true/large/small.
- **问问大家 ("Ask Everyone")** — community Q&A on fit.
- **评价 (Reviews)** — standard reviews.
- **Size-conversion chart** across **EU / UK / US / CM** standards on each product (users are told to buy by foot length in cm).
- **Brand-specific "runs large/small" analysis** built from aggregated real-user feedback (e.g., dedicated "Is Nike true to size on Dewu?" guidance drawing on "真实用户反馈、品牌标准与平台差异").

**Takeaway for us:** Dewu validates the "true-to-size community signal" model and per-brand fit bias — highly relevant to our recommendation layer. No algorithmic foot-length engine is publicly documented. **[PARTIALLY VERIFIED — mechanism names confirmed via a competitive-analysis article; internal algorithm not published.]**

### 1.3 京东 (JD.com) — 尺码助手 / 尺码推荐

**What it is:** JD operates a size-assistant / size-recommendation feature and has historically promoted AR/virtual try-on for some categories.
**[UNVERIFIED in this session — Brave/SearXNG were rate-limited (HTTP 429) on every JD-specific query and no authoritative JD page could be fetched.]** Based on the common Chinese-platform pattern (and JD's parity with Tmall), expect: merchant-supplied size tables + buyer height/weight input → recommended size on the PDP, plus fit-bias flags. **Recommend a follow-up verification fetch of JD's help center / merchant docs before citing specifics.**

### 1.4 SHEIN — Fit Finder / Check My Size + review-based true-to-size

**What it is:** SHEIN offers a per-item **"Fit Finder" / "Check My Size"** questionnaire plus measurement charts and heavy review signals. (Note: recommendation tool described by one source as "still in development" / inconsistent.)

**How it works (mechanism):**
- **Questionnaire inputs:** height, weight, **belly shape, hip shape**, bra size, age, and **fit preference** → personalized size recommendation shown on some product pages for logged-in users ("you'll then see a size recommendation on some product pages, best matched to the information you've provided").
- **Per-item measurement charts:** every item carries its own measurement table with **US / UK / EU / Asian** conversions (order-by-measurement, not by label, because sizing varies item-to-item across SHEIN's many suppliers).
- **Review-based true-to-size:** reviews flag runs small / true / large, and members can post reviews with their own height/weight, so buyers match against similar bodies.
- **Known bias:** SHEIN sizes commonly run ~2 sizes smaller than US; "Asian sizes" smaller still — a strong argument for measurement-based matching over label matching.

**Takeaway for us:** SHEIN is the clearest analog to Fit Passport's measurement + fit-preference input model, and confirms buyers actively use "similar-body reviews."

### 1.5 抖音电商 / 抖店 (Douyin e-commerce) & 拼多多 (Pinduoduo)

**[UNVERIFIED — all targeted queries hit HTTP 429 this session.]** General expectation from the ecosystem: Douyin's 抖店 and Pinduoduo both support merchant-supplied size tables (尺码表) on PDPs; Douyin has been rolling out size-assistant-style tooling to reduce apparel returns given its live-commerce return-rate problem (see §4). Neither could be confirmed from a primary source here. **Recommend follow-up.**

---

## 2. How Chinese product pages structure size data (for our PAGE PARSER)

Findings synthesized from Chinese e-commerce API / scraping write-ups (Tencent Cloud, CSDN, Alibaba Cloud, Volcengine):

- **SKU / 规格 (specs) = JSON, reliably parseable.** Product APIs return structured JSON where color/size live either as attribute-code arrays (e.g., `"properties": "1627207:1347647754"` under a `prop_imgs` block) or **embedded in the SKU name string** (e.g., `"尺码:S;颜色分类:白色衬衫"`, `"颜色：红色/蓝色，尺寸：M/L/XL"`). Responses typically include SKU ID, SKU name, price, stock, image URL, and a property list. One source stresses the API gives "标准 JSON，无需通过正则、DOM 解析杂乱网页文本" — i.e., structured SKU data avoids messy HTML parsing.
- **SKU data often loads dynamically:** "很多淘宝页面需要悬停才加载SKU数据" (many Taobao pages require hover to load SKU data); hidden XHR endpoints (`item_get`/`detail`) usually need a login cookie. Implication: a naive static HTML fetch may miss SKU/spec JSON.
- **尺码表 (the size CHART itself) — the image problem.** Fetched sources did **not** give a single definitive "size charts are images" statement, **[so treat as PARTIALLY VERIFIED]**, but the surrounding evidence strongly supports the well-known pattern: Tmall/Taobao **detail-page (详情页) content is predominantly delivered as stitched images**, scraped via regex on image URLs ("直接根据正则分析其中图片，然后保存即可"). Because merchant-authored size charts are usually part of that image-based detail description (rather than semantic HTML `<table>`), **the numeric size chart is frequently locked inside an image and is not machine-readable without OCR.**
  - **Consequence for us:** two-tier parsing —
    1. **Structured tier:** grab SKU/规格 JSON (size labels like S/M/L or 号型 codes) — easy, reliable.
    2. **Measurement tier:** the actual body measurements (胸围/肩宽/衣长/袖长/腰围/臀围) that map a label to centimeters are often only in the **image-based 尺码表** → requires **OCR + table-structure recovery**, or the newer platform 尺码助手 structured tables (which exist only where merchants filled them in).
- **Measurement labels to expect (canonical Chinese terms):** 胸围 (bust), 肩宽 (shoulder width), 衣长 (garment length), 袖长 (sleeve length), 腰围 (waist), 臀围 (hip), 脚长 (foot length), 上胸围/下胸围/上下胸围差 (upper/under bust and difference, for bras). Build the parser's label dictionary around these plus synonyms (净胸围, 通袖长, 裤长, 大腿围, etc.).

---

## 3. Chinese sizing conventions (GB/T 号型 system)

**National standard:** GB/T 1335 "服装号型 / Size designation of clothes":
- **GB/T 1335.1-2008** — Men
- **GB/T 1335.2-2008** — Women
- **GB/T 1335.3-2008** — Children
- Related: GB/T 2668-2002 (coats/jackets/trousers), GB/T 14304-2002 (woolen garments).
(Standard numbers confirmed via English Wikipedia "Clothing sizes.")

**号型 notation — e.g., `160/84A`:**
- **号 (the number before the slash) = height in cm.** So `160` = 160 cm height.
- **型 (the number after the slash) = a girth in cm** — **net bust (净胸围) for upper garments (上装), net waist (净腰围) for lower garments (下装).** So on a top, `84` = 84 cm bust; on pants, `160/68A` → `68` = 68 cm waist.
- **The letter = 体型 (body type), based on the chest-minus-waist drop (胸腰差):** categories are **Y (偏瘦/slim), A (正常/normal/standard), B (偏胖/slightly full), C (肥胖/full).** `A` is the most common "standard" build.
- **Exact drop ranges per letter [PARTIALLY VERIFIED — fetched sources named the categories but did not print the official cm ranges].** Per the GB/T 1335 standard (widely reproduced; confirm against the standard text before shipping):
  - Women (chest−waist drop): **Y ≈ 19–24 cm, A ≈ 14–18 cm, B ≈ 9–13 cm, C ≈ 4–8 cm.**
  - Men (chest−waist drop): **Y ≈ 17–22 cm, A ≈ 12–16 cm, B ≈ 7–11 cm, C ≈ 2–6 cm.**
  - Note: a *separate, older export/joint-venture code system* uses different letters (Y=16 cm, YA=14/12 cm, AB=10 cm, B=8 cm, E=4 cm) — do NOT confuse it with GB/T Y/A/B/C. (Seen on Baidu Baike and a Zhihu column.)

**S/M/L vs 号型 vs 均码:**
- Consumer-facing listings increasingly use **S/M/L/XL** (or numeric EU-style), but formal/traditional labels and many domestic brands still print **号型 (160/84A)**. Both often coexist; the 尺码表 maps them.
- **均码 (jūnmǎ) = "one size fits all"** — common for loose/knit items; carries no measurement guarantee, a known fit-risk category.

**Divergence from US/EU:** Chinese ready-to-wear runs **notably smaller** than US sizing for the same label (SHEIN reviews: ~2 US sizes smaller; "Asian sizes" smaller again). Therefore label-to-label conversion is unreliable; **centimeter-based body measurement is the only robust cross-market key** — directly supports Fit Passport's thesis.

---

## 4. Market context — size of market, return rates, fit as a pain point

**Market size:**
- China has been the world's largest e-commerce market since 2013; ~US$899B domestic e-commerce (2016, 42.4% of global retail e-commerce); online retail ≈ 21% of total retail (2019); ~850M online shoppers (late 2022); ~50% of worldwide online sales occurred in China (2023). (English Wikipedia "E-commerce in China.")
- **A China online-*apparel*-specific market-size figure (RMB) was not confirmed from a fetched source this session. [UNVERIFIED — follow up with a stats source, e.g., Statista/iResearch/CNNIC.]**

**Return rates (apparel) — well documented and high:**
- Brand-store apparel return rate rose from **24% (2021) → 35% (H1 2024)**; platform-wide rates cited "一度高达60%" (peaked ~60%). (Sina Finance; The Paper.)
- **Women's apparel (女装) is the highest-return category:** commonly **50–60%**, "最高可以达到80%" (up to 80%); some Zhihu/industry sources cite **50–70% in 2025**, and **up to 80% during Double 11**. For contrast: 汉服 ~20%, 运动/瑜伽服 ~24–26%. (Huxiu, Guancha, TMTPost, Lifeweek, Zhihu.)
- **Livestream sales:** 80% return rates described as "很常见" (common). (Sina Finance Tech.)

**Fit / size as a stated pain point:**
- A Tmall apparel GM is quoted framing sizing as a core consumer pain point: "买不到合适尺码…尺码是消费者的痛点，容易引起退货" (can't find the right size … size is a consumer pain point, easily triggers returns). (Inewsweek; Sina Finance, Dec 2024.)
- Expert commentary lists **尺码不合适 (unsuitable size)** alongside color mismatch, fabric hand-feel, and fit dissatisfaction as leading return drivers. (Sina Finance; Tencent News, Aug 2024.)
- **Caveat:** no fetched source gave a *specific percentage share* of returns attributable solely to size/fit — it's consistently described as a *leading qualitative cause* among several. **[Quantified size-only return share: UNVERIFIED.]**

---

## 5. Implications for Fit Passport

**For the RECOMMENDATION algorithm:**
1. **Centimeter body measurements are the universal key, not size labels.** Chinese RTW runs ~2 US sizes small and varies by brand/supplier (SHEIN, Dewu brand-bias data). Match user cm measurements against per-item garment cm, don't translate labels. This is exactly the gap the incumbents' label-based tools leave open.
2. **Model per-item / per-brand fit bias + community "true-to-size" sentiment.** Both Dewu (尺码感受 / 问问大家) and SHEIN (runs-small/true/large reviews with buyer height/weight) prove users trust and act on aggregated fit signals. A "runs small → size up" bias term per item/brand is high-value and matches how incumbents actually help buyers.
3. **Adopt the incumbents' measurement vocabulary and category-specific field sets.** Taobao's 尺码助手 schema is a ready-made spec: tops need 胸围/肩宽/身高/体重; bottoms need 腰围/臀围; shoes need 脚长; bras need 上/下胸围 + 差. Mirror these so our data model interoperates with what Chinese merchants already publish, and support **fit-preference** input (SHEIN) as a modifier.

**For the PAGE PARSER:**
1. **Two-tier extraction.** (a) SKU/规格 JSON gives size *labels* (S/M/L or 号型) reliably and should be the primary structured source; but it often loads via dynamic XHR/hover and may need cookie/JS rendering, not a static GET. (b) The *measurement* 尺码表 mapping labels→cm is frequently **baked into detail-page images** → plan for **OCR + table reconstruction** as a first-class path, not an edge case. Treat "size chart present but only as an image" as the common case for Chinese PDPs.
2. **Parse 号型 notation `160/84A` structurally.** `NNN/GGX` → 号 = height cm (before `/`), 型 = girth cm (bust for tops, waist for bottoms — infer from category), letter = body type Y/A/B/C. This directly yields two body measurements per label for free where merchants use 号型, and lets us reconcile against S/M/L. Build a regex + category-aware interpreter for it, and handle 均码 (one-size) as a distinct low-confidence case.
3. **Label dictionary in Chinese.** Anchor the parser on 胸围/肩宽/衣长/袖长/腰围/臀围/脚长/上胸围/下胸围 plus synonyms; these are the exact terms both merchant schemas and image charts use.

---

## 6. Sources

Confirmed via direct fetch or Brave result snippets in this session:
- Alibaba open-platform merchant size-guide doc — https://developer.alibaba.com/docs/doc.htm?treeId=1&articleId=121987&docType=1 (尺码助手 schema, measurement fields, validation, model try-on, fit-bias component, "降低…退款率")
- English Wikipedia, "Clothing sizes" — https://en.wikipedia.org/wiki/Clothing_sizes (GB/T 1335.1/.2/.3-2008 standard numbers)
- English Wikipedia, "E-commerce in China" — https://en.wikipedia.org/wiki/E-commerce_in_China (market-size context)
- English Wikipedia, "POIZON" — https://en.wikipedia.org/wiki/POIZON (Dewu scale, GMV, authentication)
- Chinese Wikipedia, 得物 — https://zh.wikipedia.org/wiki/得物 (history, user numbers, 先鉴别后发货)
- 号型 / 160/84A explanations — 服装号型 (Baidu Baike) baike.baidu.com/item/服装号型/7634180; 服装尺寸号型常识 (Zhihu) https://zhuanlan.zhihu.com/p/320504203; CSDN blog 118319153; Baidu Zhidao q/561516686
- Taobao 尺码助手 / AI 试衣间 explainers — https://zhuanlan.zhihu.com/p/517312785 ; bk.taobao.com 尺码助手 pages ; m.maijiaw.com/zhuanti/434
- Dewu sizing features — 得物、识货竞品分析 (Zhihu) https://zhuanlan.zhihu.com/p/522969679 ; Dewu Nike fit guide (bk.taobao.com) ; 得物尺码对照表 (Zhihu) https://www.zhihu.com/question/288795232
- SHEIN Fit Finder / Check My Size — Groupon shein-size-guide ; https://m.shein.com/us/How-to-choose-your-size-a-748.html ; RetailBoss ; Perfectsizefinder ; Reddit r/PlusSize u96cac
- Product-page structure / SKU JSON / image detail pages — Tencent Cloud article 2575268 & 2575997 ; CSDN 148706248, 151216110, 77894443 ; Alibaba Cloud developer article 1686945 ; Volcengine 7658210221605945387 ; CRMEB thread 76599
- Apparel return rates — The Paper newsDetail_forward_29332117 ; Sina Finance 2024-10-17 doc-incsvwnf2869815 & 2024-12-04 detail-incyhuet0672330 ; Huxiu article 3681553 ; Guancha content 1487052 ; TMTPost 7336320 ; Lifeweek artId 229536 ; Inewsweek 2024-12-04/23870
- (Snippet URLs are as surfaced by Brave Search; a few individual pages were 403/blocked to direct fetch — treat snippet-only sources as secondary.)

### Not verified this session (recommended follow-ups)
- JD.com (京东) size-assistant specifics — all queries HTTP 429.
- Douyin (抖音/抖店) & Pinduoduo (拼多多) size features — all queries HTTP 429.
- Alibaba/DAMO virtual try-on primary source (Alizila 403; try arXiv / alizila.com later).
- Definitive "尺码表 is an image" statement + the official GB/T 1335 per-letter drop-range cm table (confirm against the standard text).
- China online-*apparel*-specific market size in RMB.
- Any published quantified return-reduction attributable to size tools.
