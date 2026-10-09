# Chinese copy (简体中文) — how it is written

The Chinese version is **written, not translated**. A Chinese sentence may say a
thing differently from the English one — shorter, in a different order, with a
different image — but it must state **the same facts**, and it follows the same
evidence rule as everything else here: no claim the engine cannot back.

**Source of the wording (Session 80).** The founder's copy revision,
`docs/design/chinese-copy-2026-09-30.md`, is the authority for every Chinese
string it covers: all 1,122 message keys, the engine's reasons
(`lib/engineText.ts`), the badges (`lib/badgeText.ts`), the API's sentences
(`lib/apiText.ts`) and `/admin`. Session 79's first draft (身材档案, 注册账号,
把握 …) is superseded. Where the revision and a rule below disagreed, the change
made is listed at the end of this file. New Chinese strings follow the glossary
and voice below.

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
| passport (the user's profile) | 合身护照 | nav tab: 护照 |
| fit card (the passport's cover) | 合身卡 | Fit Card; was 国际合身身份 / International Sizing Identity until 2026-09-30 |
| fit identity | 合身身份 | what the passport holds; "身份归你" |
| closet | 衣橱 | "我的衣橱" for the user's own |
| check (a size) | 尺码 / 尺码查询 | nav tab: 尺码; the action is 查看推荐 |
| extension | 插件 | 浏览器插件 in full |
| outfit / look | 搭配 | footer link: 穿搭 (as the revision writes it) |
| to-buy list | 待购 | a product saved before buying; never an owned garment |
| claim account | 认领账户 | 账户 everywhere, never 账号 |
| account code | 账户代码 | |
| body measurements | 身形数据 | 精确身形数据 when the precision is the point |
| chest / waist / hip / shoulder / sleeve / length / inseam | 胸围 / 腰围 / 臀围 / 肩宽 / 袖长 / 衣长 / 内侧裤长 | |
| flat width (pit to pit) | 腋下平铺宽度 | a garment laid flat; ×2 is the garment's circumference, never the body's |
| garment measurements | 衣物尺寸 / 衣物平铺尺寸 | |
| ease / room | 余量 | 胸部余量 |
| slim / regular / relaxed / oversized | 修身 / 常规 / 宽松 / 超宽松 | the preference; 版型偏好 |
| too tight … too loose | 太紧 / 稍紧 / 刚好 / 稍松 / 太松 | the signed fit scale; 松紧感 |
| verdict: too small … too big | 过小 / 略紧 / 大小合适 / 宽松 / 过大 | per-size verdict on /check |
| keep / return / exchange | 留下 / 退回 / 换货 | |
| size chart | 尺码表 | a page's own tab is quoted: “尺码信息” |
| size guide | 尺码指南 | |
| confidence | 可信度 | "可信度 72%" |
| match score | 匹配分 | |
| accuracy (profile tier) | 准确度 | 基础 / 较高 / 高准确度 |
| badge library | 徽章馆 | the ladder page title: 徽章之路 |
| my 3D body | 我的 3D 身形 | the /body page (Session 98); "3D 身形" in running text |
| dress form / realistic body | 人台 / 写实 | the two bodies on /body; 写实人体 in full |
| fit colours (fit map) | 合身热力图 | the per-part colours of one size on the body |
| garment type / parent | 衣服类型 / 大类 | the two-level picker (Session 98); a type's place under a parent reads 外套 · 风衣 |

## Typography

- **A space between Chinese and Latin letters or digits**: 胸围 100 cm, T 恤,
  Fit Passport 会记住…. Checked by the test. **No space between two Chinese
  characters** — letter-spacing is CSS (`:lang(zh)` rules in `globals.css`).
- Full-width punctuation in Chinese sentences: ，。：；？！“”（）——……／
  Quotation: “” for a UI label, a page's own words or a button name
  (点击“查看推荐”); 「」 only where the revision uses it as a device (「穿」越时空).
- The ellipsis is six dots, ……, including in placeholders.
- **Display headlines are drawn without pause marks** (founder, 2026-09-30): at
  60–128 px a full-width ，or 。 reads as a hole and pushes a centred line off
  centre. Write the string with its punctuation as usual — `components/Headline.tsx`
  draws it where a headline is drawn (homepage section titles, page h1s):
  ，。、；：… are not drawn at a line's end and become a gap inside a line;
  **？ and ！ stay** (选多大 才合身？); **「」 stay**, set half-width (`halt`) so they
  open no hole — 「穿」越时空 (a bracket-less blue 穿 was tried and rejected). What is
  dropped stays in the page for screen readers. `headline.test.tsx` requires every
  translated serif headline to go through it. Card titles and body text keep all
  their punctuation.
- **No emoji, no arrow glyphs** — the same guard tests as the English (invariants
  67 and 69) scan the messages and the lib text files.
- Fonts: the reader's own system fonts (PingFang SC, Microsoft YaHei; headings Songti
  SC / Noto Serif SC), never downloaded; italics are switched off for Chinese
  (`globals.css`), so an accent is carried by colour alone.

## Voice

- Short, concrete, second person (你). Say what the reader gets, then how.
- Restrained and natural. Avoid the mechanical "不是……而是……" contrast, marketing
  words, and 码 standing alone in a question or button (尺码 in full).
- Confident without overclaiming. **Never** 精准 / 100% / 最准 / 一定合身: the engine
  states a confidence because it is not certain, and the copy must not undo that.
- Chrome's own Chinese UI labels, exactly as Chrome prints them — read from Chrome
  155's `Locales/zh-CN.pak`, not from memory: 开发者模式, **加载未打包的扩展程序**,
  Chrome 应用商店. (Older Chrome, and the revision, say 加载已解压的扩展程序.)

## Where the revision was adjusted on the way in (Session 80)

Each is a rule above winning over the revision's text, not a new wording:

| Key | Change | Rule |
|---|---|---|
| `home.hero/how/parallax/community/closing.title` | the `<br/>` and `<accent>` the English carries, at the revision's own line breaks and accent choices | tags must match (`i18n.test.ts`) |
| `extension.install.*`, `using1/2`, `readsBody` | `<b>`, `<code>`, `<link>` put back around the same words | tags must match |
| `extension.install.load` | 加载未打包的扩展程序 | Chrome's exact label |
| `ask.kind.RECOMMEND.example` | T恤 → T 恤 | spacing; the revision's own 04.9 spelling |
| `check.placeholder`, `closet.pastePlaceholder`, `closet.colorPlaceholder` | … → …… | ellipsis |
| `closet.extractRead` | 读取{bits} → 读取：{bits} | spacing: {bits} is usually a Latin brand ("UNIQLO · T 恤"), and a colon keeps the rule for either (Session 80c) |
| `closet.listSeparator` | kept 、 | the revision's reference quotes "—" (the line dropdown's dash), but the key's English is ", " — a list joiner; lists join with 、 |

Checked on the way in: every one of the revision's code references was compared
with the key's English at `eb42fc6`. All 22 differences but the separator above
were letter case (labels the page prints in capitals), end punctuation or a `<br/>`.
