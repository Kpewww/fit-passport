# Chinese copy (简体中文) — how it is written

Session 79. The Chinese version is **written, not translated**. A Chinese sentence
may say a thing differently from the English one — shorter, in a different order,
with a different image — but it must state **the same facts**, and it follows the
same evidence rule as everything else here: no claim the engine cannot back.

Mechanics live in code: `app-web/src/i18n/messages/en.ts` is the source of every
key; `zh.ts` must have exactly the same keys, `{placeholders}` and tags.
`i18n.test.ts` fails on a missing key, a different placeholder or tag, an empty
string, a Chinese string left identical to the English, or a missing space between
Chinese and Latin text (see Typography).

## Glossary

One word per idea, everywhere. If a new string needs a word not listed here, add
it here in the same commit.

| English | 中文 | Note |
|---|---|---|
| Fit Passport | Fit Passport | **The brand is never translated** (founder's decision, Session 79) |
| passport (the user's profile) | 身材档案 | the feature, not the brand; nav tab: 档案 |
| closet | 衣橱 | |
| check (a size) | 查尺码 | |
| extension | 插件 | 浏览器插件 in full |
| outfit / look | 搭配 | |
| claim account | 注册账号 | "claim" means nothing to a Chinese reader; what the user does is register |
| chest / waist / shoulder / sleeve / length | 胸围 / 腰围 / 肩宽 / 袖长 / 衣长 | as on Taobao size tables |
| body measurements | 人体尺寸 | the body, bare |
| garment measurements | 成衣尺寸（平铺） | the garment, laid flat |
| ease | 放松量 | the pattern-making term: room between body and garment |
| slim / regular / relaxed / oversized | 修身 / 常规 / 宽松 / oversize | oversize is how Chinese shoppers say it |
| too tight … too loose | 太紧 / 略紧 / 刚好 / 略松 / 太松 | the signed fit scale |
| keep / return / exchange | 留下 / 退货 / 换货 | |
| size chart | 尺码表 | a page's own tab is quoted as it appears: 「尺码信息」 |
| confidence | 把握 | "72% confidence" → 把握 72% |
| accuracy (profile tier) | 准确度 | |

## Typography

- **A space between Chinese and Latin letters or digits**: 胸围 100 cm, 每个牌子的 M,
  Fit Passport 替你保管. Checked by the test.
- Full-width punctuation in Chinese sentences: ，。：；？！「」（）——…
  Quotation: 「」 for a UI label or a page's own words, “” for speech.
- **No emoji, no arrow glyphs** — the same guard tests as the English (invariants
  67 and 69) scan the messages.
- Fonts: the reader's own system fonts (PingFang SC, Microsoft YaHei; headings Songti
  SC / Noto Serif SC), never downloaded; italics are switched off for Chinese
  (`globals.css`), so an accent is carried by colour alone.

## Voice

- Short, concrete, second person (你). Say what the reader gets, then how.
- Confident without overclaiming. **Never** 精准 / 100% / 最准 / 一定合身: the engine
  states a confidence because it is not certain, and the copy must not undo that.
- Use the shopper's own experience as the hook, not our features. Two that are
  true of Chinese shopping and answered by the product:
  - the folk rule **"卡在两个码之间就买大一码"** (zhihu, p/534880695) — we answer it
    by saying when a pick is close (stability, scoring spec §7): 卡在两个码之间时，
    我们直说，不让你赌。
  - Taobao's own **"和您身材相似的买家购买了 XL"** — we answer with the reader's own
    numbers and closet: 不是“和你身材相似的人买了什么”，而是你的尺寸……
- Chrome's own Chinese UI labels, exactly as Chrome prints them — **verified from
  Chrome's zh-CN resource pack** in Session 79, not from memory (memory said
  加载已解压的扩展程序; Chrome says **加载未打包的扩展程序**): 开发者模式,
  加载未打包的扩展程序, Chrome 应用商店.

## Classical phrasing — a budget

Allowed where it earns its place; at most **about three** on the whole site. Each
use is listed here so the budget is visible.

| Where | Phrase | Why it earns it |
|---|---|---|
| Homepage closing line | 衣不在多，合身则灵。 | a riff on 《陋室铭》's "山不在高，有仙则名" — the product's whole thesis in eight characters |

Candidates not yet used: 量体裁衣 (the service we automate), 削足适履 (the problem:
making yourself fit the size).
